import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { loadCredentials, saveCredentials, getAuthToken } from '../lib/localStorage.js'

// ── Design tokens ──────────────────────────────────────────────────────────
const blue = '#0052CC'
const blueHover = '#0065FF'
const navy = '#172B4D'
const textSubtle = '#5E6C84'
const bg = '#FAFBFC'
const border = '#DFE1E6'
const borderFocus = '#4C9AFF'
const surface = '#FFFFFF'
const errorBg = '#FFEBE6'
const errorBorder = '#FF8F73'
const errorText = '#DE350B'
const successBg = '#E3FCEF'
const successBorder = '#ABF5D1'
const successText = '#006644'

// ── Shared helpers ──────────────────────────────────────────────────────────
function ls(key) { try { return localStorage.getItem(key) } catch { return null } }
function lsSet(key, val) { try { localStorage.setItem(key, val) } catch {} }
function lsJson(key, fallback) { try { return JSON.parse(ls(key) ?? 'null') ?? fallback } catch { return fallback } }
function lsJsonSet(key, val) { lsSet(key, JSON.stringify(val)) }

function uk(userId, suffix) { return `chart-to-jira-${suffix}-${userId}` }

const inputStyle = {
  width: '100%', border: `2px solid ${border}`, borderRadius: 3,
  padding: '8px 10px', fontSize: '0.875rem', color: navy,
  outline: 'none', boxSizing: 'border-box', background: bg,
}

const selectStyle = {
  ...inputStyle,
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235E6C84' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
  paddingRight: 28, cursor: 'pointer',
}

function EyeIcon({ off }) {
  return off ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

function Alert({ type, message, onClose }) {
  const isError = type === 'error'
  return (
    <div style={{
      display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 3, marginBottom: 16,
      background: isError ? errorBg : successBg,
      border: `1px solid ${isError ? errorBorder : successBorder}`,
    }}>
      <span style={{ fontSize: '0.8125rem', color: isError ? errorText : successText, flex: 1 }}>{message}</span>
      {onClose && <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isError ? errorText : successText, fontSize: '1rem', lineHeight: 1, padding: 0 }}>×</button>}
    </div>
  )
}

function SectionHeader({ title, desc }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: navy, margin: 0 }}>{title}</h3>
      {desc && <p style={{ fontSize: '0.8125rem', color: textSubtle, marginTop: 4 }}>{desc}</p>}
    </div>
  )
}

function Toggle({ checked, onChange, label, desc }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, padding: '10px 0', borderBottom: `1px solid ${border}` }}>
      <div>
        <p style={{ fontSize: '0.875rem', fontWeight: 500, color: navy, margin: 0 }}>{label}</p>
        {desc && <p style={{ fontSize: '0.8125rem', color: textSubtle, marginTop: 2 }}>{desc}</p>}
      </div>
      <button onClick={() => onChange(!checked)} style={{
        width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
        background: checked ? blue : '#C1C7D0', flexShrink: 0,
        position: 'relative', transition: 'background 0.15s',
      }}>
        <span style={{
          position: 'absolute', top: 2, left: checked ? 18 : 2,
          width: 16, height: 16, borderRadius: '50%', background: '#fff',
          transition: 'left 0.15s',
        }} />
      </button>
    </div>
  )
}

function SaveBtn({ loading, onClick, label = 'Save changes' }) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      background: loading ? '#B3D4FF' : blue, color: '#fff', border: 'none', borderRadius: 3,
      padding: '8px 18px', fontWeight: 600, fontSize: '0.875rem', cursor: loading ? 'not-allowed' : 'pointer',
    }}
      onMouseEnter={e => { if (!loading) e.currentTarget.style.background = blueHover }}
      onMouseLeave={e => { if (!loading) e.currentTarget.style.background = loading ? '#B3D4FF' : blue }}
    >
      {loading ? 'Saving…' : label}
    </button>
  )
}

// Reusable avatar circle — shows photo if set, initials fallback
function AvatarDisplay({ user, size = 32 }) {
  const initials = user?.email?.slice(0, 2).toUpperCase() || '?'
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', background: blue, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {user?.avatar
        ? <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ color: '#fff', fontWeight: 700, fontSize: size * 0.38 }}>{initials}</span>
      }
    </div>
  )
}

