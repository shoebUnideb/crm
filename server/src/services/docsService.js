import { query } from '../db/index.js'

const ROLE_RANK = { admin: 3, edit: 2, view: 1 }

function minRole(a, b) {
  const ra = ROLE_RANK[a]
  const rb = ROLE_RANK[b]
  if (ra === undefined || rb === undefined) return a || b || null
  return ra <= rb ? a : b
}

// ── Spaces ────────────────────────────────────────────────────────────────────

export async function getSpacesForUser(userId) {
  const result = await query(
    `SELECT s.id, s.name, s.slug, s.description, s.icon, s.owner_id,
            s.created_at, s.updated_at,
            COALESCE(sm.role, 'admin') AS role
     FROM doc_spaces s
     LEFT JOIN doc_space_members sm ON sm.space_id = s.id AND sm.user_id = $1
     WHERE (s.owner_id = $1 OR sm.user_id = $1)
       AND (sm.status IS NULL OR sm.status = 'active')
     ORDER BY s.created_at ASC`,
    [userId]
  )
  return result.rows
}

export async function createSpace(name, slug, icon, description, ownerId) {
  const result = await query(
    `INSERT INTO doc_spaces (name, slug, icon, description, owner_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, slug, icon || '📄', description || null, ownerId]
  )
  const space = result.rows[0]
  // auto-add owner as admin member
  await query(
    `INSERT INTO doc_space_members (space_id, user_id, role, invited_by)
     VALUES ($1, $2, 'admin', $2)
     ON CONFLICT (space_id, user_id) DO NOTHING`,
    [space.id, ownerId]
  )
  return space
}

export async function getSpace(spaceId, userId) {
  const result = await query(
    `SELECT s.id, s.name, s.slug, s.description, s.icon, s.owner_id,
            s.created_at, s.updated_at,
            COALESCE(sm.role, CASE WHEN s.owner_id = $2 THEN 'admin' ELSE NULL END) AS role
     FROM doc_spaces s
     LEFT JOIN doc_space_members sm ON sm.space_id = s.id AND sm.user_id = $2
     WHERE s.id = $1`,
    [spaceId, userId]
  )
  return result.rows[0] || null
}

export async function updateSpace(spaceId, { name, icon, description }) {
  const result = await query(
    `UPDATE doc_spaces
     SET name = COALESCE($1, name),
         icon = COALESCE($2, icon),
         description = COALESCE($3, description),
         updated_at = NOW()
     WHERE id = $4
     RETURNING *`,
    [name || null, icon || null, description !== undefined ? description : null, spaceId]
  )
  return result.rows[0] || null
}

export async function deleteSpace(spaceId) {
  await query(`DELETE FROM doc_spaces WHERE id = $1`, [spaceId])
}

// ── Space Members ─────────────────────────────────────────────────────────────

export async function getSpaceMembers(spaceId) {
  const result = await query(
    `SELECT sm.id, sm.user_id, sm.role, sm.joined_at,
            u.email, u.avatar,
            ib.email AS invited_by_email
     FROM doc_space_members sm
     JOIN users u ON u.id = sm.user_id
     LEFT JOIN users ib ON ib.id = sm.invited_by
     WHERE sm.space_id = $1
     ORDER BY sm.joined_at ASC`,
    [spaceId]
  )
  return result.rows
}

export async function getSpaceMemberRole(spaceId, userId) {
  const result = await query(
    `SELECT sm.role FROM doc_space_members sm
     WHERE sm.space_id = $1 AND sm.user_id = $2 AND sm.status = 'active'
     UNION
     SELECT 'admin' AS role FROM doc_spaces
     WHERE id = $1 AND owner_id = $2
     LIMIT 1`,
    [spaceId, userId]
  )
  return result.rows[0]?.role || null
}

export async function addSpaceMember(spaceId, userId, role, invitedBy) {
  // owner adding themselves = active immediately; inviting someone else = pending
  const status = (invitedBy === userId) ? 'active' : 'pending'
  const spaceName = await query(`SELECT name FROM doc_spaces WHERE id = $1`, [spaceId])
  const nameCache = spaceName.rows[0]?.name || null
  const result = await query(
    `INSERT INTO doc_space_members (space_id, user_id, role, invited_by, status, space_name_cache)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (space_id, user_id) DO UPDATE SET role = $3, status = EXCLUDED.status, space_name_cache = $6
     RETURNING *`,
    [spaceId, userId, role, invitedBy, status, nameCache]
  )
  return result.rows[0]
}

export async function updateSpaceMemberRole(spaceId, userId, role) {
  const result = await query(
    `UPDATE doc_space_members SET role = $1
     WHERE space_id = $2 AND user_id = $3
     RETURNING *`,
    [role, spaceId, userId]
  )
  return result.rows[0] || null
}

export async function removeSpaceMember(spaceId, userId) {
  await query(
    `DELETE FROM doc_space_members WHERE space_id = $1 AND user_id = $2`,
    [spaceId, userId]
  )
}

export async function getPendingInvitesForUser(userId) {
  const result = await query(
    `SELECT sm.id, sm.space_id, sm.role, sm.joined_at AS invited_at,
            sm.space_name_cache AS space_name,
            s.icon AS space_icon, s.slug AS space_slug,
            ib.email AS invited_by_email, ib.avatar AS invited_by_avatar
     FROM doc_space_members sm
     JOIN doc_spaces s ON s.id = sm.space_id
     LEFT JOIN users ib ON ib.id = sm.invited_by
     WHERE sm.user_id = $1 AND sm.status = 'pending'
     ORDER BY sm.joined_at DESC`,
    [userId]
  )
  return result.rows
}

export async function acceptSpaceInvite(spaceId, userId) {
  const result = await query(
    `UPDATE doc_space_members SET status = 'active'
     WHERE space_id = $1 AND user_id = $2 AND status = 'pending'
     RETURNING *`,
    [spaceId, userId]
  )
  return result.rows[0] || null
}

export async function rejectSpaceInvite(spaceId, userId) {
  await query(
    `DELETE FROM doc_space_members WHERE space_id = $1 AND user_id = $2 AND status = 'pending'`,
    [spaceId, userId]
  )
}

export async function leaveSpace(spaceId, userId) {
  // prevent leaving if you're the only admin
  const admins = await query(
    `SELECT COUNT(*) AS cnt FROM doc_space_members
     WHERE space_id = $1 AND role = 'admin' AND status = 'active'`,
    [spaceId]
  )
  const isOwner = await query(
    `SELECT 1 FROM doc_spaces WHERE id = $1 AND owner_id = $2`,
    [spaceId, userId]
  )
  if (isOwner.rows.length > 0) {
    throw new Error('Space owner cannot leave. Transfer ownership or delete the space.')
  }
  await query(
    `DELETE FROM doc_space_members WHERE space_id = $1 AND user_id = $2`,
    [spaceId, userId]
  )
}

// ── Permission Resolution ─────────────────────────────────────────────────────

export async function getEffectiveRole(pageId, userId) {
  // get space_id for this page
  const pageRow = await query(
    `SELECT space_id FROM doc_pages WHERE id = $1 AND deleted_at IS NULL`,
    [pageId]
  )
  if (!pageRow.rows[0]) return null
  const { space_id } = pageRow.rows[0]

  // get space-level role
  const spaceRole = await getSpaceMemberRole(space_id, userId)
  if (!spaceRole) return null

  // check per-page restriction for this user
  const restriction = await query(
    `SELECT role FROM doc_page_restrictions WHERE page_id = $1 AND user_id = $2`,
    [pageId, userId]
  )
  if (!restriction.rows[0]) return spaceRole

  return minRole(spaceRole, restriction.rows[0].role)
}

// ── Pages ─────────────────────────────────────────────────────────────────────

export async function getPageTree(spaceId) {
  const result = await query(
    `SELECT p.id, p.parent_id, p.title, p.nav_title, p.status, p.position,
            p.created_at, p.updated_at, p.created_by, p.last_edited_by,
            creator.email AS created_by_email,
            editor.email AS last_edited_by_email,
            (SELECT COUNT(*) FROM doc_page_restrictions r WHERE r.page_id = p.id) AS restriction_count
     FROM doc_pages p
     JOIN users creator ON creator.id = p.created_by
     LEFT JOIN users editor ON editor.id = p.last_edited_by
     WHERE p.space_id = $1 AND p.deleted_at IS NULL
     ORDER BY p.position ASC, p.created_at ASC`,
    [spaceId]
  )
  return result.rows
}

export async function createPage(spaceId, parentId, title, createdBy, content) {
  // compute next position among siblings
  const posResult = await query(
    `SELECT COALESCE(MAX(position), -1) + 1 AS next_pos
     FROM doc_pages
     WHERE space_id = $1 AND parent_id IS NOT DISTINCT FROM $2 AND deleted_at IS NULL`,
    [spaceId, parentId || null]
  )
  const position = posResult.rows[0].next_pos

  const contentJson = content && typeof content === 'object' && Object.keys(content).length > 0
    ? JSON.stringify(content)
    : '{}'

  const result = await query(
    `INSERT INTO doc_pages (space_id, parent_id, title, nav_title, content, status, position, created_by, last_edited_by)
     VALUES ($1, $2, $3, $3, $4, 'draft', $5, $6, $6)
     RETURNING *`,
    [spaceId, parentId || null, title || 'Untitled', contentJson, position, createdBy]
  )
  return result.rows[0]
}

export async function getPage(pageId) {
  const result = await query(
    `SELECT p.*,
            creator.email AS created_by_email,
            creator.avatar AS created_by_avatar,
            editor.email AS last_edited_by_email,
            editor.avatar AS last_edited_by_avatar
     FROM doc_pages p
     JOIN users creator ON creator.id = p.created_by
     LEFT JOIN users editor ON editor.id = p.last_edited_by
     WHERE p.id = $1 AND p.deleted_at IS NULL`,
    [pageId]
  )
  return result.rows[0] || null
}

export async function updatePage(pageId, title, content, userId) {
  // snapshot current version before overwriting
  await query(
    `INSERT INTO doc_page_versions (page_id, title, content, edited_by)
     SELECT id, title, content, $2 FROM doc_pages WHERE id = $1`,
    [pageId, userId]
  )
  const result = await query(
    `UPDATE doc_pages
     SET title = COALESCE($1, title),
         content = COALESCE($2, content),
         last_edited_by = $3,
         updated_at = NOW()
     WHERE id = $4 AND deleted_at IS NULL
     RETURNING *`,
    [title || null, content || null, userId, pageId]
  )
  return result.rows[0] || null
}

export async function movePage(pageId, parentId, position) {
  const result = await query(
    `UPDATE doc_pages
     SET parent_id = $1, position = $2, updated_at = NOW()
     WHERE id = $3 AND deleted_at IS NULL
     RETURNING *`,
    [parentId || null, position ?? 0, pageId]
  )
  return result.rows[0] || null
}

export async function updateNavTitle(pageId, navTitle) {
  const result = await query(
    `UPDATE doc_pages SET nav_title = $1, updated_at = NOW()
     WHERE id = $2 AND deleted_at IS NULL RETURNING *`,
    [navTitle || null, pageId]
  )
  return result.rows[0] || null
}

export async function updatePageStatus(pageId, status) {
  const result = await query(
    `UPDATE doc_pages SET status = $1, updated_at = NOW()
     WHERE id = $2 AND deleted_at IS NULL
     RETURNING *`,
    [status, pageId]
  )
  return result.rows[0] || null
}

export async function softDeletePage(pageId) {
  await query(
    `UPDATE doc_pages SET deleted_at = NOW() WHERE id = $1`,
    [pageId]
  )
  // also soft-delete all descendants recursively
  await query(
    `WITH RECURSIVE descendants AS (
       SELECT id FROM doc_pages WHERE parent_id = $1 AND deleted_at IS NULL
       UNION ALL
       SELECT p.id FROM doc_pages p
       JOIN descendants d ON p.parent_id = d.id AND p.deleted_at IS NULL
     )
     UPDATE doc_pages SET deleted_at = NOW()
     WHERE id IN (SELECT id FROM descendants)`,
    [pageId]
  )
}

export async function duplicatePage(pageId, userId) {
  const src = await getPage(pageId)
  if (!src) return null
  const result = await query(
    `INSERT INTO doc_pages (space_id, parent_id, title, nav_title, content, status, position, created_by, last_edited_by)
     VALUES ($1, $2, $3, $3, $4, 'draft', $5, $6, $6)
     RETURNING *`,
    [src.space_id, src.parent_id, src.title + ' (copy)', src.content, src.position + 1, userId]
  )
  return result.rows[0]
}

// ── Page Versions ─────────────────────────────────────────────────────────────

export async function getVersions(pageId) {
  const result = await query(
    `SELECT v.id, v.title, v.created_at,
            u.email AS edited_by_email, u.avatar AS edited_by_avatar
     FROM doc_page_versions v
     JOIN users u ON u.id = v.edited_by
     WHERE v.page_id = $1
     ORDER BY v.created_at DESC
     LIMIT 50`,
    [pageId]
  )
  return result.rows
}

export async function getVersion(versionId) {
  const result = await query(
    `SELECT * FROM doc_page_versions WHERE id = $1`,
    [versionId]
  )
  return result.rows[0] || null
}

export async function restoreVersion(pageId, versionId, userId) {
  const version = await getVersion(versionId)
  if (!version || version.page_id !== pageId) throw new Error('Version not found')
  return updatePage(pageId, version.title, version.content, userId)
}

// ── Page Restrictions ─────────────────────────────────────────────────────────

export async function getRestrictions(pageId) {
  const result = await query(
    `SELECT r.id, r.user_id, r.role, r.created_at,
            u.email, u.avatar,
            cb.email AS created_by_email
     FROM doc_page_restrictions r
     JOIN users u ON u.id = r.user_id
     JOIN users cb ON cb.id = r.created_by
     WHERE r.page_id = $1
     ORDER BY r.created_at ASC`,
    [pageId]
  )
  return result.rows
}

export async function addRestriction(pageId, userId, role, createdBy) {
  const result = await query(
    `INSERT INTO doc_page_restrictions (page_id, user_id, role, created_by)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (page_id, user_id) DO UPDATE SET role = $3
     RETURNING *`,
    [pageId, userId, role, createdBy]
  )
  return result.rows[0]
}

export async function removeRestriction(restrictionId) {
  await query(`DELETE FROM doc_page_restrictions WHERE id = $1`, [restrictionId])
}

// ── Comments ──────────────────────────────────────────────────────────────────

export async function getComments(pageId) {
  const result = await query(
    `SELECT c.id, c.user_id, c.body, c.resolved, c.created_at, c.updated_at,
            u.email, u.avatar
     FROM doc_comments c
     JOIN users u ON u.id = c.user_id
     WHERE c.page_id = $1
     ORDER BY c.created_at ASC`,
    [pageId]
  )
  return result.rows
}

export async function addComment(pageId, userId, body) {
  const result = await query(
    `INSERT INTO doc_comments (page_id, user_id, body)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [pageId, userId, body]
  )
  return result.rows[0]
}

