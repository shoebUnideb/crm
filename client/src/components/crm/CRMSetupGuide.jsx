import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { crmApi } from '../../lib/crmApi.js'

const NAVY = '#172B4D', SUBTLE = '#5E6C84', BORDER = '#DFE1E6', WHITE = '#fff', BLUE = '#0052CC', EMERALD = '#10b981', PURPLE = '#6554C0', RED = '#DE350B', ORANGE = '#FF991F'

const SETUP_TASKS = [
  {
    id: 'basics',
    title: 'Cover the basics',
    subtitle: 'Start building your pipeline in under 5 minutes',
    icon: '🎯',
    color: BLUE,
    tasks: [
      { id: 'add-contact', title: 'Add a contact', time: '1-2 min', description: 'Enter details about a person or company so their deals, emails and activities can be linked.', action: 'contacts', actionLabel: 'Go to Contacts', tip: 'You can import contacts from CSV too!' },
      { id: 'schedule-activity', title: 'Schedule an activity', time: '1-2 min', description: 'Arrange the details of a call, meeting or task to advance a deal.', action: 'meetings', actionLabel: 'Schedule activity', tip: 'Activities appear on your calendar and in deal timelines.' },
      { id: 'add-deal', title: 'Add a deal', time: '2-4 min', description: 'Create an opportunity to move it through your sales process and close faster.', action: 'new-deal', actionLabel: 'Add deal', tip: 'Deals flow through your pipeline stages from left to right.' },
    ]
  },
  {
    id: 'sales-process',
    title: 'Set up your sales process',
    subtitle: 'Define how deals move through your pipeline',
    icon: '⚡',
    color: PURPLE,
    tasks: [
      { id: 'customize-stages', title: 'Customize pipeline stages', time: '2-3 min', description: 'Define your unique sales stages to match how your team actually sells.', action: 'stages', actionLabel: 'Open Stage Manager', tip: 'Most teams use 4-7 stages. Keep it simple!' },
      { id: 'create-pipeline', title: 'Create a pipeline', time: '1-2 min', description: 'Set up separate pipelines for different deal types (sales, partnerships, renewals).', action: 'settings-pipelines', actionLabel: 'Create pipeline', tip: 'Start with one pipeline and add more as needed.' },
      { id: 'use-template', title: 'Start from a pipeline template', time: '30 sec', description: 'Choose from 30 pre-built pipeline templates with stages and sample deals ready to go.', action: 'settings-pipeline-templates', actionLabel: 'Browse templates', tip: 'Templates cover Sales, Fundraising, Recruiting, Partnerships, and more.' },
      { id: 'set-goals', title: 'Set revenue goals', time: '2-3 min', description: 'Define targets to track your team\'s progress against quota.', action: 'settings-goals', actionLabel: 'Set goals', tip: 'Goals are tracked monthly. You can adjust anytime.' },
    ]
  },
  {
    id: 'automation',
    title: 'Automate your workflow',
    subtitle: 'Let the CRM do the repetitive work for you',
    icon: '🤖',
    color: EMERALD,
    tasks: [
      { id: 'create-automation', title: 'Create an automation rule', time: '2-3 min', description: 'Auto-create tasks, send emails, or move deals when conditions are met.', action: 'settings-automations', actionLabel: 'Create rule', tip: 'Popular: auto-create follow-up task when deal enters a stage.' },
      { id: 'setup-cadence', title: 'Set up a sales cadence', time: '3-5 min', description: 'Build multi-step outreach sequences that auto-schedule follow-ups.', action: 'settings-cadences', actionLabel: 'Create cadence', tip: 'Cadences ensure no lead falls through the cracks.' },
      { id: 'stage-gates', title: 'Configure stage gates', time: '2-3 min', description: 'Require fields to be filled before deals can advance to the next stage.', action: 'settings-validations', actionLabel: 'Add gate', tip: 'Stage gates improve data quality and forecast accuracy.' },
    ]
  },
  {
    id: 'leads',
    title: 'Capture & qualify leads',
    subtitle: 'Turn prospects into pipeline opportunities',
    icon: '🧲',
    color: ORANGE,
    tasks: [
      { id: 'scoring-rules', title: 'Set up lead scoring', time: '3-5 min', description: 'Automatically grade leads based on deal value, source, and engagement.', action: 'settings-scoring', actionLabel: 'Configure scoring', tip: 'Scored leads help reps prioritize the hottest opportunities.' },
      { id: 'web-form', title: 'Create a web form', time: '3-5 min', description: 'Build a lead capture form that creates deals automatically on submission.', action: 'settings-forms', actionLabel: 'Build form', tip: 'Embed the form on your website for 24/7 lead capture.' },
    ]
  },
  {
    id: 'configure',
    title: 'Configure advanced features',
    subtitle: 'Power-user features for growing teams',
    icon: '🔧',
    color: '#5243AA',
    tasks: [
      { id: 'custom-fields', title: 'Add custom fields', time: '2-3 min', description: 'Track additional data points specific to your business on deals and contacts.', action: 'settings-fields', actionLabel: 'Add fields', tip: 'Custom fields appear on deal cards and in reports.' },
      { id: 'smart-views', title: 'Create a smart view', time: '1-2 min', description: 'Save filtered views for quick access to deal subsets (e.g., "High Value", "Stale").', action: 'settings-views', actionLabel: 'Create view', tip: 'Views are personal — create as many as you need.' },
      { id: 'territories', title: 'Define territories', time: '2-4 min', description: 'Organize your market by region and auto-route new deals to the right rep.', action: 'settings-territories', actionLabel: 'Setup routing', tip: 'Territories auto-assign deals based on region or industry.' },
      { id: 'sla-policies', title: 'Set SLA policies', time: '2-3 min', description: 'Define maximum time allowed per stage so stale deals get flagged automatically.', action: 'settings-sla', actionLabel: 'Add policy', tip: 'SLA breaches alert you before deals go cold.' },
    ]
  },
  {
    id: 'track',
    title: 'Track your progress',
    subtitle: 'Insights to close more deals, faster',
    icon: '📊',
    color: '#00B8D9',
    tasks: [
      { id: 'view-dashboard', title: 'Explore the dashboard', time: '1 min', description: 'See your pipeline health, conversion rates, and revenue at a glance.', action: 'dashboard', actionLabel: 'View dashboard', tip: 'Dashboard updates in real-time as you move deals.' },
      { id: 'view-forecast', title: 'Check your forecast', time: '1 min', description: 'See weighted pipeline projections and expected revenue by close date.', action: 'forecast', actionLabel: 'View forecast', tip: 'Weighted forecast uses probability × deal value.' },
      { id: 'view-winloss', title: 'Review win/loss analysis', time: '1 min', description: 'Understand why deals are won or lost and spot patterns.', action: 'winloss', actionLabel: 'View analysis', tip: 'Win/loss patterns help you replicate success.' },
    ]
  },
]