// ── TAB: PROFILE ──────────────────────────────────────────────────────────
function ProfileTab({ user }) {
  const { setAvatar } = useAuth()
  const initials = user?.email?.slice(0, 2).toUpperCase() || '??'
  const [displayName, setDisplayName] = useState(() => ls(`display-name-${user?.id}`) || '')
  const [saved, setSaved] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarSaving, setAvatarSaving] = useState(false)
  const [avatarError, setAvatarError] = useState(null)
  const avatarInputRef = useRef(null)

  function resizeToBase64(file) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        const size = Math.min(img.width, img.height)
        const canvas = document.createElement('canvas')
        canvas.width = 256; canvas.height = 256
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, (img.width - size) / 2, (img.height - size) / 2, size, size, 0, 0, 256, 256)
        resolve(canvas.toDataURL('image/jpeg', 0.88))
      }
      img.onerror = reject
      img.src = url
    })
  }

  async function handleAvatarFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarError(null)
    try {
      const base64 = await resizeToBase64(file)
      setAvatarPreview(base64)
    } catch {
      setAvatarError('Could not read image. Please try another file.')
    }
    e.target.value = ''
  }

  async function handleAvatarSave() {
    if (!avatarPreview) return
    setAvatarSaving(true)
    setAvatarError(null)
    try {
      const token = getAuthToken()
      const res = await fetch('/api/auth/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ avatar: avatarPreview }),
      })
      if (!res.ok) {
        let msg = `Server error (${res.status}) — make sure the backend server is running`
        try { const d = await res.json(); msg = d.error || msg } catch {}
        throw new Error(msg)
      }
      setAvatar(avatarPreview)
      setAvatarPreview(null)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setAvatarError(err.message)
    } finally {
      setAvatarSaving(false)
    }
  }

  async function handleAvatarRemove() {
    setAvatarSaving(true)
    setAvatarError(null)
    try {
      const token = getAuthToken()
      const res = await fetch('/api/auth/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ avatar: null }),
      })
      if (!res.ok) {
        let msg = `Server error (${res.status}) — make sure the backend server is running`
        try { const d = await res.json(); msg = d.error || msg } catch {}
        throw new Error(msg)
      }
      setAvatar(null)
      setAvatarPreview(null)
    } catch { setAvatarError('Could not remove avatar.') }
    finally { setAvatarSaving(false) }
  }

  function handleSave(e) {
    e.preventDefault()
    lsSet(`display-name-${user?.id}`, displayName)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const currentAvatar = avatarPreview || user?.avatar

  return (
    <div>
      <h2 style={{ fontSize: '1rem', fontWeight: 600, color: navy, marginBottom: 20 }}>Profile</h2>

      {/* ── Avatar section ── */}
      <div style={{ marginBottom: 28 }}>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: navy, marginBottom: 12 }}>Profile picture</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Clickable avatar circle */}
          <div style={{ position: 'relative', flexShrink: 0 }} onClick={() => avatarInputRef.current?.click()}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', overflow: 'hidden',
              background: blue, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', border: `3px solid ${surface}`,
              boxShadow: `0 0 0 2px ${border}`,
            }}>
              {currentAvatar
                ? <img src={currentAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.625rem' }}>{initials}</span>
              }
            </div>
            {/* Camera badge */}
            <div style={{
              position: 'absolute', bottom: 1, right: 1,
              width: 24, height: 24, borderRadius: '50%', background: blue,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `2px solid ${surface}`, cursor: 'pointer', pointerEvents: 'none',
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={() => avatarInputRef.current?.click()} style={{
              background: bg, border: `1px solid ${border}`, borderRadius: 3,
              padding: '6px 14px', fontSize: '0.8125rem', fontWeight: 600,
              color: navy, cursor: 'pointer',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#EBECF0' }}
              onMouseLeave={e => { e.currentTarget.style.background = bg }}
            >
              {currentAvatar ? 'Change photo' : 'Upload photo'}
            </button>
            {(currentAvatar) && (
              <button onClick={avatarPreview ? () => setAvatarPreview(null) : handleAvatarRemove}
                disabled={avatarSaving}
                style={{ background: 'none', border: 'none', padding: '2px 0', fontSize: '0.8125rem', color: '#DE350B', cursor: 'pointer', textAlign: 'left' }}
              >
                {avatarPreview ? 'Cancel' : 'Remove photo'}
              </button>
            )}
            {avatarPreview && (
              <SaveBtn loading={avatarSaving} onClick={handleAvatarSave} label="Save photo" />
            )}
            <p style={{ fontSize: '0.75rem', color: textSubtle, margin: 0 }}>JPG, PNG or GIF. Max 500KB.</p>
          </div>
        </div>
        {avatarError && <p style={{ marginTop: 8, fontSize: '0.8125rem', color: '#DE350B' }}>{avatarError}</p>}
      </div>

      <div style={{ height: 1, background: border, marginBottom: 24 }} />

      {/* ── Name & email ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, padding: '16px 20px', background: bg, border: `1px solid ${border}`, borderRadius: 3 }}>
        <AvatarDisplay user={user} size={48} />
        <div>
          <p style={{ fontWeight: 600, color: navy, marginBottom: 2, fontSize: '0.9375rem' }}>{displayName || user?.email}</p>
          <p style={{ fontSize: '0.8125rem', color: textSubtle }}>bahnOS account</p>
        </div>
      </div>
      {saved && <Alert type="success" message="Profile saved." />}
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: navy, marginBottom: 4 }}>Email address</label>
          <input type="email" value={user?.email || ''} disabled style={{ ...inputStyle, background: '#F4F5F7', color: textSubtle, cursor: 'not-allowed' }} />
          <p style={{ marginTop: 4, fontSize: '0.75rem', color: textSubtle }}>Email cannot be changed.</p>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: navy, marginBottom: 4 }}>Display name</label>
          <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="How you appear to collaborators" style={inputStyle}
            onFocus={e => { e.currentTarget.style.borderColor = borderFocus; e.currentTarget.style.background = surface }}
            onBlur={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.background = bg }}
          />
        </div>
        <div><SaveBtn onClick={handleSave} /></div>
      </form>
      <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarFile} />
    </div>
  )
}

// ── TAB: JIRA ─────────────────────────────────────────────────────────────
const EMPTY_WS = { id: '', name: '', baseUrl: '', email: '', apiToken: '', projectKey: '', projectType: 'scrum' }

function JiraTab({ user }) {
  const uid = user?.id
  const [workspaces, setWorkspaces] = useState(() => lsJson(uk(uid, 'workspaces'), []))
  const [activeWsId, setActiveWsId] = useState(() => ls(uk(uid, 'active-workspace')) || '')
  const [editWs, setEditWs] = useState(null) // null | workspace object (new or existing)
  const [showToken, setShowToken] = useState(false)
  const [defaultJql, setDefaultJql] = useState(() => ls(uk(uid, 'default-jql')) || '')
  const [sprintAutoSelect, setSprintAutoSelect] = useState(() => ls(uk(uid, 'sprint-autoselect')) === '1')
  const [syncConflict, setSyncConflict] = useState(() => ls(uk(uid, 'sync-conflict')) || 'ask')
  const [saved, setSaved] = useState('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

  function persistWorkspaces(wsList) {
    setWorkspaces(wsList)
    lsJsonSet(uk(uid, 'workspaces'), wsList)
  }

  function activateWorkspace(ws) {
    setActiveWsId(ws.id)
    lsSet(uk(uid, 'active-workspace'), ws.id)
    saveCredentials({ baseUrl: ws.baseUrl, email: ws.email, apiToken: ws.apiToken, projectKey: ws.projectKey, projectType: ws.projectType }, uid)
    setSaved('Workspace activated.')
    setTimeout(() => setSaved(''), 2500)
  }

  function saveWorkspace() {
    if (!editWs.name || !editWs.baseUrl || !editWs.email || !editWs.apiToken) return
    const ws = editWs.id ? editWs : { ...editWs, id: crypto.randomUUID() }
    const exists = workspaces.find(w => w.id === ws.id)
    const updated = exists ? workspaces.map(w => w.id === ws.id ? ws : w) : [...workspaces, ws]
    persistWorkspaces(updated)
    setEditWs(null)
    setSaved('Workspace saved.')
    setTimeout(() => setSaved(''), 2500)
  }

  function deleteWorkspace(id) {
    persistWorkspaces(workspaces.filter(w => w.id !== id))
    if (activeWsId === id) {
      setActiveWsId('')
      lsSet(uk(uid, 'active-workspace'), '')
    }
  }

  async function testConnection(ws) {
    setTesting(true); setTestResult(null)
    try {
      const credentials = btoa(`${ws.email}:${ws.apiToken}`)
      const res = await fetch(`/api/jira/proxy?url=${encodeURIComponent(`${ws.baseUrl.replace(/\/$/, '')}/rest/api/3/myself`)}`, {
        headers: { 'X-Jira-Auth': `Basic ${credentials}` },
      })
      if (res.ok) { const d = await res.json(); setTestResult({ ok: true, message: `Connected as ${d.displayName || ws.email}` }) }
      else setTestResult({ ok: false, message: 'Connection failed — check credentials.' })
    } catch { setTestResult({ ok: false, message: 'Network error.' }) }
    finally { setTesting(false) }
  }

  function savePrefs() {
    lsSet(uk(uid, 'default-jql'), defaultJql)
    lsSet(uk(uid, 'sprint-autoselect'), sprintAutoSelect ? '1' : '0')
    lsSet(uk(uid, 'sync-conflict'), syncConflict)
    setSaved('Preferences saved.')
    setTimeout(() => setSaved(''), 2500)
  }

  return (
    <div>
      <h2 style={{ fontSize: '1rem', fontWeight: 600, color: navy, marginBottom: 4 }}>Jira Connection</h2>
      <p style={{ fontSize: '0.8125rem', color: textSubtle, marginBottom: 24 }}>Manage multiple Jira workspaces and sync preferences.</p>

      {saved && <Alert type="success" message={saved} onClose={() => setSaved('')} />}
      {testResult && <Alert type={testResult.ok ? 'success' : 'error'} message={testResult.message} onClose={() => setTestResult(null)} />}

      {/* Workspaces list */}
      <SectionHeader title="Workspaces" desc="Switch between multiple Jira instances or organisations." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {workspaces.length === 0 && <p style={{ fontSize: '0.8125rem', color: textSubtle, padding: '12px 0' }}>No workspaces yet. Add one below.</p>}
        {workspaces.map(ws => (
          <div key={ws.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: activeWsId === ws.id ? '#DEEBFF' : bg, border: `1px solid ${activeWsId === ws.id ? '#4C9AFF' : border}`, borderRadius: 3 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, fontSize: '0.875rem', color: navy, margin: 0 }}>{ws.name}</p>
              <p style={{ fontSize: '0.75rem', color: textSubtle, margin: '2px 0 0' }}>{ws.baseUrl}</p>
            </div>
            {activeWsId === ws.id && <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: blue, background: '#DEEBFF', border: `1px solid #4C9AFF`, borderRadius: 3, padding: '2px 7px' }}>ACTIVE</span>}
            <button onClick={() => activateWorkspace(ws)} style={{ fontSize: '0.75rem', fontWeight: 600, color: blue, background: 'none', border: `1px solid ${border}`, borderRadius: 3, padding: '4px 10px', cursor: 'pointer' }}>Use</button>
            <button onClick={() => { setEditWs(ws); setTestResult(null) }} style={{ fontSize: '0.75rem', color: textSubtle, background: 'none', border: `1px solid ${border}`, borderRadius: 3, padding: '4px 8px', cursor: 'pointer' }}>Edit</button>
            <button onClick={() => testConnection(ws)} disabled={testing} style={{ fontSize: '0.75rem', color: textSubtle, background: 'none', border: `1px solid ${border}`, borderRadius: 3, padding: '4px 8px', cursor: 'pointer' }}>Test</button>
            <button onClick={() => deleteWorkspace(ws.id)} style={{ fontSize: '0.75rem', color: errorText, background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>✕</button>
          </div>
        ))}
      </div>
      <button onClick={() => setEditWs({ ...EMPTY_WS })} style={{ fontSize: '0.8125rem', fontWeight: 600, color: blue, background: 'none', border: `1px dashed ${border}`, borderRadius: 3, padding: '8px 16px', cursor: 'pointer', width: '100%' }}>
        + Add workspace
      </button>

      {/* Edit / Add form */}
      {editWs && (
        <div style={{ marginTop: 20, padding: '20px', background: bg, border: `1px solid ${border}`, borderRadius: 3 }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: navy, marginBottom: 16 }}>{editWs.id ? 'Edit workspace' : 'New workspace'}</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: navy, marginBottom: 4 }}>Workspace name</label>
              <input value={editWs.name} onChange={e => setEditWs(w => ({ ...w, name: e.target.value }))} placeholder="e.g. Work — Acme Corp" style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = borderFocus; e.currentTarget.style.background = surface }}
                onBlur={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.background = bg }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: navy, marginBottom: 4 }}>Base URL</label>
              <input type="url" value={editWs.baseUrl} onChange={e => setEditWs(w => ({ ...w, baseUrl: e.target.value }))} placeholder="https://your-org.atlassian.net" style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = borderFocus; e.currentTarget.style.background = surface }}
                onBlur={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.background = bg }} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: navy, marginBottom: 4 }}>Atlassian email</label>
                <input type="email" value={editWs.email} onChange={e => setEditWs(w => ({ ...w, email: e.target.value }))} placeholder="you@company.com" style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = borderFocus; e.currentTarget.style.background = surface }}
                  onBlur={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.background = bg }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: navy, marginBottom: 4 }}>Project key</label>
                <input value={editWs.projectKey} onChange={e => setEditWs(w => ({ ...w, projectKey: e.target.value }))} placeholder="PROJ" style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = borderFocus; e.currentTarget.style.background = surface }}
                  onBlur={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.background = bg }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: navy, marginBottom: 4 }}>API token</label>
              <div style={{ position: 'relative' }}>
                <input type={showToken ? 'text' : 'password'} value={editWs.apiToken} onChange={e => setEditWs(w => ({ ...w, apiToken: e.target.value }))} placeholder="Atlassian API token" style={{ ...inputStyle, paddingRight: 38 }}
                  onFocus={e => { e.currentTarget.style.borderColor = borderFocus; e.currentTarget.style.background = surface }}
                  onBlur={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.background = bg }} />
                <button type="button" onClick={() => setShowToken(v => !v)} tabIndex={-1} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: textSubtle, display: 'flex' }}>
                  <EyeIcon off={showToken} />
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
              <SaveBtn onClick={saveWorkspace} label="Save workspace" />
              <button onClick={() => setEditWs(null)} style={{ background: bg, color: navy, border: `2px solid ${border}`, borderRadius: 3, padding: '8px 14px', fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ height: 1, background: border, margin: '28px 0' }} />

      {/* Preferences */}
      <SectionHeader title="Sync preferences" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: navy, marginBottom: 4 }}>
            Default JQL filter
          </label>
          <input value={defaultJql} onChange={e => setDefaultJql(e.target.value)} placeholder="e.g. assignee = currentUser() AND sprint in openSprints()" style={inputStyle}
            onFocus={e => { e.currentTarget.style.borderColor = borderFocus; e.currentTarget.style.background = surface }}
            onBlur={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.background = bg }} />
          <p style={{ marginTop: 4, fontSize: '0.75rem', color: textSubtle }}>Pre-filled when you open the Jira panel.</p>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: navy, marginBottom: 8 }}>
            Sync conflict resolution
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['ask', 'Always ask'], ['jira', 'Jira wins'], ['canvas', 'Canvas wins']].map(([val, label]) => (
              <button key={val} onClick={() => setSyncConflict(val)} style={{
                flex: 1, padding: '7px 8px', borderRadius: 3, fontSize: '0.8125rem', fontWeight: 500,
                border: `2px solid ${syncConflict === val ? blue : border}`,
                background: syncConflict === val ? '#DEEBFF' : bg,
                color: syncConflict === val ? blue : navy, cursor: 'pointer',
              }}>{label}</button>
            ))}
          </div>
          <p style={{ marginTop: 6, fontSize: '0.75rem', color: textSubtle }}>When a node exists in both Jira and the canvas with different data.</p>
        </div>
        <Toggle checked={sprintAutoSelect} onChange={setSprintAutoSelect} label="Auto-select active sprint" desc="Automatically use the current open sprint when syncing." />
      </div>
      <SaveBtn onClick={savePrefs} label="Save preferences" />
    </div>
  )
}

