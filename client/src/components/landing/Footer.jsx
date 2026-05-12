import React from 'react'
import { Link } from 'react-router-dom'

const bgFooter      = '#FAFBFC'
const borderColor   = '#DFE1E6'
const textPrimary   = '#172B4D'
const textSecondary = '#5E6C84'
const textMuted     = '#97A0AF'
const accentBlue    = '#0052CC'

const COLUMNS = [
  {
    heading: 'Products',
    links: [
      { label: 'bahn Capsule', to: '/capsule' },
      { label: 'CRM',          to: '/crm-product' },
      { label: 'Wiki',         to: '/wiki' },
      { label: 'The Platform', to: '/platform' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Templates',          to: '/templates' },
      { label: 'Changelog',          to: '/changelog' },
      { label: 'Documentation',      to: '/docs' },
      { label: 'Keyboard shortcuts', to: '/docs#shortcuts' },
      { label: 'Roadmap',            to: '/roadmap' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About',     to: '/about' },
      { label: 'Blog',      to: '/blog' },
      { label: 'Careers',   to: '/careers' },
      { label: 'Community', to: '/community' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy policy',   to: '/privacy' },
      { label: 'Terms of service', to: '/terms' },
      { label: 'Cookie policy',    to: '/cookies' },
    ],
  },
]

export default function Footer() {
  return (
    <footer style={{ background: bgFooter, borderTop: `1px solid ${borderColor}`, color: textPrimary }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 32px 0' }}>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr repeat(4, 1fr)', gap: '32px 40px' }}>

          {/* Brand */}
          <div>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 14 }}>
              <svg width="26" height="26" viewBox="0 0 30 30" fill="none">
                <circle cx="10" cy="15" r="9" fill={accentBlue} opacity="0.9"/>
                <circle cx="20" cy="15" r="9" fill="#4C9AFF" opacity="0.75"/>
              </svg>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: textPrimary, letterSpacing: '-0.01em' }}>
                bahnOS
              </span>
            </Link>
            <p style={{ fontSize: '0.8125rem', color: textSecondary, lineHeight: 1.7, maxWidth: 220, margin: '0 0 20px' }}>
              Connected operational workspace — where planning, execution, revenue, and documentation stay in sync.
            </p>
            <Link to="/app/canvas"
              style={{ display: 'inline-block', background: accentBlue, color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '0.8125rem', padding: '8px 16px', borderRadius: 4, transition: 'background 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#0065FF' }}
              onMouseLeave={e => { e.currentTarget.style.background = accentBlue }}
            >
              Get Started Free →
            </Link>
          </div>

          {/* Link columns */}
          {COLUMNS.map(col => (
            <div key={col.heading}>
              <h4 style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: textMuted, marginBottom: 14, marginTop: 0 }}>
                {col.heading}
              </h4>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {col.links.map(link => (
                  <Link key={link.label} to={link.to}
                    style={{ color: textSecondary, textDecoration: 'none', fontSize: '0.8125rem', transition: 'color 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = accentBlue }}
                    onMouseLeave={e => { e.currentTarget.style.color = textSecondary }}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{ marginTop: 48, paddingTop: 20, paddingBottom: 24, borderTop: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <p style={{ fontSize: '0.75rem', color: textMuted, margin: 0 }}>
            © {new Date().getFullYear()} bahnOS. All rights reserved.
          </p>
          <p style={{ fontSize: '0.75rem', color: textMuted, margin: 0 }}>
            Connected operational workspace.
          </p>
        </div>
      </div>
    </footer>
  )
}
