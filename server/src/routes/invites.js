import { Router } from 'express'
import authenticate from '../middleware/authenticate.js'
import { getInviteByToken, acceptInvite, getInvitesForUser, declineInvite } from '../services/projectsService.js'

const router = Router()

// Get my pending invites — authenticated
router.get('/mine', authenticate, async (req, res, next) => {
  try {
    const invites = await getInvitesForUser(req.user.email)
    res.json(invites.map(i => ({
      id: i.id,
      token: i.token,
      projectId: i.project_id,
      projectName: i.project_name,
      role: i.role,
      invitedByEmail: i.invited_by_email,
      createdAt: i.created_at,
      expiresAt: i.expires_at,
    })))
  } catch (e) { next(e) }
})

// Get invite info — public, no auth needed
router.get('/:token', async (req, res, next) => {
  try {
    const invite = await getInviteByToken(req.params.token)
    if (!invite) return res.status(404).json({ error: 'Invite not found' })
    const expired = new Date(invite.expires_at) < new Date()
    res.json({
      projectId: invite.project_id,
      projectName: invite.project_name,
      role: invite.role,
      email: invite.email,
      invitedBy: invite.invited_by_email,
      expired,
      accepted: !!invite.accepted_at,
    })
  } catch (e) { next(e) }
})

// Accept invite — authenticated
router.post('/:token/accept', authenticate, async (req, res, next) => {
  try {
    const result = await acceptInvite(req.params.token, req.user.id)
    res.json(result)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// Decline invite — authenticated
router.delete('/:token/decline', authenticate, async (req, res, next) => {
  try {
    await declineInvite(req.params.token)
    res.json({ ok: true })
  } catch (e) { next(e) }
})

export default router

