# bahnOS — Operational Graph Query Engine Architecture

## Context

bahnOS currently stores relationships in `entity_links` (PostgreSQL) with flat single-hop lookups. The tree structure lives in JSONB (`projects.state`), and `extraEdges` within that JSONB encode in-map dependencies. These two systems are disconnected — entity_links knows about cross-entity CRM links, while extraEdges knows about node-to-node dependency/blocker edges but never touches the DB as structured graph data.

This architecture unifies both into a queryable graph layer without replacing PostgreSQL, without rewriting JSONB state storage, and without breaking existing APIs.

---

## 1. Graph Query Architecture

### Dual-Layer Graph Model

```
┌─────────────────────────────────────────────────────┐
│                 APPLICATION LAYER                     │
│  treeReducer (nodes, childIds, extraEdges, groups)  │
│  Handles: UI state, layout, undo/redo               │
└─────────────────────┬───────────────────────────────┘
                      │ sync on mutation
┌─────────────────────▼───────────────────────────────┐
│              GRAPH QUERY LAYER (NEW)                  │
│  entity_links + edge_cache (materialized)            │
│  Handles: traversal, aggregation, overlays           │
└─────────────────────┬───────────────────────────────┘
                      │ recursive CTE queries
┌─────────────────────▼───────────────────────────────┐
│              POSTGRESQL                              │
│  entity_links table (source of truth)                │
│  graph_cache table (precomputed closures)            │
│  projects.state JSONB (tree structure)               │
└─────────────────────────────────────────────────────┘
```

### Key Insight: Unify extraEdges into entity_links

Currently `extraEdges` (blockers, dependencies, arrows) live only in JSONB and are invisible to SQL. The graph engine requires these to be mirrored in `entity_links` so recursive queries can traverse them.

**Strategy**: On every `ADD_EDGE`, `DELETE_EDGE`, `SET_EDGE_TYPE` action, the collaboration server writes a corresponding `entity_links` row with `source_type='node'`, `target_type='node'`, and `relation` matching the edge type.

This means `entity_links` becomes the unified graph edge store:
- `node → node` edges (dependency, blocker, arrow) — synced from extraEdges
- `node → crm_deal` edges (linked_to) — existing behavior
- Future: `crm_deal → crm_deal`, `node → invoice`, etc.

---

## 2. Traversal Strategy

### Bounded Recursive Traversal

All traversals are bounded by:
- **Max depth** (default: 10, configurable per query)
- **Max nodes** (default: 500, prevents runaway on large graphs)
- **Relation filter** (traverse only specific edge types)
- **Direction** (forward, reverse, or bidirectional)

### Traversal Modes

| Mode | Direction | Use Case |
|------|-----------|----------|
| `downstream` | source → target | "What depends on this?" |
| `upstream` | target → source | "What does this depend on?" |
| `bidirectional` | both | "All connected entities" |
| `impact` | source → target (weighted) | "What's affected if this slips?" |
| `critical_path` | longest weighted path | "What's the bottleneck chain?" |

### Cycle Handling

PostgreSQL recursive CTEs can infinite-loop on cycles. Prevention:

```sql
WITH RECURSIVE graph AS (
  -- base case
  SELECT id, source_type, source_id, target_type, target_id, relation,
         1 AS depth,
         ARRAY[source_id] AS path  -- cycle detection
  FROM entity_links
  WHERE source_type = $1 AND source_id = $2
    AND relation = ANY($3)
    AND deleted_at IS NULL

  UNION ALL

  -- recursive case
  SELECT el.id, el.source_type, el.source_id, el.target_type, el.target_id, el.relation,
         g.depth + 1,
         g.path || el.source_id
  FROM entity_links el
  JOIN graph g ON el.source_id = g.target_id AND el.source_type = g.target_type
  WHERE el.deleted_at IS NULL
    AND el.source_id != ALL(g.path)  -- CYCLE PREVENTION
    AND g.depth < $4                  -- DEPTH BOUND
)
SELECT * FROM graph;
```

The `path` array accumulates visited node IDs. The `!= ALL(g.path)` clause prevents revisiting nodes. The depth bound provides a hard ceiling.

---

## 3. PostgreSQL Recursive Query Strategy

### Core Queries

#### 3.1 — Downstream Traversal (forward)

```sql
WITH RECURSIVE downstream AS (
  SELECT target_type, target_id, relation, metadata,
         1 AS depth, ARRAY[source_id::text] AS path
  FROM entity_links
  WHERE source_type = $1 AND source_id = $2
    AND ($3::text[] IS NULL OR relation = ANY($3))
    AND deleted_at IS NULL

  UNION ALL

  SELECT el.target_type, el.target_id, el.relation, el.metadata,
         d.depth + 1, d.path || el.source_id::text
  FROM entity_links el
  JOIN downstream d ON el.source_type = d.target_type AND el.source_id = d.target_id
  WHERE el.deleted_at IS NULL
    AND el.source_id::text != ALL(d.path)
    AND d.depth < $4
    AND ($3::text[] IS NULL OR el.relation = ANY($3))
)
SELECT DISTINCT target_type, target_id, relation, depth, path
FROM downstream
ORDER BY depth;
```

#### 3.2 — Upstream Traversal (reverse)

