import { query } from '../db/index.js'
import * as graphCache from './graphCache.js'

export async function traverseDownstream(projectId, sourceType, sourceId, relations, maxDepth = 10, maxNodes = 500) {
  const cached = graphCache.get(projectId, `${sourceType}:${sourceId}`, 'downstream', relations, maxDepth)
  if (cached) return cached

  const relFilter = relations?.length ? `AND el.relation = ANY($3::text[])` : ''
  const params = [sourceType, sourceId, ...(relations?.length ? [relations] : []), maxDepth, projectId]
  const depthIdx = relations?.length ? 4 : 3
  const projIdx = relations?.length ? 5 : 4

  const sql = `
    WITH RECURSIVE downstream AS (
      SELECT el.id, el.target_type, el.target_id, el.relation, el.metadata,
             1 AS depth, ARRAY[el.source_id::text] AS path
      FROM entity_links el
      WHERE el.source_type = $1 AND el.source_id = $2
        ${relFilter}
        AND el.project_id = $${projIdx}
        AND el.deleted_at IS NULL

      UNION ALL

      SELECT el.id, el.target_type, el.target_id, el.relation, el.metadata,
             d.depth + 1, d.path || el.source_id::text
      FROM entity_links el
      JOIN downstream d ON el.source_type = d.target_type AND el.source_id = d.target_id
      WHERE el.deleted_at IS NULL
        AND el.project_id = $${projIdx}
        AND el.source_id::text != ALL(d.path)
        AND d.depth < $${depthIdx}
        ${relFilter}
    )
    SELECT DISTINCT ON (target_type, target_id) target_type, target_id, relation, metadata, depth, path
    FROM downstream
    ORDER BY target_type, target_id, depth
    LIMIT ${maxNodes}
  `

  const result = await query(sql, params)
  const traversal = {
    nodes: result.rows.map(r => ({
      type: r.target_type,
      id: r.target_id,
      relation: r.relation,
      depth: r.depth,
      metadata: r.metadata,
    })),
    truncated: result.rows.length >= maxNodes,
    maxDepthReached: result.rows.length > 0 ? Math.max(...result.rows.map(r => r.depth)) : 0,
  }

  graphCache.set(projectId, `${sourceType}:${sourceId}`, 'downstream', relations, maxDepth, traversal)
  return traversal
}

export async function traverseUpstream(projectId, targetType, targetId, relations, maxDepth = 10, maxNodes = 500) {
  const cached = graphCache.get(projectId, `${targetType}:${targetId}`, 'upstream', relations, maxDepth)
  if (cached) return cached

  const relFilter = relations?.length ? `AND el.relation = ANY($3::text[])` : ''
  const params = [targetType, targetId, ...(relations?.length ? [relations] : []), maxDepth, projectId]
  const depthIdx = relations?.length ? 4 : 3
  const projIdx = relations?.length ? 5 : 4

  const sql = `
    WITH RECURSIVE upstream AS (
      SELECT el.id, el.source_type, el.source_id, el.relation, el.metadata,
             1 AS depth, ARRAY[el.target_id::text] AS path
      FROM entity_links el
      WHERE el.target_type = $1 AND el.target_id = $2
        ${relFilter}
        AND el.project_id = $${projIdx}
        AND el.deleted_at IS NULL

      UNION ALL

      SELECT el.id, el.source_type, el.source_id, el.relation, el.metadata,
             u.depth + 1, u.path || el.target_id::text
      FROM entity_links el
      JOIN upstream u ON el.target_type = u.source_type AND el.target_id = u.source_id
      WHERE el.deleted_at IS NULL
        AND el.project_id = $${projIdx}
        AND el.target_id::text != ALL(u.path)
        AND u.depth < $${depthIdx}
        ${relFilter}
    )
    SELECT DISTINCT ON (source_type, source_id) source_type, source_id, relation, metadata, depth, path
    FROM upstream
    ORDER BY source_type, source_id, depth
    LIMIT ${maxNodes}
  `

  const result = await query(sql, params)
  const traversal = {
    nodes: result.rows.map(r => ({
      type: r.source_type,
      id: r.source_id,
      relation: r.relation,
      depth: r.depth,
      metadata: r.metadata,
    })),
    truncated: result.rows.length >= maxNodes,
    maxDepthReached: result.rows.length > 0 ? Math.max(...result.rows.map(r => r.depth)) : 0,
  }

  graphCache.set(projectId, `${targetType}:${targetId}`, 'upstream', relations, maxDepth, traversal)
  return traversal
}

