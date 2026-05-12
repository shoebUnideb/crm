const API = '/api/docs'

function getToken() {
  try { return localStorage.getItem('chart-to-jira-token') } catch { return null }
}

async function apiFetch(url, options = {}) {
  const token = getToken()
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { throw new Error(`Server error ${res.status}`) }
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
  return data
}

// ── Spaces ────────────────────────────────────────────────────────────────────
export const getSpaces = () => apiFetch(`${API}/spaces`)
export const createSpace = (body) => apiFetch(`${API}/spaces`, { method: 'POST', body: JSON.stringify(body) })
export const getSpace = (id) => apiFetch(`${API}/spaces/${id}`)
export const updateSpace = (id, body) => apiFetch(`${API}/spaces/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
export const deleteSpace = (id) => apiFetch(`${API}/spaces/${id}`, { method: 'DELETE' })

// ── Space Members ─────────────────────────────────────────────────────────────
export const getSpaceMembers = (spaceId) => apiFetch(`${API}/spaces/${spaceId}/members`)
export const addSpaceMember = (spaceId, body) => apiFetch(`${API}/spaces/${spaceId}/members`, { method: 'POST', body: JSON.stringify(body) })
export const updateMemberRole = (spaceId, userId, role) => apiFetch(`${API}/spaces/${spaceId}/members/${userId}`, { method: 'PATCH', body: JSON.stringify({ role }) })
export const removeSpaceMember = (spaceId, userId) => apiFetch(`${API}/spaces/${spaceId}/members/${userId}`, { method: 'DELETE' })
export const leaveSpace = (spaceId) => apiFetch(`${API}/spaces/${spaceId}/leave`, { method: 'DELETE' })

// ── Notifications ─────────────────────────────────────────────────────────────
export const getNotifications = () => apiFetch(`${API}/notifications`)
export const acceptInvite = (spaceId) => apiFetch(`${API}/spaces/${spaceId}/invite/accept`, { method: 'POST' })
export const rejectInvite = (spaceId) => apiFetch(`${API}/spaces/${spaceId}/invite/reject`, { method: 'POST' })

// ── Pages ─────────────────────────────────────────────────────────────────────
export const getPageTree = (spaceId) => apiFetch(`${API}/spaces/${spaceId}/pages`)
export const createPage = (spaceId, body) => apiFetch(`${API}/spaces/${spaceId}/pages`, { method: 'POST', body: JSON.stringify(body) })
export const getPage = (id) => apiFetch(`${API}/pages/${id}`)
export const updatePage = (id, body) => apiFetch(`${API}/pages/${id}`, { method: 'PUT', body: JSON.stringify(body) })
export const renamePage = (id, navTitle) => apiFetch(`${API}/pages/${id}`, { method: 'PATCH', body: JSON.stringify({ navTitle }) })
export const movePage = (id, body) => apiFetch(`${API}/pages/${id}/move`, { method: 'PATCH', body: JSON.stringify(body) })
export const updatePageStatus = (id, status) => apiFetch(`${API}/pages/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
export const deletePage = (id) => apiFetch(`${API}/pages/${id}`, { method: 'DELETE' })
export const duplicatePage = (id) => apiFetch(`${API}/pages/${id}/duplicate`, { method: 'POST', body: JSON.stringify({}) })

// ── Versions ──────────────────────────────────────────────────────────────────
export const getVersions = (pageId) => apiFetch(`${API}/pages/${pageId}/versions`)
export const restoreVersion = (pageId, versionId) => apiFetch(`${API}/pages/${pageId}/versions/${versionId}/restore`, { method: 'POST', body: JSON.stringify({}) })

// ── Restrictions ──────────────────────────────────────────────────────────────
export const getRestrictions = (pageId) => apiFetch(`${API}/pages/${pageId}/restrictions`)
export const addRestriction = (pageId, body) => apiFetch(`${API}/pages/${pageId}/restrictions`, { method: 'POST', body: JSON.stringify(body) })
export const removeRestriction = (pageId, restrictionId) => apiFetch(`${API}/pages/${pageId}/restrictions/${restrictionId}`, { method: 'DELETE' })

// ── Comments ──────────────────────────────────────────────────────────────────
export const getComments = (pageId) => apiFetch(`${API}/pages/${pageId}/comments`)
export const addComment = (pageId, body) => apiFetch(`${API}/pages/${pageId}/comments`, { method: 'POST', body: JSON.stringify({ body }) })
export const updateComment = (id, body) => apiFetch(`${API}/comments/${id}`, { method: 'PATCH', body: JSON.stringify({ body }) })
export const deleteComment = (id) => apiFetch(`${API}/comments/${id}`, { method: 'DELETE' })
export const resolveComment = (id, resolved) => apiFetch(`${API}/comments/${id}/resolve`, { method: 'PATCH', body: JSON.stringify({ resolved }) })

// ── Stars & Search ────────────────────────────────────────────────────────────
export const starPage = (pageId) => apiFetch(`${API}/pages/${pageId}/star`, { method: 'POST', body: JSON.stringify({}) })
export const getStarred = () => apiFetch(`${API}/starred`)
export const searchPages = (q, spaceId) => apiFetch(`${API}/search?q=${encodeURIComponent(q)}${spaceId ? `&spaceId=${spaceId}` : ''}`)

// ── Entity linking ────────────────────────────────────────────────────────────
export const getLinkedPages = (sourceType, sourceId) =>
  apiFetch(`${API}/linked-pages?sourceType=${encodeURIComponent(sourceType)}&sourceId=${encodeURIComponent(sourceId)}`)
export const linkPage = (body) => apiFetch(`${API}/linked-pages`, { method: 'POST', body: JSON.stringify(body) })
export const unlinkPage = (linkId) => apiFetch(`${API}/linked-pages/${linkId}`, { method: 'DELETE' })