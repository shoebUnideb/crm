// Built-in page templates — each has a title and pre-filled Tiptap JSON content.

function h2(text) {
  return { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text }] }
}
function h3(text) {
  return { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text }] }
}
function p(text = '') {
  if (!text) return { type: 'paragraph' }
  return { type: 'paragraph', content: [{ type: 'text', text }] }
}
function pbold(label, value = '') {
  return {
    type: 'paragraph',
    content: [
      { type: 'text', marks: [{ type: 'bold' }], text: label + ' ' },
      ...(value ? [{ type: 'text', text: value }] : []),
    ],
  }
}
function hr() { return { type: 'horizontalRule' } }
function ul(...items) {
  return {
    type: 'bulletList',
    content: items.map(t => ({ type: 'listItem', content: [p(t)] })),
  }
}
function ol(...items) {
  return {
    type: 'orderedList',
    content: items.map(t => ({ type: 'listItem', content: [p(t)] })),
  }
}
function tasks(...items) {
  return {
    type: 'taskList',
    content: items.map(t => ({
      type: 'taskItem',
      attrs: { checked: false },
      content: [p(t)],
    })),
  }
}
function blockquote(text) {
  return { type: 'blockquote', content: [p(text)] }
}
function tableRow(cells, isHeader = false) {
  return {
    type: 'tableRow',
    content: cells.map(cell => ({
      type: isHeader ? 'tableHeader' : 'tableCell',
      attrs: {},
      content: [typeof cell === 'string'
        ? (isHeader
          ? { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: cell }] }
          : p(cell))
        : cell],
    })),
  }
}
function table(headers, rows) {
  return {
    type: 'table',
    content: [
      tableRow(headers, true),
      ...rows.map(r => tableRow(r)),
    ],
  }
}

const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

