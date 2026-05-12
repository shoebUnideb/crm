import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/landing/Navbar.jsx'
import Footer from '../components/landing/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useAuthModal } from '../context/AuthModalContext.jsx'

// ─── Design tokens ────────────────────────────────────────────────────────────
const BLUE    = '#172B4D'
const SUBTLE  = '#5E6C84'
const MUTED   = '#97A0AF'
const BORDER  = '#DFE1E6'
const BG      = '#FAFBFC'
const SURFACE = '#FFFFFF'
const ACCENT  = '#0052CC'
const CAPSULE = '#6554C0'
const CRM_C   = '#00875A'
const WIKI_C  = '#FF8B00'

// ─── Template data ────────────────────────────────────────────────────────────
const CAPSULE_TEMPLATES = [
  { id: 'pitch-deck',            category: 'Startup',     icon: '🎤', name: 'Pitch Deck Outline',        description: 'Problem, solution, market, business model, traction, team, and ask — structured for investors.', popular: true },
  { id: 'business-model-canvas', category: 'Startup',     icon: '🏢', name: 'Business Model Canvas',      description: 'Nine-block canvas covering value proposition, channels, revenue streams, and cost structure.', popular: true },
  { id: 'hiring-pipeline',       category: 'Startup',     icon: '👥', name: 'Hiring Pipeline',            description: 'Track candidates through sourcing, screening, interviews, offer, and onboarding.' },
  { id: 'fundraising-tracker',   category: 'Startup',     icon: '💰', name: 'Fundraising Tracker',        description: 'Track investors through intro, meeting, due diligence, term sheet, and close stages.' },
  { id: 'kpi-dashboard',         category: 'Startup',     icon: '📈', name: 'KPI Dashboard',              description: 'Growth, product, revenue, and ops metrics in one visual tree for weekly review.' },
  { id: 'quarterly-planning',    category: 'Startup',     icon: '📆', name: 'Quarterly Planning',         description: 'OKRs mapped to workstreams with owners, milestones, and success criteria for a 13-week cycle.' },
  { id: 'budget-runway',         category: 'Startup',     icon: '🛫', name: 'Budget & Runway Planner',    description: 'Monthly burn, revenue, headcount costs, and runway calculation in one visual map.' },
  { id: 'content-calendar',      category: 'Marketing',   icon: '📅', name: 'Content Calendar',           description: 'Content pillars, channel schedule, topics, and publishing workflow for consistent output.', popular: true },
  { id: 'sprint',                category: 'Engineering', icon: '🏃', name: 'Sprint Planning',            description: 'Ready-made sprint board with user stories, tasks, and story point tracking.', popular: true },
  { id: 'feature',               category: 'Engineering', icon: '✨', name: 'Feature Breakdown',          description: 'Single feature broken into epics, stories, and tasks across UX, backend, frontend, and QA.', popular: true },
  { id: 'bug-triage',            category: 'Engineering', icon: '🐛', name: 'Bug Triage Board',           description: 'Prioritized bug tracking with critical, high, and low severity lanes.' },
  { id: 'api-design',            category: 'Engineering', icon: '🔌', name: 'API Design',                 description: 'Endpoint tree with methods, auth layers, and request/response flows.' },
  { id: 'release-planning',      category: 'Engineering', icon: '🚀', name: 'Release Planning',           description: 'Track everything that needs to happen before a version ships.' },
  { id: 'incident-response',     category: 'Engineering', icon: '🚨', name: 'Incident Response',          description: 'Structured runbook for triaging, resolving, and learning from outages.' },
  { id: 'tech-debt',             category: 'Engineering', icon: '🔧', name: 'Tech Debt Tracker',          description: 'Categorize and prioritize technical debt by area, impact, and effort.' },
  { id: 'system-architecture',   category: 'Engineering', icon: '🏗️', name: 'System Architecture',        description: 'Frontend, backend, database, and infra layers mapped with services and data flows.' },
  { id: 'deployment-checklist',  category: 'Engineering', icon: '✅', name: 'Deployment Checklist',       description: 'Pre-deploy, deploy, and post-deploy steps with rollback triggers and owner assignments.' },
  { id: 'roadmap',               category: 'Product',     icon: '🗺️', name: 'Product Roadmap',            description: 'Quarterly roadmap with themes, epics, and prioritized feature lanes.', popular: true },
  { id: 'okr',                   category: 'Product',     icon: '🎯', name: 'OKR Planning',               description: 'Objectives and key results mapped to initiatives and owners.' },
  { id: 'go-to-market',          category: 'Product',     icon: '📣', name: 'Go-to-Market Plan',          description: 'Launch checklist covering positioning, channels, and milestones.' },
  { id: 'user-story-map',        category: 'Product',     icon: '🗂️', name: 'User Story Map',             description: 'Map user journeys to activities, tasks, and release slices.' },
  { id: 'competitive-analysis',  category: 'Product',     icon: '📊', name: 'Competitive Analysis',       description: 'Side-by-side comparison of competitors across key dimensions.' },
  { id: 'feature-prioritization',category: 'Product',     icon: '⚖️', name: 'Feature Prioritization',    description: 'Score features by impact, effort, and confidence to build a data-driven backlog.' },
  { id: 'prd-template',          category: 'Product',     icon: '📄', name: 'PRD Template',               description: 'Problem statement, goals, user stories, scope, non-goals, and success metrics.' },
  { id: 'retro',                 category: 'Team',        icon: '🔄', name: 'Sprint Retrospective',       description: "What went well, what didn't, and what to improve next sprint.", popular: true },
  { id: 'risk-register',         category: 'Team',        icon: '⚠️', name: 'Risk Register',              description: 'Identify, score, and assign mitigation strategies to project risks.' },
  { id: 'decision-log',          category: 'Team',        icon: '📝', name: 'Decision Log',               description: 'Record architectural and product decisions with context and trade-offs.' },
  { id: 'meeting-agenda',        category: 'Team',        icon: '📋', name: 'Meeting Agenda',             description: 'Recurring meeting structure with agenda items, owners, and action tracking.' },
  { id: 'one-on-one',            category: 'Team',        icon: '🤝', name: '1-on-1 Template',            description: 'Wins, blockers, growth goals, and feedback prompts for a structured weekly 1-on-1.' },
  { id: 'design-sprint',         category: 'Design',      icon: '🎨', name: 'Design Sprint',              description: 'Five-day sprint structure: understand, sketch, decide, prototype, test.' },
  { id: 'customer-journey',      category: 'Design',      icon: '🧭', name: 'Customer Journey Map',       description: 'Map touchpoints, emotions, and pain points across the user lifecycle.' },
  { id: 'user-persona',          category: 'Design',      icon: '🙋', name: 'User Persona',               description: 'Demographics, goals, pain points, motivations, and behavioral patterns.' },
  { id: 'ux-audit',              category: 'Design',      icon: '🔍', name: 'UX Audit',                   description: 'Heuristic evaluation across usability, accessibility, consistency, and delight.' },
  { id: 'swot',                  category: 'Strategy',    icon: '🧩', name: 'SWOT Analysis',              description: 'Strengths, weaknesses, opportunities, and threats mapped visually.' },
  { id: 'project-charter',       category: 'Strategy',    icon: '📋', name: 'Project Charter',            description: 'Define scope, stakeholders, goals, and success criteria before kickoff.' },
  { id: 'north-star-metric',     category: 'Strategy',    icon: '⭐', name: 'North Star Metric',          description: 'One key metric tied to input drivers, initiatives, and weekly review.' },
  { id: 'personal-project',      category: 'Personal',    icon: '💡', name: 'Personal Project Plan',      description: 'Break a side project into phases, tasks, and milestones with a simple solo workflow.', popular: true },
  { id: 'study-roadmap',         category: 'Personal',    icon: '📚', name: 'Study Roadmap',              description: 'Curriculum, resources, milestones, and practice exercises for learning a new skill.', popular: true },
  { id: 'job-search',            category: 'Personal',    icon: '💼', name: 'Job Search Tracker',         description: 'Track companies, application status, contacts, interview prep, and offers.' },
  { id: 'weekly-review',         category: 'Personal',    icon: '🗓️', name: 'Weekly Review',              description: 'Wins, open loops, top 3 priorities, habit tracker, and energy check — GTD-style.', popular: true },
].map(t => ({ ...t, product: 'capsule', appPath: '/app/canvas' }))

