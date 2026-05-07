const API_BASE = '/api'

function getSessionId() {
  try {
    let sid = localStorage.getItem('bahn_session_id')
    if (!sid) {
      sid = crypto.randomUUID()
      localStorage.setItem('bahn_session_id', sid)
    }
    return sid
  } catch { return 'unknown' }
}

export function trackEvent(eventType, featureName, userId, isGuest, metadata) {
  try {
    fetch(`${API_BASE}/analytics/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType, featureName: featureName || null,
        sessionId: getSessionId(), userId: userId || null,
        isGuest: !!isGuest, metadata: metadata || {},
      }),
    }).catch(() => {})
  } catch {}
}

export function submitFeedback({ userId, isGuest, email, rating, message, category, metadata } = {}) {
  return fetch(`${API_BASE}/analytics/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: getSessionId(), userId: userId || null, isGuest: !!isGuest,
      email: email || null, rating: rating || null, message: message || null,
      category: category || 'general', metadata: metadata || {},
    }),
  }).then(r => r.json())
}

async function apiFetch(url, token, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(options.headers || {}) },
  })
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch {
    if (!res.ok) throw new Error(res.status === 403 ? 'Admin access required. Set is_admin = true for your account in the database.' : `Server error ${res.status}`)
    throw new Error('Invalid server response')
  }
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
  return data
}

export const adminApi = {
  stats: (token) => apiFetch(`${API_BASE}/admin/stats`, token),
  features: (token) => apiFetch(`${API_BASE}/admin/features`, token),
  activity: (token, limit = 50, offset = 0, filter = '') =>
    apiFetch(`${API_BASE}/admin/activity?limit=${limit}&offset=${offset}&filter=${encodeURIComponent(filter)}`, token),
  users: (token, limit = 50, offset = 0, search = '') =>
    apiFetch(`${API_BASE}/admin/users?limit=${limit}&offset=${offset}&search=${encodeURIComponent(search)}`, token),
  toggleAdmin: (token, userId, isAdmin) =>
    apiFetch(`${API_BASE}/admin/users/${userId}/admin`, token, { method: 'PATCH', body: JSON.stringify({ isAdmin }) }),
  feedback: (token, limit = 50, offset = 0, category = '') =>
    apiFetch(`${API_BASE}/admin/feedback?limit=${limit}&offset=${offset}&category=${encodeURIComponent(category)}`, token),
  deleteFeedback: (token, id) =>
    apiFetch(`${API_BASE}/admin/feedback/${id}`, token, { method: 'DELETE' }),
}
