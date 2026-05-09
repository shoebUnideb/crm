import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getAuthToken } from '../lib/localStorage.js'
import { adminApi } from '../lib/analyticsApi.js'

// ── helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => Number(n || 0).toLocaleString()
const fmtDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
const fmtDay = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
const timeAgo = (iso) => {
  if (!iso) return 'never'
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ── Bar chart (horizontal) ────────────────────────────────────────────────────
function HBarChart({ data, labelKey, valueKey, color = '#1a73e8' }) {
  if (!data?.length) return <p style={{ fontSize: 12, color: '#9AA0A6', padding: '8px 0' }}>No data yet</p>
  const max = Math.max(...data.map(d => Number(d[valueKey])), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: '#3C4043', width: 130, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>{d[labelKey]}</span>
          <div style={{ flex: 1, height: 8, background: '#F1F3F4', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(Number(d[valueKey]) / max) * 100}%`, background: color, borderRadius: 4, transition: 'width 0.4s ease' }} />
          </div>
          <span style={{ fontSize: 11, color: '#3C4043', width: 40, textAlign: 'right', flexShrink: 0, fontWeight: 500 }}>{fmt(d[valueKey])}</span>
        </div>
      ))}
    </div>
  )
}

// ── Vertical bar chart (sparkline) ────────────────────────────────────────────
function VBarChart({ data, color = '#1a73e8', height = 80 }) {
  if (!data?.length) return <p style={{ fontSize: 12, color: '#9AA0A6' }}>No data</p>
  const values = data.map(d => Number(d.count))
  const max = Math.max(...values, 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height }}>
        {data.map((d, i) => (
          <div key={i} title={`${fmtDay(d.date)}: ${d.count}`}
            style={{ flex: 1, height: Math.max((Number(d.count) / max) * height, 2), background: color, borderRadius: '2px 2px 0 0', opacity: 0.8, cursor: 'default', transition: 'opacity 0.1s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0.8'}
          />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 9, color: '#9AA0A6' }}>{fmtDay(data[0]?.date)}</span>
        <span style={{ fontSize: 9, color: '#9AA0A6' }}>{fmtDay(data[data.length - 1]?.date)}</span>
      </div>
    </div>
  )
}

// ── Metric card ───────────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, subColor, trend, selected, onClick }) {
  return (
    <div onClick={onClick} style={{
      padding: '16px 20px', background: '#fff', border: `1px solid ${selected ? '#1a73e8' : '#DADCE0'}`,
      borderTop: selected ? '3px solid #1a73e8' : '3px solid transparent',
      borderRadius: 8, cursor: onClick ? 'pointer' : 'default',
      transition: 'border-color 0.15s',
      minWidth: 0,
    }}>
      <div style={{ fontSize: 11, color: '#5F6368', marginBottom: 6, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 400, color: '#202124', lineHeight: 1, marginBottom: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: subColor || '#5F6368' }}>{sub}</div>}
    </div>
  )
}

// ── Nav item ──────────────────────────────────────────────────────────────────
function NavItem({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      width: '100%', padding: '9px 16px', border: 'none', textAlign: 'left', cursor: 'pointer',
      background: active ? '#E8F0FE' : 'transparent',
      color: active ? '#1967D2' : '#3C4043',
      borderRadius: 0, fontSize: 13, fontWeight: active ? 600 : 400,
      transition: 'background 0.12s',
    }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#F1F3F4' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
    >
      <span style={{ fontSize: 15, width: 20, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      <span>{label}</span>
    </button>
  )
}

// ── Tag badge ─────────────────────────────────────────────────────────────────
function Tag({ label, color = '#1a73e8', bg = '#E8F0FE' }) {
  return <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 12, background: bg, color, display: 'inline-block' }}>{label}</span>
}

// ── Stars ─────────────────────────────────────────────────────────────────────
function Stars({ rating }) {
  return (
    <span style={{ display: 'inline-flex', gap: 1 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="11" height="11" viewBox="0 0 24 24" fill={i <= rating ? '#F9AB00' : 'none'} stroke={i <= rating ? '#F9AB00' : '#DADCE0'} strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </span>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
const PAGES = [
  { id: 'overview', icon: '⊞', label: 'Overview' },
  { id: 'features', icon: '⚡', label: 'Feature usage' },
  { id: 'activity', icon: '📋', label: 'Activity log' },
  { id: 'users', icon: '👥', label: 'Users' },
  { id: 'feedback', icon: '💬', label: 'Feedback' },
]

const PAGE = 50

export default function AdminPage() {
  const { user, isAuthenticated } = useAuth()
  const token = getAuthToken()

  const [page, setPage] = useState('overview')
  const [stats, setStats] = useState(null)
  const [features, setFeatures] = useState([])
  const [activity, setActivity] = useState({ events: [], total: 0 })
  const [users, setUsers] = useState({ users: [], total: 0 })
  const [feedback, setFeedback] = useState({ feedback: [], total: 0, avgRating: 0 })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [activityFilter, setActivityFilter] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [feedbackCategory, setFeedbackCategory] = useState('')
  const [activityOffset, setActivityOffset] = useState(0)
  const [usersOffset, setUsersOffset] = useState(0)
  const [feedbackOffset, setFeedbackOffset] = useState(0)

  const load = useCallback(async () => {
    if (!token) { setError('Not authenticated'); setLoading(false); return }
    setLoading(true); setError(null)
    try {
      const [s, f] = await Promise.all([adminApi.stats(token), adminApi.features(token)])
      setStats(s)
      setFeatures(Array.isArray(f) ? f : [])
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [token])

  const loadActivity = useCallback(async () => {
    if (!token) return
    try { setActivity(await adminApi.activity(token, PAGE, activityOffset, activityFilter)) } catch {}
  }, [token, activityOffset, activityFilter])

  const loadUsers = useCallback(async () => {
    if (!token) return
    try { setUsers(await adminApi.users(token, PAGE, usersOffset, userSearch)) } catch {}
  }, [token, usersOffset, userSearch])

  const loadFeedback = useCallback(async () => {
    if (!token) return
    try { setFeedback(await adminApi.feedback(token, PAGE, feedbackOffset, feedbackCategory)) } catch {}
  }, [token, feedbackOffset, feedbackCategory])

  useEffect(() => { load() }, [load])
  useEffect(() => { if (page === 'activity') loadActivity() }, [page, loadActivity])
  useEffect(() => { if (page === 'users') loadUsers() }, [page, loadUsers])
  useEffect(() => { if (page === 'feedback') loadFeedback() }, [page, loadFeedback])

  // ── Error / loading states ────────────────────────────────────────────────
  if (!isAuthenticated) return (
    <div style={centerStyle}>
      <p style={{ color: '#5F6368', fontSize: 14 }}>Please sign in to access the admin panel.</p>
      <Link to="/canvas" style={linkStyle}>← Back to app</Link>
    </div>
  )

  if (loading) return (
    <div style={centerStyle}>
      <div style={{ width: 32, height: 32, border: '3px solid #DADCE0', borderTopColor: '#1a73e8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (error) return (
    <div style={centerStyle}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ width: 48, height: 48, background: '#FCE8E6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 22 }}>⚠</div>
        <p style={{ fontSize: 15, fontWeight: 600, color: '#202124', marginBottom: 8 }}>Access denied</p>
        <p style={{ fontSize: 13, color: '#5F6368', marginBottom: 20, lineHeight: 1.6 }}>{error}</p>
        <code style={{ display: 'block', background: '#F8F9FA', border: '1px solid #DADCE0', borderRadius: 4, padding: '10px 14px', fontSize: 11, color: '#3C4043', textAlign: 'left', marginBottom: 20 }}>
          UPDATE users SET is_admin = true<br/>WHERE email = '{user?.email}';
        </code>
        <Link to="/canvas" style={linkStyle}>← Back to app</Link>
      </div>
    </div>
  )

  const maxFeatureUse = features.length > 0 ? Number(features[0].total_uses) : 1

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Google Sans', 'Roboto', system-ui, sans-serif", background: '#F8F9FA', color: '#202124' }}>

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside style={{ width: 220, background: '#fff', borderRight: '1px solid #DADCE0', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
        {/* Logo */}
        <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #F1F3F4' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #1a73e8, #0d47a1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white" opacity="0.9"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#202124', lineHeight: 1.2 }}>bahnOS</div>
            <div style={{ fontSize: 10, color: '#9AA0A6' }}>Admin Console</div>
          </div>
        </div>

        {/* Nav sections */}
        <div style={{ padding: '8px 0', flex: 1 }}>
          <div style={{ padding: '8px 16px 4px', fontSize: 10, fontWeight: 600, color: '#9AA0A6', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Reports</div>
          {PAGES.map(p => (
            <NavItem key={p.id} icon={p.icon} label={p.label} active={page === p.id} onClick={() => setPage(p.id)} />
          ))}
        </div>

        {/* Bottom */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #F1F3F4' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1a73e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>
              {user?.email?.slice(0, 1).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, color: '#202124', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{user?.email}</div>
              <div style={{ fontSize: 10, color: '#1a73e8', fontWeight: 500 }}>Admin</div>
            </div>
          </div>
          <Link to="/canvas" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#5F6368', textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.color = '#1a73e8'}
            onMouseLeave={e => e.currentTarget.style.color = '#5F6368'}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            Back to app
          </Link>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{ height: 52, background: '#fff', borderBottom: '1px solid #DADCE0', display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between', flexShrink: 0 }}>
          <h1 style={{ margin: 0, fontSize: 16, fontWeight: 500, color: '#202124' }}>
            {PAGES.find(p => p.id === page)?.label}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#5F6368', background: 'none', border: '1px solid #DADCE0', borderRadius: 20, padding: '5px 12px', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = '#F1F3F4'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.96"/></svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Page body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

          {/* ── OVERVIEW ──────────────────────────────────────────── */}
          {page === 'overview' && stats && (
            <div>
              {/* Metric cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
                <MetricCard label="Total users" value={fmt(stats.totalUsers)} sub={`+${fmt(stats.newUsersToday)} today`} subColor="#1E8E3E" />
                <MetricCard label="Total projects" value={fmt(stats.totalProjects)} />
                <MetricCard label="Collab projects" value={fmt(stats.activeCollabProjects)} />
                <MetricCard label="Events today" value={fmt(stats.eventsToday)} />
                <MetricCard label="Guest sessions (7d)" value={fmt(stats.guestSessionsWeek)} />
                <MetricCard label="Feedback received" value={fmt(stats.feedbackCount)} sub={feedback.avgRating > 0 ? `★ ${feedback.avgRating} avg` : null} subColor="#F9AB00" />
              </div>

              {/* Charts row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                <div style={cardStyle}>
                  <div style={cardHeader}>
                    <span>New users by day</span>
                    <span style={{ fontSize: 11, color: '#9AA0A6' }}>Last 30 days</span>
                  </div>
                  <VBarChart data={stats.signupTrend} color="#1a73e8" height={88} />
                </div>
                <div style={cardStyle}>
                  <div style={cardHeader}>
                    <span>Feature events by day</span>
                    <span style={{ fontSize: 11, color: '#9AA0A6' }}>Last 7 days</span>
                  </div>
                  <VBarChart data={stats.activityTrend} color="#34A853" height={88} />
                </div>
              </div>

              {/* Top features */}
              <div style={cardStyle}>
                <div style={{ ...cardHeader, marginBottom: 16 }}>
                  <span>Top features</span>
                  <button onClick={() => setPage('features')} style={{ fontSize: 12, color: '#1a73e8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>See all →</button>
                </div>
                {features.length === 0 ? (
                  <p style={{ fontSize: 12, color: '#9AA0A6' }}>No feature events tracked yet.</p>
                ) : (
                  <HBarChart data={features.slice(0, 8)} labelKey="feature_name" valueKey="total_uses" />
                )}
              </div>
            </div>
          )}

          {/* ── FEATURES ──────────────────────────────────────────── */}
          {page === 'features' && (
            <div>
              {/* Summary cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                <MetricCard label="Features tracked" value={fmt(features.length)} />
                <MetricCard label="Total feature uses" value={fmt(features.reduce((a, f) => a + Number(f.total_uses), 0))} />
                <MetricCard label="Most used" value={features[0]?.feature_name || '—'} sub={features[0] ? `${fmt(features[0].total_uses)} uses` : null} />
              </div>

              {/* Top features chart */}
              <div style={{ ...cardStyle, marginBottom: 20 }}>
                <div style={{ ...cardHeader, marginBottom: 16 }}>
                  <span>Feature usage by volume</span>
                </div>
                <HBarChart data={features.slice(0, 10)} labelKey="feature_name" valueKey="total_uses" />
              </div>

              {/* Table */}
              <div style={cardStyle}>
                <div style={{ ...cardHeader, marginBottom: 0 }}>
                  <span>All features</span>
                  <span style={{ fontSize: 11, color: '#9AA0A6' }}>{features.length} features</span>
                </div>
                <div style={{ overflowX: 'auto', marginTop: 12 }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        {['Feature', 'Total uses', 'Unique users', 'Last 24h', 'Last 7d', 'Last used'].map(h => (
                          <th key={h} style={{ ...thStyle, textAlign: h === 'Feature' ? 'left' : 'right' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {features.map((f, i) => (
                        <tr key={f.feature_name} style={i % 2 ? { background: '#F8F9FA' } : {}}>
                          <td style={{ ...tdStyle, fontWeight: 500 }}>{f.feature_name}</td>
                          <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: '#1a73e8' }}>{fmt(f.total_uses)}</td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>{fmt(f.unique_users)}</td>
                          <td style={{ ...tdStyle, textAlign: 'right', color: '#5F6368' }}>{fmt(f.uses_last_24h)}</td>
                          <td style={{ ...tdStyle, textAlign: 'right', color: '#5F6368' }}>{fmt(f.uses_last_7d)}</td>
                          <td style={{ ...tdStyle, textAlign: 'right', color: '#9AA0A6', fontSize: 11 }}>{timeAgo(f.last_used)}</td>
                        </tr>
                      ))}
                      {features.length === 0 && (
                        <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#9AA0A6', fontSize: 13 }}>No feature data yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── ACTIVITY ──────────────────────────────────────────── */}
          {page === 'activity' && (
            <div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
                <select value={activityFilter} onChange={e => { setActivityFilter(e.target.value); setActivityOffset(0) }}
                  style={selectStyle}>
                  <option value="">All event types</option>
                  <option value="feature_used">feature_used</option>
                  <option value="user_joined">user_joined</option>
                  <option value="page_view">page_view</option>
                </select>
                <button onClick={loadActivity} style={btnSecondary}>↻ Refresh</button>
                <span style={{ fontSize: 12, color: '#9AA0A6', marginLeft: 'auto' }}>{fmt(activity.total)} total events</span>
              </div>
              <div style={cardStyle}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        {['Time', 'Event type', 'Feature', 'User / Guest', 'Session'].map(h => (
                          <th key={h} style={thStyle}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {activity.events.length === 0 ? (
                        <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#9AA0A6', fontSize: 13 }}>No events yet.</td></tr>
                      ) : activity.events.map((e, i) => (
                        <tr key={e.id} style={i % 2 ? { background: '#F8F9FA' } : {}}>
                          <td style={{ ...tdStyle, color: '#9AA0A6', whiteSpace: 'nowrap', fontSize: 11 }}>{fmtDate(e.created_at)}</td>
                          <td style={tdStyle}>
                            <Tag
                              label={e.event_type}
                              color={e.event_type === 'feature_used' ? '#1967D2' : e.event_type === 'user_joined' ? '#1E8E3E' : '#5F6368'}
                              bg={e.event_type === 'feature_used' ? '#E8F0FE' : e.event_type === 'user_joined' ? '#E6F4EA' : '#F1F3F4'}
                            />
                          </td>
                          <td style={{ ...tdStyle, color: '#3C4043' }}>{e.feature_name || '—'}</td>
                          <td style={tdStyle}>
                            {e.is_guest
                              ? <span style={{ fontSize: 11, color: '#9AA0A6' }}>👻 Guest</span>
                              : <span style={{ fontSize: 12, color: '#202124' }}>{e.user_email || '—'}</span>
                            }
                          </td>
                          <td style={{ ...tdStyle, fontSize: 10, color: '#9AA0A6', fontFamily: 'monospace' }}>{e.session_id ? e.session_id.slice(0, 8) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination total={activity.total} offset={activityOffset} pageSize={PAGE} onChange={setActivityOffset} />
              </div>
            </div>
          )}

          {/* ── USERS ─────────────────────────────────────────────── */}
          {page === 'users' && (
            <div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9AA0A6' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input type="text" placeholder="Search users…" value={userSearch} onChange={e => { setUserSearch(e.target.value); setUsersOffset(0) }}
                    style={{ ...selectStyle, paddingLeft: 30, width: 220 }} />
                </div>
                <button onClick={loadUsers} style={btnSecondary}>↻ Refresh</button>
                <span style={{ fontSize: 12, color: '#9AA0A6', marginLeft: 'auto' }}>{fmt(users.total)} users</span>
              </div>
              <div style={cardStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      {['User', 'Joined', 'Projects', 'Last active', 'Role'].map(h => (
                        <th key={h} style={{ ...thStyle, textAlign: h === 'User' ? 'left' : 'right' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.users.length === 0 ? (
                      <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#9AA0A6', fontSize: 13 }}>No users found.</td></tr>
                    ) : users.users.map((u, i) => (
                      <tr key={u.id} style={i % 2 ? { background: '#F8F9FA' } : {}}>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: u.is_admin ? '#E8F0FE' : '#F1F3F4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: u.is_admin ? '#1967D2' : '#5F6368', flexShrink: 0 }}>
                              {u.email.slice(0, 1).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, color: '#202124' }}>{u.email}</div>
                              <div style={{ fontSize: 10, color: '#9AA0A6' }}>ID {u.id}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right', color: '#5F6368', fontSize: 12 }}>{fmtDay(u.created_at)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{fmt(u.project_count)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', color: '#9AA0A6', fontSize: 12 }}>{timeAgo(u.last_active)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                          {u.is_admin && <Tag label="Admin" color="#1967D2" bg="#E8F0FE" />}
                          <button
                            onClick={async () => { if (!confirm(u.is_admin ? 'Remove admin role?' : 'Grant admin role?')) return; await adminApi.toggleAdmin(token, u.id, !u.is_admin); loadUsers() }}
                            style={{ marginLeft: 8, fontSize: 11, color: '#5F6368', background: 'none', border: '1px solid #DADCE0', borderRadius: 12, padding: '2px 10px', cursor: 'pointer' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#1a73e8'; e.currentTarget.style.color = '#1a73e8' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#DADCE0'; e.currentTarget.style.color = '#5F6368' }}
                          >
                            {u.is_admin ? 'Revoke' : 'Make admin'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Pagination total={users.total} offset={usersOffset} pageSize={PAGE} onChange={setUsersOffset} />
              </div>
            </div>
          )}

          {/* ── FEEDBACK ──────────────────────────────────────────── */}
          {page === 'feedback' && (
            <div>
              {/* Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                <MetricCard label="Total responses" value={fmt(feedback.total)} />
                <MetricCard label="Average rating" value={Number(feedback.avgRating) > 0 ? `${feedback.avgRating} / 5` : '—'} sub={Number(feedback.avgRating) > 0 ? '★★★★★' : null} subColor="#F9AB00" />
                <MetricCard label="Filter by category" value={feedbackCategory || 'All'} />
              </div>

              <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
                {['', 'general', 'bug', 'feature', 'ux'].map(cat => (
                  <button key={cat} onClick={() => { setFeedbackCategory(cat); setFeedbackOffset(0) }} style={{
                    fontSize: 12, padding: '5px 14px', borderRadius: 20, border: '1px solid',
                    borderColor: feedbackCategory === cat ? '#1a73e8' : '#DADCE0',
                    color: feedbackCategory === cat ? '#1a73e8' : '#5F6368',
                    background: feedbackCategory === cat ? '#E8F0FE' : '#fff',
                    cursor: 'pointer', fontWeight: feedbackCategory === cat ? 600 : 400,
                  }}>
                    {cat === '' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
                <button onClick={loadFeedback} style={{ ...btnSecondary, marginLeft: 'auto' }}>↻ Refresh</button>
              </div>

              {feedback.feedback.length === 0 ? (
                <div style={{ ...cardStyle, padding: '48px', textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
                  <p style={{ fontSize: 14, color: '#9AA0A6' }}>No feedback yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {feedback.feedback.map(f => (
                    <div key={f.id} style={{ ...cardStyle, display: 'flex', gap: 14 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: f.is_guest ? '#F1F3F4' : '#E8F0FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: f.is_guest ? '#9AA0A6' : '#1967D2' }}>
                        {f.is_guest ? '👻' : (f.user_email || f.email || '?').slice(0, 1).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, fontWeight: 500, color: '#202124' }}>
                            {f.user_email || f.email || (f.is_guest ? 'Guest user' : 'Anonymous')}
                          </span>
                          {f.rating && <Stars rating={f.rating} />}
                          {f.category && (
                            <Tag
                              label={f.category}
                              color={
                                f.category === 'bug'     ? '#C5221F' :
                                f.category === 'feature' ? '#1E8E3E' :
                                f.category === 'love'    ? '#D93025' :
                                f.category === 'dislike' ? '#E37400' :
                                f.category === 'rating'  ? '#F9AB00' :
                                f.category === 'ux'      ? '#7627BB' : '#5F6368'
                              }
                              bg={
                                f.category === 'bug'     ? '#FCE8E6' :
                                f.category === 'feature' ? '#E6F4EA' :
                                f.category === 'love'    ? '#FDE8E8' :
                                f.category === 'dislike' ? '#FFF3E0' :
                                f.category === 'rating'  ? '#FFF8E1' :
                                f.category === 'ux'      ? '#F3E8FD' : '#F1F3F4'
                              }
                            />
                          )}
                          <span style={{ fontSize: 11, color: '#9AA0A6', marginLeft: 'auto' }}>{fmtDate(f.created_at)}</span>
                        </div>
                        {f.message && <p style={{ margin: 0, fontSize: 13, color: '#3C4043', lineHeight: 1.6 }}>{f.message}</p>}
                      </div>
                      <button
                        onClick={async () => { if (!confirm('Delete this feedback?')) return; await adminApi.deleteFeedback(token, f.id); loadFeedback() }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DADCE0', padding: '4px', alignSelf: 'flex-start', flexShrink: 0, borderRadius: 4 }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#C5221F'; e.currentTarget.style.background = '#FCE8E6' }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#DADCE0'; e.currentTarget.style.background = 'none' }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                  <Pagination total={feedback.total} offset={feedbackOffset} pageSize={PAGE} onChange={setFeedbackOffset} />
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const centerStyle = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  height: '100vh', fontFamily: 'system-ui, sans-serif', gap: 14,
}
const linkStyle = { color: '#1a73e8', fontSize: 13, textDecoration: 'none', fontWeight: 500 }
const cardStyle = {
  background: '#fff', borderRadius: 8, border: '1px solid #DADCE0',
  padding: '16px 20px', boxShadow: '0 1px 3px rgba(60,64,67,0.04)',
}
const cardHeader = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  fontSize: 13, fontWeight: 500, color: '#202124', marginBottom: 14,
}
const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: 13 }
const thStyle = {
  padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600,
  color: '#5F6368', background: '#F8F9FA', borderBottom: '1px solid #DADCE0',
  textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap',
}
const tdStyle = { padding: '10px 12px', borderBottom: '1px solid #F1F3F4', color: '#3C4043', verticalAlign: 'middle' }
const selectStyle = {
  fontSize: 12, padding: '6px 10px', border: '1px solid #DADCE0', borderRadius: 20,
  background: '#fff', color: '#3C4043', outline: 'none', cursor: 'pointer',
}
const btnSecondary = {
  display: 'flex', alignItems: 'center', gap: 5,
  fontSize: 12, color: '#5F6368', background: '#fff',
  border: '1px solid #DADCE0', borderRadius: 20, padding: '5px 14px', cursor: 'pointer',
}

// ── Pagination ────────────────────────────────────────────────────────────────
function Pagination({ total, offset, pageSize, onChange }) {
  if (total <= pageSize) return null
  const page = Math.floor(offset / pageSize)
  const pages = Math.ceil(total / pageSize)
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 14, paddingTop: 12, borderTop: '1px solid #F1F3F4' }}>
      <span style={{ fontSize: 12, color: '#5F6368' }}>{offset + 1}–{Math.min(offset + pageSize, total)} of {fmt(total)}</span>
      <button disabled={page === 0} onClick={() => onChange(Math.max(0, offset - pageSize))}
        style={{ ...paginBtn, opacity: page === 0 ? 0.4 : 1, cursor: page === 0 ? 'default' : 'pointer' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <button disabled={page >= pages - 1} onClick={() => onChange(offset + pageSize)}
        style={{ ...paginBtn, opacity: page >= pages - 1 ? 0.4 : 1, cursor: page >= pages - 1 ? 'default' : 'pointer' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>
  )
}

const paginBtn = {
  width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: '#fff', border: '1px solid #DADCE0', borderRadius: 4, cursor: 'pointer', color: '#5F6368',
}
