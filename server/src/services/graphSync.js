import { query } from '../db/index.js'
import { invalidateProject } from './graphCache.js'

export async function syncEdgeToEntityLinks(action, userId, projectId) {
  try {
    switch (action.type) {
      case 'ADD_EDGE': {
        const from = action.parentId || action.from || action.edge?.from
        const to = action.childId || action.to || action.edge?.to
        const edgeType = action.edgeType || action.edge?.type || 'dependency'
        const label = action.label || action.edge?.label || null
        if (!from || !to) return
        await query(`
          INSERT INTO entity_links (source_type, source_id, target_type, target_id, relation, user_id, project_id, metadata)
          VALUES ('node', $1, 'node', $2, $3, $4, $5, $6)
          ON CONFLICT (source_type, source_id, target_type, target_id, relation) WHERE deleted_at IS NULL
          DO UPDATE SET deleted_at = NULL, metadata = $6, updated_at = NOW()
        `, [from, to, edgeType, userId, projectId, JSON.stringify({ label })])
        break
      }
      case 'DELETE_EDGE': {
        const edgeId = action.edgeId || action.id
        const from = action.from || action.edge?.from
        const to = action.to || action.edge?.to
        if (from && to) {
          await query(`
            UPDATE entity_links SET deleted_at = NOW(), updated_at = NOW()
            WHERE source_type = 'node' AND source_id = $1
              AND target_type = 'node' AND target_id = $2
              AND project_id = $3 AND deleted_at IS NULL
          `, [from, to, projectId])
        } else if (edgeId) {
          await query(`
            UPDATE entity_links SET deleted_at = NOW(), updated_at = NOW()
            WHERE source_type = 'node' AND target_type = 'node'
              AND project_id = $1 AND deleted_at IS NULL
              AND metadata->>'edgeId' = $2
          `, [projectId, edgeId])
        }
        break
      }
      case 'SET_EDGE_TYPE': {
        const from = action.from || action.edge?.from
        const to = action.to || action.edge?.to
        const oldType = action.oldType
        const newType = action.newType || action.edgeType
        if (!from || !to || !newType) return
        if (oldType) {
          await query(`
            UPDATE entity_links SET deleted_at = NOW(), updated_at = NOW()
            WHERE source_type = 'node' AND source_id = $1
              AND target_type = 'node' AND target_id = $2
              AND relation = $3 AND project_id = $4 AND deleted_at IS NULL
          `, [from, to, oldType, projectId])
        }
        await query(`
          INSERT INTO entity_links (source_type, source_id, target_type, target_id, relation, user_id, project_id, metadata)
          VALUES ('node', $1, 'node', $2, $3, $4, $5, '{}')
          ON CONFLICT (source_type, source_id, target_type, target_id, relation) WHERE deleted_at IS NULL
          DO UPDATE SET deleted_at = NULL, updated_at = NOW()
        `, [from, to, newType, userId, projectId])
        break
      }
    }
    invalidateProject(projectId)
  } catch (err) {
    console.error('[graphSync] Failed to sync edge:', err.message)
  }
}

export async function backfillExtraEdges(projectId, state, ownerId) {
  if (!state?.maps) return
  let count = 0
  for (const [, map] of Object.entries(state.maps)) {
    if (!map.extraEdges?.length) continue
    for (const edge of map.extraEdges) {
      const from = edge.from
      const to = edge.to
      const relation = edge.type || 'dependency'
      const label = edge.label || null
      if (!from || !to) continue
      await query(`
        INSERT INTO entity_links (source_type, source_id, target_type, target_id, relation, user_id, project_id, metadata)
        VALUES ('node', $1, 'node', $2, $3, $4, $5, $6)
        ON CONFLICT (source_type, source_id, target_type, target_id, relation) WHERE deleted_at IS NULL
        DO NOTHING
      `, [from, to, relation, ownerId, projectId, JSON.stringify({ label, edgeId: edge.id })])
      count++
    }
  }
  return count
}

export async function backfillAllProjects() {
  const result = await query(`SELECT id, owner_id, state FROM projects WHERE state IS NOT NULL`)
  let total = 0
  for (const row of result.rows) {
    const state = typeof row.state === 'string' ? JSON.parse(row.state) : row.state
    const n = await backfillExtraEdges(row.id, state, row.owner_id)
    total += n
  }
  return total
}
