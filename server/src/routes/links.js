import { Router } from 'express'
import authenticate from '../middleware/authenticate.js'
import { query } from '../db/index.js'

const router = Router()
router.use(authenticate)

const uid = req => req.user.userId || req.user.id

// Create a link
router.post('/', async (req, res, next) => {
  try {
    const { source_type, source_id, source_key, target_type, target_id, relation, project_id, metadata } = req.body
    if (!source_type || !source_id || !target_type || !target_id) {
      return res.status(400).json({ error: 'source_type, source_id, target_type, target_id are required' })
    }
    const r = await query(
      `INSERT INTO entity_links (source_type, source_id, source_key, target_type, target_id, relation, user_id, project_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (source_type, source_id, target_type, target_id, relation) WHERE deleted_at IS NULL
       DO UPDATE SET deleted_at = NULL, updated_at = NOW()
       RETURNING *`,
      [source_type, source_id, source_key || null, target_type, target_id,
       relation || 'linked_to', uid(req), project_id || null, JSON.stringify(metadata || {})]
    )
    res.status(201).json(r.rows[0])
  } catch (e) { next(e) }
})

// Get links by source entity
router.get('/by-source/:sourceType/:sourceId', async (req, res, next) => {
  try {
    const { sourceType, sourceId } = req.params
    const r = await query(
      `SELECT * FROM entity_links
       WHERE source_type = $1 AND source_id = $2 AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [sourceType, sourceId]
    )
    res.json(r.rows)
  } catch (e) { next(e) }
})

// Get links by target entity
router.get('/by-target/:targetType/:targetId', async (req, res, next) => {
  try {
    const { targetType, targetId } = req.params
    const r = await query(
      `SELECT * FROM entity_links
       WHERE target_type = $1 AND target_id = $2 AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [targetType, targetId]
    )
    res.json(r.rows)
  } catch (e) { next(e) }
})

// Batch fetch all links for a project (used for canvas badge rendering)
router.get('/project/:projectId', async (req, res, next) => {
  try {
    const { projectId } = req.params
    const sourceType = req.query.source_type || null
    let sql = `SELECT * FROM entity_links WHERE project_id = $1 AND deleted_at IS NULL`
    const params = [projectId]
    if (sourceType) {
      sql += ` AND source_type = $2`
      params.push(sourceType)
    }
    sql += ` ORDER BY created_at DESC`
    const r = await query(sql, params)
    res.json(r.rows)
  } catch (e) { next(e) }
})

// Soft-delete a link
router.delete('/:id', async (req, res, next) => {
  try {
    await query(
      `UPDATE entity_links SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND user_id = $2`,
      [parseInt(req.params.id), uid(req)]
    )
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// Restore a soft-deleted link
router.patch('/:id/restore', async (req, res, next) => {
  try {
    await query(
      `UPDATE entity_links SET deleted_at = NULL, updated_at = NOW() WHERE id = $1 AND user_id = $2`,
      [parseInt(req.params.id), uid(req)]
    )
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// Soft-delete all links for a source entity (used on node deletion)
router.delete('/by-source/:sourceType/:sourceId', async (req, res, next) => {
  try {
    const { sourceType, sourceId } = req.params
    await query(
      `UPDATE entity_links SET deleted_at = NOW(), updated_at = NOW()
       WHERE source_type = $1 AND source_id = $2 AND user_id = $3 AND deleted_at IS NULL`,
      [sourceType, sourceId, uid(req)]
    )
    res.json({ ok: true })
  } catch (e) { next(e) }
})

export default router
