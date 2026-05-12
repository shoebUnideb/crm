import React from 'react'
import { Link } from 'react-router-dom'

const COLUMNS = [
  {
    heading: 'Product',
    links: [
      { label: 'Home', to: '/' },
      { label: 'Features', to: '/features' },
      { label: 'Templates', to: '/templates' },
      { label: 'Open App', to: '/app/canvas' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Documentation', to: '/docs' },
      { label: 'Keyboard shortcuts', to: '/docs#shortcuts' },
      { label: 'Changelog', to: '/changelog' },
      { label: 'Roadmap', to: '/roadmap' },
      { label: 'Community', to: '/community' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Blog', to: '/blog' },
      { label: 'Careers', to: '/careers' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy policy', to: '/privacy' },
      { label: 'Terms of service', to: '/terms' },
      { label: 'Cookie policy', to: '/cookies' },
    ],
  },
]

export default function Footer() {
  return (
    <footer style={{ background: '#FAFBFC', borderTop: '1px solid #DFE1E6', color: '#172B4D' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 32px 0' }}>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr repeat(4, 1fr)', gap: '32px 24px' }}>

          {/* Brand */}
          <div>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 12 }}>
              <svg width="26" height="26" viewBox="0 0 30 30" fill="none">
                <circle cx="10" cy="15" r="9" fill="#0052CC" opacity="0.9"/>
                <circle cx="20" cy="15" r="9" fill="#4C9AFF" opacity="0.85"/>
              </svg>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: '#172B4D', letterSpacing: '-0.01em' }}>
                bahnOS
              </span>
            </Link>
            <p style={{ fontSize: '0.8125rem', color: '#5E6C84', lineHeight: 1.65, maxWidth: 220 }}>
              All-in-one workspace for modern teams. Visual canvas, CRM pipeline, and collaborative docs — all synced to Jira.
            </p>
          </div>

          {/* Link columns */}
          {COLUMNS.map(col => (
            <div key={col.heading}>
              <h4 style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5E6C84', marginBottom: 14 }}>
                {col.heading}
              </h4>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {col.links.map(link => (
                  <Link key={link.label} to={link.to}
                    style={{ color: '#5E6C84', textDecoration: 'none', fontSize: '0.8125rem' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#0052CC'; e.currentTarget.style.textDecoration = 'underline' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#5E6C84'; e.currentTarget.style.textDecoration = 'none' }}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{ marginTop: 40, paddingTop: 16, paddingBottom: 20, borderTop: '1px solid #DFE1E6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <p style={{ fontSize: '0.75rem', color: '#97A0AF', margin: 0 }}>
            © {new Date().getFullYear()} bahnOS. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