```sql
WITH RECURSIVE upstream AS (
  SELECT source_type, source_id, relation, metadata,
         1 AS depth, ARRAY[target_id::text] AS path
  FROM entity_links
  WHERE target_type = $1 AND target_id = $2
    AND ($3::text[] IS NULL OR relation = ANY($3))
    AND deleted_at IS NULL

  UNION ALL

  SELECT el.source_type, el.source_id, el.relation, el.metadata,
         u.depth + 1, u.path || el.target_id::text
  FROM entity_links el
  JOIN upstream u ON el.target_type = u.source_type AND el.target_id = u.source_id
  WHERE el.deleted_at IS NULL
    AND el.target_id::text != ALL(u.path)
    AND u.depth < $4
    AND ($3::text[] IS NULL OR el.relation = ANY($3))
)
SELECT DISTINCT source_type, source_id, relation, depth, path
FROM upstream
ORDER BY depth;
```

#### 3.3 — Subgraph Extraction (all reachable from a set)

```sql
WITH RECURSIVE subgraph AS (
  SELECT id, source_type, source_id, target_type, target_id, relation, metadata,
         1 AS depth
  FROM entity_links
  WHERE project_id = $1 AND deleted_at IS NULL
    AND (source_id = ANY($2) OR target_id = ANY($2))

  UNION ALL

  SELECT el.id, el.source_type, el.source_id, el.target_type, el.target_id, 
         el.relation, el.metadata, sg.depth + 1
  FROM entity_links el
  JOIN subgraph sg ON (el.source_id = sg.target_id OR el.target_id = sg.source_id)
  WHERE el.deleted_at IS NULL
    AND el.project_id = $1
    AND sg.depth < $3
)
SELECT DISTINCT ON (id) * FROM subgraph;
```

#### 3.4 — Aggregation with CRM Join (revenue impact)

```sql
WITH RECURSIVE impact AS (
  -- same recursive traversal as downstream
  SELECT target_id, target_type, depth, path
  FROM ... -- downstream CTE
)
SELECT 
  COUNT(*) AS affected_deals,
  COALESCE(SUM(cd.deal_value), 0) AS total_revenue_at_risk,
  ARRAY_AGG(DISTINCT cd.stage) AS affected_stages
FROM impact i
JOIN crm_deals cd ON cd.id = i.target_id::integer
WHERE i.target_type = 'crm_deal';
```

#### 3.5 — Critical Path (longest chain)

```sql
WITH RECURSIVE chains AS (
  SELECT source_id, target_id, 1 AS chain_length,
         ARRAY[source_id, target_id] AS chain
  FROM entity_links
  WHERE project_id = $1 AND relation = 'depends_on' AND deleted_at IS NULL

  UNION ALL

  SELECT c.source_id, el.target_id, c.chain_length + 1,
         c.chain || el.target_id
  FROM chains c
  JOIN entity_links el ON el.source_id = c.target_id
  WHERE el.project_id = $1 AND el.relation = 'depends_on' 
    AND el.deleted_at IS NULL
    AND el.target_id != ALL(c.chain)
    AND c.chain_length < 50
)
SELECT chain, chain_length
FROM chains
ORDER BY chain_length DESC
LIMIT 1;
```

---

## 4. Caching Strategy

### Three-Tier Cache

```
┌──────────────────────────────────────────┐
│ L1: Client In-Memory (useNodeLinks)       │
│ TTL: session lifetime, event-invalidated  │
│ Scope: active project linkMap             │
├──────────────────────────────────────────┤
│ L2: Server In-Memory (graphCache Map)     │
│ TTL: 60s, invalidated on entity_links     │
│      mutation within project              │
│ Scope: traversal results per query hash   │
├──────────────────────────────────────────┤
│ L3: Materialized Closure Table (Postgres) │
│ TTL: rebuilt on demand or via trigger     │
│ Scope: transitive closure per project     │
└──────────────────────────────────────────┘
```

### L2: Server-Side Query Cache

```javascript
// server/src/services/graphCache.js
const cache = new Map()  // key: hash(projectId + query params) → { result, expiry }

function getCacheKey(projectId, startNode, direction, relations, maxDepth) {
  return `${projectId}:${startNode}:${direction}:${relations.sort().join(',')}:${maxDepth}`
}

function invalidateProject(projectId) {
  for (const [key] of cache) {
    if (key.startsWith(projectId + ':')) cache.delete(key)
  }
}
```

Invalidation triggers:
- Any `INSERT/UPDATE/DELETE` on `entity_links` where `project_id = X`
- WebSocket `action` messages containing edge mutations (`ADD_EDGE`, `DELETE_EDGE`)
- CRM deal link/unlink events

### L3: Transitive Closure Table (Optional, for large projects)

```sql
CREATE TABLE IF NOT EXISTS graph_closure (
  project_id VARCHAR(36) NOT NULL,
  ancestor_type VARCHAR(50) NOT NULL,
  ancestor_id TEXT NOT NULL,
  descendant_type VARCHAR(50) NOT NULL,
  descendant_id TEXT NOT NULL,
  relation VARCHAR(50) NOT NULL,
  depth INTEGER NOT NULL,
  path TEXT[] NOT NULL,
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_closure_ancestor ON graph_closure(project_id, ancestor_type, ancestor_id);
CREATE INDEX idx_closure_descendant ON graph_closure(project_id, descendant_type, descendant_id);
```

**Rebuild strategy**: Lazy — only computed when a graph query is made AND the closure is stale (checked via `computed_at < last entity_links mutation for project`). For projects with <200 edges, skip closure table entirely and use live recursive CTEs.

---

## 5. API Design

### New Route: `/api/graph`

```
POST /api/graph/traverse
POST /api/graph/impact
POST /api/graph/overlay
GET  /api/graph/stats/:projectId
POST /api/graph/paths
POST /api/graph/aggregate
```