export async function findPaths(projectId, fromType, fromId, toType, toId, maxDepth = 8, maxPaths = 3) {
  const sql = `
    WITH RECURSIVE paths AS (
      SELECT el.target_type, el.target_id, el.relation,
             ARRAY[el.source_id::text, el.target_id::text] AS node_path,
             ARRAY[el.relation::text] AS rel_path,
             1 AS depth
      FROM entity_links el
      WHERE el.source_type = $1 AND el.source_id = $2
        AND el.project_id = $5
        AND el.deleted_at IS NULL

      UNION ALL

      SELECT el.target_type, el.target_id, el.relation,
             p.node_path || el.target_id::text,
             p.rel_path || el.relation::text,
             p.depth + 1
      FROM entity_links el
      JOIN paths p ON el.source_type = p.target_type AND el.source_id = p.target_id
      WHERE el.deleted_at IS NULL
        AND el.project_id = $5
        AND el.target_id::text != ALL(p.node_path)
        AND p.depth < $6
    )
    SELECT node_path, rel_path, depth
    FROM paths
    WHERE target_type = $3 AND target_id = $4
    ORDER BY depth
    LIMIT $7
  `

  const result = await query(sql, [fromType, fromId, toType, toId, projectId, maxDepth, maxPaths])
  return {
    paths: result.rows.map(r => ({
      nodes: r.node_path,
      relations: r.rel_path,
      length: r.depth,
    })),
    connected: result.rows.length > 0,
    shortestPath: result.rows.length > 0 ? result.rows[0].depth : null,
  }
}

export async function getImpact(projectId, sourceType, sourceId) {
  const downstream = await traverseDownstream(projectId, sourceType, sourceId, ['depends_on', 'blocks', 'linked_to'], 10, 500)

  const dealIds = downstream.nodes
    .filter(n => n.type === 'crm_deal')
    .map(n => parseInt(n.id))

  let dealStats = { count: 0, totalValue: 0, deals: [] }
  if (dealIds.length > 0) {
    const dealResult = await query(`
      SELECT id, company_name, deal_value, stage
      FROM crm_deals
      WHERE id = ANY($1::int[]) AND user_id IN (
        SELECT user_id FROM project_members WHERE project_id = $2
      )
    `, [dealIds, projectId])
    dealStats = {
      count: dealResult.rows.length,
      totalValue: dealResult.rows.reduce((sum, d) => sum + parseFloat(d.deal_value || 0), 0),
      deals: dealResult.rows,
    }
  }

  const nodeIds = downstream.nodes.filter(n => n.type === 'node').map(n => n.id)

  return {
    affectedNodes: nodeIds.length,
    affectedDeals: dealStats.count,
    revenueAtRisk: dealStats.totalValue,
    linkedDeals: dealStats.deals,
    directDependencies: downstream.nodes.filter(n => n.depth === 1).length,
    transitiveDependencies: downstream.nodes.filter(n => n.depth > 1).length,
    maxDepthReached: downstream.maxDepthReached,
    truncated: downstream.truncated,
  }
}

