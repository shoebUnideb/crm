import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { AuthModalProvider } from './context/AuthModalContext.jsx'
import AuthModal from './components/auth/AuthModal.jsx'

if (!crypto.randomUUID) {
  crypto.randomUUID = () =>
    '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
      (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16))
}

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <AuthModalProvider>
        <App />
        <AuthModal />
      </AuthModalProvider>
    </AuthProvider>
  </BrowserRouter>
)