export async function updateComment(commentId, body) {
  const result = await query(
    `UPDATE doc_comments SET body = $1, updated_at = NOW()
     WHERE id = $2 RETURNING *`,
    [body, commentId]
  )
  return result.rows[0] || null
}

export async function deleteComment(commentId) {
  await query(`DELETE FROM doc_comments WHERE id = $1`, [commentId])
}

export async function resolveComment(commentId, resolved) {
  const result = await query(
    `UPDATE doc_comments SET resolved = $1, updated_at = NOW()
     WHERE id = $2 RETURNING *`,
    [resolved, commentId]
  )
  return result.rows[0] || null
}

// ── Stars ─────────────────────────────────────────────────────────────────────

export async function toggleStar(pageId, userId) {
  const existing = await query(
    `SELECT 1 FROM doc_page_stars WHERE page_id = $1 AND user_id = $2`,
    [pageId, userId]
  )
  if (existing.rows.length > 0) {
    await query(
      `DELETE FROM doc_page_stars WHERE page_id = $1 AND user_id = $2`,
      [pageId, userId]
    )
    return { starred: false }
  }
  await query(
    `INSERT INTO doc_page_stars (page_id, user_id) VALUES ($1, $2)`,
    [pageId, userId]
  )
  return { starred: true }
}