export async function getCriticalPath(projectId) {
  const sql = `
    WITH RECURSIVE chains AS (
      SELECT source_id, target_id, 1 AS chain_length,
             ARRAY[source_id::text, target_id::text] AS chain
      FROM entity_links
      WHERE project_id = $1 AND relation = 'depends_on' AND deleted_at IS NULL
        AND source_type = 'node' AND target_type = 'node'

      UNION ALL

      SELECT c.chain[1], el.target_id, c.chain_length + 1,
             c.chain || el.target_id::text
      FROM chains c
      JOIN entity_links el ON el.source_type = 'node' AND el.source_id = c.target_id
      WHERE el.project_id = $1 AND el.relation = 'depends_on'
        AND el.deleted_at IS NULL AND el.target_type = 'node'
        AND el.target_id::text != ALL(c.chain)
        AND c.chain_length < 50
    )
    SELECT chain, chain_length
    FROM chains
    ORDER BY chain_length DESC
    LIMIT 1
  `

  const result = await query(sql, [projectId])
  if (result.rows.length === 0) return { chain: [], length: 0 }
  return { chain: result.rows[0].chain, length: result.rows[0].chain_length }
}

export async function getGraphStats(projectId) {
  const edgesResult = await query(`
    SELECT relation, COUNT(*) AS count
    FROM entity_links
    WHERE project_id = $1 AND deleted_at IS NULL
    GROUP BY relation
  `, [projectId])

  const totalEdges = edgesResult.rows.reduce((s, r) => s + parseInt(r.count), 0)
  const edgesByRelation = Object.fromEntries(edgesResult.rows.map(r => [r.relation, parseInt(r.count)]))

  const degreeResult = await query(`
    SELECT node_id, in_deg, out_deg FROM (
      SELECT source_id AS node_id, 0 AS in_deg, COUNT(*) AS out_deg
      FROM entity_links WHERE project_id = $1 AND deleted_at IS NULL AND source_type = 'node'
      GROUP BY source_id
      UNION ALL
      SELECT target_id AS node_id, COUNT(*) AS in_deg, 0 AS out_deg
      FROM entity_links WHERE project_id = $1 AND deleted_at IS NULL AND target_type = 'node'
      GROUP BY target_id
    ) sub
    ORDER BY (in_deg + out_deg) DESC
    LIMIT 5
  `, [projectId])

  const criticalPath = await getCriticalPath(projectId)

  return {
    totalEdges,
    edgesByRelation,
    topNodes: degreeResult.rows,
    longestPath: criticalPath.length,
    criticalPath: criticalPath.chain,
  }
}