const CRM_TEMPLATES = [
  { id: 'saas-pipeline',         category: 'Sales',    icon: '🏎️', name: 'SaaS Sales Pipeline',         description: 'Qualified → Demo → Proposal → Negotiation → Closed Won. Built for subscription sales cycles.', popular: true },
  { id: 'sdr-tracker',           category: 'Sales',    icon: '🎯', name: 'SDR Outreach Tracker',         description: 'Track cadences, call attempts, email sequences, and conversion rates per rep.' },
  { id: 'enterprise-deal',       category: 'Sales',    icon: '🏛️', name: 'Enterprise Deal Room',         description: 'Multi-stakeholder deal tracking with champions, decision makers, blockers, and timelines.', popular: true },
  { id: 'partnership-pipeline',  category: 'Sales',    icon: '🤝', name: 'Partnership Pipeline',         description: 'Outbound partner pipeline from prospecting through signed agreement and launch.' },
  { id: 'renewal-pipeline',      category: 'Revenue',  icon: '🔄', name: 'Renewal & Expansion Pipeline', description: 'Track renewals, upsells, and expansions 90 days out with health scores and risk flags.' },
  { id: 'revenue-forecast',      category: 'Revenue',  icon: '📈', name: 'Revenue Forecast Board',       description: 'Weighted pipeline, commit forecast, and best-case view across the team by quarter.', popular: true },
  { id: 'customer-success',      category: 'Revenue',  icon: '💚', name: 'Customer Success Tracker',     description: 'Post-sale onboarding, health scoring, QBR scheduling, and churn risk management.' },
  { id: 'lead-scoring',          category: 'Pipeline', icon: '⚡', name: 'Lead Scoring Matrix',          description: 'Qualify inbound leads by firmographics, behavior, and engagement before handing to sales.' },
  { id: 'account-based',         category: 'Sales',    icon: '🏢', name: 'Account-Based Sales',          description: 'Target accounts with multi-thread outreach maps tracking all contacts and activities.' },
  { id: 'cold-outreach',         category: 'Sales',    icon: '📧', name: 'Cold Outreach Sequence',       description: 'Multi-touch cold sequence: email 1, follow-up, LinkedIn, call, breakup email with timing.' },
  { id: 'win-loss',              category: 'Revenue',  icon: '📊', name: 'Win / Loss Analysis',          description: 'Capture competitive wins and losses with reason codes, competitor names, and deal data.' },
  { id: 'sales-retro',           category: 'Pipeline', icon: '🔍', name: 'Sales Retrospective',          description: 'Monthly or quarterly review of pipeline health, conversion rates, and rep performance.' },
].map(t => ({ ...t, product: 'crm', appPath: '/app/crm' }))

