import { Router } from 'express'
import authenticate from '../middleware/authenticate.js'
import * as graphService from '../services/graphService.js'
import * as graphCache from '../services/graphCache.js'
import { backfillAllProjects } from '../services/graphSync.js'
import { query } from '../db/index.js'

const router = Router()
router.use(authenticate)

const uid = req => req.user.userId || req.user.id

async function assertProjectAccess(userId, projectId) {
  const result = await query(`
    SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2
    UNION ALL
    SELECT 'admin' AS role FROM projects WHERE id = $1 AND owner_id = $2
  `, [projectId, userId])
  if (!result.rows.length) {
    const err = new Error('Not a project member')
    err.status = 403
    throw err
  }
  return result.rows[0].role
}

// POST /api/graph/traverse
router.post('/traverse', async (req, res, next) => {
  try {
    const { startNode, direction, relations, maxDepth, maxNodes, projectId } = req.body
    if (!startNode || !projectId) return res.status(400).json({ error: 'startNode and projectId required' })
    await assertProjectAccess(uid(req), projectId)

    let result
    if (direction === 'upstream') {
      result = await graphService.traverseUpstream(projectId, startNode.type, startNode.id, relations, maxDepth, maxNodes)
    } else {
      result = await graphService.traverseDownstream(projectId, startNode.type, startNode.id, relations, maxDepth, maxNodes)
    }
    res.json(result)
  } catch (e) { next(e) }
})

// POST /api/graph/impact
router.post('/impact', async (req, res, next) => {
  try {
    const { startNode, projectId } = req.body
    if (!startNode || !projectId) return res.status(400).json({ error: 'startNode and projectId required' })
    await assertProjectAccess(uid(req), projectId)

    const result = await graphService.getImpact(projectId, startNode.type, startNode.id)
    res.json(result)
  } catch (e) { next(e) }
})

// POST /api/graph/overlay
router.post('/overlay', async (req, res, next) => {
  try {
    const { projectId, overlayType, filters } = req.body
    if (!projectId) return res.status(400).json({ error: 'projectId required' })
    await assertProjectAccess(uid(req), projectId)

    const result = await graphService.getOverlay(projectId, overlayType || 'dependencies', filters?.relations)
    res.json(result)
  } catch (e) { next(e) }
})

// GET /api/graph/stats/:projectId
router.get('/stats/:projectId', async (req, res, next) => {
  try {
    await assertProjectAccess(uid(req), req.params.projectId)
    const result = await graphService.getGraphStats(req.params.projectId)
    res.json(result)
  } catch (e) { next(e) }
})

// POST /api/graph/paths
router.post('/paths', async (req, res, next) => {
  try {
    const { from, to, projectId, maxPaths, maxDepth } = req.body
    if (!from || !to || !projectId) return res.status(400).json({ error: 'from, to, and projectId required' })
    await assertProjectAccess(uid(req), projectId)

    const result = await graphService.findPaths(projectId, from.type, from.id, to.type, to.id, maxDepth, maxPaths)
    res.json(result)
  } catch (e) { next(e) }
})

// POST /api/graph/backfill — admin-only, syncs all existing extraEdges into entity_links
router.post('/backfill', async (req, res, next) => {
  try {
    const userResult = await query(`SELECT is_admin FROM users WHERE id = $1`, [uid(req)])
    if (!userResult.rows[0]?.is_admin) return res.status(403).json({ error: 'Admin only' })
    const count = await backfillAllProjects()
    graphCache.invalidateProject('*')
    res.json({ backfilled: count })
  } catch (e) { next(e) }
})

// POST /api/graph/aggregate
router.post('/aggregate', async (req, res, next) => {
  try {
    const { startNode, direction, relations, aggregations, projectId } = req.body
    if (!startNode || !projectId || !aggregations?.length) {
      return res.status(400).json({ error: 'startNode, projectId, and aggregations required' })
    }
    await assertProjectAccess(uid(req), projectId)

    const result = await graphService.aggregate(projectId, startNode, direction, relations, aggregations)
    res.json(result)
  } catch (e) { next(e) }
})

// GET /api/graph/summarize/:projectId — text summary for LLM context injection
router.get('/summarize/:projectId', async (req, res, next) => {
  try {
    await assertProjectAccess(uid(req), req.params.projectId)
    const result = await graphService.summarizeGraph(req.params.projectId)
    res.json(result)
  } catch (e) { next(e) }
})

// POST /api/graph/reconcile/:projectId — sync JSONB extraEdges → entity_links
router.post('/reconcile/:projectId', async (req, res, next) => {
  try {
    const role = await assertProjectAccess(uid(req), req.params.projectId)
    if (role === 'view') return res.status(403).json({ error: 'Edit access required' })

    const project = await query(`SELECT state FROM projects WHERE id = $1`, [req.params.projectId])
    const state = project.rows[0]?.state
    if (!state) return res.status(404).json({ error: 'Project not found or empty' })

    const result = await graphService.reconcile(req.params.projectId, state)
    graphCache.invalidateProject(req.params.projectId)
    res.json(result)
  } catch (e) { next(e) }
})

// GET /api/graph/health/:projectId — divergence count between JSONB and entity_links
router.get('/health/:projectId', async (req, res, next) => {
  try {
    await assertProjectAccess(uid(req), req.params.projectId)

    const project = await query(`SELECT state FROM projects WHERE id = $1`, [req.params.projectId])
    const state = project.rows[0]?.state

    const result = await graphService.getHealth(req.params.projectId, state)
    res.json(result)
  } catch (e) { next(e) }
})

// PATCH /api/graph/edges/:linkId/metadata — enrich edge metadata (weights, confidence)
router.patch('/edges/:linkId/metadata', async (req, res, next) => {
  try {
    const { metadata } = req.body
    if (!metadata || typeof metadata !== 'object') {
      return res.status(400).json({ error: 'metadata object required' })
    }
    const result = await graphService.enrichEdgeMetadata(parseInt(req.params.linkId), metadata)
    if (!result) return res.status(404).json({ error: 'Edge not found' })
    res.json(result)
  } catch (e) { next(e) }
})

// GET /api/graph/cache-stats
router.get('/cache-stats', (req, res) => {
  res.json(graphCache.stats())
})

export default router