export async function getOverlay(projectId, overlayType, relations) {
  let sql
  let params
  switch (overlayType) {
    case 'dependencies':
      sql = `
        SELECT source_id AS "from", target_id AS "to", relation, metadata
        FROM entity_links
        WHERE project_id = $1 AND deleted_at IS NULL
          AND source_type = 'node' AND target_type = 'node'
          AND ($2::text[] IS NULL OR relation = ANY($2::text[]))
        ORDER BY created_at
      `
      params = [projectId, relations || null]
      break
    case 'crm_links':
      sql = `
        SELECT el.source_id AS "from", el.target_id AS "to", el.relation, el.metadata,
               cd.company_name, cd.deal_value, cd.stage
        FROM entity_links el
        LEFT JOIN crm_deals cd ON cd.id = el.target_id::integer
        WHERE el.project_id = $1 AND el.deleted_at IS NULL
          AND el.source_type = 'node' AND el.target_type = 'crm_deal'
        ORDER BY el.created_at
      `
      params = [projectId]
      break
    case 'critical_path': {
      const cp = await getCriticalPath(projectId)
      if (!cp.chain || cp.chain.length < 2) return { edges: [], edgeCount: 0, nodeHighlights: [] }
      const edges = []
      for (let i = 0; i < cp.chain.length - 1; i++) {
        edges.push({ from: cp.chain[i], to: cp.chain[i + 1], relation: 'depends_on' })
      }
      const nodeHighlights = cp.chain.map((nodeId, idx) => ({
        nodeId,
        borderColor: '#F59E0B',
        badge: idx === 0 ? 'START' : idx === cp.chain.length - 1 ? 'END' : `${idx}`,
        tooltip: `Critical path step ${idx + 1}/${cp.chain.length}`,
      }))
      return { edges, edgeCount: edges.length, nodeHighlights, pathLength: cp.length }
    }
    case 'risk': {
      const riskResult = await query(`
        SELECT el.source_id AS node_id,
               COUNT(DISTINCT el.target_id) AS dep_count,
               COALESCE(SUM(cd.deal_value), 0) AS revenue_at_risk
        FROM entity_links el
        LEFT JOIN entity_links deal_link ON deal_link.source_type = 'node'
          AND deal_link.source_id = el.source_id
          AND deal_link.target_type = 'crm_deal'
          AND deal_link.deleted_at IS NULL
          AND deal_link.project_id = $1
        LEFT JOIN crm_deals cd ON cd.id = deal_link.target_id::integer
        WHERE el.project_id = $1 AND el.deleted_at IS NULL
          AND el.source_type = 'node' AND el.target_type = 'node'
        GROUP BY el.source_id
        ORDER BY dep_count DESC, revenue_at_risk DESC
        LIMIT 50
      `, [projectId])

      const nodeHighlights = riskResult.rows.map(r => {
        const risk = parseInt(r.dep_count) + (parseFloat(r.revenue_at_risk) > 0 ? 2 : 0)
        const color = risk >= 5 ? '#EF4444' : risk >= 3 ? '#F59E0B' : '#3B82F6'
        return {
          nodeId: r.node_id,
          borderColor: color,
          badge: `${r.dep_count}`,
          tooltip: `${r.dep_count} deps, $${(parseFloat(r.revenue_at_risk) / 1000).toFixed(0)}k at risk`,
        }
      })
      return { edges: [], edgeCount: 0, nodeHighlights }
    }
    case 'workload': {
      const workResult = await query(`
        SELECT el.source_id AS node_id, el.metadata->>'assignee' AS assignee,
               COUNT(*) AS fan_out
        FROM entity_links el
        WHERE el.project_id = $1 AND el.deleted_at IS NULL
          AND el.source_type = 'node'
        GROUP BY el.source_id, el.metadata->>'assignee'
        ORDER BY fan_out DESC
        LIMIT 100
      `, [projectId])

      const assigneeGroups = {}
      for (const row of workResult.rows) {
        const assignee = row.assignee || 'Unassigned'
        if (!assigneeGroups[assignee]) assigneeGroups[assignee] = []
        assigneeGroups[assignee].push(row.node_id)
      }

      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6']
      const clusters = Object.entries(assigneeGroups).map(([label, nodeIds], i) => ({
        label,
        nodeIds,
        backgroundColor: `${colors[i % colors.length]}15`,
      }))

      return { edges: [], edgeCount: 0, nodeHighlights: [], clusters }
    }
    default:
      sql = `
        SELECT source_id AS "from", target_id AS "to", relation, metadata
        FROM entity_links
        WHERE project_id = $1 AND deleted_at IS NULL
          AND ($2::text[] IS NULL OR relation = ANY($2::text[]))
        ORDER BY created_at
      `
      params = [projectId, relations || null]
  }

  const result = await query(sql, params)
  return {
    edges: result.rows,
    edgeCount: result.rows.length,
  }
}

