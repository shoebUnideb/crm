import { query } from '../db/index.js'
import crypto from 'crypto'

export async function createProject(id, name, ownerId, state) {
  const now = new Date().toISOString()
  await query(
    `INSERT INTO projects (id, name, owner_id, state, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $5)
     ON CONFLICT (id) DO NOTHING`,
    [id, name, ownerId, JSON.stringify(state), now]
  )
  await query(
    `INSERT INTO project_members (project_id, user_id, role, invited_by)
     VALUES ($1, $2, 'admin', $2)
     ON CONFLICT (project_id, user_id) DO NOTHING`,
    [id, ownerId]
  )
  return { id, name, ownerId, state, createdAt: now, updatedAt: now }
}

export async function getProjectsForUser(userId) {
  const result = await query(
    `SELECT p.id, p.name, p.owner_id, p.state, p.created_at, p.updated_at,
            pm.role
     FROM projects p
     JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
     ORDER BY p.created_at ASC`,
    [userId]
  )
  return result.rows
}

export async function getProject(projectId, userId) {
  const result = await query(
    `SELECT p.id, p.name, p.owner_id, p.state, p.created_at, p.updated_at,
            pm.role
     FROM projects p
     JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
     WHERE p.id = $2`,
    [userId, projectId]
  )
  return result.rows[0] || null
}

export async function updateProjectState(projectId, state) {
  await query(
    `UPDATE projects SET state = $1, updated_at = NOW() WHERE id = $2`,
    [JSON.stringify(state), projectId]
  )
}

export async function updateProjectName(projectId, name, userId) {
  const member = await getMemberRole(projectId, userId)
  if (!member || member.role !== 'admin') throw new Error('Only admins can rename projects')
  await query(`UPDATE projects SET name = $1, updated_at = NOW() WHERE id = $2`, [name, projectId])
}

export async function deleteProject(projectId, userId) {
  const member = await getMemberRole(projectId, userId)
  if (!member || member.role !== 'admin') throw new Error('Only admins can delete projects')
  await query(`DELETE FROM projects WHERE id = $1`, [projectId])
}

export async function getMembers(projectId) {
  const result = await query(
    `SELECT pm.user_id, pm.role, pm.joined_at, u.email
     FROM project_members pm
     JOIN users u ON u.id = pm.user_id
     WHERE pm.project_id = $1
     ORDER BY pm.joined_at ASC`,
    [projectId]
  )
  return result.rows
}

export async function getMemberRole(projectId, userId) {
  const result = await query(
    `SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2`,
    [projectId, userId]
  )
  return result.rows[0] || null
}

export async function inviteMember(projectId, email, role, invitedBy) {
  const userResult = await query(`SELECT id FROM users WHERE email = $1`, [email])
  if (userResult.rows.length === 0) throw new Error(`No user found with email: ${email}`)
  const userId = userResult.rows[0].id

  const existing = await getMemberRole(projectId, userId)
  if (existing) {
    await query(
      `UPDATE project_members SET role = $1 WHERE project_id = $2 AND user_id = $3`,
      [role, projectId, userId]
    )
  } else {
    await query(
      `INSERT INTO project_members (project_id, user_id, role, invited_by)
       VALUES ($1, $2, $3, $4)`,
      [projectId, userId, role, invitedBy]
    )
  }
  return { userId, email, role }
}

export async function removeMember(projectId, userId, requesterId) {
  const requester = await getMemberRole(projectId, requesterId)
  if (!requester || requester.role !== 'admin') throw new Error('Only admins can remove members')
  const target = await getMemberRole(projectId, userId)
  if (!target) throw new Error('Member not found')
  if (target.role === 'admin') {
    // Check there's at least one other admin
    const adminCount = await query(
      `SELECT COUNT(*) FROM project_members WHERE project_id = $1 AND role = 'admin'`,
      [projectId]
    )
    if (parseInt(adminCount.rows[0].count) <= 1) throw new Error('Cannot remove the last admin')
  }
  await query(
    `DELETE FROM project_members WHERE project_id = $1 AND user_id = $2`,
    [projectId, userId]
  )
}