### 5.1 — Traverse

```http
POST /api/graph/traverse
Authorization: Bearer <token>
Content-Type: application/json

{
  "startNode": { "type": "node", "id": "uuid-123" },
  "direction": "downstream",          // downstream | upstream | bidirectional
  "relations": ["depends_on", "blocks"],  // null = all
  "maxDepth": 5,
  "maxNodes": 200,
  "includeMetadata": true,
  "projectId": "uuid-project"         // scope constraint
}
```

Response:
```json
{
  "nodes": [
    { "type": "node", "id": "uuid-456", "depth": 1, "relation": "depends_on", "metadata": {} },
    { "type": "crm_deal", "id": "7", "depth": 2, "relation": "linked_to", "metadata": {} }
  ],
  "edges": [
    { "from": "uuid-123", "to": "uuid-456", "relation": "depends_on" },
    { "from": "uuid-456", "to": "7", "relation": "linked_to" }
  ],
  "stats": { "totalNodes": 2, "maxDepthReached": 2, "truncated": false }
}
```

### 5.2 — Impact Analysis

```http
POST /api/graph/impact
{
  "startNode": { "type": "node", "id": "uuid-123" },
  "impactType": "slip",               // slip | block | remove
  "projectId": "uuid-project"
}
```

Response:
```json
{
  "affectedNodes": 12,
  "affectedDeals": 3,
  "revenueAtRisk": 145000.00,
  "blockedSprints": ["Sprint 4", "Sprint 5"],
  "criticalPath": ["uuid-123", "uuid-456", "uuid-789"],
  "affectedAssignees": ["alice@co.com", "bob@co.com"],
  "breakdown": {
    "directDependencies": 4,
    "transitiveDependencies": 8,
    "linkedDeals": [
      { "id": 7, "company": "Acme", "value": 50000, "stage": "proposal" }
    ]
  }
}
```

### 5.3 — Overlay Generation

```http
POST /api/graph/overlay
{
  "projectId": "uuid-project",
  "overlayType": "dependencies",       // dependencies | crm_links | risk | critical_path | workload
  "mapId": "uuid-map",                // scope to specific map (optional)
  "filters": {
    "relations": ["depends_on", "blocks"],
    "minDepth": 0,
    "maxDepth": 10
  }
}
```

Response:
```json
{
  "overlay": {
    "edges": [
      { "from": "uuid-1", "to": "uuid-2", "relation": "depends_on", "weight": 1.0, "style": "dashed" },
      { "from": "uuid-2", "to": "uuid-3", "relation": "blocks", "weight": 2.0, "style": "solid-red" }
    ],
    "highlights": [
      { "nodeId": "uuid-3", "reason": "critical_path", "severity": "high" }
    ],
    "clusters": [
      { "nodeIds": ["uuid-1", "uuid-2"], "label": "Risk Cluster A", "totalValue": 80000 }
    ]
  },
  "metadata": { "edgeCount": 2, "computeTimeMs": 45 }
}
```

### 5.4 — Graph Statistics

```http
GET /api/graph/stats/uuid-project
```

Response:
```json
{
  "totalEdges": 47,
  "edgesByRelation": { "depends_on": 23, "blocks": 8, "linked_to": 16 },
  "avgDegree": 2.3,
  "maxInDegree": { "nodeId": "uuid-hub", "count": 7 },
  "maxOutDegree": { "nodeId": "uuid-root", "count": 12 },
  "connectedComponents": 3,
  "longestPath": 6,
  "orphanNodes": 4,
  "cyclicEdges": 0
}
```

### 5.5 — Path Finding

```http
POST /api/graph/paths
{
  "from": { "type": "node", "id": "uuid-A" },
  "to": { "type": "node", "id": "uuid-B" },
  "projectId": "uuid-project",
  "maxPaths": 3,
  "maxDepth": 8
}
```

Response:
```json
{
  "paths": [
    { "nodes": ["uuid-A", "uuid-C", "uuid-B"], "length": 2, "relations": ["depends_on", "blocks"] },
    { "nodes": ["uuid-A", "uuid-D", "uuid-E", "uuid-B"], "length": 3, "relations": ["depends_on", "depends_on", "linked_to"] }
  ],
  "shortestPath": 2,
  "connected": true
}
```

### 5.6 — Aggregation

```http
POST /api/graph/aggregate
{
  "startNode": { "type": "node", "id": "uuid-subtree-root" },
  "direction": "downstream",
  "relations": ["depends_on", "linked_to"],
  "aggregations": [
    { "targetType": "crm_deal", "field": "deal_value", "op": "sum" },
    { "targetType": "crm_deal", "field": "stage", "op": "count_distinct" },
    { "targetType": "node", "field": "storyPoints", "op": "sum" }
  ],
  "projectId": "uuid-project"
}
```

Response:
```json
{
  "results": {
    "crm_deal.deal_value.sum": 320000,
    "crm_deal.stage.count_distinct": 4,
    "node.storyPoints.sum": 89
  },
  "traversedNodes": 34,
  "depth": 4
}
```

---

## 6. Relationship Indexing Strategy

### Current Indexes (retain)
```sql
idx_entity_links_source     (source_type, source_id) WHERE deleted_at IS NULL
idx_entity_links_target     (target_type, target_id) WHERE deleted_at IS NULL
idx_entity_links_project    (project_id) WHERE deleted_at IS NULL
idx_entity_links_unique     (source_type, source_id, target_type, target_id, relation) WHERE deleted_at IS NULL
```

