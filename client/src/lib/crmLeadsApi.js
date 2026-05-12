const API = '/api/crm'

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

export const leadsApi = {
  getLeads:      (params) => apiFetch(`${API}/leads${params ? '?' + new URLSearchParams(params) : ''}`),
  createLead:    (body)   => apiFetch(`${API}/leads`, { method: 'POST', body: JSON.stringify(body) }),
  updateLead:    (id, body) => apiFetch(`${API}/leads/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteLead:    (id)     => apiFetch(`${API}/leads/${id}`, { method: 'DELETE' }),
  updateStatus:  (id, status) => apiFetch(`${API}/leads/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  convertLead:   (id, body) => apiFetch(`${API}/leads/${id}/convert`, { method: 'POST', body: JSON.stringify(body) }),
  importLeads:   (rows)   => apiFetch(`${API}/leads/import`, { method: 'POST', body: JSON.stringify({ rows }) }),
  bulkDelete:    (ids)    => apiFetch(`${API}/leads/bulk-delete`, { method: 'POST', body: JSON.stringify({ ids }) }),
  bulkUpdate:    (ids, data) => apiFetch(`${API}/leads/bulk-update`, { method: 'POST', body: JSON.stringify({ ids, ...data }) }),
}
