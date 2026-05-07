import React from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/landing/Navbar.jsx'
import Footer from '../components/landing/Footer.jsx'

const navy = '#172B4D'
const blue = '#0052CC'
const textSubtle = '#5E6C84'
const border = '#DFE1E6'

export default function NotFoundPage() {
  return (
    <div style={{ background: '#FAFBFC', color: navy, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 32px' }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{ fontSize: '7rem', fontWeight: 900, color: border, lineHeight: 1, marginBottom: 8, letterSpacing: '-0.04em' }}>404</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: navy, marginBottom: 12 }}>Page not found</h1>
          <p style={{ fontSize: '0.9375rem', color: textSubtle, lineHeight: 1.7, marginBottom: 32 }}>
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/"
              style={{
                display: 'inline-block', padding: '9px 20px',
                background: blue, color: '#fff', borderRadius: 6,
                textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600,
              }}
            >
              Go home
            </Link>
            <Link
              to="/docs"
              style={{
                display: 'inline-block', padding: '9px 20px',
                background: '#fff', color: navy, borderRadius: 6,
                textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600,
                border: `1px solid ${border}`,
              }}
            >
              View docs
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
