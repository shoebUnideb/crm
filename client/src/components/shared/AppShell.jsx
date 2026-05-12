import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useAuthModal } from '../../context/AuthModalContext.jsx'
import AppProductSwitcher from './AppProductSwitcher.jsx'
import UserMenu from './UserMenu.jsx'

export default function AppShell({ currentProduct, contextArea, notifications, children }) {
  const { user, logout, isGuest } = useAuth()
  const { openLogin } = useAuthModal()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <header style={{
        height: 42, display: 'flex', alignItems: 'center',
        background: '#172B4D', borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '0 20px', flexShrink: 0, zIndex: 50,
      }}>
        {/* LEFT: Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none', padding: '0 10px 0 4px', flexShrink: 0 }}>
          <svg width="24" height="24" viewBox="0 0 30 30" fill="none">
            <circle cx="10" cy="15" r="9" fill="#0052CC" opacity="0.9"/>
            <circle cx="20" cy="15" r="9" fill="#4C9AFF" opacity="0.85"/>
          </svg>
          <span style={{ fontWeight: 700, fontSize: '1.0625rem', color: '#fff', letterSpacing: '-0.01em' }}>
            bahnOS
          </span>
        </Link>

        <span style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.18)', margin: '0 6px', flexShrink: 0 }} />

        {/* CENTER: Context area (product-specific) */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', minWidth: 0, overflow: 'hidden' }}>
          {contextArea}
        </div>

        {/* RIGHT: Product switcher + notifications + user */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 12 }}>
          <AppProductSwitcher currentProduct={currentProduct} />

          <span style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.12)', margin: '0 4px', flexShrink: 0 }} />

          {notifications}

          {isGuest ? (
            <button onClick={openLogin} style={{
              fontSize: 12, fontWeight: 600, color: '#fff',
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 4, padding: '4px 10px', cursor: 'pointer', flexShrink: 0,
            }}>
              Sign in
            </button>
          ) : (
            user && <UserMenu user={user} logout={logout} />
          )}
        </div>
      </header>

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  )
}