### New Indexes Required

```sql
-- Traversal acceleration: join pattern in recursive CTE
CREATE INDEX idx_entity_links_traverse_fwd
  ON entity_links(source_type, source_id, target_type, target_id)
  WHERE deleted_at IS NULL;

-- Reverse traversal acceleration
CREATE INDEX idx_entity_links_traverse_rev
  ON entity_links(target_type, target_id, source_type, source_id)
  WHERE deleted_at IS NULL;

-- Relation-filtered traversal (most common query pattern)
CREATE INDEX idx_entity_links_relation_fwd
  ON entity_links(source_type, source_id, relation)
  WHERE deleted_at IS NULL;

-- Project-scoped relation queries
CREATE INDEX idx_entity_links_project_relation
  ON entity_links(project_id, relation)
  WHERE deleted_at IS NULL;

-- Temporal queries (recent edges, activity analysis)
CREATE INDEX idx_entity_links_project_created
  ON entity_links(project_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Metadata JSONB queries (for weighted edges, AI features)
CREATE INDEX idx_entity_links_metadata
  ON entity_links USING GIN(metadata)
  WHERE deleted_at IS NULL;
```

### Index Cost Analysis

| Index | Write overhead | Query benefit | Priority |
|-------|---------------|---------------|----------|
| traverse_fwd | Low (covers existing patterns) | Critical for recursive CTE | P0 |
| traverse_rev | Low | Critical for upstream queries | P0 |
| relation_fwd | Low | High for filtered traversal | P1 |
| project_relation | Low | Medium for overlay generation | P1 |
| project_created | Low | Medium for temporal analysis | P2 |
| metadata GIN | Medium (JSONB indexing) | High for AI features | P2 |

---

## 7. Overlay Generation Architecture

### Overlay Types

| Overlay | Data Source | Computation |
|---------|-------------|-------------|
| `dependencies` | entity_links WHERE relation IN ('depends_on','blocks') | Direct query + styling |
| `crm_links` | entity_links WHERE target_type='crm_deal' | Direct query + CRM join |
| `risk` | Recursive traversal + CRM value weighting | Traversal + aggregation |
| `critical_path` | Longest path in dependency DAG | Recursive CTE (longest chain) |
| `workload` | Node assignee + dependency fan-out | Aggregation by assignee |
| `revenue_heat` | Node → deal traversal + deal_value sum | Recursive + CRM join |

### Overlay Computation Pipeline

```
Request → Validate scope (project membership) 
       → Check L2 cache (hash of params)
       → MISS: Execute graph query
       → Transform to overlay format (edges + highlights + clusters)
       → Cache result (60s TTL)
       → Return
```

### Overlay Format (consumed by Canvas.jsx)

```javascript
{
  edges: [
    { from: nodeId, to: nodeId, relation, weight, color, dashArray, label }
  ],
  nodeHighlights: [
    { nodeId, borderColor, badge, tooltip }
  ],
  clusters: [
    { nodeIds: [], label, backgroundColor }
  ]
}
```

The Canvas component renders overlays as a separate SVG layer on top of the tree, toggled by the user. This keeps the base tree rendering unaffected.

---

## 8. Event Integration Architecture

### Edge Mutation Events (new)

Extend the existing `eventBus.js` events:

```javascript
EVENTS = {
  // existing
  CRM_DEAL_LINKED: 'crm:deal_linked',
  CRM_DEAL_UNLINKED: 'crm:deal_unlinked',
  NODE_LINKS_CHANGED: 'node:links_changed',
  NODE_DELETED: 'node:deleted',

  // new graph events
  GRAPH_EDGE_CREATED: 'graph:edge_created',
  GRAPH_EDGE_DELETED: 'graph:edge_deleted',
  GRAPH_EDGE_UPDATED: 'graph:edge_updated',
  GRAPH_CACHE_INVALIDATED: 'graph:cache_invalidated',
  GRAPH_OVERLAY_STALE: 'graph:overlay_stale',
}
```

### Edge Sync: extraEdges → entity_links

When the collaboration server receives an `action` message with type `ADD_EDGE`, `DELETE_EDGE`, or `SET_EDGE_TYPE`:

```javascript
// server/src/websocket/collaboration.js — inside action handler
if (['ADD_EDGE', 'DELETE_EDGE', 'SET_EDGE_TYPE'].includes(msg.action.type)) {
  await syncEdgeToEntityLinks(msg.action, userId, projectId)
  graphCache.invalidateProject(projectId)
}
```

```javascript
// server/src/services/graphSync.js
async function syncEdgeToEntityLinks(action, userId, projectId) {
  switch (action.type) {
    case 'ADD_EDGE': {
      const { from, to, edgeType, label } = action
      await query(`
        INSERT INTO entity_links (source_type, source_id, target_type, target_id, relation, user_id, project_id, metadata)
        VALUES ('node', $1, 'node', $2, $3, $4, $5, $6)
        ON CONFLICT (source_type, source_id, target_type, target_id, relation) WHERE deleted_at IS NULL
        DO UPDATE SET deleted_at = NULL, metadata = $6, updated_at = NOW()
      `, [from, to, edgeType || 'linked_to', userId, projectId, JSON.stringify({ label })])
      break
    }
    case 'DELETE_EDGE': {
      await query(`
        UPDATE entity_links SET deleted_at = NOW(), updated_at = NOW()
        WHERE source_type = 'node' AND source_id = $1 AND target_type = 'node' AND target_id = $2
          AND project_id = $3 AND deleted_at IS NULL
      `, [action.from, action.to, projectId])
      break
    }
    case 'SET_EDGE_TYPE': {
      // Soft-delete old, insert new relation type
      await query(`UPDATE entity_links SET deleted_at = NOW() WHERE ...`)
      await query(`INSERT INTO entity_links ... VALUES ...`)
      break
    }
  }
}
```

