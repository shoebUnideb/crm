import React, { createContext, useContext, useState } from 'react'

const AuthModalContext = createContext(null)

export function AuthModalProvider({ children }) {
  const [view, setView] = useState(null) // null | 'login' | 'register' | 'forgot'
  const [message, setMessage] = useState(null)

  function close() {
    setView(null)
    setMessage(null)
  }

  return (
    <AuthModalContext.Provider value={{
      view,
      message,
      setMessage,
      openLogin:    () => setView('login'),
      openRegister: () => setView('register'),
      openForgot:   () => setView('forgot'),
      close,
      setView,
    }}>
      {children}
    </AuthModalContext.Provider>
  )
}

export function useAuthModal() {
  return useContext(AuthModalContext)
}
