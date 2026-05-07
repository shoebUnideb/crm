import React, { useState, useMemo } from 'react'

// ─── node factory ────────────────────────────────────────────────────────────
function node(id, title, parentId, depth, meta = {}) {
  return {
    id, title, parentId, childIds: [], depth,
    color: meta.color || null, collapsed: false,
    x: 0, y: 0, shape: 'rect',
    status: meta.status || null,
    priority: meta.priority || null,
    storyPoints: meta.storyPoints != null ? meta.storyPoints : null,
    issueType: meta.issueType || null,
    assignee: null, tags: [], dueDate: null, sprint: null,
    jiraKey: null, notes: null, url: null, comments: [],
  }
}

// ─── categories ──────────────────────────────────────────────────────────────
const CATS = {
  engineering: { label: 'Engineering', color: '#0052CC', bg: '#DEEBFF' },
  product:     { label: 'Product',     color: '#6554C0', bg: '#EAE6FF' },
  team:        { label: 'Team',        color: '#00875A', bg: '#E3FCEF' },
  design:      { label: 'Design',      color: '#FF8B00', bg: '#FFFAE6' },
  strategy:    { label: 'Strategy',    color: '#DE350B', bg: '#FFEBE6' },
  startup:     { label: 'Startup',     color: '#BF2600', bg: '#FFEBE6' },
  personal:    { label: 'Personal',    color: '#5243AA', bg: '#EAE6FF' },
  marketing:   { label: 'Marketing',   color: '#006644', bg: '#E3FCEF' },
}