### Backfill Existing extraEdges

On server startup (or as a one-time migration), scan all projects and sync their JSONB `extraEdges` into `entity_links`:

```sql
-- Run once as migration
INSERT INTO entity_links (source_type, source_id, target_type, target_id, relation, user_id, project_id, metadata)
SELECT 'node', edge->>'from', 'node', edge->>'to', 
       COALESCE(edge->>'type', 'linked_to'),
       p.owner_id, p.id,
       jsonb_build_object('label', edge->>'label')
FROM projects p,
     jsonb_each(p.state->'maps') AS maps(map_id, map_data),
     jsonb_array_elements(map_data->'extraEdges') AS edge
WHERE p.state IS NOT NULL
ON CONFLICT DO NOTHING;
```

---

## 9. Real-Time Synchronization Strategy

### Graph-Aware WebSocket Messages

Add new server→client message types:

```jsonc
// When a graph computation completes that affects the user's view
{ "type": "graph_update", "projectId": "...", "overlay": "dependencies", "stale": true }

// Notify clients that overlay data needs refresh
{ "type": "overlay_invalidated", "projectId": "...", "overlayTypes": ["dependencies", "risk"] }
```

### Invalidation Flow

```
User A adds edge (ADD_EDGE action)
  → Server broadcasts action to room (existing)
  → Server syncs edge to entity_links (new)
  → Server invalidates L2 graph cache for project (new)
  → Server broadcasts { type: "overlay_invalidated" } to room (new)
  → All clients with active overlays re-fetch overlay data
```

### Client-Side Overlay Subscription

```javascript
// useGraphOverlay.js (new hook)
function useGraphOverlay(projectId, overlayType, enabled) {
  const [overlay, setOverlay] = useState(null)
  
  // Fetch overlay on mount + on invalidation
  useEffect(() => {
    if (!enabled || !projectId) return
    fetchOverlay()
  }, [projectId, overlayType, enabled])

  // Listen for invalidation via WebSocket
  useEffect(() => {
    const handler = (msg) => {
      if (msg.type === 'overlay_invalidated' && msg.overlayTypes.includes(overlayType)) {
        fetchOverlay()  // re-fetch stale overlay
      }
    }
    ws.addEventListener('message', handler)
    return () => ws.removeEventListener('message', handler)
  }, [overlayType])

  return { overlay, loading }
}
```

### Debouncing

Rapid edge mutations (e.g., bulk import) would fire many invalidations. Debounce server-side:

```javascript
const pendingInvalidations = new Map()  // projectId → timeout

function scheduleInvalidation(projectId) {
  if (pendingInvalidations.has(projectId)) return
  pendingInvalidations.set(projectId, setTimeout(() => {
    pendingInvalidations.delete(projectId)
    graphCache.invalidateProject(projectId)
    broadcastToRoom(projectId, { type: 'overlay_invalidated', overlayTypes: ['all'] })
  }, 500))  // 500ms debounce window
}
```

---

## 10. Performance Bottlenecks & Mitigations

### Bottleneck 1: Recursive CTE on Large Graphs

**Risk**: Projects with >1000 edges. Recursive CTEs scan the full `entity_links` table on each recursion level.

**Mitigation**:
- Partial indexes scoped to `project_id` eliminate cross-project scans
- Depth bound (default 10) limits recursion levels
- Node bound (default 500) terminates early via `LIMIT` in outer query
- For projects >500 edges: use L3 closure table (precomputed)

**Threshold heuristic**:
```javascript
const CLOSURE_THRESHOLD = 200  // edges in project

async function traverse(projectId, params) {
  const edgeCount = await getEdgeCount(projectId)
  if (edgeCount > CLOSURE_THRESHOLD && closureIsStale(projectId)) {
    await rebuildClosure(projectId)
  }
  return edgeCount > CLOSURE_THRESHOLD
    ? queryFromClosure(projectId, params)
    : queryRecursiveCTE(projectId, params)
}
```

### Bottleneck 2: JSONB ↔ entity_links Sync Lag

**Risk**: extraEdges in JSONB state update immediately (in-memory), but entity_links sync is async. Queries may return stale results during the sync window.

**Mitigation**:
- Sync is triggered synchronously within the WebSocket action handler (before broadcasting)
- If sync fails, the edge still exists in JSONB (source of truth for UI)
- Overlay queries note `"stale": true` if last sync failed

### Bottleneck 3: Overlay Computation for Active Rooms

**Risk**: 5 users in a room, all with "dependencies" overlay active. Each edge mutation triggers 5 overlay re-fetches.

**Mitigation**:
- Server computes overlay ONCE per invalidation, caches result (L2)
- All 5 clients hit the same cache entry
- Debounce window (500ms) collapses rapid mutations into one computation

### Bottleneck 4: CRM Joins in Aggregation Queries

**Risk**: `crm_deals` JOIN within recursive CTE is expensive.

