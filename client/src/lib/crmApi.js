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
  try { data = JSON.parse(text) } catch {
    throw new Error(`Server error ${res.status}`)
  }
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
  return data
}

export const crmApi = {
  // Deals
  getDeals:    ()         => apiFetch(`${API}/deals`),
  createDeal:  (body)     => apiFetch(`${API}/deals`, { method: 'POST', body: JSON.stringify(body) }),
  updateDeal:  (id, body) => apiFetch(`${API}/deals/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  updateStage: (id, stage, lost_reason) => apiFetch(`${API}/deals/${id}/stage`, { method: 'PATCH', body: JSON.stringify({ stage, lost_reason }) }),
  updateFollowUp: (id, follow_up_at) => apiFetch(`${API}/deals/${id}/followup`, { method: 'PATCH', body: JSON.stringify({ follow_up_at }) }),
  deleteDeal:  (id)       => apiFetch(`${API}/deals/${id}`, { method: 'DELETE' }),

  // Contacts
  getContacts:    (dealId)       => apiFetch(`${API}/deals/${dealId}/contacts`),
  addContact:     (dealId, body) => apiFetch(`${API}/deals/${dealId}/contacts`, { method: 'POST', body: JSON.stringify(body) }),
  deleteContact:  (id)           => apiFetch(`${API}/contacts/${id}`, { method: 'DELETE' }),

  // Activities
  getActivities:  (dealId)       => apiFetch(`${API}/deals/${dealId}/activities`),
  addActivity:    (dealId, body) => apiFetch(`${API}/deals/${dealId}/activities`, { method: 'POST', body: JSON.stringify(body) }),
  deleteActivity: (id)           => apiFetch(`${API}/activities/${id}`, { method: 'DELETE' }),

  // Tasks
  getTasks:    (dealId)       => apiFetch(`${API}/deals/${dealId}/tasks`),
  addTask:     (dealId, body) => apiFetch(`${API}/deals/${dealId}/tasks`, { method: 'POST', body: JSON.stringify(body) }),
  toggleTask:  (id, done)    => apiFetch(`${API}/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ done }) }),
  deleteTask:  (id)           => apiFetch(`${API}/tasks/${id}`, { method: 'DELETE' }),

  // Comments (F18)
  getComments:    (dealId)       => apiFetch(`${API}/deals/${dealId}/comments`),
  addComment:     (dealId, body) => apiFetch(`${API}/deals/${dealId}/comments`, { method: 'POST', body: JSON.stringify({ body }) }),
  deleteComment:  (id)           => apiFetch(`${API}/comments/${id}`, { method: 'DELETE' }),

  // Goals (F19)
  getGoals:    ()         => apiFetch(`${API}/goals`),
  saveGoal:    (body)     => apiFetch(`${API}/goals`, { method: 'POST', body: JSON.stringify(body) }),
  deleteGoal:  (id)       => apiFetch(`${API}/goals/${id}`, { method: 'DELETE' }),

  // Email Templates (F5)
  getEmailTemplates:    ()         => apiFetch(`${API}/email-templates`),
  createEmailTemplate:  (body)     => apiFetch(`${API}/email-templates`, { method: 'POST', body: JSON.stringify(body) }),
  deleteEmailTemplate:  (id)       => apiFetch(`${API}/email-templates/${id}`, { method: 'DELETE' }),
}
