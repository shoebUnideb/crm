const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api/graph'

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

export const graphApi = {
  traverse: (body) => apiFetch(BASE + '/traverse', { method: 'POST', body: JSON.stringify(body) }),
  impact: (body) => apiFetch(BASE + '/impact', { method: 'POST', body: JSON.stringify(body) }),
  overlay: (body) => apiFetch(BASE + '/overlay', { method: 'POST', body: JSON.stringify(body) }),
  aggregate: (body) => apiFetch(BASE + '/aggregate', { method: 'POST', body: JSON.stringify(body) }),
  stats: (projectId) => apiFetch(`${BASE}/stats/${projectId}`),
  paths: (body) => apiFetch(BASE + '/paths', { method: 'POST', body: JSON.stringify(body) }),
  summarize: (projectId) => apiFetch(`${BASE}/summarize/${projectId}`),
  reconcile: (projectId) => apiFetch(`${BASE}/reconcile/${projectId}`, { method: 'POST' }),
  health: (projectId) => apiFetch(`${BASE}/health/${projectId}`),
  enrichEdge: (linkId, metadata) => apiFetch(`${BASE}/edges/${linkId}/metadata`, { method: 'PATCH', body: JSON.stringify({ metadata }) }),
  backfill: () => apiFetch(BASE + '/backfill', { method: 'POST' }),
  cacheStats: () => apiFetch(BASE + '/cache-stats'),
}
