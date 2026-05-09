import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projectsApi } from '../lib/projectsApi.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useAuthModal } from '../context/AuthModalContext.jsx'

const blue      = '#0052CC'
const blueHover = '#0065FF'
const navy      = '#172B4D'
const subtle    = '#5E6C84'
const border    = '#DFE1E6'
const bg        = '#FAFBFC'

const ROLE_LABELS = { admin: 'Admin', edit: 'Editor', view: 'Viewer' }
const ROLE_COLORS = { admin: '#7C3AED', edit: '#2563EB', view: '#6B7280' }

export default function InviteAcceptPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, token: authToken } = useAuth()
  const { openLogin, openRegister } = useAuthModal()

  const [invite, setInvite] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [accepting, setAccepting] = useState(false)
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    projectsApi.getInvite(token)
      .then(data => {
        if (data.error) { setError(data.error); return }
        setInvite(data)
      })
      .catch(() => setError('Failed to load invite'))
      .finally(() => setLoading(false))
  }, [token])

  // After logging in/registering, auto-accept
  useEffect(() => {
    if (!isAuthenticated || !invite || accepted || invite.expired || invite.accepted) return
    handleAccept()
  }, [isAuthenticated])

  async function handleAccept() {
    setAccepting(true)
    setError(null)
    try {
      await projectsApi.acceptInvite(authToken, token)
      setAccepted(true)
      setTimeout(() => navigate('/canvas'), 1800)
    } catch (e) {
      setError(e.message)
    } finally {
      setAccepting(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", padding: 16,
    }}>
      <div style={{
        width: '100%', maxWidth: 420, background: '#fff', borderRadius: 8,
        boxShadow: '0 4px 24px rgba(9,30,66,0.12)', border: `1px solid ${border}`, overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ background: navy, padding: '20px 28px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="28" height="28" viewBox="0 0 30 30" fill="none">
            <circle cx="10" cy="15" r="9" fill="#0052CC" opacity="0.9"/>
            <circle cx="20" cy="15" r="9" fill="#4C9AFF" opacity="0.85"/>
          </svg>
          <span style={{ fontWeight: 700, fontSize: '1.0625rem', color: '#fff', letterSpacing: '-0.01em' }}>bahnOS</span>
        </div>

        <div style={{ padding: '28px 28px 32px' }}>
          {loading && (
            <p style={{ color: subtle, fontSize: 14, textAlign: 'center' }}>Loading invite…</p>
          )}

          {!loading && error && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
              <p style={{ color: '#DE350B', fontSize: 14, marginBottom: 20 }}>{error}</p>
              <button onClick={() => navigate('/')} style={{ color: blue, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>
                Go to homepage
              </button>
            </div>
          )}

          {!loading && !error && invite?.expired && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⏰</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: navy, marginBottom: 8 }}>Invite expired</h2>
              <p style={{ fontSize: 13, color: subtle, marginBottom: 20 }}>Ask the project owner to send a new invite.</p>
              <button onClick={() => navigate('/')} style={{ color: blue, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>Go to homepage</button>
            </div>
          )}

          {!loading && !error && invite?.accepted && !accepted && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: navy, marginBottom: 8 }}>Invite already used</h2>
              <p style={{ fontSize: 13, color: subtle, marginBottom: 20 }}>This invite link has already been accepted.</p>
              <button onClick={() => navigate('/canvas')} style={{ background: blue, color: '#fff', border: 'none', borderRadius: 4, padding: '9px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Open App</button>
            </div>
          )}

          {!loading && !error && invite && !invite.expired && !invite.accepted && (
            <>
              {accepted ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: navy, marginBottom: 8 }}>You're in!</h2>
                  <p style={{ fontSize: 13, color: subtle }}>Redirecting to the app…</p>
                </div>
              ) : (
                <>
                  {/* Invite card */}
                  <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: ROLE_COLORS[invite.role] + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 24 }}>
                      🤝
                    </div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: navy, marginBottom: 6 }}>
                      You've been invited
                    </h2>
                    <p style={{ fontSize: 13, color: subtle, lineHeight: 1.6 }}>
                      <strong style={{ color: navy }}>{invite.invitedBy || 'Someone'}</strong> invited you to join
                    </p>
                    <div style={{ margin: '10px 0 8px', padding: '10px 16px', background: '#F0F4FF', borderRadius: 6, border: '1px solid #DBEAFE' }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: navy, margin: 0 }}>{invite.projectName}</p>
                    </div>
                    <span style={{
                      display: 'inline-block', fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 99,
                      background: ROLE_COLORS[invite.role] + '18', color: ROLE_COLORS[invite.role],
                    }}>
                      {ROLE_LABELS[invite.role]} access
                    </span>
                  </div>

                  {error && (
                    <p style={{ fontSize: 12, color: '#DE350B', textAlign: 'center', marginBottom: 12 }}>{error}</p>
                  )}

                  {isAuthenticated ? (
                    <button
                      onClick={handleAccept}
                      disabled={accepting}
                      style={{
                        width: '100%', padding: '10px', borderRadius: 4, fontWeight: 600, fontSize: 14,
                        background: accepting ? '#B3D4FF' : blue, color: '#fff', border: 'none',
                        cursor: accepting ? 'default' : 'pointer',
                      }}
                      onMouseEnter={e => { if (!accepting) e.currentTarget.style.background = blueHover }}
                      onMouseLeave={e => { if (!accepting) e.currentTarget.style.background = blue }}
                    >
                      {accepting ? 'Accepting…' : 'Accept invitation'}
                    </button>
                  ) : (
                    <>
                      <p style={{ fontSize: 12, color: subtle, textAlign: 'center', marginBottom: 14 }}>
                        Sign in or create an account to accept this invitation.
                      </p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={openLogin}
                          style={{ flex: 1, padding: '9px', borderRadius: 4, fontWeight: 600, fontSize: 13, background: blue, color: '#fff', border: 'none', cursor: 'pointer' }}
                          onMouseEnter={e => { e.currentTarget.style.background = blueHover }}
                          onMouseLeave={e => { e.currentTarget.style.background = blue }}
                        >
                          Log in
                        </button>
                        <button
                          onClick={openRegister}
                          style={{ flex: 1, padding: '9px', borderRadius: 4, fontWeight: 600, fontSize: 13, background: bg, color: navy, border: `1.5px solid ${border}`, cursor: 'pointer' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#EBECF0' }}
                          onMouseLeave={e => { e.currentTarget.style.background = bg }}
                        >
                          Sign up
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