const WIKI_TEMPLATES = [
  { id: 'eng-runbook',           category: 'Engineering', icon: '📘', name: 'Engineering Runbook',          description: 'Step-by-step operational procedures: deploy, rollback, incident response, and escalation paths.', popular: true },
  { id: 'employee-handbook',     category: 'Knowledge',   icon: '🧑‍💼', name: 'Employee Handbook',            description: 'Company values, policies, benefits, and processes — structured for new hires and HR reviews.', popular: true },
  { id: 'product-spec',          category: 'Engineering', icon: '🚀', name: 'Product Spec (PRD)',            description: 'Problem, goals, success metrics, user stories, scope, non-goals, and open questions.' },
  { id: 'security-policy',       category: 'Docs',        icon: '🔐', name: 'Security Policy Document',     description: 'Access control, data handling, incident reporting, and compliance requirements.' },
  { id: 'meeting-notes-wiki',    category: 'Knowledge',   icon: '📋', name: 'Meeting Notes Template',       description: 'Attendees, agenda, decisions, action items, and owners — ready to share in one click.' },
  { id: 'onboarding-guide',      category: 'Knowledge',   icon: '🎓', name: 'Team Onboarding Guide',        description: 'Week 1–4 milestones, tool setup checklist, team introductions, and first-project guide.', popular: true },
  { id: 'adr',                   category: 'Engineering', icon: '🏗️', name: 'Architecture Decision Record',  description: 'Status, context, decision, consequences, and alternatives — one doc per architectural choice.' },
  { id: 'tech-spec',             category: 'Engineering', icon: '💻', name: 'Technical Specification',      description: 'System design, data models, API contracts, error handling, and testing strategy.' },
  { id: 'brand-guidelines',      category: 'Knowledge',   icon: '🎨', name: 'Brand Guidelines',             description: "Logo usage, color palette, typography, tone of voice, and do/don't examples." },
  { id: 'postmortem',            category: 'Docs',        icon: '🚨', name: 'Incident Postmortem',          description: 'Timeline, root cause, contributing factors, impact, and action items after an outage.' },
  { id: 'api-docs',              category: 'Engineering', icon: '🔌', name: 'API Documentation',            description: 'Endpoint reference, authentication, request/response examples, and error codes.' },
  { id: 'team-charter',          category: 'Knowledge',   icon: '🤝', name: 'Team Charter',                 description: 'Mission, working principles, communication norms, and decision-making framework.' },
].map(t => ({ ...t, product: 'wiki', appPath: '/app/docs' }))