export const TEMPLATES = [
  // ── Blank ──────────────────────────────────────────────────────────────────
  {
    id: 'blank',
    label: 'Blank page',
    description: 'Start from scratch',
    icon: '📄',
    title: 'Untitled',
    content: {},
  },

  // ── Meeting Notes ──────────────────────────────────────────────────────────
  {
    id: 'meeting-notes',
    label: 'Meeting Notes',
    description: 'Agenda, attendees & action items',
    icon: '📋',
    title: 'Meeting Notes',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Date', today],
            ['Facilitator', ''],
            ['Location / Link', ''],
            ['Duration', ''],
            ['Status', 'Scheduled / In Progress / Done'],
          ]
        ),
        hr(),
        h2('Attendees'),
        ul('', '', ''),
        hr(),
        h2('Agenda'),
        ol('', '', ''),
        hr(),
        h2('Discussion notes'),
        p(),
        hr(),
        h2('Action items'),
        table(
          ['Task', 'Owner', 'Due date'],
          [['', '', ''], ['', '', ''], ['', '', '']]
        ),
        hr(),
        h2('Decisions made'),
        ul(''),
        hr(),
        h2('Next meeting'),
        pbold('Date:'),
        pbold('Topics:'),
      ],
    },
  },

  // ── Project Plan ──────────────────────────────────────────────────────────
  {
    id: 'project-plan',
    label: 'Project Plan',
    description: 'Goals, timeline & milestones',
    icon: '🗺️',
    title: 'Project Plan',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Project name', ''],
            ['Owner', ''],
            ['Start date', today],
            ['Target date', ''],
            ['Status', 'Not started / In progress / At risk / Done'],
            ['Priority', 'High / Medium / Low'],
          ]
        ),
        hr(),
        h2('Background & context'),
        blockquote('Why are we doing this? What problem does it solve?'),
        p(),
        hr(),
        h2('Goals'),
        ul('', ''),
        h2('Non-goals'),
        ul('', ''),
        hr(),
        h2('Milestones'),
        table(
          ['Milestone', 'Owner', 'Target date', 'Status'],
          [
            ['Kickoff', '', '', ''],
            ['Design complete', '', '', ''],
            ['Build complete', '', '', ''],
            ['Launch', '', '', ''],
          ]
        ),
        hr(),
        h2('Risks & mitigations'),
        table(
          ['Risk', 'Likelihood', 'Impact', 'Mitigation'],
          [['', 'High / Med / Low', 'High / Med / Low', ''], ['', '', '', '']]
        ),
        hr(),
        h2('Open questions'),
        tasks('', ''),
      ],
    },
  },

  // ── PRD ───────────────────────────────────────────────────────────────────
  {
    id: 'prd',
    label: 'Product Requirements',
    description: 'Problem, solution & requirements',
    icon: '🧩',
    title: 'PRD: ',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Driver', '@ mention the driver'],
            ['Approver', '@ approver'],
            ['Contributors', '@ contributors'],
            ['Informed', '@ stakeholders'],
            ['Objective', 'Summarize the objective in 1–2 sentences'],
            ['Target date', ''],
            ['Status', 'Draft / In Review / Approved / Shipped'],
          ]
        ),
        hr(),
        h2('🤔 Problem statement'),
        blockquote('What problem are we solving? Who is affected and how severely? What is the cost of not solving it?'),
        p(),
        hr(),
        h2('✅ Goals'),
        h3('Business goals'),
        ul('', ''),
        h3('User goals'),
        ul('', ''),
        h3('Non-goals'),
        ul('', ''),
        hr(),
        h2('👥 User stories'),
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [{
                type: 'paragraph',
                content: [
                  { type: 'text', text: 'As a ' },
                  { type: 'text', marks: [{ type: 'italic' }], text: '[type of user]' },
                  { type: 'text', text: ', I want to ' },
                  { type: 'text', marks: [{ type: 'italic' }], text: '[action]' },
                  { type: 'text', text: ' so that ' },
                  { type: 'text', marks: [{ type: 'italic' }], text: '[benefit]' },
                  { type: 'text', text: '.' },
                ],
              }],
            },
            { type: 'listItem', content: [p()] },
          ],
        },
        hr(),
        h2('📋 Requirements'),
        h3('Functional'),
        ol('', '', ''),
        h3('Non-functional'),
        ol('', ''),
        hr(),
        h2('🚫 Out of scope'),
        ul('', ''),
        hr(),
        h2('📐 Design & spec'),
        blockquote('Link to Figma, wireframes, or describe the solution here'),
        p(),
        hr(),
        h2('📊 Success metrics'),
        table(
          ['Metric', 'Current baseline', 'Target'],
          [['', '', ''], ['', '', '']]
        ),
        hr(),
        h2('🔗 Dependencies'),
        ul('', ''),
        hr(),
        h2('❓ Open questions'),
        tasks('', ''),
      ],
    },
  },

  // ── Decision Log ──────────────────────────────────────────────────────────
  {
    id: 'decision-log',
    label: 'Decision Log',
    description: 'Record key decisions & rationale',
    icon: '⚖️',
    title: 'Decision: ',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Status', 'Proposed / Approved / Rejected / Superseded'],
            ['Decision maker', ''],
            ['Stakeholders', ''],
            ['Date', today],
            ['Review date', ''],
          ]
        ),
        hr(),
        h2('Context'),
        blockquote('What situation requires a decision? What constraints exist?'),
        p(),
        hr(),
        h2('Options considered'),
        table(
          ['Option', 'Pros', 'Cons'],
          [
            ['Option A: ', '', ''],
            ['Option B: ', '', ''],
            ['Option C: ', '', ''],
          ]
        ),
        hr(),
        h2('Decision & rationale'),
        p(),
        hr(),
        h2('Consequences'),
        h3('Positive'),
        ul(''),
        h3('Negative / trade-offs'),
        ul(''),
        hr(),
        h2('Action items'),
        tasks('', ''),
      ],
    },
  },

  // ── Sprint Retro ──────────────────────────────────────────────────────────
  {
    id: 'sprint-retro',
    label: 'Sprint Retro',
    description: 'What went well, what to improve',
    icon: '🔄',
    title: 'Sprint Retrospective',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Sprint', ''],
            ['Team', ''],
            ['Date', today],
            ['Velocity', ''],
            ['Bugs closed', ''],
            ['Carry-over', ''],
          ]
        ),
        hr(),
        h2('✅ What went well'),
        ul('', '', ''),
        hr(),
        h2('❌ What didn\'t go well'),
        ul('', '', ''),
        hr(),
        h2('💡 Experiments for next sprint'),
        tasks('', '', ''),
        hr(),
        h2('🎉 Shoutouts'),
        ul(''),
      ],
    },
  },

  // ── How-to / SOP ──────────────────────────────────────────────────────────
  {
    id: 'how-to',
    label: 'How-to Guide',
    description: 'Step-by-step instructions',
    icon: '📖',
    title: 'How to: ',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Audience', ''],
            ['Time to complete', ''],
            ['Last updated', today],
            ['Owner', ''],
          ]
        ),
        blockquote('One sentence: what does this guide help you do?'),
        hr(),
        h2('Prerequisites'),
        ul('', ''),
        hr(),
        h2('Steps'),
        h3('Step 1 — '),
        p(),
        h3('Step 2 — '),
        p(),
        h3('Step 3 — '),
        p(),
        hr(),
        h2('Verification'),
        p('How do you know it worked?'),
        tasks('', ''),
        hr(),
        h2('Troubleshooting'),
        table(
          ['Problem', 'Solution'],
          [['', ''], ['', '']]
        ),
        hr(),
        h2('Related docs'),
        ul(''),
      ],
    },
  },

  // ── OKRs ──────────────────────────────────────────────────────────────────
  {
    id: 'okrs',
    label: 'OKRs',
    description: 'Objectives & key results',
    icon: '🎯',
    title: 'OKRs — Q',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Period', ''],
            ['Team / Owner', ''],
            ['Last updated', today],
            ['Overall progress', '0%'],
          ]
        ),
        hr(),
        h2('Objective 1 — '),
        blockquote('State the aspirational goal in plain language'),
        table(
          ['Key result', 'Baseline', 'Target', 'Current', 'Progress'],
          [
            ['KR1: ', '', '', '', ''],
            ['KR2: ', '', '', '', ''],
            ['KR3: ', '', '', '', ''],
          ]
        ),
        hr(),
        h2('Objective 2 — '),
        blockquote('State the aspirational goal in plain language'),
        table(
          ['Key result', 'Baseline', 'Target', 'Current', 'Progress'],
          [
            ['KR1: ', '', '', '', ''],
            ['KR2: ', '', '', '', ''],
          ]
        ),
        hr(),
        h2('Initiatives'),
        tasks('', '', ''),
        hr(),
        h2('End-of-quarter review'),
        h3('What we achieved'),
        ul(''),
        h3('What we missed & why'),
        ul(''),
        h3('Learnings for next quarter'),
        ul(''),
      ],
    },
  },

  // ── Investor Update ────────────────────────────────────────────────────────
  {
    id: 'investor-update',
    label: 'Investor Update',
    description: 'Monthly / quarterly investor memo',
    icon: '📈',
    title: 'Investor Update — ',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Period', ''],
            ['Date sent', today],
            ['Prepared by', ''],
          ]
        ),
        hr(),
        h2('📊 Key metrics'),
        table(
          ['Metric', 'This period', 'Last period', 'Change'],
          [
            ['MRR / ARR', '', '', ''],
            ['Active users', '', '', ''],
            ['Customer count', '', '', ''],
            ['Churn rate', '', '', ''],
            ['Burn rate', '', '', ''],
            ['Runway', '', '', ''],
          ]
        ),
        hr(),
        h2('🏆 Highlights'),
        blockquote('Top 3 wins this period'),
        ul('', '', ''),
        hr(),
        h2('⚠️ Lowlights & challenges'),
        ul('', ''),
        hr(),
        h2('🔭 Focus for next period'),
        ol('', '', ''),
        hr(),
        h2('🙏 Asks'),
        ul('', ''),
        hr(),
        h2('💰 Financials'),
        table(
          ['Line item', 'Budget', 'Actual', 'Variance'],
          [
            ['Revenue', '', '', ''],
            ['COGS', '', '', ''],
            ['Gross margin', '', '', ''],
            ['OpEx', '', '', ''],
            ['Net burn', '', '', ''],
          ]
        ),
      ],
    },
  },

  // ── Pitch Deck Outline ─────────────────────────────────────────────────────
  {
    id: 'pitch-deck',
    label: 'Pitch Deck Outline',
    description: 'Seed / Series A narrative structure',
    icon: '🚀',
    title: 'Pitch Deck — ',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Company', ''],
            ['Stage', 'Pre-seed / Seed / Series A'],
            ['Ask', ''],
            ['Valuation', ''],
            ['Date', today],
          ]
        ),
        hr(),
        h2('1 — Problem'),
        blockquote('What painful, important problem exists? Who experiences it? How often?'),
        p(),
        hr(),
        h2('2 — Solution'),
        blockquote('What does your product do? Why is it uniquely well-suited to solve the problem?'),
        p(),
        hr(),
        h2('3 — Market size'),
        table(
          ['Market', 'Size', 'Source'],
          [
            ['TAM (Total Addressable)', '', ''],
            ['SAM (Serviceable Addressable)', '', ''],
            ['SOM (Serviceable Obtainable)', '', ''],
          ]
        ),
        hr(),
        h2('4 — Product'),
        ul('Key feature 1 — ', 'Key feature 2 — ', 'Key feature 3 — '),
        p('Demo / screenshot link: '),
        hr(),
        h2('5 — Traction'),
        table(
          ['Metric', 'Value'],
          [['MRR', ''], ['Users', ''], ['Key customers', ''], ['Growth rate', '']]
        ),
        hr(),
        h2('6 — Business model'),
        pbold('Pricing:', ''),
        pbold('Unit economics:', ''),
        pbold('LTV / CAC:', ''),
        hr(),
        h2('7 — Competition'),
        table(
          ['Competitor', 'Their strength', 'Our advantage'],
          [['', '', ''], ['', '', ''], ['', '', '']]
        ),
        hr(),
        h2('8 — Team'),
        table(
          ['Name', 'Role', 'Background'],
          [['', '', ''], ['', '', ''], ['', '', '']]
        ),
        hr(),
        h2('9 — Financials & use of funds'),
        table(
          ['Category', 'Allocation', 'Expected outcome'],
          [['Engineering', '', ''], ['Sales & marketing', '', ''], ['Operations', '', '']]
        ),
        hr(),
        h2('10 — Ask'),
        pbold('Raising:', ''),
        pbold('Milestones this will fund:', ''),
        pbold('Next round trigger:', ''),
      ],
    },
  },

  // ── User Interview ─────────────────────────────────────────────────────────
  {
    id: 'user-interview',
    label: 'User Interview',
    description: 'Customer discovery notes',
    icon: '🗣️',
    title: 'User Interview — ',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Interviewee', ''],
            ['Role / Company', ''],
            ['Date', today],
            ['Interviewer', ''],
            ['Method', 'Video / In-person / Phone'],
            ['Customer segment', ''],
          ]
        ),
        hr(),
        h2('🎯 Research goals'),
        ul('', ''),
        hr(),
        h2('📝 Raw notes'),
        h3('Background & context'),
        p(),
        h3('Pain points & frustrations'),
        ul('', '', ''),
        h3('Current solutions / workarounds'),
        ul('', ''),
        h3('Key quotes'),
        blockquote(''),
        blockquote(''),
        hr(),
        h2('🔍 Insights'),
        ul('', ''),
        hr(),
        h2('✅ Follow-up actions'),
        tasks('', ''),
      ],
    },
  },

  // ── Competitive Analysis ───────────────────────────────────────────────────
  {
    id: 'competitive-analysis',
    label: 'Competitive Analysis',
    description: 'Market landscape & positioning',
    icon: '🔎',
    title: 'Competitive Analysis',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Prepared by', ''],
            ['Date', today],
            ['Market segment', ''],
          ]
        ),
        hr(),
        h2('🗺️ Market landscape'),
        blockquote('Describe the competitive space in 2–3 sentences'),
        p(),
        hr(),
        h2('🏆 Competitor profiles'),
        table(
          ['Competitor', 'Founded', 'Funding', 'Key strength', 'Key weakness', 'Pricing'],
          [
            ['', '', '', '', '', ''],
            ['', '', '', '', '', ''],
            ['', '', '', '', '', ''],
            ['', '', '', '', '', ''],
          ]
        ),
        hr(),
        h2('📊 Feature comparison'),
        table(
          ['Feature', 'Us', 'Competitor A', 'Competitor B', 'Competitor C'],
          [
            ['', '', '', '', ''],
            ['', '', '', '', ''],
            ['', '', '', '', ''],
            ['', '', '', '', ''],
            ['', '', '', '', ''],
          ]
        ),
        hr(),
        h2('🎯 Our positioning'),
        pbold('We are:', ''),
        pbold('For:', ''),
        pbold('Who:', ''),
        pbold('Unlike:', ''),
        p(),
        hr(),
        h2('⚡ Our unfair advantages'),
        ul('', '', ''),
        hr(),
        h2('⚠️ Competitive risks'),
        ul('', ''),
      ],
    },
  },

  // ── Go-to-Market Plan ──────────────────────────────────────────────────────
  {
    id: 'gtm-plan',
    label: 'Go-to-Market Plan',
    description: 'Launch strategy & channels',
    icon: '📣',
    title: 'GTM Plan — ',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Product / feature', ''],
            ['Launch date', ''],
            ['Owner', ''],
            ['Status', 'Planning / Active / Complete'],
          ]
        ),
        hr(),
        h2('🎯 Target customer'),
        pbold('Ideal customer profile:', ''),
        pbold('Persona:', ''),
        pbold('Problem we solve:', ''),
        hr(),
        h2('💬 Messaging'),
        pbold('Tagline:', ''),
        pbold('Value proposition:', ''),
        pbold('Elevator pitch:', ''),
        hr(),
        h2('📡 Channels & tactics'),
        table(
          ['Channel', 'Tactic', 'Owner', 'Budget', 'Expected reach'],
          [
            ['Content / SEO', '', '', '', ''],
            ['Paid ads', '', '', '', ''],
            ['Email', '', '', '', ''],
            ['Community', '', '', '', ''],
            ['Partnerships', '', '', '', ''],
            ['PR / Press', '', '', '', ''],
          ]
        ),
        hr(),
        h2('📊 Success metrics'),
        table(
          ['Metric', 'Baseline', '30-day target', '90-day target'],
          [['', '', '', ''], ['', '', '', ''], ['', '', '', '']]
        ),
        hr(),
        h2('📋 Launch checklist'),
        tasks('Landing page live', 'Docs / help center updated', 'Email sequence ready', 'Social posts scheduled', 'Sales team briefed', 'Support team briefed', ''),
      ],
    },
  },

  // ── Job Description ────────────────────────────────────────────────────────
  {
    id: 'job-description',
    label: 'Job Description',
    description: 'Role spec for hiring',
    icon: '💼',
    title: 'Job Description — ',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Role', ''],
            ['Team', ''],
            ['Level', 'IC1 / IC2 / Senior / Staff / Manager'],
            ['Location', 'Remote / Hybrid / On-site'],
            ['Hiring manager', ''],
            ['Target start', ''],
          ]
        ),
        hr(),
        h2('About us'),
        p(),
        hr(),
        h2('About the role'),
        blockquote('2–3 sentences on why this role exists and what success looks like'),
        p(),
        hr(),
        h2('What you\'ll do'),
        ul('', '', '', '', ''),
        hr(),
        h2('What we\'re looking for'),
        h3('Must have'),
        ul('', '', ''),
        h3('Nice to have'),
        ul('', ''),
        hr(),
        h2('What we offer'),
        ul('Competitive salary & equity', 'Health, dental & vision', 'Flexible / remote work', ''),
        hr(),
        h2('Interview process'),
        ol('Recruiter screen (30 min)', 'Hiring manager interview (45 min)', 'Technical / skills assessment', 'Team interviews (2–3)', 'Offer'),
      ],
    },
  },

  // ── Onboarding Plan ────────────────────────────────────────────────────────
  {
    id: 'onboarding-plan',
    label: 'Onboarding Plan',
    description: 'New hire 30-60-90 day plan',
    icon: '👋',
    title: 'Onboarding Plan — ',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['New hire', ''],
            ['Role', ''],
            ['Manager', ''],
            ['Start date', today],
            ['Buddy / mentor', ''],
          ]
        ),
        hr(),
        h2('Before day 1'),
        tasks('Send welcome email with logistics', 'Set up accounts & access', 'Ship laptop / equipment', 'Schedule first-week 1:1s', 'Share onboarding docs'),
        hr(),
        h2('Day 1 — Welcome'),
        tasks('Office / virtual tour', 'Meet the team', 'HR paperwork', 'Set up dev environment / tools', 'Review company handbook'),
        hr(),
        h2('Week 1 goals'),
        ul('', '', ''),
        hr(),
        h2('30-day goals'),
        table(
          ['Goal', 'Success looks like', 'Support needed'],
          [['', '', ''], ['', '', ''], ['', '', '']]
        ),
        hr(),
        h2('60-day goals'),
        table(
          ['Goal', 'Success looks like', 'Support needed'],
          [['', '', ''], ['', '', '']]
        ),
        hr(),
        h2('90-day goals'),
        table(
          ['Goal', 'Success looks like', 'Support needed'],
          [['', '', ''], ['', '', '']]
        ),
        hr(),
        h2('Key people to meet'),
        table(
          ['Name', 'Role', 'Meeting scheduled'],
          [['', '', ''], ['', '', ''], ['', '', '']]
        ),
        hr(),
        h2('Resources & reading'),
        ul('', '', ''),
      ],
    },
  },

  // ── Post-mortem ────────────────────────────────────────────────────────────
  {
    id: 'postmortem',
    label: 'Post-mortem',
    description: 'Incident review & learnings',
    icon: '🔥',
    title: 'Post-mortem: ',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Incident title', ''],
            ['Date & time', ''],
            ['Duration', ''],
            ['Severity', 'P0 / P1 / P2 / P3'],
            ['Impact', ''],
            ['Lead investigator', ''],
            ['Status', 'In progress / Complete'],
          ]
        ),
        hr(),
        h2('📋 Executive summary'),
        blockquote('2–3 sentences: what happened, impact, and resolution'),
        p(),
        hr(),
        h2('⏱️ Timeline'),
        table(
          ['Time', 'Event'],
          [['', 'Incident begins'], ['', 'Detected'], ['', 'On-call alerted'], ['', 'Root cause identified'], ['', 'Mitigation applied'], ['', 'Resolved'], ['', 'Post-mortem opened']]
        ),
        hr(),
        h2('🔍 Root cause analysis'),
        h3('Immediate cause'),
        p(),
        h3('Contributing factors'),
        ul('', ''),
        h3('5 Whys'),
        ol('Why? —', 'Why? —', 'Why? —', 'Why? —', 'Why? —'),
        hr(),
        h2('💥 Impact'),
        pbold('Users affected:', ''),
        pbold('Revenue impact:', ''),
        pbold('SLA breach:', 'Yes / No'),
        hr(),
        h2('✅ What went well'),
        ul('', ''),
        hr(),
        h2('❌ What went wrong'),
        ul('', ''),
        hr(),
        h2('🛡️ Action items'),
        table(
          ['Action', 'Owner', 'Priority', 'Due date'],
          [['', '', 'P0', ''], ['', '', 'P1', ''], ['', '', 'P1', '']]
        ),
      ],
    },
  },

  // ── Fundraising Tracker ────────────────────────────────────────────────────
  {
    id: 'fundraising-tracker',
    label: 'Fundraising Tracker',
    description: 'VC & angel pipeline tracker',
    icon: '💰',
    title: 'Fundraising Round — ',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Round', 'Pre-seed / Seed / Series A'],
            ['Target raise', ''],
            ['Soft-circled', ''],
            ['Lead investor', ''],
            ['Process start', today],
            ['Target close', ''],
          ]
        ),
        hr(),
        h2('📊 Pipeline'),
        table(
          ['Investor', 'Fund', 'Stage', 'Lead', 'Ticket size', 'Last touchpoint', 'Next step', 'Notes'],
          [
            ['', '', 'Intro', '', '', '', '', ''],
            ['', '', 'Intro', '', '', '', '', ''],
            ['', '', 'Partner mtg', '', '', '', '', ''],
            ['', '', 'Term sheet', '', '', '', '', ''],
          ]
        ),
        hr(),
        h2('📝 Stage definitions'),
        table(
          ['Stage', 'Definition'],
          [
            ['Intro', 'First email / warm intro sent'],
            ['Screening', 'First call / meeting scheduled'],
            ['Partner mtg', 'Full partner meeting'],
            ['DD', 'Due diligence in progress'],
            ['Term sheet', 'Term sheet received'],
            ['Closed', 'Wire received'],
            ['Pass', 'Investor passed'],
          ]
        ),
        hr(),
        h2('🙋 Warm intro requests'),
        tasks('', '', ''),
        hr(),
        h2('📋 DD checklist'),
        tasks('Cap table', 'Financials (last 12 mo)', 'MRR / ARR data', 'Customer references', 'Legal docs', 'Team bios', 'Data room ready'),
      ],
    },
  },

  // ── Weekly Team Update ─────────────────────────────────────────────────────
  {
    id: 'weekly-update',
    label: 'Weekly Team Update',
    description: 'Async team status update',
    icon: '📅',
    title: 'Weekly Update — ',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Week of', today],
            ['Team', ''],
            ['Author', ''],
          ]
        ),
        hr(),
        h2('🏆 This week\'s wins'),
        ul('', '', ''),
        hr(),
        h2('🔨 In progress'),
        table(
          ['Item', 'Owner', 'Status', 'ETA'],
          [['', '', '🟡 In progress', ''], ['', '', '🟡 In progress', ''], ['', '', '🔴 Blocked', '']]
        ),
        hr(),
        h2('✅ Completed'),
        ul('', '', ''),
        hr(),
        h2('🚧 Blockers'),
        ul('', ''),
        hr(),
        h2('📅 Next week'),
        ol('', '', ''),
        hr(),
        h2('🔢 Metrics snapshot'),
        table(
          ['Metric', 'Value', 'vs last week'],
          [['', '', ''], ['', '', ''], ['', '', '']]
        ),
      ],
    },
  },

  // ── Board Meeting Prep ─────────────────────────────────────────────────────
  {
    id: 'board-meeting',
    label: 'Board Meeting Prep',
    description: 'Board deck & materials checklist',
    icon: '🏛️',
    title: 'Board Meeting — ',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Date', today],
            ['Duration', ''],
            ['Location / Link', ''],
            ['Board members', ''],
            ['Observers', ''],
            ['CEO', ''],
          ]
        ),
        hr(),
        h2('📋 Agenda'),
        table(
          ['Time', 'Topic', 'Presenter', 'Type'],
          [
            ['5 min', 'Approve prior minutes', 'Chair', 'Approval'],
            ['15 min', 'CEO overview & highlights', 'CEO', 'Update'],
            ['20 min', 'Financial review', 'CFO', 'Review'],
            ['20 min', 'Product & roadmap', 'CPO', 'Update'],
            ['15 min', 'People & org', 'CEO/COO', 'Update'],
            ['30 min', 'Key discussion topic', '', 'Discussion'],
            ['15 min', 'Votes & approvals', 'Chair', 'Vote'],
          ]
        ),
        hr(),
        h2('📊 Key metrics (QTD)'),
        table(
          ['Metric', 'This period', 'Plan', 'vs Plan'],
          [['ARR', '', '', ''], ['Burn', '', '', ''], ['Headcount', '', '', ''], ['Runway', '', '', '']]
        ),
        hr(),
        h2('🏆 Highlights & lowlights'),
        h3('Top 3 highlights'),
        ul('', '', ''),
        h3('Top 3 lowlights'),
        ul('', '', ''),
        hr(),
        h2('🗳️ Votes required'),
        table(
          ['Item', 'Type', 'Resolution'],
          [['', 'Board consent', ''], ['', 'Board vote', '']]
        ),
        hr(),
        h2('✅ Pre-meeting checklist'),
        tasks('Board materials sent 5 days prior', 'Financial package distributed', 'Prior meeting minutes approved', 'Legal updates prepared', 'Data room updated'),
      ],
    },
  },

  // ── Technical Spec / RFC ───────────────────────────────────────────────────
  {
    id: 'tech-spec',
    label: 'Technical Spec',
    description: 'RFC / design doc for engineers',
    icon: '⚙️',
    title: 'RFC: ',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Author', ''],
            ['Reviewers', ''],
            ['Date', today],
            ['Status', 'Draft / In review / Approved / Implemented'],
            ['Estimated effort', ''],
          ]
        ),
        hr(),
        h2('🤔 Problem'),
        blockquote('What technical problem are we solving? What breaks or degrades without this?'),
        p(),
        hr(),
        h2('🎯 Goals & non-goals'),
        h3('Goals'),
        ul('', ''),
        h3('Non-goals'),
        ul(''),
        hr(),
        h2('🔭 Proposed solution'),
        blockquote('High-level description of the solution'),
        p(),
        h3('System diagram'),
        p('(Paste diagram link or describe data flow)'),
        h3('API / interface changes'),
        p(),
        h3('Data model changes'),
        p(),
        hr(),
        h2('⚖️ Alternatives considered'),
        table(
          ['Alternative', 'Why rejected'],
          [['', ''], ['', '']]
        ),
        hr(),
        h2('🔒 Security & privacy'),
        ul('', ''),
        hr(),
        h2('📊 Performance & scalability'),
        ul('', ''),
        hr(),
        h2('🚀 Rollout plan'),
        ol('', '', ''),
        hr(),
        h2('❓ Open questions'),
        tasks('', ''),
      ],
    },
  },

  // ── A/B Test Plan ──────────────────────────────────────────────────────────
  {
    id: 'ab-test',
    label: 'A/B Test Plan',
    description: 'Experiment hypothesis & results',
    icon: '🧪',
    title: 'Experiment: ',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Experiment name', ''],
            ['Owner', ''],
            ['Start date', today],
            ['End date', ''],
            ['Status', 'Planned / Running / Analysing / Done'],
          ]
        ),
        hr(),
        h2('💡 Hypothesis'),
        blockquote('We believe that [change] will cause [outcome] because [reason]. We will know this is true when [metric] changes by [amount].'),
        p(),
        hr(),
        h2('🎯 Goal metric (primary)'),
        p(),
        h2('📊 Guardrail metrics'),
        ul('', ''),
        hr(),
        h2('🔬 Variants'),
        table(
          ['Variant', 'Description', 'Traffic split'],
          [['Control (A)', 'Current experience', '50%'], ['Treatment (B)', '', '50%']]
        ),
        hr(),
        h2('📐 Sample size & duration'),
        pbold('Required sample size:', ''),
        pbold('Minimum detectable effect:', ''),
        pbold('Confidence level:', '95%'),
        pbold('Estimated duration:', ''),
        hr(),
        h2('📈 Results'),
        table(
          ['Metric', 'Control', 'Treatment', 'Lift', 'P-value', 'Significant?'],
          [['', '', '', '', '', ''], ['', '', '', '', '', '']]
        ),
        hr(),
        h2('🏁 Conclusion & decision'),
        p(),
        hr(),
        h2('📋 Next steps'),
        tasks('', ''),
      ],
    },
  },

  // ── Sales Playbook ─────────────────────────────────────────────────────────
  {
    id: 'sales-playbook',
    label: 'Sales Playbook',
    description: 'ICP, process & objection handling',
    icon: '🎯',
    title: 'Sales Playbook',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Product / segment', ''],
            ['Owner', ''],
            ['Last updated', today],
          ]
        ),
        hr(),
        h2('🏹 Ideal customer profile (ICP)'),
        table(
          ['Dimension', 'Details'],
          [
            ['Company size', ''],
            ['Industry', ''],
            ['Geography', ''],
            ['Budget', ''],
            ['Tech stack', ''],
            ['Pain point', ''],
            ['Champion persona', ''],
            ['Economic buyer', ''],
          ]
        ),
        hr(),
        h2('📡 Lead sources & scoring'),
        table(
          ['Source', 'Volume', 'Quality', 'Notes'],
          [['Inbound / SEO', '', '', ''], ['Outbound / cold', '', '', ''], ['Referral', '', '', ''], ['Partner', '', '', '']]
        ),
        hr(),
        h2('🔄 Sales process'),
        table(
          ['Stage', 'Exit criteria', 'Typical duration', 'Key activities'],
          [
            ['1. Prospecting', '', '', ''],
            ['2. Discovery', '', '', ''],
            ['3. Demo', '', '', ''],
            ['4. Proposal', '', '', ''],
            ['5. Negotiation', '', '', ''],
            ['6. Close', '', '', ''],
          ]
        ),
        hr(),
        h2('💬 Discovery questions'),
        ul('', '', '', ''),
        hr(),
        h2('🛡️ Objection handling'),
        table(
          ['Objection', 'Response'],
          [
            ['"Too expensive"', ''],
            ['"We built it in-house"', ''],
            ['"We use [competitor]"', ''],
            ['"Not the right time"', ''],
          ]
        ),
        hr(),
        h2('📊 Key metrics'),
        table(
          ['Metric', 'Target'],
          [['Win rate', ''], ['Average deal size', ''], ['Sales cycle length', ''], ['Quota attainment', '']]
        ),
      ],
    },
  },

  // ── Business Model Canvas ──────────────────────────────────────────────────
  {
    id: 'business-model-canvas',
    label: 'Business Model Canvas',
    description: 'Strategic one-page model overview',
    icon: '🗃️',
    title: 'Business Model Canvas',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [['Company', ''], ['Date', today], ['Version', '1.0']]
        ),
        hr(),
        h2('💡 Value propositions'),
        blockquote('What unique value do you create for customers?'),
        ul('', '', ''),
        hr(),
        h2('👥 Customer segments'),
        table(
          ['Segment', 'Size', 'Pain point', 'Willingness to pay'],
          [['', '', '', ''], ['', '', '', ''], ['', '', '', '']]
        ),
        hr(),
        h2('📡 Channels'),
        table(
          ['Phase', 'Channel', 'Notes'],
          [
            ['Awareness', '', ''],
            ['Consideration', '', ''],
            ['Purchase', '', ''],
            ['Delivery', '', ''],
            ['Support', '', ''],
          ]
        ),
        hr(),
        h2('🤝 Customer relationships'),
        ul('', ''),
        hr(),
        h2('💰 Revenue streams'),
        table(
          ['Stream', 'Model', 'Pricing', '% of revenue'],
          [['', 'Subscription / Transactional / Licensing', '', ''], ['', '', '', '']]
        ),
        hr(),
        h2('🔑 Key resources'),
        h3('Physical'),
        ul(''),
        h3('Intellectual'),
        ul(''),
        h3('Human'),
        ul(''),
        hr(),
        h2('⚙️ Key activities'),
        ul('', '', ''),
        hr(),
        h2('🤝 Key partnerships'),
        table(
          ['Partner', 'Type', 'Value exchanged'],
          [['', '', ''], ['', '', '']]
        ),
        hr(),
        h2('💸 Cost structure'),
        table(
          ['Cost item', 'Fixed / Variable', 'Monthly est.'],
          [['', '', ''], ['', '', ''], ['', '', '']]
        ),
      ],
    },
  },

  // ── Product Launch Checklist ───────────────────────────────────────────────
  {
    id: 'launch-checklist',
    label: 'Launch Checklist',
    description: 'End-to-end product launch tasks',
    icon: '🚦',
    title: 'Launch Checklist — ',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Product / feature', ''],
            ['Launch date', ''],
            ['Launch DRI', ''],
            ['Status', 'Planning / T-minus / Launched'],
          ]
        ),
        hr(),
        h2('📐 T-4 weeks — Define & design'),
        tasks('PRD approved', 'Design mocks signed off', 'Engineering scoped & planned', 'Legal / compliance review', 'Pricing confirmed'),
        hr(),
        h2('🔨 T-2 weeks — Build & prepare'),
        tasks('Feature code complete', 'QA / testing done', 'Docs & help center written', 'Email & in-app messaging drafted', 'Landing page ready', 'Blog post written'),
        hr(),
        h2('📣 T-1 week — Coordinate'),
        tasks('Sales team briefed & demo ready', 'Support team trained', 'Social posts scheduled', 'Press embargo set (if applicable)', 'Launch video / screenshots ready'),
        hr(),
        h2('🚀 Launch day'),
        tasks('Deploy to production', 'Email campaign sent', 'Social posts published', 'Press release out', 'Monitor error rate & key metrics', 'Slack announcement posted'),
        hr(),
        h2('📊 T+1 week — Review'),
        tasks('Metrics review vs targets', 'Customer feedback collected', 'Bug triage done', 'Team retrospective', 'Next iteration planned'),
        hr(),
        h2('📈 Success metrics'),
        table(
          ['Metric', 'Baseline', 'Target', 'Actual'],
          [['', '', '', ''], ['', '', '', ''], ['', '', '', '']]
        ),
      ],
    },
  },

  // ── One-Pager ─────────────────────────────────────────────────────────────
  {
    id: 'one-pager',
    label: 'Company One-Pager',
    description: 'Quick company overview for partners',
    icon: '📃',
    title: 'One-Pager — ',
    content: {
      type: 'doc',
      content: [
        hr(),
        h2('🚀 What we do'),
        blockquote('One sentence: who you help, how, and the outcome they get'),
        p(),
        hr(),
        h2('😤 The problem'),
        p(),
        hr(),
        h2('✨ Our solution'),
        p(),
        hr(),
        h2('📊 Traction'),
        table(
          ['Metric', 'Value'],
          [['ARR / MRR', ''], ['Customers', ''], ['Growth (MoM)', ''], ['NPS', '']]
        ),
        hr(),
        h2('🏆 Why us'),
        ul('', '', ''),
        hr(),
        h2('💰 Business model'),
        pbold('Pricing:', ''),
        pbold('ACV:', ''),
        pbold('LTV / CAC:', ''),
        hr(),
        h2('🗺️ Market'),
        pbold('TAM:', ''),
        pbold('SAM:', ''),
        hr(),
        h2('👥 Team'),
        table(
          ['Name', 'Role', 'Background'],
          [['', '', ''], ['', '', '']]
        ),
        hr(),
        h2('📬 Contact'),
        pbold('Website:', ''),
        pbold('Email:', ''),
        pbold('LinkedIn:', ''),
      ],
    },
  },

  // ── Design Brief ──────────────────────────────────────────────────────────
  {
    id: 'design-brief',
    label: 'Design Brief',
    description: 'Project scope for designers',
    icon: '🎨',
    title: 'Design Brief — ',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Project', ''],
            ['Designer', ''],
            ['Requester', ''],
            ['Date', today],
            ['Deadline', ''],
            ['Status', 'Brief / In design / Review / Final'],
          ]
        ),
        hr(),
        h2('🎯 Objective'),
        blockquote('What does this design need to achieve?'),
        p(),
        hr(),
        h2('👥 Target audience'),
        p(),
        hr(),
        h2('📋 Deliverables'),
        table(
          ['Deliverable', 'Format', 'Deadline'],
          [['', '', ''], ['', '', ''], ['', '', '']]
        ),
        hr(),
        h2('✅ Requirements'),
        h3('Must have'),
        ul('', '', ''),
        h3('Nice to have'),
        ul('', ''),
        h3('Must not'),
        ul(''),
        hr(),
        h2('🎨 Brand guidelines'),
        pbold('Colors:', ''),
        pbold('Fonts:', ''),
        pbold('Tone:', ''),
        pbold('Style references:', ''),
        hr(),
        h2('📎 Reference materials'),
        ul('', ''),
        hr(),
        h2('🔄 Review process'),
        ol('First draft — feedback by ', 'Second draft — final review by ', 'Final assets delivered'),
      ],
    },
  },

  // ── Customer Onboarding ────────────────────────────────────────────────────
  {
    id: 'customer-onboarding',
    label: 'Customer Onboarding',
    description: 'New customer success checklist',
    icon: '🤝',
    title: 'Customer Onboarding — ',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Customer', ''],
            ['CSM / Owner', ''],
            ['Contract start', today],
            ['Go-live target', ''],
            ['ARR', ''],
            ['Plan', ''],
          ]
        ),
        hr(),
        h2('🎯 Customer goals'),
        ul('Primary goal: ', 'Secondary goal: ', 'Success metric: '),
        hr(),
        h2('📋 Onboarding phases'),
        h3('Phase 1 — Kickoff (Week 1)'),
        tasks('Kickoff call scheduled', 'Stakeholders identified', 'Technical requirements reviewed', 'Data migration scoped', 'Slack / comms channel set up'),
        h3('Phase 2 — Setup (Weeks 2–3)'),
        tasks('Account configured', 'Users invited & roles set', 'Integrations connected', 'Sample data loaded', 'Admin training done'),
        h3('Phase 3 — Pilot (Week 4)'),
        tasks('Pilot group trained', 'First workflow live', 'Feedback collected', 'Issues resolved'),
        h3('Phase 4 — Launch (Week 5+)'),
        tasks('Full rollout complete', 'All users trained', 'Go-live confirmed', 'Health check scheduled'),
        hr(),
        h2('📊 Success metrics at 30 / 60 / 90 days'),
        table(
          ['Metric', '30 days', '60 days', '90 days'],
          [['DAU / WAU', '', '', ''], ['Features adopted', '', '', ''], ['NPS / CSAT', '', '', '']]
        ),
        hr(),
        h2('⚠️ Risks & mitigations'),
        table(
          ['Risk', 'Mitigation'],
          [['', ''], ['', '']]
        ),
      ],
    },
  },

  // ── Brand Guidelines ───────────────────────────────────────────────────────
  {
    id: 'brand-guidelines',
    label: 'Brand Guidelines',
    description: 'Voice, visual identity & usage rules',
    icon: '🎭',
    title: 'Brand Guidelines',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [['Company', ''], ['Version', '1.0'], ['Last updated', today]]
        ),
        hr(),
        h2('🌟 Brand essence'),
        pbold('Mission:', ''),
        pbold('Vision:', ''),
        pbold('Brand personality:', ''),
        pbold('Positioning statement:', ''),
        hr(),
        h2('🗣️ Voice & tone'),
        table(
          ['We are…', 'We are not…'],
          [['', ''], ['', ''], ['', '']]
        ),
        h3('Writing guidelines'),
        ul('', '', ''),
        hr(),
        h2('🎨 Visual identity'),
        h3('Logo'),
        ul('Primary logo: (link)', 'Wordmark: (link)', 'Icon / favicon: (link)', 'Minimum size: ', 'Clear space: '),
        h3('Color palette'),
        table(
          ['Name', 'Hex', 'RGB', 'Usage'],
          [
            ['Primary', '', '', 'CTAs, links, highlights'],
            ['Secondary', '', '', ''],
            ['Neutral dark', '', '', 'Body text'],
            ['Neutral light', '', '', 'Backgrounds'],
            ['Success', '', '', ''],
            ['Error', '', '', ''],
          ]
        ),
        h3('Typography'),
        table(
          ['Style', 'Font', 'Weight', 'Size'],
          [
            ['Heading 1', '', 'Bold 700', ''],
            ['Heading 2', '', 'Semibold 600', ''],
            ['Body', '', 'Regular 400', ''],
            ['Caption', '', 'Regular 400', ''],
          ]
        ),
        hr(),
        h2('✅ Do\'s & ❌ Don\'ts'),
        h3('✅ Do'),
        ul('', '', ''),
        h3('❌ Don\'t'),
        ul('', '', ''),
        hr(),
        h2('📎 Asset library'),
        ul('Figma: (link)', 'Logos: (link)', 'Icons: (link)', 'Photography: (link)'),
      ],
    },
  },

  // ── 1-on-1 Meeting ─────────────────────────────────────────────────────────
  {
    id: 'one-on-one',
    label: '1-on-1 Meeting',
    description: 'Manager–report recurring agenda',
    icon: '🤝',
    title: '1-on-1 — ',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Manager', ''],
            ['Report', ''],
            ['Date', today],
            ['Cadence', 'Weekly / Bi-weekly'],
          ]
        ),
        hr(),
        h2('📋 Agenda (report-driven)'),
        tasks('', '', ''),
        hr(),
        h2('🙋 Report updates'),
        h3('What I worked on this week'),
        ul('', '', ''),
        h3('Wins'),
        ul(''),
        h3('Blockers & needs'),
        ul('', ''),
        hr(),
        h2('💬 Manager topics'),
        ul('', ''),
        hr(),
        h2('🌱 Growth & development'),
        p(),
        hr(),
        h2('✅ Action items'),
        table(
          ['Action', 'Owner', 'Due'],
          [['', '', ''], ['', '', '']]
        ),
        hr(),
        h2('📝 Private notes (manager)'),
        p(),
      ],
    },
  },

  // ── Performance Review ─────────────────────────────────────────────────────
  {
    id: 'performance-review',
    label: 'Performance Review',
    description: 'Mid-year or annual review template',
    icon: '🏅',
    title: 'Performance Review — ',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Employee', ''],
            ['Role', ''],
            ['Manager', ''],
            ['Review period', ''],
            ['Date', today],
            ['Cycle', 'Mid-year / Annual'],
          ]
        ),
        hr(),
        h2('🎯 Goals review'),
        table(
          ['Goal', 'Target', 'Result', 'Rating'],
          [
            ['', '', '', 'Exceeds / Meets / Below'],
            ['', '', '', 'Exceeds / Meets / Below'],
            ['', '', '', 'Exceeds / Meets / Below'],
          ]
        ),
        hr(),
        h2('🏆 Achievements & impact'),
        blockquote('What meaningful outcomes did this person drive?'),
        ul('', '', ''),
        hr(),
        h2('📈 Strengths'),
        ul('', '', ''),
        hr(),
        h2('🔧 Areas for development'),
        table(
          ['Area', 'Current state', 'Expected state', 'Support needed'],
          [['', '', '', ''], ['', '', '', '']]
        ),
        hr(),
        h2('🌱 Growth plan — next period'),
        table(
          ['Development goal', 'Actions', 'Timeline', 'Success measure'],
          [['', '', '', ''], ['', '', '', '']]
        ),
        hr(),
        h2('⭐ Overall rating'),
        table(
          ['Dimension', 'Rating (1–5)', 'Comments'],
          [
            ['Impact', '', ''],
            ['Execution', '', ''],
            ['Collaboration', '', ''],
            ['Leadership', '', ''],
          ]
        ),
        pbold('Overall rating:', ''),
        hr(),
        h2('💬 Employee self-assessment'),
        p(),
        hr(),
        h2('🗣️ Manager summary'),
        p(),
      ],
    },
  },

  // ── Team Charter ───────────────────────────────────────────────────────────
  {
    id: 'team-charter',
    label: 'Team Charter',
    description: 'Purpose, norms & responsibilities',
    icon: '🏴',
    title: 'Team Charter — ',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Team name', ''],
            ['Team lead', ''],
            ['Created', today],
            ['Last reviewed', today],
          ]
        ),
        hr(),
        h2('🌟 Mission'),
        blockquote('Why does this team exist? What does it own?'),
        p(),
        hr(),
        h2('👥 Members & roles'),
        table(
          ['Name', 'Role', 'Responsibilities', 'Time zone'],
          [['', '', '', ''], ['', '', '', ''], ['', '', '', ''], ['', '', '', '']]
        ),
        hr(),
        h2('🎯 Scope & ownership'),
        h3('We own'),
        ul('', '', ''),
        h3('We do NOT own'),
        ul('', ''),
        h3('We collaborate on'),
        ul('', ''),
        hr(),
        h2('📅 Rituals & cadence'),
        table(
          ['Meeting', 'Frequency', 'Duration', 'Purpose', 'Required?'],
          [
            ['Standup', 'Daily', '15 min', 'Sync & blockers', 'Yes'],
            ['Sprint planning', 'Bi-weekly', '1 hr', '', 'Yes'],
            ['Retro', 'Bi-weekly', '1 hr', '', 'Yes'],
            ['1-on-1s', 'Weekly', '30 min', '', 'Yes'],
            ['', '', '', '', ''],
          ]
        ),
        hr(),
        h2('📐 Working norms'),
        h3('Communication'),
        ul('', '', ''),
        h3('Decisions'),
        ul('', ''),
        h3('Code / work quality'),
        ul('', ''),
        hr(),
        h2('📊 How we measure success'),
        ul('', '', ''),
      ],
    },
  },

  // ── RACI Matrix ────────────────────────────────────────────────────────────
  {
    id: 'raci',
    label: 'RACI Matrix',
    description: 'Roles & responsibilities per activity',
    icon: '🗂️',
    title: 'RACI Matrix — ',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [['Project / Process', ''], ['Owner', ''], ['Date', today]]
        ),
        hr(),
        h2('Legend'),
        table(
          ['Letter', 'Meaning', 'Description'],
          [
            ['R', 'Responsible', 'Does the work'],
            ['A', 'Accountable', 'Final decision maker, single person'],
            ['C', 'Consulted', 'Input required before decision'],
            ['I', 'Informed', 'Kept in the loop after decision'],
          ]
        ),
        hr(),
        h2('📋 Responsibility matrix'),
        table(
          ['Activity / Decision', 'Person A', 'Person B', 'Person C', 'Person D', 'Person E'],
          [
            ['', '', '', '', '', ''],
            ['', '', '', '', '', ''],
            ['', '', '', '', '', ''],
            ['', '', '', '', '', ''],
            ['', '', '', '', '', ''],
            ['', '', '', '', '', ''],
            ['', '', '', '', '', ''],
            ['', '', '', '', '', ''],
          ]
        ),
        hr(),
        h2('⚠️ Gaps & overlaps'),
        ul('', ''),
        hr(),
        h2('📝 Notes'),
        p(),
      ],
    },
  },

  // ── Career Development Plan ────────────────────────────────────────────────
  {
    id: 'career-plan',
    label: 'Career Development Plan',
    description: 'Growth goals & skill building',
    icon: '🌱',
    title: 'Career Plan — ',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Name', ''],
            ['Current role', ''],
            ['Target role', ''],
            ['Manager', ''],
            ['Plan period', ''],
            ['Date', today],
          ]
        ),
        hr(),
        h2('🌟 Career vision (1–3 years)'),
        blockquote('Where do you want to be? What kind of work excites you most?'),
        p(),
        hr(),
        h2('💪 Strengths to leverage'),
        ul('', '', ''),
        hr(),
        h2('🔧 Skills to develop'),
        table(
          ['Skill / Area', 'Current level', 'Target level', 'Why it matters'],
          [
            ['', 'Beginner / Intermediate / Advanced', '', ''],
            ['', '', '', ''],
            ['', '', '', ''],
          ]
        ),
        hr(),
        h2('🎯 Goals this period'),
        table(
          ['Goal', 'Type', 'Actions', 'Resources', 'Timeline', 'Success metric'],
          [
            ['', 'Skill / Project / Network / Visibility', '', '', '', ''],
            ['', '', '', '', '', ''],
            ['', '', '', '', '', ''],
          ]
        ),
        hr(),
        h2('📚 Learning & development'),
        h3('Courses / certifications'),
        tasks('', ''),
        h3('Books / resources'),
        tasks('', ''),
        h3('Stretch projects / experiences'),
        tasks('', ''),
        hr(),
        h2('🤝 Mentors & sponsors'),
        table(
          ['Person', 'Role', 'How they can help', 'Meeting cadence'],
          [['', '', '', ''], ['', '', '', '']]
        ),
        hr(),
        h2('📅 Check-in schedule'),
        table(
          ['Date', 'With', 'Agenda'],
          [['', '', ''], ['', '', ''], ['', '', '']]
        ),
      ],
    },
  },

  // ── Team Working Agreement ─────────────────────────────────────────────────
  {
    id: 'working-agreement',
    label: 'Working Agreement',
    description: 'Team norms for how we collaborate',
    icon: '🤜',
    title: 'Working Agreement — ',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [['Team', ''], ['Created', today], ['Last reviewed', today]]
        ),
        blockquote('These are the shared norms our team commits to. Review quarterly.'),
        hr(),
        h2('⏰ Availability & hours'),
        ul('Core hours (everyone online): ', 'Time-zone overlap: ', 'Response time expectation (Slack): ', 'Response time expectation (email): ', 'Out-of-office process: '),
        hr(),
        h2('📡 Communication'),
        table(
          ['Channel', 'Used for', 'Response time'],
          [
            ['Slack #team', 'Day-to-day async', '< 4 hours'],
            ['Slack DM', 'Sensitive / urgent', '< 2 hours'],
            ['Email', 'External / formal', '< 24 hours'],
            ['Meetings', 'Real-time decisions', '—'],
          ]
        ),
        hr(),
        h2('🗓️ Meetings'),
        ul('Camera on / optional for: ', 'Agenda required: yes / no', 'Notes required: yes / no', 'Start & end on time', 'Decisions in docs, not just Slack'),
        hr(),
        h2('✅ How we make decisions'),
        table(
          ['Type', 'Process', 'Who decides'],
          [
            ['Day-to-day', 'Owner decides, informs team', 'Individual'],
            ['Team-level', 'Async proposal + 48h comment window', 'Team lead'],
            ['Cross-team', 'RFC + stakeholder review', 'Steering committee'],
          ]
        ),
        hr(),
        h2('🔀 Code / work reviews'),
        ul('PR review SLA: ', 'Minimum reviewers: ', 'Blocking vs non-blocking comments: ', 'Definition of done: '),
        hr(),
        h2('🌡️ Health & wellbeing'),
        ul('Respect focus time (no-meeting blocks): ', 'Vacation / sick leave process: ', 'Escalation if feeling burnt out: '),
        hr(),
        h2('🔄 How we update this agreement'),
        p('Review in retros. Any team member can propose a change. Majority approval required.'),
      ],
    },
  },

  // ── Hiring Plan ────────────────────────────────────────────────────────────
  {
    id: 'hiring-plan',
    label: 'Hiring Plan',
    description: 'Headcount plan & role pipeline',
    icon: '🧑‍💼',
    title: 'Hiring Plan — ',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [['Period', ''], ['Total headcount budget', ''], ['Owner', ''], ['Date', today]]
        ),
        hr(),
        h2('📊 Headcount summary'),
        table(
          ['Team', 'Current HC', 'Approved adds', 'Target HC', 'Budget'],
          [['', '', '', '', ''], ['', '', '', '', ''], ['', '', '', '', ''], ['Total', '', '', '', '']]
        ),
        hr(),
        h2('📋 Role pipeline'),
        table(
          ['Role', 'Team', 'Level', 'Priority', 'Target start', 'Status', 'Recruiter', 'Notes'],
          [
            ['', '', '', 'P0', '', 'Drafting JD', '', ''],
            ['', '', '', 'P0', '', 'Interviewing', '', ''],
            ['', '', '', 'P1', '', 'Offer extended', '', ''],
            ['', '', '', 'P1', '', 'Planning', '', ''],
          ]
        ),
        hr(),
        h2('🔄 Status definitions'),
        table(
          ['Status', 'Definition'],
          [
            ['Planning', 'Role approved, JD not yet written'],
            ['Drafting JD', 'Job description in progress'],
            ['Sourcing', 'Active search, no qualified candidates yet'],
            ['Interviewing', 'Candidates in pipeline'],
            ['Offer extended', 'Offer sent, awaiting response'],
            ['Filled', 'Candidate accepted, start date set'],
            ['On hold', 'Paused — note reason'],
          ]
        ),
        hr(),
        h2('📈 Recruiting metrics'),
        table(
          ['Role', 'Time to fill (days)', 'Candidates sourced', 'Offer accept rate'],
          [['', '', '', ''], ['', '', '', '']]
        ),
        hr(),
        h2('💬 Hiring committee'),
        table(
          ['Name', 'Role', 'Interview focus'],
          [['', '', ''], ['', '', ''], ['', '', '']]
        ),
      ],
    },
  },

  // ── Team Offsite ───────────────────────────────────────────────────────────
  {
    id: 'team-offsite',
    label: 'Team Offsite',
    description: 'Agenda & logistics for team retreats',
    icon: '🌴',
    title: 'Team Offsite — ',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Team', ''],
            ['Dates', ''],
            ['Location', ''],
            ['Attendees', ''],
            ['Budget', ''],
            ['Organizer', ''],
          ]
        ),
        hr(),
        h2('🎯 Goals for the offsite'),
        ul('', '', ''),
        hr(),
        h2('📅 Agenda'),
        h3('Day 1'),
        table(
          ['Time', 'Session', 'Facilitator', 'Duration'],
          [['', '', '', ''], ['', '', '', ''], ['', '', '', ''], ['', '', '', '']]
        ),
        h3('Day 2'),
        table(
          ['Time', 'Session', 'Facilitator', 'Duration'],
          [['', '', '', ''], ['', '', '', ''], ['', '', '', ''], ['', '', '', '']]
        ),
        hr(),
        h2('✈️ Logistics checklist'),
        tasks('Venue booked', 'Travel arranged for all attendees', 'Hotel / accommodation booked', 'Dietary requirements collected', 'Equipment & AV organised', 'Evening activities planned', 'Pre-read sent to team'),
        hr(),
        h2('📋 Pre-offsite prep'),
        tasks('Survey team on topics to cover', 'Assign session owners', 'Share agenda 1 week before', ''),
        hr(),
        h2('✅ Post-offsite actions'),
        table(
          ['Action', 'Owner', 'Due date'],
          [['', '', ''], ['', '', ''], ['', '', '']]
        ),
        hr(),
        h2('💬 Feedback & retrospective'),
        h3('What worked well'),
        ul(''),
        h3('What to improve next time'),
        ul(''),
      ],
    },
  },

  // ── API Documentation ──────────────────────────────────────────────────────
  {
    id: 'api-docs',
    label: 'API Documentation',
    description: 'REST / GraphQL endpoint reference',
    icon: '🔌',
    title: 'API Docs — ',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Service', ''],
            ['Base URL', ''],
            ['Auth method', 'Bearer token / API key / OAuth2'],
            ['Version', 'v1'],
            ['Last updated', today],
          ]
        ),
        hr(),
        h2('🔐 Authentication'),
        p('All requests must include the following header:'),
        { type: 'codeBlock', attrs: { language: 'http' }, content: [{ type: 'text', text: 'Authorization: Bearer <token>' }] },
        hr(),
        h2('📡 Endpoints'),
        h3('GET /resource'),
        p('Description of what this endpoint returns.'),
        table(
          ['Parameter', 'Type', 'Required', 'Description'],
          [['', '', 'Yes / No', ''], ['', '', 'No', '']]
        ),
        p('Example request:'),
        { type: 'codeBlock', attrs: { language: 'bash' }, content: [{ type: 'text', text: 'curl -X GET https://api.example.com/v1/resource \\\n  -H "Authorization: Bearer <token>"' }] },
        p('Example response:'),
        { type: 'codeBlock', attrs: { language: 'json' }, content: [{ type: 'text', text: '{\n  "id": "123",\n  "name": "Example"\n}' }] },
        h3('POST /resource'),
        p('Description of what this endpoint creates.'),
        p('Request body:'),
        { type: 'codeBlock', attrs: { language: 'json' }, content: [{ type: 'text', text: '{\n  "field": "value"\n}' }] },
        hr(),
        h2('📋 Error codes'),
        table(
          ['Status', 'Code', 'Meaning'],
          [
            ['400', 'bad_request', 'Invalid request parameters'],
            ['401', 'unauthorized', 'Missing or invalid token'],
            ['403', 'forbidden', 'Insufficient permissions'],
            ['404', 'not_found', 'Resource not found'],
            ['429', 'rate_limited', 'Too many requests'],
            ['500', 'server_error', 'Internal server error'],
          ]
        ),
        hr(),
        h2('⚡ Rate limits'),
        table(
          ['Tier', 'Requests / min', 'Requests / day'],
          [['Free', '', ''], ['Pro', '', ''], ['Enterprise', '', '']]
        ),
        hr(),
        h2('📚 SDKs & examples'),
        ul('', '', ''),
      ],
    },
  },

  // ── Architecture Decision Record ───────────────────────────────────────────
  {
    id: 'adr',
    label: 'Architecture Decision Record',
    description: 'ADR for a single architectural choice',
    icon: '🏗️',
    title: 'ADR-: ',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['ADR number', ''],
            ['Title', ''],
            ['Status', 'Proposed / Accepted / Deprecated / Superseded'],
            ['Deciders', ''],
            ['Date', today],
            ['Supersedes', '—'],
            ['Superseded by', '—'],
          ]
        ),
        hr(),
        h2('📌 Context'),
        blockquote('What situation or problem caused us to need this decision?'),
        p(),
        hr(),
        h2('✅ Decision'),
        blockquote('State the decision clearly in one sentence'),
        p(),
        hr(),
        h2('⚖️ Options considered'),
        h3('Option A (chosen)'),
        pbold('Description:', ''),
        h3('Pros'),
        ul('', ''),
        h3('Cons'),
        ul('', ''),
        h3('Option B'),
        pbold('Description:', ''),
        h3('Pros'),
        ul(''),
        h3('Cons'),
        ul(''),
        hr(),
        h2('📐 Consequences'),
        h3('Positive'),
        ul('', ''),
        h3('Negative / trade-offs'),
        ul('', ''),
        h3('Neutral'),
        ul(''),
        hr(),
        h2('🔗 Related decisions & links'),
        ul('', ''),
      ],
    },
  },

  // ── Runbook ────────────────────────────────────────────────────────────────
  {
    id: 'runbook',
    label: 'Runbook',
    description: 'On-call operations & recovery steps',
    icon: '📟',
    title: 'Runbook — ',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Service', ''],
            ['On-call rotation', ''],
            ['Escalation path', ''],
            ['Last updated', today],
            ['Owner', ''],
          ]
        ),
        hr(),
        h2('🔗 Key links'),
        table(
          ['Resource', 'Link'],
          [
            ['Metrics dashboard', ''],
            ['Logs', ''],
            ['Alerts', ''],
            ['Status page', ''],
            ['Deployment pipeline', ''],
            ['Incident channel', ''],
          ]
        ),
        hr(),
        h2('🚨 Common alerts & playbooks'),
        h3('Alert: High error rate'),
        ol('Check error logs: ', 'Check recent deploys: ', 'Roll back if needed: ', 'Escalate to: '),
        h3('Alert: High latency'),
        ol('Check DB query times', 'Check external API dependencies', 'Scale up if needed: '),
        h3('Alert: Service down'),
        ol('Confirm outage scope', 'Check last deployment', 'Check infrastructure health', 'Page on-call lead', 'Open incident channel'),
        hr(),
        h2('🔧 Common operations'),
        h3('Restart service'),
        { type: 'codeBlock', attrs: { language: 'bash' }, content: [{ type: 'text', text: '# Command to restart\n' }] },
        h3('Scale up / down'),
        { type: 'codeBlock', attrs: { language: 'bash' }, content: [{ type: 'text', text: '# Command to scale\n' }] },
        h3('Roll back deployment'),
        { type: 'codeBlock', attrs: { language: 'bash' }, content: [{ type: 'text', text: '# Command to roll back\n' }] },
        hr(),
        h2('📋 Incident response checklist'),
        tasks('Acknowledge alert', 'Assess severity (P0–P3)', 'Open incident channel', 'Identify root cause', 'Apply mitigation', 'Communicate to stakeholders', 'Resolve & close', 'Write post-mortem'),
        hr(),
        h2('📞 Escalation contacts'),
        table(
          ['Name', 'Role', 'Contact', 'When to escalate'],
          [['', '', '', ''], ['', '', '', ''], ['', '', '', '']]
        ),
      ],
    },
  },

  // ── Database Schema Doc ────────────────────────────────────────────────────
  {
    id: 'db-schema',
    label: 'Database Schema',
    description: 'Tables, fields & relationships',
    icon: '🗄️',
    title: 'DB Schema — ',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Database', ''],
            ['Type', 'PostgreSQL / MySQL / MongoDB / other'],
            ['Service', ''],
            ['Last updated', today],
            ['Owner', ''],
          ]
        ),
        hr(),
        h2('📐 Overview'),
        blockquote('Brief description of the data model and domain'),
        p(),
        hr(),
        h2('🗺️ Entity relationship diagram'),
        p('(Paste ER diagram link or embed image)'),
        hr(),
        h2('📋 Tables'),
        h3('table_name'),
        p('Description: what this table stores'),
        table(
          ['Column', 'Type', 'Nullable', 'Default', 'Description'],
          [
            ['id', 'SERIAL PRIMARY KEY', 'No', '—', 'Auto-incremented ID'],
            ['created_at', 'TIMESTAMPTZ', 'No', 'NOW()', ''],
            ['updated_at', 'TIMESTAMPTZ', 'No', 'NOW()', ''],
            ['', '', '', '', ''],
            ['', '', '', '', ''],
          ]
        ),
        p('Indexes:'),
        ul(''),
        p('Foreign keys:'),
        ul(''),
        hr(),
        h2('🔗 Key relationships'),
        table(
          ['Table A', 'Relationship', 'Table B', 'Notes'],
          [['', 'has many', '', ''], ['', 'belongs to', '', ''], ['', 'many-to-many via', '', '']]
        ),
        hr(),
        h2('⚙️ Migrations'),
        table(
          ['Migration', 'Date', 'Description'],
          [['', today, ''], ['', '', '']]
        ),
        hr(),
        h2('📝 Query examples'),
        { type: 'codeBlock', attrs: { language: 'sql' }, content: [{ type: 'text', text: '-- Example query\nSELECT * FROM table_name WHERE condition = true;' }] },
      ],
    },
  },

  // ── Deployment Guide ───────────────────────────────────────────────────────
  {
    id: 'deployment-guide',
    label: 'Deployment Guide',
    description: 'How to build, test & deploy',
    icon: '🚢',
    title: 'Deployment Guide — ',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Service', ''],
            ['Environments', 'dev / staging / production'],
            ['CI/CD platform', ''],
            ['Last updated', today],
            ['Owner', ''],
          ]
        ),
        hr(),
        h2('🔗 Key links'),
        table(
          ['Resource', 'Link'],
          [['CI/CD pipeline', ''], ['Container registry', ''], ['Production dashboard', ''], ['Staging environment', '']]
        ),
        hr(),
        h2('🏗️ Prerequisites'),
        tasks('', '', ''),
        hr(),
        h2('🔨 Local build'),
        { type: 'codeBlock', attrs: { language: 'bash' }, content: [{ type: 'text', text: '# Install dependencies\nnpm install\n\n# Build\nnpm run build\n\n# Run tests\nnpm test' }] },
        hr(),
        h2('🧪 Testing checklist'),
        tasks('Unit tests pass', 'Integration tests pass', 'E2E tests pass', 'Performance test (if applicable)', 'Security scan (if applicable)'),
        hr(),
        h2('🚀 Deploy to staging'),
        ol('', '', ''),
        { type: 'codeBlock', attrs: { language: 'bash' }, content: [{ type: 'text', text: '# Deploy to staging\n' }] },
        hr(),
        h2('✅ Staging smoke tests'),
        tasks('', '', ''),
        hr(),
        h2('🚦 Deploy to production'),
        blockquote('⚠️ Only deploy during allowed hours. Get approval from on-call.'),
        ol('Confirm staging green', 'Get deployment approval from ', 'Merge to main / trigger pipeline', 'Monitor error rate for 15 min post-deploy', 'Confirm health checks passing'),
        { type: 'codeBlock', attrs: { language: 'bash' }, content: [{ type: 'text', text: '# Deploy to production\n' }] },
        hr(),
        h2('🔙 Rollback procedure'),
        ol('', '', ''),
        { type: 'codeBlock', attrs: { language: 'bash' }, content: [{ type: 'text', text: '# Rollback command\n' }] },
        hr(),
        h2('🔢 Environment variables'),
        table(
          ['Variable', 'Required', 'Description', 'Example'],
          [['', 'Yes', '', ''], ['', 'Yes', '', ''], ['', 'No', '', '']]
        ),
      ],
    },
  },

  // ── Developer Onboarding ───────────────────────────────────────────────────
  {
    id: 'dev-onboarding',
    label: 'Developer Onboarding',
    description: 'New eng setup & codebase orientation',
    icon: '👩‍💻',
    title: 'Developer Onboarding — ',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['New developer', ''],
            ['Team', ''],
            ['Manager', ''],
            ['Start date', today],
            ['Buddy', ''],
          ]
        ),
        hr(),
        h2('🛠️ Day 1 — Setup'),
        tasks('MacBook / dev machine unboxed & set up', 'Accounts created (GitHub, Slack, email, Jira)', 'SSH key added to GitHub', 'VPN configured', 'Password manager set up', '1:1 with manager scheduled', 'Team introduced'),
        hr(),
        h2('💻 Local environment setup'),
        { type: 'codeBlock', attrs: { language: 'bash' }, content: [{ type: 'text', text: '# Clone the repo\ngit clone https://github.com/org/repo.git\n\n# Install dependencies\nnpm install\n\n# Set up env vars\ncp .env.example .env\n\n# Start dev server\nnpm run dev' }] },
        hr(),
        h2('📁 Codebase overview'),
        table(
          ['Directory / file', 'Purpose'],
          [['', ''], ['', ''], ['', ''], ['', ''], ['', '']]
        ),
        hr(),
        h2('🔗 Key services & dependencies'),
        table(
          ['Service', 'Purpose', 'Docs'],
          [['', '', ''], ['', '', ''], ['', '', '']]
        ),
        hr(),
        h2('🌿 Branch & PR workflow'),
        ol('Create a feature branch from main', 'Open a draft PR early', 'Self-review before requesting review', 'Address all review comments', 'Squash merge after approval'),
        hr(),
        h2('📏 Code standards'),
        ul('Linter: ', 'Formatter: ', 'Test framework: ', 'Coverage requirement: ', 'Commit convention: '),
        hr(),
        h2('📚 Must-read docs'),
        table(
          ['Document', 'Link', 'Est. read time'],
          [['', '', ''], ['', '', ''], ['', '', '']]
        ),
        hr(),
        h2('🎯 First week tasks'),
        tasks('Read architecture overview', 'Set up local dev environment', 'Run test suite successfully', 'Fix a "good first issue"', 'Open and merge first PR', 'Attend all team rituals'),
      ],
    },
  },

  // ── Release Notes ──────────────────────────────────────────────────────────
  {
    id: 'release-notes',
    label: 'Release Notes',
    description: 'Changelog for a product release',
    icon: '📦',
    title: 'Release Notes — v',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Version', ''],
            ['Release date', today],
            ['Release type', 'Major / Minor / Patch'],
            ['Release manager', ''],
          ]
        ),
        hr(),
        h2('✨ What\'s new'),
        ul('', '', ''),
        hr(),
        h2('🚀 Improvements'),
        ul('', '', ''),
        hr(),
        h2('🐛 Bug fixes'),
        ul('', '', ''),
        hr(),
        h2('⚠️ Breaking changes'),
        blockquote('List any API changes, removed features, or required migrations'),
        ul(''),
        hr(),
        h2('🔒 Security updates'),
        ul(''),
        hr(),
        h2('🗑️ Deprecated'),
        ul(''),
        hr(),
        h2('📦 Dependencies updated'),
        table(
          ['Package', 'From', 'To'],
          [['', '', ''], ['', '', '']]
        ),
        hr(),
        h2('🔧 Migration guide'),
        blockquote('Steps users need to take when upgrading from the previous version'),
        ol('', '', ''),
        hr(),
        h2('🙏 Contributors'),
        ul(''),
      ],
    },
  },

  // ── System Architecture Overview ───────────────────────────────────────────
  {
    id: 'system-architecture',
    label: 'System Architecture',
    description: 'High-level technical architecture doc',
    icon: '🏛️',
    title: 'System Architecture — ',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['System name', ''],
            ['Author', ''],
            ['Last updated', today],
            ['Status', 'Draft / Current / Outdated'],
          ]
        ),
        hr(),
        h2('📌 Overview'),
        blockquote('What does this system do and who uses it?'),
        p(),
        hr(),
        h2('🗺️ Architecture diagram'),
        p('(Paste or link diagram — Lucidchart, Miro, draw.io, etc.)'),
        hr(),
        h2('🧩 Components'),
        table(
          ['Component', 'Technology', 'Purpose', 'Owned by'],
          [['', '', '', ''], ['', '', '', ''], ['', '', '', ''], ['', '', '', ''], ['', '', '', '']]
        ),
        hr(),
        h2('🔄 Data flow'),
        ol('', '', '', ''),
        hr(),
        h2('💾 Data storage'),
        table(
          ['Store', 'Type', 'What it holds', 'Retention'],
          [['', 'PostgreSQL / Redis / S3 / other', '', ''], ['', '', '', ''], ['', '', '', '']]
        ),
        hr(),
        h2('🔌 External integrations'),
        table(
          ['Integration', 'Direction', 'Protocol', 'Auth', 'SLA / rate limits'],
          [['', 'Inbound / Outbound / Both', 'REST / gRPC / Webhook', '', ''], ['', '', '', '', '']]
        ),
        hr(),
        h2('⚡ Performance & scalability'),
        table(
          ['Concern', 'Current state', 'Headroom / limit'],
          [['Throughput (RPS)', '', ''], ['Latency (p99)', '', ''], ['Storage', '', ''], ['Concurrent users', '', '']]
        ),
        hr(),
        h2('🔒 Security'),
        ul('Authentication: ', 'Authorization: ', 'Data encryption at rest: ', 'Data encryption in transit: ', 'PII / sensitive data: ', 'Audit logging: '),
        hr(),
        h2('🔴 Single points of failure & mitigations'),
        table(
          ['SPOF', 'Mitigation'],
          [['', ''], ['', '']]
        ),
        hr(),
        h2('📈 Observability'),
        table(
          ['Signal', 'Tool', 'Link'],
          [['Metrics', '', ''], ['Logs', '', ''], ['Traces', '', ''], ['Alerts', '', ''], ['Dashboards', '', '']]
        ),
        hr(),
        h2('🗺️ Roadmap & known tech debt'),
        ul('', '', ''),
      ],
    },
  },

  // ── Code Review Checklist ──────────────────────────────────────────────────
  {
    id: 'code-review',
    label: 'Code Review Checklist',
    description: 'Standards for reviewing pull requests',
    icon: '🔍',
    title: 'Code Review Checklist',
    content: {
      type: 'doc',
      content: [
        blockquote('This checklist is for both the author (before opening a PR) and reviewers. It is a guide, not a gate — use judgement.'),
        hr(),
        h2('✍️ Author checklist (before requesting review)'),
        h3('Correctness'),
        tasks('Code does what the PR description says', 'Edge cases handled', 'No obvious logic errors'),
        h3('Tests'),
        tasks('Unit tests written for new logic', 'Integration tests updated if needed', 'All tests passing locally', 'Test coverage not regressed'),
        h3('Code quality'),
        tasks('No dead code or debug statements left in', 'Naming is clear and self-documenting', 'Complex logic has brief comments explaining WHY', 'No duplication that could be extracted'),
        h3('Security'),
        tasks('No secrets or credentials in code', 'User inputs validated and sanitised', 'No SQL injection / XSS risk', 'Permissions / auth checked correctly'),
        h3('Performance'),
        tasks('No N+1 queries or obvious perf regressions', 'Expensive operations are async where appropriate'),
        h3('Documentation'),
        tasks('README updated if setup steps changed', 'API docs updated if contract changed', 'Runbook updated if operations changed'),
        hr(),
        h2('🔎 Reviewer guidelines'),
        h3('Approach'),
        ul('Be kind and specific — critique the code, not the person', 'Mark comments as blocking (must fix) or non-blocking (nice to have)', 'Ask questions when unclear rather than assuming'),
        h3('What to look for'),
        ul('Does the PR solve the stated problem?', 'Are there missing test cases?', 'Could this break anything existing?', 'Is there a simpler way to achieve the same outcome?', 'Could this cause a security or performance issue?'),
        hr(),
        h2('🏁 Definition of "ready to merge"'),
        tasks('At least 1 approving review (2 for critical paths)', 'All blocking comments resolved', 'CI / all checks green', 'No merge conflicts'),
      ],
    },
  },

  // ── Security Review ────────────────────────────────────────────────────────
  {
    id: 'security-review',
    label: 'Security Review',
    description: 'Feature or system security assessment',
    icon: '🔒',
    title: 'Security Review — ',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Feature / System', ''],
            ['Reviewer', ''],
            ['Date', today],
            ['Risk level', 'Critical / High / Medium / Low'],
            ['Status', 'In review / Approved / Approved with conditions / Rejected'],
          ]
        ),
        hr(),
        h2('📋 Scope'),
        blockquote('What is being reviewed? What is out of scope?'),
        p(),
        hr(),
        h2('🔐 Authentication & authorization'),
        tasks('All endpoints require authentication', 'Authorization checks present for every action', 'Role / permission checks are correct', 'JWT / session tokens expire appropriately', 'Password policy enforced'),
        hr(),
        h2('🧹 Input validation & output encoding'),
        tasks('All user inputs validated and sanitised', 'SQL queries use parameterised statements', 'HTML output is escaped (no XSS risk)', 'File uploads restricted and validated', 'GraphQL depth / complexity limits set'),
        hr(),
        h2('🔑 Secrets & credentials'),
        tasks('No secrets hardcoded in source code', 'Secrets stored in secret manager / env vars', 'API keys scoped to minimum required permissions', 'Secrets rotated on schedule'),
        hr(),
        h2('🔒 Data security'),
        tasks('PII identified and documented', 'Data encrypted at rest', 'Data encrypted in transit (TLS 1.2+)', 'Data retention policy applied', 'GDPR / CCPA requirements met'),
        hr(),
        h2('🌐 Network & infrastructure'),
        tasks('Principle of least privilege applied', 'Unnecessary ports / services closed', 'WAF rules reviewed', 'CORS policy correct', 'Rate limiting implemented'),
        hr(),
        h2('📋 OWASP Top 10 check'),
        table(
          ['Risk', 'Status', 'Notes'],
          [
            ['A01 Broken access control', 'Pass / Fail / N/A', ''],
            ['A02 Cryptographic failures', 'Pass / Fail / N/A', ''],
            ['A03 Injection', 'Pass / Fail / N/A', ''],
            ['A04 Insecure design', 'Pass / Fail / N/A', ''],
            ['A05 Security misconfiguration', 'Pass / Fail / N/A', ''],
            ['A06 Vulnerable components', 'Pass / Fail / N/A', ''],
            ['A07 Auth failures', 'Pass / Fail / N/A', ''],
            ['A08 Integrity failures', 'Pass / Fail / N/A', ''],
            ['A09 Logging failures', 'Pass / Fail / N/A', ''],
            ['A10 SSRF', 'Pass / Fail / N/A', ''],
          ]
        ),
        hr(),
        h2('⚠️ Findings'),
        table(
          ['ID', 'Severity', 'Description', 'Remediation', 'Owner', 'Due'],
          [['SEC-1', 'High', '', '', '', ''], ['SEC-2', 'Medium', '', '', '', '']]
        ),
        hr(),
        h2('✅ Sign-off'),
        pbold('Reviewer decision:', ''),
        pbold('Conditions (if any):', ''),
        pbold('Re-review required:', 'Yes / No'),
      ],
    },
  },

  // ── Incident Response Plan ─────────────────────────────────────────────────
  {
    id: 'incident-response',
    label: 'Incident Response Plan',
    description: 'On-call roles & escalation process',
    icon: '🚨',
    title: 'Incident Response Plan',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [['Version', '1.0'], ['Last updated', today], ['Owner', '']]
        ),
        hr(),
        h2('🎯 Purpose'),
        blockquote('Define how we detect, respond to, and recover from service incidents to minimise customer impact.'),
        hr(),
        h2('📊 Severity levels'),
        table(
          ['Severity', 'Definition', 'Response time', 'Examples'],
          [
            ['P0 — Critical', 'Full outage, data loss risk', '< 15 min', 'Site down, DB corruption'],
            ['P1 — High', 'Major feature broken, significant impact', '< 30 min', 'Login broken, payments failing'],
            ['P2 — Medium', 'Partial degradation, workaround exists', '< 2 hours', 'Slow load times, minor feature broken'],
            ['P3 — Low', 'Minor issue, minimal impact', '< 1 business day', 'UI glitch, cosmetic bug'],
          ]
        ),
        hr(),
        h2('👥 Incident roles'),
        table(
          ['Role', 'Responsibilities'],
          [
            ['Incident commander (IC)', 'Owns the incident end-to-end, coordinates response'],
            ['Technical lead', 'Drives technical investigation and fixes'],
            ['Comms lead', 'Updates stakeholders and status page'],
            ['Scribe', 'Keeps timeline and notes in the incident doc'],
          ]
        ),
        hr(),
        h2('🔄 Response process'),
        ol(
          'Alert fires → on-call acknowledged within SLA',
          'Assess severity → page additional responders if P0/P1',
          'Open incident channel (#inc-YYYY-MM-DD)',
          'Assign IC, tech lead, comms lead',
          'Diagnose → identify blast radius and root cause',
          'Mitigate → stop the bleeding',
          'Resolve → confirm service restored',
          'Communicate resolution to stakeholders',
          'Schedule post-mortem within 48 hours'
        ),
        hr(),
        h2('📡 Communication templates'),
        h3('Internal (Slack)'),
        blockquote('🚨 P[X] incident declared. [Brief description]. IC: @name. Channel: #inc-xxx. Status: Investigating.'),
        h3('External (status page)'),
        blockquote('We are investigating reports of [issue]. Our team is actively working to resolve this. We will provide an update in [X] minutes.'),
        h3('Resolution'),
        blockquote('The issue affecting [feature] has been resolved as of [time]. All systems are now operating normally. Root cause and full post-mortem to follow.'),
        hr(),
        h2('📞 Escalation contacts'),
        table(
          ['Level', 'Name', 'Contact', 'When'],
          [['L1 On-call', '', '', 'First response'], ['L2 Lead engineer', '', '', 'P0 / P1 unresolved > 30 min'], ['L3 Engineering manager', '', '', 'P0 unresolved > 60 min'], ['L4 CTO', '', '', 'Major customer impact']]
        ),
        hr(),
        h2('✅ Post-incident actions'),
        tasks('Post-mortem written within 48 hours', 'Action items assigned with owners', 'Runbook updated', 'Alerts / monitoring improved', 'Team debrief held'),
      ],
    },
  },

  // ── Changelog ─────────────────────────────────────────────────────────────
  {
    id: 'changelog',
    label: 'Changelog',
    description: 'Running log of product changes',
    icon: '📜',
    title: 'Changelog',
    content: {
      type: 'doc',
      content: [
        blockquote('All notable changes to this project are documented here. Format: [Unreleased] at top, versioned sections below. Keep newest first.'),
        hr(),
        h2('🚧 Unreleased'),
        h3('Added'),
        ul(''),
        h3('Changed'),
        ul(''),
        h3('Fixed'),
        ul(''),
        hr(),
        h2(`[1.x.x] — ${today}`),
        h3('✨ Added'),
        ul('', ''),
        h3('🚀 Changed'),
        ul('', ''),
        h3('🐛 Fixed'),
        ul('', ''),
        h3('⚠️ Breaking'),
        ul(''),
        hr(),
        h2('[1.x.x] — (previous release)'),
        h3('✨ Added'),
        ul(''),
        h3('🐛 Fixed'),
        ul(''),
      ],
    },
  },

  // ── Bug Report ────────────────────────────────────────────────────────────
  {
    id: 'bug-report',
    label: 'Bug Report',
    description: 'Steps to reproduce, expected vs actual, severity',
    icon: '🐛',
    title: 'Bug Report',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Date Reported', today],
            ['Reporter', ''],
            ['Affected Version / Environment', ''],
            ['Severity', 'Critical / High / Medium / Low'],
            ['Status', 'Open'],
          ]
        ),
        hr(),
        h2('Summary'),
        p('One-line description of the bug.'),
        h2('Steps to Reproduce'),
        ol(
          'Go to …',
          'Click on …',
          'Observe …',
        ),
        h2('Expected Behavior'),
        p('Describe what should happen.'),
        h2('Actual Behavior'),
        p('Describe what actually happens. Include error messages or screenshots.'),
        h2('Impact'),
        p('Who is affected and how severely? Any workaround available?'),
        h2('Root Cause (if known)'),
        p(''),
        h2('Fix / Resolution'),
        p(''),
        h2('Attachments'),
        ul('Screenshot / screen recording', 'Logs', 'Network trace'),
      ],
    },
  },

  // ── Feature Flag Plan ─────────────────────────────────────────────────────
  {
    id: 'feature-flag',
    label: 'Feature Flag Plan',
    description: 'Rollout strategy, targeting, kill-switch & rollback',
    icon: '🚩',
    title: 'Feature Flag Plan',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Feature Name', ''],
            ['Flag Key', ''],
            ['Owner', ''],
            ['Target Launch Date', ''],
            ['Current State', 'Off / Partial / Full'],
          ]
        ),
        hr(),
        h2('Overview'),
        p('What does this feature do? Why is it being gated behind a flag?'),
        h2('Rollout Strategy'),
        table(
          ['Phase', 'Audience', '% Traffic', 'Start Date', 'Success Criteria'],
          [
            ['Alpha', 'Internal team', '0%', '', ''],
            ['Beta', 'Early adopters', '5%', '', ''],
            ['GA Ramp', 'All users', '25% → 100%', '', ''],
          ]
        ),
        h2('Targeting Rules'),
        ul(
          'User segment: …',
          'Plan tier: …',
          'Geography: …',
          'Account age: …',
        ),
        h2('Metrics to Monitor'),
        table(
          ['Metric', 'Baseline', 'Target', 'Alert Threshold'],
          [
            ['Conversion rate', '', '', ''],
            ['Error rate', '', '', ''],
            ['P95 latency', '', '', ''],
          ]
        ),
        h2('Kill-Switch Criteria'),
        ul(
          'Error rate exceeds X%',
          'P95 latency exceeds X ms',
          'Support ticket spike > X/day',
        ),
        h2('Rollback Plan'),
        ol(
          'Flip flag off in LaunchDarkly / config system',
          'Notify on-call and product team',
          'Verify metrics return to baseline within 15 min',
          'Post incident summary if rollback triggered',
        ),
        h2('Cleanup'),
        pbold('Flag removal target date:'),
        pbold('Code removal ticket:'),
        pbold('Owner responsible for cleanup:'),
      ],
    },
  },

  // ── On-Call Handoff ───────────────────────────────────────────────────────
  {
    id: 'on-call-handoff',
    label: 'On-Call Handoff',
    description: 'Shift transition notes — incidents, issues, watch items',
    icon: '📟',
    title: 'On-Call Handoff',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Outgoing On-Call', ''],
            ['Incoming On-Call', ''],
            ['Handoff Date / Time', today],
            ['Escalation Contact', ''],
          ]
        ),
        hr(),
        h2('Active Incidents'),
        table(
          ['Incident', 'Severity', 'Status', 'Owner', 'Next Action'],
          [
            ['', '', '', '', ''],
          ]
        ),
        p('None — all clear.'),
        h2('Ongoing Investigations'),
        ul(''),
        h2('Watch Items (elevated risk, not yet paging)'),
        table(
          ['Item', 'Why watching', 'Check frequency', 'Threshold to page'],
          [
            ['', '', '', ''],
          ]
        ),
        h2('Scheduled Maintenance / Deploys'),
        table(
          ['What', 'When', 'Owner', 'Runbook'],
          [
            ['', '', '', ''],
          ]
        ),
        h2('Recent Changes (last 24h)'),
        ul(''),
        h2('Known Flaky Alerts'),
        ul(''),
        h2('Notes for Incoming On-Call'),
        p('Anything else the incoming engineer should know.'),
      ],
    },
  },

  // ── Data Flow Diagram ─────────────────────────────────────────────────────
  {
    id: 'data-flow-diagram',
    label: 'Data Flow Diagram',
    description: 'Document how data moves between services and storage',
    icon: '🔀',
    title: 'Data Flow Diagram',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['System / Feature', ''],
            ['Author', ''],
            ['Last Updated', today],
            ['Diagram Tool', 'Miro / Lucidchart / Excalidraw'],
          ]
        ),
        hr(),
        h2('Overview'),
        p('What system or workflow does this diagram document? What problem does it solve?'),
        h2('Diagram'),
        blockquote('Embed or link your diagram here. Until embedded, describe the flow in the section below.'),
        h2('Data Flow Description'),
        ol(
          'Client sends X to Service A via REST/gRPC',
          'Service A validates and writes to Database B',
          'Service A publishes event to Queue C',
          'Service D consumes event and writes to Cache E',
          'Client polls / receives webhook from Service D',
        ),
        h2('Data Sources'),
        table(
          ['Source', 'Type', 'Owner', 'SLA', 'Notes'],
          [
            ['', 'DB / API / Queue / File', '', '', ''],
          ]
        ),
        h2('Data Sinks'),
        table(
          ['Sink', 'Type', 'Owner', 'Retention', 'Notes'],
          [
            ['', '', '', '', ''],
          ]
        ),
        h2('Sensitive Data'),
        table(
          ['Field', 'Classification', 'Encrypted at rest?', 'Encrypted in transit?'],
          [
            ['', 'PII / PCI / Internal', '', ''],
          ]
        ),
        h2('Open Questions'),
        ul(''),
      ],
    },
  },

  // ── Dependency Audit ──────────────────────────────────────────────────────
  {
    id: 'dependency-audit',
    label: 'Dependency Audit',
    description: 'Libraries, versions, licenses, and upgrade risk',
    icon: '📦',
    title: 'Dependency Audit',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Project', ''],
            ['Auditor', ''],
            ['Date', today],
            ['Package manager', 'npm / yarn / pip / cargo / go.mod'],
          ]
        ),
        hr(),
        h2('Summary'),
        table(
          ['Category', 'Count'],
          [
            ['Total dependencies', ''],
            ['Direct', ''],
            ['Transitive', ''],
            ['Outdated (major)', ''],
            ['Outdated (minor/patch)', ''],
            ['High/Critical CVEs', ''],
            ['Non-permissive licenses', ''],
          ]
        ),
        h2('High-Priority Upgrades'),
        table(
          ['Package', 'Current', 'Latest', 'CVE / Risk', 'Breaking changes?', 'Action'],
          [
            ['', '', '', '', '', 'Upgrade / Replace / Accept'],
          ]
        ),
        h2('License Concerns'),
        table(
          ['Package', 'License', 'Usage', 'Risk', 'Action needed'],
          [
            ['', 'GPL / AGPL / LGPL / MIT', '', 'High / Medium / Low', ''],
          ]
        ),
        h2('Abandoned / Unmaintained Packages'),
        table(
          ['Package', 'Last commit', 'Weekly downloads', 'Suggested replacement'],
          [
            ['', '', '', ''],
          ]
        ),
        h2('Recommended Actions'),
        tasks(
          'Run automated audit: npm audit / pip-audit',
          'Update all patch-level dependencies',
          'Evaluate replacements for high-risk packages',
          'Add license check to CI pipeline',
          'Set up Dependabot / Renovate for automated PRs',
        ),
        h2('Notes'),
        p(''),
      ],
    },
  },

  // ── Product Roadmap ───────────────────────────────────────────────────────
  {
    id: 'roadmap',
    label: 'Product Roadmap',
    description: 'Quarterly themes, priorities, and delivery confidence',
    icon: '🗺️',
    title: 'Product Roadmap',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Product / Team', ''],
            ['Owner', ''],
            ['Period', 'Q1 2026 – Q4 2026'],
            ['Last Updated', today],
          ]
        ),
        hr(),
        h2('Vision'),
        p('One or two sentences: what does success look like 12 months from now?'),
        h2('Strategic Themes'),
        ul(
          'Theme 1: Growth — …',
          'Theme 2: Retention — …',
          'Theme 3: Platform — …',
        ),
        h2('Q1 — Now'),
        table(
          ['Initiative', 'Theme', 'Status', 'Confidence', 'Owner', 'Notes'],
          [
            ['', '', 'In progress', 'High', '', ''],
            ['', '', 'Planned', 'Medium', '', ''],
          ]
        ),
        h2('Q2 — Next'),
        table(
          ['Initiative', 'Theme', 'Status', 'Confidence', 'Owner', 'Notes'],
          [
            ['', '', 'Planned', 'Medium', '', ''],
            ['', '', 'Planned', 'Low', '', ''],
          ]
        ),
        h2('Q3 — Later'),
        table(
          ['Initiative', 'Theme', 'Status', 'Confidence', 'Owner', 'Notes'],
          [
            ['', '', 'Considering', 'Low', '', ''],
          ]
        ),
        h2('Q4 — Future'),
        table(
          ['Initiative', 'Theme', 'Status', 'Confidence', 'Owner', 'Notes'],
          [
            ['', '', 'Exploring', 'Low', '', ''],
          ]
        ),
        h2('Not Doing (This Year)'),
        ul(''),
        h2('Open Questions'),
        ul(''),
      ],
    },
  },

  // ── User Story ────────────────────────────────────────────────────────────
  {
    id: 'user-story',
    label: 'User Story',
    description: 'Agile user story with acceptance criteria and edge cases',
    icon: '📖',
    title: 'User Story',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Story ID', ''],
            ['Epic', ''],
            ['Sprint', ''],
            ['Points', ''],
            ['Assignee', ''],
            ['Status', 'Backlog / In Progress / Done'],
          ]
        ),
        hr(),
        h2('Story'),
        blockquote('As a [type of user], I want [some goal] so that [some reason / value].'),
        h2('Background / Context'),
        p('Why does this story exist? What problem does it solve?'),
        h2('Acceptance Criteria'),
        tasks(
          'Given [context], when [action], then [outcome]',
          'Given [context], when [action], then [outcome]',
          'Given [context], when [action], then [outcome]',
        ),
        h2('Out of Scope'),
        ul(''),
        h2('Edge Cases'),
        ul(
          'What if the user has no data?',
          'What if the network is slow or offline?',
          'What if permissions are restricted?',
        ),
        h2('UI / Design'),
        p('Link to Figma or describe expected UI behavior.'),
        h2('Technical Notes'),
        p('Any implementation hints, API changes, or constraints.'),
        h2('Dependencies'),
        ul(''),
        h2('Testing Notes'),
        ul(
          'Unit tests for core logic',
          'E2E test for happy path',
          'Manual QA checklist attached',
        ),
      ],
    },
  },

  // ── North Star Metric ─────────────────────────────────────────────────────
  {
    id: 'north-star-metric',
    label: 'North Star Metric',
    description: 'Define the single metric that captures product value',
    icon: '⭐',
    title: 'North Star Metric',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Product / Team', ''],
            ['Owner', ''],
            ['Last Reviewed', today],
          ]
        ),
        hr(),
        h2('Our North Star'),
        blockquote('State the metric in one sentence: "[Metric name] — [plain English definition]"'),
        h2('Why This Metric?'),
        p('What makes this the best single indicator of the value we deliver to users?'),
        h2('Definition'),
        table(
          ['Term', 'Definition'],
          [
            ['Metric name', ''],
            ['Formula', ''],
            ['Unit of measurement', ''],
            ['Measurement frequency', ''],
            ['Data source', ''],
          ]
        ),
        h2('Current Baseline'),
        table(
          ['Period', 'Value', 'Notes'],
          [
            ['Last week', '', ''],
            ['Last month', '', ''],
            ['Last quarter', '', ''],
          ]
        ),
        h2('Target'),
        pbold('12-month target:'),
        pbold('Rationale for target:'),
        h2('Leading Indicators (Input Metrics)'),
        table(
          ['Input metric', 'Definition', 'How it affects North Star', 'Owner'],
          [
            ['', '', '', ''],
            ['', '', '', ''],
            ['', '', '', ''],
          ]
        ),
        h2('Counter Metrics (guard rails)'),
        ul(
          'Do not sacrifice [metric X] to grow North Star',
          'Monitor [metric Y] — decline signals a quality issue',
        ),
        h2('Anti-metrics (things that could inflate the number falsely)'),
        ul(''),
        h2('How We Will Review'),
        p('Weekly in product review, monthly exec update, quarterly recalibration.'),
      ],
    },
  },

  // ── Risk Register ─────────────────────────────────────────────────────────
  {
    id: 'risk-register',
    label: 'Risk Register',
    description: 'Identify, assess, and track risks with mitigation plans',
    icon: '⚠️',
    title: 'Risk Register',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Project / Product', ''],
            ['Owner', ''],
            ['Last Updated', today],
          ]
        ),
        hr(),
        blockquote('Risk score = Likelihood (1–5) × Impact (1–5). Score ≥ 15 = Critical, 8–14 = High, 4–7 = Medium, ≤ 3 = Low.'),
        h2('Risk Register'),
        table(
          ['ID', 'Risk Description', 'Category', 'Likelihood', 'Impact', 'Score', 'Mitigation', 'Owner', 'Status'],
          [
            ['R-01', '', 'Technical / Financial / Legal / Operational', '3', '4', '12', '', '', 'Open'],
            ['R-02', '', '', '', '', '', '', '', 'Open'],
            ['R-03', '', '', '', '', '', '', '', 'Open'],
          ]
        ),
        h2('Critical Risks (Score ≥ 15)'),
        p('List critical risks here with expanded mitigation detail.'),
        h2('Closed / Resolved Risks'),
        table(
          ['ID', 'Risk', 'Resolution', 'Closed Date'],
          [
            ['', '', '', ''],
          ]
        ),
        h2('Review Log'),
        table(
          ['Date', 'Reviewer', 'Changes Made'],
          [
            [today, '', 'Initial draft'],
          ]
        ),
      ],
    },
  },

  // ── Customer Case Study ───────────────────────────────────────────────────
  {
    id: 'case-study',
    label: 'Customer Case Study',
    description: 'Win story — challenge, solution, results, and quotes',
    icon: '🏆',
    title: 'Customer Case Study',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Customer', ''],
            ['Industry', ''],
            ['Company size', ''],
            ['Product used', ''],
            ['Date published', today],
            ['Customer contact (internal)', ''],
          ]
        ),
        hr(),
        h2('Executive Summary'),
        p('Two to three sentences capturing the challenge, solution, and headline result.'),
        h2('About the Customer'),
        p('Brief company description — industry, size, key products/markets.'),
        h2('The Challenge'),
        p('What problem was the customer trying to solve before adopting our product?'),
        ul(
          'Pain point 1',
          'Pain point 2',
          'Pain point 3',
        ),
        h2('Why They Chose Us'),
        ul(
          'Key differentiator 1',
          'Key differentiator 2',
          'Alternatives they evaluated',
        ),
        h2('The Solution'),
        p('How did the customer implement and use our product?'),
        h2('Results'),
        table(
          ['Metric', 'Before', 'After', 'Improvement'],
          [
            ['', '', '', ''],
            ['', '', '', ''],
            ['', '', '', ''],
          ]
        ),
        h2('Customer Quote'),
        blockquote('"[Quote]" — Name, Title, Company'),
        h2('What\'s Next'),
        p('What is the customer planning to do next with the product?'),
        h2('Internal Notes'),
        p('Deal size, expansion potential, reference willingness — keep internal only.'),
      ],
    },
  },

  // ── Email Campaign Brief ──────────────────────────────────────────────────
  {
    id: 'email-campaign',
    label: 'Email Campaign Brief',
    description: 'Audience, message, sequence, and success metrics',
    icon: '✉️',
    title: 'Email Campaign Brief',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Campaign Name', ''],
            ['Owner', ''],
            ['Send Date(s)', ''],
            ['Email Platform', ''],
            ['Status', 'Draft / Review / Approved / Sent'],
          ]
        ),
        hr(),
        h2('Objective'),
        p('What is this campaign trying to achieve? (e.g., drive trial signups, re-engage churned users, announce a feature)'),
        h2('Target Audience'),
        table(
          ['Segment', 'Criteria', 'Estimated size'],
          [
            ['Primary', '', ''],
            ['Exclusions', '', ''],
          ]
        ),
        h2('Key Message'),
        blockquote('One sentence: the single most important thing this email should communicate.'),
        h2('Email Sequence'),
        table(
          ['Email #', 'Subject Line', 'Preview text', 'Send day/time', 'CTA', 'Owner'],
          [
            ['1 — Hook', '', '', '', '', ''],
            ['2 — Value', '', '', '', '', ''],
            ['3 — Social proof', '', '', '', '', ''],
            ['4 — Urgency / close', '', '', '', '', ''],
          ]
        ),
        h2('Creative Assets Needed'),
        tasks(
          'Hero image / GIF',
          'Copy reviewed by legal',
          'UTM parameters added to all links',
          'Mobile preview tested',
          'Unsubscribe / footer links verified',
        ),
        h2('Success Metrics'),
        table(
          ['Metric', 'Target', 'Measurement Method'],
          [
            ['Open rate', '', ''],
            ['Click-through rate', '', ''],
            ['Conversion / Goal', '', ''],
            ['Unsubscribe rate', '< 0.3%', ''],
          ]
        ),
        h2('Post-Send Analysis'),
        p('Complete this section after the campaign sends.'),
        ul('Actual open rate:', 'Actual CTR:', 'Conversions:', 'Key learnings:'),
      ],
    },
  },

  // ── Content Calendar ──────────────────────────────────────────────────────
  {
    id: 'content-calendar',
    label: 'Content Calendar',
    description: 'Weekly content plan with channels, topics, and owners',
    icon: '📅',
    title: 'Content Calendar',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Period', ''],
            ['Owner', ''],
            ['Last Updated', today],
          ]
        ),
        hr(),
        h2('Content Goals This Period'),
        ul(
          'Goal 1: …',
          'Goal 2: …',
          'Goal 3: …',
        ),
        h2('Active Channels'),
        table(
          ['Channel', 'Cadence', 'Primary audience', 'Owner', 'KPI'],
          [
            ['Blog', 'Weekly', '', '', ''],
            ['LinkedIn', '3×/week', '', '', ''],
            ['Twitter / X', 'Daily', '', '', ''],
            ['Newsletter', 'Bi-weekly', '', '', ''],
            ['YouTube', 'Monthly', '', '', ''],
          ]
        ),
        h2('Content Calendar'),
        table(
          ['Week', 'Date', 'Channel', 'Topic / Title', 'Format', 'Status', 'Owner', 'Link'],
          [
            ['W1', '', 'Blog', '', 'Long-form', 'Draft', '', ''],
            ['W1', '', 'LinkedIn', '', 'Post', 'Scheduled', '', ''],
            ['W2', '', 'Newsletter', '', 'Email', 'Planned', '', ''],
            ['W2', '', 'YouTube', '', 'Video', 'Planned', '', ''],
            ['W3', '', 'Blog', '', 'Long-form', 'Idea', '', ''],
            ['W3', '', 'Twitter', '', 'Thread', 'Idea', '', ''],
            ['W4', '', 'Blog', '', 'Long-form', 'Idea', '', ''],
          ]
        ),
        h2('Content Backlog / Ideas'),
        ul('', '', ''),
        h2('Review & Retrospective'),
        p('End-of-period notes: what worked, what flopped, what to do differently.'),
      ],
    },
  },

  // ── Exit Interview Guide ──────────────────────────────────────────────────
  {
    id: 'exit-interview',
    label: 'Exit Interview Guide',
    description: 'Structured questions for offboarding conversations',
    icon: '👋',
    title: 'Exit Interview Guide',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Employee Name', ''],
            ['Role', ''],
            ['Department', ''],
            ['Last Day', ''],
            ['Interviewer', ''],
            ['Date', today],
            ['Confidential', 'Yes — do not share verbatim without consent'],
          ]
        ),
        hr(),
        blockquote('Remind the employee at the start: this conversation is voluntary, their answers will be used to improve the company, and their name will not be attached to specific quotes in any reports without permission.'),
        h2('Reason for Leaving'),
        ul(
          'What prompted you to start looking for a new role?',
          'Was there a specific event or moment that triggered the decision?',
          'Did you consider staying? What would have made you stay?',
        ),
        h2('Role & Responsibilities'),
        ul(
          'How well did the role match your expectations when you joined?',
          'Did you have the resources and support you needed to do your job well?',
          'Were there aspects of the role that felt unclear or unsupported?',
        ),
        h2('Team & Culture'),
        ul(
          'How would you describe the team culture?',
          'Did you feel valued and included?',
          'How was your relationship with your manager?',
        ),
        h2('Growth & Development'),
        ul(
          'Did you feel there were opportunities to grow and develop here?',
          'Did you receive useful feedback and career guidance?',
          'What could we have done better to support your development?',
        ),
        h2('Company & Leadership'),
        ul(
          'How do you feel about the direction the company is headed?',
          'Was there clear communication from leadership?',
          'Do you feel your work had impact and was recognized?',
        ),
        h2('Recommendations'),
        ul(
          'What is one thing you would change about the company or team?',
          'What would make this a better place to work?',
          'Would you recommend this company to a friend? Why or why not?',
        ),
        h2('Notes'),
        p('Interviewer notes and key themes from the conversation.'),
        h2('Themes to Escalate'),
        p('Any systemic issues or patterns that leadership should be aware of.'),
      ],
    },
  },

  // ── Performance Improvement Plan ──────────────────────────────────────────
  {
    id: 'pip',
    label: 'Performance Improvement Plan',
    description: 'Expectations, gaps, actions, and check-in schedule',
    icon: '📈',
    title: 'Performance Improvement Plan',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Employee Name', ''],
            ['Role', ''],
            ['Manager', ''],
            ['HR Business Partner', ''],
            ['PIP Start Date', today],
            ['PIP End Date', ''],
            ['Review Period', '30 / 60 / 90 days'],
          ]
        ),
        hr(),
        blockquote('This document is confidential. Its purpose is to give clear expectations and support for improvement. Both the employee and manager should sign to acknowledge receipt.'),
        h2('Purpose'),
        p('Describe the purpose of this PIP and the performance areas of concern.'),
        h2('Performance Gaps'),
        table(
          ['Area', 'Expected Standard', 'Current Performance', 'Gap'],
          [
            ['', '', '', ''],
            ['', '', '', ''],
          ]
        ),
        h2('Goals & Milestones'),
        table(
          ['Goal', 'Measurable Outcome', 'Target Date', 'Resources / Support'],
          [
            ['', '', '', ''],
            ['', '', '', ''],
            ['', '', '', ''],
          ]
        ),
        h2('Action Plan'),
        ol(
          'Manager action: …',
          'Employee action: …',
          'Training / coaching: …',
        ),
        h2('Check-in Schedule'),
        table(
          ['Check-in #', 'Date', 'Format', 'Notes'],
          [
            ['Week 2', '', '1:1 meeting', ''],
            ['Week 4', '', '1:1 meeting', ''],
            ['Week 6', '', 'Formal review', ''],
            ['Week 8', '', 'Formal review', ''],
          ]
        ),
        h2('Consequences'),
        p('If the goals above are not met by the end of the PIP period, the outcome may include further disciplinary action up to and including separation. Successful completion of the PIP will be acknowledged and noted in the employee\'s file.'),
        h2('Signatures'),
        table(
          ['Party', 'Signature', 'Date'],
          [
            ['Employee', '', ''],
            ['Manager', '', ''],
            ['HR Business Partner', '', ''],
          ]
        ),
      ],
    },
  },

  // ── Org Design Notes ─────────────────────────────────────────────────────
  {
    id: 'org-chart-notes',
    label: 'Org Design Notes',
    description: 'Team structure decisions, reporting lines, and rationale',
    icon: '🏢',
    title: 'Org Design Notes',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Team / Division', ''],
            ['Author', ''],
            ['Date', today],
            ['Status', 'Draft / Proposed / Approved / Implemented'],
          ]
        ),
        hr(),
        h2('Current State'),
        p('Describe the current org structure. Link to existing org chart if available.'),
        table(
          ['Team', 'Head Count', 'Reports to', 'Key responsibilities'],
          [
            ['', '', '', ''],
          ]
        ),
        h2('Proposed Changes'),
        p('What is changing, and when does it take effect?'),
        h2('Rationale'),
        ul(
          'Why now?',
          'What problem does this solve?',
          'What are the expected benefits?',
        ),
        h2('Future State'),
        p('Describe the desired org structure after the change.'),
        table(
          ['Team', 'Head Count', 'Reports to', 'Key responsibilities'],
          [
            ['', '', '', ''],
          ]
        ),
        h2('Trade-offs & Risks'),
        table(
          ['Trade-off / Risk', 'Mitigation'],
          [
            ['', ''],
            ['', ''],
          ]
        ),
        h2('People Impact'),
        table(
          ['Person / Role', 'Current state', 'Future state', 'Action needed'],
          [
            ['', '', '', ''],
          ]
        ),
        h2('Communication Plan'),
        ol(
          'Announce to leadership team — [date]',
          'Announce to affected teams — [date]',
          'All-hands / company-wide communication — [date]',
          'Update HRIS and org charts — [date]',
        ),
        h2('Open Questions'),
        ul(''),
      ],
    },
  },

  // ── Skip-Level Meeting ────────────────────────────────────────────────────
  {
    id: 'skip-level',
    label: 'Skip-Level Meeting',
    description: 'Agenda and talking points for skip-level 1:1s',
    icon: '🎙️',
    title: 'Skip-Level Meeting',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Senior Leader', ''],
            ['Employee', ''],
            ['Direct Manager (skipped)', ''],
            ['Date', today],
            ['Duration', '30 min'],
          ]
        ),
        hr(),
        blockquote('Purpose: build direct connection, hear unfiltered feedback, spot blockers managers can\'t see. Not a performance review. Reassure the employee this is a safe space and that specific quotes won\'t be passed to their manager without permission.'),
        h2('Opening (5 min)'),
        ul(
          'Introductions / personal check-in',
          'Confirm purpose and confidentiality',
          'Quick wins or highlights since last meeting',
        ),
        h2('How Is Work Going? (10 min)'),
        ul(
          'What\'s going well on your team right now?',
          'What\'s your biggest challenge or frustration?',
          'Is there anything blocking you that I or your manager could help remove?',
          'Do you have what you need to do your job well?',
        ),
        h2('Career & Growth (10 min)'),
        ul(
          'How are you feeling about your career growth here?',
          'Are there skills you want to develop that you\'re not getting the chance to?',
          'Is there any role or project you\'d love to be involved in?',
        ),
        h2('Culture & Team Health (5 min)'),
        ul(
          'How would you describe the team culture from where you sit?',
          'Is there anything about how we work that you\'d change?',
          'Do you feel your voice is heard and your work is valued?',
        ),
        h2('Open Floor (5 min)'),
        ul(
          'Anything else you\'d like to talk about or raise?',
          'Any feedback for me personally?',
        ),
        h2('Action Items'),
        tasks(
          '',
          '',
        ),
        h2('Private Notes (leader only)'),
        p('Key themes to follow up on. Do not share verbatim.'),
      ],
    },
  },

  // ── Project Kickoff ───────────────────────────────────────────────────────
  {
    id: 'project-kickoff',
    label: 'Project Kickoff',
    description: 'First meeting agenda — goals, stakeholders, timeline, open questions',
    icon: '🚀',
    title: 'Project Kickoff',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Project Name', ''],
            ['Date', today],
            ['Facilitator', ''],
            ['Stakeholders', ''],
            ['Location / Link', ''],
          ]
        ),
        hr(),
        h2('Agenda'),
        ol(
          'Welcome & introductions (5 min)',
          'Project overview & why we\'re here (10 min)',
          'Goals & success criteria (10 min)',
          'Scope: in / out (10 min)',
          'Roles & responsibilities (5 min)',
          'Timeline & milestones (10 min)',
          'Risks & open questions (10 min)',
          'Next steps & close (5 min)',
        ),
        h2('Project Overview'),
        p('What is this project? Why does it exist? What problem does it solve?'),
        h2('Goals & Success Criteria'),
        table(
          ['Goal', 'How We Measure Success'],
          [
            ['', ''],
            ['', ''],
          ]
        ),
        h2('Scope'),
        table(
          ['In Scope', 'Out of Scope'],
          [
            ['', ''],
            ['', ''],
            ['', ''],
          ]
        ),
        h2('Team & Roles'),
        table(
          ['Name', 'Role', 'Responsibility', 'Availability'],
          [
            ['', 'Project Lead', '', ''],
            ['', 'Engineering', '', ''],
            ['', 'Design', '', ''],
            ['', 'Stakeholder', '', ''],
          ]
        ),
        h2('Key Milestones'),
        table(
          ['Milestone', 'Target Date', 'Owner', 'Dependencies'],
          [
            ['Kickoff complete', today, '', ''],
            ['Design complete', '', '', ''],
            ['Development complete', '', '', ''],
            ['QA & testing', '', '', ''],
            ['Launch', '', '', ''],
          ]
        ),
        h2('Risks & Assumptions'),
        ul('', ''),
        h2('Open Questions'),
        ul('', ''),
        h2('Decisions Made'),
        ul(''),
        h2('Action Items'),
        tasks(
          '',
          '',
          '',
        ),
      ],
    },
  },

  // ── Decision Memo ─────────────────────────────────────────────────────────
  {
    id: 'decision-memo',
    label: 'Decision Memo',
    description: 'One-page memo communicating a final decision and reasoning',
    icon: '📝',
    title: 'Decision Memo',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Date', today],
            ['Author', ''],
            ['Decision Owner', ''],
            ['Stakeholders Informed', ''],
            ['Status', 'Draft / Final'],
          ]
        ),
        hr(),
        h2('Decision'),
        blockquote('State the decision clearly in 1–2 sentences. Start with "We will …" or "The decision is to …"'),
        h2('Context'),
        p('What situation or problem prompted this decision? Keep it brief — assume the reader has background knowledge.'),
        h2('Why We Decided This (Reasoning)'),
        ul(
          'Reason 1',
          'Reason 2',
          'Reason 3',
        ),
        h2('Options Considered'),
        table(
          ['Option', 'Pros', 'Cons', 'Why not chosen'],
          [
            ['Option A (chosen)', '', '', 'N/A — chosen'],
            ['Option B', '', '', ''],
            ['Option C', '', '', ''],
          ]
        ),
        h2('Trade-offs Accepted'),
        p('What are we giving up or accepting as a result of this decision?'),
        h2('Assumptions'),
        ul(''),
        h2('Impact'),
        table(
          ['Area', 'Impact'],
          [
            ['Engineering', ''],
            ['Product', ''],
            ['Customers', ''],
            ['Timeline / Cost', ''],
          ]
        ),
        h2('Next Steps'),
        tasks(
          '',
          '',
          '',
        ),
        h2('How to Revisit'),
        p('Under what conditions should this decision be reconsidered? Who has the authority to reverse it?'),
      ],
    },
  },

  // ── FAQ Page ──────────────────────────────────────────────────────────────
  {
    id: 'faq',
    label: 'FAQ Page',
    description: 'Organized frequently asked questions with clear answers',
    icon: '❓',
    title: 'FAQ',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Topic', ''],
            ['Owner', ''],
            ['Audience', 'Customers / Internal / Both'],
            ['Last Updated', today],
          ]
        ),
        hr(),
        blockquote('Add questions as they come in. Group related questions under headings. Link to deeper documentation where relevant.'),
        h2('General'),
        h3('Q: What is [product/service]?'),
        p('A: …'),
        h3('Q: Who is this for?'),
        p('A: …'),
        h3('Q: How much does it cost?'),
        p('A: …'),
        h2('Getting Started'),
        h3('Q: How do I sign up?'),
        p('A: …'),
        h3('Q: How do I invite my team?'),
        p('A: …'),
        h3('Q: Is there a free trial?'),
        p('A: …'),
        h2('Features'),
        h3('Q: Can I [do a key action]?'),
        p('A: …'),
        h3('Q: Does it integrate with [tool]?'),
        p('A: …'),
        h2('Billing & Plans'),
        h3('Q: How does billing work?'),
        p('A: …'),
        h3('Q: Can I cancel any time?'),
        p('A: …'),
        h2('Troubleshooting'),
        h3('Q: I\'m seeing an error. What do I do?'),
        p('A: …'),
        h3('Q: How do I contact support?'),
        p('A: …'),
      ],
    },
  },

  // ── Glossary ──────────────────────────────────────────────────────────────
  {
    id: 'glossary',
    label: 'Glossary',
    description: 'Key terms, acronyms, and concepts for your team or product',
    icon: '📚',
    title: 'Glossary',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Domain', ''],
            ['Owner', ''],
            ['Last Updated', today],
            ['Audience', 'All team members'],
          ]
        ),
        hr(),
        blockquote('Keep definitions short and precise. Link to deeper docs where needed. Sort alphabetically within each section.'),
        h2('A'),
        h3('API (Application Programming Interface)'),
        p('A defined interface that allows different software systems to communicate. In our context, …'),
        h2('B'),
        h3('Backlog'),
        p('A prioritized list of work items (features, bugs, tasks) not yet scheduled for delivery.'),
        h2('C'),
        h3('CAC (Customer Acquisition Cost)'),
        p('Total cost of acquiring a new customer, calculated as total sales & marketing spend ÷ number of new customers in a period.'),
        h2('D'),
        h3('Definition of Done'),
        p('A shared checklist of criteria that must be met before a work item is considered complete.'),
        h2('E'),
        h3('Epic'),
        p('A large body of work that can be broken down into multiple user stories or tasks.'),
        h2('F'),
        h3('Feature Flag'),
        p('A configuration mechanism to enable or disable a feature at runtime without deploying new code.'),
        h2('L'),
        h3('LTV (Lifetime Value)'),
        p('The total revenue a business expects from a single customer account throughout the relationship.'),
        h2('M'),
        h3('MRR (Monthly Recurring Revenue)'),
        p('Total predictable monthly revenue from all active subscriptions.'),
        h2('N'),
        h3('NPS (Net Promoter Score)'),
        p('A customer loyalty metric: % promoters (score 9–10) minus % detractors (score 0–6) from a single survey question.'),
        h2('P'),
        h3('PRD (Product Requirements Document)'),
        p('A document describing the purpose, features, and constraints of a product or feature. Used to align design, engineering, and business stakeholders.'),
        h2('R'),
        h3('RACI'),
        p('Responsibility assignment matrix: Responsible, Accountable, Consulted, Informed. Clarifies who does what on a project.'),
        h2('S'),
        h3('Sprint'),
        p('A fixed time-box (usually 1–2 weeks) during which a team completes a set of planned work items.'),
        h2('— Add more terms below —'),
        p(''),
      ],
    },
  },

  // ── Capacity Plan ─────────────────────────────────────────────────────────
  {
    id: 'capacity-plan',
    label: 'Capacity Plan',
    description: 'Headcount, workload, and infrastructure capacity planning',
    icon: '📊',
    title: 'Capacity Plan',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Team', ''],
            ['Planning Period', 'Q1 2026'],
            ['Owner', ''],
            ['Last Updated', today],
          ]
        ),
        hr(),
        h2('Summary'),
        p('What is this capacity plan for? What decisions does it support?'),
        h2('Current Headcount'),
        table(
          ['Role', 'Headcount', 'Capacity (pts/sprint)', 'Utilisation %', 'Notes'],
          [
            ['Engineering — Backend', '', '', '', ''],
            ['Engineering — Frontend', '', '', '', ''],
            ['Engineering — Mobile', '', '', '', ''],
            ['Design', '', '', '', ''],
            ['QA', '', '', '', ''],
            ['Total', '', '', '', ''],
          ]
        ),
        h2('Planned Headcount Changes'),
        table(
          ['Role', 'Change', 'Start Date', 'Impact (pts/sprint)'],
          [
            ['', 'Hire / Departure / Leave', '', ''],
          ]
        ),
        h2('Workload Forecast'),
        table(
          ['Initiative', 'Priority', 'Estimated effort (pts)', 'Team', 'Quarter'],
          [
            ['', 'P0', '', '', 'Q1'],
            ['', 'P1', '', '', 'Q1'],
            ['', 'P1', '', '', 'Q2'],
            ['', 'P2', '', '', 'Q2'],
          ]
        ),
        h2('Capacity vs Demand'),
        table(
          ['Quarter', 'Available capacity (pts)', 'Projected demand (pts)', 'Gap / Surplus'],
          [
            ['Q1', '', '', ''],
            ['Q2', '', '', ''],
            ['Q3', '', '', ''],
            ['Q4', '', '', ''],
          ]
        ),
        h2('Infrastructure Capacity'),
        table(
          ['Resource', 'Current', 'Projected peak', 'Headroom', 'Action needed'],
          [
            ['Compute (CPUs/nodes)', '', '', '', ''],
            ['Database (storage)', '', '', '', ''],
            ['Cache (RAM)', '', '', '', ''],
            ['CDN / bandwidth', '', '', '', ''],
          ]
        ),
        h2('Risks & Assumptions'),
        ul(
          'Assumes no unplanned attrition',
          'Infrastructure estimates based on 2× current growth rate',
        ),
        h2('Recommendations'),
        ol(
          '',
          '',
        ),
        h2('Open Questions'),
        ul(''),
      ],
    },
  },

  // ── Test Plan ─────────────────────────────────────────────────────────────
  {
    id: 'test-plan',
    label: 'Test Plan',
    description: 'Scope, approach, test cases, and acceptance criteria for QA',
    icon: '🧪',
    title: 'Test Plan',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Feature / Project', ''],
            ['QA Owner', ''],
            ['Engineer', ''],
            ['Target Release', ''],
            ['Date', today],
            ['Status', 'Draft / In Review / Approved'],
          ]
        ),
        hr(),
        h2('Scope'),
        p('What is being tested? Link to the PRD or tech spec.'),
        h2('Out of Scope'),
        ul(''),
        h2('Test Approach'),
        table(
          ['Test type', 'Tool / Method', 'Owner', 'Coverage target'],
          [
            ['Unit tests', 'Jest / Vitest', '', '> 80%'],
            ['Integration tests', 'Jest + Supertest', '', ''],
            ['E2E tests', 'Playwright / Cypress', '', 'Happy path + 3 edge cases'],
            ['Performance tests', 'k6 / Locust', '', ''],
            ['Manual exploratory', '', 'QA', ''],
            ['Accessibility (a11y)', 'Axe / Lighthouse', '', 'WCAG 2.1 AA'],
          ]
        ),
        h2('Test Environment'),
        table(
          ['Environment', 'URL / Config', 'Who sets it up', 'Data reset policy'],
          [
            ['Local dev', '', '', ''],
            ['Staging', '', '', 'Reset every deploy'],
            ['Pre-prod', '', '', ''],
          ]
        ),
        h2('Test Cases'),
        table(
          ['TC #', 'Description', 'Steps', 'Expected result', 'Actual result', 'Pass / Fail'],
          [
            ['TC-01', '', '', '', '', ''],
            ['TC-02', '', '', '', '', ''],
            ['TC-03', '', '', '', '', ''],
            ['TC-04 (negative)', '', '', '', '', ''],
            ['TC-05 (edge case)', '', '', '', '', ''],
          ]
        ),
        h2('Acceptance Criteria'),
        tasks(
          'All P0 and P1 test cases pass',
          'No open Critical or High severity bugs',
          'Performance benchmarks met (P95 < X ms)',
          'No new a11y regressions',
          'Sign-off received from product owner',
        ),
        h2('Bug Tracking'),
        p('Bugs found during testing are logged in [Jira project / Linear / GitHub Issues]. Severity: Critical / High / Medium / Low.'),
        h2('Exit Criteria'),
        ul(
          'All test cases executed',
          'Pass rate ≥ 95%',
          'Zero open Critical bugs',
          'Product sign-off obtained',
        ),
        h2('Risks'),
        ul(''),
      ],
    },
  },

  // ── Architecture Brief ────────────────────────────────────────────────────
  {
    id: 'architecture-decision-brief',
    label: 'Architecture Brief',
    description: 'Lightweight pre-ADR to align stakeholders before a formal decision',
    icon: '🏗️',
    title: 'Architecture Brief',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Topic', ''],
            ['Author', ''],
            ['Date', today],
            ['Decision needed by', ''],
            ['Stakeholders', ''],
          ]
        ),
        hr(),
        blockquote('This is a lightweight alignment doc — not a full ADR. It\'s meant to surface options and trade-offs early so the team can converge before writing the formal decision record.'),
        h2('Problem Statement'),
        p('What technical problem are we solving? Why does it need to be solved now?'),
        h2('Constraints'),
        ul(
          'Must not break existing API contracts',
          'Must be deployable by [date]',
          'Budget constraint: …',
          'Team expertise: …',
        ),
        h2('Option A — [Name]'),
        p('Describe the approach.'),
        table(
          ['Pros', 'Cons'],
          [
            ['', ''],
            ['', ''],
          ]
        ),
        h2('Option B — [Name]'),
        p('Describe the approach.'),
        table(
          ['Pros', 'Cons'],
          [
            ['', ''],
            ['', ''],
          ]
        ),
        h2('Option C — [Name]'),
        p('Describe the approach.'),
        table(
          ['Pros', 'Cons'],
          [
            ['', ''],
            ['', ''],
          ]
        ),
        h2('Comparison Matrix'),
        table(
          ['Criterion', 'Weight', 'Option A', 'Option B', 'Option C'],
          [
            ['Performance', 'High', '', '', ''],
            ['Operational complexity', 'Medium', '', '', ''],
            ['Dev speed', 'Medium', '', '', ''],
            ['Cost', 'Low', '', '', ''],
            ['Team familiarity', 'High', '', '', ''],
          ]
        ),
        h2('Preliminary Recommendation'),
        p('Which option does the author lean toward and why? This is a starting position, not a final decision.'),
        h2('Open Questions for Discussion'),
        ul('', ''),
        h2('Next Step'),
        p('If the team agrees with the direction, a formal ADR will be written. Owner: ___. Target: ___.'),
      ],
    },
  },

  // ── SLA / SLO Doc ─────────────────────────────────────────────────────────
  {
    id: 'service-level-agreement',
    label: 'SLA / SLO Doc',
    description: 'Service level objectives, error budgets, and escalation paths',
    icon: '📡',
    title: 'SLA / SLO Document',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Service / Product', ''],
            ['Owner', ''],
            ['Effective Date', today],
            ['Review Cadence', 'Quarterly'],
            ['Stakeholders', ''],
          ]
        ),
        hr(),
        h2('Overview'),
        p('What service does this SLA/SLO cover? Who are the consumers (internal teams, external customers)?'),
        h2('Service Level Objectives (SLOs)'),
        table(
          ['Indicator (SLI)', 'Objective (SLO)', 'Measurement window', 'Data source'],
          [
            ['Availability', '99.9% uptime', 'Rolling 30 days', 'Uptime monitor'],
            ['Error rate', '< 0.1% 5xx errors', 'Rolling 7 days', 'APM / logs'],
            ['Latency (P95)', '< 300 ms', 'Rolling 7 days', 'APM'],
            ['Latency (P99)', '< 1 s', 'Rolling 7 days', 'APM'],
            ['Data freshness', '< 5 min lag', 'Real-time', 'Pipeline monitor'],
          ]
        ),
        h2('Error Budget'),
        table(
          ['SLO', 'Allowed downtime / errors (30 days)', 'Current burn rate', 'Status'],
          [
            ['99.9% availability', '43.8 min', '', '🟢 / 🟡 / 🔴'],
            ['Error rate < 0.1%', '', '', ''],
          ]
        ),
        h2('Error Budget Policy'),
        ul(
          'If error budget is > 50% consumed: increase monitoring cadence',
          'If error budget is > 75% consumed: freeze non-critical feature work, focus on reliability',
          'If error budget is exhausted: no new features until budget is restored',
        ),
        h2('Service Level Agreement (SLA — External Commitment)'),
        table(
          ['Metric', 'Commitment', 'Remedy if breached'],
          [
            ['Monthly uptime', '99.5%', 'Service credit: 10% of monthly fee per 0.1% below target'],
            ['Support response (P1)', '< 1 hour', ''],
            ['Support response (P2)', '< 4 hours', ''],
            ['Data retention', '90 days', ''],
          ]
        ),
        h2('Exclusions'),
        ul(
          'Scheduled maintenance windows (communicated ≥ 48h in advance)',
          'Force majeure events',
          'Customer-caused outages',
          'Third-party provider outages beyond our control',
        ),
        h2('Incident Escalation Path'),
        table(
          ['Severity', 'Definition', 'Response time', 'Escalation'],
          [
            ['P1 — Critical', 'Service down, all users affected', '15 min', 'On-call → VP Eng → CEO'],
            ['P2 — High', 'Major feature broken, many users affected', '1 hour', 'On-call → Eng Manager'],
            ['P3 — Medium', 'Degraded performance, partial impact', '4 hours', 'On-call engineer'],
            ['P4 — Low', 'Minor issue, workaround available', '1 business day', 'Support queue'],
          ]
        ),
        h2('Review & Reporting'),
        p('SLO performance is reported in the weekly engineering review and the monthly executive dashboard. The SLA is reviewed and renegotiated quarterly.'),
      ],
    },
  },

  // ── Product Vision ────────────────────────────────────────────────────────
  {
    id: 'product-vision',
    label: 'Product Vision',
    description: 'Long-term product vision, target user, and 3-year goals',
    icon: '🔭',
    title: 'Product Vision',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Product', ''],
            ['Author', ''],
            ['Date', today],
            ['Time Horizon', '3 years'],
          ]
        ),
        hr(),
        h2('Vision Statement'),
        blockquote('In [timeframe], [product] will be [aspiration]. We will achieve this by [approach], so that [customer outcome].'),
        h2('Mission (Why We Exist)'),
        p('One or two sentences on the core problem we exist to solve. This should not change much over time.'),
        h2('Target User'),
        table(
          ['Dimension', 'Description'],
          [
            ['Primary persona', ''],
            ['Role / Job title', ''],
            ['Company size / type', ''],
            ['Core job to be done', ''],
            ['Current pain', ''],
            ['Gain we deliver', ''],
          ]
        ),
        h2('The Problem We Solve'),
        p('What is the hair-on-fire problem that makes people seek us out?'),
        h2('Our Unique Insight'),
        blockquote('The insight most people miss that makes our approach uniquely effective.'),
        h2('3-Year Goals'),
        table(
          ['Goal', 'Metric', 'Target'],
          [
            ['Growth', '', ''],
            ['Retention', '', ''],
            ['Product breadth', '', ''],
            ['Market position', '', ''],
          ]
        ),
        h2('Strategic Bets'),
        ul(
          'Bet 1: …',
          'Bet 2: …',
          'Bet 3: …',
        ),
        h2('What We Are NOT'),
        ul(
          'We are not a …',
          'We will not compete on …',
          'We deliberately ignore …',
        ),
        h2('Competitive Moat'),
        p('What will make us hard to displace in 3 years?'),
        h2('Assumptions & Risks'),
        table(
          ['Assumption', 'If wrong, what happens?', 'How we will validate'],
          [
            ['', '', ''],
            ['', '', ''],
          ]
        ),
        h2('Revision History'),
        table(
          ['Date', 'Author', 'Change'],
          [
            [today, '', 'Initial draft'],
          ]
        ),
      ],
    },
  },

  // ── Pricing Strategy ──────────────────────────────────────────────────────
  {
    id: 'pricing-strategy',
    label: 'Pricing Strategy',
    description: 'Pricing model, tiers, rationale, and competitive positioning',
    icon: '💰',
    title: 'Pricing Strategy',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Product', ''],
            ['Author', ''],
            ['Date', today],
            ['Status', 'Draft / Approved / Live'],
          ]
        ),
        hr(),
        h2('Pricing Philosophy'),
        p('What is our core belief about how we should price? (e.g., value-based, cost-plus, competitor-led, usage-based)'),
        h2('Value Metric'),
        blockquote('The single unit of value we charge for — the thing customers get more of as they pay more. Example: seats, API calls, records, projects.'),
        pbold('Our value metric:'),
        pbold('Why this metric aligns incentives:'),
        h2('Pricing Model'),
        table(
          ['Plan', 'Price', 'Billing', 'Target segment', 'Value metric limit'],
          [
            ['Free', '$0', '—', '', ''],
            ['Starter', '$', 'Monthly / Annual', '', ''],
            ['Pro', '$', 'Monthly / Annual', '', ''],
            ['Enterprise', 'Custom', 'Annual', '', 'Unlimited'],
          ]
        ),
        h2('Plan Features Matrix'),
        table(
          ['Feature', 'Free', 'Starter', 'Pro', 'Enterprise'],
          [
            ['', '✓', '✓', '✓', '✓'],
            ['', '—', '✓', '✓', '✓'],
            ['', '—', '—', '✓', '✓'],
            ['', '—', '—', '—', '✓'],
          ]
        ),
        h2('Competitive Landscape'),
        table(
          ['Competitor', 'Price', 'Model', 'Positioning', 'Our advantage'],
          [
            ['', '', '', '', ''],
            ['', '', '', '', ''],
          ]
        ),
        h2('Unit Economics'),
        table(
          ['Metric', 'Value'],
          [
            ['CAC', ''],
            ['LTV', ''],
            ['LTV : CAC ratio', ''],
            ['Gross margin', ''],
            ['Payback period', ''],
          ]
        ),
        h2('Pricing Psychology'),
        ul(
          'Anchor: highlight Pro as the "recommended" plan',
          'Decoy: Starter makes Pro look like strong value',
          'Annual discount: 20% off to drive commitment and improve cash flow',
        ),
        h2('Discount & Exception Policy'),
        ul(
          'Non-profits / education: up to 50% off upon verification',
          'Startups (< $1M ARR): Starter price for Pro plan, 12 months',
          'Sales-negotiated discounts: require VP approval',
        ),
        h2('Open Questions'),
        ul('', ''),
        h2('Next Review'),
        pbold('Scheduled review date:'),
        pbold('Trigger for unscheduled review:'),
      ],
    },
  },

  // ── Feature Request ───────────────────────────────────────────────────────
  {
    id: 'feature-request',
    label: 'Feature Request',
    description: 'Structured intake form for new feature ideas from any source',
    icon: '💡',
    title: 'Feature Request',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Request Title', ''],
            ['Requested by', ''],
            ['Source', 'Customer / Sales / Internal / Support / Research'],
            ['Date Submitted', today],
            ['Priority', 'P0 / P1 / P2 / P3'],
            ['Status', 'Intake / Under Review / Planned / Declined'],
          ]
        ),
        hr(),
        h2('The Ask'),
        p('In one sentence: what does the requester want the product to do?'),
        h2('Problem / Job to Be Done'),
        p('What underlying problem is the user trying to solve? Describe the "job" — not the feature solution.'),
        blockquote('As a [user type], I need to [goal] so that [outcome]. Today I [current workaround or pain].'),
        h2('Who Is Affected?'),
        table(
          ['Segment', 'Number of accounts / users', 'Impact if not built'],
          [
            ['', '', 'Churn risk / friction / missed revenue'],
          ]
        ),
        h2('Evidence'),
        ul(
          'Customer quotes / Zendesk tickets: …',
          'Sales-blocking deals: …',
          'NPS / survey data: …',
          'Usage data: …',
        ),
        h2('Proposed Solution (Optional)'),
        p('If the requester has a specific solution in mind, describe it here. Product team is not obligated to build it exactly as described.'),
        h2('Success Criteria'),
        p('How will we know this solved the problem?'),
        h2('Dependencies / Constraints'),
        ul(''),
        h2('Product Team Notes'),
        p('Internal assessment, alternative approaches considered, and final decision.'),
        pbold('Decision:'),
        pbold('Rationale:'),
        pbold('Linked PRD / ticket:'),
      ],
    },
  },

  // ── Beta Program Plan ─────────────────────────────────────────────────────
  {
    id: 'beta-program',
    label: 'Beta Program Plan',
    description: 'Beta cohort setup, feedback loops, and graduation criteria',
    icon: '🔬',
    title: 'Beta Program Plan',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Feature / Product', ''],
            ['Beta Owner', ''],
            ['Beta Start Date', ''],
            ['Beta End Date', ''],
            ['GA Target Date', ''],
          ]
        ),
        hr(),
        h2('Goals'),
        ul(
          'Validate core use cases with real users before GA',
          'Surface usability and technical issues in a controlled environment',
          'Collect quantitative and qualitative evidence for GA decision',
        ),
        h2('Beta Cohort'),
        table(
          ['Criteria', 'Detail'],
          [
            ['Target size', ''],
            ['Customer profile', ''],
            ['Opt-in or invited?', ''],
            ['Plan / tier', ''],
            ['Geographic scope', ''],
          ]
        ),
        h2('Participant Accounts'),
        table(
          ['Account', 'Contact', 'Use case', 'Enrolled date', 'Status'],
          [
            ['', '', '', '', 'Active / Churned / Graduated'],
          ]
        ),
        h2('Beta Features Included'),
        table(
          ['Feature', 'Flag key', 'Notes'],
          [
            ['', '', ''],
          ]
        ),
        h2('Feedback Channels'),
        ul(
          'Dedicated Slack channel: #beta-[feature]',
          'Bi-weekly call with top participants',
          'In-product feedback widget',
          'Usage analytics via Mixpanel / Amplitude',
        ),
        h2('Feedback Tracker'),
        table(
          ['#', 'Feedback', 'Source', 'Category', 'Priority', 'Action', 'Status'],
          [
            ['1', '', '', 'Bug / UX / Feature ask', '', '', 'Open / Done'],
          ]
        ),
        h2('Key Metrics'),
        table(
          ['Metric', 'Baseline', 'Beta target', 'Actual'],
          [
            ['Activation rate', '', '', ''],
            ['Feature adoption (D7)', '', '', ''],
            ['Retention (W4)', '', '', ''],
            ['NPS / CSAT', '', '', ''],
            ['Error rate', '', '', ''],
          ]
        ),
        h2('GA Graduation Criteria'),
        tasks(
          'Activation rate ≥ X%',
          'D7 feature adoption ≥ X%',
          'No open P0 or P1 bugs',
          'Error rate < 0.1%',
          'NPS ≥ X from beta cohort',
          'Docs and help center content published',
          'CS / support team trained',
        ),
        h2('Go / No-Go Decision'),
        pbold('Decision date:'),
        pbold('Decision owner:'),
        pbold('Outcome:'),
      ],
    },
  },

  // ── Sales Call Notes ──────────────────────────────────────────────────────
  {
    id: 'sales-call-notes',
    label: 'Sales Call Notes',
    description: 'Pre-call prep, discovery questions, and post-call follow-up',
    icon: '📞',
    title: 'Sales Call Notes',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Account', ''],
            ['Contact(s)', ''],
            ['Call type', 'Discovery / Demo / Follow-up / Negotiation / Close'],
            ['Date & Time', today],
            ['AE / SDR', ''],
            ['Deal stage', ''],
            ['Deal value', ''],
          ]
        ),
        hr(),
        h2('Pre-Call Prep'),
        h3('Account Research'),
        ul(
          'Industry & company size:',
          'Recent news / events:',
          'Current tools (if known):',
          'LinkedIn profiles reviewed:',
        ),
        h3('Call Objective'),
        p('What is the single most important outcome we need from this call?'),
        h3('Key Questions to Ask'),
        ul(
          'What is the biggest challenge your team faces with [problem area] today?',
          'How are you currently solving this?',
          'What would success look like 6 months from now?',
          'Who else is involved in the decision?',
          'What is your timeline and budget?',
        ),
        hr(),
        h2('Call Notes'),
        h3('Attendees'),
        ul(''),
        h3('Their Situation'),
        p('What did they share about their current state, team, and pain points?'),
        h3('Pain Points Identified'),
        ul('', ''),
        h3('Goals & Desired Outcomes'),
        ul('', ''),
        h3('Decision Process'),
        table(
          ['Question', 'Answer'],
          [
            ['Decision maker(s)', ''],
            ['Budget confirmed?', ''],
            ['Timeline', ''],
            ['Competing solutions', ''],
            ['Blockers / concerns', ''],
          ]
        ),
        h3('Objections Raised'),
        ul(''),
        h3('Our Response to Objections'),
        ul(''),
        hr(),
        h2('Next Steps'),
        tasks(
          'Send follow-up email with [resource] — by [date]',
          'Schedule [next call type] — target [date]',
          'Send proposal / pricing — by [date]',
        ),
        h2('CRM Update'),
        pbold('Stage after this call:'),
        pbold('Close probability:'),
        pbold('Notes added to CRM:'),
      ],
    },
  },

  // ── Partnership Brief ─────────────────────────────────────────────────────
  {
    id: 'partnership-brief',
    label: 'Partnership Brief',
    description: 'Partner profile, goals, responsibilities, and success metrics',
    icon: '🤝',
    title: 'Partnership Brief',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Partner Company', ''],
            ['Partnership Type', 'Technology / Reseller / Referral / Co-marketing / Strategic'],
            ['Owner (Us)', ''],
            ['Owner (Partner)', ''],
            ['Start Date', today],
            ['Initial Term', ''],
            ['Status', 'Exploring / Negotiating / Active / Paused'],
          ]
        ),
        hr(),
        h2('Partner Overview'),
        p('Brief description of the partner — what they do, their market position, and why we are partnering.'),
        h2('Strategic Rationale'),
        ul(
          'Why this partner? Why now?',
          'What gap does this fill for us?',
          'What gap does this fill for them?',
        ),
        h2('Goals & Success Metrics'),
        table(
          ['Goal', 'Owner', 'Metric', 'Target (Year 1)'],
          [
            ['', 'Us', '', ''],
            ['', 'Partner', '', ''],
          ]
        ),
        h2('Roles & Responsibilities'),
        table(
          ['Activity', 'Us', 'Partner', 'Shared'],
          [
            ['Technical integration', '', '', ''],
            ['Joint go-to-market', '', '', ''],
            ['Content / co-marketing', '', '', ''],
            ['Support', '', '', ''],
            ['Revenue sharing', '', '', ''],
          ]
        ),
        h2('Integration / Technical Scope'),
        p('What technical work is required? APIs, data sharing, SSO, marketplace listing?'),
        h2('Commercial Terms'),
        table(
          ['Term', 'Detail'],
          [
            ['Revenue share model', ''],
            ['Referral fee', ''],
            ['Exclusivity', 'None / Category / Geography'],
            ['Termination notice', ''],
          ]
        ),
        h2('Go-to-Market Plan'),
        table(
          ['Activity', 'Date', 'Owner'],
          [
            ['Joint press release', '', ''],
            ['Partner listing on our site', '', ''],
            ['Co-authored content', '', ''],
            ['Joint webinar / event', '', ''],
          ]
        ),
        h2('Risks'),
        ul('', ''),
        h2('Review Cadence'),
        p('Quarterly business review (QBR) with partner. First review: [date].'),
      ],
    },
  },

  // ── Press Release ─────────────────────────────────────────────────────────
  {
    id: 'press-release',
    label: 'Press Release',
    description: 'Announcement draft in the classic inverted-pyramid format',
    icon: '📰',
    title: 'Press Release',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Embargo until', 'IMMEDIATE / [date & time]'],
            ['Contact', ''],
            ['Email', ''],
            ['Phone', ''],
          ]
        ),
        hr(),
        blockquote('FOR IMMEDIATE RELEASE'),
        h2('[Headline — Present tense, newsworthy, < 12 words]'),
        p('[Sub-headline — one sentence adding the key detail the headline omits]'),
        p('[CITY, STATE — Date] — [Company name], [brief descriptor], today announced [what]. [One sentence on why it matters to the reader]. This [product/partnership/milestone] [key benefit or impact].'),
        h2('Body'),
        p('[Second paragraph: context and background. What problem does this solve? Who benefits?]'),
        p('[Third paragraph: supporting detail — features, metrics, timeline, or scope. Keep factual.]'),
        h2('Executive Quote'),
        blockquote('"[Quote from CEO or senior exec — compelling, human, not marketing speak]," said [Name], [Title], [Company]. "[Second sentence adding context or vision.]"'),
        h2('Customer / Partner Quote (if applicable)'),
        blockquote('"[Quote from customer or partner]," said [Name], [Title], [Company].'),
        h2('Availability'),
        p('[Product / feature] is available [now / starting DATE] to [all customers / Pro tier / enterprise]. Pricing starts at [$X / custom]. [Link to landing page or documentation.]'),
        h2('About [Company]'),
        p('[Two-sentence boilerplate company description. Keep this evergreen — update it once, reuse it everywhere.]'),
        h2('###'),
        p('(Marks end of press release content)'),
        hr(),
        h2('Internal Notes (do not publish)'),
        ul(
          'Approved by legal: Yes / Pending',
          'Exec quotes approved by: …',
          'Embargo details shared with: …',
          'Distribution list: TechCrunch / VentureBeat / targeted journalists',
        ),
      ],
    },
  },

  // ── SEO Content Brief ─────────────────────────────────────────────────────
  {
    id: 'seo-brief',
    label: 'SEO Content Brief',
    description: 'Target keywords, search intent, outline, and success metrics',
    icon: '🔍',
    title: 'SEO Content Brief',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Article Title (Draft)', ''],
            ['Content Owner', ''],
            ['Editor', ''],
            ['Target Publish Date', ''],
            ['Status', 'Brief / Writing / Review / Live'],
          ]
        ),
        hr(),
        h2('Keyword Strategy'),
        table(
          ['Keyword type', 'Keyword', 'Monthly search volume', 'Difficulty', 'Current rank'],
          [
            ['Primary', '', '', '', ''],
            ['Secondary', '', '', '', ''],
            ['Secondary', '', '', '', ''],
            ['LSI / semantic', '', '', '', ''],
            ['LSI / semantic', '', '', '', ''],
          ]
        ),
        h2('Search Intent'),
        p('What does the searcher want to find or achieve? Informational / Navigational / Commercial / Transactional?'),
        p('Describe the searcher and what a satisfying result looks like for them.'),
        h2('Target Audience'),
        pbold('Persona:'),
        pbold('Pain point:'),
        pbold('What they know already:'),
        h2('SERP Analysis'),
        table(
          ['Competitor URL', 'DA', 'Word count', 'Format', 'Key angle', 'What we do better'],
          [
            ['', '', '', '', '', ''],
            ['', '', '', '', '', ''],
            ['', '', '', '', '', ''],
          ]
        ),
        h2('Content Angle'),
        p('What unique angle, data, or insight will make our article 10× better than what already ranks?'),
        h2('Recommended Outline'),
        ol(
          'H1: [Final title with primary keyword]',
          'Intro: hook + promise (100–150 words)',
          'H2: [Section 1]',
          'H2: [Section 2]',
          'H2: [Section 3]',
          'H2: [Section 4 — comparison / FAQ / common mistakes]',
          'Conclusion + CTA',
        ),
        h2('Target Specs'),
        table(
          ['Spec', 'Target'],
          [
            ['Word count', ''],
            ['Reading level', 'Grade 8–10'],
            ['Internal links', '3–5'],
            ['External links', '2–4 authoritative sources'],
            ['Images / visuals', ''],
            ['Meta title (< 60 chars)', ''],
            ['Meta description (< 160 chars)', ''],
          ]
        ),
        h2('CTA'),
        p('What should the reader do after reading? (e.g., start free trial, download guide, read next article)'),
        h2('Success Metrics'),
        table(
          ['Metric', 'Target (90 days)', 'Actual'],
          [
            ['Organic sessions/month', '', ''],
            ['Keyword rank (primary)', 'Top 10', ''],
            ['Click-through rate', '> 3%', ''],
            ['Avg. time on page', '> 3 min', ''],
            ['Conversions', '', ''],
          ]
        ),
      ],
    },
  },

  // ── Interview Scorecard ───────────────────────────────────────────────────
  {
    id: 'interview-scorecard',
    label: 'Interview Scorecard',
    description: 'Structured scoring rubric for evaluating candidates consistently',
    icon: '📋',
    title: 'Interview Scorecard',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Candidate', ''],
            ['Role', ''],
            ['Interview Stage', 'Phone screen / Technical / Cultural / Final / Panel'],
            ['Interviewer', ''],
            ['Date', today],
            ['Interview Duration', ''],
          ]
        ),
        hr(),
        blockquote('Score each dimension: 1 = Strong No Hire, 2 = Lean No Hire, 3 = Lean Hire, 4 = Strong Hire. Capture evidence — specific quotes and examples, not gut feelings.'),
        h2('Scoring'),
        table(
          ['Dimension', 'Weight', 'Score (1–4)', 'Evidence / Notes'],
          [
            ['Technical skills', 'High', '', ''],
            ['Problem-solving', 'High', '', ''],
            ['Communication', 'Medium', '', ''],
            ['Collaboration / teamwork', 'Medium', '', ''],
            ['Growth mindset / learning', 'Medium', '', ''],
            ['Culture add', 'Medium', '', ''],
            ['Role-specific competency', 'High', '', ''],
          ]
        ),
        h2('Strengths'),
        ul('', ''),
        h2('Concerns / Gaps'),
        ul('', ''),
        h2('Questions Asked & Answers'),
        table(
          ['Question', 'Candidate response summary', 'Assessment'],
          [
            ['', '', ''],
            ['', '', ''],
            ['', '', ''],
          ]
        ),
        h2('Overall Recommendation'),
        table(
          ['Option', 'Select'],
          [
            ['⭐⭐⭐⭐ Strong Hire', ''],
            ['⭐⭐⭐ Lean Hire', ''],
            ['⭐⭐ Lean No Hire', ''],
            ['⭐ Strong No Hire', ''],
          ]
        ),
        h2('Summary (2–3 sentences for hiring committee)'),
        p(''),
        h2('Open Questions for Next Round'),
        ul(''),
      ],
    },
  },

  // ── Team Health Check ─────────────────────────────────────────────────────
  {
    id: 'team-health-check',
    label: 'Team Health Check',
    description: 'Periodic team survey on collaboration, clarity, and morale',
    icon: '💚',
    title: 'Team Health Check',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Team', ''],
            ['Facilitator', ''],
            ['Date', today],
            ['Cadence', 'Monthly / Quarterly'],
            ['Participants', ''],
          ]
        ),
        hr(),
        blockquote('Rate each dimension: 🔴 Needs attention, 🟡 Okay but can improve, 🟢 Healthy. Add a short note explaining the score. Be honest — this is about improving, not impressing.'),
        h2('Health Dimensions'),
        table(
          ['Dimension', 'Score', 'What\'s going well', 'What needs improvement'],
          [
            ['Mission & Purpose — We know why our work matters', '', '', ''],
            ['Goals & Clarity — We know what we\'re working on and why', '', '', ''],
            ['Execution — We deliver what we commit to', '', '', ''],
            ['Collaboration — We work well together across functions', '', '', ''],
            ['Communication — We share information openly and on time', '', '', ''],
            ['Psychological safety — We can speak up without fear', '', '', ''],
            ['Quality — We are proud of what we ship', '', '', ''],
            ['Fun — We enjoy working together', '', '', ''],
          ]
        ),
        h2('What\'s Working Well?'),
        ul('', '', ''),
        h2('What\'s Holding Us Back?'),
        ul('', '', ''),
        h2('Top Actions We Will Take'),
        tasks(
          '',
          '',
          '',
        ),
        h2('Trend vs Last Check-in'),
        table(
          ['Dimension', 'Last score', 'This score', 'Trend'],
          [
            ['Mission & Purpose', '', '', '▲ / ▼ / →'],
            ['Goals & Clarity', '', '', ''],
            ['Execution', '', '', ''],
            ['Collaboration', '', '', ''],
            ['Communication', '', '', ''],
            ['Psychological safety', '', '', ''],
            ['Quality', '', '', ''],
            ['Fun', '', '', ''],
          ]
        ),
        h2('Notes'),
        p('Any context, major events, or external factors that affected scores this period.'),
      ],
    },
  },

  // ── Learning & Development Plan ────────────────────────────────────────────
  {
    id: 'learning-plan',
    label: 'Learning & Development Plan',
    description: 'Individual upskilling goals, resources, and check-in schedule',
    icon: '🎓',
    title: 'Learning & Development Plan',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Employee', ''],
            ['Role', ''],
            ['Manager', ''],
            ['Period', ''],
            ['Date Created', today],
          ]
        ),
        hr(),
        h2('Career Goal'),
        p('Where do you want to be in 1–2 years? What role or level are you working toward?'),
        h2('Current Strengths'),
        ul('', '', ''),
        h2('Development Areas'),
        ul('', '', ''),
        h2('Learning Goals'),
        table(
          ['Goal', 'Why important', 'Success criteria', 'Target date'],
          [
            ['', '', '', ''],
            ['', '', '', ''],
            ['', '', '', ''],
          ]
        ),
        h2('Learning Plan'),
        table(
          ['Skill / Topic', 'Activity', 'Resource / Link', 'Time commitment', 'Deadline', 'Status'],
          [
            ['', 'Course / Book / Project / Mentoring / Shadowing', '', '', '', 'Not started / In progress / Done'],
            ['', '', '', '', '', ''],
            ['', '', '', '', '', ''],
          ]
        ),
        h2('Stretch Assignments'),
        ul(
          'Project or initiative that will stretch existing skills:',
          'Cross-functional exposure opportunity:',
          'Leadership / ownership opportunity:',
        ),
        h2('Support Needed'),
        table(
          ['Support type', 'From whom', 'Notes'],
          [
            ['Budget for courses / conferences', 'Manager', ''],
            ['Time allocation (hours/week)', 'Manager', ''],
            ['Mentorship', '', ''],
            ['Sponsorship / visibility', '', ''],
          ]
        ),
        h2('Check-in Schedule'),
        table(
          ['Check-in', 'Date', 'Progress update', 'Adjustments'],
          [
            ['Mid-point', '', '', ''],
            ['End of period', '', '', ''],
          ]
        ),
        h2('Notes'),
        p(''),
      ],
    },
  },

  // ── Budget Plan ───────────────────────────────────────────────────────────
  {
    id: 'budget-plan',
    label: 'Budget Plan',
    description: 'Department budget request with headcount, tools, and spend breakdown',
    icon: '💵',
    title: 'Budget Plan',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Department', ''],
            ['Owner', ''],
            ['Fiscal Year / Period', ''],
            ['Submitted', today],
            ['Status', 'Draft / Submitted / Approved / Rejected'],
          ]
        ),
        hr(),
        h2('Executive Summary'),
        p('Total budget requested, top priorities, and expected business outcomes. Keep to 3–5 sentences.'),
        h2('Budget Summary'),
        table(
          ['Category', 'Last period actual', 'This period request', 'Change', 'Notes'],
          [
            ['Headcount (salaries + benefits)', '', '', '', ''],
            ['Contractors / freelancers', '', '', '', ''],
            ['Software / SaaS tools', '', '', '', ''],
            ['Infrastructure / cloud', '', '', '', ''],
            ['Travel & expenses', '', '', '', ''],
            ['Events & conferences', '', '', '', ''],
            ['Marketing / ads', '', '', '', ''],
            ['Training & development', '', '', '', ''],
            ['Miscellaneous', '', '', '', ''],
            ['TOTAL', '', '', '', ''],
          ]
        ),
        h2('Headcount Plan'),
        table(
          ['Role', 'Type', 'Start date', 'Annual cost', 'Justification'],
          [
            ['', 'FTE / Contract', '', '', ''],
          ]
        ),
        h2('Software & Tools'),
        table(
          ['Tool', 'Vendor', 'Annual cost', 'Users', 'Justification / ROI'],
          [
            ['', '', '', '', ''],
          ]
        ),
        h2('Key Investments & Justification'),
        p('For the top 3–5 spend items, explain the expected return or why cutting would hurt the business.'),
        ol('', '', ''),
        h2('What Is Not Funded in This Request'),
        ul(''),
        h2('Risks if Budget Is Not Approved'),
        ul('', ''),
        h2('Approval'),
        table(
          ['Approver', 'Role', 'Decision', 'Date'],
          [
            ['', 'Finance', '', ''],
            ['', 'VP / C-level', '', ''],
          ]
        ),
      ],
    },
  },

  // ── Vendor Evaluation ─────────────────────────────────────────────────────
  {
    id: 'vendor-evaluation',
    label: 'Vendor Evaluation',
    description: 'Side-by-side vendor comparison with scoring criteria',
    icon: '🏪',
    title: 'Vendor Evaluation',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Category / Use case', ''],
            ['Evaluator(s)', ''],
            ['Date', today],
            ['Decision by', ''],
            ['Budget', ''],
          ]
        ),
        hr(),
        h2('Requirements'),
        table(
          ['Requirement', 'Must-have / Nice-to-have', 'Weight (1–5)'],
          [
            ['', 'Must-have', ''],
            ['', 'Must-have', ''],
            ['', 'Nice-to-have', ''],
            ['', 'Nice-to-have', ''],
          ]
        ),
        h2('Vendors Evaluated'),
        ul('Vendor A:', 'Vendor B:', 'Vendor C:'),
        h2('Scoring Matrix'),
        table(
          ['Criterion', 'Weight', 'Vendor A', 'Vendor B', 'Vendor C'],
          [
            ['Core functionality', '30%', '', '', ''],
            ['Ease of use / UX', '15%', '', '', ''],
            ['Integration with our stack', '20%', '', '', ''],
            ['Security & compliance', '15%', '', '', ''],
            ['Pricing & total cost', '10%', '', '', ''],
            ['Support & SLA', '5%', '', '', ''],
            ['Vendor stability / roadmap', '5%', '', '', ''],
            ['WEIGHTED TOTAL', '100%', '', '', ''],
          ]
        ),
        h2('Vendor A — Detail'),
        table(
          ['Aspect', 'Notes'],
          [
            ['Pricing', ''],
            ['Key strengths', ''],
            ['Key weaknesses', ''],
            ['Contract terms', ''],
            ['References', ''],
          ]
        ),
        h2('Vendor B — Detail'),
        table(
          ['Aspect', 'Notes'],
          [
            ['Pricing', ''],
            ['Key strengths', ''],
            ['Key weaknesses', ''],
            ['Contract terms', ''],
            ['References', ''],
          ]
        ),
        h2('Vendor C — Detail'),
        table(
          ['Aspect', 'Notes'],
          [
            ['Pricing', ''],
            ['Key strengths', ''],
            ['Key weaknesses', ''],
            ['Contract terms', ''],
            ['References', ''],
          ]
        ),
        h2('Recommendation'),
        pbold('Recommended vendor:'),
        pbold('Rationale:'),
        pbold('Risk / mitigation:'),
        h2('Approval'),
        table(
          ['Approver', 'Role', 'Decision', 'Date'],
          [
            ['', '', 'Approved / Rejected', ''],
          ]
        ),
      ],
    },
  },

  // ── Statement of Work ─────────────────────────────────────────────────────
  {
    id: 'sow',
    label: 'Statement of Work',
    description: 'Project scope, deliverables, timeline, and payment terms',
    icon: '📃',
    title: 'Statement of Work',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Project Title', ''],
            ['Client / Partner', ''],
            ['Service Provider', ''],
            ['Effective Date', today],
            ['SOW Version', 'v1.0'],
          ]
        ),
        hr(),
        h2('1. Background & Purpose'),
        p('Brief description of the client\'s need and why this engagement is being initiated.'),
        h2('2. Scope of Work'),
        p('Detailed description of all work to be performed.'),
        h2('3. Deliverables'),
        table(
          ['Deliverable', 'Description', 'Format', 'Due Date', 'Acceptance Criteria'],
          [
            ['', '', '', '', ''],
            ['', '', '', '', ''],
            ['', '', '', '', ''],
          ]
        ),
        h2('4. Out of Scope'),
        ul(
          'Work explicitly not included in this SOW:',
          '',
        ),
        h2('5. Timeline & Milestones'),
        table(
          ['Phase', 'Description', 'Start', 'End', 'Key deliverable'],
          [
            ['1 — Discovery', '', '', '', ''],
            ['2 — Design', '', '', '', ''],
            ['3 — Development', '', '', '', ''],
            ['4 — Review & Revisions', '', '', '', ''],
            ['5 — Delivery & Sign-off', '', '', '', ''],
          ]
        ),
        h2('6. Roles & Responsibilities'),
        table(
          ['Responsibility', 'Service Provider', 'Client'],
          [
            ['Project management', '', ''],
            ['Technical delivery', '', ''],
            ['Content / assets', '', ''],
            ['Review & feedback', '', ''],
            ['Final sign-off', '', ''],
          ]
        ),
        h2('7. Assumptions & Dependencies'),
        ul(
          'Client will provide access to [systems / data] within [X] days of signing',
          'Client feedback will be provided within [X] business days',
          'Scope changes will be handled via a change order process',
        ),
        h2('8. Fees & Payment Terms'),
        table(
          ['Milestone / Period', 'Amount', 'Due Date', 'Payment Method'],
          [
            ['Kick-off deposit (30%)', '', '', ''],
            ['Mid-point (40%)', '', '', ''],
            ['Final delivery (30%)', '', '', ''],
          ]
        ),
        p('Late payments: invoices unpaid after [X] days accrue interest at [X]% per month.'),
        h2('9. Change Order Process'),
        p('Any change to scope, deliverables, or timeline must be agreed in writing via a signed change order before work begins. Changes may affect timeline and cost.'),
        h2('10. Confidentiality & IP'),
        p('All work product created under this SOW is owned by [Client / Service Provider] upon full payment. Both parties agree to keep each other\'s confidential information private.'),
        h2('11. Signatures'),
        table(
          ['Party', 'Name', 'Title', 'Signature', 'Date'],
          [
            ['Service Provider', '', '', '', ''],
            ['Client', '', '', '', ''],
          ]
        ),
      ],
    },
  },

  // ── Troubleshooting Guide ─────────────────────────────────────────────────
  {
    id: 'troubleshooting-guide',
    label: 'Troubleshooting Guide',
    description: 'Symptom → cause → fix format for support and ops teams',
    icon: '🔧',
    title: 'Troubleshooting Guide',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['System / Feature', ''],
            ['Author', ''],
            ['Last Updated', today],
            ['Audience', 'Support / On-call / End users'],
          ]
        ),
        hr(),
        blockquote('Use this guide when [system/feature] is behaving unexpectedly. Start at the top — each section covers one symptom category. Each symptom has likely causes and step-by-step fixes. Escalation path is at the bottom.'),
        h2('Quick Diagnostics'),
        p('Run these checks first before diving into specific symptoms.'),
        tasks(
          'Is the service showing healthy in the status page / monitoring dashboard?',
          'Were there any recent deployments in the last 2 hours?',
          'Is the issue affecting all users or a subset?',
          'Is there an active incident? Check #incidents Slack channel.',
        ),
        h2('Symptom 1: [e.g., Users cannot log in]'),
        h3('Possible Causes'),
        ul(
          'Auth service is down',
          'Database connection pool exhausted',
          'Invalid or expired session token handling',
        ),
        h3('Steps to Fix'),
        ol(
          'Check auth service health: [monitoring link]',
          'Check error logs: [log query or command]',
          'Verify database connections: [command]',
          'If auth service is down, trigger restart: [command / runbook link]',
          'If database: follow [DB runbook link]',
        ),
        h2('Symptom 2: [e.g., Slow page loads]'),
        h3('Possible Causes'),
        ul(
          'Cache miss storm after deployment',
          'Unoptimized query running against large dataset',
          'CDN misconfiguration',
        ),
        h3('Steps to Fix'),
        ol(
          'Check P95 latency in APM: [link]',
          'Identify slow queries in [slow query log / New Relic / Datadog]',
          'Check cache hit rate: [command]',
          'If CDN: purge cache and verify origin response time',
        ),
        h2('Symptom 3: [e.g., Data not appearing / stale data]'),
        h3('Possible Causes'),
        ul(
          'Background job / worker has stopped',
          'Replication lag',
          'Feature flag misconfiguration',
        ),
        h3('Steps to Fix'),
        ol(
          'Check background job queue status: [command]',
          'Check replication lag: [command]',
          'Verify feature flags for affected account: [link]',
        ),
        h2('Symptom 4: [Add your own]'),
        h3('Possible Causes'),
        ul(''),
        h3('Steps to Fix'),
        ol(''),
        h2('Escalation Path'),
        table(
          ['If you cannot resolve within', 'Escalate to', 'Via'],
          [
            ['15 min (P1)', 'On-call engineer', 'PagerDuty / Phone'],
            ['1 hour (P2)', 'Engineering Manager', 'Slack DM'],
            ['4 hours (P3)', 'Support queue', 'Jira ticket'],
          ]
        ),
        h2('Useful Links'),
        ul(
          'Monitoring dashboard: …',
          'Log aggregation: …',
          'Incident runbook: …',
          'Status page: …',
        ),
      ],
    },
  },

  // ── Knowledge Transfer ────────────────────────────────────────────────────
  {
    id: 'knowledge-transfer',
    label: 'Knowledge Transfer',
    description: 'Capture institutional knowledge when someone transitions off a project',
    icon: '🧠',
    title: 'Knowledge Transfer',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Subject Matter Expert (leaving / transitioning)', ''],
            ['Incoming Owner / Team', ''],
            ['Project / Domain', ''],
            ['Transition Date', ''],
            ['Document Date', today],
          ]
        ),
        hr(),
        blockquote('Goal: ensure the incoming owner can operate independently within [X] weeks. Cover the things not written anywhere else — the tribal knowledge, quirks, and undocumented decisions.'),
        h2('Overview'),
        p('What is this system / project / area? What does it do and why does it exist?'),
        h2('Key Responsibilities'),
        table(
          ['Responsibility', 'Frequency', 'How to do it', 'Docs / links'],
          [
            ['', 'Daily / Weekly / Monthly / On-demand', '', ''],
            ['', '', '', ''],
            ['', '', '', ''],
          ]
        ),
        h2('Critical Systems & Access'),
        table(
          ['System', 'URL / location', 'Access request process', 'Notes'],
          [
            ['', '', '', ''],
            ['', '', '', ''],
          ]
        ),
        h2('Architecture & Design Decisions'),
        p('What key technical or product decisions were made, and why? What would surprise a newcomer?'),
        ul('', '', ''),
        h2('Known Issues & Technical Debt'),
        table(
          ['Issue', 'Severity', 'Workaround', 'Ticket / owner'],
          [
            ['', '', '', ''],
            ['', '', '', ''],
          ]
        ),
        h2('Recurring Incidents & How to Handle Them'),
        table(
          ['Incident type', 'Frequency', 'Root cause', 'Resolution steps'],
          [
            ['', '', '', ''],
            ['', '', '', ''],
          ]
        ),
        h2('Key Stakeholders & Relationships'),
        table(
          ['Person / Team', 'Role', 'How they interact with this area', 'Notes / preferences'],
          [
            ['', '', '', ''],
            ['', '', '', ''],
          ]
        ),
        h2('Processes & Rituals'),
        ul(
          'Weekly: …',
          'Monthly: …',
          'Quarterly: …',
          'On each release: …',
        ),
        h2('What I Would Do Differently'),
        p('Honest reflections — what to avoid, what to prioritize, what I wish I had known on day one.'),
        h2('Handover Checklist'),
        tasks(
          'All access and credentials transferred',
          'Recurring calendar invites reassigned',
          'Stakeholders notified of ownership change',
          'On-call rotation updated',
          'Documentation reviewed and updated',
          'Shadow sessions completed',
          'Incoming owner has run [key workflow] independently at least once',
          'Formal handover signed off',
        ),
        h2('Open Questions'),
        ul(''),
      ],
    },
  },

  // ── Project Overview ──────────────────────────────────────────────────────
  {
    id: 'project-overview',
    label: 'Project Overview',
    description: 'Single source of truth: what, why, who, status, and links',
    icon: '🗂️',
    title: 'Project Overview',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Project Name', ''],
            ['Status', '🟢 On Track / 🟡 At Risk / 🔴 Off Track / ✅ Complete'],
            ['Start Date', today],
            ['Target End Date', ''],
            ['Project Lead', ''],
            ['Sponsor / Stakeholder', ''],
            ['Last Updated', today],
          ]
        ),
        hr(),
        h2('What Is This Project?'),
        p('One paragraph describing what this project is and what it will deliver.'),
        h2('Why Are We Doing This?'),
        p('The business reason, customer need, or strategic goal driving this project.'),
        h2('Goals & Success Criteria'),
        table(
          ['Goal', 'How We Measure Success', 'Target'],
          [
            ['', '', ''],
            ['', '', ''],
          ]
        ),
        h2('Scope'),
        table(
          ['In Scope', 'Out of Scope'],
          [
            ['', ''],
            ['', ''],
          ]
        ),
        h2('The Team'),
        table(
          ['Name', 'Role', 'Responsibilities', 'Time commitment'],
          [
            ['', 'Project Lead', '', '100%'],
            ['', 'Engineering', '', ''],
            ['', 'Design', '', ''],
            ['', 'QA', '', ''],
            ['', 'Stakeholder', '', 'Review only'],
          ]
        ),
        h2('Key Milestones'),
        table(
          ['Milestone', 'Target Date', 'Status', 'Owner'],
          [
            ['Kickoff', today, '✅ Done', ''],
            ['Design complete', '', '🔵 In Progress', ''],
            ['Development complete', '', '⬜ Planned', ''],
            ['Testing complete', '', '⬜ Planned', ''],
            ['Launch', '', '⬜ Planned', ''],
          ]
        ),
        h2('Current Status Summary'),
        p('What is the latest update? What is happening this week?'),
        h2('Risks & Issues'),
        table(
          ['Risk / Issue', 'Impact', 'Mitigation / Action', 'Owner'],
          [
            ['', 'High / Medium / Low', '', ''],
          ]
        ),
        h2('Key Links & Resources'),
        ul(
          'Jira board: …',
          'Figma designs: …',
          'Tech spec: …',
          'Slack channel: …',
          'Status report: …',
        ),
      ],
    },
  },

  // ── Project Status Report ─────────────────────────────────────────────────
  {
    id: 'project-status-report',
    label: 'Project Status Report',
    description: 'Weekly/bi-weekly update: done, in progress, next, blockers',
    icon: '📊',
    title: 'Project Status Report',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Project', ''],
            ['Report Period', ''],
            ['Prepared by', ''],
            ['Date', today],
            ['Overall Status', '🟢 On Track / 🟡 At Risk / 🔴 Off Track'],
          ]
        ),
        hr(),
        h2('Executive Summary'),
        p('2–3 sentences: overall health, biggest win this period, and top concern.'),
        h2('Status by Workstream'),
        table(
          ['Workstream', 'Status', 'Summary', 'Owner'],
          [
            ['Engineering', '🟢', '', ''],
            ['Design', '🟢', '', ''],
            ['QA', '🟡', '', ''],
            ['Go-to-market', '⬜ Not started', '', ''],
          ]
        ),
        h2('✅ Completed This Period'),
        ul('', '', ''),
        h2('🔵 In Progress'),
        table(
          ['Item', 'Owner', 'Est. completion', 'Notes'],
          [
            ['', '', '', ''],
            ['', '', '', ''],
          ]
        ),
        h2('📋 Planned Next Period'),
        ul('', '', ''),
        h2('🚧 Blockers & Issues'),
        table(
          ['Blocker', 'Impact', 'Owner', 'Due', 'Status'],
          [
            ['', 'High / Medium / Low', '', '', 'Open / Resolved'],
          ]
        ),
        h2('⚠️ Risks'),
        table(
          ['Risk', 'Likelihood', 'Impact', 'Mitigation'],
          [
            ['', 'High / Medium / Low', 'High / Medium / Low', ''],
          ]
        ),
        h2('📅 Milestone Tracker'),
        table(
          ['Milestone', 'Original Date', 'Revised Date', 'Status'],
          [
            ['', '', '', '✅ Done / 🔵 In Progress / ⬜ Not Started / 🔴 Delayed'],
          ]
        ),
        h2('Decisions Made This Period'),
        ul(''),
        h2('Decisions Needed'),
        ul(''),
        h2('Key Metrics'),
        table(
          ['Metric', 'Last Period', 'This Period', 'Trend'],
          [
            ['', '', '', '▲ / ▼ / →'],
          ]
        ),
      ],
    },
  },

  // ── Action Plan ───────────────────────────────────────────────────────────
  {
    id: 'action-plan',
    label: 'Action Plan',
    description: 'Steps to proceed, owners, deadlines, and progress tracking',
    icon: '⚡',
    title: 'Action Plan',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Objective', ''],
            ['Owner', ''],
            ['Start Date', today],
            ['Target Completion', ''],
            ['Status', 'Not started / In progress / Complete'],
          ]
        ),
        hr(),
        h2('Objective'),
        p('What are we trying to achieve with this action plan? What does "done" look like?'),
        h2('Background'),
        p('Why is this needed? What triggered this plan?'),
        h2('Action Items'),
        table(
          ['#', 'Action', 'Owner', 'Due Date', 'Priority', 'Status', 'Notes'],
          [
            ['1', '', '', '', 'P0', 'Not started', ''],
            ['2', '', '', '', 'P0', 'Not started', ''],
            ['3', '', '', '', 'P1', 'Not started', ''],
            ['4', '', '', '', 'P1', 'Not started', ''],
            ['5', '', '', '', 'P2', 'Not started', ''],
          ]
        ),
        h2('Phase Breakdown'),
        h3('Phase 1 — Immediate (This Week)'),
        tasks('', '', ''),
        h3('Phase 2 — Short Term (This Month)'),
        tasks('', '', ''),
        h3('Phase 3 — Medium Term (This Quarter)'),
        tasks('', '', ''),
        h2('Dependencies'),
        table(
          ['Action', 'Depends on', 'Blocked until'],
          [
            ['', '', ''],
          ]
        ),
        h2('Resources Required'),
        table(
          ['Resource', 'Type', 'Needed by', 'Status'],
          [
            ['', 'Budget / Headcount / Tool / Access', '', 'Available / Requested / Pending'],
          ]
        ),
        h2('Progress Log'),
        table(
          ['Date', 'Update', 'By'],
          [
            [today, 'Plan created', ''],
          ]
        ),
      ],
    },
  },

  // ── How to Proceed ────────────────────────────────────────────────────────
  {
    id: 'how-to-proceed',
    label: 'How to Proceed',
    description: 'Step-by-step playbook for getting something started or unstuck',
    icon: '▶️',
    title: 'How to Proceed',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Topic / Situation', ''],
            ['Author', ''],
            ['Audience', ''],
            ['Last Updated', today],
          ]
        ),
        hr(),
        h2('Situation Summary'),
        p('What is the current situation? Why does a "how to proceed" document exist for this?'),
        h2('Goal'),
        p('What does a successful outcome look like?'),
        h2('Prerequisites'),
        p('What must be true before starting? What access, approvals, or information is needed?'),
        tasks(
          'Access to [system / data / repo]',
          'Approval from [stakeholder]',
          'Understanding of [background document — link]',
        ),
        h2('Step-by-Step Guide'),
        h3('Step 1 — [Name]'),
        p('What to do. Be specific. Who does it.'),
        ul(
          'Sub-step A',
          'Sub-step B',
        ),
        h3('Step 2 — [Name]'),
        p(''),
        h3('Step 3 — [Name]'),
        p(''),
        h3('Step 4 — [Name]'),
        p(''),
        h3('Step 5 — [Name]'),
        p(''),
        h2('Decision Points'),
        table(
          ['If…', 'Then…', 'Who decides'],
          [
            ['', '', ''],
            ['', '', ''],
          ]
        ),
        h2('Common Mistakes to Avoid'),
        ul('', '', ''),
        h2('Definition of Done'),
        tasks('', '', ''),
        h2('Who to Contact if Stuck'),
        table(
          ['Topic', 'Person', 'How to reach'],
          [
            ['', '', 'Slack / Email / Jira'],
          ]
        ),
      ],
    },
  },

  // ── What Has Been Done ────────────────────────────────────────────────────
  {
    id: 'work-done-summary',
    label: 'Work Done Summary',
    description: 'Running log of completed work, decisions, and outcomes',
    icon: '✅',
    title: 'Work Done Summary',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Project / Initiative', ''],
            ['Period Covered', ''],
            ['Author', ''],
            ['Last Updated', today],
          ]
        ),
        hr(),
        h2('Overview'),
        p('Brief description of the project and what this document captures.'),
        h2('Summary of Work Completed'),
        table(
          ['Area', 'Summary of work done', 'Impact / outcome'],
          [
            ['', '', ''],
            ['', '', ''],
          ]
        ),
        h2('Completed Milestones'),
        table(
          ['Milestone', 'Completed Date', 'Owner', 'Notes'],
          [
            ['', '', '', ''],
            ['', '', '', ''],
          ]
        ),
        h2('Detailed Activity Log'),
        table(
          ['Date', 'Activity', 'Owner', 'Outcome / Result'],
          [
            [today, '', '', ''],
            ['', '', '', ''],
            ['', '', '', ''],
          ]
        ),
        h2('Key Decisions Made'),
        table(
          ['Date', 'Decision', 'Rationale', 'Made by'],
          [
            ['', '', '', ''],
          ]
        ),
        h2('Metrics & Results'),
        table(
          ['Metric', 'Before', 'After', 'Change'],
          [
            ['', '', '', ''],
            ['', '', '', ''],
          ]
        ),
        h2('What Was Learned'),
        ul('', '', ''),
        h2('What Is Still Pending'),
        table(
          ['Item', 'Owner', 'Expected by', 'Blocker'],
          [
            ['', '', '', ''],
          ]
        ),
        h2('Links & Artefacts Produced'),
        ul(
          'Designs: …',
          'Code / repo: …',
          'Reports: …',
          'Tickets: …',
        ),
      ],
    },
  },

  // ── Project Retrospective ─────────────────────────────────────────────────
  {
    id: 'project-retro',
    label: 'Project Retrospective',
    description: 'End-of-project review: outcomes, process, and lessons learned',
    icon: '🔄',
    title: 'Project Retrospective',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Project', ''],
            ['Duration', ''],
            ['Facilitator', ''],
            ['Attendees', ''],
            ['Date', today],
          ]
        ),
        hr(),
        h2('Project Summary'),
        table(
          ['Field', 'Details'],
          [
            ['Original goal', ''],
            ['Actual outcome', ''],
            ['Delivered on time?', 'Yes / No / Partially'],
            ['Delivered on budget?', 'Yes / No / Partially'],
            ['Delivered on scope?', 'Yes / No / Partially'],
          ]
        ),
        h2('What Did We Set Out to Do?'),
        p('Briefly restate the original goals and success criteria.'),
        h2('What Did We Actually Achieve?'),
        p('What was delivered? What was cut or deferred?'),
        h2('🟢 What Went Well?'),
        ul('', '', '', ''),
        h2('🔴 What Did Not Go Well?'),
        ul('', '', '', ''),
        h2('🟡 What Was Surprising?'),
        ul('', ''),
        h2('Root Cause Analysis (for key failures)'),
        table(
          ['Problem', 'Root Cause', 'Contributing factors'],
          [
            ['', '', ''],
            ['', '', ''],
          ]
        ),
        h2('Key Lessons Learned'),
        table(
          ['Lesson', 'Category', 'Apply to future projects how?'],
          [
            ['', 'Process / Tech / Team / Planning', ''],
            ['', '', ''],
            ['', '', ''],
          ]
        ),
        h2('Action Items for Next Time'),
        tasks('', '', '', ''),
        h2('Team Recognition'),
        p('Call out individuals or moments that made a difference.'),
        h2('Final Verdict'),
        table(
          ['Dimension', 'Score (1–5)', 'Comments'],
          [
            ['Project outcome quality', '', ''],
            ['Team collaboration', '', ''],
            ['Process & planning', '', ''],
            ['Communication', '', ''],
            ['Overall', '', ''],
          ]
        ),
      ],
    },
  },

  // ── Team Page ─────────────────────────────────────────────────────────────
  {
    id: 'team-page',
    label: 'Team Page',
    description: 'Who is on the team, what they do, and how to reach them',
    icon: '👋',
    title: 'Team Page',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Team Name', ''],
            ['Team Lead', ''],
            ['Department', ''],
            ['Location(s)', ''],
            ['Last Updated', today],
          ]
        ),
        hr(),
        h2('What We Do'),
        p('One paragraph describing the team\'s mission, what it owns, and who it serves.'),
        h2('Team Mission'),
        blockquote('Our mission is to [achieve X] for [audience Y] so that [outcome Z].'),
        h2('What We Own'),
        ul('', '', ''),
        h2('Team Members'),
        table(
          ['Name', 'Role / Title', 'Location / Timezone', 'Slack', 'Email', 'Focus area'],
          [
            ['', 'Team Lead', '', '', '', ''],
            ['', '', '', '', '', ''],
            ['', '', '', '', '', ''],
            ['', '', '', '', '', ''],
          ]
        ),
        h2('How We Work'),
        table(
          ['Practice', 'Details'],
          [
            ['Standups', 'Daily at [time] on [Slack / Zoom]'],
            ['Sprint cycle', '2 weeks — Mon start, Fri demo'],
            ['Planning', 'Every other Monday, 1 hour'],
            ['Retrospective', 'Last Friday of sprint'],
            ['1:1s', 'Weekly, manager with each team member'],
            ['Team sync', 'Weekly — Wednesdays at [time]'],
          ]
        ),
        h2('Our Channels'),
        table(
          ['Channel', 'Purpose'],
          [
            ['#[team-name]', 'Main team channel'],
            ['#[team-name]-alerts', 'Automated alerts and monitoring'],
            ['#[team-name]-announcements', 'Important updates from team lead'],
          ]
        ),
        h2('Ways of Working'),
        ul(
          'We default to async communication',
          'We document decisions in this wiki',
          'We use [Jira / Linear / Notion] for task tracking',
          'Oncall rotation: see [link]',
        ),
        h2('Team Principles'),
        ol('', '', ''),
        h2('Useful Links'),
        ul(
          'Roadmap: …',
          'Sprint board: …',
          'On-call schedule: …',
          'Architecture docs: …',
        ),
      ],
    },
  },

  // ── Team Directory ────────────────────────────────────────────────────────
  {
    id: 'team-directory',
    label: 'Team Directory',
    description: 'Full HR team listing with roles, skills, location, and contact',
    icon: '📒',
    title: 'Team Directory',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Organization / Department', ''],
            ['Total Headcount', ''],
            ['HR Owner', ''],
            ['Last Updated', today],
          ]
        ),
        hr(),
        h2('Leadership'),
        table(
          ['Name', 'Title', 'Department', 'Location', 'Email', 'Slack', 'Start Date'],
          [
            ['', 'CEO', '', '', '', '', ''],
            ['', 'CTO', '', '', '', '', ''],
            ['', 'COO', '', '', '', '', ''],
            ['', 'CPO', '', '', '', '', ''],
          ]
        ),
        h2('Engineering'),
        table(
          ['Name', 'Title', 'Team', 'Location', 'Email', 'Slack', 'Skills'],
          [
            ['', '', '', '', '', '', ''],
          ]
        ),
        h2('Product & Design'),
        table(
          ['Name', 'Title', 'Team', 'Location', 'Email', 'Slack', 'Focus area'],
          [
            ['', '', '', '', '', '', ''],
          ]
        ),
        h2('Sales & Marketing'),
        table(
          ['Name', 'Title', 'Region', 'Location', 'Email', 'Slack', 'Quota / Focus'],
          [
            ['', '', '', '', '', '', ''],
          ]
        ),
        h2('Operations & Finance'),
        table(
          ['Name', 'Title', 'Function', 'Location', 'Email', 'Slack'],
          [
            ['', '', '', '', '', ''],
          ]
        ),
        h2('People & HR'),
        table(
          ['Name', 'Title', 'Function', 'Location', 'Email', 'Slack'],
          [
            ['', '', '', '', '', ''],
          ]
        ),
        h2('Contractors & Vendors'),
        table(
          ['Name / Company', 'Role', 'Engagement type', 'Contact', 'Contract end'],
          [
            ['', '', 'Contractor / Agency / Advisor', '', ''],
          ]
        ),
        h2('Alumni (Recent Departures)'),
        table(
          ['Name', 'Former role', 'Last day', 'LinkedIn'],
          [
            ['', '', '', ''],
          ]
        ),
        h2('How to Update This Page'),
        p('Submit changes to [HR owner / People Ops via Slack / email]. Updated within 48 hours of any change.'),
      ],
    },
  },

  // ── Salary Bands ─────────────────────────────────────────────────────────
  {
    id: 'salary-bands',
    label: 'Salary Bands',
    description: 'Compensation framework with levels, bands, and equity guidelines',
    icon: '💰',
    title: 'Salary Bands & Compensation Framework',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Company', ''],
            ['Owner', 'People / HR'],
            ['Effective Date', today],
            ['Review Cadence', 'Annual (Q1)'],
            ['Status', 'Draft / Approved / Live'],
            ['Confidentiality', '🔒 Internal — do not share externally'],
          ]
        ),
        hr(),
        h2('Philosophy'),
        p('How we think about compensation: market positioning, pay equity, total rewards.'),
        ul(
          'We target the [50th / 75th] percentile of [market benchmark — Radford / Levels.fyi / Carta]',
          'We pay for scope and impact, not tenure',
          'Equity is a meaningful part of total compensation at all levels',
          'Salary bands are reviewed annually and adjusted for market movement',
        ),
        h2('Leveling Framework'),
        table(
          ['Level', 'Title', 'Scope', 'Autonomy', 'Example behaviors'],
          [
            ['L1', 'Associate / Junior', 'Individual tasks', 'Guided', 'Learns foundations, completes defined work'],
            ['L2', 'Mid-level', 'Projects', 'Some independence', 'Owns features end-to-end with limited supervision'],
            ['L3', 'Senior', 'Cross-team projects', 'Independent', 'Sets technical / domain direction for a team'],
            ['L4', 'Staff / Lead', 'Org-wide impact', 'Drives', 'Defines strategy across multiple teams'],
            ['L5', 'Principal / Director', 'Company-wide', 'Sets direction', 'Shapes company strategy and org design'],
            ['L6', 'VP / C-suite', 'External / Board', 'Full ownership', 'Accountable to board / investors'],
          ]
        ),
        h2('Salary Bands — Engineering'),
        table(
          ['Level', 'Title', 'Band Min', 'Band Mid', 'Band Max', 'Notes'],
          [
            ['L1', 'Junior Engineer', '$', '$', '$', ''],
            ['L2', 'Engineer', '$', '$', '$', ''],
            ['L3', 'Senior Engineer', '$', '$', '$', ''],
            ['L4', 'Staff Engineer', '$', '$', '$', ''],
            ['L5', 'Principal Engineer', '$', '$', '$', ''],
          ]
        ),
        h2('Salary Bands — Product & Design'),
        table(
          ['Level', 'Title', 'Band Min', 'Band Mid', 'Band Max'],
          [
            ['L2', 'Product Manager', '$', '$', '$'],
            ['L3', 'Senior PM', '$', '$', '$'],
            ['L4', 'Group PM / Lead Designer', '$', '$', '$'],
            ['L5', 'Director of Product', '$', '$', '$'],
          ]
        ),
        h2('Salary Bands — Sales & Marketing'),
        table(
          ['Level', 'Title', 'Base Min', 'Base Max', 'OTE (with commission)'],
          [
            ['L2', 'Account Executive', '$', '$', '$'],
            ['L3', 'Senior AE', '$', '$', '$'],
            ['L4', 'Sales Manager', '$', '$', '$'],
          ]
        ),
        h2('Equity Guidelines'),
        table(
          ['Level', 'New hire grant (options / RSUs)', 'Cliff', 'Vesting schedule', 'Refresh grants'],
          [
            ['L1', '', '1 year', '4 years monthly', 'Annual, performance-based'],
            ['L2', '', '1 year', '4 years monthly', ''],
            ['L3', '', '1 year', '4 years monthly', ''],
            ['L4', '', '1 year', '4 years monthly', ''],
            ['L5', '', '1 year', '4 years monthly', ''],
          ]
        ),
        h2('Bonus & Variable Pay'),
        table(
          ['Level', 'Target bonus (% of base)', 'Based on'],
          [
            ['L1–L2', '0–5%', 'Company performance'],
            ['L3', '5–10%', 'Company + individual performance'],
            ['L4–L5', '10–20%', 'Company + team + individual'],
            ['L6', '20–50%', 'Board-set targets'],
          ]
        ),
        h2('Benefits Summary'),
        ul(
          'Health: Medical, dental, vision — [details]',
          'Retirement: [401k / pension] — company match: [X]%',
          'PTO: [X] days + [X] sick days + public holidays',
          'Parental leave: [X] weeks paid',
          'Learning & development budget: $[X]/year',
          'Home office / equipment stipend: $[X]',
          'Wellness benefit: $[X]/month',
        ),
        h2('Pay Review Process'),
        ol(
          'Annual review window: [month]',
          'Managers submit recommendations via [system]',
          'HR calibration review',
          'Finance approval for total budget',
          'Employees notified by [month]',
          'Effective date: [date]',
        ),
      ],
    },
  },

  // ── Compensation Review ────────────────────────────────────────────────────
  {
    id: 'compensation-review',
    label: 'Compensation Review',
    description: 'Annual pay review: recommendations, calibration, and outcomes',
    icon: '📈',
    title: 'Compensation Review',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Cycle', 'Annual / Mid-year'],
            ['Period', ''],
            ['HR Owner', ''],
            ['Date', today],
            ['Status', 'Planning / Manager review / Calibration / Approved / Communicated'],
            ['Confidentiality', '🔒 Manager+ only'],
          ]
        ),
        hr(),
        h2('Process Overview'),
        ol(
          'Managers submit recommendations in [system] by [date]',
          'HR reviews for equity and band compliance by [date]',
          'Finance approves total budget by [date]',
          'Calibration meeting with leadership by [date]',
          'Letters issued to employees by [date]',
          'Effective date: [date]',
        ),
        h2('Budget'),
        table(
          ['Department', 'Headcount', 'Budget allocated', 'Budget used', 'Variance'],
          [
            ['Engineering', '', '', '', ''],
            ['Product & Design', '', '', '', ''],
            ['Sales', '', '', '', ''],
            ['Marketing', '', '', '', ''],
            ['Operations', '', '', '', ''],
            ['Total', '', '', '', ''],
          ]
        ),
        h2('Recommendations'),
        table(
          ['Employee', 'Level', 'Current salary', 'Recommended salary', 'Increase %', 'Rationale', 'Equity refresh', 'Status'],
          [
            ['', '', '$', '$', '', 'Merit / Promotion / Market adj.', '', 'Pending / Approved'],
          ]
        ),
        h2('Promotions This Cycle'),
        table(
          ['Employee', 'From level', 'To level', 'Effective date', 'Salary change', 'Equity refresh'],
          [
            ['', '', '', '', '', ''],
          ]
        ),
        h2('Calibration Notes'),
        p('Key decisions and rationale from the calibration session. Not shared with employees.'),
        h2('Pay Equity Flags'),
        p('Any employees identified as below band midpoint or with unexplained pay gaps. Action plan attached.'),
        h2('Communication Plan'),
        table(
          ['Audience', 'Message', 'Channel', 'Date', 'Owner'],
          [
            ['All employees', 'Comp cycle complete, letters issued', 'Email', '', 'HR'],
            ['Promoted employees', 'Congratulations + new comp details', '1:1 with manager', '', 'Manager'],
            ['No change employees', 'Context on decision', '1:1 with manager', '', 'Manager'],
          ]
        ),
      ],
    },
  },

  // ── Milestone Tracker ─────────────────────────────────────────────────────
  {
    id: 'milestone-tracker',
    label: 'Milestone Tracker',
    description: 'Track key milestones, owners, dates, and completion status',
    icon: '🏁',
    title: 'Milestone Tracker',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Project', ''],
            ['Owner', ''],
            ['Start Date', today],
            ['Target End Date', ''],
          ]
        ),
        hr(),
        h2('Milestone Summary'),
        table(
          ['Status', 'Count'],
          [
            ['✅ Complete', ''],
            ['🔵 In Progress', ''],
            ['⬜ Not Started', ''],
            ['🔴 Delayed', ''],
            ['Total', ''],
          ]
        ),
        h2('Milestones'),
        table(
          ['#', 'Milestone', 'Description', 'Owner', 'Planned Date', 'Actual Date', 'Status', 'Notes'],
          [
            ['M1', '', '', '', '', '', '✅ Complete', ''],
            ['M2', '', '', '', '', '', '🔵 In Progress', ''],
            ['M3', '', '', '', '', '', '⬜ Not Started', ''],
            ['M4', '', '', '', '', '', '⬜ Not Started', ''],
            ['M5', '', '', '', '', '', '⬜ Not Started', ''],
            ['M6', '', '', '', '', '', '⬜ Not Started', ''],
          ]
        ),
        h2('Dependencies'),
        table(
          ['Milestone', 'Depends on', 'Risk if delayed'],
          [
            ['M2', 'M1', ''],
            ['M3', 'M2', ''],
          ]
        ),
        h2('Delays & Changes Log'),
        table(
          ['Date', 'Milestone', 'Original date', 'New date', 'Reason', 'Impact'],
          [
            ['', '', '', '', '', ''],
          ]
        ),
        h2('Upcoming — Next 2 Weeks'),
        tasks('', '', ''),
      ],
    },
  },

  // ── Stakeholder Map ───────────────────────────────────────────────────────
  {
    id: 'stakeholder-map',
    label: 'Stakeholder Map',
    description: 'Who cares, their interest, influence level, and engagement plan',
    icon: '🗺️',
    title: 'Stakeholder Map',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Project / Initiative', ''],
            ['Author', ''],
            ['Date', today],
          ]
        ),
        hr(),
        blockquote('A stakeholder is anyone who affects or is affected by this project. Map them early and keep this updated as relationships evolve.'),
        h2('Stakeholder Register'),
        table(
          ['Stakeholder / Group', 'Role', 'Interest in project', 'Influence (H/M/L)', 'Support (Champion / Neutral / Resistant)', 'Key concerns', 'Engagement owner'],
          [
            ['', 'Executive sponsor', '', 'High', 'Champion', '', ''],
            ['', 'End user', '', 'Medium', 'Neutral', '', ''],
            ['', 'Legal / Compliance', '', 'High', 'Neutral', '', ''],
            ['', 'Finance', '', 'Medium', 'Neutral', '', ''],
            ['', 'IT / Security', '', 'High', 'Neutral', '', ''],
          ]
        ),
        h2('Influence / Interest Matrix'),
        table(
          ['Quadrant', 'Stakeholders', 'Strategy'],
          [
            ['High influence, High interest — Manage closely', '', 'Frequent updates, involve in decisions'],
            ['High influence, Low interest — Keep satisfied', '', 'Regular updates, no overload'],
            ['Low influence, High interest — Keep informed', '', 'Regular comms, solicit feedback'],
            ['Low influence, Low interest — Monitor', '', 'Minimal comms, periodic check-in'],
          ]
        ),
        h2('Key Champions'),
        ul('', ''),
        h2('Key Resistors & Mitigation'),
        table(
          ['Stakeholder', 'Concern', 'Mitigation approach', 'Owner'],
          [
            ['', '', '', ''],
          ]
        ),
        h2('Communication Plan'),
        table(
          ['Stakeholder / Group', 'What to communicate', 'Frequency', 'Channel', 'Owner'],
          [
            ['', '', 'Weekly / Monthly / As needed', 'Email / Slack / Meeting', ''],
          ]
        ),
        h2('Engagement Log'),
        table(
          ['Date', 'Stakeholder', 'Activity', 'Outcome', 'Follow-up'],
          [
            [today, '', '', '', ''],
          ]
        ),
      ],
    },
  },

  // ── Work Breakdown Structure ──────────────────────────────────────────────
  {
    id: 'work-breakdown',
    label: 'Work Breakdown Structure',
    description: 'Decompose a project into phases, tasks, and subtasks',
    icon: '🧩',
    title: 'Work Breakdown Structure',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Project', ''],
            ['Owner', ''],
            ['Date', today],
          ]
        ),
        hr(),
        blockquote('A WBS decomposes the full scope of work into manageable chunks. Each leaf node should be small enough to estimate and assign to one owner. Rule of thumb: no task should be larger than 1–2 days of effort.'),
        h2('1.0 — Phase 1: Discovery & Planning'),
        table(
          ['Task ID', 'Task', 'Owner', 'Estimate', 'Status'],
          [
            ['1.1', 'Stakeholder interviews', '', '3d', 'Not started'],
            ['1.2', 'Requirements gathering', '', '2d', 'Not started'],
            ['1.3', 'Technical feasibility', '', '1d', 'Not started'],
            ['1.4', 'Project plan drafted', '', '1d', 'Not started'],
          ]
        ),
        h2('2.0 — Phase 2: Design'),
        table(
          ['Task ID', 'Task', 'Owner', 'Estimate', 'Status'],
          [
            ['2.1', 'UX research & flows', '', '3d', 'Not started'],
            ['2.2', 'Wireframes', '', '2d', 'Not started'],
            ['2.3', 'High-fidelity mockups', '', '3d', 'Not started'],
            ['2.4', 'Design review & sign-off', '', '1d', 'Not started'],
          ]
        ),
        h2('3.0 — Phase 3: Development'),
        table(
          ['Task ID', 'Task', 'Owner', 'Estimate', 'Status'],
          [
            ['3.1', 'Backend API', '', '5d', 'Not started'],
            ['3.2', 'Frontend UI', '', '5d', 'Not started'],
            ['3.3', 'Database migrations', '', '1d', 'Not started'],
            ['3.4', 'Integration / third-party', '', '2d', 'Not started'],
            ['3.5', 'Unit & integration tests', '', '2d', 'Not started'],
          ]
        ),
        h2('4.0 — Phase 4: Testing & QA'),
        table(
          ['Task ID', 'Task', 'Owner', 'Estimate', 'Status'],
          [
            ['4.1', 'Test plan written', '', '1d', 'Not started'],
            ['4.2', 'QA execution', '', '3d', 'Not started'],
            ['4.3', 'Bug fixes', '', '2d', 'Not started'],
            ['4.4', 'UAT with stakeholders', '', '2d', 'Not started'],
          ]
        ),
        h2('5.0 — Phase 5: Launch & Post-launch'),
        table(
          ['Task ID', 'Task', 'Owner', 'Estimate', 'Status'],
          [
            ['5.1', 'Deploy to production', '', '0.5d', 'Not started'],
            ['5.2', 'Monitor & triage', '', '2d', 'Not started'],
            ['5.3', 'Documentation published', '', '1d', 'Not started'],
            ['5.4', 'Stakeholder communication', '', '0.5d', 'Not started'],
            ['5.5', 'Retrospective', '', '0.5d', 'Not started'],
          ]
        ),
        h2('Effort Summary'),
        table(
          ['Phase', 'Total Estimate', 'Assigned to'],
          [
            ['1. Discovery & Planning', '', ''],
            ['2. Design', '', ''],
            ['3. Development', '', ''],
            ['4. Testing & QA', '', ''],
            ['5. Launch', '', ''],
            ['Total', '', ''],
          ]
        ),
      ],
    },
  },

  // ── Sprint Planning ───────────────────────────────────────────────────────
  {
    id: 'sprint-planning',
    label: 'Sprint Planning',
    description: 'Sprint goals, capacity, committed items, and risks',
    icon: '🏃',
    title: 'Sprint Planning',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Sprint', 'Sprint [#]'],
            ['Team', ''],
            ['Start Date', today],
            ['End Date', ''],
            ['Scrum Master', ''],
            ['Velocity (last sprint)', ''],
          ]
        ),
        hr(),
        h2('Sprint Goal'),
        blockquote('By the end of this sprint, we will [achieve X], which delivers value by [why it matters].'),
        h2('Team Capacity'),
        table(
          ['Team Member', 'Role', 'Days available', 'Capacity (pts)', 'Notes'],
          [
            ['', '', '', '', 'OOO: …'],
            ['', '', '', '', ''],
            ['', '', '', '', ''],
            ['Total', '', '', '', ''],
          ]
        ),
        h2('Committed Items'),
        table(
          ['Ticket ID', 'Title', 'Type', 'Points', 'Owner', 'Priority', 'Notes'],
          [
            ['', '', 'Feature / Bug / Chore / Spike', '', '', 'P0', ''],
            ['', '', '', '', '', 'P1', ''],
            ['', '', '', '', '', 'P1', ''],
            ['', '', '', '', '', 'P2', ''],
          ]
        ),
        pbold('Total committed points:'),
        h2('Stretch Items (if capacity allows)'),
        table(
          ['Ticket ID', 'Title', 'Points', 'Owner'],
          [
            ['', '', '', ''],
          ]
        ),
        h2('Carryover from Last Sprint'),
        table(
          ['Ticket ID', 'Title', 'Points', 'Why not completed'],
          [
            ['', '', '', ''],
          ]
        ),
        h2('Dependencies & Blockers'),
        table(
          ['Item', 'Blocked by', 'ETA to unblock'],
          [
            ['', '', ''],
          ]
        ),
        h2('Risks'),
        ul('', ''),
        h2('Definition of Done'),
        tasks(
          'Code reviewed and merged',
          'Unit tests written and passing',
          'QA tested in staging',
          'Product sign-off obtained',
          'Documentation updated if needed',
          'Deployed to production',
        ),
      ],
    },
  },

  // ── Team Handbook ─────────────────────────────────────────────────────────
  {
    id: 'team-handbook',
    label: 'Team Handbook',
    description: 'Norms, ways of working, processes, and onboarding info',
    icon: '📗',
    title: 'Team Handbook',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Team', ''],
            ['Owner', ''],
            ['Last Updated', today],
          ]
        ),
        hr(),
        h2('Welcome'),
        p('Welcome to the [Team Name] team! This handbook is your go-to guide for how we work, communicate, and collaborate. Keep it bookmarked — it evolves with us.'),
        h2('Our Mission'),
        blockquote(''),
        h2('Team Principles'),
        ol('', '', '', ''),
        h2('Communication Norms'),
        table(
          ['Channel', 'Used for', 'Expected response time'],
          [
            ['Slack — #[team]', 'General team conversation, quick questions', '< 4 hours'],
            ['Slack — @mention', 'Needs attention today', '< 2 hours'],
            ['Email', 'External comms, formal notices', '< 24 hours'],
            ['Jira / Linear', 'All work tracking — source of truth', 'See ticket SLA'],
            ['Video call', 'Complex discussions, 1:1s, standups', 'Calendar invite required'],
          ]
        ),
        h2('Meetings'),
        table(
          ['Meeting', 'Cadence', 'Day / Time', 'Format', 'Owner'],
          [
            ['Daily standup', 'Daily', '', 'Async or 15 min sync', ''],
            ['Sprint planning', 'Bi-weekly', '', '1 hour', 'Scrum Master'],
            ['Sprint retro', 'Bi-weekly', '', '45 min', 'Scrum Master'],
            ['Team sync', 'Weekly', '', '30 min', 'Team Lead'],
            ['1:1 (manager)', 'Weekly', '', '30 min', 'Manager'],
          ]
        ),
        h2('How We Handle Work'),
        ul(
          'All work goes into [Jira / Linear] before being started',
          'No ticket, no work — if it\'s not tracked, it doesn\'t exist',
          'PRs require at least 1 reviewer approval before merge',
          'Definition of Done must be met before closing a ticket',
        ),
        h2('Decision Making'),
        ul(
          'Small decisions (affects one person): decide yourself',
          'Medium decisions (affects the team): async proposal in Slack, 24h comment window',
          'Large decisions (affects other teams / product): document in a decision memo, get sign-off',
        ),
        h2('On-Call Rotation'),
        p('See [link to on-call schedule]. Rotation is [weekly / bi-weekly]. Escalation path: on-call → [backup] → [manager].'),
        h2('Onboarding Checklist for New Members'),
        tasks(
          'Get access to all systems — see [access request doc]',
          'Join all team Slack channels',
          'Read this handbook end to end',
          'Complete 1:1 with team lead in first week',
          'Shadow each team member for 30 min in week 1',
          'Complete first ticket by end of week 2',
        ),
        h2('Useful Links'),
        ul(
          'Sprint board: …',
          'Architecture docs: …',
          'Runbooks: …',
          'Design system: …',
          'HR / People docs: …',
        ),
      ],
    },
  },

  // ── Employee Benefits Guide ────────────────────────────────────────────────
  {
    id: 'benefits-guide',
    label: 'Employee Benefits Guide',
    description: 'Full benefits overview: health, leave, equity, perks, and how to claim',
    icon: '🏥',
    title: 'Employee Benefits Guide',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Company', ''],
            ['HR Owner', ''],
            ['Effective Date', today],
            ['Applies to', 'All full-time employees in [country / region]'],
          ]
        ),
        hr(),
        blockquote('Your benefits are part of your total compensation. This guide covers everything available to you and how to access it. Questions? Contact [People Ops / HR] via [Slack / email].'),
        h2('Health & Wellbeing'),
        table(
          ['Benefit', 'Coverage', 'Provider', 'Employee contribution', 'How to enroll'],
          [
            ['Medical', '', '', '', ''],
            ['Dental', '', '', '', ''],
            ['Vision', '', '', '', ''],
            ['Mental health / EAP', '', '', '', ''],
            ['Life insurance', '', '', '', ''],
            ['Disability insurance', '', '', '', ''],
          ]
        ),
        h2('Time Off'),
        table(
          ['Type', 'Entitlement', 'How to request', 'Notes'],
          [
            ['Paid Time Off (PTO)', '[X] days/year', '[HR system / Slack]', 'No rollover / [X] days rollover'],
            ['Sick leave', '[X] days/year', 'Notify manager same day', ''],
            ['Public holidays', '[X] per year', 'Automatic', 'See [list]'],
            ['Parental leave (primary)', '[X] weeks paid', 'Notify HR 3 months ahead', ''],
            ['Parental leave (secondary)', '[X] weeks paid', '', ''],
            ['Bereavement leave', '[X] days', 'Notify manager', ''],
            ['Jury duty', 'Full pay', 'Provide summons', ''],
            ['Sabbatical', 'After [X] years', 'Approval required', ''],
          ]
        ),
        h2('Retirement & Financial'),
        table(
          ['Benefit', 'Details'],
          [
            ['401k / Pension', 'Company matches [X]% up to [X]% of salary'],
            ['Vesting schedule', '[Immediate / 2-year cliff / 4-year graded]'],
            ['Financial advisor', 'Free sessions via [provider]'],
            ['Stock / equity', 'See your offer letter and equity agreement'],
          ]
        ),
        h2('Learning & Development'),
        table(
          ['Benefit', 'Amount / Policy'],
          [
            ['L&D budget', '$[X] per year per employee'],
            ['Eligible expenses', 'Courses, books, conferences, certifications'],
            ['How to claim', 'Submit via [expense system] with receipt'],
            ['Conference attendance', 'Up to [X] per year, approval required'],
          ]
        ),
        h2('Workspace & Equipment'),
        table(
          ['Benefit', 'Details'],
          [
            ['Home office stipend', '$[X] one-time setup allowance'],
            ['Monthly internet / phone', '$[X]/month reimbursement'],
            ['Laptop / equipment', 'Provided by company on start date'],
            ['Office snacks / lunch', 'Provided in office [days]'],
          ]
        ),
        h2('Perks & Extras'),
        ul(
          'Wellness benefit: $[X]/month (gym, meditation, fitness apps)',
          'Commuter benefit: $[X]/month pre-tax',
          'Employee referral bonus: $[X] per successful hire',
          'Team events budget: $[X] per person per quarter',
          'Volunteer days: [X] paid days/year',
        ),
        h2('How to Access Your Benefits'),
        ol(
          'Log in to [HR system / BambooHR / Rippling / Gusto]',
          'Navigate to Benefits section',
          'For questions: Slack #people-ops or email [hr@company.com]',
          'For urgent issues: call [HR phone]',
        ),
      ],
    },
  },

  // ── Job Leveling Framework ────────────────────────────────────────────────
  {
    id: 'job-leveling',
    label: 'Job Leveling Framework',
    description: 'Career ladder with levels, expectations, and promotion criteria',
    icon: '🪜',
    title: 'Job Leveling Framework',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Function / Department', ''],
            ['Owner', 'People / HR'],
            ['Last Updated', today],
            ['Status', 'Draft / Approved'],
          ]
        ),
        hr(),
        h2('Purpose'),
        p('This framework defines career levels, expectations at each level, and what it takes to progress. It creates consistency in hiring, compensation, and performance reviews.'),
        h2('Leveling Principles'),
        ul(
          'Levels reflect scope, impact, and autonomy — not tenure or title',
          'Promotion is recognition of sustained performance at the next level, not a reward for good work at the current level',
          'Each level has a range — being "at mid-level" does not automatically lead to promotion',
          'Individual Contributor (IC) and Manager tracks are separate and equally valued',
        ),
        h2('IC Career Ladder'),
        table(
          ['Level', 'Title', 'Scope of impact', 'Autonomy', 'Typical experience'],
          [
            ['L1', 'Junior / Associate', 'Own tasks', 'Needs guidance', '0–2 years'],
            ['L2', 'Mid-level', 'Own features', 'Works independently on defined problems', '2–4 years'],
            ['L3', 'Senior', 'Team / cross-team', 'Sets direction for a domain', '4–8 years'],
            ['L4', 'Staff', 'Multiple teams / Org', 'Drives strategy for an area', '8+ years'],
            ['L5', 'Principal', 'Company-wide', 'Shapes long-term technical / domain direction', 'N/A — impact-based'],
          ]
        ),
        h2('Manager Ladder'),
        table(
          ['Level', 'Title', 'Team size', 'Scope'],
          [
            ['M1', 'Team Lead / Manager', '3–6', 'Manages a single team, is still partly IC'],
            ['M2', 'Senior Manager', '6–12 or 2+ teams', 'Manages managers or large team'],
            ['M3', 'Director', '20+ or multi-team org', 'Owns a function or product area'],
            ['M4', 'VP', 'Multi-function', 'Company-level strategy and org design'],
          ]
        ),
        h2('Level Expectations by Dimension'),
        table(
          ['Dimension', 'L1', 'L2', 'L3', 'L4', 'L5'],
          [
            ['Technical / Domain skill', 'Learning fundamentals', 'Solid skills, some depth', 'Deep expertise', 'Cross-domain expertise', 'Industry-level mastery'],
            ['Delivery', 'Completes assigned tasks', 'Owns features', 'Owns projects', 'Owns workstreams', 'Defines roadmap'],
            ['Communication', 'Communicates status', 'Clear, proactive', 'Drives alignment', 'Influences org', 'Thought leader'],
            ['Collaboration', 'Works with immediate team', 'Cross-team collaboration', 'Leads cross-team work', 'Builds bridges across org', 'External influence'],
            ['Mentorship', 'Receives', 'Gives informally', 'Actively mentors', 'Coaches seniors', 'Elevates function'],
          ]
        ),
        h2('Promotion Process'),
        ol(
          'Manager identifies employee performing at next level consistently (3–6 months)',
          'Manager writes promotion case with examples and evidence',
          'HR calibration with peer managers to ensure consistency',
          'VP / Director approval for L3+ promotions',
          'HR prepares updated offer letter with new level, title, and compensation',
          'Manager delivers the news in a 1:1',
        ),
        h2('Promotion Criteria'),
        ul(
          'Sustained performance at next level — not a one-time project',
          'Peer and cross-functional feedback supports readiness',
          'No active PIP or performance concerns',
          'Open role / headcount at the target level (for management promotions)',
        ),
        h2('FAQ'),
        h3('Q: How long does it take to get promoted?'),
        p('A: There is no fixed timeline. The question is whether you are performing consistently at the next level, not how long you have been at the current level.'),
        h3('Q: Can I skip a level?'),
        p('A: Rarely. It requires demonstrating impact at two levels above the current one.'),
        h3('Q: What if I am at the top of the IC track but do not want to manage?'),
        p('A: The Staff and Principal tracks are designed for this. They are equally valued and compensated.'),
      ],
    },
  },

  // ── Resource Plan ─────────────────────────────────────────────────────────
  {
    id: 'resource-plan',
    label: 'Resource Plan',
    description: 'Who does what, when, allocation percentages, and gaps',
    icon: '📅',
    title: 'Resource Plan',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Project / Program', ''],
            ['Owner', ''],
            ['Period', ''],
            ['Date', today],
          ]
        ),
        hr(),
        h2('Resource Overview'),
        p('Summary of who is working on this project, their roles, and their availability.'),
        h2('Team Allocation'),
        table(
          ['Name', 'Role', 'Skill set', 'Allocation %', 'Start date', 'End date', 'Other commitments'],
          [
            ['', 'Project Lead', '', '100%', '', '', ''],
            ['', 'Engineer', '', '80%', '', '', '20% — [other project]'],
            ['', 'Designer', '', '50%', '', '', '50% — [other project]'],
            ['', 'QA', '', '25%', '', '', ''],
          ]
        ),
        h2('Capacity by Phase'),
        table(
          ['Phase', 'Start', 'End', 'Engineering (days)', 'Design (days)', 'QA (days)', 'PM (days)'],
          [
            ['Discovery', '', '', '', '', '', ''],
            ['Design', '', '', '', '', '', ''],
            ['Development', '', '', '', '', '', ''],
            ['Testing', '', '', '', '', '', ''],
            ['Launch', '', '', '', '', '', ''],
            ['Total', '', '', '', '', '', ''],
          ]
        ),
        h2('Resource Gaps'),
        table(
          ['Gap', 'Required by', 'Skills needed', 'Options', 'Status'],
          [
            ['', '', '', 'Hire / Contract / Reallocate', 'Open / Filled'],
          ]
        ),
        h2('External Resources'),
        table(
          ['Name / Company', 'Type', 'Rate', 'Deliverables', 'Contract end'],
          [
            ['', 'Contractor / Agency / Freelancer', '', '', ''],
          ]
        ),
        h2('Skills Inventory'),
        table(
          ['Name', 'Core skills', 'Secondary skills', 'Learning goals'],
          [
            ['', '', '', ''],
          ]
        ),
        h2('Assumptions'),
        ul(
          'No unplanned leave during critical path',
          'External contractors available on requested dates',
        ),
        h2('Risks'),
        table(
          ['Risk', 'Impact', 'Mitigation'],
          [
            ['Key person dependency', 'High', 'Cross-train backup'],
            ['Contractor availability', 'Medium', 'Identify backup vendor'],
          ]
        ),
      ],
    },
  },

  // ── Goals Tracker ─────────────────────────────────────────────────────────
  {
    id: 'goals-tracker',
    label: 'Goals Tracker',
    description: 'Individual or team goals with owner, progress, and status',
    icon: '🎯',
    title: 'Goals Tracker',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Person / Team', ''],
            ['Period', 'Q1 2026'],
            ['Owner', ''],
            ['Last Updated', today],
          ]
        ),
        hr(),
        h2('Summary'),
        table(
          ['Status', 'Count'],
          [
            ['✅ On track', ''],
            ['🟡 At risk', ''],
            ['🔴 Off track', ''],
            ['✔️ Complete', ''],
            ['Total goals', ''],
          ]
        ),
        h2('Goals'),
        table(
          ['#', 'Goal', 'Why it matters', 'Owner', 'Key results / metric', 'Target', 'Current', 'Status', 'Last update'],
          [
            ['1', '', '', '', '', '', '', '✅ On track', ''],
            ['2', '', '', '', '', '', '', '🟡 At risk', ''],
            ['3', '', '', '', '', '', '', '⬜ Not started', ''],
            ['4', '', '', '', '', '', '', '⬜ Not started', ''],
          ]
        ),
        h2('Goal Details'),
        h3('Goal 1 — [Name]'),
        pbold('Why:'),
        pbold('Key results:'),
        ul('KR1:', 'KR2:', 'KR3:'),
        pbold('Initiatives / actions:'),
        tasks('', '', ''),
        h3('Goal 2 — [Name]'),
        pbold('Why:'),
        pbold('Key results:'),
        ul('KR1:', 'KR2:'),
        pbold('Initiatives / actions:'),
        tasks('', ''),
        h2('Check-in Log'),
        table(
          ['Date', 'Goal', 'Update', 'Status change', 'By'],
          [
            [today, '', 'Goals set', 'New', ''],
          ]
        ),
        h2('End-of-Period Review'),
        p('Complete at the end of the period. What did we achieve? What did we miss? Why?'),
        table(
          ['Goal', 'Final score', 'Commentary'],
          [
            ['', '0–100%', ''],
          ]
        ),
        h2('Learnings for Next Period'),
        ul('', ''),
      ],
    },
  },

  // ── Project Closure Report ────────────────────────────────────────────────
  {
    id: 'project-closure',
    label: 'Project Closure Report',
    description: 'Final outcomes, lessons learned, and formal project sign-off',
    icon: '🏁',
    title: 'Project Closure Report',
    content: {
      type: 'doc',
      content: [
        table(
          ['Field', 'Details'],
          [
            ['Project', ''],
            ['Project Lead', ''],
            ['Sponsor', ''],
            ['Start Date', ''],
            ['End Date', today],
            ['Status', '✅ Closed'],
          ]
        ),
        hr(),
        h2('Executive Summary'),
        p('2–3 sentences: what the project delivered, how it compared to the original goal, and the headline impact.'),
        h2('Original Goals vs Actual Outcomes'),
        table(
          ['Goal', 'Success Criteria', 'Outcome', 'Status'],
          [
            ['', '', '', '✅ Met / ⚠️ Partially met / ❌ Not met'],
            ['', '', '', ''],
          ]
        ),
        h2('Scope Delivered'),
        table(
          ['Feature / Deliverable', 'Included in final delivery?', 'Notes'],
          [
            ['', 'Yes / No / Deferred', ''],
          ]
        ),
        h2('Timeline'),
        table(
          ['Milestone', 'Planned', 'Actual', 'Variance'],
          [
            ['Kickoff', '', '', ''],
            ['Development complete', '', '', ''],
            ['Launch', '', '', ''],
            ['Project close', '', today, ''],
          ]
        ),
        h2('Budget'),
        table(
          ['Category', 'Budget', 'Actual', 'Variance'],
          [
            ['Headcount', '$', '$', '$'],
            ['Tools & software', '$', '$', '$'],
            ['Contractors', '$', '$', '$'],
            ['Other', '$', '$', '$'],
            ['Total', '$', '$', '$'],
          ]
        ),
        h2('Key Achievements'),
        ul('', '', ''),
        h2('What Did Not Go as Planned'),
        ul('', ''),
        h2('Lessons Learned'),
        table(
          ['Lesson', 'Category', 'Recommendation for future projects'],
          [
            ['', 'Process / Tech / Team / Planning', ''],
            ['', '', ''],
          ]
        ),
        h2('Risks That Materialised'),
        table(
          ['Risk', 'Impact', 'How it was handled'],
          [
            ['', '', ''],
          ]
        ),
        h2('Outstanding Items'),
        table(
          ['Item', 'Owner', 'Target date'],
          [
            ['', '', ''],
          ]
        ),
        h2('Handover'),
        table(
          ['What', 'Handed to', 'Date', 'Notes'],
          [
            ['Codebase / repo', '', '', ''],
            ['Documentation', '', '', ''],
            ['On-call / support', '', '', ''],
            ['Data / assets', '', '', ''],
          ]
        ),
        h2('Sign-off'),
        table(
          ['Role', 'Name', 'Signature', 'Date'],
          [
            ['Project Lead', '', '', ''],
            ['Sponsor', '', '', ''],
            ['Engineering Lead', '', '', ''],
          ]
        ),
      ],
    },
  },
]
