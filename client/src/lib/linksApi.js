const API = (import.meta.env.VITE_API_URL ?? '') + '/api/links'

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

export const linksApi = {
  create: (body) => apiFetch(API, { method: 'POST', body: JSON.stringify(body) }),
  getBySource: (sourceType, sourceId) => apiFetch(`${API}/by-source/${sourceType}/${sourceId}`),
  getByTarget: (targetType, targetId) => apiFetch(`${API}/by-target/${targetType}/${targetId}`),
  getForProject: (projectId, sourceType = 'node') =>
    apiFetch(`${API}/project/${projectId}?source_type=${sourceType}`),
  remove: (id) => apiFetch(`${API}/${id}`, { method: 'DELETE' }),
  removeBySource: (sourceType, sourceId) =>
    apiFetch(`${API}/by-source/${sourceType}/${sourceId}`, { method: 'DELETE' }),
  restore: (id) => apiFetch(`${API}/${id}/restore`, { method: 'PATCH' }),
}
