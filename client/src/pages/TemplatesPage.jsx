import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/landing/Navbar.jsx'
import Footer from '../components/landing/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useAuthModal } from '../context/AuthModalContext.jsx'

const blue      = '#0052CC'
const blueLight = '#DEEBFF'
const bluePale  = '#4C9AFF'
const navy      = '#172B4D'
const heroBlue  = '#0747A6'
const bg        = '#FAFBFC'
const surface   = '#FFFFFF'
const subtle    = '#5E6C84'
const border    = '#DFE1E6'

function SectionLabel({ children, dark = false }) {
  return (
    <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: dark ? bluePale : blue, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ display: 'inline-block', width: 28, height: 2, background: dark ? bluePale : blue, borderRadius: 2, flexShrink: 0 }} />
      {children}
    </p>
  )
}

const CATEGORIES = ['All', 'Startup', 'Marketing', 'Engineering', 'Product', 'Team', 'Design', 'Strategy', 'Personal']

const TEMPLATES = [
  { id: 'pitch-deck',           category: 'Startup',     icon: '🎤', name: 'Pitch Deck Outline',       description: 'Problem, solution, market, business model, traction, team, and ask — structured for investors.', popular: true },
  { id: 'business-model-canvas',category: 'Startup',     icon: '🏢', name: 'Business Model Canvas',     description: 'Nine-block canvas covering value proposition, channels, revenue streams, and cost structure.', popular: true },
  { id: 'hiring-pipeline',      category: 'Startup',     icon: '👥', name: 'Hiring Pipeline',           description: 'Track candidates through sourcing, screening, interviews, offer, and onboarding.' },
  { id: 'fundraising-tracker',  category: 'Startup',     icon: '💰', name: 'Fundraising Tracker',       description: 'Track investors through intro, meeting, due diligence, term sheet, and close stages.' },
  { id: 'kpi-dashboard',        category: 'Startup',     icon: '📈', name: 'KPI Dashboard',             description: 'Growth, product, revenue, and ops metrics in one visual tree for weekly review.' },
  { id: 'quarterly-planning',   category: 'Startup',     icon: '📆', name: 'Quarterly Planning',        description: 'OKRs mapped to workstreams with owners, milestones, and success criteria for a 13-week cycle.' },
  { id: 'sales-pipeline',       category: 'Startup',     icon: '💸', name: 'Sales Pipeline',            description: 'Track leads from first touch to closed deal — qualified, demo, proposal, and closed won.', popular: true },
  { id: 'budget-runway',        category: 'Startup',     icon: '🛫', name: 'Budget & Runway Planner',   description: 'Monthly burn, revenue, headcount costs, and runway calculation in one visual map.' },
  { id: 'content-calendar',     category: 'Marketing',   icon: '📅', name: 'Content Calendar',          description: 'Content pillars, channel schedule, topics, and publishing workflow for consistent output.', popular: true },
  { id: 'sprint',               category: 'Engineering', icon: '🏃', name: 'Sprint Planning',           description: 'Ready-made sprint board with user stories, tasks, and story point tracking.', popular: true },
  { id: 'feature',              category: 'Engineering', icon: '✨', name: 'Feature Breakdown',         description: 'Single feature broken into epics, stories, and tasks across UX, backend, frontend, and QA.', popular: true },
  { id: 'bug-triage',           category: 'Engineering', icon: '🐛', name: 'Bug Triage Board',          description: 'Prioritized bug tracking with critical, high, and low severity lanes.' },
  { id: 'api-design',           category: 'Engineering', icon: '🔌', name: 'API Design',                description: 'Endpoint tree with methods, auth layers, and request/response flows.' },
  { id: 'release-planning',     category: 'Engineering', icon: '🚀', name: 'Release Planning',          description: 'Track everything that needs to happen before a version ships.' },
  { id: 'incident-response',    category: 'Engineering', icon: '🚨', name: 'Incident Response',         description: 'Structured runbook for triaging, resolving, and learning from outages.' },
  { id: 'tech-debt',            category: 'Engineering', icon: '🔧', name: 'Tech Debt Tracker',         description: 'Categorize and prioritize technical debt by area, impact, and effort to pay it down.' },
  { id: 'system-architecture',  category: 'Engineering', icon: '🏗️', name: 'System Architecture',       description: 'Frontend, backend, database, and infra layers mapped with services and data flows.' },
  { id: 'deployment-checklist', category: 'Engineering', icon: '✅', name: 'Deployment Checklist',      description: 'Pre-deploy, deploy, and post-deploy steps with rollback triggers and owner assignments.' },
  { id: 'roadmap',              category: 'Product',     icon: '🗺️', name: 'Product Roadmap',           description: 'Quarterly roadmap with themes, epics, and prioritized feature lanes.', popular: true },
  { id: 'okr',                  category: 'Product',     icon: '🎯', name: 'OKR Planning',              description: 'Objectives and key results mapped to initiatives and owners.' },
  { id: 'go-to-market',         category: 'Product',     icon: '📣', name: 'Go-to-Market Plan',         description: 'Launch checklist covering positioning, channels, and milestones.' },
  { id: 'user-story-map',       category: 'Product',     icon: '🗂️', name: 'User Story Map',            description: 'Map user journeys to activities, tasks, and release slices.' },
  { id: 'competitive-analysis', category: 'Product',     icon: '📊', name: 'Competitive Analysis',      description: 'Side-by-side comparison of competitors across key dimensions.' },
  { id: 'feature-prioritization',category:'Product',     icon: '⚖️', name: 'Feature Prioritization',    description: 'Score features by impact, effort, and confidence to build a data-driven backlog.' },
  { id: 'prd-template',         category: 'Product',     icon: '📄', name: 'PRD Template',              description: 'Problem statement, goals, user stories, scope, non-goals, and success metrics.' },
  { id: 'retro',                category: 'Team',        icon: '🔄', name: 'Sprint Retrospective',      description: "What went well, what didn't, and what to improve next sprint.", popular: true },
  { id: 'risk-register',        category: 'Team',        icon: '⚠️', name: 'Risk Register',             description: 'Identify, score, and assign mitigation strategies to project risks.' },
  { id: 'onboarding',           category: 'Team',        icon: '👋', name: 'Team Onboarding',           description: 'Structured onboarding plan with milestones for new team members.' },
  { id: 'decision-log',         category: 'Team',        icon: '📝', name: 'Decision Log',              description: 'Record architectural and product decisions with context and trade-offs.' },
  { id: 'meeting-agenda',       category: 'Team',        icon: '📋', name: 'Meeting Agenda',            description: 'Recurring meeting structure with agenda items, owners, and action tracking.' },
  { id: 'one-on-one',           category: 'Team',        icon: '🤝', name: '1-on-1 Template',           description: 'Wins, blockers, growth goals, and feedback prompts for a structured weekly 1-on-1.' },
  { id: 'design-sprint',        category: 'Design',      icon: '🎨', name: 'Design Sprint',             description: 'Five-day sprint structure: understand, sketch, decide, prototype, test.' },
  { id: 'customer-journey',     category: 'Design',      icon: '🧭', name: 'Customer Journey Map',      description: 'Map touchpoints, emotions, and pain points across the user lifecycle.' },
  { id: 'user-persona',         category: 'Design',      icon: '🙋', name: 'User Persona',              description: 'Demographics, goals, pain points, motivations, and behavioral patterns for your key users.' },
  { id: 'ux-audit',             category: 'Design',      icon: '🔍', name: 'UX Audit',                  description: 'Heuristic evaluation across usability, accessibility, consistency, and delight dimensions.' },
  { id: 'swot',                 category: 'Strategy',    icon: '🧩', name: 'SWOT Analysis',             description: 'Strengths, weaknesses, opportunities, and threats mapped visually.' },
  { id: 'project-charter',      category: 'Strategy',    icon: '📋', name: 'Project Charter',           description: 'Define scope, stakeholders, goals, and success criteria before kickoff.' },
  { id: 'north-star-metric',    category: 'Strategy',    icon: '⭐', name: 'North Star Metric',         description: 'One key metric tied to input drivers, initiatives, and weekly review — aligns the whole team.' },
  { id: 'personal-project',     category: 'Personal',    icon: '💡', name: 'Personal Project Plan',     description: 'Break a side project into phases, tasks, and milestones with a simple solo workflow.', popular: true },
  { id: 'study-roadmap',        category: 'Personal',    icon: '📚', name: 'Study Roadmap',             description: 'Curriculum, resources, milestones, and practice exercises for learning a new skill.', popular: true },
  { id: 'job-search',           category: 'Personal',    icon: '💼', name: 'Job Search Tracker',        description: 'Track companies, application status, contacts, interview prep, and offers in one map.' },
  { id: 'essay-outline',        category: 'Personal',    icon: '✏️', name: 'Essay / Report Outline',    description: 'Introduction, arguments, evidence, counterarguments, and conclusion with writing prompts.' },
  { id: 'weekly-review',        category: 'Personal',    icon: '🗓️', name: 'Weekly Review',             description: 'Wins, open loops, top 3 priorities, habit tracker, and energy check — GTD-style.', popular: true },
]