**Mitigation**:
- Perform the recursive traversal first (returns target_ids)
- JOIN `crm_deals` in a separate query using the collected IDs
- Avoids join within recursion (PostgreSQL can't optimize this)

```sql
-- Step 1: traverse (fast, index-only)
WITH RECURSIVE ... SELECT target_id FROM downstream WHERE target_type = 'crm_deal'
-- Step 2: aggregate (separate query)
SELECT SUM(deal_value), COUNT(*) FROM crm_deals WHERE id = ANY($1::int[])
```

### Bottleneck 5: Full Project Edge Load on Canvas Mount

**Risk**: Current `useNodeLinks` fetches ALL links for a project on mount. With graph engine, projects may have 1000+ edges.

**Mitigation**:
- Keep existing flat fetch for badge rendering (node→deal links only)
- Graph queries are on-demand (user activates overlay or requests impact analysis)
- Overlays fetch only the edges relevant to the current map viewport

---

## 11. Migration Strategy Toward Future Graph DB

### Phase 0: Current (now)
- PostgreSQL only
- entity_links as flat table
- No traversal

### Phase 1: Graph Query Layer (this design)
- PostgreSQL with recursive CTEs
- Server-side graph service
- Overlay API
- Good for: <5000 edges per project, <50ms traversal queries

### Phase 2: Adjacency List Optimization (if needed)
- Add `graph_adjacency` materialized view
- Precompute in-degree/out-degree per node
- Add computed `transitive_closure` for hot projects
- Good for: <50,000 edges per project

### Phase 3: Graph Database (future, only if scale demands)

**When to migrate**:
- Traversal queries consistently >200ms
- Projects exceed 50,000 edges
- AI reasoning requires property graph pattern matching
- Need graph algorithms (PageRank, community detection, betweenness centrality)

**Migration path**:
- `entity_links` remains PostgreSQL source of truth
- Add async replication to Neo4j/Apache AGE (PostgreSQL graph extension)
- Graph queries route to graph engine
- CRUD writes remain on PostgreSQL (dual-write or CDC)
- Rollback: just stop reading from graph engine, fall back to recursive CTEs

**Apache AGE consideration** (PostgreSQL extension, no separate DB):
```sql
-- AGE runs graph queries inside PostgreSQL
SELECT * FROM cypher('bahnos_graph', $$
  MATCH (a:node {id: 'uuid-123'})-[:depends_on*1..5]->(b)
  RETURN b.id, b.type
$$) AS (id agtype, type agtype);
```
This avoids the operational complexity of a separate graph database while providing Cypher query syntax. It's the recommended Phase 3 step before considering Neo4j.

---

## 12. Example Traversal Queries (Business Scenarios)

### "Which deals are affected if Sprint 4 slips?"

```sql
-- Find all nodes in Sprint 4
WITH sprint_nodes AS (
  SELECT key AS node_id FROM jsonb_each(
    (SELECT state->'maps'->active_map_id->'nodes' FROM projects WHERE id = $1)
  ) WHERE value->>'sprint' = 'Sprint 4'
),
-- Traverse downstream from each sprint node
RECURSIVE downstream AS (
  SELECT target_id, target_type, 1 AS depth, ARRAY[el.source_id] AS path
  FROM entity_links el
  JOIN sprint_nodes sn ON el.source_id = sn.node_id
  WHERE el.source_type = 'node' AND el.deleted_at IS NULL
    AND el.relation IN ('depends_on', 'blocks', 'linked_to')
  
  UNION ALL
  
  SELECT el.target_id, el.target_type, d.depth + 1, d.path || el.source_id
  FROM entity_links el
  JOIN downstream d ON el.source_id = d.target_id AND el.source_type = d.target_type
  WHERE el.deleted_at IS NULL AND d.depth < 10
    AND el.source_id != ALL(d.path)
)
SELECT cd.company_name, cd.deal_value, cd.stage, d.depth
FROM downstream d
JOIN crm_deals cd ON cd.id = d.target_id::integer
WHERE d.target_type = 'crm_deal';
```

### "What blocks the Enterprise Platform release?"

```sql
WITH RECURSIVE blockers AS (
  SELECT source_id, source_type, relation, 1 AS depth, ARRAY[target_id] AS path
  FROM entity_links
  WHERE target_type = 'node' AND target_id = $1  -- Enterprise Platform node ID
    AND relation IN ('blocks', 'depends_on')
    AND deleted_at IS NULL
  
  UNION ALL
  
  SELECT el.source_id, el.source_type, el.relation, b.depth + 1, b.path || el.target_id
  FROM entity_links el
  JOIN blockers b ON el.target_id = b.source_id AND el.target_type = b.source_type
  WHERE el.deleted_at IS NULL AND b.depth < 8
    AND el.relation IN ('blocks', 'depends_on')
    AND el.target_id != ALL(b.path)
)
SELECT source_id, source_type, depth, relation FROM blockers ORDER BY depth;
```

### "Total revenue connected to the 'Authentication' subtree"

```sql
-- First: get all descendant node IDs from JSONB tree (BFS in app layer)
-- Or use entity_links if parent-child edges are synced
WITH RECURSIVE subtree_revenue AS (
  SELECT target_id, target_type, depth
  FROM downstream_traversal('node', $auth_node_id, ARRAY['linked_to', 'depends_on'], 10)
  WHERE target_type = 'crm_deal'
)
SELECT COALESCE(SUM(cd.deal_value), 0) AS total_revenue
FROM subtree_revenue sr
JOIN crm_deals cd ON cd.id = sr.target_id::integer
WHERE cd.stage NOT IN ('lost');
```

### "Which assignees are overloaded by dependency chains?"

```sql
WITH edges AS (
  SELECT source_id, target_id FROM entity_links
  WHERE project_id = $1 AND relation = 'depends_on' AND deleted_at IS NULL
    AND source_type = 'node' AND target_type = 'node'
),
node_data AS (
  SELECT key AS node_id, value->>'assignee' AS assignee, 
         (value->>'storyPoints')::int AS points
  FROM projects p, jsonb_each(p.state->'maps'->$2->'nodes')
  WHERE p.id = $1
),
-- Count how many upstream dependencies each assignee carries
dependency_load AS (
  SELECT nd.assignee, 
         COUNT(DISTINCT e.source_id) AS blocking_count,
         SUM(nd2.points) AS blocked_points
  FROM edges e
  JOIN node_data nd ON nd.node_id = e.target_id
  JOIN node_data nd2 ON nd2.node_id = e.source_id
  GROUP BY nd.assignee
)
SELECT assignee, blocking_count, blocked_points
FROM dependency_load
WHERE assignee IS NOT NULL
ORDER BY blocked_points DESC;
```

---

## 13. Failure Cases

### 13.1 — Cycle in entity_links

**Scenario**: User creates A→B→C→A dependency cycle (bypassing client-side validation).

**Impact**: Recursive CTE infinite loops.

**Prevention**:
- `path` array check in all CTEs (`source_id != ALL(path)`)
- Server-side validation on edge creation: run mini-traversal to check if target is already an ancestor of source
- Depth bound hard-stops recursion

**Detection query**:
```sql
WITH RECURSIVE cycle_check AS (
  SELECT source_id, target_id, ARRAY[source_id] AS path, false AS is_cycle
  FROM entity_links WHERE project_id = $1 AND deleted_at IS NULL
  
  UNION ALL
  
  SELECT el.source_id, el.target_id, cc.path || el.source_id,
         el.target_id = ANY(cc.path)
  FROM entity_links el
  JOIN cycle_check cc ON el.source_id = cc.target_id
  WHERE NOT cc.is_cycle AND array_length(cc.path, 1) < 20
    AND el.deleted_at IS NULL AND el.project_id = $1
)
SELECT DISTINCT path FROM cycle_check WHERE is_cycle;
```

### 13.2 — Orphaned entity_links After Node Deletion

**Scenario**: Node is deleted from JSONB state but entity_links rows pointing to/from it remain active.

**Impact**: Traversal returns non-existent nodes; overlay renders ghost edges.

**Prevention**:
- Existing: `useNodeLinks` calls `linksApi.removeBySource('node', nodeId)` on NODE_DELETED
- New: Graph query layer validates returned node IDs against project state (post-filter)
- New: Periodic cleanup job (weekly) that soft-deletes links where source_id or target_id no longer exists in project state

### 13.3 — JSONB/entity_links Divergence

**Scenario**: extraEdges in JSONB has edge A→B, but entity_links does not (sync failed).

**Impact**: Canvas shows edge, but graph queries don't traverse it.

**Prevention**:
- Sync is synchronous in WebSocket handler (fail = log, retry next action)
- Reconciliation endpoint: `POST /api/graph/reconcile/:projectId` — scans JSONB extraEdges, upserts missing rows
- Health check: `GET /api/graph/health/:projectId` — returns divergence count

### 13.4 — entity_links Query Timeout

**Scenario**: Project with 5000+ edges, recursive CTE exceeds statement_timeout.

**Impact**: API returns 500, overlay fails to render.

**Prevention**:
- Set `statement_timeout` per query: `SET LOCAL statement_timeout = '5000'` (5s)
- If timeout hit, return partial result with `"truncated": true`
- Suggest closure table rebuild for the project
- Client shows "Graph too large for live computation, building cache..." UX

### 13.5 — Concurrent Edge Mutations During Traversal

**Scenario**: User A adds edge while User B's traversal is mid-flight.

**Impact**: Traversal may return inconsistent snapshot.

**Prevention**:
- Acceptable: traversals use `READ COMMITTED` isolation (PostgreSQL default)
- Each recursive level sees a consistent snapshot per-statement
- For critical operations (impact analysis before sprint commit), use `REPEATABLE READ`:
  ```sql
  BEGIN ISOLATION LEVEL REPEATABLE READ;
  -- traversal query
  COMMIT;
  ```

### 13.6 — Memory Exhaustion in Server-Side Cache

**Scenario**: 100 active projects each with cached overlay results.

**Impact**: Node.js heap grows unboundedly.

**Prevention**:
- LRU eviction: cap at 500 cache entries
- TTL: 60s hard expiry
- Entry size limit: skip caching results >1MB
- Monitor: expose `GET /api/graph/cache-stats` for ops

---

## 14. Concurrency Considerations

### Write-Write Conflicts

**Scenario**: Two users simultaneously create edges that form a cycle.

**Solution**: The unique partial index (`idx_entity_links_unique_active`) prevents duplicate edges. For cycle prevention, use `SELECT FOR UPDATE` on the target node's existing edges before inserting:

```sql
BEGIN;
-- Lock edges relevant to this traversal path
SELECT id FROM entity_links
WHERE source_type = 'node' AND source_id = $target
  AND relation = $relation AND deleted_at IS NULL
FOR UPDATE NOWAIT;

-- Check if this would create a cycle (mini upstream traversal from target)
-- If cycle detected, ROLLBACK
-- Otherwise, INSERT

COMMIT;
```

`NOWAIT` makes the second concurrent writer fail immediately rather than waiting, allowing the application to retry after a brief delay.

### Read-During-Write

**Scenario**: Overlay is being computed while edges are being mutated.

**Solution**: READ COMMITTED isolation is sufficient — each statement in the recursive CTE sees a consistent snapshot. The overlay might be slightly stale (missing the in-flight edge), but the next invalidation will trigger a refresh.

### Closure Table Rebuild Concurrency

**Scenario**: Closure table rebuild takes 2s. During that time, a new edge is added.

**Solution**: 
- Rebuild into a staging table (`graph_closure_staging`)
- Swap atomically: `ALTER TABLE graph_closure RENAME TO graph_closure_old; ALTER TABLE graph_closure_staging RENAME TO graph_closure;`
- Mark closure as stale if any edge mutation occurred during rebuild
- If stale, schedule another rebuild (debounced)

### WebSocket Action Ordering

**Scenario**: User A and User B both add edges in the same room. Actions arrive at server out of order.

**Solution**: 
- Edge creation is idempotent (ON CONFLICT DO NOTHING for same source+target+relation)
- The graph layer doesn't depend on ordering — it queries current state
- JSONB state is last-write-wins (existing collab behavior)

---

## 15. Security and Permission Implications

### Authorization Model

All graph queries are scoped by project. The permission check:

```javascript
// server/src/services/graphService.js
async function authorizeGraphQuery(userId, projectId) {
  const member = await query(`
    SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2
    UNION ALL
    SELECT 'admin' AS role FROM projects WHERE id = $1 AND owner_id = $2
  `, [projectId, userId])
  
  if (!member.rows.length) throw new ForbiddenError('Not a project member')
  return member.rows[0].role
}
```

### Role-Based Restrictions

| Operation | admin | edit | view |
|-----------|-------|------|------|
| Traverse (read) | Yes | Yes | Yes |
| Impact analysis (read) | Yes | Yes | Yes |
| Overlay generation (read) | Yes | Yes | Yes |
| Create edge via graph API | Yes | Yes | No |
| Delete edge via graph API | Yes | Yes | No |
| Reconcile | Yes | No | No |
| Graph stats | Yes | Yes | Yes |

### Cross-Project Traversal Prevention

**Critical**: A traversal starting in Project A must NEVER traverse into Project B's edges, even if they share entity IDs.

```sql
-- ALL recursive CTEs must include project_id constraint
WHERE el.project_id = $project_id AND el.deleted_at IS NULL
```

This is enforced at the query level, not application level.

### Sensitive Data in Traversal Results

**Risk**: A `view` role user traverses to a CRM deal and sees `deal_value`.

**Mitigation**: Graph API returns entity IDs and relationship metadata only. Clients must separately fetch full entity details through their respective APIs (CRM, projects), which have their own permission checks. The graph layer never returns `crm_deals.deal_value` directly — only that a link exists.

Exception: Aggregation queries (like `revenue at risk`) DO return computed values. These are gated behind `edit` or `admin` role.

### Rate Limiting

Recursive queries are expensive. Apply rate limits:

```javascript
const graphRateLimit = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 30,               // 30 graph queries per minute per user
  keyGenerator: (req) => req.user.id,
  message: { error: 'Graph query rate limit exceeded' }
})

router.use('/graph', authenticate, graphRateLimit)
```

### Audit Trail

All graph mutations (edge create/delete) are already tracked via `entity_links.created_at` and `updated_at/deleted_at`. For compliance:
- `user_id` on every edge records who created it
- Soft-delete preserves full history
- Future: add `entity_links_audit` table for field-level change tracking if needed

---

## Implementation Priority

### Phase 1 (Week 1-2): Foundation
1. Add new indexes to `entity_links`
2. Implement `graphSync.js` — sync extraEdges → entity_links on WebSocket actions
3. Run backfill migration for existing extraEdges
4. Implement `/api/graph/traverse` (downstream + upstream)
5. Implement server-side L2 cache with project-level invalidation

### Phase 2 (Week 3-4): Core Features
6. Implement `/api/graph/impact` with CRM join
7. Implement `/api/graph/overlay` (dependencies + crm_links)
8. Client-side `useGraphOverlay` hook
9. Canvas overlay rendering layer (SVG)
10. WebSocket invalidation broadcast

### Phase 3 (Week 5-6): Advanced
11. Implement `/api/graph/paths` (shortest path)
12. Implement `/api/graph/aggregate` (revenue, story points)
13. Implement `/api/graph/stats`
14. Critical path overlay
15. Risk/workload overlays

### Phase 4 (Week 7+): AI Readiness
16. Metadata enrichment (edge weights, confidence scores)
17. Graph summarization endpoint (for LLM context injection)
18. Reconciliation + health endpoints
19. Closure table for large projects
20. Evaluate Apache AGE for Cypher query support

---

## File Map (New & Modified)

### New Files
```
server/src/services/graphService.js      — Core traversal/aggregation logic
server/src/services/graphCache.js        — L2 in-memory cache
server/src/services/graphSync.js         — extraEdges ↔ entity_links sync
server/src/routes/graph.js               — /api/graph/* endpoints
client/src/hooks/useGraphOverlay.js      — Overlay subscription hook
client/src/lib/graphApi.js               — Graph API client
client/src/components/canvas/OverlayRenderer.jsx — SVG overlay layer
```

### Modified Files
```
server/src/db/index.js                   — New indexes, closure table DDL
server/index.js                          — Register /api/graph route
server/src/websocket/collaboration.js    — Edge sync trigger + invalidation broadcast
client/src/lib/eventBus.js               — New graph events
client/src/components/canvas/Canvas.jsx  — Overlay toggle + rendering
```