const STORAGE_KEY = 'crm-setup-completed'

export default function CRMSetupGuide({ onNavigate }) {
  const [completed, setCompleted] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
  })
  const [expanded, setExpanded] = useState('basics')
  const [stats, setStats] = useState({ deals: 0, contacts: 0 })
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(() => !localStorage.getItem('crm-setup-welcomed'))
  const [tooltip, setTooltip] = useState(null)
  const [confetti, setConfetti] = useState(false)
  const [quickStartOpen, setQuickStartOpen] = useState(false)
  const [videoPreview, setVideoPreview] = useState(null)
  const prevCompleted = useRef(completed.length)

  useEffect(() => {
    crmApi.getDeals().then(deals => {
      const count = Array.isArray(deals) ? deals.length : 0
      setStats(prev => ({ ...prev, deals: count }))
      if (count > 0) {
        setCompleted(prev => {
          const merged = [...new Set([...prev, 'add-deal'])]
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
          return merged
        })
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (completed.length > prevCompleted.current) {
      setConfetti(true)
      setTimeout(() => setConfetti(false), 1500)
    }
    prevCompleted.current = completed.length
  }, [completed.length])

  function toggle(taskId) {
    setCompleted(prev => {
      const next = prev.includes(taskId) ? prev.filter(t => t !== taskId) : [...prev, taskId]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  function handleAction(action) {
    if (onNavigate) onNavigate(action)
  }

  function dismissWelcome() {
    localStorage.setItem('crm-setup-welcomed', '1')
    setShowWelcomeDialog(false)
  }

  const totalTasks = SETUP_TASKS.reduce((sum, g) => sum + g.tasks.length, 0)
  const completedCount = completed.length
  const progressPct = Math.round((completedCount / totalTasks) * 100)
  const currentLevel = progressPct >= 100 ? 'CRM Master' : progressPct >= 75 ? 'Power User' : progressPct >= 50 ? 'Getting Started' : progressPct >= 25 ? 'Beginner' : 'New User'

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#F4F5F7', position: 'relative' }}>
      {confetti && <ConfettiOverlay />}

      {/* Welcome Dialog */}
      {showWelcomeDialog && (
        <DialogOverlay onClose={dismissWelcome}>
          <div style={{ background: WHITE, borderRadius: 16, padding: 0, maxWidth: 480, width: '90%', overflow: 'hidden', boxShadow: '0 20px 60px rgba(9,30,66,0.3)' }}>
            <div style={{ background: 'linear-gradient(135deg, #0052CC 0%, #6554C0 100%)', padding: '32px 32px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ position: 'absolute', bottom: -30, left: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
              <RocketIllustration />
              <h2 style={{ margin: '16px 0 8px', fontSize: 22, fontWeight: 800, color: WHITE }}>Welcome to Your CRM!</h2>
              <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
                Your deal-closing command center is ready. Let's get you set up in just a few steps.
              </p>
            </div>
            <div style={{ padding: '24px 32px 28px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
                <FeatureCard icon={<PipelineIcon />} label="Pipeline" desc="Visual deal tracking" />
                <FeatureCard icon={<AutomateIcon />} label="Automation" desc="Work on autopilot" />
                <FeatureCard icon={<InsightsIcon />} label="Insights" desc="Data-driven decisions" />
              </div>
              <button onClick={dismissWelcome} style={{ width: '100%', padding: '12px', background: BLUE, color: WHITE, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#0747A6'}
                onMouseLeave={e => e.currentTarget.style.background = BLUE}>
                Let's Get Started →
              </button>
            </div>
          </div>
        </DialogOverlay>
      )}

      {/* Video Preview Dialog */}
      {videoPreview && (
        <DialogOverlay onClose={() => setVideoPreview(null)}>
          <div style={{ background: WHITE, borderRadius: 12, padding: 24, maxWidth: 500, width: '90%', boxShadow: '0 20px 60px rgba(9,30,66,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: NAVY }}>{videoPreview.title}</h3>
              <button onClick={() => setVideoPreview(null)} style={{ background: 'none', border: 'none', fontSize: 18, color: SUBTLE, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ background: '#F4F5F7', borderRadius: 8, padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: `1px solid ${BORDER}` }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill={WHITE}><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </div>
              <p style={{ fontSize: 13, color: SUBTLE, textAlign: 'center', margin: 0 }}>Quick walkthrough for: <strong>{videoPreview.title}</strong></p>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={() => { setVideoPreview(null); handleAction(videoPreview.action) }}
                style={{ flex: 1, padding: '10px', background: BLUE, color: WHITE, border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {videoPreview.actionLabel}
              </button>
              <button onClick={() => setVideoPreview(null)}
                style={{ padding: '10px 16px', background: '#F4F5F7', color: SUBTLE, border: `1px solid ${BORDER}`, borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
                Maybe Later
              </button>
            </div>
          </div>
        </DialogOverlay>
      )}

      {/* ── Hero Section ── */}
      <div style={{
        background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 60%, #FAFBFC 100%)',
        borderBottom: `3px solid ${BLUE}`,
        padding: '28px 40px 24px',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        <div style={{ position: 'absolute', top: -50, right: 220, width: 200, height: 200, borderRadius: '50%', background: 'rgba(0,82,204,0.05)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: '35%', width: 260, height: 260, borderRadius: '50%', background: 'rgba(101,84,192,0.04)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, position: 'relative', zIndex: 1 }}>
          {/* Left column */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Badge row + quick actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: BLUE, color: WHITE, padding: '3px 10px',
                  borderRadius: 3, fontSize: '0.625rem', fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                }}>
                  🎯 CRM SETUP
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: `${BLUE}12`, borderRadius: 20, padding: '3px 10px',
                  border: `1px solid ${BLUE}30`,
                }}>
                  <span style={{ fontSize: '0.625rem', color: BLUE, fontWeight: 600 }}>Level: {currentLevel}</span>
                  <span style={{ fontSize: '0.5625rem', color: SUBTLE }}>·</span>
                  <span style={{ fontSize: '0.625rem', color: SUBTLE }}>{completedCount}/{totalTasks} tasks</span>
                </div>
              </div>

              {/* Quick Actions dropdown */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setQuickStartOpen(!quickStartOpen)}
                  style={{ padding: '6px 12px', background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 3, color: NAVY, fontSize: '0.6875rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.12s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = BLUE; e.currentTarget.style.color = BLUE }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = NAVY }}>
                  ⚡ Quick Actions
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points={quickStartOpen ? '18 15 12 9 6 15' : '6 9 12 15 18 9'}/></svg>
                </button>
                {quickStartOpen && (
                  <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, background: WHITE, borderRadius: 8, boxShadow: '0 8px 24px rgba(9,30,66,0.15)', border: `1px solid ${BORDER}`, padding: 6, minWidth: 200, zIndex: 999 }}>
                    {[
                      { label: 'Add a new deal', icon: '💼', action: 'new-deal' },
                      { label: 'Import from CSV', icon: '📄', action: 'pipeline' },
                      { label: 'View dashboard', icon: '📊', action: 'dashboard' },
                      { label: 'Invite team member', icon: '👥', action: 'settings' },
                    ].map(item => (
                      <button key={item.label} onClick={() => { setQuickStartOpen(false); handleAction(item.action) }}
                        style={{ width: '100%', padding: '8px 12px', background: 'none', border: 'none', borderRadius: 6, fontSize: '0.75rem', color: NAVY, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F4F5F7'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                        <span style={{ fontSize: '0.9375rem' }}>{item.icon}</span>
                        <span style={{ fontWeight: 500 }}>{item.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Headline */}
            <h1 style={{ margin: '0 0 6px', fontSize: 'clamp(1.375rem, 2vw, 1.75rem)', fontWeight: 800, color: NAVY, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {completedCount === 0 ? 'Build your sales machine.' : completedCount >= totalTasks ? 'You\'re a CRM Pro! 🎉' : 'Great progress! Keep going.'}
            </h1>
            <p style={{ margin: '0 0 18px', fontSize: '0.875rem', color: SUBTLE, lineHeight: 1.5, maxWidth: 460 }}>
              {completedCount === 0
                ? 'Complete the setup checklist to unlock the full power of your CRM. Each step takes just a few minutes.'
                : completedCount >= totalTasks
                  ? 'All setup tasks complete. Your CRM is fully configured and ready for action.'
                  : `You've completed ${completedCount} of ${totalTasks} tasks. A few more to unlock everything.`}
            </p>

            {/* Slim progress bar */}
            <div style={{ marginBottom: 22, maxWidth: 420 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: '0.625rem', fontWeight: 700, color: SUBTLE, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Setup Progress</span>
                <span style={{ fontSize: '0.625rem', fontWeight: 700, color: progressPct === 100 ? EMERALD : BLUE }}>{progressPct}%</span>
              </div>
              <div style={{ height: 6, background: '#BFDBFE', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progressPct}%`, background: progressPct === 100 ? EMERALD : `linear-gradient(90deg, ${BLUE}, #36B37E)`, borderRadius: 3, transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                {[25, 50, 75, 100].map(m => (
                  <span key={m} style={{ fontSize: '0.5625rem', color: progressPct >= m ? BLUE : '#93C5FD', fontWeight: progressPct >= m ? 700 : 400 }}>
                    {m === 25 ? 'Beginner' : m === 50 ? 'Active' : m === 75 ? 'Power' : 'Master'}
                  </span>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => handleAction('new-deal')}
                style={{ padding: '9px 20px', background: BLUE, color: WHITE, border: 'none', borderRadius: 3, fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#0747A6'}
                onMouseLeave={e => e.currentTarget.style.background = BLUE}>
                + Add a deal
              </button>
              <button onClick={() => handleAction('pipeline')}
                style={{ padding: '9px 18px', background: WHITE, color: NAVY, border: `1px solid ${BORDER}`, borderRadius: 3, fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = NAVY; e.currentTarget.style.background = '#F4F5F7' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = WHITE }}>
                View pipeline →
              </button>
            </div>
          </div>

          {/* Right — decorative cards */}
          <DecorativeDealCards />
        </div>
      </div>

      {/* ── Feature Strip ── */}
      <div style={{ background: NAVY, padding: '11px 40px', display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0, flexWrap: 'wrap' }}>
        {[
          { icon: '🎯', label: 'Pipeline management' },
          { icon: '👥', label: 'Contacts & Orgs' },
          { icon: '📊', label: 'Revenue forecasting' },
          { icon: '⚡', label: 'Workflow automation' },
          { icon: '🔗', label: 'Linked to Canvas & Docs' },
        ].map((f, i) => (
          <React.Fragment key={f.label}>
            {i > 0 && <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 12px', fontSize: '0.875rem' }}>·</span>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: '0.8125rem' }}>{f.icon}</span>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{f.label}</span>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* ── Beta notice ── */}
      <div style={{
        background: '#DEEBFF', borderBottom: '1px solid #B3D4FF',
        padding: '9px 40px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
      }}>
        <span style={{ fontSize: '0.75rem', background: '#0052CC', color: '#fff', fontWeight: 700, padding: '1px 7px', borderRadius: 3, letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>Beta</span>
        <span style={{ fontSize: '0.8125rem', color: '#0747A6' }}>
          CRM is currently in beta — more features are on the way. Your feedback helps us build what matters most.
        </span>
      </div>

      {/* ── Task Groups ── */}
      <div style={{ padding: '16px 32px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: '0.6875rem', fontWeight: 700, color: SUBTLE, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Your Setup Checklist
          </h3>
          <button onClick={() => { if (window.confirm('Reset all progress? This cannot be undone.')) { setCompleted([]); localStorage.removeItem(STORAGE_KEY) } }}
            style={{ padding: '4px 10px', background: 'none', border: `1px solid ${BORDER}`, borderRadius: 4, fontSize: '0.625rem', color: SUBTLE, cursor: 'pointer', transition: 'border-color 0.12s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = RED}
            onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}>
            Reset Progress
          </button>
        </div>

        {SETUP_TASKS.map(group => {
          const groupCompleted = group.tasks.filter(t => completed.includes(t.id)).length
          const isExpanded = expanded === group.id
          const allDone = groupCompleted === group.tasks.length
          return (
            <div key={group.id} style={{
              background: WHITE,
              borderRadius: 8,
              border: `1px solid ${isExpanded ? group.color + '50' : BORDER}`,
              borderLeft: `3px solid ${allDone ? EMERALD : group.color}`,
              marginBottom: 8,
              overflow: 'hidden',
              boxShadow: isExpanded ? `0 2px 8px ${group.color}12` : '0 1px 2px rgba(9,30,66,0.04)',
              transition: 'box-shadow 0.2s, border-color 0.2s',
            }}>
              {/* Group header */}
              <button onClick={() => setExpanded(isExpanded ? null : group.id)}
                style={{ width: '100%', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, border: 'none', background: allDone ? `${EMERALD}06` : 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}
                onMouseEnter={e => { if (!allDone) e.currentTarget.style.background = '#FAFBFC' }}
                onMouseLeave={e => { if (!allDone) e.currentTarget.style.background = allDone ? `${EMERALD}06` : 'none' }}>

                {/* Icon badge */}
                <div style={{
                  width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                  background: allDone ? `${EMERALD}15` : `${group.color}12`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem',
                }}>
                  {allDone ? '✓' : group.icon}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: NAVY }}>{group.title}</span>
                    {allDone && (
                      <span style={{ fontSize: '0.5625rem', fontWeight: 700, color: EMERALD, background: `${EMERALD}15`, padding: '2px 7px', borderRadius: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Complete
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: SUBTLE, marginTop: 1, display: 'block' }}>{group.subtitle}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: allDone ? EMERALD : SUBTLE }}>{groupCompleted}/{group.tasks.length}</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={SUBTLE} strokeWidth="2.5" strokeLinecap="round"
                    style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s ease' }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
              </button>

              {/* Expanded task rows */}
              {isExpanded && (
                <div style={{ borderTop: `1px solid ${BORDER}` }}>
                  {group.tasks.map(task => {
                    const isDone = completed.includes(task.id)
                    return (
                      <div key={task.id}
                        style={{ padding: '13px 18px', display: 'flex', alignItems: 'flex-start', gap: 12, transition: 'background 0.15s', position: 'relative' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#FAFBFC'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}>

                        {/* Checkbox */}
                        <button onClick={() => toggle(task.id)}
                          style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${isDone ? EMERALD : '#C1C7D0'}`, background: isDone ? EMERALD : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0, marginTop: 2, transition: 'all 0.2s ease' }}
                          onMouseEnter={e => { if (!isDone) { e.currentTarget.style.borderColor = EMERALD; e.currentTarget.style.transform = 'scale(1.1)' } }}
                          onMouseLeave={e => { if (!isDone) { e.currentTarget.style.borderColor = '#C1C7D0'; e.currentTarget.style.transform = 'scale(1)' } }}>
                          {isDone && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                        </button>

                        <div style={{ flex: 1, opacity: isDone ? 0.55 : 1, transition: 'opacity 0.3s' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: NAVY, textDecoration: isDone ? 'line-through' : 'none' }}>{task.title}</span>
                            <span style={{ fontSize: '0.625rem', color: SUBTLE, background: '#F4F5F7', borderRadius: 4, padding: '2px 6px', fontWeight: 500, flexShrink: 0 }}>⏱ {task.time}</span>
                            {/* Tip tooltip */}
                            <div style={{ position: 'relative', display: 'inline-flex' }}
                              onMouseEnter={() => setTooltip(task.id)}
                              onMouseLeave={() => setTooltip(null)}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#B3BAC5" strokeWidth="2" strokeLinecap="round" style={{ cursor: 'help' }}>
                                <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                              </svg>
                              {tooltip === task.id && (
                                <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 6, background: NAVY, color: WHITE, padding: '7px 11px', borderRadius: 6, fontSize: '0.6875rem', whiteSpace: 'nowrap', zIndex: 100, boxShadow: '0 4px 12px rgba(9,30,66,0.3)', maxWidth: 240 }}>
                                  <div style={{ whiteSpace: 'normal', lineHeight: 1.4 }}>{task.tip}</div>
                                  <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: `5px solid ${NAVY}` }} />
                                </div>
                              )}
                            </div>
                          </div>
                          <p style={{ margin: '0 0 10px', fontSize: '0.75rem', color: SUBTLE, lineHeight: 1.5 }}>{task.description}</p>

                          {!isDone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <button onClick={() => handleAction(task.action)}
                                style={{ padding: '6px 14px', background: group.color, color: WHITE, border: 'none', borderRadius: 3, fontSize: '0.6875rem', fontWeight: 700, cursor: 'pointer', transition: 'filter 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.filter = 'brightness(0.88)'}
                                onMouseLeave={e => e.currentTarget.style.filter = 'none'}>
                                {task.actionLabel}
                              </button>
                              <button onClick={() => setVideoPreview(task)}
                                style={{ padding: '6px 11px', background: 'none', color: SUBTLE, border: `1px solid ${BORDER}`, borderRadius: 3, fontSize: '0.6875rem', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.12s' }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#F4F5F7'; e.currentTarget.style.borderColor = '#C1C7D0' }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = BORDER }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                How it works
                              </button>
                            </div>
                          )}
                        </div>

                        {isDone && (
                          <span style={{ fontSize: '0.625rem', color: EMERALD, fontWeight: 600, background: `${EMERALD}12`, padding: '3px 7px', borderRadius: 3, alignSelf: 'center', flexShrink: 0 }}>Done</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {/* Bottom CTA */}
        <div style={{ marginTop: 20, background: WHITE, borderRadius: 8, border: `1px solid ${BORDER}`, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: '#DEEBFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div>
              <h4 style={{ margin: '0 0 3px', fontSize: '0.875rem', fontWeight: 700, color: NAVY }}>Need help getting started?</h4>
              <p style={{ margin: 0, fontSize: '0.75rem', color: SUBTLE, lineHeight: 1.5 }}>
                Check out the settings panel for advanced configuration, or jump to the dashboard to see your pipeline at a glance.
              </p>
            </div>
          </div>
          <button onClick={() => handleAction('settings')}
            style={{ padding: '8px 18px', background: BLUE, color: WHITE, border: 'none', borderRadius: 3, fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#0747A6'}
            onMouseLeave={e => e.currentTarget.style.background = BLUE}>
            Open Settings
          </button>
        </div>
      </div>

      <CRMFooter />
    </div>
  )
}

// ─── Decorative hero cards ────────────────────────────────────────────────────

function DecorativeDealCards() {
  return (
    <div style={{ position: 'relative', width: 260, height: 180, flexShrink: 0 }}>
      {/* Back card — deal card */}
      <div style={{
        position: 'absolute', top: 0, right: 24,
        width: 198, padding: '11px 13px',
        background: WHITE, borderRadius: 8,
        border: `1px solid ${BORDER}`,
        boxShadow: '0 2px 8px rgba(9,30,66,0.07)',
        transform: 'rotate(3deg)',
        opacity: 0.75,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#36B37E', flexShrink: 0 }} />
          <span style={{ fontSize: '0.625rem', fontWeight: 600, color: NAVY }}>TechCorp — $24,000</span>
        </div>
        <div style={{ height: 5, background: '#EBECF0', borderRadius: 2, marginBottom: 4 }}>
          <div style={{ width: '70%', height: '100%', background: '#36B37E', borderRadius: 2 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.5625rem', color: SUBTLE }}>Proposal Sent</span>
          <span style={{ fontSize: '0.5625rem', color: SUBTLE }}>70%</span>
        </div>
      </div>

      {/* Middle card — pipeline stages */}
      <div style={{
        position: 'absolute', top: 22, right: 0,
        width: 210, padding: '12px 14px',
        background: WHITE, borderRadius: 8,
        border: `1px solid ${BORDER}`,
        boxShadow: '0 4px 16px rgba(9,30,66,0.1)',
        transform: 'rotate(-1deg)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: '0.625rem', fontWeight: 700, color: NAVY }}>Deals in Pipeline</span>
          <span style={{ fontSize: '0.5rem', color: BLUE, fontWeight: 600, background: '#DEEBFF', padding: '1px 5px', borderRadius: 3 }}>Live</span>
        </div>
        {['Qualify', 'Propose', 'Negotiate', 'Close'].map((stage, i) => (
          <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <span style={{ fontSize: '0.5625rem', color: SUBTLE, width: 52, flexShrink: 0 }}>{stage}</span>
            <div style={{ flex: 1, height: 4, background: '#EBECF0', borderRadius: 2 }}>
              <div style={{ width: `${[80, 55, 35, 20][i]}%`, height: '100%', background: [BLUE, PURPLE, ORANGE, EMERALD][i], borderRadius: 2 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Front card — contact */}
      <div style={{
        position: 'absolute', top: 112, right: 14,
        width: 186, padding: '9px 12px',
        background: WHITE, borderRadius: 8,
        border: `1px solid ${BORDER}`,
        boxShadow: '0 2px 8px rgba(9,30,66,0.07)',
        transform: 'rotate(1.5deg)',
        opacity: 0.88,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#DEEBFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.75rem' }}>👤</div>
          <div>
            <div style={{ fontSize: '0.625rem', fontWeight: 600, color: NAVY }}>Sarah Chen</div>
            <div style={{ fontSize: '0.5rem', color: SUBTLE }}>TechCorp · VP Engineering</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function DialogOverlay({ children, onClose }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(9,30,66,0.54)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, animation: 'fadeIn 0.2s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ animation: 'slideUp 0.3s ease' }}>
        {children}
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </div>
  )
}

function ConfettiOverlay() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    color: ['#36B37E', '#0052CC', '#6554C0', '#FF991F', '#00B8D9', '#FF5630'][i % 6],
    size: 4 + Math.random() * 6,
  }))
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
      <style>{`@keyframes confettiFall { 0% { transform: translateY(-20px) rotate(0deg); opacity: 1 } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0 } }`}</style>
      {particles.map((p, i) => (
        <div key={i} style={{ position: 'absolute', top: 0, left: `${p.left}%`, width: p.size, height: p.size, background: p.color, borderRadius: p.size > 7 ? '50%' : '1px', animation: `confettiFall 1.5s ${p.delay}s ease-out forwards` }} />
      ))}
    </div>
  )
}

function StatCard({ icon, label, value, color, target }) {
  const pct = target ? Math.min(100, (typeof value === 'number' ? value : 0) / target * 100) : null
  return (
    <div style={{ padding: '14px 16px', background: WHITE, borderRadius: 8, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${color}`, transition: 'box-shadow 0.2s, transform 0.2s', cursor: 'default' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(9,30,66,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: 6, background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
        <span style={{ fontSize: '0.5625rem', fontWeight: 700, color: SUBTLE, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <div style={{ fontSize: '1.125rem', fontWeight: 800, color }}>{value}</div>
      {pct !== null && (
        <div style={{ marginTop: 6, height: 3, background: '#F4F5F7', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.6s ease' }} />
        </div>
      )}
    </div>
  )
}

function FeatureCard({ icon, label, desc }) {
  return (
    <div style={{ background: '#F4F5F7', borderRadius: 10, padding: '16px 12px', textAlign: 'center' }}>
      <div style={{ marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 10, color: SUBTLE }}>{desc}</div>
    </div>
  )
}

// ─── SVG Illustrations ───────────────────────────────────────────────────────

function RocketIllustration() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ margin: '0 auto', display: 'block' }}>
      <circle cx="32" cy="32" r="28" fill="rgba(255,255,255,0.1)"/>
      <path d="M32 14c-4 8-6 14-6 20 0 4 2 7 6 10 4-3 6-6 6-10 0-6-2-12-6-20z" fill="#fff" opacity="0.9"/>
      <circle cx="32" cy="30" r="3" fill="#6554C0"/>
      <path d="M26 34l-4 6 6-2" fill="#FF991F" opacity="0.8"/>
      <path d="M38 34l4 6-6-2" fill="#FF991F" opacity="0.8"/>
      <path d="M29 44l3 6 3-6" fill="#FF5630" opacity="0.7"/>
      <circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.3)"/>
      <circle cx="46" cy="24" r="1.5" fill="rgba(255,255,255,0.2)"/>
      <circle cx="44" cy="44" r="1" fill="rgba(255,255,255,0.25)"/>
    </svg>
  )
}

function PipelineIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0052CC" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="6" height="18" rx="1"/><rect x="12" y="8" width="6" height="13" rx="1"/></svg>
}
function AutomateIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>
}
function InsightsIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6554C0" strokeWidth="2" strokeLinecap="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
}
function DealIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0052CC" strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
}
function TaskIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
}
function LevelIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6554C0" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
}
function TimeIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FF991F" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
}

// ─── Footer ───────────────────────────────────────────────────────────────────

const FOOTER_COLS = [
  {
    heading: 'Product',
    links: [
      { label: 'Home', to: '/' },
      { label: 'Features', to: '/features' },
      { label: 'Open Canvas', to: '/app/canvas' },
      { label: 'Open Wiki', to: '/app/docs' },
    ],
  },
  {
    heading: 'CRM',
    links: [
      { label: 'Pipeline', to: '/app/crm/pipeline' },
      { label: 'Contacts', to: '/app/crm/contacts' },
      { label: 'Dashboard', to: '/app/crm/dashboard' },
      { label: 'Settings', to: '/app/crm/settings' },
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

function CRMFooter() {
  return (
    <footer style={{ background: '#FAFBFC', borderTop: `1px solid ${BORDER}`, color: NAVY, flexShrink: 0 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 40px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr repeat(4, 1fr)', gap: '32px 24px' }}>

          {/* Brand */}
          <div>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 12 }}>
              <svg width="24" height="24" viewBox="0 0 30 30" fill="none">
                <circle cx="10" cy="15" r="9" fill="#0052CC" opacity="0.9"/>
                <circle cx="20" cy="15" r="9" fill="#4C9AFF" opacity="0.85"/>
              </svg>
              <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: NAVY, letterSpacing: '-0.01em' }}>bahnOS</span>
            </Link>
            <p style={{ fontSize: '0.8125rem', color: SUBTLE, lineHeight: 1.65, maxWidth: 220, margin: 0 }}>
              Pipeline management, deal tracking, and revenue forecasting — all in one workspace.
            </p>
          </div>

          {/* Link columns */}
          {FOOTER_COLS.map(col => (
            <div key={col.heading}>
              <h4 style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: SUBTLE, margin: '0 0 12px' }}>
                {col.heading}
              </h4>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {col.links.map(link => (
                  <Link
                    key={link.label}
                    to={link.to}
                    style={{ color: SUBTLE, textDecoration: 'none', fontSize: '0.8125rem', transition: 'color 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.color = BLUE}
                    onMouseLeave={e => e.currentTarget.style.color = SUBTLE}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{ marginTop: 32, paddingTop: 14, paddingBottom: 16, borderTop: `1px solid ${BORDER}` }} />
      </div>
    </footer>
  )
}