const CATEGORY_COLORS = {
  Startup:     { bg: '#FFEBE6', color: '#BF2600' },
  Marketing:   { bg: '#E3FCEF', color: '#006644' },
  Engineering: { bg: '#DEEBFF', color: '#0052CC' },
  Product:     { bg: '#EAE6FF', color: '#5243AA' },
  Team:        { bg: '#E3FCEF', color: '#006644' },
  Design:      { bg: '#FFECF8', color: '#97135C' },
  Strategy:    { bg: '#FFF0B3', color: '#172B4D' },
  Personal:    { bg: '#EAE6FF', color: '#403294' },
}

function TemplateCard({ template, onUse }) {
  const [hov, setHov] = useState(false)
  const cat = CATEGORY_COLORS[template.category] || { bg: '#F4F5F7', color: subtle }
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? blueLight : surface,
        border: `1px solid ${hov ? blue : border}`,
        borderRadius: 10, padding: '22px 20px 18px',
        display: 'flex', flexDirection: 'column', gap: 10,
        transition: 'background 0.18s, border-color 0.18s, box-shadow 0.18s',
        boxShadow: hov ? '0 6px 24px rgba(9,30,66,0.1)' : 'none',
        position: 'relative', height: '100%', boxSizing: 'border-box',
      }}
    >
      {template.popular && (
        <span style={{ position: 'absolute', top: 14, right: 14, fontSize: 10, fontWeight: 700, background: '#FFF0B3', color: navy, borderRadius: 4, padding: '2px 7px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Popular
        </span>
      )}
      <div style={{ fontSize: 28 }}>{template.icon}</div>
      <div>
        <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: navy, marginBottom: 5 }}>{template.name}</div>
        <div style={{ fontSize: '0.8125rem', color: subtle, lineHeight: 1.65 }}>{template.description}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, background: cat.bg, color: cat.color, borderRadius: 4, padding: '3px 8px' }}>
          {template.category}
        </span>
        <button onClick={() => onUse(template.id)}
          style={{ fontSize: 12, fontWeight: 600, color: blue, cursor: 'pointer', padding: '5px 10px', borderRadius: 5, border: `1.5px solid ${blue}`, background: 'transparent', transition: 'background 0.12s' }}
          onMouseEnter={e => { e.currentTarget.style.background = blueLight }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >
          Use template →
        </button>
      </div>
    </div>
  )
}

