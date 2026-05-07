import React from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/landing/Navbar.jsx'
import Footer from '../components/landing/Footer.jsx'

const navy = '#172B4D'
const blue = '#0052CC'
const textSubtle = '#5E6C84'
const border = '#DFE1E6'

const CHANNELS = [
  {
    icon: '💬',
    name: 'Discord',
    desc: 'Join the community server to ask questions, share maps, and get help from other users and the bahnOS team.',
    cta: 'Join Discord',
    href: 'https://discord.gg',
    color: '#5865F2',
    bg: '#EDEFFD',
  },
  {
    icon: '🐙',
    name: 'GitHub',
    desc: 'Report bugs, request features, or browse open issues. The public roadmap lives here.',
    cta: 'Open GitHub',
    href: 'https://github.com',
    color: '#172B4D',
    bg: '#F4F5F7',
  },
  {
    icon: '𝕏',
    name: 'X / Twitter',
    desc: 'Follow @BahnApp for release announcements, tips, and behind-the-scenes product updates.',
    cta: 'Follow us',
    href: 'https://x.com',
    color: '#000',
    bg: '#F4F5F7',
  },
]

const GUIDELINES = [
  { icon: '🤝', title: 'Be respectful', desc: 'Treat every person in the community with kindness. Disagreements are fine; personal attacks are not.' },
  { icon: '🔍', title: 'Search before posting', desc: 'Check if your question has already been answered before opening a new thread.' },
  { icon: '📎', title: 'Include context', desc: 'When reporting a bug, share the steps to reproduce it, your browser, and a screenshot if relevant.' },
  { icon: '🌱', title: 'Help others grow', desc: 'Share what you\'ve built with bahnOS. Templates, workflows, and tips are always welcome.' },
]

export default function CommunityPage() {
  return (
    <div style={{ background: '#FAFBFC', color: navy, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", minHeight: '100vh' }}>
      <Navbar />

      {/* Hero */}
      <section style={{ background: navy, padding: '80px 24px 64px', textAlign: 'center' }}>
        <p style={{ fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4C9AFF', marginBottom: 12 }}>Community</p>
        <h1 style={{ fontSize: 'clamp(1.875rem, 4vw, 2.875rem)', fontWeight: 800, color: '#fff', lineHeight: 1.15, margin: '0 0 16px' }}>
          Connect with other bahnOS users
        </h1>
        <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, maxWidth: 500, margin: '0 auto' }}>
          Ask questions, share templates, and help shape the direction of bahnOS alongside a growing community of teams.
        </p>
      </section>

      {/* Channels */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
          {CHANNELS.map(c => (
            <div key={c.name} style={{ background: '#fff', border: `1px solid ${border}`, borderRadius: 12, padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 32 }}>{c.icon}</div>
              <div>
                <div style={{ fontSize: '1.0625rem', fontWeight: 700, color: navy, marginBottom: 6 }}>{c.name}</div>
                <div style={{ fontSize: '0.875rem', color: textSubtle, lineHeight: 1.65 }}>{c.desc}</div>
              </div>
              <a href={c.href} target="_blank" rel="noopener noreferrer" style={{
                marginTop: 'auto', display: 'inline-block', padding: '8px 18px', borderRadius: 6,
                background: c.bg, color: c.color, fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none',
                transition: 'opacity 0.1s',
              }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.8' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
              >{c.cta} →</a>
            </div>
          ))}
        </div>
      </div>

      {/* Guidelines */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 96px' }}>
        <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: navy, marginBottom: 32, textAlign: 'center' }}>Community guidelines</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
          {GUIDELINES.map(g => (
            <div key={g.title} style={{ background: '#fff', border: `1px solid ${border}`, borderRadius: 10, padding: '20px 18px' }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>{g.icon}</div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: navy, marginBottom: 6 }}>{g.title}</div>
              <div style={{ fontSize: '0.8125rem', color: textSubtle, lineHeight: 1.6 }}>{g.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  )
}
