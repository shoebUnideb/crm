import express from 'express'
import authenticate from '../middleware/authenticate.js'
import * as svc from '../services/docsService.js'

const router = express.Router()
router.use(authenticate)

const uid = req => req.user.userId || req.user.id

// ── Spaces ────────────────────────────────────────────────────────────────────

router.get('/spaces', async (req, res, next) => {
  try {
    const spaces = await svc.getSpacesForUser(uid(req))
    res.json(spaces)
  } catch (e) { next(e) }
})

router.post('/spaces', async (req, res, next) => {
  try {
    const { name, slug, icon, description } = req.body
    if (!name || !slug) return res.status(400).json({ error: 'name and slug are required' })
    const space = await svc.createSpace(name, slug, icon, description, uid(req))
    res.status(201).json(space)
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'A space with that slug already exists' })
    next(e)
  }
})

router.get('/spaces/:id', async (req, res, next) => {
  try {
    const space = await svc.getSpace(req.params.id, uid(req))
    if (!space || !space.role) return res.status(403).json({ error: 'Access denied' })
    res.json(space)
  } catch (e) { next(e) }
})

router.patch('/spaces/:id', async (req, res, next) => {
  try {
    const role = await svc.getSpaceMemberRole(req.params.id, uid(req))
    if (!role || role === 'view') return res.status(403).json({ error: 'Admin or edit access required' })
    const space = await svc.updateSpace(req.params.id, req.body)
    if (!space) return res.status(404).json({ error: 'Space not found' })
    res.json(space)
  } catch (e) { next(e) }
})