// ─── template list ────────────────────────────────────────────────────────────
export const TEMPLATES = [
  // ── ENGINEERING ─────────────────────────────────────────────────────────────
  {
    id: 'sprint', category: 'engineering', popular: true,
    name: 'Sprint Planning',
    description: 'Ready-made sprint board with user stories and tasks',
    icon: '🏃',
    build: () => {
      const root = node('root', 'Sprint 1', null, 0)
      const s1 = node('s1', 'User Authentication', 'root', 1, { issueType: 'story', storyPoints: 8, status: 'todo' })
      const s2 = node('s2', 'Dashboard UI', 'root', 1, { issueType: 'story', storyPoints: 5, status: 'in-progress' })
      const s3 = node('s3', 'API Integration', 'root', 1, { issueType: 'story', storyPoints: 13, status: 'todo' })
      const t1 = node('t1', 'Login form', 's1', 2, { issueType: 'task', storyPoints: 3, status: 'done' })
      const t2 = node('t2', 'JWT token setup', 's1', 2, { issueType: 'task', storyPoints: 3, status: 'in-progress' })
      const t3 = node('t3', 'Password reset', 's1', 2, { issueType: 'task', storyPoints: 2, status: 'todo' })
      const t4 = node('t4', 'Charts component', 's2', 2, { issueType: 'task', storyPoints: 3, status: 'in-progress' })
      const t5 = node('t5', 'Sidebar layout', 's2', 2, { issueType: 'task', storyPoints: 2, status: 'done' })
      const t6 = node('t6', 'REST endpoints', 's3', 2, { issueType: 'task', storyPoints: 5, status: 'todo' })
      const t7 = node('t7', 'Error handling', 's3', 2, { issueType: 'bug', storyPoints: 3, status: 'blocked' })
      root.childIds = ['s1', 's2', 's3']
      s1.childIds = ['t1', 't2', 't3']
      s2.childIds = ['t4', 't5']
      s3.childIds = ['t6', 't7']
      return { nodes: { root, s1, s2, s3, t1, t2, t3, t4, t5, t6, t7 }, rootId: 'root' }
    },
  },
  {
    id: 'feature', category: 'engineering', popular: true,
    name: 'Feature Breakdown',
    description: 'Single feature broken into epics, stories, and tasks',
    icon: '✨',
    build: () => {
      const root = node('root', 'New Feature', null, 0)
      const ux = node('ux', 'UX & Design', 'root', 1, { issueType: 'epic', color: 'blue' })
      const be = node('be', 'Backend', 'root', 1, { issueType: 'epic', color: 'green' })
      const fe = node('fe', 'Frontend', 'root', 1, { issueType: 'epic', color: 'purple' })
      const qa = node('qa', 'QA & Testing', 'root', 1, { issueType: 'epic', color: 'yellow' })
      const u1 = node('u1', 'User research', 'ux', 2, { issueType: 'task', status: 'done', storyPoints: 3 })
      const u2 = node('u2', 'Wireframes', 'ux', 2, { issueType: 'task', status: 'done', storyPoints: 5 })
      const u3 = node('u3', 'Prototype review', 'ux', 2, { issueType: 'task', status: 'in-progress', storyPoints: 2 })
      const b1 = node('b1', 'Database schema', 'be', 2, { issueType: 'task', status: 'done', storyPoints: 3 })
      const b2 = node('b2', 'API endpoints', 'be', 2, { issueType: 'story', status: 'in-progress', storyPoints: 8 })
      const f1 = node('f1', 'Component library', 'fe', 2, { issueType: 'story', status: 'todo', storyPoints: 5 })
      const f2 = node('f2', 'Integration', 'fe', 2, { issueType: 'story', status: 'todo', storyPoints: 8 })
      const q1 = node('q1', 'Unit tests', 'qa', 2, { issueType: 'task', status: 'todo', storyPoints: 5 })
      const q2 = node('q2', 'E2E tests', 'qa', 2, { issueType: 'task', status: 'todo', storyPoints: 3 })
      root.childIds = ['ux', 'be', 'fe', 'qa']
      ux.childIds = ['u1', 'u2', 'u3']
      be.childIds = ['b1', 'b2']
      fe.childIds = ['f1', 'f2']
      qa.childIds = ['q1', 'q2']
      return { nodes: { root, ux, be, fe, qa, u1, u2, u3, b1, b2, f1, f2, q1, q2 }, rootId: 'root' }
    },
  },
  {
    id: 'bug-triage', category: 'engineering',
    name: 'Bug Triage Board',
    description: 'Prioritized bug tracking with severity levels',
    icon: '🐛',
    build: () => {
      const root = node('root', 'Bug Triage', null, 0)
      const crit = node('crit', 'Critical', 'root', 1, { issueType: 'epic', priority: 'critical', color: 'red' })
      const high = node('high', 'High Priority', 'root', 1, { issueType: 'epic', priority: 'high', color: 'yellow' })
      const low  = node('low',  'Low Priority',  'root', 1, { issueType: 'epic', priority: 'low',  color: 'green' })
      const b1 = node('b1', 'Login crash on iOS',   'crit', 2, { issueType: 'bug', priority: 'critical', status: 'in-progress', storyPoints: 3 })
      const b2 = node('b2', 'Data loss on save',    'crit', 2, { issueType: 'bug', priority: 'critical', status: 'blocked',     storyPoints: 5 })
      const b3 = node('b3', 'Slow dashboard load',  'high', 2, { issueType: 'bug', priority: 'high',     status: 'todo',        storyPoints: 2 })
      const b4 = node('b4', 'Wrong date format',    'high', 2, { issueType: 'bug', priority: 'high',     status: 'todo',        storyPoints: 1 })
      const b5 = node('b5', 'Tooltip misaligned',   'low',  2, { issueType: 'bug', priority: 'low',      status: 'todo',        storyPoints: 1 })
      root.childIds = ['crit', 'high', 'low']
      crit.childIds = ['b1', 'b2']
      high.childIds = ['b3', 'b4']
      low.childIds  = ['b5']
      return { nodes: { root, crit, high, low, b1, b2, b3, b4, b5 }, rootId: 'root' }
    },
  },
  {
    id: 'api-design', category: 'engineering',
    name: 'API Design',
    description: 'Endpoint tree with methods, auth layers, and request flows',
    icon: '⚡',
    build: () => {
      const root = node('root', 'API — Service', null, 0)
      const auth = node('auth', 'Authentication', 'root', 1, { issueType: 'epic', color: 'blue' })
      const users = node('users', 'Users', 'root', 1, { issueType: 'epic', color: 'green' })
      const res  = node('res',  'Resources', 'root', 1, { issueType: 'epic', color: 'purple' })
      const a1 = node('a1', 'POST /auth/login',    'auth',  2, { issueType: 'story', status: 'done',        storyPoints: 2 })
      const a2 = node('a2', 'POST /auth/register', 'auth',  2, { issueType: 'story', status: 'done',        storyPoints: 2 })
      const a3 = node('a3', 'POST /auth/refresh',  'auth',  2, { issueType: 'story', status: 'in-progress', storyPoints: 1 })
      const a4 = node('a4', 'POST /auth/logout',   'auth',  2, { issueType: 'story', status: 'todo',        storyPoints: 1 })
      const u1 = node('u1', 'GET /users',          'users', 2, { issueType: 'story', status: 'done',        storyPoints: 2 })
      const u2 = node('u2', 'GET /users/:id',      'users', 2, { issueType: 'story', status: 'done',        storyPoints: 1 })
      const u3 = node('u3', 'PUT /users/:id',      'users', 2, { issueType: 'story', status: 'in-progress', storyPoints: 2 })
      const u4 = node('u4', 'DELETE /users/:id',   'users', 2, { issueType: 'story', status: 'todo',        storyPoints: 1 })
      const r1 = node('r1', 'GET /resources',      'res',   2, { issueType: 'story', status: 'todo',        storyPoints: 3 })
      const r2 = node('r2', 'POST /resources',     'res',   2, { issueType: 'story', status: 'todo',        storyPoints: 3 })
      const r3 = node('r3', 'Rate limiting',        'res',   2, { issueType: 'task',  status: 'todo',        storyPoints: 2 })
      root.childIds  = ['auth', 'users', 'res']
      auth.childIds  = ['a1', 'a2', 'a3', 'a4']
      users.childIds = ['u1', 'u2', 'u3', 'u4']
      res.childIds   = ['r1', 'r2', 'r3']
      return { nodes: { root, auth, users, res, a1, a2, a3, a4, u1, u2, u3, u4, r1, r2, r3 }, rootId: 'root' }
    },
  },
  {
    id: 'release-planning', category: 'engineering',
    name: 'Release Planning',
    description: 'End-to-end release pipeline from feature freeze to production',
    icon: '🚀',
    build: () => {
      const root = node('root', 'Release v1.0', null, 0)
      const freeze  = node('freeze',  'Feature Freeze',  'root', 1, { issueType: 'epic', color: 'green'  })
      const qa      = node('qa',      'QA Phase',        'root', 1, { issueType: 'epic', color: 'yellow' })
      const staging = node('staging', 'Staging',         'root', 1, { issueType: 'epic', color: 'blue'   })
      const prod    = node('prod',    'Production',      'root', 1, { issueType: 'epic', color: 'purple' })
      const f1 = node('f1', 'All features merged',    'freeze',  2, { issueType: 'task', status: 'done',        storyPoints: 1 })
      const f2 = node('f2', 'Code review complete',   'freeze',  2, { issueType: 'task', status: 'done',        storyPoints: 1 })
      const f3 = node('f3', 'Changelog written',      'freeze',  2, { issueType: 'task', status: 'in-progress', storyPoints: 1 })
      const q1 = node('q1', 'Regression testing',     'qa',      2, { issueType: 'task', status: 'in-progress', storyPoints: 5 })
      const q2 = node('q2', 'Performance benchmarks', 'qa',      2, { issueType: 'task', status: 'todo',        storyPoints: 3 })
      const q3 = node('q3', 'Security audit',         'qa',      2, { issueType: 'task', status: 'todo',        storyPoints: 3 })
      const s1 = node('s1', 'Deploy to staging',      'staging', 2, { issueType: 'task', status: 'todo',        storyPoints: 1 })
      const s2 = node('s2', 'Stakeholder sign-off',   'staging', 2, { issueType: 'task', status: 'todo',        storyPoints: 2 })
      const s3 = node('s3', 'Rollback plan ready',    'staging', 2, { issueType: 'task', status: 'todo',        storyPoints: 1 })
      const p1 = node('p1', 'Deploy to production',   'prod',    2, { issueType: 'task', status: 'todo',        storyPoints: 1 })
      const p2 = node('p2', 'Monitor error rates',    'prod',    2, { issueType: 'task', status: 'todo',        storyPoints: 2 })
      const p3 = node('p3', 'Announce to users',      'prod',    2, { issueType: 'task', status: 'todo',        storyPoints: 1 })
      root.childIds    = ['freeze', 'qa', 'staging', 'prod']
      freeze.childIds  = ['f1', 'f2', 'f3']
      qa.childIds      = ['q1', 'q2', 'q3']
      staging.childIds = ['s1', 's2', 's3']
      prod.childIds    = ['p1', 'p2', 'p3']
      return { nodes: { root, freeze, qa, staging, prod, f1, f2, f3, q1, q2, q3, s1, s2, s3, p1, p2, p3 }, rootId: 'root' }
    },
  },
  {
    id: 'incident-response', category: 'engineering',
    name: 'Incident Response',
    description: 'Triage, escalation, resolution, and post-mortem workflow',
    icon: '🚨',
    build: () => {
      const root     = node('root',     'Incident — [Name]',  null,       0)
      const detect   = node('detect',   'Detection',          'root',     1, { issueType: 'epic', color: 'red'    })
      const triage   = node('triage',   'Triage',             'root',     1, { issueType: 'epic', color: 'yellow' })
      const resolve  = node('resolve',  'Resolution',         'root',     1, { issueType: 'epic', color: 'blue'   })
      const postmort = node('postmort', 'Post-Mortem',        'root',     1, { issueType: 'epic', color: 'green'  })
      const d1 = node('d1', 'Alert triggered',          'detect',   2, { issueType: 'task', status: 'done',        storyPoints: 1 })
      const d2 = node('d2', 'Severity assessed (P1–P4)','detect',   2, { issueType: 'task', status: 'done',        storyPoints: 1 })
      const t1 = node('t1', 'Assign on-call engineer',  'triage',   2, { issueType: 'task', status: 'in-progress', storyPoints: 1 })
      const t2 = node('t2', 'Identify affected systems','triage',   2, { issueType: 'task', status: 'in-progress', storyPoints: 2 })
      const t3 = node('t3', 'Customer comms drafted',   'triage',   2, { issueType: 'task', status: 'todo',        storyPoints: 1 })
      const r1 = node('r1', 'Root cause identified',    'resolve',  2, { issueType: 'task', status: 'todo',        storyPoints: 3 })
      const r2 = node('r2', 'Fix deployed',             'resolve',  2, { issueType: 'task', status: 'todo',        storyPoints: 2 })
      const r3 = node('r3', 'Resolution verified',      'resolve',  2, { issueType: 'task', status: 'todo',        storyPoints: 1 })
      const p1 = node('p1', 'Timeline documented',      'postmort', 2, { issueType: 'task', status: 'todo',        storyPoints: 2 })
      const p2 = node('p2', 'Contributing factors',     'postmort', 2, { issueType: 'task', status: 'todo',        storyPoints: 2 })
      const p3 = node('p3', 'Action items assigned',    'postmort', 2, { issueType: 'task', status: 'todo',        storyPoints: 3 })
      root.childIds     = ['detect', 'triage', 'resolve', 'postmort']
      detect.childIds   = ['d1', 'd2']
      triage.childIds   = ['t1', 't2', 't3']
      resolve.childIds  = ['r1', 'r2', 'r3']
      postmort.childIds = ['p1', 'p2', 'p3']
      return { nodes: { root, detect, triage, resolve, postmort, d1, d2, t1, t2, t3, r1, r2, r3, p1, p2, p3 }, rootId: 'root' }
    },
  },

  // ── PRODUCT ──────────────────────────────────────────────────────────────────
  {
    id: 'roadmap', category: 'product', popular: true,
    name: 'Product Roadmap',
    description: 'Quarterly roadmap with epics and feature stories',
    icon: '🗺️',
    build: () => {
      const root = node('root', 'Product Roadmap', null, 0)
      const q1 = node('q1', 'Q1 — Foundation', 'root', 1, { issueType: 'epic', priority: 'critical' })
      const q2 = node('q2', 'Q2 — Growth',     'root', 1, { issueType: 'epic', priority: 'high'     })
      const q3 = node('q3', 'Q3 — Scale',      'root', 1, { issueType: 'epic', priority: 'medium'   })
      const f1 = node('f1', 'Core Auth System',      'q1', 2, { issueType: 'story', storyPoints: 13, status: 'done'        })
      const f2 = node('f2', 'Data Model v1',         'q1', 2, { issueType: 'story', storyPoints: 8,  status: 'done'        })
      const f3 = node('f3', 'User Onboarding',       'q2', 2, { issueType: 'story', storyPoints: 5,  status: 'in-progress' })
      const f4 = node('f4', 'Analytics Dashboard',   'q2', 2, { issueType: 'story', storyPoints: 8,  status: 'todo'        })
      const f5 = node('f5', 'Integrations API',      'q3', 2, { issueType: 'story', storyPoints: 13, status: 'todo'        })
      const f6 = node('f6', 'Performance Audit',     'q3', 2, { issueType: 'task',  storyPoints: 5,  status: 'todo'        })
      root.childIds = ['q1', 'q2', 'q3']
      q1.childIds = ['f1', 'f2']
      q2.childIds = ['f3', 'f4']
      q3.childIds = ['f5', 'f6']
      return { nodes: { root, q1, q2, q3, f1, f2, f3, f4, f5, f6 }, rootId: 'root' }
    },
  },
  {
    id: 'okr', category: 'product',
    name: 'OKR Planning',
    description: 'Objectives with key results and supporting initiatives',
    icon: '🎯',
    build: () => {
      const root = node('root', 'Q2 OKRs', null, 0)
      const o1 = node('o1', 'Objective 1: Grow User Base',     'root', 1, { issueType: 'epic', color: 'blue'   })
      const o2 = node('o2', 'Objective 2: Improve Reliability', 'root', 1, { issueType: 'epic', color: 'green'  })
      const o3 = node('o3', 'Objective 3: Revenue Growth',     'root', 1, { issueType: 'epic', color: 'purple' })
      const k1 = node('k1', 'KR1: 10K MAU by Q2 end',      'o1', 2, { issueType: 'story', status: 'in-progress', storyPoints: 5 })
      const k2 = node('k2', 'KR2: NPS score > 45',          'o1', 2, { issueType: 'story', status: 'todo',        storyPoints: 3 })
      const i1 = node('i1', 'Initiative: Referral program',  'o1', 2, { issueType: 'task',  status: 'todo',        storyPoints: 8 })
      const k3 = node('k3', 'KR1: 99.9% uptime',            'o2', 2, { issueType: 'story', status: 'in-progress', storyPoints: 3 })
      const k4 = node('k4', 'KR2: P99 latency < 200ms',     'o2', 2, { issueType: 'story', status: 'todo',        storyPoints: 5 })
      const i2 = node('i2', 'Initiative: Infra upgrade',     'o2', 2, { issueType: 'task',  status: 'todo',        storyPoints: 13 })
      const k5 = node('k5', 'KR1: $100K ARR',               'o3', 2, { issueType: 'story', status: 'todo',        storyPoints: 5 })
      const k6 = node('k6', 'KR2: 25 enterprise accounts',  'o3', 2, { issueType: 'story', status: 'todo',        storyPoints: 3 })
      const i3 = node('i3', 'Initiative: Enterprise tier',   'o3', 2, { issueType: 'task',  status: 'todo',        storyPoints: 13 })
      root.childIds = ['o1', 'o2', 'o3']
      o1.childIds = ['k1', 'k2', 'i1']
      o2.childIds = ['k3', 'k4', 'i2']
      o3.childIds = ['k5', 'k6', 'i3']
      return { nodes: { root, o1, o2, o3, k1, k2, i1, k3, k4, i2, k5, k6, i3 }, rootId: 'root' }
    },
  },
  {
    id: 'go-to-market', category: 'product',
    name: 'Go-to-Market',
    description: 'Launch phases from beta through growth with owners',
    icon: '📣',
    build: () => {
      const root   = node('root',   'Product Launch',  null,   0)
      const build  = node('build',  'Build Phase',     'root', 1, { issueType: 'epic', color: 'green'  })
      const pre    = node('pre',    'Pre-Launch',      'root', 1, { issueType: 'epic', color: 'blue'   })
      const launch = node('launch', 'Launch Day',      'root', 1, { issueType: 'epic', color: 'yellow' })
      const grow   = node('grow',   'Growth',          'root', 1, { issueType: 'epic', color: 'purple' })
      const b1 = node('b1', 'Feature complete',       'build',  2, { issueType: 'task',  status: 'done',        storyPoints: 13 })
      const b2 = node('b2', 'Beta testing done',      'build',  2, { issueType: 'task',  status: 'done',        storyPoints: 5  })
      const b3 = node('b3', 'Docs & FAQs ready',      'build',  2, { issueType: 'task',  status: 'done',        storyPoints: 3  })
      const p1 = node('p1', 'Landing page live',      'pre',    2, { issueType: 'task',  status: 'done',        storyPoints: 3  })
      const p2 = node('p2', 'Email sequence drafted',  'pre',    2, { issueType: 'story', status: 'in-progress', storyPoints: 5  })
      const p3 = node('p3', 'Press & blog outreach',   'pre',    2, { issueType: 'task',  status: 'todo',        storyPoints: 5  })
      const l1 = node('l1', 'Product Hunt post',      'launch', 2, { issueType: 'task',  status: 'todo',        storyPoints: 2  })
      const l2 = node('l2', 'Social media blast',     'launch', 2, { issueType: 'task',  status: 'todo',        storyPoints: 2  })
      const l3 = node('l3', 'Team on standby',        'launch', 2, { issueType: 'task',  status: 'todo',        storyPoints: 1  })
      const g1 = node('g1', 'User interviews',        'grow',   2, { issueType: 'story', status: 'todo',        storyPoints: 5  })
      const g2 = node('g2', 'Iterate on feedback',    'grow',   2, { issueType: 'story', status: 'todo',        storyPoints: 8  })
      const g3 = node('g3', 'Expand acquisition channels', 'grow', 2, { issueType: 'task', status: 'todo',     storyPoints: 8  })
      root.childIds   = ['build', 'pre', 'launch', 'grow']
      build.childIds  = ['b1', 'b2', 'b3']
      pre.childIds    = ['p1', 'p2', 'p3']
      launch.childIds = ['l1', 'l2', 'l3']
      grow.childIds   = ['g1', 'g2', 'g3']
      return { nodes: { root, build, pre, launch, grow, b1, b2, b3, p1, p2, p3, l1, l2, l3, g1, g2, g3 }, rootId: 'root' }
    },
  },
  {
    id: 'user-story-map', category: 'product',
    name: 'User Story Map',
    description: 'Journey backbone with epics and story slices underneath',
    icon: '🧭',
    build: () => {
      const root    = node('root',    'User Story Map', null,       0)
      const disc    = node('disc',    'Discover',       'root',     1, { issueType: 'epic', color: 'blue'   })
      const decide  = node('decide',  'Decide',         'root',     1, { issueType: 'epic', color: 'yellow' })
      const purchase = node('purchase','Purchase',      'root',     1, { issueType: 'epic', color: 'green'  })
      const browse  = node('browse',  'Browse catalog',  'disc',    2, { issueType: 'story', status: 'done',        storyPoints: 5 })
      const search  = node('search',  'Search',          'disc',    2, { issueType: 'story', status: 'done',        storyPoints: 3 })
      const b1 = node('b1', 'View featured items', 'browse', 3, { issueType: 'task', status: 'done',        storyPoints: 2 })
      const b2 = node('b2', 'Filter by category',  'browse', 3, { issueType: 'task', status: 'done',        storyPoints: 3 })
      const se1 = node('se1', 'Keyword search',    'search', 3, { issueType: 'task', status: 'done',        storyPoints: 2 })
      const se2 = node('se2', 'Suggested results', 'search', 3, { issueType: 'task', status: 'in-progress', storyPoints: 3 })
      const detail = node('detail', 'View detail',     'decide', 2, { issueType: 'story', status: 'in-progress', storyPoints: 5 })
      const cart   = node('cart',   'Add to cart',     'decide', 2, { issueType: 'story', status: 'todo',        storyPoints: 3 })
      const d1 = node('d1', 'Read reviews',   'detail', 3, { issueType: 'task', status: 'in-progress', storyPoints: 3 })
      const d2 = node('d2', 'Compare options','detail', 3, { issueType: 'task', status: 'todo',        storyPoints: 5 })
      const checkout = node('checkout', 'Checkout',    'purchase', 2, { issueType: 'story', status: 'todo', storyPoints: 8 })
      const ch1 = node('ch1', 'Payment flow',        'checkout', 3, { issueType: 'task', status: 'todo', storyPoints: 5 })
      const ch2 = node('ch2', 'Order confirmation',  'checkout', 3, { issueType: 'task', status: 'todo', storyPoints: 3 })
      root.childIds     = ['disc', 'decide', 'purchase']
      disc.childIds     = ['browse', 'search']
      browse.childIds   = ['b1', 'b2']
      search.childIds   = ['se1', 'se2']
      decide.childIds   = ['detail', 'cart']
      detail.childIds   = ['d1', 'd2']
      purchase.childIds = ['checkout']
      checkout.childIds = ['ch1', 'ch2']
      return { nodes: { root, disc, decide, purchase, browse, search, b1, b2, se1, se2, detail, cart, d1, d2, checkout, ch1, ch2 }, rootId: 'root' }
    },
  },
  {
    id: 'competitive-analysis', category: 'product',
    name: 'Competitive Analysis',
    description: 'Feature comparison across competitors and your positioning',
    icon: '⚔️',
    build: () => {
      const root = node('root', 'Competitive Landscape', null, 0)
      const compA = node('compA', 'Competitor A',   'root', 1, { issueType: 'epic', color: 'red'    })
      const compB = node('compB', 'Competitor B',   'root', 1, { issueType: 'epic', color: 'yellow' })
      const us    = node('us',    'Our Position',   'root', 1, { issueType: 'epic', color: 'green'  })
      const a1 = node('a1', 'Strengths: Market leader, big ecosystem', 'compA', 2, { issueType: 'story', status: 'done', storyPoints: 1 })
      const a2 = node('a2', 'Weaknesses: Complex onboarding, expensive', 'compA', 2, { issueType: 'story', status: 'done', storyPoints: 1 })
      const a3 = node('a3', 'Pricing: $30/user/month', 'compA', 2, { issueType: 'task', status: 'done', storyPoints: 1 })
      const b1 = node('b1', 'Strengths: Simple UI, fast setup', 'compB', 2, { issueType: 'story', status: 'done', storyPoints: 1 })
      const b2 = node('b2', 'Weaknesses: No Jira sync, limited export', 'compB', 2, { issueType: 'story', status: 'done', storyPoints: 1 })
      const b3 = node('b3', 'Pricing: $15/user/month', 'compB', 2, { issueType: 'task', status: 'done', storyPoints: 1 })
      const u1 = node('u1', 'Differentiator: Visual ↔ Jira two-way sync', 'us', 2, { issueType: 'story', status: 'in-progress', storyPoints: 5 })
      const u2 = node('u2', 'Differentiator: Real-time collaboration', 'us', 2, { issueType: 'story', status: 'in-progress', storyPoints: 3 })
      const u3 = node('u3', 'Gap opportunity: SMB segment underserved', 'us', 2, { issueType: 'task', status: 'todo', storyPoints: 3 })
      root.childIds  = ['compA', 'compB', 'us']
      compA.childIds = ['a1', 'a2', 'a3']
      compB.childIds = ['b1', 'b2', 'b3']
      us.childIds    = ['u1', 'u2', 'u3']
      return { nodes: { root, compA, compB, us, a1, a2, a3, b1, b2, b3, u1, u2, u3 }, rootId: 'root' }
    },
  },

  // ── TEAM ─────────────────────────────────────────────────────────────────────
  {
    id: 'retro', category: 'team', popular: true,
    name: 'Sprint Retrospective',
    description: 'Went well / didn\'t go well / action items',
    icon: '🔄',
    build: () => {
      const root    = node('root',    'Sprint Retro',    null,   0)
      const well    = node('well',    'Went Well',       'root', 1, { issueType: 'epic', color: 'green'  })
      const notwell = node('notwell', "Didn't Go Well",  'root', 1, { issueType: 'epic', color: 'red'    })
      const actions = node('actions', 'Action Items',    'root', 1, { issueType: 'epic', color: 'blue'   })
      const w1 = node('w1', 'Daily standups were focused & on time', 'well', 2, { issueType: 'task', status: 'done', storyPoints: 1 })
      const w2 = node('w2', 'Code review turnaround < 24h',          'well', 2, { issueType: 'task', status: 'done', storyPoints: 1 })
      const w3 = node('w3', 'No major production incidents',         'well', 2, { issueType: 'task', status: 'done', storyPoints: 1 })
      const n1 = node('n1', 'Story point estimation was off',        'notwell', 2, { issueType: 'bug', status: 'done', storyPoints: 1 })
      const n2 = node('n2', 'Tech debt slowed feature work',         'notwell', 2, { issueType: 'bug', status: 'done', storyPoints: 1 })
      const n3 = node('n3', 'Async communication gaps across TZs',   'notwell', 2, { issueType: 'bug', status: 'done', storyPoints: 1 })
      const a1 = node('a1', 'Run estimation calibration session',    'actions', 2, { issueType: 'story', status: 'todo', storyPoints: 2 })
      const a2 = node('a2', 'Schedule dedicated tech debt sprint',   'actions', 2, { issueType: 'story', status: 'todo', storyPoints: 5 })
      const a3 = node('a3', 'Create async standup Slack channel',    'actions', 2, { issueType: 'task',  status: 'todo', storyPoints: 1 })
      root.childIds    = ['well', 'notwell', 'actions']
      well.childIds    = ['w1', 'w2', 'w3']
      notwell.childIds = ['n1', 'n2', 'n3']
      actions.childIds = ['a1', 'a2', 'a3']
      return { nodes: { root, well, notwell, actions, w1, w2, w3, n1, n2, n3, a1, a2, a3 }, rootId: 'root' }
    },
  },
  {
    id: 'risk-register', category: 'team',
    name: 'Risk Register',
    description: 'Risks mapped by likelihood and impact with mitigations',
    icon: '⚠️',
    build: () => {
      const root = node('root', 'Risk Register', null, 0)
      const crit = node('crit', 'Critical Risks', 'root', 1, { issueType: 'epic', color: 'red',    priority: 'critical' })
      const high = node('high', 'High Risks',     'root', 1, { issueType: 'epic', color: 'yellow', priority: 'high'     })
      const med  = node('med',  'Medium Risks',   'root', 1, { issueType: 'epic', color: 'blue',   priority: 'medium'   })
      const r1 = node('r1', 'Key person dependency on lead engineer', 'crit', 2, { issueType: 'story', priority: 'critical', status: 'in-progress', storyPoints: 3 })
      const m1 = node('m1', 'Mitigation: Cross-train 2 team members', 'r1',   3, { issueType: 'task',  status: 'todo',        storyPoints: 5 })
      const r2 = node('r2', 'Data breach — PII exposure risk',        'crit', 2, { issueType: 'story', priority: 'critical', status: 'todo',        storyPoints: 5 })
      const m2 = node('m2', 'Mitigation: Third-party security audit', 'r2',   3, { issueType: 'task',  status: 'todo',        storyPoints: 5 })
      const r3 = node('r3', 'Third-party API breaking changes',       'high', 2, { issueType: 'story', priority: 'high',     status: 'todo',        storyPoints: 2 })
      const m3 = node('m3', 'Mitigation: Abstraction + versioning layer', 'r3', 3, { issueType: 'task', status: 'todo',      storyPoints: 3 })
      const r4 = node('r4', 'Scope creep derailing sprint goals',     'high', 2, { issueType: 'story', priority: 'high',     status: 'in-progress', storyPoints: 2 })
      const m4 = node('m4', 'Mitigation: Strict change control process', 'r4', 3, { issueType: 'task', status: 'todo',       storyPoints: 2 })
      const r5 = node('r5', 'Hiring delays on Q3 headcount plan',     'med',  2, { issueType: 'story', priority: 'medium',   status: 'todo',        storyPoints: 1 })
      root.childIds = ['crit', 'high', 'med']
      crit.childIds = ['r1', 'r2']
      r1.childIds   = ['m1']
      r2.childIds   = ['m2']
      high.childIds = ['r3', 'r4']
      r3.childIds   = ['m3']
      r4.childIds   = ['m4']
      med.childIds  = ['r5']
      return { nodes: { root, crit, high, med, r1, m1, r2, m2, r3, m3, r4, m4, r5 }, rootId: 'root' }
    },
  },
  {
    id: 'onboarding', category: 'team',
    name: 'Onboarding Plan',
    description: 'Week-by-week new hire milestones and ramp tasks',
    icon: '👋',
    build: () => {
      const root = node('root', 'Onboarding — New Hire', null, 0)
      const w1  = node('w1',  'Week 1: Setup & Culture', 'root', 1, { issueType: 'epic', color: 'blue'   })
      const w2  = node('w2',  'Week 2: Codebase',        'root', 1, { issueType: 'epic', color: 'green'  })
      const w34 = node('w34', 'Week 3–4: First Project', 'root', 1, { issueType: 'epic', color: 'purple' })
      const a1 = node('a1', 'Dev environment setup',       'w1',  2, { issueType: 'task',  status: 'todo', storyPoints: 2 })
      const a2 = node('a2', 'Meet the team (1:1s)',        'w1',  2, { issueType: 'task',  status: 'todo', storyPoints: 1 })
      const a3 = node('a3', 'Read wiki & architecture docs', 'w1', 2, { issueType: 'task', status: 'todo', storyPoints: 2 })
      const a4 = node('a4', 'Shadow senior engineer',      'w1',  2, { issueType: 'task',  status: 'todo', storyPoints: 2 })
      const b1 = node('b1', 'Architecture walkthrough session', 'w2', 2, { issueType: 'task', status: 'todo', storyPoints: 3 })
      const b2 = node('b2', 'First small PR merged',       'w2',  2, { issueType: 'story', status: 'todo', storyPoints: 3 })
      const b3 = node('b3', 'Code review process deep-dive', 'w2', 2, { issueType: 'task', status: 'todo', storyPoints: 2 })
      const c1 = node('c1', 'Assigned first real ticket',  'w34', 2, { issueType: 'story', status: 'todo', storyPoints: 5 })
      const c2 = node('c2', 'Pair programming sessions ×3','w34', 2, { issueType: 'task',  status: 'todo', storyPoints: 3 })
      const c3 = node('c3', 'Ship feature to production',  'w34', 2, { issueType: 'story', status: 'todo', storyPoints: 8 })
      root.childIds = ['w1', 'w2', 'w34']
      w1.childIds   = ['a1', 'a2', 'a3', 'a4']
      w2.childIds   = ['b1', 'b2', 'b3']
      w34.childIds  = ['c1', 'c2', 'c3']
      return { nodes: { root, w1, w2, w34, a1, a2, a3, a4, b1, b2, b3, c1, c2, c3 }, rootId: 'root' }
    },
  },
  {
    id: 'decision-log', category: 'team',
    name: 'Decision Log',
    description: 'Problems, options considered, decisions made, and rationale',
    icon: '📋',
    build: () => {
      const root = node('root', 'Decision Log', null, 0)
      const d1   = node('d1',   'Decision: Database choice', 'root', 1, { issueType: 'epic', color: 'blue'   })
      const d2   = node('d2',   'Decision: Auth strategy',  'root', 1, { issueType: 'epic', color: 'green'  })
      const d3   = node('d3',   'Decision: Frontend framework', 'root', 1, { issueType: 'epic', color: 'purple' })
      const p1 = node('p1', 'Problem: Need reliable relational storage', 'd1', 2, { issueType: 'task',  status: 'done', storyPoints: 1 })
      const o1 = node('o1', 'Option A: PostgreSQL — ACID, mature',       'd1', 2, { issueType: 'story', status: 'done', storyPoints: 1 })
      const o2 = node('o2', 'Option B: MongoDB — flexible schema',       'd1', 2, { issueType: 'story', status: 'done', storyPoints: 1 })
      const dec1 = node('dec1', '✅ Decision: PostgreSQL',               'd1', 2, { issueType: 'task',  status: 'done', storyPoints: 1 })
      const rat1 = node('rat1', 'Rationale: ACID compliance, strong ecosystem', 'd1', 2, { issueType: 'task', status: 'done', storyPoints: 1 })
      const p2 = node('p2', 'Problem: Stateless auth at scale',          'd2', 2, { issueType: 'task',  status: 'done', storyPoints: 1 })
      const o3 = node('o3', 'Option A: JWT — stateless, portable',       'd2', 2, { issueType: 'story', status: 'done', storyPoints: 1 })
      const o4 = node('o4', 'Option B: Sessions — simpler revocation',   'd2', 2, { issueType: 'story', status: 'done', storyPoints: 1 })
      const dec2 = node('dec2', '✅ Decision: JWT + refresh tokens',      'd2', 2, { issueType: 'task',  status: 'done', storyPoints: 1 })
      const p3 = node('p3', 'Problem: Pick SPA framework for canvas app','d3', 2, { issueType: 'task',  status: 'todo', storyPoints: 1 })
      const o5 = node('o5', 'Option A: React — ecosystem, team familiarity', 'd3', 2, { issueType: 'story', status: 'todo', storyPoints: 1 })
      const o6 = node('o6', 'Option B: Vue — lighter, simpler state',    'd3', 2, { issueType: 'story', status: 'todo', storyPoints: 1 })
      root.childIds = ['d1', 'd2', 'd3']
      d1.childIds   = ['p1', 'o1', 'o2', 'dec1', 'rat1']
      d2.childIds   = ['p2', 'o3', 'o4', 'dec2']
      d3.childIds   = ['p3', 'o5', 'o6']
      return { nodes: { root, d1, d2, d3, p1, o1, o2, dec1, rat1, p2, o3, o4, dec2, p3, o5, o6 }, rootId: 'root' }
    },
  },

  // ── DESIGN ───────────────────────────────────────────────────────────────────
  {
    id: 'design-sprint', category: 'design',
    name: 'Design Sprint',
    description: '5-day sprint: Understand, Sketch, Decide, Prototype, Test',
    icon: '🎨',
    build: () => {
      const root = node('root', 'Design Sprint', null, 0)
      const day1 = node('day1', 'Day 1: Understand', 'root', 1, { issueType: 'epic', color: 'blue'   })
      const day2 = node('day2', 'Day 2: Sketch',     'root', 1, { issueType: 'epic', color: 'yellow' })
      const day3 = node('day3', 'Day 3: Decide',     'root', 1, { issueType: 'epic', color: 'purple' })
      const day4 = node('day4', 'Day 4: Prototype',  'root', 1, { issueType: 'epic', color: 'green'  })
      const day5 = node('day5', 'Day 5: Test',       'root', 1, { issueType: 'epic', color: 'red'    })
      const d1a = node('d1a', 'Lightning talks from experts',   'day1', 2, { issueType: 'task',  status: 'done',        storyPoints: 2 })
      const d1b = node('d1b', 'Define the long-term goal',      'day1', 2, { issueType: 'task',  status: 'done',        storyPoints: 1 })
      const d1c = node('d1c', 'HMW (How Might We) notes',       'day1', 2, { issueType: 'story', status: 'done',        storyPoints: 2 })
      const d2a = node('d2a', 'Crazy 8s ideation round',        'day2', 2, { issueType: 'task',  status: 'in-progress', storyPoints: 2 })
      const d2b = node('d2b', 'Solution sketches per person',   'day2', 2, { issueType: 'story', status: 'todo',        storyPoints: 3 })
      const d3a = node('d3a', 'Critique & dot voting',          'day3', 2, { issueType: 'task',  status: 'todo',        storyPoints: 2 })
      const d3b = node('d3b', 'Storyboard the winning solution','day3', 2, { issueType: 'story', status: 'todo',        storyPoints: 3 })
      const d4a = node('d4a', 'Build realistic prototype',      'day4', 2, { issueType: 'story', status: 'todo',        storyPoints: 8 })
      const d4b = node('d4b', 'Prepare test interview script',  'day4', 2, { issueType: 'task',  status: 'todo',        storyPoints: 2 })
      const d5a = node('d5a', '5 user test interviews',         'day5', 2, { issueType: 'story', status: 'todo',        storyPoints: 5 })
      const d5b = node('d5b', 'Document patterns & insights',   'day5', 2, { issueType: 'task',  status: 'todo',        storyPoints: 3 })
      root.childIds = ['day1', 'day2', 'day3', 'day4', 'day5']
      day1.childIds = ['d1a', 'd1b', 'd1c']
      day2.childIds = ['d2a', 'd2b']
      day3.childIds = ['d3a', 'd3b']
      day4.childIds = ['d4a', 'd4b']
      day5.childIds = ['d5a', 'd5b']
      return { nodes: { root, day1, day2, day3, day4, day5, d1a, d1b, d1c, d2a, d2b, d3a, d3b, d4a, d4b, d5a, d5b }, rootId: 'root' }
    },
  },
  {
    id: 'customer-journey', category: 'design',
    name: 'Customer Journey Map',
    description: 'Stages, touchpoints, emotions, pain points, and opportunities',
    icon: '🗺️',
    build: () => {
      const root    = node('root',    'Customer Journey',  null,     0)
      const aware   = node('aware',   'Awareness',         'root',   1, { issueType: 'epic', color: 'blue'   })
      const consid  = node('consid',  'Consideration',     'root',   1, { issueType: 'epic', color: 'yellow' })
      const onboard = node('onboard', 'Onboarding',        'root',   1, { issueType: 'epic', color: 'green'  })
      const retain  = node('retain',  'Retention',         'root',   1, { issueType: 'epic', color: 'purple' })
      const aw1 = node('aw1', 'Touchpoints: SEO, social, word of mouth',  'aware',   2, { issueType: 'task',  status: 'done', storyPoints: 1 })
      const aw2 = node('aw2', 'Emotions: Curious, unaware of problem',    'aware',   2, { issueType: 'task',  status: 'done', storyPoints: 1 })
      const aw3 = node('aw3', 'Pain: Hard to find relevant solutions',    'aware',   2, { issueType: 'bug',   status: 'done', storyPoints: 1 })
      const aw4 = node('aw4', 'Opportunity: SEO + thought leadership',    'aware',   2, { issueType: 'story', status: 'todo', storyPoints: 5 })
      const co1 = node('co1', 'Touchpoints: Website, demo video',         'consid',  2, { issueType: 'task',  status: 'done', storyPoints: 1 })
      const co2 = node('co2', 'Emotions: Interested but skeptical',       'consid',  2, { issueType: 'task',  status: 'done', storyPoints: 1 })
      const co3 = node('co3', 'Pain: Unclear ROI / value proposition',    'consid',  2, { issueType: 'bug',   status: 'done', storyPoints: 1 })
      const co4 = node('co4', 'Opportunity: ROI calculator on site',      'consid',  2, { issueType: 'story', status: 'todo', storyPoints: 5 })
      const ob1 = node('ob1', 'Touchpoints: Welcome email, in-app tips',  'onboard', 2, { issueType: 'task',  status: 'done', storyPoints: 1 })
      const ob2 = node('ob2', 'Emotions: Excited but overwhelmed',        'onboard', 2, { issueType: 'task',  status: 'done', storyPoints: 1 })
      const ob3 = node('ob3', 'Pain: Setup takes too long',               'onboard', 2, { issueType: 'bug',   status: 'in-progress', storyPoints: 2 })
      const ob4 = node('ob4', 'Opportunity: Interactive guided setup',    'onboard', 2, { issueType: 'story', status: 'todo', storyPoints: 8 })
      const re1 = node('re1', 'Touchpoints: In-app, support, NPS survey', 'retain',  2, { issueType: 'task',  status: 'todo', storyPoints: 1 })
      const re2 = node('re2', 'Emotions: Satisfied or stuck',             'retain',  2, { issueType: 'task',  status: 'todo', storyPoints: 1 })
      const re3 = node('re3', 'Pain: Missing integrations / features',    'retain',  2, { issueType: 'bug',   status: 'todo', storyPoints: 2 })
      const re4 = node('re4', 'Opportunity: In-app feature request flow', 'retain',  2, { issueType: 'story', status: 'todo', storyPoints: 5 })
      root.childIds    = ['aware', 'consid', 'onboard', 'retain']
      aware.childIds   = ['aw1', 'aw2', 'aw3', 'aw4']
      consid.childIds  = ['co1', 'co2', 'co3', 'co4']
      onboard.childIds = ['ob1', 'ob2', 'ob3', 'ob4']
      retain.childIds  = ['re1', 're2', 're3', 're4']
      return { nodes: { root, aware, consid, onboard, retain, aw1, aw2, aw3, aw4, co1, co2, co3, co4, ob1, ob2, ob3, ob4, re1, re2, re3, re4 }, rootId: 'root' }
    },
  },

  // ── STRATEGY ─────────────────────────────────────────────────────────────────
  {
    id: 'swot', category: 'strategy',
    name: 'SWOT Analysis',
    description: '4-quadrant strengths, weaknesses, opportunities, threats',
    icon: '🔬',
    build: () => {
      const root    = node('root',    'SWOT Analysis',  null,   0)
      const strengths = node('strengths', 'Strengths',     'root', 1, { issueType: 'epic', color: 'green'  })
      const weaknesses = node('weaknesses', 'Weaknesses',  'root', 1, { issueType: 'epic', color: 'red'    })
      const opps    = node('opps',    'Opportunities',  'root', 1, { issueType: 'epic', color: 'blue'   })
      const threats = node('threats', 'Threats',        'root', 1, { issueType: 'epic', color: 'yellow' })
      const s1 = node('s1', 'Visual ↔ Jira workflow — unique positioning', 'strengths', 2, { issueType: 'task', status: 'done', storyPoints: 1 })
      const s2 = node('s2', 'Real-time collaboration out of the box',      'strengths', 2, { issueType: 'task', status: 'done', storyPoints: 1 })
      const s3 = node('s3', 'Fast onboarding — value in < 5 minutes',      'strengths', 2, { issueType: 'task', status: 'done', storyPoints: 1 })
      const w1 = node('w1', 'Limited integration ecosystem today',          'weaknesses', 2, { issueType: 'task', status: 'todo', storyPoints: 1 })
      const w2 = node('w2', 'New brand — low market awareness',             'weaknesses', 2, { issueType: 'task', status: 'todo', storyPoints: 1 })
      const o1 = node('o1', 'Remote team trend — distributed planning need','opps', 2, { issueType: 'story', status: 'todo', storyPoints: 3 })
      const o2 = node('o2', 'Jira fatigue growing in SMB market',           'opps', 2, { issueType: 'story', status: 'todo', storyPoints: 3 })
      const o3 = node('o3', 'AI-assisted planning features potential',       'opps', 2, { issueType: 'story', status: 'todo', storyPoints: 5 })
      const t1 = node('t1', 'Large players: Figma, Miro adding PM features','threats', 2, { issueType: 'bug', status: 'todo', storyPoints: 1 })
      const t2 = node('t2', 'Feature parity risk from Atlassian itself',     'threats', 2, { issueType: 'bug', status: 'todo', storyPoints: 1 })
      root.childIds      = ['strengths', 'weaknesses', 'opps', 'threats']
      strengths.childIds = ['s1', 's2', 's3']
      weaknesses.childIds = ['w1', 'w2']
      opps.childIds      = ['o1', 'o2', 'o3']
      threats.childIds   = ['t1', 't2']
      return { nodes: { root, strengths, weaknesses, opps, threats, s1, s2, s3, w1, w2, o1, o2, o3, t1, t2 }, rootId: 'root' }
    },
  },
  {
    id: 'project-charter', category: 'strategy',
    name: 'Project Charter',
    description: 'Goals, scope, stakeholders, timeline, and risk overview',
    icon: '📄',
    build: () => {
      const root  = node('root',  'Project Charter', null,   0)
      const goals = node('goals', 'Goals & Scope',   'root', 1, { issueType: 'epic', color: 'blue'   })
      const stake = node('stake', 'Stakeholders',    'root', 1, { issueType: 'epic', color: 'green'  })
      const tl    = node('tl',    'Timeline',        'root', 1, { issueType: 'epic', color: 'yellow' })
      const risks = node('risks', 'Risks & Constraints', 'root', 1, { issueType: 'epic', color: 'red' })
      const g1 = node('g1', 'Primary goal',                  'goals', 2, { issueType: 'task',  status: 'done',        storyPoints: 1 })
      const g2 = node('g2', 'Success metrics (measurable)',  'goals', 2, { issueType: 'story', status: 'done',        storyPoints: 2 })
      const g3 = node('g3', 'In scope',                      'goals', 2, { issueType: 'task',  status: 'done',        storyPoints: 1 })
      const g4 = node('g4', 'Out of scope',                  'goals', 2, { issueType: 'task',  status: 'done',        storyPoints: 1 })
      const st1 = node('st1', 'Executive Sponsor',           'stake', 2, { issueType: 'task',  status: 'done',        storyPoints: 1 })
      const st2 = node('st2', 'Product Owner',               'stake', 2, { issueType: 'task',  status: 'done',        storyPoints: 1 })
      const st3 = node('st3', 'Engineering Lead',            'stake', 2, { issueType: 'task',  status: 'done',        storyPoints: 1 })
      const st4 = node('st4', 'End Users / Customers',       'stake', 2, { issueType: 'task',  status: 'done',        storyPoints: 1 })
      const tl1 = node('tl1', 'Kickoff date',                'tl',    2, { issueType: 'task',  status: 'done',        storyPoints: 1 })
      const tl2 = node('tl2', 'Milestone 1: Alpha release',  'tl',    2, { issueType: 'story', status: 'in-progress', storyPoints: 5 })
      const tl3 = node('tl3', 'Milestone 2: Beta release',   'tl',    2, { issueType: 'story', status: 'todo',        storyPoints: 8 })
      const tl4 = node('tl4', 'Target launch date',          'tl',    2, { issueType: 'task',  status: 'todo',        storyPoints: 1 })
      const ri1 = node('ri1', 'Budget constraint: fixed cap', 'risks', 2, { issueType: 'bug',   status: 'todo',        storyPoints: 1 })
      const ri2 = node('ri2', 'Timeline risk: dependency on X team', 'risks', 2, { issueType: 'bug', status: 'todo',  storyPoints: 2 })
      const ri3 = node('ri3', 'Technical risk: unknown API scale', 'risks', 2, { issueType: 'bug', status: 'todo',    storyPoints: 3 })
      root.childIds  = ['goals', 'stake', 'tl', 'risks']
      goals.childIds = ['g1', 'g2', 'g3', 'g4']
      stake.childIds = ['st1', 'st2', 'st3', 'st4']
      tl.childIds    = ['tl1', 'tl2', 'tl3', 'tl4']
      risks.childIds = ['ri1', 'ri2', 'ri3']
      return { nodes: { root, goals, stake, tl, risks, g1, g2, g3, g4, st1, st2, st3, st4, tl1, tl2, tl3, tl4, ri1, ri2, ri3 }, rootId: 'root' }
    },
  },

  // ── STARTUP ──────────────────────────────────────────────────────────────────
  {
    id: 'pitch-deck', category: 'startup', popular: true,
    name: 'Startup Pitch Deck',
    description: 'Problem → solution → market → traction → team → ask',
    icon: '🎤',
    build: () => {
      const root = node('root', 'Pitch Deck', null, 0)
      const prob = node('prob', '1. Problem', 'root', 1, { issueType: 'epic', color: 'red' })
      const sol  = node('sol',  '2. Solution', 'root', 1, { issueType: 'epic', color: 'green' })
      const mkt  = node('mkt',  '3. Market', 'root', 1, { issueType: 'epic', color: 'blue' })
      const trac = node('trac', '4. Traction', 'root', 1, { issueType: 'epic', color: 'yellow' })
      const team = node('team', '5. Team', 'root', 1, { issueType: 'epic', color: 'purple' })
      const ask  = node('ask',  '6. The Ask', 'root', 1, { issueType: 'epic', color: 'orange' })
      const p1 = node('p1', 'Pain point — who feels it and how bad', 'prob', 2, { issueType: 'task', status: 'done', storyPoints: 2 })
      const p2 = node('p2', 'Current alternatives & why they fail',  'prob', 2, { issueType: 'task', status: 'done', storyPoints: 2 })
      const s1 = node('s1', 'Core product value proposition',        'sol',  2, { issueType: 'story', status: 'done', storyPoints: 3 })
      const s2 = node('s2', 'Key differentiators (3 max)',           'sol',  2, { issueType: 'task',  status: 'done', storyPoints: 2 })
      const s3 = node('s3', 'Product demo / screenshot',             'sol',  2, { issueType: 'task',  status: 'done', storyPoints: 1 })
      const m1 = node('m1', 'TAM / SAM / SOM breakdown',            'mkt',  2, { issueType: 'story', status: 'todo', storyPoints: 5 })
      const m2 = node('m2', 'Target customer segment',               'mkt',  2, { issueType: 'task',  status: 'todo', storyPoints: 2 })
      const tr1 = node('tr1', 'MRR / ARR or user count',            'trac', 2, { issueType: 'task',  status: 'in-progress', storyPoints: 3 })
      const tr2 = node('tr2', 'Growth rate (MoM)',                   'trac', 2, { issueType: 'task',  status: 'in-progress', storyPoints: 2 })
      const tr3 = node('tr3', 'Key customer logos / quotes',         'trac', 2, { issueType: 'task',  status: 'todo',        storyPoints: 2 })
      const te1 = node('te1', 'Founder #1 — background & role',     'team', 2, { issueType: 'task',  status: 'done', storyPoints: 1 })
      const te2 = node('te2', 'Founder #2 — background & role',     'team', 2, { issueType: 'task',  status: 'done', storyPoints: 1 })
      const te3 = node('te3', 'Advisors / investors',                'team', 2, { issueType: 'task',  status: 'done', storyPoints: 1 })
      const a1 = node('a1', 'Raise amount',                          'ask',  2, { issueType: 'task',  status: 'todo', storyPoints: 1 })
      const a2 = node('a2', 'Use of funds breakdown',                'ask',  2, { issueType: 'story', status: 'todo', storyPoints: 3 })
      const a3 = node('a3', '18-month milestones post-raise',        'ask',  2, { issueType: 'story', status: 'todo', storyPoints: 3 })
      root.childIds = ['prob', 'sol', 'mkt', 'trac', 'team', 'ask']
      prob.childIds = ['p1', 'p2']
      sol.childIds  = ['s1', 's2', 's3']
      mkt.childIds  = ['m1', 'm2']
      trac.childIds = ['tr1', 'tr2', 'tr3']
      team.childIds = ['te1', 'te2', 'te3']
      ask.childIds  = ['a1', 'a2', 'a3']
      return { nodes: { root, prob, sol, mkt, trac, team, ask, p1, p2, s1, s2, s3, m1, m2, tr1, tr2, tr3, te1, te2, te3, a1, a2, a3 }, rootId: 'root' }
    },
  },
  {
    id: 'business-model-canvas', category: 'startup', popular: true,
    name: 'Business Model Canvas',
    description: 'All 9 BMC blocks: value prop, channels, revenue, cost',
    icon: '🏢',
    build: () => {
      const root = node('root', 'Business Model Canvas', null, 0)
      const vp  = node('vp',  'Value Propositions', 'root', 1, { issueType: 'epic', color: 'blue' })
      const cs  = node('cs',  'Customer Segments',  'root', 1, { issueType: 'epic', color: 'green' })
      const ch  = node('ch',  'Channels',           'root', 1, { issueType: 'epic', color: 'yellow' })
      const cr  = node('cr',  'Customer Relationships', 'root', 1, { issueType: 'epic', color: 'purple' })
      const rs  = node('rs',  'Revenue Streams',    'root', 1, { issueType: 'epic', color: 'green' })
      const kr  = node('kra', 'Key Resources',      'root', 1, { issueType: 'epic', color: 'orange' })
      const ka  = node('ka',  'Key Activities',     'root', 1, { issueType: 'epic', color: 'blue' })
      const kp  = node('kp',  'Key Partners',       'root', 1, { issueType: 'epic', color: 'yellow' })
      const cs2 = node('cs2', 'Cost Structure',     'root', 1, { issueType: 'epic', color: 'red' })
      const v1 = node('v1', 'Core value delivered to customer',      'vp', 2, { issueType: 'story', status: 'done', storyPoints: 3 })
      const v2 = node('v2', 'Problem uniquely solved',                'vp', 2, { issueType: 'task',  status: 'done', storyPoints: 2 })
      const c1 = node('c1', 'Primary segment — describe them',       'cs', 2, { issueType: 'task',  status: 'done', storyPoints: 2 })
      const c2 = node('c2', 'Secondary segment (if any)',             'cs', 2, { issueType: 'task',  status: 'todo', storyPoints: 1 })
      const ch1 = node('ch1', 'Acquisition channel (e.g. SEO, ads)', 'ch', 2, { issueType: 'task',  status: 'in-progress', storyPoints: 2 })
      const ch2 = node('ch2', 'Sales / self-serve model',            'ch', 2, { issueType: 'task',  status: 'todo',        storyPoints: 2 })
      const r1 = node('r1', 'Subscription / SaaS',                   'rs', 2, { issueType: 'story', status: 'todo', storyPoints: 5 })
      const r2 = node('r2', 'One-time / usage-based option',         'rs', 2, { issueType: 'task',  status: 'todo', storyPoints: 2 })
      const k1 = node('k1', 'Engineering team',                      'kra', 2, { issueType: 'task', status: 'done', storyPoints: 1 })
      const k2 = node('k2', 'IP / technology platform',              'kra', 2, { issueType: 'task', status: 'done', storyPoints: 1 })
      const ka1 = node('ka1', 'Product development',                 'ka', 2, { issueType: 'task', status: 'in-progress', storyPoints: 3 })
      const ka2 = node('ka2', 'Customer acquisition',                'ka', 2, { issueType: 'task', status: 'todo',        storyPoints: 3 })
      const cost1 = node('cost1', 'Salaries — team',                 'cs2', 2, { issueType: 'task', status: 'done', storyPoints: 1 })
      const cost2 = node('cost2', 'Infrastructure / hosting',        'cs2', 2, { issueType: 'task', status: 'done', storyPoints: 1 })
      const cost3 = node('cost3', 'Marketing budget',                'cs2', 2, { issueType: 'task', status: 'todo', storyPoints: 1 })
      root.childIds = ['vp', 'cs', 'ch', 'cr', 'rs', 'kra', 'ka', 'kp', 'cs2']
      vp.childIds  = ['v1', 'v2']
      cs.childIds  = ['c1', 'c2']
      ch.childIds  = ['ch1', 'ch2']
      rs.childIds  = ['r1', 'r2']
      kra.childIds = ['k1', 'k2']
      ka.childIds  = ['ka1', 'ka2']
      cs2.childIds = ['cost1', 'cost2', 'cost3']
      return { nodes: { root, vp, cs, ch, cr, rs, kra, ka, kp, cs2, v1, v2, c1, c2, ch1, ch2, r1, r2, k1, k2, ka1, ka2, cost1, cost2, cost3 }, rootId: 'root' }
    },
  },
  {
    id: 'hiring-pipeline', category: 'startup',
    name: 'Hiring Pipeline',
    description: 'Track candidates across roles from sourcing to offer',
    icon: '🧑‍💼',
    build: () => {
      const root = node('root', 'Hiring Pipeline', null, 0)
      const eng  = node('eng',  'Senior Engineer',   'root', 1, { issueType: 'epic', color: 'blue' })
      const pm   = node('pm',   'Product Manager',   'root', 1, { issueType: 'epic', color: 'purple' })
      const ds   = node('ds',   'Designer',          'root', 1, { issueType: 'epic', color: 'yellow' })
      const e1 = node('e1', 'Sourcing — LinkedIn / referrals',      'eng', 2, { issueType: 'story', status: 'in-progress', storyPoints: 2 })
      const e2 = node('e2', 'Phone screen (30 min)',                 'eng', 2, { issueType: 'task',  status: 'in-progress', storyPoints: 1 })
      const e3 = node('e3', 'Technical interview',                   'eng', 2, { issueType: 'task',  status: 'todo',        storyPoints: 2 })
      const e4 = node('e4', 'On-site / virtual loop',               'eng', 2, { issueType: 'task',  status: 'todo',        storyPoints: 3 })
      const e5 = node('e5', 'Reference check + offer',              'eng', 2, { issueType: 'task',  status: 'todo',        storyPoints: 1 })
      const p1 = node('p1', 'JD finalized & posted',                'pm',  2, { issueType: 'task',  status: 'done',        storyPoints: 1 })
      const p2 = node('p2', 'First-round interviews',               'pm',  2, { issueType: 'task',  status: 'in-progress', storyPoints: 2 })
      const p3 = node('p3', 'Case study / take-home',               'pm',  2, { issueType: 'task',  status: 'todo',        storyPoints: 2 })
      const p4 = node('p4', 'Final interview + hire decision',      'pm',  2, { issueType: 'task',  status: 'todo',        storyPoints: 1 })
      const d1 = node('d1', 'Portfolio review',                     'ds',  2, { issueType: 'task',  status: 'done',        storyPoints: 1 })
      const d2 = node('d2', 'Design challenge',                     'ds',  2, { issueType: 'task',  status: 'todo',        storyPoints: 2 })
      const d3 = node('d3', 'Team culture fit',                     'ds',  2, { issueType: 'task',  status: 'todo',        storyPoints: 1 })
      root.childIds = ['eng', 'pm', 'ds']
      eng.childIds  = ['e1', 'e2', 'e3', 'e4', 'e5']
      pm.childIds   = ['p1', 'p2', 'p3', 'p4']
      ds.childIds   = ['d1', 'd2', 'd3']
      return { nodes: { root, eng, pm, ds, e1, e2, e3, e4, e5, p1, p2, p3, p4, d1, d2, d3 }, rootId: 'root' }
    },
  },
  {
    id: 'fundraising-tracker', category: 'startup',
    name: 'Fundraising Tracker',
    description: 'Investor pipeline from first contact to term sheet',
    icon: '💰',
    build: () => {
      const root  = node('root',  'Seed Round — $1.5M', null,   0)
      const warm  = node('warm',  'Warm Leads',          'root', 1, { issueType: 'epic', color: 'green'  })
      const cold  = node('cold',  'Cold Outreach',       'root', 1, { issueType: 'epic', color: 'yellow' })
      const dd    = node('dd',    'Due Diligence',       'root', 1, { issueType: 'epic', color: 'blue'   })
      const pass  = node('pass',  'Passed',              'root', 1, { issueType: 'epic', color: 'red'    })
      const w1 = node('w1', 'Partner VC — intro from advisor',  'warm', 2, { issueType: 'story', status: 'in-progress', storyPoints: 5 })
      const w2 = node('w2', 'Angel investor — YC alumni network', 'warm', 2, { issueType: 'story', status: 'in-progress', storyPoints: 3 })
      const w3 = node('w3', 'Portfolio co-investor — founder ref', 'warm', 2, { issueType: 'task',  status: 'todo',        storyPoints: 2 })
      const co1 = node('co1', 'Tier-1 fund — cold email + deck', 'cold', 2, { issueType: 'task',  status: 'todo',        storyPoints: 2 })
      const co2 = node('co2', 'Micro VC #1 — AngelList intro',   'cold', 2, { issueType: 'task',  status: 'todo',        storyPoints: 2 })
      const d1 = node('d1', 'Data room — financials',            'dd',   2, { issueType: 'task',  status: 'done',        storyPoints: 1 })
      const d2 = node('d2', 'Cap table & legal docs',            'dd',   2, { issueType: 'task',  status: 'done',        storyPoints: 1 })
      const d3 = node('d3', 'Customer reference calls',          'dd',   2, { issueType: 'task',  status: 'in-progress', storyPoints: 2 })
      const pa1 = node('pa1', 'Fund X — wrong stage',            'pass', 2, { issueType: 'bug',   status: 'done',        storyPoints: 0 })
      root.childIds = ['warm', 'cold', 'dd', 'pass']
      warm.childIds = ['w1', 'w2', 'w3']
      cold.childIds = ['co1', 'co2']
      dd.childIds   = ['d1', 'd2', 'd3']
      pass.childIds = ['pa1']
      return { nodes: { root, warm, cold, dd, pass, w1, w2, w3, co1, co2, d1, d2, d3, pa1 }, rootId: 'root' }
    },
  },
  {
    id: 'kpi-dashboard', category: 'startup',
    name: 'KPI Dashboard',
    description: 'Key metrics by department: growth, product, finance, ops',
    icon: '📊',
    build: () => {
      const root = node('root', 'Company KPIs', null, 0)
      const grow = node('grow', 'Growth',    'root', 1, { issueType: 'epic', color: 'green'  })
      const prod = node('prod', 'Product',   'root', 1, { issueType: 'epic', color: 'blue'   })
      const fin  = node('fin',  'Finance',   'root', 1, { issueType: 'epic', color: 'yellow' })
      const ops  = node('ops',  'Operations','root', 1, { issueType: 'epic', color: 'purple' })
      const g1 = node('g1', 'MRR target: $50K',           'grow', 2, { issueType: 'story', status: 'in-progress', storyPoints: 8 })
      const g2 = node('g2', 'CAC < $200',                  'grow', 2, { issueType: 'task',  status: 'in-progress', storyPoints: 3 })
      const g3 = node('g3', 'Churn rate < 2%',             'grow', 2, { issueType: 'task',  status: 'todo',        storyPoints: 3 })
      const g4 = node('g4', 'NPS > 50',                    'grow', 2, { issueType: 'task',  status: 'todo',        storyPoints: 2 })
      const p1 = node('p1', 'DAU / MAU ratio > 40%',       'prod', 2, { issueType: 'task',  status: 'in-progress', storyPoints: 3 })
      const p2 = node('p2', 'Feature adoption rate',        'prod', 2, { issueType: 'task',  status: 'todo',        storyPoints: 2 })
      const p3 = node('p3', 'Time-to-value < 5 min',        'prod', 2, { issueType: 'story', status: 'todo',        storyPoints: 5 })
      const f1 = node('f1', 'Gross margin > 70%',           'fin',  2, { issueType: 'task',  status: 'done',        storyPoints: 1 })
      const f2 = node('f2', 'Runway: 18 months',            'fin',  2, { issueType: 'task',  status: 'done',        storyPoints: 1 })
      const f3 = node('f3', 'Burn rate < $80K/mo',          'fin',  2, { issueType: 'task',  status: 'in-progress', storyPoints: 2 })
      const o1 = node('o1', 'Support ticket SLA < 4h',      'ops',  2, { issueType: 'task',  status: 'todo',        storyPoints: 2 })
      const o2 = node('o2', 'Uptime > 99.9%',               'ops',  2, { issueType: 'task',  status: 'done',        storyPoints: 1 })
      root.childIds = ['grow', 'prod', 'fin', 'ops']
      grow.childIds = ['g1', 'g2', 'g3', 'g4']
      prod.childIds = ['p1', 'p2', 'p3']
      fin.childIds  = ['f1', 'f2', 'f3']
      ops.childIds  = ['o1', 'o2']
      return { nodes: { root, grow, prod, fin, ops, g1, g2, g3, g4, p1, p2, p3, f1, f2, f3, o1, o2 }, rootId: 'root' }
    },
  },
  {
    id: 'quarterly-planning', category: 'startup',
    name: 'Quarterly Planning (QBR)',
    description: 'Q-goals, initiatives, owners, and success criteria',
    icon: '📅',
    build: () => {
      const root = node('root', 'Q3 2026 Plan', null, 0)
      const rev  = node('rev',  'Retrospective (Q2)', 'root', 1, { issueType: 'epic', color: 'yellow' })
      const g    = node('g',    'Q3 Goals',           'root', 1, { issueType: 'epic', color: 'blue'   })
      const init = node('init', 'Key Initiatives',    'root', 1, { issueType: 'epic', color: 'green'  })
      const risk = node('risk', 'Risks & Blockers',   'root', 1, { issueType: 'epic', color: 'red'    })
      const r1 = node('r1', 'What went well — list',            'rev', 2, { issueType: 'task', status: 'done', storyPoints: 1 })
      const r2 = node('r2', 'What missed — with root cause',    'rev', 2, { issueType: 'task', status: 'done', storyPoints: 2 })
      const r3 = node('r3', 'Carry-forward items',              'rev', 2, { issueType: 'task', status: 'done', storyPoints: 1 })
      const g1 = node('g1', 'Reach $25K MRR',                  'g',   2, { issueType: 'story', status: 'todo', storyPoints: 8 })
      const g2 = node('g2', 'Launch mobile app beta',           'g',   2, { issueType: 'story', status: 'todo', storyPoints: 5 })
      const g3 = node('g3', 'Hire 2 engineers',                 'g',   2, { issueType: 'story', status: 'todo', storyPoints: 3 })
      const i1 = node('i1', 'Initiative: PLG onboarding redesign', 'init', 2, { issueType: 'story', status: 'in-progress', storyPoints: 8 })
      const i2 = node('i2', 'Initiative: Enterprise SSO',          'init', 2, { issueType: 'story', status: 'todo',        storyPoints: 5 })
      const i3 = node('i3', 'Initiative: Referral program',        'init', 2, { issueType: 'story', status: 'todo',        storyPoints: 3 })
      const rk1 = node('rk1', 'Dependency: design hire not yet closed', 'risk', 2, { issueType: 'bug', status: 'todo', storyPoints: 2 })
      const rk2 = node('rk2', 'Technical: mobile infra needs scaling', 'risk', 2, { issueType: 'bug', status: 'todo', storyPoints: 3 })
      root.childIds = ['rev', 'g', 'init', 'risk']
      rev.childIds  = ['r1', 'r2', 'r3']
      g.childIds    = ['g1', 'g2', 'g3']
      init.childIds = ['i1', 'i2', 'i3']
      risk.childIds = ['rk1', 'rk2']
      return { nodes: { root, rev, g, init, risk, r1, r2, r3, g1, g2, g3, i1, i2, i3, rk1, rk2 }, rootId: 'root' }
    },
  },

  // ── ENGINEERING (extra) ───────────────────────────────────────────────────────
  {
    id: 'tech-debt', category: 'engineering',
    name: 'Technical Debt Register',
    description: 'Categorized backlog of debt items with impact and effort scores',
    icon: '🧱',
    build: () => {
      const root = node('root', 'Tech Debt Register', null, 0)
      const crit = node('crit', 'Critical',    'root', 1, { issueType: 'epic', color: 'red'    })
      const high = node('high', 'High',        'root', 1, { issueType: 'epic', color: 'yellow' })
      const low  = node('low',  'Low / Backlog','root', 1, { issueType: 'epic', color: 'blue'  })
      const c1 = node('c1', 'Auth service — legacy session tokens (security)', 'crit', 2, { issueType: 'bug',  status: 'todo',        storyPoints: 8  })
      const c2 = node('c2', 'Monolithic DB queries — no indexing on events',  'crit', 2, { issueType: 'bug',  status: 'in-progress', storyPoints: 13 })
      const h1 = node('h1', 'Frontend — class components → hooks migration',  'high', 2, { issueType: 'story', status: 'todo',       storyPoints: 8  })
      const h2 = node('h2', 'No integration test coverage on payment flow',   'high', 2, { issueType: 'bug',  status: 'todo',        storyPoints: 5  })
      const h3 = node('h3', 'Hard-coded config values across services',       'high', 2, { issueType: 'task', status: 'todo',        storyPoints: 3  })
      const l1 = node('l1', 'Remove deprecated /v1 API endpoints',            'low',  2, { issueType: 'task', status: 'todo',        storyPoints: 2  })
      const l2 = node('l2', 'Consolidate duplicate utility functions',        'low',  2, { issueType: 'task', status: 'todo',        storyPoints: 2  })
      const l3 = node('l3', 'Upgrade dependencies — 6 months out of date',   'low',  2, { issueType: 'task', status: 'todo',        storyPoints: 3  })
      root.childIds = ['crit', 'high', 'low']
      crit.childIds = ['c1', 'c2']
      high.childIds = ['h1', 'h2', 'h3']
      low.childIds  = ['l1', 'l2', 'l3']
      return { nodes: { root, crit, high, low, c1, c2, h1, h2, h3, l1, l2, l3 }, rootId: 'root' }
    },
  },
  {
    id: 'system-architecture', category: 'engineering',
    name: 'System Architecture',
    description: 'Services, databases, APIs, and infrastructure layout',
    icon: '🏗️',
    build: () => {
      const root = node('root', 'System Architecture', null, 0)
      const fe   = node('fe',   'Frontend',    'root', 1, { issueType: 'epic', color: 'blue'   })
      const be   = node('be',   'Backend',     'root', 1, { issueType: 'epic', color: 'green'  })
      const data = node('data', 'Data Layer',  'root', 1, { issueType: 'epic', color: 'yellow' })
      const infra= node('infra','Infra / DevOps','root', 1, { issueType: 'epic', color: 'purple' })
      const f1 = node('f1', 'React SPA — Vite build',          'fe',   2, { issueType: 'task', status: 'done', storyPoints: 1 })
      const f2 = node('f2', 'Auth state — JWT in memory',      'fe',   2, { issueType: 'task', status: 'done', storyPoints: 1 })
      const f3 = node('f3', 'WebSocket client (collab)',        'fe',   2, { issueType: 'task', status: 'done', storyPoints: 2 })
      const b1 = node('b1', 'Node.js / Express API',           'be',   2, { issueType: 'task', status: 'done', storyPoints: 1 })
      const b2 = node('b2', 'WebSocket server (Socket.io)',     'be',   2, { issueType: 'task', status: 'done', storyPoints: 2 })
      const b3 = node('b3', 'Jira REST integration layer',     'be',   2, { issueType: 'story', status: 'done', storyPoints: 5 })
      const b4 = node('b4', 'Auth service — JWT / OAuth',      'be',   2, { issueType: 'task', status: 'done', storyPoints: 3 })
      const da1 = node('da1', 'PostgreSQL — primary DB',        'data', 2, { issueType: 'task', status: 'done', storyPoints: 1 })
      const da2 = node('da2', 'Redis — session cache',          'data', 2, { issueType: 'task', status: 'done', storyPoints: 1 })
      const da3 = node('da3', 'S3 — file attachments',          'data', 2, { issueType: 'task', status: 'todo', storyPoints: 2 })
      const i1 = node('i1', 'Docker / docker-compose',         'infra',2, { issueType: 'task', status: 'done', storyPoints: 1 })
      const i2 = node('i2', 'CI/CD — GitHub Actions',          'infra',2, { issueType: 'task', status: 'done', storyPoints: 2 })
      const i3 = node('i3', 'Prod: Railway / Render hosting',  'infra',2, { issueType: 'task', status: 'done', storyPoints: 1 })
      root.childIds  = ['fe', 'be', 'data', 'infra']
      fe.childIds    = ['f1', 'f2', 'f3']
      be.childIds    = ['b1', 'b2', 'b3', 'b4']
      data.childIds  = ['da1', 'da2', 'da3']
      infra.childIds = ['i1', 'i2', 'i3']
      return { nodes: { root, fe, be, data, infra, f1, f2, f3, b1, b2, b3, b4, da1, da2, da3, i1, i2, i3 }, rootId: 'root' }
    },
  },
  {
    id: 'deployment-checklist', category: 'engineering',
    name: 'Deployment Checklist',
    description: 'Pre-deploy, deploy, and post-deploy steps with rollback plan',
    icon: '🚢',
    build: () => {
      const root  = node('root',  'Release Deployment', null,   0)
      const pre   = node('pre',   'Pre-deploy',         'root', 1, { issueType: 'epic', color: 'yellow' })
      const dep   = node('dep',   'Deploy',             'root', 1, { issueType: 'epic', color: 'blue'   })
      const post  = node('post',  'Post-deploy',        'root', 1, { issueType: 'epic', color: 'green'  })
      const roll  = node('roll',  'Rollback Plan',      'root', 1, { issueType: 'epic', color: 'red'    })
      const pr1 = node('pr1', 'All tests passing (CI green)',       'pre', 2, { issueType: 'task', status: 'done',        storyPoints: 1 })
      const pr2 = node('pr2', 'DB migration script reviewed',       'pre', 2, { issueType: 'task', status: 'done',        storyPoints: 2 })
      const pr3 = node('pr3', 'Feature flags configured',           'pre', 2, { issueType: 'task', status: 'in-progress', storyPoints: 1 })
      const pr4 = node('pr4', 'Stakeholders notified',              'pre', 2, { issueType: 'task', status: 'todo',        storyPoints: 1 })
      const d1  = node('d1',  'Run DB migration',                   'dep', 2, { issueType: 'task', status: 'todo',        storyPoints: 1 })
      const d2  = node('d2',  'Deploy backend (zero-downtime)',      'dep', 2, { issueType: 'task', status: 'todo',        storyPoints: 2 })
      const d3  = node('d3',  'Deploy frontend / CDN invalidate',   'dep', 2, { issueType: 'task', status: 'todo',        storyPoints: 1 })
      const po1 = node('po1', 'Smoke test — critical paths',         'post', 2, { issueType: 'task', status: 'todo', storyPoints: 2 })
      const po2 = node('po2', 'Monitor error rate (30 min)',         'post', 2, { issueType: 'task', status: 'todo', storyPoints: 1 })
      const po3 = node('po3', 'Check latency dashboards',           'post', 2, { issueType: 'task', status: 'todo', storyPoints: 1 })
      const ro1 = node('ro1', 'Revert backend deploy tag',          'roll', 2, { issueType: 'task', status: 'todo', storyPoints: 1 })
      const ro2 = node('ro2', 'Run DB migration rollback script',   'roll', 2, { issueType: 'task', status: 'todo', storyPoints: 2 })
      const ro3 = node('ro3', 'Notify users of incident',           'roll', 2, { issueType: 'task', status: 'todo', storyPoints: 1 })
      root.childIds = ['pre', 'dep', 'post', 'roll']
      pre.childIds  = ['pr1', 'pr2', 'pr3', 'pr4']
      dep.childIds  = ['d1', 'd2', 'd3']
      post.childIds = ['po1', 'po2', 'po3']
      roll.childIds = ['ro1', 'ro2', 'ro3']
      return { nodes: { root, pre, dep, post, roll, pr1, pr2, pr3, pr4, d1, d2, d3, po1, po2, po3, ro1, ro2, ro3 }, rootId: 'root' }
    },
  },

  // ── PRODUCT (extra) ───────────────────────────────────────────────────────────
  {
    id: 'feature-prioritization', category: 'product',
    name: 'Feature Prioritization',
    description: 'Impact vs effort matrix with RICE-style scoring',
    icon: '⚖️',
    build: () => {
      const root    = node('root',    'Feature Backlog', null,   0)
      const quick   = node('quick',   'Quick Wins (high impact, low effort)', 'root', 1, { issueType: 'epic', color: 'green'  })
      const bets    = node('bets',    'Big Bets (high impact, high effort)',  'root', 1, { issueType: 'epic', color: 'blue'   })
      const fill    = node('fill',    'Fill-ins (low impact, low effort)',    'root', 1, { issueType: 'epic', color: 'yellow' })
      const skip    = node('skip',    'Skip (low impact, high effort)',       'root', 1, { issueType: 'epic', color: 'red'    })
      const q1 = node('q1', 'One-click Jira push from node',       'quick', 2, { issueType: 'story', status: 'done',        storyPoints: 3 })
      const q2 = node('q2', 'Keyboard shortcuts cheat sheet',      'quick', 2, { issueType: 'task',  status: 'done',        storyPoints: 1 })
      const q3 = node('q3', 'CSV export improvement',              'quick', 2, { issueType: 'task',  status: 'in-progress', storyPoints: 2 })
      const b1 = node('b1', 'Mobile app — iOS & Android',          'bets',  2, { issueType: 'story', status: 'todo',        storyPoints: 13})
      const b2 = node('b2', 'AI layout suggestions',               'bets',  2, { issueType: 'story', status: 'todo',        storyPoints: 8 })
      const b3 = node('b3', 'Offline mode with sync',              'bets',  2, { issueType: 'story', status: 'todo',        storyPoints: 13})
      const f1 = node('f1', 'Dark mode UI polish',                 'fill',  2, { issueType: 'task',  status: 'todo',        storyPoints: 2 })
      const f2 = node('f2', 'More export formats (XLS)',           'fill',  2, { issueType: 'task',  status: 'todo',        storyPoints: 2 })
      const s1 = node('s1', 'Chrome extension overlay',            'skip',  2, { issueType: 'task',  status: 'todo',        storyPoints: 8 })
      root.childIds  = ['quick', 'bets', 'fill', 'skip']
      quick.childIds = ['q1', 'q2', 'q3']
      bets.childIds  = ['b1', 'b2', 'b3']
      fill.childIds  = ['f1', 'f2']
      skip.childIds  = ['s1']
      return { nodes: { root, quick, bets, fill, skip, q1, q2, q3, b1, b2, b3, f1, f2, s1 }, rootId: 'root' }
    },
  },
  {
    id: 'prd-template', category: 'product',
    name: 'Product Requirements Doc',
    description: 'Context, problem, requirements, UX, and success metrics',
    icon: '📝',
    build: () => {
      const root = node('root', 'PRD: Feature Name', null, 0)
      const ctx  = node('ctx',  'Context & Background', 'root', 1, { issueType: 'epic', color: 'yellow' })
      const prob = node('prob', 'Problem Statement',    'root', 1, { issueType: 'epic', color: 'red'    })
      const req  = node('req',  'Requirements',         'root', 1, { issueType: 'epic', color: 'blue'   })
      const ux   = node('ux',   'UX & Design',          'root', 1, { issueType: 'epic', color: 'purple' })
      const met  = node('met',  'Success Metrics',      'root', 1, { issueType: 'epic', color: 'green'  })
      const cx1 = node('cx1', 'Why now — business context',      'ctx',  2, { issueType: 'task', status: 'done', storyPoints: 1 })
      const cx2 = node('cx2', 'Prior attempts or related work',  'ctx',  2, { issueType: 'task', status: 'done', storyPoints: 1 })
      const p1  = node('p1',  'Who is affected and how',         'prob', 2, { issueType: 'task', status: 'done', storyPoints: 2 })
      const p2  = node('p2',  'Current workaround',              'prob', 2, { issueType: 'task', status: 'done', storyPoints: 1 })
      const r1  = node('r1',  'Must-haves (P0)',                 'req',  2, { issueType: 'story', status: 'in-progress', storyPoints: 5 })
      const r2  = node('r2',  'Should-haves (P1)',               'req',  2, { issueType: 'story', status: 'todo',        storyPoints: 3 })
      const r3  = node('r3',  'Nice-to-haves (P2)',              'req',  2, { issueType: 'task',  status: 'todo',        storyPoints: 2 })
      const r4  = node('r4',  'Out of scope — explicit list',    'req',  2, { issueType: 'task',  status: 'done',        storyPoints: 1 })
      const u1  = node('u1',  'User flow / wireframe link',      'ux',   2, { issueType: 'task',  status: 'todo',        storyPoints: 3 })
      const u2  = node('u2',  'Edge cases & error states',       'ux',   2, { issueType: 'task',  status: 'todo',        storyPoints: 2 })
      const m1  = node('m1',  'Primary metric + target',         'met',  2, { issueType: 'task',  status: 'todo',        storyPoints: 2 })
      const m2  = node('m2',  'Guardrail metrics (must not regress)', 'met', 2, { issueType: 'task', status: 'todo',     storyPoints: 1 })
      root.childIds = ['ctx', 'prob', 'req', 'ux', 'met']
      ctx.childIds  = ['cx1', 'cx2']
      prob.childIds = ['p1', 'p2']
      req.childIds  = ['r1', 'r2', 'r3', 'r4']
      ux.childIds   = ['u1', 'u2']
      met.childIds  = ['m1', 'm2']
      return { nodes: { root, ctx, prob, req, ux, met, cx1, cx2, p1, p2, r1, r2, r3, r4, u1, u2, m1, m2 }, rootId: 'root' }
    },
  },

  // ── DESIGN (extra) ────────────────────────────────────────────────────────────
  {
    id: 'user-persona', category: 'design',
    name: 'User Persona Map',
    description: '3 persona profiles — goals, frustrations, and behaviors',
    icon: '🧑‍🎨',
    build: () => {
      const root = node('root', 'User Personas', null, 0)
      const pa   = node('pa',   'Alex — Startup PM',    'root', 1, { issueType: 'epic', color: 'blue'   })
      const pb   = node('pb',   'Sam — Solo Developer', 'root', 1, { issueType: 'epic', color: 'green'  })
      const pc   = node('pc',   'Jordan — Team Lead',   'root', 1, { issueType: 'epic', color: 'purple' })
      const a1 = node('a1', 'Goals: ship faster, less Jira wrangling',  'pa', 2, { issueType: 'task', status: 'done', storyPoints: 1 })
      const a2 = node('a2', 'Pain: context lost between tools',         'pa', 2, { issueType: 'bug',  status: 'done', storyPoints: 1 })
      const a3 = node('a3', 'Behavior: daily Jira + weekly roadmap review', 'pa', 2, { issueType: 'task', status: 'done', storyPoints: 1 })
      const a4 = node('a4', 'Quote: "I spend 20% of my time just syncing docs"', 'pa', 2, { issueType: 'task', status: 'done', storyPoints: 1 })
      const s1 = node('s1', 'Goals: visual thinking, personal org',     'pb', 2, { issueType: 'task', status: 'done', storyPoints: 1 })
      const s2 = node('s2', 'Pain: Notion is too free-form for planning', 'pb', 2, { issueType: 'bug',  status: 'done', storyPoints: 1 })
      const s3 = node('s3', 'Behavior: builds architecture diagrams weekly', 'pb', 2, { issueType: 'task', status: 'done', storyPoints: 1 })
      const j1 = node('j1', 'Goals: team alignment, fewer meetings',    'pc', 2, { issueType: 'task', status: 'done', storyPoints: 1 })
      const j2 = node('j2', 'Pain: standup info scattered in Slack',    'pc', 2, { issueType: 'bug',  status: 'done', storyPoints: 1 })
      const j3 = node('j3', 'Behavior: 1-on-1s + sprint retros weekly', 'pc', 2, { issueType: 'task', status: 'done', storyPoints: 1 })
      root.childIds = ['pa', 'pb', 'pc']
      pa.childIds   = ['a1', 'a2', 'a3', 'a4']
      pb.childIds   = ['s1', 's2', 's3']
      pc.childIds   = ['j1', 'j2', 'j3']
      return { nodes: { root, pa, pb, pc, a1, a2, a3, a4, s1, s2, s3, j1, j2, j3 }, rootId: 'root' }
    },
  },
  {
    id: 'ux-audit', category: 'design',
    name: 'UX Audit',
    description: 'Usability issues across flows, ranked by severity',
    icon: '🔍',
    build: () => {
      const root = node('root', 'UX Audit', null, 0)
      const onb  = node('onb',  'Onboarding Flow',   'root', 1, { issueType: 'epic', color: 'blue'   })
      const core = node('core', 'Core Canvas',       'root', 1, { issueType: 'epic', color: 'green'  })
      const nav  = node('nav',  'Navigation',        'root', 1, { issueType: 'epic', color: 'yellow' })
      const mob  = node('mob',  'Mobile / Responsive','root', 1, { issueType: 'epic', color: 'purple' })
      const on1 = node('on1', 'P0: No progress indicator on sign-up',  'onb', 2, { issueType: 'bug', status: 'todo', storyPoints: 3 })
      const on2 = node('on2', 'P1: Empty state unclear for new users', 'onb', 2, { issueType: 'bug', status: 'todo', storyPoints: 2 })
      const on3 = node('on3', 'P2: Welcome email not personalized',    'onb', 2, { issueType: 'task', status: 'todo', storyPoints: 1 })
      const co1 = node('co1', 'P0: Toolbar overflow on small screens', 'core', 2, { issueType: 'bug', status: 'in-progress', storyPoints: 5 })
      const co2 = node('co2', 'P1: Node double-click delay feels slow','core', 2, { issueType: 'bug', status: 'todo',        storyPoints: 2 })
      const na1 = node('na1', 'P1: Breadcrumb hard to see on dark bg', 'nav', 2, { issueType: 'bug', status: 'todo', storyPoints: 2 })
      const na2 = node('na2', 'P2: Settings page back button missing', 'nav', 2, { issueType: 'task', status: 'todo', storyPoints: 1 })
      const mo1 = node('mo1', 'P0: Canvas unusable on mobile Safari',  'mob', 2, { issueType: 'bug', status: 'todo', storyPoints: 8 })
      root.childIds = ['onb', 'core', 'nav', 'mob']
      onb.childIds  = ['on1', 'on2', 'on3']
      core.childIds = ['co1', 'co2']
      nav.childIds  = ['na1', 'na2']
      mob.childIds  = ['mo1']
      return { nodes: { root, onb, core, nav, mob, on1, on2, on3, co1, co2, na1, na2, mo1 }, rootId: 'root' }
    },
  },

  // ── TEAM (extra) ──────────────────────────────────────────────────────────────
  {
    id: 'meeting-agenda', category: 'team',
    name: 'Meeting Agenda',
    description: 'Structured agenda with topics, owners, timebox, and action items',
    icon: '📋',
    build: () => {
      const root   = node('root',   'Weekly Team Sync', null,   0)
      const agenda = node('agenda', 'Agenda',           'root', 1, { issueType: 'epic', color: 'blue'   })
      const notes  = node('notes',  'Notes & Decisions','root', 1, { issueType: 'epic', color: 'green'  })
      const action = node('action', 'Action Items',     'root', 1, { issueType: 'epic', color: 'yellow' })
      const a1 = node('a1', '1. Metrics review — 10 min (Owner: PM)',      'agenda', 2, { issueType: 'task', status: 'todo', storyPoints: 1 })
      const a2 = node('a2', '2. Sprint progress — 15 min (Owner: Eng)',    'agenda', 2, { issueType: 'task', status: 'todo', storyPoints: 1 })
      const a3 = node('a3', '3. Blockers & escalations — 10 min (All)',    'agenda', 2, { issueType: 'task', status: 'todo', storyPoints: 1 })
      const a4 = node('a4', '4. Upcoming milestones — 10 min (Lead)',      'agenda', 2, { issueType: 'task', status: 'todo', storyPoints: 1 })
      const a5 = node('a5', '5. Open floor / questions — 5 min',          'agenda', 2, { issueType: 'task', status: 'todo', storyPoints: 1 })
      const n1 = node('n1', 'Decision: push v1.4 release by 1 week',      'notes',  2, { issueType: 'task', status: 'done', storyPoints: 1 })
      const n2 = node('n2', 'Risk flagged: design resourcing gap in Q3',   'notes',  2, { issueType: 'bug',  status: 'done', storyPoints: 1 })
      const ac1 = node('ac1', 'Alex: update roadmap by Friday',           'action', 2, { issueType: 'task', status: 'todo', storyPoints: 1 })
      const ac2 = node('ac2', 'Sam: unblock auth PR today',               'action', 2, { issueType: 'task', status: 'todo', storyPoints: 1 })
      const ac3 = node('ac3', 'Jordan: post retro summary to Slack',      'action', 2, { issueType: 'task', status: 'todo', storyPoints: 1 })
      root.childIds   = ['agenda', 'notes', 'action']
      agenda.childIds = ['a1', 'a2', 'a3', 'a4', 'a5']
      notes.childIds  = ['n1', 'n2']
      action.childIds = ['ac1', 'ac2', 'ac3']
      return { nodes: { root, agenda, notes, action, a1, a2, a3, a4, a5, n1, n2, ac1, ac2, ac3 }, rootId: 'root' }
    },
  },
  {
    id: 'one-on-one', category: 'team',
    name: '1-on-1 Meeting Notes',
    description: 'Recurring manager / report structure with pulse, growth, action items',
    icon: '🤝',
    build: () => {
      const root   = node('root',   '1-on-1: Manager × Report', null, 0)
      const pulse  = node('pulse',  'Pulse Check',     'root', 1, { issueType: 'epic', color: 'yellow' })
      const work   = node('work',   'Work in Progress', 'root', 1, { issueType: 'epic', color: 'blue'  })
      const growth = node('growth', 'Growth & Career',  'root', 1, { issueType: 'epic', color: 'green' })
      const act    = node('act',    'Action Items',     'root', 1, { issueType: 'epic', color: 'purple' })
      const pu1 = node('pu1', 'Energy level this week (1–5)',         'pulse',  2, { issueType: 'task', status: 'todo', storyPoints: 1 })
      const pu2 = node('pu2', 'Anything blocking or frustrating?',   'pulse',  2, { issueType: 'task', status: 'todo', storyPoints: 1 })
      const w1  = node('w1',  'Current focus — what\'s shipping?',   'work',   2, { issueType: 'task', status: 'todo', storyPoints: 1 })
      const w2  = node('w2',  'Stuck on anything?',                  'work',   2, { issueType: 'task', status: 'todo', storyPoints: 1 })
      const w3  = node('w3',  'Cross-team dependencies',             'work',   2, { issueType: 'task', status: 'todo', storyPoints: 1 })
      const g1  = node('g1',  'Short-term goal (next 30 days)',      'growth', 2, { issueType: 'story', status: 'in-progress', storyPoints: 2 })
      const g2  = node('g2',  'Skill gap or learning interest',      'growth', 2, { issueType: 'task',  status: 'todo',        storyPoints: 1 })
      const g3  = node('g3',  'Feedback to give / receive',          'growth', 2, { issueType: 'task',  status: 'todo',        storyPoints: 1 })
      const ac1 = node('ac1', 'Manager: follow up on resourcing',    'act',    2, { issueType: 'task',  status: 'todo',        storyPoints: 1 })
      const ac2 = node('ac2', 'Report: share doc by next Tuesday',   'act',    2, { issueType: 'task',  status: 'todo',        storyPoints: 1 })
      root.childIds   = ['pulse', 'work', 'growth', 'act']
      pulse.childIds  = ['pu1', 'pu2']
      work.childIds   = ['w1', 'w2', 'w3']
      growth.childIds = ['g1', 'g2', 'g3']
      act.childIds    = ['ac1', 'ac2']
      return { nodes: { root, pulse, work, growth, act, pu1, pu2, w1, w2, w3, g1, g2, g3, ac1, ac2 }, rootId: 'root' }
    },
  },

  // ── PERSONAL ─────────────────────────────────────────────────────────────────
  {
    id: 'personal-project', category: 'personal', popular: true,
    name: 'Personal Project Planner',
    description: 'Phases, tasks, and milestones for any solo side project',
    icon: '🛠️',
    build: () => {
      const root  = node('root',  'My Project',    null,   0)
      const ph1   = node('ph1',   'Phase 1: Research & Plan', 'root', 1, { issueType: 'epic', color: 'yellow' })
      const ph2   = node('ph2',   'Phase 2: Build',           'root', 1, { issueType: 'epic', color: 'blue'   })
      const ph3   = node('ph3',   'Phase 3: Launch',          'root', 1, { issueType: 'epic', color: 'green'  })
      const ph4   = node('ph4',   'Backlog / Ideas',          'root', 1, { issueType: 'epic', color: 'purple' })
      const r1 = node('r1', 'Define the problem to solve',         'ph1', 2, { issueType: 'task',  status: 'done',        storyPoints: 1 })
      const r2 = node('r2', 'Research existing solutions',         'ph1', 2, { issueType: 'task',  status: 'done',        storyPoints: 2 })
      const r3 = node('r3', 'Write a one-pager with goal + scope', 'ph1', 2, { issueType: 'story', status: 'in-progress', storyPoints: 2 })
      const b1 = node('b1', 'Set up repo & dev environment',       'ph2', 2, { issueType: 'task',  status: 'in-progress', storyPoints: 1 })
      const b2 = node('b2', 'Build MVP — core feature only',       'ph2', 2, { issueType: 'story', status: 'todo',        storyPoints: 8 })
      const b3 = node('b3', 'Write tests for critical paths',      'ph2', 2, { issueType: 'task',  status: 'todo',        storyPoints: 3 })
      const l1 = node('l1', 'Create landing page',                 'ph3', 2, { issueType: 'task',  status: 'todo',        storyPoints: 3 })
      const l2 = node('l2', 'Announce on Product Hunt / Twitter',  'ph3', 2, { issueType: 'task',  status: 'todo',        storyPoints: 1 })
      const l3 = node('l3', 'Collect first 10 user feedbacks',     'ph3', 2, { issueType: 'story', status: 'todo',        storyPoints: 3 })
      const bk1 = node('bk1', 'Dark mode',                        'ph4', 2, { issueType: 'task',  status: 'todo',        storyPoints: 2 })
      const bk2 = node('bk2', 'Mobile-responsive layout',         'ph4', 2, { issueType: 'task',  status: 'todo',        storyPoints: 5 })
      root.childIds = ['ph1', 'ph2', 'ph3', 'ph4']
      ph1.childIds  = ['r1', 'r2', 'r3']
      ph2.childIds  = ['b1', 'b2', 'b3']
      ph3.childIds  = ['l1', 'l2', 'l3']
      ph4.childIds  = ['bk1', 'bk2']
      return { nodes: { root, ph1, ph2, ph3, ph4, r1, r2, r3, b1, b2, b3, l1, l2, l3, bk1, bk2 }, rootId: 'root' }
    },
  },
  {
    id: 'study-roadmap', category: 'personal', popular: true,
    name: 'Study / Learning Roadmap',
    description: 'Topics, resources, and weekly goals for any learning path',
    icon: '📚',
    build: () => {
      const root  = node('root',  'Learning: Full-Stack Dev', null, 0)
      const found = node('found', 'Foundations',    'root', 1, { issueType: 'epic', color: 'yellow' })
      const core  = node('core',  'Core Skills',    'root', 1, { issueType: 'epic', color: 'blue'   })
      const proj  = node('proj',  'Projects',       'root', 1, { issueType: 'epic', color: 'green'  })
      const res   = node('res',   'Resources',      'root', 1, { issueType: 'epic', color: 'purple' })
      const f1 = node('f1', 'HTML & CSS basics — week 1',     'found', 2, { issueType: 'task',  status: 'done',        storyPoints: 2 })
      const f2 = node('f2', 'JavaScript fundamentals — week 2–3', 'found', 2, { issueType: 'task', status: 'done',     storyPoints: 3 })
      const f3 = node('f3', 'Git & command line — week 2',    'found', 2, { issueType: 'task',  status: 'done',        storyPoints: 1 })
      const c1 = node('c1', 'React — week 4–6',               'core',  2, { issueType: 'story', status: 'in-progress', storyPoints: 5 })
      const c2 = node('c2', 'Node.js & Express — week 7–8',   'core',  2, { issueType: 'story', status: 'todo',        storyPoints: 5 })
      const c3 = node('c3', 'PostgreSQL basics — week 8',     'core',  2, { issueType: 'task',  status: 'todo',        storyPoints: 3 })
      const p1 = node('p1', 'Project 1: To-do app (CRUD)',    'proj',  2, { issueType: 'story', status: 'in-progress', storyPoints: 5 })
      const p2 = node('p2', 'Project 2: Blog with auth',      'proj',  2, { issueType: 'story', status: 'todo',        storyPoints: 8 })
      const p3 = node('p3', 'Project 3: Full-stack capstone', 'proj',  2, { issueType: 'story', status: 'todo',        storyPoints: 13})
      const rs1 = node('rs1', 'The Odin Project (free)',       'res',   2, { issueType: 'task',  status: 'done',        storyPoints: 1 })
      const rs2 = node('rs2', 'MDN Web Docs (reference)',      'res',   2, { issueType: 'task',  status: 'done',        storyPoints: 1 })
      const rs3 = node('rs3', 'YouTube: Fireship, Traversy',  'res',   2, { issueType: 'task',  status: 'todo',        storyPoints: 1 })
      root.childIds  = ['found', 'core', 'proj', 'res']
      found.childIds = ['f1', 'f2', 'f3']
      core.childIds  = ['c1', 'c2', 'c3']
      proj.childIds  = ['p1', 'p2', 'p3']
      res.childIds   = ['rs1', 'rs2', 'rs3']
      return { nodes: { root, found, core, proj, res, f1, f2, f3, c1, c2, c3, p1, p2, p3, rs1, rs2, rs3 }, rootId: 'root' }
    },
  },
  {
    id: 'job-search', category: 'personal',
    name: 'Job Search Tracker',
    description: 'Companies, stages, contacts, and follow-up actions',
    icon: '💼',
    build: () => {
      const root  = node('root',  'Job Search',      null,   0)
      const hot   = node('hot',   'Active (applied or interviewing)', 'root', 1, { issueType: 'epic', color: 'blue'   })
      const res   = node('res',   'Research list',   'root', 1, { issueType: 'epic', color: 'yellow' })
      const done  = node('done',  'Closed',          'root', 1, { issueType: 'epic', color: 'green'  })
      const prep  = node('prep',  'Interview Prep',  'root', 1, { issueType: 'epic', color: 'purple' })
      const h1 = node('h1', 'Acme Corp — 2nd round scheduled',        'hot', 2, { issueType: 'story', status: 'in-progress', storyPoints: 3 })
      const h2 = node('h2', 'StartupXYZ — take-home test sent',       'hot', 2, { issueType: 'story', status: 'in-progress', storyPoints: 2 })
      const h3 = node('h3', 'TechCo — awaiting recruiter callback',   'hot', 2, { issueType: 'task',  status: 'in-progress', storyPoints: 1 })
      const r1 = node('r1', 'Company A — check Glassdoor + LinkedIn', 'res', 2, { issueType: 'task',  status: 'todo',        storyPoints: 1 })
      const r2 = node('r2', 'Company B — reach out to eng on LinkedIn','res', 2, { issueType: 'task',  status: 'todo',        storyPoints: 1 })
      const d1 = node('d1', 'BigCorp — withdrew (bad culture fit)',   'done', 2, { issueType: 'task',  status: 'done',        storyPoints: 0 })
      const d2 = node('d2', 'OldSaas — rejected after screen',       'done', 2, { issueType: 'task',  status: 'done',        storyPoints: 0 })
      const pr1 = node('pr1', 'LeetCode: 2 mediums/day',             'prep', 2, { issueType: 'task',  status: 'in-progress', storyPoints: 3 })
      const pr2 = node('pr2', 'System design: read Grokking',        'prep', 2, { issueType: 'task',  status: 'todo',        storyPoints: 3 })
      const pr3 = node('pr3', 'Behavioural: STAR stories × 5',       'prep', 2, { issueType: 'task',  status: 'todo',        storyPoints: 2 })
      root.childIds = ['hot', 'res', 'done', 'prep']
      hot.childIds  = ['h1', 'h2', 'h3']
      res.childIds  = ['r1', 'r2']
      done.childIds = ['d1', 'd2']
      prep.childIds = ['pr1', 'pr2', 'pr3']
      return { nodes: { root, hot, res, done, prep, h1, h2, h3, r1, r2, d1, d2, pr1, pr2, pr3 }, rootId: 'root' }
    },
  },
  {
    id: 'essay-outline', category: 'personal',
    name: 'Essay / Research Outline',
    description: 'Thesis, sections, argument structure, and sources',
    icon: '🎓',
    build: () => {
      const root  = node('root',  'Research Paper',   null,   0)
      const intro = node('intro', 'Introduction',     'root', 1, { issueType: 'epic', color: 'blue'   })
      const lit   = node('lit',   'Literature Review','root', 1, { issueType: 'epic', color: 'yellow' })
      const meth  = node('meth',  'Methodology',      'root', 1, { issueType: 'epic', color: 'green'  })
      const body  = node('body',  'Main Arguments',   'root', 1, { issueType: 'epic', color: 'purple' })
      const conc  = node('conc',  'Conclusion',       'root', 1, { issueType: 'epic', color: 'blue'   })
      const src   = node('src',   'Sources',          'root', 1, { issueType: 'epic', color: 'green'  })
      const i1 = node('i1', 'Hook — attention-grabbing opener',      'intro', 2, { issueType: 'task', status: 'done',        storyPoints: 1 })
      const i2 = node('i2', 'Thesis statement (1 clear sentence)',   'intro', 2, { issueType: 'task', status: 'in-progress', storyPoints: 2 })
      const i3 = node('i3', 'Scope — what this paper covers & why', 'intro', 2, { issueType: 'task', status: 'todo',        storyPoints: 1 })
      const l1 = node('l1', 'Prior work supporting the thesis',      'lit',   2, { issueType: 'task', status: 'todo',        storyPoints: 3 })
      const l2 = node('l2', 'Contrasting views — acknowledge gaps',  'lit',   2, { issueType: 'task', status: 'todo',        storyPoints: 2 })
      const m1 = node('m1', 'Research method — qualitative / quant','meth',  2, { issueType: 'task', status: 'todo',        storyPoints: 2 })
      const m2 = node('m2', 'Data collection & sample',             'meth',  2, { issueType: 'task', status: 'todo',        storyPoints: 2 })
      const b1 = node('b1', 'Argument 1 — with evidence',           'body',  2, { issueType: 'story', status: 'todo',       storyPoints: 3 })
      const b2 = node('b2', 'Argument 2 — with evidence',           'body',  2, { issueType: 'story', status: 'todo',       storyPoints: 3 })
      const b3 = node('b3', 'Counter-argument & rebuttal',          'body',  2, { issueType: 'task',  status: 'todo',       storyPoints: 2 })
      const c1 = node('c1', 'Restate thesis in light of evidence',  'conc',  2, { issueType: 'task', status: 'todo',        storyPoints: 1 })
      const c2 = node('c2', 'Implications & future research',       'conc',  2, { issueType: 'task', status: 'todo',        storyPoints: 1 })
      const s1 = node('s1', 'Primary source 1 — cite here',         'src',   2, { issueType: 'task', status: 'done',        storyPoints: 0 })
      const s2 = node('s2', 'Primary source 2',                     'src',   2, { issueType: 'task', status: 'done',        storyPoints: 0 })
      const s3 = node('s3', 'Secondary source — review needed',     'src',   2, { issueType: 'task', status: 'todo',        storyPoints: 0 })
      root.childIds  = ['intro', 'lit', 'meth', 'body', 'conc', 'src']
      intro.childIds = ['i1', 'i2', 'i3']
      lit.childIds   = ['l1', 'l2']
      meth.childIds  = ['m1', 'm2']
      body.childIds  = ['b1', 'b2', 'b3']
      conc.childIds  = ['c1', 'c2']
      src.childIds   = ['s1', 's2', 's3']
      return { nodes: { root, intro, lit, meth, body, conc, src, i1, i2, i3, l1, l2, m1, m2, b1, b2, b3, c1, c2, s1, s2, s3 }, rootId: 'root' }
    },
  },

  // ── MARKETING ────────────────────────────────────────────────────────────────
  {
    id: 'content-calendar', category: 'marketing',
    name: 'Content Calendar',
    description: 'Pillars, channels, topics, and publishing schedule',
    icon: '📅',
    build: () => {
      const root   = node('root',  'Content Calendar',    null,   0)
      const p1     = node('p1',    'Pillar 1 — Educate',  'root', 1, { issueType: 'epic', color: 'blue'   })
      const p2     = node('p2',    'Pillar 2 — Inspire',  'root', 1, { issueType: 'epic', color: 'green'  })
      const p3     = node('p3',    'Pillar 3 — Convert',  'root', 1, { issueType: 'epic', color: 'yellow' })
      const dist   = node('dist',  'Distribution',        'root', 1, { issueType: 'epic', color: 'purple' })
      const met    = node('met',   'Metrics & Review',    'root', 1, { issueType: 'epic', color: 'red'    })
      // Pillar 1
      const p1b1 = node('p1b1', 'Blog post — how-to guide',          'p1', 2, { issueType: 'story', status: 'in-progress', storyPoints: 3 })
      const p1b2 = node('p1b2', 'Twitter thread — key insight',      'p1', 2, { issueType: 'task',  status: 'todo',        storyPoints: 1 })
      const p1b3 = node('p1b3', 'LinkedIn post — case study snippet','p1', 2, { issueType: 'task',  status: 'todo',        storyPoints: 1 })
      // Pillar 2
      const p2b1 = node('p2b1', 'Customer story — short video',      'p2', 2, { issueType: 'story', status: 'todo',        storyPoints: 5 })
      const p2b2 = node('p2b2', 'Newsletter section — founder note', 'p2', 2, { issueType: 'task',  status: 'todo',        storyPoints: 2 })
      // Pillar 3
      const p3b1 = node('p3b1', 'Product demo — loom walkthrough',   'p3', 2, { issueType: 'story', status: 'todo',        storyPoints: 3 })
      const p3b2 = node('p3b2', 'Comparison page — SEO landing',     'p3', 2, { issueType: 'task',  status: 'todo',        storyPoints: 5 })
      const p3b3 = node('p3b3', 'Email sequence — trial → paid',     'p3', 2, { issueType: 'task',  status: 'todo',        storyPoints: 3 })
      // Distribution
      const d1 = node('d1', 'Blog (own domain)',    'dist', 2, { issueType: 'task', status: 'done', storyPoints: 0 })
      const d2 = node('d2', 'X / Twitter',          'dist', 2, { issueType: 'task', status: 'done', storyPoints: 0 })
      const d3 = node('d3', 'LinkedIn',             'dist', 2, { issueType: 'task', status: 'done', storyPoints: 0 })
      const d4 = node('d4', 'Newsletter (weekly)',  'dist', 2, { issueType: 'task', status: 'done', storyPoints: 0 })
      // Metrics
      const m1 = node('m1', 'Impressions / reach',   'met', 2, { issueType: 'task', status: 'todo', storyPoints: 0 })
      const m2 = node('m2', 'Click-through rate',    'met', 2, { issueType: 'task', status: 'todo', storyPoints: 0 })
      const m3 = node('m3', 'Signups attributed',    'met', 2, { issueType: 'task', status: 'todo', storyPoints: 0 })
      root.childIds  = ['p1', 'p2', 'p3', 'dist', 'met']
      p1.childIds     = ['p1b1', 'p1b2', 'p1b3']
      p2.childIds    = ['p2b1', 'p2b2']
      p3.childIds    = ['p3b1', 'p3b2', 'p3b3']
      dist.childIds  = ['d1', 'd2', 'd3', 'd4']
      met.childIds   = ['m1', 'm2', 'm3']
      return { nodes: { root, p1, p2, p3, dist, met, p1b1, p1b2, p1b3, p2b1, p2b2, p3b1, p3b2, p3b3, d1, d2, d3, d4, m1, m2, m3 }, rootId: 'root' }
    },
  },

  // ── STARTUP (continued) ──────────────────────────────────────────────────────
  {
    id: 'sales-pipeline', category: 'startup',
    name: 'Sales Pipeline',
    description: 'Track leads from first touch to closed deal',
    icon: '💸',
    build: () => {
      const root  = node('root',  'Sales Pipeline',    null,   0)
      const lead  = node('lead',  'Leads',             'root', 1, { issueType: 'epic', color: 'blue'   })
      const qual  = node('qual',  'Qualified',         'root', 1, { issueType: 'epic', color: 'yellow' })
      const demo  = node('demo',  'Demo / Discovery',  'root', 1, { issueType: 'epic', color: 'purple' })
      const prop  = node('prop',  'Proposal Sent',     'root', 1, { issueType: 'epic', color: 'green'  })
      const close = node('close', 'Closed',            'root', 1, { issueType: 'epic', color: 'green'  })
      const lost  = node('lost',  'Lost / Churned',    'root', 1, { issueType: 'epic', color: 'red'    })
      // Leads
      const l1 = node('l1', 'Inbound — website form',   'lead', 2, { issueType: 'task', status: 'todo', storyPoints: 0 })
      const l2 = node('l2', 'Outbound — cold email',    'lead', 2, { issueType: 'task', status: 'todo', storyPoints: 0 })
      const l3 = node('l3', 'Referral from customer A', 'lead', 2, { issueType: 'task', status: 'in-progress', storyPoints: 0 })
      // Qualified
      const q1 = node('q1', 'Prospect X — budget confirmed',     'qual', 2, { issueType: 'story', status: 'in-progress', storyPoints: 3 })
      const q2 = node('q2', 'Prospect Y — evaluating Q3 budget', 'qual', 2, { issueType: 'story', status: 'todo',        storyPoints: 2 })
      // Demo
      const de1 = node('de1', 'Acme Corp — demo booked Thu',   'demo', 2, { issueType: 'story', status: 'in-progress', storyPoints: 5 })
      const de2 = node('de2', 'Beta Inc — discovery call done', 'demo', 2, { issueType: 'story', status: 'done',        storyPoints: 3 })
      // Proposal
      const pr1 = node('pr1', 'Acme Corp — proposal sent',    'prop', 2, { issueType: 'story', status: 'in-progress', storyPoints: 5 })
      // Closed
      const cl1 = node('cl1', 'Customer A — $1.2k MRR', 'close', 2, { issueType: 'story', status: 'done', storyPoints: 0 })
      const cl2 = node('cl2', 'Customer B — $800 MRR',  'close', 2, { issueType: 'story', status: 'done', storyPoints: 0 })
      // Lost
      const lo1 = node('lo1', 'Company Z — chose competitor', 'lost', 2, { issueType: 'task', status: 'done', storyPoints: 0 })
      root.childIds  = ['lead', 'qual', 'demo', 'prop', 'close', 'lost']
      lead.childIds  = ['l1', 'l2', 'l3']
      qual.childIds  = ['q1', 'q2']
      demo.childIds  = ['de1', 'de2']
      prop.childIds  = ['pr1']
      close.childIds = ['cl1', 'cl2']
      lost.childIds  = ['lo1']
      return { nodes: { root, lead, qual, demo, prop, close, lost, l1, l2, l3, q1, q2, de1, de2, pr1, cl1, cl2, lo1 }, rootId: 'root' }
    },
  },

  // ── STRATEGY (continued) ─────────────────────────────────────────────────────
  {
    id: 'north-star-metric', category: 'strategy',
    name: 'North Star Metric',
    description: 'One key metric tied to input drivers and company initiatives',
    icon: '⭐',
    build: () => {
      const root   = node('root',   'North Star Framework',      null,     0)
      const nsm    = node('nsm',    'North Star Metric',         'root',   1, { issueType: 'epic', color: 'yellow' })
      const inputs = node('inputs', 'Input Metrics',             'root',   1, { issueType: 'epic', color: 'blue'   })
      const init   = node('init',   'Initiatives',               'root',   1, { issueType: 'epic', color: 'green'  })
      const anti   = node('anti',   'Anti-metrics (watch out)',  'root',   1, { issueType: 'epic', color: 'red'    })
      const rev    = node('rev',    'Weekly Review',             'root',   1, { issueType: 'epic', color: 'purple' })
      // NSM
      const n1 = node('n1', 'Metric name — e.g. Weekly Active Maps',    'nsm', 2, { issueType: 'task', status: 'in-progress', storyPoints: 0 })
      const n2 = node('n2', 'Current value — baseline',                 'nsm', 2, { issueType: 'task', status: 'done',        storyPoints: 0 })
      const n3 = node('n3', 'Target — 90-day goal',                     'nsm', 2, { issueType: 'task', status: 'todo',        storyPoints: 0 })
      // Inputs
      const i1 = node('i1', 'Acquisition — new signups / week',         'inputs', 2, { issueType: 'task', status: 'done', storyPoints: 0 })
      const i2 = node('i2', 'Activation — users who create first map',  'inputs', 2, { issueType: 'task', status: 'done', storyPoints: 0 })
      const i3 = node('i3', 'Retention — maps opened in last 7 days',   'inputs', 2, { issueType: 'task', status: 'todo', storyPoints: 0 })
      const i4 = node('i4', 'Expansion — collab invites sent',          'inputs', 2, { issueType: 'task', status: 'todo', storyPoints: 0 })
      // Initiatives
      const in1 = node('in1', 'Onboarding redesign → ↑ activation',     'init', 2, { issueType: 'story', status: 'in-progress', storyPoints: 8 })
      const in2 = node('in2', 'Weekly digest email → ↑ retention',      'init', 2, { issueType: 'story', status: 'todo',        storyPoints: 5 })
      const in3 = node('in3', 'Referral program → ↑ acquisition',       'init', 2, { issueType: 'story', status: 'todo',        storyPoints: 5 })
      // Anti-metrics
      const a1 = node('a1', 'Support tickets — should not spike',        'anti', 2, { issueType: 'task', status: 'todo', storyPoints: 0 })
      const a2 = node('a2', 'Time-to-value — should not grow',           'anti', 2, { issueType: 'task', status: 'todo', storyPoints: 0 })
      // Review
      const r1 = node('r1', 'Last week result',   'rev', 2, { issueType: 'task', status: 'done', storyPoints: 0 })
      const r2 = node('r2', 'Delta vs target',    'rev', 2, { issueType: 'task', status: 'done', storyPoints: 0 })
      const r3 = node('r3', 'Key lever to pull',  'rev', 2, { issueType: 'task', status: 'todo', storyPoints: 0 })
      root.childIds   = ['nsm', 'inputs', 'init', 'anti', 'rev']
      nsm.childIds    = ['n1', 'n2', 'n3']
      inputs.childIds = ['i1', 'i2', 'i3', 'i4']
      init.childIds   = ['in1', 'in2', 'in3']
      anti.childIds   = ['a1', 'a2']
      rev.childIds    = ['r1', 'r2', 'r3']
      return { nodes: { root, nsm, inputs, init, anti, rev, n1, n2, n3, i1, i2, i3, i4, in1, in2, in3, a1, a2, r1, r2, r3 }, rootId: 'root' }
    },
  },

  // ── PERSONAL (continued) ─────────────────────────────────────────────────────
  {
    id: 'weekly-review', category: 'personal',
    name: 'Weekly Review',
    description: 'Wins, open loops, priorities, and energy check for a GTD-style review',
    icon: '🗓️',
    build: () => {
      const root  = node('root',  'Weekly Review',          null,   0)
      const wins  = node('wins',  'Wins this week',         'root', 1, { issueType: 'epic', color: 'green'  })
      const open  = node('open',  'Open loops to close',   'root', 1, { issueType: 'epic', color: 'red'    })
      const next  = node('next',  'Top 3 priorities',       'root', 1, { issueType: 'epic', color: 'blue'   })
      const learn = node('learn', 'What I learned',         'root', 1, { issueType: 'epic', color: 'yellow' })
      const feel  = node('feel',  'Energy & mood check',    'root', 1, { issueType: 'epic', color: 'purple' })
      const habit = node('habit', 'Habit tracker',          'root', 1, { issueType: 'epic', color: 'green'  })
      // Wins
      const w1 = node('w1', 'Win 1 — shipped X',    'wins', 2, { issueType: 'task', status: 'done', storyPoints: 0 })
      const w2 = node('w2', 'Win 2 — finished Y',   'wins', 2, { issueType: 'task', status: 'done', storyPoints: 0 })
      const w3 = node('w3', 'Win 3 — learned Z',    'wins', 2, { issueType: 'task', status: 'done', storyPoints: 0 })
      // Open loops
      const o1 = node('o1', 'Reply to email from A',       'open', 2, { issueType: 'task', status: 'todo', storyPoints: 1 })
      const o2 = node('o2', 'Follow up on proposal',       'open', 2, { issueType: 'task', status: 'todo', storyPoints: 1 })
      const o3 = node('o3', 'Review pull request #42',     'open', 2, { issueType: 'task', status: 'todo', storyPoints: 1 })
      // Priorities
      const n1 = node('n1', 'Priority 1 — most important', 'next', 2, { issueType: 'story', status: 'todo', storyPoints: 5 })
      const n2 = node('n2', 'Priority 2',                  'next', 2, { issueType: 'story', status: 'todo', storyPoints: 3 })
      const n3 = node('n3', 'Priority 3',                  'next', 2, { issueType: 'story', status: 'todo', storyPoints: 2 })
      // Learned
      const le1 = node('le1', 'Insight or lesson',         'learn', 2, { issueType: 'task', status: 'done', storyPoints: 0 })
      const le2 = node('le2', 'Book / article takeaway',   'learn', 2, { issueType: 'task', status: 'done', storyPoints: 0 })
      // Energy
      const e1 = node('e1', 'Energy level 1–10',           'feel', 2, { issueType: 'task', status: 'done', storyPoints: 0 })
      const e2 = node('e2', 'What drained energy',         'feel', 2, { issueType: 'task', status: 'todo', storyPoints: 0 })
      const e3 = node('e3', 'What gave energy',            'feel', 2, { issueType: 'task', status: 'todo', storyPoints: 0 })
      // Habits
      const h1 = node('h1', 'Exercise — 4× this week?',   'habit', 2, { issueType: 'task', status: 'done', storyPoints: 0 })
      const h2 = node('h2', 'Reading — 30 min / day?',    'habit', 2, { issueType: 'task', status: 'in-progress', storyPoints: 0 })
      const h3 = node('h3', 'Deep work — 2h blocks?',     'habit', 2, { issueType: 'task', status: 'todo', storyPoints: 0 })
      root.childIds  = ['wins', 'open', 'next', 'learn', 'feel', 'habit']
      wins.childIds  = ['w1', 'w2', 'w3']
      open.childIds  = ['o1', 'o2', 'o3']
      next.childIds  = ['n1', 'n2', 'n3']
      learn.childIds = ['le1', 'le2']
      feel.childIds  = ['e1', 'e2', 'e3']
      habit.childIds = ['h1', 'h2', 'h3']
      return { nodes: { root, wins, open, next, learn, feel, habit, w1, w2, w3, o1, o2, o3, n1, n2, n3, le1, le2, e1, e2, e3, h1, h2, h3 }, rootId: 'root' }
    },
  },

  // ── STARTUP (continued) ──────────────────────────────────────────────────────
  {
    id: 'budget-runway', category: 'startup',
    name: 'Budget & Runway Planner',
    description: 'Monthly burn, revenue, headcount costs, and runway calculation',
    icon: '🛫',
    build: () => {
      const root    = node('root',    'Budget & Runway',       null,   0)
      const runway  = node('runway',  'Runway Summary',        'root', 1, { issueType: 'epic', color: 'green'  })
      const revenue = node('revenue', 'Revenue',               'root', 1, { issueType: 'epic', color: 'green'  })
      const burn    = node('burn',    'Monthly Burn',          'root', 1, { issueType: 'epic', color: 'red'    })
      const head    = node('head',    'Headcount Costs',       'root', 1, { issueType: 'epic', color: 'yellow' })
      const infra   = node('infra',   'Infra & Tooling',       'root', 1, { issueType: 'epic', color: 'blue'   })
      const fund    = node('fund',    'Funding',               'root', 1, { issueType: 'epic', color: 'purple' })
      // Runway
      const rw1 = node('rw1', 'Cash in bank — $XXX k',          'runway', 2, { issueType: 'task', status: 'done',        storyPoints: 0 })
      const rw2 = node('rw2', 'Net burn / month — $XXX k',      'runway', 2, { issueType: 'task', status: 'done',        storyPoints: 0 })
      const rw3 = node('rw3', 'Months runway — calc here',      'runway', 2, { issueType: 'task', status: 'in-progress', storyPoints: 0 })
      const rw4 = node('rw4', 'Default alive date — if revenue grows', 'runway', 2, { issueType: 'task', status: 'todo', storyPoints: 0 })
      // Revenue
      const re1 = node('re1', 'MRR — current',           'revenue', 2, { issueType: 'task', status: 'done', storyPoints: 0 })
      const re2 = node('re2', 'New MRR — this month',    'revenue', 2, { issueType: 'task', status: 'done', storyPoints: 0 })
      const re3 = node('re3', 'Churned MRR',             'revenue', 2, { issueType: 'task', status: 'done', storyPoints: 0 })
      const re4 = node('re4', 'Revenue target — 90 days','revenue', 2, { issueType: 'task', status: 'todo', storyPoints: 0 })
      // Burn
      const b1 = node('b1', 'Gross burn — all outflows',  'burn', 2, { issueType: 'task', status: 'done', storyPoints: 0 })
      const b2 = node('b2', 'Net burn — gross minus rev', 'burn', 2, { issueType: 'task', status: 'done', storyPoints: 0 })
      const b3 = node('b3', 'Burn multiple — track trend','burn', 2, { issueType: 'task', status: 'todo', storyPoints: 0 })
      // Headcount
      const hc1 = node('hc1', 'Engineering — N people × $XXX', 'head', 2, { issueType: 'task', status: 'done', storyPoints: 0 })
      const hc2 = node('hc2', 'Design — N people × $XXX',     'head', 2, { issueType: 'task', status: 'done', storyPoints: 0 })
      const hc3 = node('hc3', 'Sales & marketing',             'head', 2, { issueType: 'task', status: 'done', storyPoints: 0 })
      const hc4 = node('hc4', 'Next hire — role & timing',     'head', 2, { issueType: 'task', status: 'todo', storyPoints: 0 })
      // Infra
      const in1 = node('in1', 'Cloud hosting (AWS/GCP)',  'infra', 2, { issueType: 'task', status: 'done', storyPoints: 0 })
      const in2 = node('in2', 'SaaS tools — list here',  'infra', 2, { issueType: 'task', status: 'done', storyPoints: 0 })
      const in3 = node('in3', 'Contractors & freelance',  'infra', 2, { issueType: 'task', status: 'done', storyPoints: 0 })
      // Funding
      const fu1 = node('fu1', 'Raised to date',           'fund', 2, { issueType: 'task', status: 'done', storyPoints: 0 })
      const fu2 = node('fu2', 'Next round target & size', 'fund', 2, { issueType: 'task', status: 'todo', storyPoints: 0 })
      const fu3 = node('fu3', 'Bridge milestones to hit', 'fund', 2, { issueType: 'task', status: 'todo', storyPoints: 0 })
      root.childIds   = ['runway', 'revenue', 'burn', 'head', 'infra', 'fund']
      runway.childIds = ['rw1', 'rw2', 'rw3', 'rw4']
      revenue.childIds = ['re1', 're2', 're3', 're4']
      burn.childIds   = ['b1', 'b2', 'b3']
      head.childIds   = ['hc1', 'hc2', 'hc3', 'hc4']
      infra.childIds  = ['in1', 'in2', 'in3']
      fund.childIds   = ['fu1', 'fu2', 'fu3']
      return { nodes: { root, runway, revenue, burn, head, infra, fund, rw1, rw2, rw3, rw4, re1, re2, re3, re4, b1, b2, b3, hc1, hc2, hc3, hc4, in1, in2, in3, fu1, fu2, fu3 }, rootId: 'root' }
    },
  },
]