export async function aggregate(projectId, startNode, direction, relations, aggregations) {
  const traverseFn = direction === 'upstream' ? traverseUpstream : traverseDownstream
  const traversal = await traverseFn(projectId, startNode.type, startNode.id, relations, 10, 1000)

  const results = {}

  for (const agg of aggregations) {
    const key = `${agg.targetType}.${agg.field}.${agg.op}`

    if (agg.targetType === 'crm_deal') {
      const dealNodeIds = traversal.nodes
        .filter(n => n.targetType === 'crm_deal')
        .map(n => n.targetId)

      if (dealNodeIds.length === 0) {
        results[key] = agg.op === 'count_distinct' ? 0 : 0
        continue
      }

      const placeholders = dealNodeIds.map((_, i) => `$${i + 1}`).join(',')
      const dealResult = await query(
        `SELECT ${agg.field} FROM crm_deals WHERE id IN (${placeholders})`,
        dealNodeIds.map(id => parseInt(id))
      )

      switch (agg.op) {
        case 'sum':
          results[key] = dealResult.rows.reduce((s, r) => s + (parseFloat(r[agg.field]) || 0), 0)
          break
        case 'count_distinct':
          results[key] = new Set(dealResult.rows.map(r => r[agg.field])).size
          break
        case 'avg':
          results[key] = dealResult.rows.length
            ? dealResult.rows.reduce((s, r) => s + (parseFloat(r[agg.field]) || 0), 0) / dealResult.rows.length
            : 0
          break
        case 'max':
          results[key] = Math.max(...dealResult.rows.map(r => parseFloat(r[agg.field]) || 0))
          break
        case 'min':
          results[key] = Math.min(...dealResult.rows.map(r => parseFloat(r[agg.field]) || 0))
          break
        default:
          results[key] = 0
      }
    } else if (agg.targetType === 'node') {
      const nodeMetadata = traversal.nodes
        .filter(n => n.targetType === 'node')
        .map(n => n.metadata || {})

      switch (agg.op) {
        case 'sum':
          results[key] = nodeMetadata.reduce((s, m) => s + (parseFloat(m[agg.field]) || 0), 0)
          break
        case 'count_distinct':
          results[key] = new Set(nodeMetadata.map(m => m[agg.field]).filter(Boolean)).size
          break
        case 'avg':
          results[key] = nodeMetadata.length
            ? nodeMetadata.reduce((s, m) => s + (parseFloat(m[agg.field]) || 0), 0) / nodeMetadata.length
            : 0
          break
        default:
          results[key] = 0
      }
    }
  }

  return {
    results,
    traversedNodes: traversal.nodes?.length || 0,
    depth: traversal.maxDepth || 0,
  }
}

export async function summarizeGraph(projectId) {
  const stats = await getGraphStats(projectId)

  const nodesResult = await query(`
    SELECT DISTINCT source_id AS node_id FROM entity_links
    WHERE project_id = $1 AND deleted_at IS NULL AND source_type = 'node'
    UNION
    SELECT DISTINCT target_id AS node_id FROM entity_links
    WHERE project_id = $1 AND deleted_at IS NULL AND target_type = 'node'
  `, [projectId])

  const edgesResult = await query(`
    SELECT source_id, target_id, relation, metadata
    FROM entity_links
    WHERE project_id = $1 AND deleted_at IS NULL
      AND source_type = 'node' AND target_type = 'node'
    ORDER BY created_at
    LIMIT 200
  `, [projectId])

  const crmResult = await query(`
    SELECT el.source_id AS node_id, cd.company_name, cd.deal_value, cd.stage
    FROM entity_links el
    JOIN crm_deals cd ON cd.id = el.target_id::integer
    WHERE el.project_id = $1 AND el.deleted_at IS NULL
      AND el.source_type = 'node' AND el.target_type = 'crm_deal'
    LIMIT 50
  `, [projectId])

  const lines = []
  lines.push(`Graph Summary for project ${projectId}:`)
  lines.push(`- ${nodesResult.rows.length} nodes in graph`)
  lines.push(`- ${stats.totalEdges} total edges`)
  if (Object.keys(stats.edgesByRelation).length) {
    lines.push(`- Edge types: ${Object.entries(stats.edgesByRelation).map(([k, v]) => `${k}(${v})`).join(', ')}`)
  }
  if (stats.longestPath > 0) {
    lines.push(`- Critical path length: ${stats.longestPath} hops [${stats.criticalPath.join(' → ')}]`)
  }
  if (stats.topNodes?.length) {
    lines.push(`- Most connected nodes: ${stats.topNodes.slice(0, 3).map(n => `${n.node_id}(in:${n.in_deg},out:${n.out_deg})`).join(', ')}`)
  }

  if (edgesResult.rows.length) {
    lines.push(`\nDependency edges:`)
    for (const e of edgesResult.rows.slice(0, 30)) {
      lines.push(`  ${e.source_id} -[${e.relation}]-> ${e.target_id}`)
    }
    if (edgesResult.rows.length > 30) lines.push(`  ... and ${edgesResult.rows.length - 30} more`)
  }

  if (crmResult.rows.length) {
    lines.push(`\nCRM links:`)
    for (const d of crmResult.rows) {
      lines.push(`  ${d.node_id} → ${d.company_name} ($${parseFloat(d.deal_value || 0).toLocaleString()}, ${d.stage})`)
    }
  }

  return {
    text: lines.join('\n'),
    nodeCount: nodesResult.rows.length,
    edgeCount: stats.totalEdges,
    crmDealCount: crmResult.rows.length,
    criticalPathLength: stats.longestPath,
  }
}

