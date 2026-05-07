import React from 'react'
import Navbar from '../components/landing/Navbar.jsx'
import Footer from '../components/landing/Footer.jsx'

const navy = '#172B4D'
const blue = '#0052CC'
const textSubtle = '#5E6C84'
const border = '#DFE1E6'

const VALUES = [
  { icon: '🏗️', title: 'Build something real', desc: 'We ship fast, ship often, and care deeply about craft. Every engineer touches the product end to end.' },
  { icon: '🌍', title: 'Remote-first', desc: 'The whole team is distributed. Async-first culture with thoughtful overlap hours for collaboration.' },
  { icon: '📈', title: 'Equity from day one', desc: 'Everyone on the team gets meaningful equity. We want you to win when bahnOS wins.' },
  { icon: '🧘', title: 'Sustainable pace', desc: 'We don\'t glorify crunch. We plan realistically and protect personal time as a team norm.' },
]

export default function CareersPage() {
  return (
    <div style={{ background: '#FAFBFC', color: navy, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", minHeight: '100vh' }}>
      <Navbar />

      {/* Hero */}
      <section style={{ background: navy, padding: '80px 24px 64px', textAlign: 'center' }}>
        <p style={{ fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4C9AFF', marginBottom: 12 }}>Careers</p>
        <h1 style={{ fontSize: 'clamp(1.875rem, 4vw, 2.875rem)', fontWeight: 800, color: '#fff', lineHeight: 1.15, margin: '0 0 16px' }}>
          Help us build the future of visual planning
        </h1>
        <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, maxWidth: 500, margin: '0 auto 32px' }}>
          Small team. Big ambition. We're looking for people who care about craft, love developer tools, and want to build something teams rely on every day.
        </p>
        <div style={{ display: 'inline-flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[['100%', 'Remote'], ['Seed', 'Stage']].map(([v, l]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>{v}</div>
              <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.55)' }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 0' }}>
        <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: navy, marginBottom: 28, textAlign: 'center' }}>How we work</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 18 }}>
          {VALUES.map(v => (
            <div key={v.title} style={{ background: '#fff', border: `1px solid ${border}`, borderRadius: 10, padding: '20px 18px' }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>{v.icon}</div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: navy, marginBottom: 6 }}>{v.title}</div>
              <div style={{ fontSize: '0.8125rem', color: textSubtle, lineHeight: 1.6 }}>{v.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* No open roles */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '56px 32px 96px' }}>
        <div style={{ padding: '40px 28px', background: '#fff', border: `1px solid ${border}`, borderRadius: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📭</div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: navy, marginBottom: 8 }}>No open positions right now</h2>
          <p style={{ fontSize: '0.9375rem', color: textSubtle, lineHeight: 1.7, margin: '0 auto 20px', maxWidth: 400 }}>
            We're not actively hiring at the moment, but we're always happy to hear from exceptional people.
          </p>
          <a href="mailto:jobs@bahn.app" style={{ fontSize: '0.875rem', fontWeight: 600, color: blue, textDecoration: 'none' }}>
            Send us your CV → jobs@bahn.app
          </a>
        </div>
      </div>

      <Footer />
    </div>
  )
}
