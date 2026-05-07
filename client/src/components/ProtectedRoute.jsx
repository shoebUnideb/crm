import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isGuest } = useAuth()
  return isAuthenticated || isGuest ? children : <Navigate to="/login" replace />
}