// ── TAB: CANVAS PREFERENCES ────────────────────────────────────────────────
const SHAPES = ['rect', 'rounded', 'pill', 'diamond', 'ellipse', 'hexagon']
const STATUS_COLORS = ['#0052CC', '#00875A', '#FF8B00', '#DE350B', '#5E6C84', '#172B4D', '#6554C0']
const FONT_SIZES = [10, 11, 12, 13, 14, 16]

function CanvasTab({ user }) {
  const uid = user?.id
  const [nodeStyle, setNodeStyle] = useState(() => lsJson(uk(uid, 'node-style'), { shape: 'rounded', color: '#0052CC', fontSize: 12 }))
  const [defaultZoom, setDefaultZoom] = useState(() => Number(ls(uk(uid, 'default-zoom')) || 100))
  const [layoutAlgo, setLayoutAlgo] = useState(() => ls(uk(uid, 'layout-algo')) || 'hierarchical')
  const [autoSaveInterval, setAutoSaveInterval] = useState(() => Number(ls(uk(uid, 'autosave-interval')) || 2000))
  const [saved, setSaved] = useState(false)

  function handleSave() {
    lsJsonSet(uk(uid, 'node-style'), nodeStyle)
    lsSet(uk(uid, 'default-zoom'), String(defaultZoom))
    lsSet(uk(uid, 'layout-algo'), layoutAlgo)
    lsSet(uk(uid, 'autosave-interval'), String(autoSaveInterval))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div>
      <h2 style={{ fontSize: '1rem', fontWeight: 600, color: navy, marginBottom: 20 }}>Canvas Preferences</h2>
      {saved && <Alert type="success" message="Canvas preferences saved." />}

      <SectionHeader title="Default node style" desc="Applied when you create a new node from scratch." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: navy, marginBottom: 8 }}>Shape</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SHAPES.map(s => (
              <button key={s} onClick={() => setNodeStyle(n => ({ ...n, shape: s }))} style={{
                padding: '6px 14px', borderRadius: 3, fontSize: '0.8125rem', fontWeight: 500,
                border: `2px solid ${nodeStyle.shape === s ? blue : border}`,
                background: nodeStyle.shape === s ? '#DEEBFF' : bg,
                color: nodeStyle.shape === s ? blue : navy, cursor: 'pointer',
              }}>{s}</button>
            ))}
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: navy, marginBottom: 8 }}>Default color</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {STATUS_COLORS.map(c => (
              <button key={c} onClick={() => setNodeStyle(n => ({ ...n, color: c }))} style={{
                width: 28, height: 28, borderRadius: '50%', background: c, border: nodeStyle.color === c ? `3px solid ${navy}` : `3px solid transparent`, cursor: 'pointer',
              }} />
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="color" value={nodeStyle.color} onChange={e => setNodeStyle(n => ({ ...n, color: e.target.value }))} style={{ width: 28, height: 28, border: 'none', cursor: 'pointer', background: 'none', padding: 0 }} />
              <span style={{ fontSize: '0.75rem', color: textSubtle }}>Custom</span>
            </div>
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: navy, marginBottom: 8 }}>Font size</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {FONT_SIZES.map(f => (
              <button key={f} onClick={() => setNodeStyle(n => ({ ...n, fontSize: f }))} style={{
                width: 40, padding: '5px 0', borderRadius: 3, fontSize: '0.8125rem',
                border: `2px solid ${nodeStyle.fontSize === f ? blue : border}`,
                background: nodeStyle.fontSize === f ? '#DEEBFF' : bg,
                color: nodeStyle.fontSize === f ? blue : navy, cursor: 'pointer',
              }}>{f}</button>
            ))}
          </div>
        </div>
        {/* Preview */}
        <div style={{ padding: '12px 16px', background: '#F8FAFC', border: `1px solid ${border}`, borderRadius: 3 }}>
          <p style={{ fontSize: '0.75rem', color: textSubtle, marginBottom: 8 }}>Preview</p>
          <div style={{ display: 'inline-flex', padding: '8px 16px', background: nodeStyle.color, borderRadius: nodeStyle.shape === 'pill' ? 20 : nodeStyle.shape === 'rounded' ? 6 : nodeStyle.shape === 'diamond' ? 0 : 3, color: '#fff', fontSize: nodeStyle.fontSize, fontWeight: 500 }}>
            Example node
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: border, margin: '4px 0 24px' }} />
      <SectionHeader title="Zoom & layout" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: navy, marginBottom: 4 }}>
            Default zoom level <span style={{ fontWeight: 400, color: textSubtle }}>({defaultZoom}%)</span>
          </label>
          <input type="range" min={25} max={200} step={5} value={defaultZoom} onChange={e => setDefaultZoom(Number(e.target.value))} style={{ width: '100%' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: textSubtle, marginTop: 2 }}>
            <span>25%</span><span>100%</span><span>200%</span>
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: navy, marginBottom: 8 }}>Preferred layout algorithm</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['hierarchical', 'Hierarchical (top-down)'], ['radial', 'Radial (mind map)']].map(([val, label]) => (
              <button key={val} onClick={() => setLayoutAlgo(val)} style={{
                flex: 1, padding: '7px 8px', borderRadius: 3, fontSize: '0.8125rem', fontWeight: 500,
                border: `2px solid ${layoutAlgo === val ? blue : border}`,
                background: layoutAlgo === val ? '#DEEBFF' : bg,
                color: layoutAlgo === val ? blue : navy, cursor: 'pointer',
              }}>{label}</button>
            ))}
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: navy, marginBottom: 4 }}>
            Auto-save debounce <span style={{ fontWeight: 400, color: textSubtle }}>({autoSaveInterval / 1000}s after last change)</span>
          </label>
          <input type="range" min={500} max={10000} step={500} value={autoSaveInterval} onChange={e => setAutoSaveInterval(Number(e.target.value))} style={{ width: '100%' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: textSubtle, marginTop: 2 }}>
            <span>0.5s</span><span>5s</span><span>10s</span>
          </div>
        </div>
      </div>

      <SaveBtn onClick={handleSave} />
    </div>
  )
}