export async function getStarredPages(userId) {
  const result = await query(
    `SELECT p.id, p.title, p.space_id, p.status, p.updated_at,
            s.name AS space_name, s.icon AS space_icon,
            st.created_at AS starred_at
     FROM doc_page_stars st
     JOIN doc_pages p ON p.id = st.page_id AND p.deleted_at IS NULL
     JOIN doc_spaces s ON s.id = p.space_id
     WHERE st.user_id = $1
     ORDER BY st.created_at DESC`,
    [userId]
  )
  return result.rows
}

// ── Search ────────────────────────────────────────────────────────────────────

export async function searchPages(userId, searchQuery, spaceId) {
  const params = [userId, `%${searchQuery}%`]
  let spaceFilter = ''
  if (spaceId) {
    params.push(spaceId)
    spaceFilter = `AND p.space_id = $${params.length}`
  }

  const result = await query(
    `SELECT p.id, p.title, p.space_id, p.status, p.updated_at,
            s.name AS space_name, s.icon AS space_icon
     FROM doc_pages p
     JOIN doc_spaces s ON s.id = p.space_id
     JOIN doc_space_members sm ON sm.space_id = s.id AND sm.user_id = $1
     WHERE p.deleted_at IS NULL
       AND (p.title ILIKE $2 OR p.content::text ILIKE $2)
       ${spaceFilter}
     ORDER BY p.updated_at DESC
     LIMIT 30`,
    params
  )
  return result.rows
}