// ─── count nodes in a template ───────────────────────────────────────────────
function countNodes(t) {
  try { return Object.keys(t.build().nodes).length } catch { return 0 }
}

// ─── dialog ──────────────────────────────────────────────────────────────────
export default function TemplatesDialog({ onSelect, onClose, mode = 'project' }) {
  const [activeCategory, setActiveCategory] = useState('all')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    return TEMPLATES.filter(t => {
      const matchCat = activeCategory === 'all' || t.category === activeCategory
      const q = query.toLowerCase()
      const matchQ = !q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
      return matchCat && matchQ
    })
  }, [activeCategory, query])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(9,30,66,0.54)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(2px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: 12,
          boxShadow: '0 20px 60px rgba(9,30,66,0.28), 0 0 0 1px rgba(9,30,66,0.08)',
          width: 820, maxHeight: '88vh', display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div style={{ padding: '20px 24px 0', borderBottom: '1px solid #F1F2F4' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#172B4D', margin: 0, letterSpacing: '-0.01em' }}>
                {mode === 'map' ? 'New Map from Template' : 'Project Templates'}
              </h2>
              <p style={{ fontSize: 12, color: '#8590A2', margin: '3px 0 0' }}>
                {mode === 'map'
                  ? 'Pick a template to add as a new mind map inside your project'
                  : 'Start from a ready-made structure — customise it to fit your project'}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{ background: '#F1F2F4', border: 'none', cursor: 'pointer', width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#626F86', fontSize: 16, flexShrink: 0 }}
              onMouseEnter={e => { e.currentTarget.style.background = '#E2E4EA' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#F1F2F4' }}
            >
              ×
            </button>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8590A2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              placeholder="Search templates…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '7px 10px 7px 30px', borderRadius: 6, fontSize: 13,
                border: '1.5px solid #DFE1E6', outline: 'none', color: '#172B4D',
                background: '#FAFBFC',
              }}
              onFocus={e => { e.target.style.borderColor = '#4C9AFF'; e.target.style.background = '#fff' }}
              onBlur={e => { e.target.style.borderColor = '#DFE1E6'; e.target.style.background = '#FAFBFC' }}
            />
          </div>

          {/* Category tabs */}
          <div style={{ display: 'flex', gap: 2, overflow: 'auto' }}>
            {[{ id: 'all', label: 'All', color: '#172B4D', bg: '#F1F2F4' }, ...Object.entries(CATS).map(([id, c]) => ({ id, label: c.label, color: c.color, bg: c.bg }))].map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: '6px 12px', borderRadius: '6px 6px 0 0', fontSize: 12, fontWeight: 500,
                  border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                  color: activeCategory === cat.id ? cat.color : '#626F86',
                  background: activeCategory === cat.id ? cat.bg : 'transparent',
                  borderBottom: activeCategory === cat.id ? `2px solid ${cat.color}` : '2px solid transparent',
                  marginBottom: -1,
                }}
                onMouseEnter={e => { if (activeCategory !== cat.id) e.currentTarget.style.background = '#F1F2F4' }}
                onMouseLeave={e => { if (activeCategory !== cat.id) e.currentTarget.style.background = 'transparent' }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Grid ── */}
        <div style={{ padding: '16px 20px 20px', overflowY: 'auto', flex: 1 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#8590A2' }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>🔍</div>
              <p style={{ fontSize: 13, margin: 0 }}>No templates match "{query}"</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {filtered.map(t => {
                const cat = CATS[t.category]
                const nodeCount = countNodes(t)
                return (
                  <TemplateCard
                    key={t.id}
                    template={t}
                    cat={cat}
                    nodeCount={nodeCount}
                    onSelect={onSelect}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ padding: '10px 20px', borderTop: '1px solid #F1F2F4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: '#8590A2' }}>
            {filtered.length} template{filtered.length !== 1 ? 's' : ''} · Click any card to load it onto the canvas
          </span>
          <button
            onClick={onClose}
            style={{ padding: '5px 14px', borderRadius: 5, fontSize: 12, fontWeight: 500, background: '#F1F2F4', border: 'none', cursor: 'pointer', color: '#626F86' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#E2E4EA' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F1F2F4' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── template card ────────────────────────────────────────────────────────────
function TemplateCard({ template: t, cat, nodeCount, onSelect }) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={() => onSelect(t)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        textAlign: 'left', padding: '14px 16px 14px',
        borderRadius: 8,
        border: hovered ? `1.5px solid ${cat.color}` : '1.5px solid #E8EAED',
        background: hovered ? cat.bg : '#FAFBFC',
        cursor: 'pointer',
        transition: 'border-color 0.12s, background 0.12s, box-shadow 0.12s',
        boxShadow: hovered ? `0 4px 14px rgba(0,0,0,0.08)` : '0 1px 3px rgba(0,0,0,0.04)',
        transform: hovered ? 'translateY(-1px)' : 'none',
        display: 'flex', flexDirection: 'column', gap: 0,
      }}
    >
      {/* Top row: icon + badges */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 22 }}>{t.icon}</span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {t.popular && (
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 3,
              background: '#FFF0B3', color: '#172B4D', letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>
              Popular
            </span>
          )}
          <span style={{
            fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 3,
            background: cat.bg, color: cat.color,
          }}>
            {cat.label}
          </span>
        </div>
      </div>

      {/* Name */}
      <div style={{ fontSize: 13, fontWeight: 700, color: hovered ? cat.color : '#172B4D', marginBottom: 4, lineHeight: 1.3 }}>
        {t.name}
      </div>

      {/* Description */}
      <div style={{ fontSize: 11, color: '#626F86', lineHeight: 1.5, flex: 1 }}>
        {t.description}
      </div>

      {/* Node count */}
      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={hovered ? cat.color : '#8590A2'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><line x1="14" y1="10" x2="17.5" y2="6.5"/><line x1="6.5" y1="17.5" x2="10" y2="14"/>
        </svg>
        <span style={{ fontSize: 10, color: hovered ? cat.color : '#8590A2', fontWeight: 500 }}>
          {nodeCount} nodes
        </span>
      </div>
    </button>
  )
}