// ── TAB: WORKFLOW ─────────────────────────────────────────────────────────
const DEFAULT_STATUSES = [
  { key: 'todo', label: 'To Do', color: '#5E6C84' },
  { key: 'in-progress', label: 'In Progress', color: '#0052CC' },
  { key: 'done', label: 'Done', color: '#00875A' },
  { key: 'blocked', label: 'Blocked', color: '#DE350B' },
  { key: 'review', label: 'In Review', color: '#FF8B00' },
]

function WorkflowTab({ user }) {
  const uid = user?.id
  const [statuses, setStatuses] = useState(() => lsJson(uk(uid, 'status-map'), DEFAULT_STATUSES))
  const [adding, setAdding] = useState(false)
  const [newStatus, setNewStatus] = useState({ key: '', label: '', color: '#6554C0' })
  const [saved, setSaved] = useState(false)

  function handleSave() {
    lsJsonSet(uk(uid, 'status-map'), statuses)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function addStatus() {
    if (!newStatus.key || !newStatus.label) return
    setStatuses(s => [...s, { ...newStatus, key: newStatus.key.toLowerCase().replace(/\s+/g, '-') }])
    setNewStatus({ key: '', label: '', color: '#6554C0' })
    setAdding(false)
  }

  function updateStatus(idx, field, val) {
    setStatuses(s => s.map((item, i) => i === idx ? { ...item, [field]: val } : item))
  }

  function removeStatus(idx) {
    setStatuses(s => s.filter((_, i) => i !== idx))
  }

  return (
    <div>
      <h2 style={{ fontSize: '1rem', fontWeight: 600, color: navy, marginBottom: 4 }}>Workflow & Status Mapping</h2>
      <p style={{ fontSize: '0.8125rem', color: textSubtle, marginBottom: 20 }}>
        Map your Jira workflow statuses to display labels and colors in the canvas.
      </p>
      {saved && <Alert type="success" message="Status map saved." />}

      <div style={{ border: `1px solid ${border}`, borderRadius: 3, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 40px', padding: '8px 14px', background: bg, borderBottom: `1px solid ${border}`, fontSize: '0.75rem', fontWeight: 600, color: textSubtle }}>
          <span>Color</span><span>Jira status key</span><span>Display label</span><span></span>
        </div>
        {statuses.map((s, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 40px', alignItems: 'center', gap: 8, padding: '8px 14px', borderBottom: i < statuses.length - 1 ? `1px solid ${border}` : 'none', background: surface }}>
            <input type="color" value={s.color} onChange={e => updateStatus(i, 'color', e.target.value)} style={{ width: 28, height: 28, border: 'none', cursor: 'pointer', padding: 0, background: 'none' }} />
            <input value={s.key} onChange={e => updateStatus(i, 'key', e.target.value)} style={{ ...inputStyle, padding: '5px 8px', fontSize: '0.8125rem' }}
              onFocus={e => { e.currentTarget.style.borderColor = borderFocus }}
              onBlur={e => { e.currentTarget.style.borderColor = border }} />
            <input value={s.label} onChange={e => updateStatus(i, 'label', e.target.value)} style={{ ...inputStyle, padding: '5px 8px', fontSize: '0.8125rem' }}
              onFocus={e => { e.currentTarget.style.borderColor = borderFocus }}
              onBlur={e => { e.currentTarget.style.borderColor = border }} />
            <button onClick={() => removeStatus(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: errorText, fontSize: '1rem' }}>✕</button>
          </div>
        ))}
      </div>

      {adding ? (
        <div style={{ padding: '12px 14px', background: bg, border: `1px solid ${border}`, borderRadius: 3, marginBottom: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr', gap: 8, alignItems: 'center', marginBottom: 10 }}>
            <input type="color" value={newStatus.color} onChange={e => setNewStatus(s => ({ ...s, color: e.target.value }))} style={{ width: 28, height: 28, border: 'none', cursor: 'pointer', padding: 0, background: 'none' }} />
            <input value={newStatus.key} onChange={e => setNewStatus(s => ({ ...s, key: e.target.value }))} placeholder="status-key" style={{ ...inputStyle, padding: '5px 8px', fontSize: '0.8125rem' }}
              onFocus={e => { e.currentTarget.style.borderColor = borderFocus }}
              onBlur={e => { e.currentTarget.style.borderColor = border }} />
            <input value={newStatus.label} onChange={e => setNewStatus(s => ({ ...s, label: e.target.value }))} placeholder="Display label" style={{ ...inputStyle, padding: '5px 8px', fontSize: '0.8125rem' }}
              onFocus={e => { e.currentTarget.style.borderColor = borderFocus }}
              onBlur={e => { e.currentTarget.style.borderColor = border }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addStatus} style={{ background: blue, color: '#fff', border: 'none', borderRadius: 3, padding: '6px 14px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>Add</button>
            <button onClick={() => setAdding(false)} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 3, padding: '6px 12px', fontSize: '0.8125rem', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ fontSize: '0.8125rem', fontWeight: 600, color: blue, background: 'none', border: `1px dashed ${border}`, borderRadius: 3, padding: '7px 16px', cursor: 'pointer', marginBottom: 16 }}>
          + Add status
        </button>
      )}
      <div><SaveBtn onClick={handleSave} /></div>
    </div>
  )
}

// ── TAB: SHORTCUTS ────────────────────────────────────────────────────────
const DEFAULT_SHORTCUTS = [
  { action: 'addChild', label: 'Add child node', key: 'Tab' },
  { action: 'deleteNode', label: 'Delete node', key: 'Delete' },
  { action: 'editNode', label: 'Edit node (rename)', key: 'Enter' },
  { action: 'undo', label: 'Undo', key: '⌘Z' },
  { action: 'redo', label: 'Redo', key: '⌘⇧Z' },
  { action: 'fitScreen', label: 'Fit to screen', key: 'F' },
  { action: 'presentationMode', label: 'Presentation mode', key: 'P' },
  { action: 'search', label: 'Search nodes', key: '/' },
  { action: 'shortcuts', label: 'Show shortcuts', key: '?' },
  { action: 'escape', label: 'Deselect / close panel', key: 'Escape' },
  { action: 'zoomIn', label: 'Zoom in', key: '=' },
  { action: 'zoomOut', label: 'Zoom out', key: '-' },
]

function ShortcutsTab({ user }) {
  const uid = user?.id
  const [shortcuts, setShortcuts] = useState(() => lsJson(uk(uid, 'shortcuts'), DEFAULT_SHORTCUTS))
  const [editing, setEditing] = useState(null)
  const [saved, setSaved] = useState(false)

  function captureKey(action, e) {
    e.preventDefault()
    const parts = []
    if (e.metaKey || e.ctrlKey) parts.push('⌘')
    if (e.shiftKey) parts.push('⇧')
    if (e.altKey) parts.push('⌥')
    const key = e.key === ' ' ? 'Space' : e.key.length === 1 ? e.key.toUpperCase() : e.key
    if (!['Meta', 'Control', 'Shift', 'Alt'].includes(e.key)) parts.push(key)
    const combo = parts.join('')
    if (!combo) return
    setShortcuts(s => s.map(sc => sc.action === action ? { ...sc, key: combo } : sc))
    setEditing(null)
  }

  function resetToDefault(action) {
    const def = DEFAULT_SHORTCUTS.find(s => s.action === action)
    if (def) setShortcuts(s => s.map(sc => sc.action === action ? { ...sc, key: def.key } : sc))
  }

  function handleSave() {
    lsJsonSet(uk(uid, 'shortcuts'), shortcuts)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function resetAll() {
    setShortcuts(DEFAULT_SHORTCUTS)
  }

  return (
    <div>
      <h2 style={{ fontSize: '1rem', fontWeight: 600, color: navy, marginBottom: 4 }}>Keyboard Shortcuts</h2>
      <p style={{ fontSize: '0.8125rem', color: textSubtle, marginBottom: 20 }}>
        Remap any shortcut to your own keys. Click a key badge to record a new one.
      </p>
      {saved && <Alert type="success" message="Shortcuts saved. Reload the app to apply changes." />}

      <div style={{ border: `1px solid ${border}`, borderRadius: 3, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', padding: '8px 14px', background: bg, borderBottom: `1px solid ${border}`, fontSize: '0.75rem', fontWeight: 600, color: textSubtle }}>
          <span>Action</span><span>Key</span><span></span>
        </div>
        {shortcuts.map((sc, i) => (
          <div key={sc.action} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'center', gap: 12, padding: '9px 14px', borderBottom: i < shortcuts.length - 1 ? `1px solid ${border}` : 'none', background: surface }}>
            <span style={{ fontSize: '0.875rem', color: navy }}>{sc.label}</span>
            {editing === sc.action ? (
              <button
                onKeyDown={e => captureKey(sc.action, e)}
                autoFocus
                style={{ padding: '4px 12px', borderRadius: 3, fontSize: '0.8125rem', fontWeight: 600, border: `2px solid ${blue}`, background: '#DEEBFF', color: blue, cursor: 'text', outline: 'none', minWidth: 80 }}
              >
                Press key…
              </button>
            ) : (
              <button onClick={() => setEditing(sc.action)} style={{ padding: '4px 10px', borderRadius: 3, fontSize: '0.8125rem', fontWeight: 600, background: '#F4F5F7', color: navy, border: `1px solid ${border}`, cursor: 'pointer', minWidth: 60, textAlign: 'center' }}>
                {sc.key}
              </button>
            )}
            <button onClick={() => resetToDefault(sc.action)} style={{ fontSize: '0.75rem', color: textSubtle, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Reset</button>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <SaveBtn onClick={handleSave} />
        <button onClick={resetAll} style={{ background: bg, color: navy, border: `2px solid ${border}`, borderRadius: 3, padding: '8px 14px', fontSize: '0.875rem', cursor: 'pointer' }}>Reset all to defaults</button>
      </div>
    </div>
  )
}

// ── TAB: INTEGRATIONS ─────────────────────────────────────────────────────
function IntegrationsTab({ user }) {
  const uid = user?.id
  const [slackWebhook, setSlackWebhook] = useState(() => ls(uk(uid, 'slack-webhook')) || '')
  const [digestEnabled, setDigestEnabled] = useState(() => ls(uk(uid, 'digest-enabled')) === '1')
  const [digestTime, setDigestTime] = useState(() => ls(uk(uid, 'digest-time')) || '09:00')
  const [pushEnabled, setPushEnabled] = useState(() => ls(uk(uid, 'push-notifs')) === '1')
  const [pushStatus, setPushStatus] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported')
  const [zapierSlug] = useState(() => {
    const existing = ls(uk(uid, 'zapier-slug'))
    if (existing) return existing
    const slug = crypto.randomUUID()
    lsSet(uk(uid, 'zapier-slug'), slug)
    return slug
  })
  const [slackTesting, setSlackTesting] = useState(false)
  const [slackResult, setSlackResult] = useState(null)
  const [saved, setSaved] = useState('')
  const [copied, setCopied] = useState(false)

  async function requestPushPermission() {
    if (typeof Notification === 'undefined') return
    const result = await Notification.requestPermission()
    setPushStatus(result)
    if (result === 'granted') {
      setPushEnabled(true)
      lsSet(uk(uid, 'push-notifs'), '1')
      new Notification('bahnOS', { body: 'Push notifications enabled!', icon: '/favicon.ico' })
    }
  }

  async function testSlack() {
    if (!slackWebhook) return
    setSlackTesting(true); setSlackResult(null)
    try {
      const res = await fetch('/api/integrations/slack-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: slackWebhook }),
      })
      setSlackResult(res.ok ? { ok: true, message: 'Test message sent to Slack!' } : { ok: false, message: 'Failed — check your webhook URL.' })
    } catch { setSlackResult({ ok: false, message: 'Network error.' }) }
    setSlackTesting(false)
  }

  function copyZapierUrl() {
    const url = `${window.location.origin}/api/webhooks/${zapierSlug}`
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  function handleSave() {
    lsSet(uk(uid, 'slack-webhook'), slackWebhook)
    lsSet(uk(uid, 'digest-enabled'), digestEnabled ? '1' : '0')
    lsSet(uk(uid, 'digest-time'), digestTime)
    lsSet(uk(uid, 'push-notifs'), pushEnabled ? '1' : '0')
    setSaved('Integrations saved.')
    setTimeout(() => setSaved(''), 2500)
  }

  const zapierUrl = `${window.location.origin}/api/webhooks/${zapierSlug}`

  return (
    <div>
      <h2 style={{ fontSize: '1rem', fontWeight: 600, color: navy, marginBottom: 20 }}>Integrations</h2>
      {saved && <Alert type="success" message={saved} />}

      {/* Slack */}
      <SectionHeader title="Slack notifications" desc="Get a DM when someone comments on your nodes or updates your assignments." />
      {slackResult && <Alert type={slackResult.ok ? 'success' : 'error'} message={slackResult.message} onClose={() => setSlackResult(null)} />}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: navy, marginBottom: 4 }}>Incoming webhook URL</label>
        <input type="url" value={slackWebhook} onChange={e => setSlackWebhook(e.target.value)} placeholder="https://hooks.slack.com/services/…" style={inputStyle}
          onFocus={e => { e.currentTarget.style.borderColor = borderFocus; e.currentTarget.style.background = surface }}
          onBlur={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.background = bg }} />
        <p style={{ marginTop: 4, fontSize: '0.75rem', color: textSubtle }}>
          Create at <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noreferrer" style={{ color: blue }}>api.slack.com/messaging/webhooks</a>.
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button onClick={testSlack} disabled={slackTesting || !slackWebhook} style={{ background: bg, color: navy, border: `2px solid ${border}`, borderRadius: 3, padding: '7px 14px', fontSize: '0.8125rem', cursor: slackWebhook ? 'pointer' : 'not-allowed', opacity: slackWebhook ? 1 : 0.5 }}>
            {slackTesting ? 'Sending…' : 'Send test message'}
          </button>
        </div>
      </div>

      <div style={{ height: 1, background: border, margin: '4px 0 24px' }} />

      {/* Daily digest */}
      <SectionHeader title="Daily digest email" desc="A morning summary of changes, due dates, and stale issues." />
      <div style={{ marginBottom: 24 }}>
        <Toggle checked={digestEnabled} onChange={setDigestEnabled} label="Enable daily digest" desc="Sent to your account email every morning." />
        {digestEnabled && (
          <div style={{ marginTop: 14 }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: navy, marginBottom: 4 }}>Send at</label>
            <input type="time" value={digestTime} onChange={e => setDigestTime(e.target.value)} style={{ ...inputStyle, width: 'auto' }}
              onFocus={e => { e.currentTarget.style.borderColor = borderFocus }}
              onBlur={e => { e.currentTarget.style.borderColor = border }} />
            <p style={{ marginTop: 4, fontSize: '0.75rem', color: textSubtle }}>Times based on your schedule timezone (set in Schedule tab).</p>
          </div>
        )}
      </div>

      <div style={{ height: 1, background: border, margin: '4px 0 24px' }} />

      {/* Push notifications */}
      <SectionHeader title="Browser push notifications" desc="Desktop alerts for @mentions and node assignment changes." />
      <div style={{ marginBottom: 24 }}>
        {pushStatus === 'unsupported' ? (
          <p style={{ fontSize: '0.8125rem', color: textSubtle }}>Your browser does not support push notifications.</p>
        ) : pushStatus === 'denied' ? (
          <div style={{ padding: '10px 14px', background: errorBg, border: `1px solid ${errorBorder}`, borderRadius: 3 }}>
            <p style={{ fontSize: '0.8125rem', color: errorText }}>Notifications are blocked. Allow them in browser site settings, then try again.</p>
          </div>
        ) : pushStatus === 'granted' ? (
          <Toggle checked={pushEnabled} onChange={v => { setPushEnabled(v); lsSet(uk(uid, 'push-notifs'), v ? '1' : '0') }} label="Push notifications active" desc="You'll receive desktop alerts for activity." />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <p style={{ fontSize: '0.8125rem', color: textSubtle, flex: 1 }}>Permission not yet granted.</p>
            <button onClick={requestPushPermission} style={{ background: blue, color: '#fff', border: 'none', borderRadius: 3, padding: '7px 14px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer' }}>
              Enable notifications
            </button>
          </div>
        )}
      </div>

      <div style={{ height: 1, background: border, margin: '4px 0 24px' }} />

      {/* Zapier / Make */}
      <SectionHeader title="Zapier / Make webhook endpoint" desc="Trigger automations externally. POST JSON to this URL to create nodes or update issues." />
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input value={zapierUrl} readOnly style={{ ...inputStyle, flex: 1, background: '#F4F5F7', color: textSubtle, cursor: 'text', fontFamily: 'monospace', fontSize: '0.8125rem' }} />
          <button onClick={copyZapierUrl} style={{
            background: copied ? successBg : bg, color: copied ? successText : navy,
            border: `2px solid ${copied ? successBorder : border}`, borderRadius: 3,
            padding: '8px 14px', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0,
          }}>
            {copied ? '✓ Copied' : 'Copy URL'}
          </button>
        </div>
        <p style={{ marginTop: 6, fontSize: '0.75rem', color: textSubtle }}>
          Use <code style={{ background: '#F4F5F7', padding: '1px 5px', borderRadius: 3 }}>POST</code> with <code style={{ background: '#F4F5F7', padding: '1px 5px', borderRadius: 3 }}>{'{"action":"create","title":"…"}'}</code>. Auth token passed as <code style={{ background: '#F4F5F7', padding: '1px 5px', borderRadius: 3 }}>X-Webhook-Token</code> header.
        </p>
      </div>

      <SaveBtn onClick={handleSave} />
    </div>
  )
}

// ── TAB: SCHEDULE & FOCUS ─────────────────────────────────────────────────
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_INDICES = [1, 2, 3, 4, 5, 6, 0]
const HOURS = Array.from({ length: 24 }, (_, i) => i)

function fmt12(h) {
  if (h === 0) return '12 AM'
  if (h < 12) return `${h} AM`
  if (h === 12) return '12 PM'
  return `${h - 12} PM`
}

const TIMEZONES = Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : [
  'UTC', 'America/New_York', 'America/Los_Angeles', 'America/Chicago', 'America/Denver',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai',
  'Australia/Sydney', 'Pacific/Auckland',
]

function ScheduleTab({ user }) {
  const uid = user?.id
  const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const [schedule, setSchedule] = useState(() => lsJson(uk(uid, 'schedule'), {
    timezone: detectedTz, workDays: [1, 2, 3, 4, 5], startHour: 9, endHour: 17,
  }))
  const [focusPreset, setFocusPreset] = useState(() => lsJson(uk(uid, 'focus-preset'), { assignee: '', status: '', label: 'My work' }))
  const [sprintQuota, setSprintQuota] = useState(() => Number(ls(uk(uid, 'sprint-quota')) || 0))
  const [saved, setSaved] = useState(false)

  function toggleDay(dayIdx) {
    setSchedule(s => ({
      ...s,
      workDays: s.workDays.includes(dayIdx) ? s.workDays.filter(d => d !== dayIdx) : [...s.workDays, dayIdx],
    }))
  }

  function handleSave() {
    lsJsonSet(uk(uid, 'schedule'), schedule)
    lsJsonSet(uk(uid, 'focus-preset'), focusPreset)
    lsSet(uk(uid, 'sprint-quota'), String(sprintQuota))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div>
      <h2 style={{ fontSize: '1rem', fontWeight: 600, color: navy, marginBottom: 20 }}>Schedule, Focus & Budget</h2>
      {saved && <Alert type="success" message="Settings saved." />}

      {/* Work hours */}
      <SectionHeader title="Work hours" desc="Nodes with due dates outside these hours get a clock badge in the canvas." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: navy, marginBottom: 6 }}>Timezone</label>
          <select value={schedule.timezone} onChange={e => setSchedule(s => ({ ...s, timezone: e.target.value }))} style={{ ...selectStyle, width: '100%', maxWidth: 360 }}>
            {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: navy, marginBottom: 8 }}>Working days</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {DAYS.map((day, i) => {
              const idx = DAY_INDICES[i]
              const active = schedule.workDays.includes(idx)
              return (
                <button key={day} onClick={() => toggleDay(idx)} style={{
                  width: 40, height: 36, borderRadius: 3, border: `2px solid ${active ? blue : border}`,
                  background: active ? '#DEEBFF' : bg, color: active ? blue : navy,
                  fontWeight: active ? 600 : 400, fontSize: '0.8125rem', cursor: 'pointer',
                }}>{day}</button>
              )
            })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: navy, marginBottom: 4 }}>Start time</label>
            <select value={schedule.startHour} onChange={e => setSchedule(s => ({ ...s, startHour: Number(e.target.value) }))} style={selectStyle}>
              {HOURS.map(h => <option key={h} value={h}>{fmt12(h)}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: navy, marginBottom: 4 }}>End time</label>
            <select value={schedule.endHour} onChange={e => setSchedule(s => ({ ...s, endHour: Number(e.target.value) }))} style={selectStyle}>
              {HOURS.map(h => <option key={h} value={h}>{fmt12(h)}</option>)}
            </select>
          </div>
        </div>
        <div style={{ padding: '10px 14px', background: bg, border: `1px solid ${border}`, borderRadius: 3, fontSize: '0.8125rem', color: textSubtle }}>
          Working {DAYS.filter((_, i) => schedule.workDays.includes(DAY_INDICES[i])).join(', ')} · {fmt12(schedule.startHour)} – {fmt12(schedule.endHour)} · {schedule.timezone}
        </div>
      </div>

      <div style={{ height: 1, background: border, margin: '4px 0 24px' }} />

      {/* Focus mode preset */}
      <SectionHeader title="Focus mode preset" desc="One-click filter applied when you toggle Focus Mode in the canvas." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: navy, marginBottom: 4 }}>Preset name</label>
          <input value={focusPreset.label} onChange={e => setFocusPreset(p => ({ ...p, label: e.target.value }))} placeholder="e.g. My work" style={{ ...inputStyle, maxWidth: 240 }}
            onFocus={e => { e.currentTarget.style.borderColor = borderFocus; e.currentTarget.style.background = surface }}
            onBlur={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.background = bg }} />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: navy, marginBottom: 4 }}>Filter by assignee</label>
            <input value={focusPreset.assignee} onChange={e => setFocusPreset(p => ({ ...p, assignee: e.target.value }))} placeholder="Leave blank for any" style={inputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = borderFocus; e.currentTarget.style.background = surface }}
              onBlur={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.background = bg }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: navy, marginBottom: 4 }}>Filter by status</label>
            <input value={focusPreset.status} onChange={e => setFocusPreset(p => ({ ...p, status: e.target.value }))} placeholder="e.g. in-progress" style={inputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = borderFocus; e.currentTarget.style.background = surface }}
              onBlur={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.background = bg }} />
          </div>
        </div>
        <p style={{ fontSize: '0.75rem', color: textSubtle }}>When Focus Mode is toggled in the canvas, only nodes matching these criteria stay fully visible.</p>
      </div>

      <div style={{ height: 1, background: border, margin: '4px 0 24px' }} />

      {/* Sprint budget */}
      <SectionHeader title="Sprint point quota" desc="Sets your personal capacity. The header shows how many points are currently assigned to you vs. your quota." />
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: navy, marginBottom: 4 }}>
          Points per sprint <span style={{ fontWeight: 400, color: textSubtle }}>(0 = disabled)</span>
        </label>
        <input type="number" min={0} max={999} value={sprintQuota} onChange={e => setSprintQuota(Number(e.target.value))} style={{ ...inputStyle, width: 120 }}
          onFocus={e => { e.currentTarget.style.borderColor = borderFocus; e.currentTarget.style.background = surface }}
          onBlur={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.background = bg }} />
        <p style={{ marginTop: 4, fontSize: '0.75rem', color: textSubtle }}>Story points are summed across nodes assigned to your email in the active project.</p>
      </div>

      <SaveBtn onClick={handleSave} />
    </div>
  )
}

