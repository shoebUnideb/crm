import React from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/landing/Navbar.jsx'
import Footer from '../components/landing/Footer.jsx'

const navy = '#172B4D'
const blue = '#0052CC'
const textSubtle = '#5E6C84'
const border = '#DFE1E6'

const POSTS = [
  {
    slug: '#', tag: 'Product', date: 'May 5, 2026',
    title: 'Multi-map projects: design decisions and what we got wrong first',
    excerpt: 'When users started asking for multiple canvases inside one project, we assumed a simple tab UI would work. It didn\'t. Here\'s what we learned building the rail-and-flyout model instead.',
    readMins: 7,
    author: { name: 'bahnOS Team', initials: 'BT' },
  },
  {
    slug: '#', tag: 'Engineering', date: 'April 18, 2026',
    title: 'How we built real-time collab without a dedicated infra team',
    excerpt: 'Socket.IO, a single Node server, and a very simple operational transform. We\'re not proud of everything in v1, but it works — and here\'s how.',
    readMins: 12,
    author: { name: 'bahnOS Team', initials: 'BT' },
  },
  {
    slug: '#', tag: 'Use case', date: 'April 3, 2026',
    title: 'Using bahnOS to run weekly engineering planning at a 30-person startup',
    excerpt: 'A guest post from a team that replaced three different tools (Notion, Miro, and Jira separately) with a single bahnOS project per squad. Their setup, their templates, their wins.',
    readMins: 5,
    author: { name: 'Guest', initials: 'GS' },
  },
  {
    slug: '#', tag: 'Tips', date: 'March 22, 2026',
    title: '8 keyboard shortcuts that will change how you use the canvas',
    excerpt: 'Most users never discover Tab-to-add-child, or that pressing F fits the entire tree. This post covers the eight shortcuts we use every single day.',
    readMins: 3,
    author: { name: 'bahnOS Team', initials: 'BT' },
  },
]

const TAG_COLORS = {
  Product:     { bg: '#EAE6FF', color: '#5243AA' },
  Engineering: { bg: '#DEEBFF', color: '#0052CC' },
  'Use case':  { bg: '#E3FCEF', color: '#006644' },
  Tips:        { bg: '#FFF0B3', color: '#172B4D' },
}

export default function BlogPage() {
  return (
    <div style={{ background: '#FAFBFC', color: navy, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", minHeight: '100vh' }}>
      <Navbar />

      {/* Hero */}
      <section style={{ background: navy, padding: '80px 24px 64px', textAlign: 'center' }}>
        <p style={{ fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4C9AFF', marginBottom: 12 }}>Blog</p>
        <h1 style={{ fontSize: 'clamp(1.875rem, 4vw, 2.875rem)', fontWeight: 800, color: '#fff', lineHeight: 1.15, margin: '0 0 16px' }}>
          Stories from the bahnOS team
        </h1>
        <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, maxWidth: 480, margin: '0 auto' }}>
          Product thinking, engineering deep-dives, and real-world use cases from teams using bahnOS daily.
        </p>
      </section>

      {/* Featured post */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '56px 32px 0' }}>
        <div style={{
          background: '#fff', border: `1px solid ${border}`, borderRadius: 12, overflow: 'hidden',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0,
          boxShadow: '0 2px 12px rgba(9,30,66,0.07)',
        }}>
          <div style={{ background: `linear-gradient(135deg, ${navy} 0%, #0052CC 100%)`, minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 64 }}>📝</span>
          </div>
          <div style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, background: TAG_COLORS[POSTS[0].tag].bg, color: TAG_COLORS[POSTS[0].tag].color, borderRadius: 4, padding: '2px 8px' }}>{POSTS[0].tag}</span>
              <span style={{ fontSize: '0.75rem', color: textSubtle }}>{POSTS[0].date}</span>
            </div>
            <h2 style={{ fontSize: '1.1875rem', fontWeight: 700, color: navy, lineHeight: 1.4, margin: 0 }}>{POSTS[0].title}</h2>
            <p style={{ fontSize: '0.875rem', color: textSubtle, lineHeight: 1.65, margin: 0 }}>{POSTS[0].excerpt}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 'auto' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>{POSTS[0].author.initials}</div>
              <span style={{ fontSize: '0.8125rem', color: textSubtle }}>{POSTS[0].author.name} · {POSTS[0].readMins} min read</span>
            </div>
          </div>
        </div>
      </div>

      {/* Post list */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 32px 96px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {POSTS.slice(1).map(post => {
            const tc = TAG_COLORS[post.tag] || { bg: '#F4F5F7', color: textSubtle }
            return (
              <a key={post.title} href={post.slug} style={{
                background: '#fff', border: `1px solid ${border}`, borderRadius: 10, padding: '20px 22px',
                textDecoration: 'none', display: 'flex', gap: 20, alignItems: 'flex-start',
                transition: 'box-shadow 0.15s, border-color 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(9,30,66,0.08)'; e.currentTarget.style.borderColor = '#B3BAC5' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = border }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, background: tc.bg, color: tc.color, borderRadius: 4, padding: '2px 7px' }}>{post.tag}</span>
                    <span style={{ fontSize: '0.75rem', color: textSubtle }}>{post.date}</span>
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: navy, marginBottom: 6, lineHeight: 1.4 }}>{post.title}</div>
                  <div style={{ fontSize: '0.875rem', color: textSubtle, lineHeight: 1.6 }}>{post.excerpt}</div>
                </div>
                <div style={{ fontSize: '0.75rem', color: textSubtle, flexShrink: 0, paddingTop: 2 }}>{post.readMins} min</div>
              </a>
            )
          })}
        </div>
      </div>

      <Footer />
    </div>
  )
}
