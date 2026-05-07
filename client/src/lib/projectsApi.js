const BASE = import.meta.env.VITE_API_URL ?? ''

function authHeaders(token) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}

async function req(method, path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: authHeaders(token),
    body: body != null ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

export const projectsApi = {
  list: (token) => req('GET', '/api/projects', null, token),
  create: (token, id, name, state) => req('POST', '/api/projects', { id, name, state }, token),
  get: (token, projectId) => req('GET', `/api/projects/${projectId}`, null, token),
  rename: (token, projectId, name) => req('PATCH', `/api/projects/${projectId}/name`, { name }, token),
  delete: (token, projectId) => req('DELETE', `/api/projects/${projectId}`, null, token),
  saveState: (token, projectId, state) => req('PUT', `/api/projects/${projectId}/state`, { state }, token),

  getMembers: (token, projectId) => req('GET', `/api/projects/${projectId}/members`, null, token),
  inviteMember: (token, projectId, email, role) =>
    req('POST', `/api/projects/${projectId}/members`, { email, role }, token),
  removeMember: (token, projectId, userId) =>
    req('DELETE', `/api/projects/${projectId}/members/${userId}`, null, token),
  updateRole: (token, projectId, userId, role) =>
    req('PATCH', `/api/projects/${projectId}/members/${userId}/role`, { role }, token),

  sendInvite: (token, projectId, email, role) =>
    req('POST', `/api/projects/${projectId}/invites`, { email, role }, token),
  getPendingInvites: (token, projectId) =>
    req('GET', `/api/projects/${projectId}/invites`, null, token),
  revokeInvite: (token, projectId, inviteId) =>
    req('DELETE', `/api/projects/${projectId}/invites/${inviteId}`, null, token),

  getInvite: (token) =>
    fetch(`${BASE}/api/invites/${token}`).then(r => r.json()),
  acceptInvite: (authToken, inviteToken) =>
    req('POST', `/api/invites/${inviteToken}/accept`, null, authToken),
  getMyInvites: (authToken) =>
    req('GET', '/api/invites/mine', null, authToken),
  declineInvite: (authToken, inviteToken) =>
    req('DELETE', `/api/invites/${inviteToken}/decline`, null, authToken),
}

export const WS_URL = (() => {
  const envUrl = import.meta.env.VITE_API_URL
  if (envUrl) return envUrl.replace(/^http/, 'ws') + '/ws'
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}/ws`
})()