export default function TemplatesPage() {
  const [active, setActive] = useState('All')
  const [query, setQuery] = useState('')
  const { isAuthenticated, isGuest } = useAuth()
  const { openLogin } = useAuthModal()
  const navigate = useNavigate()

  function handleUseTemplate(templateId) {
    sessionStorage.setItem('bahn_pending_template', templateId)
    if (isAuthenticated || isGuest) {
      navigate('/canvas')
    } else {
      openLogin()
    }
  }

  const visible = TEMPLATES.filter(t => {
    const matchCat = active === 'All' || t.category === active
    const matchQ = !query || t.name.toLowerCase().includes(query.toLowerCase()) || t.description.toLowerCase().includes(query.toLowerCase())
    return matchCat && matchQ
  })

  const popular = visible.filter(t => t.popular)
  const rest = visible.filter(t => !t.popular)

  return (
    <div style={{ background: bg, color: navy, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", minHeight: '100vh', overflowX: 'hidden' }}>
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section style={{ background: heroBlue, minHeight: '48vh', display: 'flex', alignItems: 'center', padding: '0 8vw', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(76,154,255,0.15) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: '-1%', bottom: '4%', fontSize: 'clamp(60px, 11vw, 150px)', fontWeight: 900, color: 'rgba(255,255,255,0.04)', letterSpacing: '-0.04em', lineHeight: 1, userSelect: 'none', pointerEvents: 'none' }}>TEMPLATES</div>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 680, width: '100%' }}>
          <SectionLabel dark>Template Gallery</SectionLabel>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.08, marginBottom: 22, color: '#fff' }}>
            Start from a<br /><span style={{ color: bluePale }}>proven structure</span>
          </h1>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.78, maxWidth: 500, marginBottom: 28 }}>
            {TEMPLATES.length} templates across startup, engineering, product, design, strategy, and personal. Pick one, open in the app, and customise from there.
          </p>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search templates…"
            style={{ width: '100%', maxWidth: 400, padding: '11px 18px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: '0.9375rem', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      </section>

      {/* ── CATEGORY FILTER ─────────────────────────────────────────────────── */}
      <div style={{ borderBottom: `1px solid ${border}`, background: surface, position: 'sticky', top: 56, zIndex: 5 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 6vw', display: 'flex', gap: 4, overflowX: 'auto' }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActive(cat)} style={{
              padding: '14px 16px', fontSize: '0.875rem', fontWeight: active === cat ? 600 : 400,
              color: active === cat ? blue : subtle, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0,
              borderBottom: active === cat ? `2px solid ${blue}` : '2px solid transparent', transition: 'color 0.12s, border-color 0.12s',
            }}
              onMouseEnter={e => { if (active !== cat) e.currentTarget.style.color = navy }}
              onMouseLeave={e => { if (active !== cat) e.currentTarget.style.color = subtle }}
            >{cat}</button>
          ))}
        </div>
      </div>

      {/* ── GRID ─────────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 6vw 96px' }}>
        {visible.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: subtle }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
            <p style={{ fontSize: '1rem' }}>No templates match "{query}"</p>
          </div>
        ) : (
          <>
            {/* Popular strip — shown when not empty */}
            {popular.length > 0 && (
              <>
                <div style={{ marginBottom: 24 }}>
                  <SectionLabel>Popular</SectionLabel>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20, marginBottom: 48 }}>
                  {popular.map((t, i) => <TemplateCard key={t.id} template={t} onUse={handleUseTemplate} />)}
                </div>
              </>
            )}

            {/* Rest */}
            {rest.length > 0 && (
              <>
                {popular.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <SectionLabel>All templates</SectionLabel>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                  {rest.map((t, i) => <TemplateCard key={t.id} template={t} onUse={handleUseTemplate} />)}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  )
}