const ALL_TEMPLATES = [...CAPSULE_TEMPLATES, ...CRM_TEMPLATES, ...WIKI_TEMPLATES]

const PRODUCT_META = {
  capsule: { label: 'Capsule', color: CAPSULE, bg: '#EAE6FF' },
  crm:     { label: 'CRM',     color: CRM_C,   bg: '#E3FCEF' },
  wiki:    { label: 'Wiki',    color: WIKI_C,  bg: '#FFF7E6' },
}

const CAT_COLORS = {
  Startup:     { bg: '#FFEBE6', color: '#BF2600' },
  Marketing:   { bg: '#E3FCEF', color: '#006644' },
  Engineering: { bg: '#DEEBFF', color: '#0052CC' },
  Product:     { bg: '#EAE6FF', color: '#5243AA' },
  Team:        { bg: '#E3FCEF', color: '#006644' },
  Design:      { bg: '#FFECF8', color: '#97135C' },
  Strategy:    { bg: '#FFF0B3', color: '#172B4D' },
  Personal:    { bg: '#EAE6FF', color: '#403294' },
  Sales:       { bg: '#E3FCEF', color: '#006644' },
  Revenue:     { bg: '#DEEBFF', color: '#0052CC' },
  Pipeline:    { bg: '#EAE6FF', color: '#5243AA' },
  Knowledge:   { bg: '#FFF0B3', color: '#172B4D' },
  Docs:        { bg: '#DEEBFF', color: '#0052CC' },
}

// ─── Product guides ───────────────────────────────────────────────────────────
const GUIDES = [
  {
    product: 'capsule', color: CAPSULE,
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>,
    name: 'bahn Capsule', tagline: 'Visual operational workspace — every node a capsule',
    pitch: 'Jira gives you tickets. Miro gives you whiteboards. Capsule gives you both, connected. Every node holds context, assignees, status, docs, and Jira sync. Your roadmap becomes your sprint board without copy-pasting a thing.',
    howTo: [
      'Create a project and build your first map — Tab adds a child, Enter adds a sibling',
      'Click any node to assign status, priority, owner, story points, and due date',
      'Switch to Kanban, Sprint board, Timeline, or Table view with one click',
      'Open the Jira panel and push any subtree as Epics, Stories, and Subtasks',
    ],
    vsLabel: 'vs Jira + Miro + Notion',
    vs: [
      { them: 'Jira tickets with no visual context or roadmap',  us: 'Visual map + built-in tickets — same tool, no sync needed' },
      { them: "Miro whiteboards that don't track real work",     us: 'Visual planning that IS your sprint board and backlog' },
      { them: '3 separate tools, constant context-switching',    us: 'One canvas for planning, execution, and collaboration' },
      { them: 'Jira $8.15/seat + Miro $10/seat + Notion $16',   us: 'All included in your bahnOS plan' },
    ],
    to: '/capsule',
  },
  {
    product: 'crm', color: CRM_C,
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    name: 'bahn CRM', tagline: 'Revenue pipeline connected to operational delivery',
    pitch: "HubSpot and Salesforce close the loop at 'deal closed.' bahn CRM closes it all the way to delivery. When a deal wins, the full context — contacts, notes, requirements — flows into a Capsule implementation map. Delivery always knows the full story.",
    howTo: [
      'Create your pipeline stages to match your actual sales process',
      'Add contacts and organizations, link them to deals with role assignments (champion, decision maker)',
      'Log every call, email, and meeting on the activity timeline',
      "When a deal is won, push it to Capsule — delivery team gets full context from day one",
    ],
    vsLabel: 'vs HubSpot + Salesforce',
    vs: [
      { them: "HubSpot: revenue context dies at 'Closed Won'",    us: 'Deal links to Capsule delivery map at the moment of close' },
      { them: 'Salesforce: built for large ops teams, not teams', us: 'Simple to start, powerful when you need it' },
      { them: 'Separate CRM and project tool, no handoff',        us: 'CRM + Capsule share the same workspace and context' },
      { them: 'HubSpot Sales Hub starts at $90/mo/seat',         us: 'Included in your bahnOS plan' },
    ],
    to: '/crm-product',
  },
  {
    product: 'wiki', color: WIKI_C,
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    name: 'bahn Wiki', tagline: 'Docs attached to the work they describe',
    pitch: 'Notion and Confluence make great docs. But those docs are disconnected from the work they describe. bahn Wiki attaches spec docs to Capsule nodes and onboarding guides to CRM deals — so context is always one click away, not a search query away.',
    howTo: [
      'Create a Space for your team, product, or project',
      'Write pages using the rich text editor — type "/" for any block type (heading, table, code, callout)',
      'Organize with nested sub-pages and a sidebar page tree',
      'Attach any page to a Capsule node or CRM deal for instant context',
    ],
    vsLabel: 'vs Notion + Confluence',
    vs: [
      { them: 'Confluence: heavy, slow, and $5.75+/seat separately', us: 'Fast Tiptap editor, affordable, no separate license' },
      { them: "Notion: docs live in isolation from the actual work",  us: 'Pages link directly to Capsule nodes and CRM deals' },
      { them: 'Manual saves, no guaranteed version history',          us: 'Every save is a snapshot. Restore any version in one click.' },
      { them: 'Confluence + Jira billed separately, costs compound',  us: 'All included in your bahnOS plan' },
    ],
    to: '/wiki',
  },
]

