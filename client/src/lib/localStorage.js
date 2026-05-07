const AUTH_TOKEN_KEY = 'chart-to-jira-token'
const AUTH_USER_KEY = 'chart-to-jira-user'
const GUEST_SESSION_KEY = 'chart-to-jira-guest'
const GUEST_PROJECTS_KEY = 'chart-to-jira-projects-guest'

export function setGuestSession() {
  try { sessionStorage.setItem(GUEST_SESSION_KEY, 'true') } catch (_) {}
}

export function getGuestSession() {
  try { return sessionStorage.getItem(GUEST_SESSION_KEY) === 'true' } catch (_) { return false }
}

export function clearGuestSession() {
  try {
    sessionStorage.removeItem(GUEST_SESSION_KEY)
    sessionStorage.removeItem(GUEST_PROJECTS_KEY)
  } catch (_) {}
}

export function saveProjectsDataSession(data) {
  try { sessionStorage.setItem(GUEST_PROJECTS_KEY, JSON.stringify(data)) } catch (_) {}
}

export function loadProjectsDataSession() {
  try { return JSON.parse(sessionStorage.getItem(GUEST_PROJECTS_KEY)) } catch (_) { return null }
}

function credentialsKey(userId) {
  return `chart-to-jira-config-${userId}`
}

function projectsDataKey(userId) {
  return `chart-to-jira-projects-${userId}`
}

export function saveCredentials(config, userId) {
  try {
    localStorage.setItem(credentialsKey(userId), JSON.stringify(config))
  } catch (_) {}
}

export function loadCredentials(userId) {
  try {
    return JSON.parse(localStorage.getItem(credentialsKey(userId)) || '{}')
  } catch (_) {
    return {}
  }
}

export function saveProjectsData(userId, data) {
  try {
    localStorage.setItem(projectsDataKey(userId), JSON.stringify(data))
  } catch (_) {}
}

export function loadProjectsData(userId) {
  try {
    return JSON.parse(localStorage.getItem(projectsDataKey(userId)))
  } catch (_) {
    return null
  }
}

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function saveAuthToken(token) {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export function removeAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
}

export function getAuthUser() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_USER_KEY))
  } catch (_) {
    return null
  }
}

export function saveAuthUser(user) {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
}

export function removeAuthUser() {
  localStorage.removeItem(AUTH_USER_KEY)
}