// ── TAB: SECURITY ─────────────────────────────────────────────────────────
function SecurityTab({ user, logout }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError(''); setSuccess('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setSuccess('')
    if (form.newPassword.length < 8) { setError('New password must be at least 8 characters.'); return }
    if (form.newPassword !== form.confirmPassword) { setError('New passwords do not match.'); return }
    setLoading(true)
    try {
      const token = ls('chart-to-jira-token')
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed.'); return }
      setSuccess('Password changed successfully.')
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch { setError('Network error.') }
    finally { setLoading(false) }
  }

  return (
    <div>
      <h2 style={{ fontSize: '1rem', fontWeight: 600, color: navy, marginBottom: 20 }}>Security</h2>
      <SectionHeader title="Change password" />
      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
        {[
          { name: 'currentPassword', label: 'Current password', show: showCurrent, setShow: setShowCurrent },
          { name: 'newPassword', label: 'New password', show: showNew, setShow: setShowNew },
          { name: 'confirmPassword', label: 'Confirm new password', show: false, setShow: null },
        ].map(({ name, label, show, setShow }) => (
          <div key={name}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: navy, marginBottom: 4 }}>{label}</label>
            <div style={{ position: 'relative' }}>
              <input name={name} type={show ? 'text' : 'password'} value={form[name]} onChange={handleChange} required placeholder={label} style={{ ...inputStyle, paddingRight: setShow ? 38 : undefined, ...(name === 'confirmPassword' && form.confirmPassword && form.confirmPassword !== form.newPassword ? { borderColor: errorBorder } : {}) }}
                onFocus={e => { e.currentTarget.style.borderColor = borderFocus; e.currentTarget.style.background = surface }}
                onBlur={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.background = bg }} />
              {setShow && (
                <button type="button" onClick={() => setShow(v => !v)} tabIndex={-1} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: textSubtle, display: 'flex' }}>
                  <EyeIcon off={show} />
                </button>
              )}
            </div>
            {name === 'confirmPassword' && form.confirmPassword && form.confirmPassword !== form.newPassword && (
              <p style={{ marginTop: 4, fontSize: '0.75rem', color: errorText }}>Passwords do not match</p>
            )}
          </div>
        ))}
        <SaveBtn loading={loading} onClick={handleSubmit} label={loading ? 'Updating…' : 'Update password'} />
      </form>
      <div style={{ borderTop: `1px solid ${border}`, paddingTop: 24 }}>
        <SectionHeader title="Sign out" desc="Sign out of your account on this device." />
        <button onClick={() => { logout(); navigate('/') }} style={{ background: 'none', color: errorText, border: `2px solid ${errorBorder}`, borderRadius: 3, padding: '7px 16px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.background = errorBg }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
        >Sign out</button>
      </div>
    </div>
  )
}