// ─── Floating hero card ───────────────────────────────────────────────────────
function HeroCard({ icon, name, category, product, style }) {
  const prod = PRODUCT_META[product]
  return (
    <div style={{
      background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8,
      padding: '14px 16px', width: 200, boxShadow: '0 4px 16px rgba(9,30,66,0.10)',
      ...style,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: '1.25rem' }}>{icon}</span>
        <span style={{ fontSize: '0.625rem', fontWeight: 700, background: prod.bg, color: prod.color, borderRadius: 3, padding: '2px 6px', letterSpacing: '0.04em' }}>{prod.label}</span>
      </div>
      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: BLUE, marginBottom: 4 }}>{name}</div>
      <div style={{ fontSize: '0.6875rem', color: MUTED }}>{category}</div>
      <div style={{ marginTop: 10, height: 5, background: BG, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: '65%', height: '100%', background: prod.color + '40', borderRadius: 3 }} />
      </div>
    </div>
  )
}

// ─── Template card ────────────────────────────────────────────────────────────
function TemplateCard({ template, onUse }) {
  const [hov, setHov] = useState(false)
  const cat  = CAT_COLORS[template.category] || { bg: '#F4F5F7', color: SUBTLE }
  const prod = PRODUCT_META[template.product]
  return (
    <div
      onClick={() => onUse(template)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? '#F8F9FF' : SURFACE,
        border: `1px solid ${hov ? prod.color : BORDER}`,
        borderRadius: 8, padding: '20px 18px 16px',
        display: 'flex', flexDirection: 'column', gap: 8,
        transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
        boxShadow: hov ? '0 4px 16px rgba(9,30,66,0.09)' : 'none',
        position: 'relative', height: '100%', boxSizing: 'border-box',
        borderTop: `3px solid ${hov ? prod.color : BORDER}`,
        cursor: 'pointer',
      }}
    >
      {template.popular && (
        <span style={{ position: 'absolute', top: 12, right: 12, fontSize: 10, fontWeight: 700, background: '#FFF0B3', color: BLUE, borderRadius: 3, padding: '2px 6px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Popular
        </span>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '1.625rem' }}>{template.icon}</span>
      </div>
      <div>
        <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: BLUE, marginBottom: 5 }}>{template.name}</div>
        <div style={{ fontSize: '0.8125rem', color: SUBTLE, lineHeight: 1.6 }}>{template.description}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 'auto', paddingTop: 10 }}>
        <span style={{ fontSize: '0.625rem', fontWeight: 700, background: prod.bg, color: prod.color, borderRadius: 3, padding: '2px 7px', letterSpacing: '0.04em' }}>{prod.label}</span>
        <span style={{ fontSize: '0.625rem', fontWeight: 600, background: cat.bg, color: cat.color, borderRadius: 3, padding: '2px 7px' }}>{template.category}</span>
      </div>
    </div>
  )
}

