import { getAuthToken, removeAuthToken, removeAuthUser } from './localStorage.js'

function authHeaders() {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function handleResponse(res) {
  if (res.status === 401) {
    removeAuthToken()
    removeAuthUser()
    window.location.replace('/login')
    return
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`)
  return data
}

export async function fetchIssueTypes({ baseUrl, email, apiToken, projectKey }) {
  const params = new URLSearchParams({ baseUrl, email, apiToken, projectKey })
  const res = await fetch(`/api/jira/issue-types?${params}`, {
    headers: authHeaders(),
  })
  return handleResponse(res)
}

export async function createTickets({ jira, tree }) {
  const res = await fetch('/api/jira/create-tickets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ jira, tree }),
  })
  return handleResponse(res)
}

export async function searchJQL({ baseUrl, email, apiToken, projectKey, jql }) {
  const params = new URLSearchParams({ baseUrl, email, apiToken, jql })
  const res = await fetch(`/api/jira/search?${params}`, {
    headers: authHeaders(),
  })
  return handleResponse(res)
}

export async function fetchSprints({ baseUrl, email, apiToken, boardId }) {
  const params = new URLSearchParams({ baseUrl, email, apiToken, boardId })
  const res = await fetch(`/api/jira/sprints?${params}`, {
    headers: authHeaders(),
  })
  return handleResponse(res)
}

