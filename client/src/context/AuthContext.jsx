import React, { createContext, useContext, useState, useEffect } from 'react'
import { getAuthToken, saveAuthToken, removeAuthToken, getAuthUser, saveAuthUser, removeAuthUser, getGuestSession, setGuestSession, clearGuestSession } from '../lib/localStorage.js'

const AuthContext = createContext(null)

const GUEST_USER = { id: 'guest', name: 'Guest', isGuest: true }

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getAuthToken())
  const [user, setUser] = useState(() => getAuthUser())
  const [isGuest, setIsGuest] = useState(() => getGuestSession())

  // Always re-hydrate user from the server when a token is present.
  // This ensures avatar (and any other server-side profile data) is
  // never lost due to stale localStorage — regardless of what the
  // login endpoint returned.
  useEffect(() => {
    if (!token) return
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => (r.ok ? r.json() : null))
      .then(me => {
        if (!me) return
        saveAuthUser(me)
        setUser(me)
      })
      .catch(() => {})
  }, [token])

  function login(newToken, newUser) {
    saveAuthToken(newToken)
    saveAuthUser(newUser)
    setToken(newToken)
    setUser(newUser)
  }

  function logout() {
    removeAuthToken()
    removeAuthUser()
    clearGuestSession()
    setToken(null)
    setUser(null)
    setIsGuest(false)
  }

  function loginAsGuest() {
    setGuestSession()
    setIsGuest(true)
  }

  function setAvatar(avatar) {
    const updated = { ...user, avatar }
    saveAuthUser(updated)
    setUser(updated)
  }

  const effectiveUser = isGuest ? GUEST_USER : user

  return (
    <AuthContext.Provider value={{ token, user: effectiveUser, login, logout, loginAsGuest, isAuthenticated: !!token && !!user, isGuest, setAvatar }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
