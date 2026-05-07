import React from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/landing/Navbar.jsx'
import Footer from '../components/landing/Footer.jsx'

const navy = '#172B4D'
const blue = '#0052CC'
const textSubtle = '#5E6C84'
const border = '#DFE1E6'

const COOKIES = [
  {
    category: 'Essential',
    color: { bg: '#E3FCEF', text: '#006644' },
    desc: 'Required for the Service to function. Cannot be disabled.',
    items: [
      { name: 'bahn_session', purpose: 'Authentication session token — keeps you logged in', expiry: 'Session', type: 'HTTP' },
      { name: 'bahn_csrf', purpose: 'CSRF protection token', expiry: 'Session', type: 'HTTP' },
    ],
  },
  {
    category: 'Preferences',
    color: { bg: '#DEEBFF', text: '#0052CC' },
    desc: 'Remember your settings across visits.',
    items: [
      { name: 'bahn_dark', purpose: 'Stores your dark/light mode preference', expiry: '1 year', type: 'Local Storage' },
      { name: 'bahn_locale', purpose: 'Stores your language/region preference', expiry: '1 year', type: 'Local Storage' },
    ],
  },
  {
    category: 'Analytics',
    color: { bg: '#FFF0B3', text: '#172B4D' },
    desc: 'Help us understand how people use bahnOS so we can improve it. All data is anonymised.',
    items: [
      { name: '_ba_id', purpose: 'Anonymised visitor identifier for session counting', expiry: '2 years', type: 'HTTP' },
      { name: '_ba_ses', purpose: 'Session identifier for page-flow analysis', expiry: '30 min', type: 'HTTP' },
    ],
  },
]

export default function CookiesPage() {
  return (
    <div style={{ background: '#FAFBFC', color: navy, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '72px 32px 96px' }}>
        <p style={{ fontSize: '0.8125rem', color: textSubtle, marginBottom: 8 }}>Last updated: 1 May 2026</p>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: navy, marginBottom: 8 }}>Cookie Policy</h1>
        <p style={{ fontSize: '0.9375rem', color: textSubtle, lineHeight: 1.7, marginBottom: 48 }}>
          Cookies are small text files stored in your browser. This page lists every cookie bahnOS sets, what it does, and how long it lasts. We keep the list short intentionally.
        </p>

        {COOKIES.map(group => (
          <div key={group.category} style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: navy, margin: 0 }}>{group.category}</h2>
              <span style={{ fontSize: 11, fontWeight: 700, background: group.color.bg, color: group.color.text, borderRadius: 4, padding: '2px 8px' }}>
                {group.category === 'Essential' ? 'Always active' : 'Opt-out available'}
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', color: textSubtle, lineHeight: 1.65, marginBottom: 16 }}>{group.desc}</p>

            <div style={{ background: '#fff', border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 80px 100px', background: '#F4F5F7', padding: '8px 16px', gap: 12 }}>
                {['Cookie', 'Purpose', 'Expiry', 'Type'].map(h => (
                  <div key={h} style={{ fontSize: '0.75rem', fontWeight: 700, color: textSubtle, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
                ))}
              </div>
              {group.items.map((item, i) => (
                <div key={item.name} style={{
                  display: 'grid', gridTemplateColumns: '1fr 2fr 80px 100px',
                  padding: '12px 16px', gap: 12,
                  borderTop: i > 0 ? `1px solid ${border}` : 'none',
                }}>
                  <code style={{ fontSize: '0.8125rem', color: navy, fontFamily: "'SFMono-Regular', Consolas, monospace" }}>{item.name}</code>
                  <div style={{ fontSize: '0.875rem', color: '#344563', lineHeight: 1.5 }}>{item.purpose}</div>
                  <div style={{ fontSize: '0.875rem', color: textSubtle }}>{item.expiry}</div>
                  <div style={{ fontSize: '0.875rem', color: textSubtle }}>{item.type}</div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{ background: '#F4F5F7', borderRadius: 10, padding: '24px 28px', marginTop: 16 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: navy, marginBottom: 10 }}>Managing cookies</h3>
          <p style={{ fontSize: '0.875rem', color: textSubtle, lineHeight: 1.7, margin: 0 }}>
            You can delete cookies or block them in your browser settings. Note that blocking essential cookies will prevent you from logging in. Analytics cookies can be opted out of by setting <code style={{ background: '#E2E4EA', borderRadius: 3, padding: '1px 5px', fontSize: '0.8rem' }}>localStorage.bahnOptOut = '1'</code> in your browser console.
          </p>
        </div>

        <p style={{ fontSize: '0.875rem', color: textSubtle, lineHeight: 1.7, marginTop: 24 }}>
          Questions? Email us at <a href="mailto:privacy@bahn.app" style={{ color: blue }}>privacy@bahn.app</a> or read our full <Link to="/privacy" style={{ color: blue }}>Privacy Policy</Link>.
        </p>
      </div>
      <Footer />
    </div>
  )
}