router.delete('/spaces/:id', async (req, res, next) => {
  try {
    const space = await svc.getSpace(req.params.id, uid(req))
    if (!space) return res.status(404).json({ error: 'Space not found' })
    if (space.owner_id !== uid(req)) return res.status(403).json({ error: 'Only the owner can delete a space' })
    await svc.deleteSpace(req.params.id)
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// ── Space Members ─────────────────────────────────────────────────────────────

router.get('/spaces/:id/members', async (req, res, next) => {
  try {
    const role = await svc.getSpaceMemberRole(req.params.id, uid(req))
    if (!role) return res.status(403).json({ error: 'Access denied' })
    const members = await svc.getSpaceMembers(req.params.id)
    res.json(members)
  } catch (e) { next(e) }
})

router.post('/spaces/:id/members', async (req, res, next) => {
  try {
    const role = await svc.getSpaceMemberRole(req.params.id, uid(req))
    if (role !== 'admin') return res.status(403).json({ error: 'Admin access required' })
    const { userId, userEmail, userRole } = req.body
    let targetUserId = userId
    if (!targetUserId && userEmail) {
      const { query } = await import('../db/index.js')
      const row = await query('SELECT id FROM users WHERE email = $1', [userEmail])
      if (!row.rows[0]) return res.status(404).json({ error: 'No user found with that email' })
      targetUserId = row.rows[0].id
    }
    if (!targetUserId) return res.status(400).json({ error: 'userId or userEmail required' })
    const resolvedRole = userRole || 'edit'
    if (!['admin', 'edit', 'view'].includes(resolvedRole)) return res.status(400).json({ error: 'Invalid role' })
    const member = await svc.addSpaceMember(req.params.id, targetUserId, resolvedRole, uid(req))
    res.status(201).json(member)
  } catch (e) { next(e) }
})

router.patch('/spaces/:id/members/:userId', async (req, res, next) => {
  try {
    const role = await svc.getSpaceMemberRole(req.params.id, uid(req))
    if (role !== 'admin') return res.status(403).json({ error: 'Admin access required' })
    const { role: newRole } = req.body
    if (!['admin', 'edit', 'view'].includes(newRole)) return res.status(400).json({ error: 'Invalid role' })
    const member = await svc.updateSpaceMemberRole(req.params.id, req.params.userId, newRole)
    if (!member) return res.status(404).json({ error: 'Member not found' })
    res.json(member)
  } catch (e) { next(e) }
})

router.delete('/spaces/:id/members/:userId', async (req, res, next) => {
  try {
    const requesterRole = await svc.getSpaceMemberRole(req.params.id, uid(req))
    if (requesterRole !== 'admin') return res.status(403).json({ error: 'Admin access required' })
    await svc.removeSpaceMember(req.params.id, req.params.userId)
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// ── Notifications (space invites) ─────────────────────────────────────────────

router.get('/notifications', async (req, res, next) => {
  try {
    const invites = await svc.getPendingInvitesForUser(uid(req))
    res.json(invites)
  } catch (e) { next(e) }
})

router.post('/spaces/:id/invite/accept', async (req, res, next) => {
  try {
    const member = await svc.acceptSpaceInvite(req.params.id, uid(req))
    if (!member) return res.status(404).json({ error: 'Invite not found' })
    res.json(member)
  } catch (e) { next(e) }
})

router.post('/spaces/:id/invite/reject', async (req, res, next) => {
  try {
    await svc.rejectSpaceInvite(req.params.id, uid(req))
    res.json({ ok: true })
  } catch (e) { next(e) }
})

router.delete('/spaces/:id/leave', async (req, res, next) => {
  try {
    await svc.leaveSpace(req.params.id, uid(req))
    res.json({ ok: true })
  } catch (e) {
    if (e.message?.includes('owner')) return res.status(400).json({ error: e.message })
    next(e)
  }
})

// ── Pages ─────────────────────────────────────────────────────────────────────

router.get('/spaces/:id/pages', async (req, res, next) => {
  try {
    const role = await svc.getSpaceMemberRole(req.params.id, uid(req))
    if (!role) return res.status(403).json({ error: 'Access denied' })
    const pages = await svc.getPageTree(req.params.id)
    res.json(pages)
  } catch (e) { next(e) }
})

router.post('/spaces/:id/pages', async (req, res, next) => {
  try {
    const role = await svc.getSpaceMemberRole(req.params.id, uid(req))
    if (!role || role === 'view') return res.status(403).json({ error: 'Edit access required' })
    const { title, parentId, content } = req.body
    const page = await svc.createPage(req.params.id, parentId, title, uid(req), content)
    res.status(201).json(page)
  } catch (e) { next(e) }
})

router.get('/pages/:id', async (req, res, next) => {
  try {
    const effectiveRole = await svc.getEffectiveRole(req.params.id, uid(req))
    if (!effectiveRole) return res.status(403).json({ error: 'Access denied' })
    const page = await svc.getPage(req.params.id)
    if (!page) return res.status(404).json({ error: 'Page not found' })
    res.json({ ...page, effectiveRole })
  } catch (e) { next(e) }
})

router.put('/pages/:id', async (req, res, next) => {
  try {
    const effectiveRole = await svc.getEffectiveRole(req.params.id, uid(req))
    if (!effectiveRole || effectiveRole === 'view') return res.status(403).json({ error: 'Edit access required' })
    const { title, content } = req.body
    const page = await svc.updatePage(req.params.id, title, content, uid(req))
    if (!page) return res.status(404).json({ error: 'Page not found' })
    res.json({ ...page, effectiveRole })
  } catch (e) { next(e) }
})

router.patch('/pages/:id', async (req, res, next) => {
  try {
    const effectiveRole = await svc.getEffectiveRole(req.params.id, uid(req))
    if (!effectiveRole || effectiveRole === 'view') return res.status(403).json({ error: 'Edit access required' })
    const { navTitle } = req.body
    const page = await svc.updateNavTitle(req.params.id, navTitle)
    if (!page) return res.status(404).json({ error: 'Page not found' })
    res.json({ ...page, effectiveRole })
  } catch (e) { next(e) }
})

router.patch('/pages/:id/move', async (req, res, next) => {
  try {
    const effectiveRole = await svc.getEffectiveRole(req.params.id, uid(req))
    if (!effectiveRole || effectiveRole === 'view') return res.status(403).json({ error: 'Edit access required' })
    const { parentId, position } = req.body
    const page = await svc.movePage(req.params.id, parentId, position)
    if (!page) return res.status(404).json({ error: 'Page not found' })
    res.json(page)
  } catch (e) { next(e) }
})

router.patch('/pages/:id/status', async (req, res, next) => {
  try {
    const effectiveRole = await svc.getEffectiveRole(req.params.id, uid(req))
    if (!effectiveRole || effectiveRole === 'view') return res.status(403).json({ error: 'Edit access required' })
    const { status } = req.body
    if (!['draft', 'published'].includes(status)) return res.status(400).json({ error: 'Invalid status' })
    const page = await svc.updatePageStatus(req.params.id, status)
    res.json(page)
  } catch (e) { next(e) }
})

router.delete('/pages/:id', async (req, res, next) => {
  try {
    const effectiveRole = await svc.getEffectiveRole(req.params.id, uid(req))
    if (!effectiveRole || effectiveRole === 'view') return res.status(403).json({ error: 'Edit access required' })
    await svc.softDeletePage(req.params.id)
    res.json({ ok: true })
  } catch (e) { next(e) }
})

router.post('/pages/:id/duplicate', async (req, res, next) => {
  try {
    const effectiveRole = await svc.getEffectiveRole(req.params.id, uid(req))
    if (!effectiveRole || effectiveRole === 'view') return res.status(403).json({ error: 'Edit access required' })
    const page = await svc.duplicatePage(req.params.id, uid(req))
    res.status(201).json(page)
  } catch (e) { next(e) }
})

// ── Page Versions ─────────────────────────────────────────────────────────────

router.get('/pages/:id/versions', async (req, res, next) => {
  try {
    const effectiveRole = await svc.getEffectiveRole(req.params.id, uid(req))
    if (!effectiveRole) return res.status(403).json({ error: 'Access denied' })
    const versions = await svc.getVersions(req.params.id)
    res.json(versions)
  } catch (e) { next(e) }
})

router.post('/pages/:id/versions/:versionId/restore', async (req, res, next) => {
  try {
    const effectiveRole = await svc.getEffectiveRole(req.params.id, uid(req))
    if (!effectiveRole || effectiveRole === 'view') return res.status(403).json({ error: 'Edit access required' })
    const page = await svc.restoreVersion(req.params.id, Number(req.params.versionId), uid(req))
    res.json(page)
  } catch (e) { next(e) }
})

// ── Page Restrictions ─────────────────────────────────────────────────────────

router.get('/pages/:id/restrictions', async (req, res, next) => {
  try {
    const effectiveRole = await svc.getEffectiveRole(req.params.id, uid(req))
    if (!effectiveRole) return res.status(403).json({ error: 'Access denied' })
    const restrictions = await svc.getRestrictions(req.params.id)
    res.json(restrictions)
  } catch (e) { next(e) }
})

router.post('/pages/:id/restrictions', async (req, res, next) => {
  try {
    const effectiveRole = await svc.getEffectiveRole(req.params.id, uid(req))
    if (effectiveRole !== 'admin') return res.status(403).json({ error: 'Admin access required to set restrictions' })
    const { userId, userEmail, role } = req.body
    if (!role) return res.status(400).json({ error: 'role required' })
    if (!['edit', 'view'].includes(role)) return res.status(400).json({ error: 'Restriction role must be edit or view' })

    let targetUserId = userId
    if (!targetUserId && userEmail) {
      const { query } = await import('../db/index.js')
      const row = await query(`SELECT id FROM users WHERE email = $1`, [userEmail])
      if (!row.rows[0]) return res.status(404).json({ error: 'No user found with that email' })
      targetUserId = row.rows[0].id
    }
    if (!targetUserId) return res.status(400).json({ error: 'userId or userEmail required' })

    const restriction = await svc.addRestriction(req.params.id, targetUserId, role, uid(req))
    res.status(201).json(restriction)
  } catch (e) { next(e) }
})

router.delete('/pages/:id/restrictions/:restrictionId', async (req, res, next) => {
  try {
    const effectiveRole = await svc.getEffectiveRole(req.params.id, uid(req))
    if (effectiveRole !== 'admin') return res.status(403).json({ error: 'Admin access required' })
    await svc.removeRestriction(req.params.restrictionId)
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// ── Comments ──────────────────────────────────────────────────────────────────

router.get('/pages/:id/comments', async (req, res, next) => {
  try {
    const effectiveRole = await svc.getEffectiveRole(req.params.id, uid(req))
    if (!effectiveRole) return res.status(403).json({ error: 'Access denied' })
    const comments = await svc.getComments(req.params.id)
    res.json(comments)
  } catch (e) { next(e) }
})

router.post('/pages/:id/comments', async (req, res, next) => {
  try {
    const effectiveRole = await svc.getEffectiveRole(req.params.id, uid(req))
    if (!effectiveRole || effectiveRole === 'view') return res.status(403).json({ error: 'Edit access required' })
    const { body } = req.body
    if (!body?.trim()) return res.status(400).json({ error: 'Comment body required' })
    const comment = await svc.addComment(req.params.id, uid(req), body)
    res.status(201).json(comment)
  } catch (e) { next(e) }
})

router.patch('/comments/:id', async (req, res, next) => {
  try {
    const { body } = req.body
    if (!body?.trim()) return res.status(400).json({ error: 'Comment body required' })
    const { query } = await import('../db/index.js')
    const row = await query('SELECT user_id FROM doc_comments WHERE id = $1', [req.params.id])
    if (!row.rows[0]) return res.status(404).json({ error: 'Comment not found' })
    if (row.rows[0].user_id !== uid(req)) return res.status(403).json({ error: 'You can only edit your own comments' })
    const comment = await svc.updateComment(req.params.id, body)
    res.json(comment)
  } catch (e) { next(e) }
})

router.delete('/comments/:id', async (req, res, next) => {
  try {
    const { query } = await import('../db/index.js')
    const row = await query('SELECT user_id, page_id FROM doc_comments WHERE id = $1', [req.params.id])
    if (!row.rows[0]) return res.status(404).json({ error: 'Comment not found' })
    if (row.rows[0].user_id !== uid(req)) {
      const pageRole = await svc.getEffectiveRole(row.rows[0].page_id, uid(req))
      if (pageRole !== 'admin') return res.status(403).json({ error: 'You can only delete your own comments' })
    }
    await svc.deleteComment(req.params.id)
    res.json({ ok: true })
  } catch (e) { next(e) }
})

router.patch('/comments/:id/resolve', async (req, res, next) => {
  try {
    const { resolved } = req.body
    const comment = await svc.resolveComment(req.params.id, !!resolved)
    if (!comment) return res.status(404).json({ error: 'Comment not found' })
    res.json(comment)
  } catch (e) { next(e) }
})

// ── Stars & Search ────────────────────────────────────────────────────────────

router.post('/pages/:id/star', async (req, res, next) => {
  try {
    const effectiveRole = await svc.getEffectiveRole(req.params.id, uid(req))
    if (!effectiveRole) return res.status(403).json({ error: 'Access denied' })
    const result = await svc.toggleStar(req.params.id, uid(req))
    res.json(result)
  } catch (e) { next(e) }
})

router.get('/starred', async (req, res, next) => {
  try {
    const pages = await svc.getStarredPages(uid(req))
    res.json(pages)
  } catch (e) { next(e) }
})

router.get('/search', async (req, res, next) => {
  try {
    const { q, spaceId } = req.query
    if (!q?.trim()) return res.json([])
    const pages = await svc.searchPages(uid(req), q.trim(), spaceId || null)
    res.json(pages)
  } catch (e) { next(e) }
})

// ── Entity linking (canvas nodes ↔ doc pages, CRM deals ↔ doc pages) ─────────

// GET /linked-pages?sourceType=node&sourceId=xxx  — list doc pages linked to a source entity
router.get('/linked-pages', async (req, res, next) => {
  try {
    const { sourceType, sourceId } = req.query
    if (!sourceType || !sourceId) return res.status(400).json({ error: 'sourceType and sourceId required' })
    const { query } = await import('../db/index.js')
    const r = await query(
      `SELECT el.id AS link_id, el.created_at AS linked_at,
              p.id, p.title, p.status, p.updated_at,
              s.id AS space_id, s.name AS space_name, s.icon AS space_icon, s.slug AS space_slug
       FROM entity_links el
       JOIN doc_pages p ON p.id = el.target_id::integer AND p.deleted_at IS NULL
       JOIN doc_spaces s ON s.id = p.space_id
       WHERE el.source_type = $1 AND el.source_id = $2
         AND el.target_type = 'doc_page' AND el.deleted_at IS NULL
       ORDER BY el.created_at DESC`,
      [sourceType, String(sourceId)]
    )
    res.json(r.rows)
  } catch (e) { next(e) }
})

// POST /linked-pages  — create a link from a source entity to a doc page
router.post('/linked-pages', async (req, res, next) => {
  try {
    const { sourceType, sourceId, pageId, projectId } = req.body
    if (!sourceType || !sourceId || !pageId) return res.status(400).json({ error: 'sourceType, sourceId, pageId required' })
    const effectiveRole = await svc.getEffectiveRole(pageId, uid(req))
    if (!effectiveRole) return res.status(403).json({ error: 'No access to that page' })
    const { query } = await import('../db/index.js')
    const r = await query(
      `INSERT INTO entity_links (source_type, source_id, target_type, target_id, relation, user_id, project_id)
       VALUES ($1, $2, 'doc_page', $3, 'linked_to', $4, $5)
       ON CONFLICT (source_type, source_id, target_type, target_id, relation) WHERE deleted_at IS NULL
       DO UPDATE SET deleted_at = NULL, updated_at = NOW()
       RETURNING id`,
      [sourceType, String(sourceId), pageId, uid(req), projectId || null]
    )
    // Return the enriched row
    const enriched = await query(
      `SELECT el.id AS link_id, el.created_at AS linked_at,
              p.id, p.title, p.status, p.updated_at,
              s.id AS space_id, s.name AS space_name, s.icon AS space_icon, s.slug AS space_slug
       FROM entity_links el
       JOIN doc_pages p ON p.id = el.target_id::integer AND p.deleted_at IS NULL
       JOIN doc_spaces s ON s.id = p.space_id
       WHERE el.id = $1`,
      [r.rows[0].id]
    )
    res.status(201).json(enriched.rows[0])
  } catch (e) { next(e) }
})

// DELETE /linked-pages/:linkId  — remove a doc page link
router.delete('/linked-pages/:linkId', async (req, res, next) => {
  try {
    const { query } = await import('../db/index.js')
    await query(
      `UPDATE entity_links SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND target_type = 'doc_page'`,
      [parseInt(req.params.linkId), uid(req)]
    )
    res.json({ ok: true })
  } catch (e) { next(e) }
})

export default router