// ── ROOT SETTINGS PAGE ──────────────────────────────────────────────────────
const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'jira', label: 'Jira Connection' },
  { id: 'canvas', label: 'Canvas' },
  { id: 'workflow', label: 'Workflow' },
  { id: 'shortcuts', label: 'Shortcuts' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'schedule', label: 'Schedule & Focus' },
  { id: 'security', label: 'Security' },
]

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')

  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
      {/* Top bar */}
      <div style={{ background: navy, height: 42, display: 'flex', alignItems: 'center', padding: '0 20px' }}>
        <div style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none' }}>
          <svg width="28" height="28" viewBox="0 0 30 30" fill="none">
            <circle cx="10" cy="15" r="9" fill="#0052CC" opacity="0.9"/>
            <circle cx="20" cy="15" r="9" fill="#4C9AFF" opacity="0.85"/>
          </svg>
          <span style={{ fontWeight: 700, fontSize: '1.0625rem', color: '#fff', letterSpacing: '-0.01em' }}>bahnOS</span>
        </Link>
        <span style={{ color: 'rgba(255,255,255,0.4)', margin: '0 12px' }}>/</span>
        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', fontWeight: 500 }}>Settings</span>
        <div style={{ marginLeft: 'auto' }}>
          <Link to="/app/canvas" style={{ background: blue, color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '0.8125rem', borderRadius: 3, padding: '6px 14px' }}
            onMouseEnter={e => { e.currentTarget.style.background = blueHover }}
            onMouseLeave={e => { e.currentTarget.style.background = blue }}
          >Open Workstation</Link>
        </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px', display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* Sidebar */}
        <aside style={{ width: 190, flexShrink: 0 }}>
          <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: textSubtle, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, paddingLeft: 10 }}>Account</p>
          <nav>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px',
                borderRadius: 3, border: 'none', cursor: 'pointer', fontSize: '0.875rem',
                fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? blue : navy,
                background: activeTab === tab.id ? '#DEEBFF' : 'transparent',
                marginBottom: 2,
              }}
                onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.background = '#EBECF0' }}
                onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.background = 'transparent' }}
              >{tab.label}</button>
            ))}
          </nav>
        </aside>

        {/* Content card */}
        <div style={{ flex: 1, background: surface, borderRadius: 3, boxShadow: '0 1px 1px rgba(9,30,66,0.25), 0 0 0 1px rgba(9,30,66,0.08)', padding: '28px 32px' }}>
          {activeTab === 'profile' && <ProfileTab user={user} />}
          {activeTab === 'jira' && <JiraTab user={user} />}
          {activeTab === 'canvas' && <CanvasTab user={user} />}
          {activeTab === 'workflow' && <WorkflowTab user={user} />}
          {activeTab === 'shortcuts' && <ShortcutsTab user={user} />}
          {activeTab === 'integrations' && <IntegrationsTab user={user} />}
          {activeTab === 'schedule' && <ScheduleTab user={user} />}
          {activeTab === 'security' && <SecurityTab user={user} logout={logout} />}
        </div>
      </div>
    </div>
  )
}