// ─── Guide accordion card ─────────────────────────────────────────────────────
function GuideCard({ guide, isOpen, onToggle }) {
  return (
    <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 6, overflow: 'hidden' }}>
      <button onClick={onToggle} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px',
        background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
        borderBottom: isOpen ? `1px solid ${BORDER}` : 'none', transition: 'background 0.12s',
      }}
        onMouseEnter={e => { e.currentTarget.style.background = BG }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: BLUE, color: '#fff', padding: '3px 8px', borderRadius: 3, fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>
          {guide.icon}{guide.name}
        </div>
        <span style={{ fontSize: '0.8125rem', color: SUBTLE, flex: 1 }}>{guide.tagline}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {isOpen && (
        <div style={{ padding: '24px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          <div>
            <p style={{ fontSize: '0.875rem', color: SUBTLE, lineHeight: 1.7, margin: '0 0 20px' }}>{guide.pitch}</p>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>How to get started</div>
            <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
              {guide.howTo.map((step, i) => (
                <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: guide.color, color: '#fff', fontSize: '0.625rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                  <span style={{ fontSize: '0.8125rem', color: SUBTLE, lineHeight: 1.55 }}>{step}</span>
                </li>
              ))}
            </ol>
            <Link to={guide.to} style={{ display: 'inline-block', marginTop: 16, fontSize: '0.8125rem', fontWeight: 600, color: guide.color, textDecoration: 'none' }}>Full product page →</Link>
          </div>
          <div>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{guide.vsLabel}</div>
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 6, overflow: 'hidden' }}>
              {guide.vs.map((row, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: i < guide.vs.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                  <div style={{ padding: '9px 12px', fontSize: '0.75rem', color: '#BF2600', background: '#FFF4F2', borderRight: `1px solid ${BORDER}`, lineHeight: 1.4 }}>✗ {row.them}</div>
                  <div style={{ padding: '9px 12px', fontSize: '0.75rem', color: '#006644', background: '#F3FFF8', lineHeight: 1.4 }}>✓ {row.us}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Filter pills ─────────────────────────────────────────────────────────────
const PRODUCT_TABS = ['All', 'Capsule', 'CRM', 'Wiki']
const CAP_CATS  = ['All', 'Startup', 'Marketing', 'Engineering', 'Product', 'Team', 'Design', 'Strategy', 'Personal']
const CRM_CATS  = ['All', 'Sales', 'Revenue', 'Pipeline']
const WIKI_CATS = ['All', 'Engineering', 'Knowledge', 'Docs']
const ALL_CATS  = ['All', 'Startup', 'Marketing', 'Engineering', 'Product', 'Team', 'Design', 'Strategy', 'Personal', 'Sales', 'Revenue', 'Knowledge', 'Docs']

// ─── Main export ──────────────────────────────────────────────────────────────
export default function TemplatesPage() {
  const [productTab, setProductTab] = useState('All')
  const [category,   setCategory]   = useState('All')
  const [query,      setQuery]       = useState('')
  const [openGuide,  setOpenGuide]   = useState(null)
  const { isAuthenticated, isGuest } = useAuth()
  const { openLogin } = useAuthModal()
  const navigate = useNavigate()

  const categories =
    productTab === 'Capsule' ? CAP_CATS :
    productTab === 'CRM'     ? CRM_CATS :
    productTab === 'Wiki'    ? WIKI_CATS : ALL_CATS

  function handleProductTab(tab) { setProductTab(tab); setCategory('All') }

  function handleUseTemplate(template) {
    sessionStorage.setItem('bahn_pending_template', template.id)
    if (isAuthenticated || isGuest) navigate(template.appPath)
    else openLogin()
  }

  const productFiltered = ALL_TEMPLATES.filter(t =>
    productTab === 'All' ? true :
    productTab === 'Capsule' ? t.product === 'capsule' :
    productTab === 'CRM'     ? t.product === 'crm' :
    t.product === 'wiki'
  )

  const visible = productFiltered.filter(t => {
    const matchCat = category === 'All' || t.category === category
    const matchQ   = !query || t.name.toLowerCase().includes(query.toLowerCase()) || t.description.toLowerCase().includes(query.toLowerCase())
    return matchCat && matchQ
  })

  const popular = visible.filter(t => t.popular)
  const rest    = visible.filter(t => !t.popular)

  return (
    <div style={{ background: BG, color: BLUE, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", minHeight: '100vh', overflowX: 'hidden' }}>
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg, #EFF6FF 0%, #EBF4FF 55%, #FAFBFC 100%)',
        borderBottom: `3px solid ${ACCENT}`,
        padding: '52px 8vw 44px',
        position: 'relative', overflow: 'hidden',
        display: 'grid', gridTemplateColumns: '1fr 420px', gap: 48, alignItems: 'center',
      }}>
        {/* Ghost watermark */}
        <div style={{ position: 'absolute', right: -8, bottom: -20, fontSize: 180, fontWeight: 900, color: 'rgba(0,82,204,0.04)', letterSpacing: '-0.05em', lineHeight: 1, userSelect: 'none', pointerEvents: 'none' }}>
          TEMPLATES
        </div>

        {/* Left */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: BLUE, color: '#fff', padding: '3px 10px', borderRadius: 3, fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 18 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
            </svg>
            Template Gallery
          </div>

          <h1 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', fontWeight: 800, color: BLUE, letterSpacing: '-0.03em', lineHeight: 1.15, margin: '0 0 14px' }}>
            Start from a<br />proven structure.
          </h1>
          <p style={{ fontSize: '0.9375rem', color: SUBTLE, lineHeight: 1.75, margin: '0 0 20px', maxWidth: 480 }}>
            Choose from 100+ templates across Capsule, CRM, and Wiki. Pick one, open in the app, and customise from there.
          </p>

          {/* Product count callout */}
          <div style={{ display: 'inline-flex', gap: 20, background: 'rgba(0,82,204,0.05)', border: '1px solid rgba(0,82,204,0.14)', borderRadius: 4, padding: '8px 16px', marginBottom: 22 }}>
            {[
              { label: 'Capsule', count: CAPSULE_TEMPLATES.length, color: CAPSULE },
              { label: 'CRM',     count: CRM_TEMPLATES.length,     color: CRM_C },
              { label: 'Wiki',    count: WIKI_TEMPLATES.length,    color: WIKI_C },
            ].map((p, i) => (
              <span key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem' }}>
                {i > 0 && <span style={{ width: 1, height: 12, background: BORDER, display: 'inline-block' }} />}
                <span style={{ fontWeight: 700, color: p.color }}>{p.count}</span>
                <span style={{ color: SUBTLE }}>{p.label}</span>
              </span>
            ))}
          </div>

          {/* Search */}
          <div style={{ position: 'relative', maxWidth: 400 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search templates…"
              style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: 4, border: `1.5px solid ${BORDER}`, background: SURFACE, color: BLUE, fontSize: '0.9375rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
              onFocus={e => { e.currentTarget.style.borderColor = ACCENT }}
              onBlur={e => { e.currentTarget.style.borderColor = BORDER }}
            />
          </div>

          {/* Feature checklist */}
          <div style={{ display: 'flex', gap: 20, marginTop: 18, flexWrap: 'wrap' }}>
            {['Capsule maps', 'CRM pipelines', 'Wiki docs', 'Product guides'].map(f => (
              <span key={f} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8125rem', color: SUBTLE }}>
                <span style={{ color: ACCENT, fontWeight: 700, fontSize: '0.75rem' }}>✓</span>{f}
              </span>
            ))}
          </div>
        </div>

        {/* Right: floating template cards */}
        <div style={{ position: 'relative', height: 240, zIndex: 1 }}>
          <HeroCard icon="🗺️" name="Product Roadmap" category="Product" product="capsule"
            style={{ position: 'absolute', top: 0, left: 20, transform: 'rotate(-2deg)' }} />
          <HeroCard icon="🏎️" name="SaaS Sales Pipeline" category="Sales" product="crm"
            style={{ position: 'absolute', top: 40, left: 120, transform: 'rotate(1.5deg)', zIndex: 2 }} />
          <HeroCard icon="📘" name="Engineering Runbook" category="Engineering" product="wiki"
            style={{ position: 'absolute', top: 100, left: 60, transform: 'rotate(-1deg)', zIndex: 1 }} />
        </div>
      </section>

      {/* ── DARK STRIP ───────────────────────────────────────────────────────── */}
      <section style={{ background: BLUE, padding: '28px 8vw' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', gap: 40, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={CAPSULE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>, label: 'Capsule', sub: `${CAPSULE_TEMPLATES.length} maps & boards` },
            { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={CRM_C} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>, label: 'CRM', sub: `${CRM_TEMPLATES.length} pipelines & trackers` },
            { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={WIKI_C} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, label: 'Wiki', sub: `${WIKI_TEMPLATES.length} docs & guides` },
            { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A5B4FC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>, label: 'Instant setup', sub: 'Open in app, done in 60s' },
            { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>, label: 'Fully customisable', sub: 'Edit every node and field' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {item.icon}
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#FFFFFF' }}>{item.label}</div>
                <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.5)' }}>{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRODUCT GUIDES ───────────────────────────────────────────────────── */}
      <section style={{ background: SURFACE, borderBottom: `1px solid ${BORDER}`, padding: '40px 8vw' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Product guides</p>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: BLUE, margin: 0 }}>What each product does — and why it's better than the alternative</h2>
            </div>
            <span style={{ fontSize: '0.75rem', color: MUTED }}>Click to expand</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {GUIDES.map(guide => (
              <GuideCard key={guide.product} guide={guide}
                isOpen={openGuide === guide.product}
                onToggle={() => setOpenGuide(openGuide === guide.product ? null : guide.product)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── FILTER TABS (sticky) ──────────────────────────────────────────────── */}
      <div style={{ background: SURFACE, borderBottom: `1px solid ${BORDER}`, position: 'sticky', top: 56, zIndex: 5 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 8vw' }}>
          {/* Product row */}
          <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${BORDER}` }}>
            {PRODUCT_TABS.map(tab => {
              const acc = tab === 'Capsule' ? CAPSULE : tab === 'CRM' ? CRM_C : tab === 'Wiki' ? WIKI_C : ACCENT
              const active = productTab === tab
              return (
                <button key={tab} onClick={() => handleProductTab(tab)} style={{
                  padding: '13px 18px', fontSize: '0.875rem', fontWeight: active ? 700 : 500,
                  color: active ? acc : SUBTLE, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0,
                  borderBottom: active ? `2px solid ${acc}` : '2px solid transparent',
                  marginBottom: -1, transition: 'color 0.12s',
                }}>
                  {tab}
                </button>
              )
            })}
          </div>
          {/* Category row */}
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', padding: '6px 0' }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)} style={{
                padding: '5px 12px', fontSize: '0.8125rem', fontWeight: category === cat ? 600 : 400,
                color: category === cat ? ACCENT : SUBTLE,
                background: category === cat ? '#DEEBFF' : 'none',
                border: 'none', borderRadius: 3, cursor: 'pointer', flexShrink: 0,
                transition: 'color 0.12s, background 0.12s',
              }}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── TEMPLATE GRID ────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '44px 8vw 96px' }}>
        {visible.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: SUBTLE }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
            <p style={{ fontSize: '1rem' }}>No templates match "{query}"</p>
          </div>
        ) : (
          <>
            {popular.length > 0 && (
              <>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: ACCENT, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ display: 'inline-block', width: 24, height: 2, background: ACCENT, borderRadius: 2 }} /> Popular
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(272px, 1fr))', gap: 18, marginBottom: 48 }}>
                  {popular.map(t => <TemplateCard key={t.id} template={t} onUse={handleUseTemplate} />)}
                </div>
              </>
            )}
            {rest.length > 0 && (
              <>
                {popular.length > 0 && (
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: ACCENT, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ display: 'inline-block', width: 24, height: 2, background: ACCENT, borderRadius: 2 }} /> All templates
                  </p>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(272px, 1fr))', gap: 18 }}>
                  {rest.map(t => <TemplateCard key={t.id} template={t} onUse={handleUseTemplate} />)}
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
