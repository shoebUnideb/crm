import { Router } from 'express'
import authenticate from '../middleware/authenticate.js'
import {
  createProject, getProjectsForUser, getProject,
  updateProjectName, deleteProject, leaveProject, getMembers,
  inviteMember, removeMember, updateMemberRole, getMemberRole,
  updateProjectState, createInvite, getPendingInvites, revokeInvite,
} from '../services/projectsService.js'
import { sendInviteEmail } from '../services/emailService.js'
import { notifyUser, updateRoomState } from '../websocket/collabServer.js'
import { query } from '../db/index.js'

const router = Router()
router.use(authenticate)

// List all projects for the user
router.get('/', async (req, res, next) => {
  try {
    const rows = await getProjectsForUser(req.user.id)
    res.json(rows.map(r => ({
      id: r.id, name: r.name, ownerId: r.owner_id,
      createdAt: r.created_at, updatedAt: r.updated_at,
      role: r.role, state: r.state,
    })))
  } catch (e) { next(e) }
})

// Create a new collaborative project
router.post('/', async (req, res, next) => {
  try {
    const { id, name, state } = req.body
    if (!id || !name) return res.status(400).json({ error: 'id and name required' })
    const project = await createProject(id, name, req.user.id, state || {})
    res.status(201).json(project)
  } catch (e) { next(e) }
})

// Get a single project
router.get('/:projectId', async (req, res, next) => {
  try {
    const project = await getProject(req.params.projectId, req.user.id)
    if (!project) return res.status(404).json({ error: 'Project not found' })
    res.json({
      id: project.id, name: project.name, ownerId: project.owner_id,
      createdAt: project.created_at, updatedAt: project.updated_at,
      role: project.role, state: project.state,
    })
  } catch (e) { next(e) }
})

// Rename project
router.patch('/:projectId/name', async (req, res, next) => {
  try {
    await updateProjectName(req.params.projectId, req.body.name, req.user.id)
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// Save full project state (used for initial push)
router.put('/:projectId/state', async (req, res, next) => {
  try {
    const member = await getMemberRole(req.params.projectId, req.user.id)
    if (!member) return res.status(403).json({ error: 'Access denied' })
    if (member.role === 'view') return res.status(403).json({ error: 'View-only access' })
    await updateProjectState(req.params.projectId, req.body.state)
    // Keep in-memory room cache in sync so joining users see the latest state
    updateRoomState(req.params.projectId, req.body.state)
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// Delete project (last admin = hard delete, otherwise = self-removal)
router.delete('/:projectId', async (req, res, next) => {
  try {
    const result = await deleteProject(req.params.projectId, req.user.id)
    res.json(result)
  } catch (e) { next(e) }
})

// Leave project (any member can leave; last admin blocked if others remain)
router.post('/:projectId/leave', async (req, res, next) => {
  try {
    const result = await leaveProject(req.params.projectId, req.user.id)
    res.json(result)
  } catch (e) { next(e) }
})

// Get members
router.get('/:projectId/members', async (req, res, next) => {
  try {
    const member = await getMemberRole(req.params.projectId, req.user.id)
    if (!member) return res.status(403).json({ error: 'Access denied' })
    const members = await getMembers(req.params.projectId)
    res.json(members.map(m => ({ userId: m.user_id, email: m.email, role: m.role, scope: m.scope || 'project', joinedAt: m.joined_at })))
  } catch (e) { next(e) }
})

// Invite or update member
router.post('/:projectId/members', async (req, res, next) => {
  try {
    const requester = await getMemberRole(req.params.projectId, req.user.id)
    if (!requester || requester.role !== 'admin') return res.status(403).json({ error: 'Only admins can invite members' })
    const { email, role } = req.body
    if (!email || !['admin', 'edit', 'view'].includes(role)) {
      return res.status(400).json({ error: 'email and valid role required' })
    }
    const result = await inviteMember(req.params.projectId, email, role, req.user.id)
    res.json(result)
  } catch (e) { next(e) }
})

// Remove member (admin can kick anyone except the last admin)
router.delete('/:projectId/members/:userId', async (req, res, next) => {
  try {
    const result = await removeMember(req.params.projectId, parseInt(req.params.userId), req.user.id)
    notifyUser(result.kickedUserId, {
      type: 'kicked',
      projectId: req.params.projectId,
      kickedBy: req.user.email,
    })
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// Update member role
router.patch('/:projectId/members/:userId/role', async (req, res, next) => {
  try {
    const { role } = req.body
    if (!['admin', 'edit', 'view'].includes(role)) return res.status(400).json({ error: 'Invalid role' })
    await updateMemberRole(req.params.projectId, parseInt(req.params.userId), role, req.user.id)
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// Send email invite (creates pending invite, sends email, pushes in-app notification)
router.post('/:projectId/invites', async (req, res, next) => {
  try {
    const requester = await getMemberRole(req.params.projectId, req.user.id)
    if (!requester || requester.role !== 'admin') return res.status(403).json({ error: 'Only admins can invite members' })
    const { email, role, scope } = req.body
    if (!email || !['admin', 'edit', 'view'].includes(role)) {
      return res.status(400).json({ error: 'email and valid role required' })
    }
    const inviteScope = scope || 'project'
    const project = await getProject(req.params.projectId, req.user.id)
    const token = await createInvite(req.params.projectId, email, role, req.user.id, inviteScope)
    sendInviteEmail(email, req.user.email, project.name, role, token).catch(() => {})

    // Push real-time notification if invitee is online
    try {
      const inviteeRow = await query(`SELECT id FROM users WHERE LOWER(email) = LOWER($1)`, [email])
      if (inviteeRow.rows.length > 0) {
        notifyUser(inviteeRow.rows[0].id, {
          type: 'invite_received',
          token,
          projectId: req.params.projectId,
          projectName: project.name,
          role,
          invitedByEmail: req.user.email,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
      }
    } catch { /* non-critical */ }

    res.json({ ok: true })
  } catch (e) { next(e) }
})

// List pending invites
router.get('/:projectId/invites', async (req, res, next) => {
  try {
    const invites = await getPendingInvites(req.params.projectId, req.user.id)
    res.json(invites.map(i => ({ id: i.id, email: i.email, role: i.role, scope: i.scope || 'project', createdAt: i.created_at, expiresAt: i.expires_at })))
  } catch (e) { next(e) }
})

// Revoke pending invite
router.delete('/:projectId/invites/:inviteId', async (req, res, next) => {
  try {
    await revokeInvite(parseInt(req.params.inviteId), req.user.id, req.params.projectId)
    res.json({ ok: true })
  } catch (e) { next(e) }
})

export default router