export async function updateMemberRole(projectId, userId, role, requesterId) {
  const requester = await getMemberRole(projectId, requesterId)
  if (!requester || requester.role !== 'admin') throw new Error('Only admins can change roles')
  await query(
    `UPDATE project_members SET role = $1 WHERE project_id = $2 AND user_id = $3`,
    [role, projectId, userId]
  )
}

// ── Invites ────────────────────────────────────────────────────────────────────

export async function createInvite(projectId, email, role, invitedBy) {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
  await query(
    `INSERT INTO project_invites (project_id, email, role, token, invited_by, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [projectId, email.toLowerCase(), role, token, invitedBy, expiresAt]
  )
  return token
}

export async function getInviteByToken(token) {
  const result = await query(
    `SELECT pi.id, pi.project_id, pi.email, pi.role, pi.expires_at, pi.accepted_at,
            p.name AS project_name,
            u.email AS invited_by_email
     FROM project_invites pi
     JOIN projects p ON p.id = pi.project_id
     LEFT JOIN users u ON u.id = pi.invited_by
     WHERE pi.token = $1`,
    [token]
  )
  return result.rows[0] || null
}

export async function acceptInvite(token, userId) {
  const invite = await getInviteByToken(token)
  if (!invite) throw new Error('Invalid invite link')
  if (invite.accepted_at) throw new Error('This invite has already been used')
  if (new Date(invite.expires_at) < new Date()) throw new Error('This invite link has expired')

  const existing = await getMemberRole(invite.project_id, userId)
  if (existing) {
    await query(
      `UPDATE project_members SET role = $1 WHERE project_id = $2 AND user_id = $3`,
      [invite.role, invite.project_id, userId]
    )
  } else {
    await query(
      `INSERT INTO project_members (project_id, user_id, role, invited_by)
       VALUES ($1, $2, $3, $4)`,
      [invite.project_id, userId, invite.role, invite.invited_by]
    )
  }

  await query(
    `UPDATE project_invites SET accepted_at = NOW() WHERE token = $1`,
    [token]
  )
  return { projectId: invite.project_id, role: invite.role }
}

export async function getPendingInvites(projectId, requesterId) {
  const member = await getMemberRole(projectId, requesterId)
  if (!member || member.role !== 'admin') throw new Error('Only admins can view invites')
  const result = await query(
    `SELECT pi.id, pi.email, pi.role, pi.created_at, pi.expires_at
     FROM project_invites pi
     WHERE pi.project_id = $1
       AND pi.accepted_at IS NULL
       AND pi.expires_at > NOW()
     ORDER BY pi.created_at DESC`,
    [projectId]
  )
  return result.rows
}

export async function revokeInvite(inviteId, requesterId, projectId) {
  const member = await getMemberRole(projectId, requesterId)
  if (!member || member.role !== 'admin') throw new Error('Only admins can revoke invites')
  await query(`DELETE FROM project_invites WHERE id = $1 AND project_id = $2`, [inviteId, projectId])
}

export async function getInvitesForUser(email) {
  const result = await query(
    `SELECT pi.id, pi.token, pi.project_id, pi.role, pi.created_at, pi.expires_at,
            p.name AS project_name,
            u.email AS invited_by_email
     FROM project_invites pi
     JOIN projects p ON p.id = pi.project_id
     LEFT JOIN users u ON u.id = pi.invited_by
     WHERE LOWER(pi.email) = LOWER($1)
       AND pi.accepted_at IS NULL
       AND pi.expires_at > NOW()
     ORDER BY pi.created_at DESC`,
    [email]
  )
  return result.rows
}

export async function declineInvite(token) {
  await query(`DELETE FROM project_invites WHERE token = $1`, [token])
}