export async function reconcile(projectId, state) {
  if (!state?.maps) return { synced: 0, orphaned: 0 }

  let synced = 0
  const seenEdgeKeys = new Set()

  for (const [mapId, mapData] of Object.entries(state.maps)) {
    const extraEdges = mapData?.extraEdges || []
    for (const edge of extraEdges) {
      if (!edge.from || !edge.to) continue
      const relation = edge.type || 'linked_to'
      const key = `${edge.from}:${edge.to}:${relation}`
      if (seenEdgeKeys.has(key)) continue
      seenEdgeKeys.add(key)

      const result = await query(`
        INSERT INTO entity_links (source_type, source_id, target_type, target_id, relation, user_id, project_id, metadata)
        SELECT 'node', $1, 'node', $2, $3, p.owner_id, $4, $5::jsonb
        FROM projects p WHERE p.id = $4
        ON CONFLICT (source_type, source_id, target_type, target_id, relation) WHERE deleted_at IS NULL
        DO UPDATE SET updated_at = NOW()
        RETURNING id
      `, [edge.from, edge.to, relation, projectId, JSON.stringify({ label: edge.label || null })])
      if (result.rows.length) synced++
    }
  }

  const orphanResult = await query(`
    UPDATE entity_links SET deleted_at = NOW()
    WHERE project_id = $1 AND deleted_at IS NULL
      AND source_type = 'node' AND target_type = 'node'
      AND CONCAT(source_id, ':', target_id, ':', relation) NOT IN (
        SELECT unnest($2::text[])
      )
    RETURNING id
  `, [projectId, [...seenEdgeKeys]])

  return { synced, orphaned: orphanResult.rows.length }
}

export async function getHealth(projectId, state) {
  const entityResult = await query(`
    SELECT COUNT(*) AS edge_count FROM entity_links
    WHERE project_id = $1 AND deleted_at IS NULL
      AND source_type = 'node' AND target_type = 'node'
  `, [projectId])

  let jsonbEdgeCount = 0
  if (state?.maps) {
    for (const mapData of Object.values(state.maps)) {
      jsonbEdgeCount += (mapData?.extraEdges || []).length
    }
  }

  const entityCount = parseInt(entityResult.rows[0].edge_count)
  const divergence = Math.abs(entityCount - jsonbEdgeCount)

  const orphanResult = await query(`
    SELECT COUNT(*) AS count FROM entity_links
    WHERE project_id = $1 AND deleted_at IS NULL
      AND source_type = 'node' AND target_type = 'node'
      AND created_at < NOW() - INTERVAL '1 hour'
      AND updated_at < NOW() - INTERVAL '1 hour'
  `, [projectId])

  const staleEdges = parseInt(orphanResult.rows[0].count)

  return {
    entityLinksCount: entityCount,
    jsonbEdgeCount,
    divergence,
    staleEdges,
    healthy: divergence === 0,
    lastChecked: new Date().toISOString(),
  }
}

export async function enrichEdgeMetadata(linkId, metadata) {
  const result = await query(`
    UPDATE entity_links
    SET metadata = metadata || $2::jsonb, updated_at = NOW()
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING id, metadata
  `, [linkId, JSON.stringify(metadata)])
  return result.rows[0] || null
}
