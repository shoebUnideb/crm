import React, { useState } from 'react'

const STEPS = [
  {
    title: 'Welcome to bahnOS',
    desc: 'bahnOS is a visual mind-mapping tool that syncs directly to Jira. Let\'s take 60 seconds to show you the ropes.',
    illustration: (
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
        <circle cx="28" cy="40" r="20" fill="#0052CC" opacity="0.9"/>
        <circle cx="52" cy="40" r="20" fill="#4C9AFF" opacity="0.85"/>
      </svg>
    ),
  },
  {
    title: 'Build your map',
    desc: 'Double-click anywhere on the canvas to create a node. Press Tab to add a child, Enter to add a sibling. Drag nodes to rearrange.',
    illustration: (
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
        <rect x="30" y="34" width="20" height="12" rx="3" fill="#0052CC"/>
        <rect x="5" y="20" width="18" height="10" rx="3" fill="#4C9AFF" opacity="0.8"/>
        <rect x="5" y="50" width="18" height="10" rx="3" fill="#4C9AFF" opacity="0.8"/>
        <rect x="57" y="20" width="18" height="10" rx="3" fill="#4C9AFF" opacity="0.6"/>
        <rect x="57" y="50" width="18" height="10" rx="3" fill="#4C9AFF" opacity="0.6"/>
        <line x1="23" y1="25" x2="30" y2="38" stroke="#DFE1E6" strokeWidth="1.5"/>
        <line x1="23" y1="55" x2="30" y2="42" stroke="#DFE1E6" strokeWidth="1.5"/>
        <line x1="50" y1="38" x2="57" y2="25" stroke="#DFE1E6" strokeWidth="1.5"/>
        <line x1="50" y1="42" x2="57" y2="55" stroke="#DFE1E6" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    title: 'Sync with Jira',
    desc: 'Click the Jira button in the top-right to connect your Atlassian account. Each node maps to a Jira issue — push or pull with one click.',
    illustration: (
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
        <rect x="10" y="26" width="24" height="28" rx="4" fill="#0052CC"/>
        <rect x="46" y="26" width="24" height="28" rx="4" fill="#253858"/>
        <path d="M34 40h12" stroke="#4C9AFF" strokeWidth="2" strokeLinecap="round"/>
        <path d="M39 35l5 5-5 5" stroke="#4C9AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="22" cy="37" r="3" fill="white" opacity="0.7"/>
        <rect x="14" y="44" width="16" height="2" rx="1" fill="white" opacity="0.4"/>
        <circle cx="58" cy="37" r="3" fill="#4C9AFF"/>
        <rect x="50" y="44" width="16" height="2" rx="1" fill="white" opacity="0.4"/>
      </svg>
    ),
  },
  {
    title: 'Collaborate in real time',
    desc: 'Share your map from the top-right menu. Teammates see each other\'s cursors live and edits appear instantly — no refresh needed.',
    illustration: (
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
        <circle cx="28" cy="32" r="12" fill="#0052CC" opacity="0.9"/>
        <circle cx="52" cy="32" r="12" fill="#4C9AFF" opacity="0.85"/>
        <path d="M16 58c0-8 5.4-14 12-14s12 6 12 14" fill="#0052CC" opacity="0.3"/>
        <path d="M40 58c0-8 5.4-14 12-14s12 6 12 14" fill="#4C9AFF" opacity="0.3"/>
      </svg>
    ),
  },
  {
    title: 'You\'re all set!',
    desc: 'Check out the toolbar at the bottom for views, exports, and more. Press ? anytime to see keyboard shortcuts.',
    illustration: (
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
        <circle cx="40" cy="40" r="28" fill="#E3FCEF"/>
        <path d="M26 40l10 10 18-20" stroke="#006644" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
]

const STORAGE_KEY = 'bahn_onboarding_done'

export default function OnboardingModal({ onDone }) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  function finish() {
    try { localStorage.setItem(STORAGE_KEY, '1') } catch {}
    onDone()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      background: 'rgba(23,43,77,0.55)', backdropFilter: 'blur(2px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: '#fff', borderRadius: 14, padding: '40px 36px 28px',
        maxWidth: 420, width: '100%', textAlign: 'center',
        boxShadow: '0 16px 48px rgba(0,0,0,0.22)',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}>
        {/* Illustration */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          {current.illustration}
        </div>

        {/* Step dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? 18 : 6, height: 6, borderRadius: 3,
                background: i === step ? '#0052CC' : '#DFE1E6',
                transition: 'width 0.2s, background 0.2s',
              }}
            />
          ))}
        </div>

        <h2 style={{ fontSize: '1.1875rem', fontWeight: 700, color: '#172B4D', marginBottom: 10 }}>
          {current.title}
        </h2>
        <p style={{ fontSize: '0.9rem', color: '#5E6C84', lineHeight: 1.7, marginBottom: 28 }}>
          {current.desc}
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              style={{
                padding: '8px 18px', borderRadius: 6, border: '1px solid #DFE1E6',
                background: '#fff', color: '#5E6C84', fontSize: '0.875rem',
                fontWeight: 600, cursor: 'pointer',
              }}
            >
              Back
            </button>
          )}
          <button
            onClick={isLast ? finish : () => setStep(s => s + 1)}
            style={{
              padding: '8px 24px', borderRadius: 6, border: 'none',
              background: '#0052CC', color: '#fff', fontSize: '0.875rem',
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            {isLast ? 'Get started' : 'Next'}
          </button>
        </div>

        {/* Skip */}
        {!isLast && (
          <button
            onClick={finish}
            style={{
              marginTop: 16, background: 'none', border: 'none',
              fontSize: '0.8rem', color: '#97A0AF', cursor: 'pointer',
            }}
          >
            Skip tour
          </button>
        )}
      </div>
    </div>
  )
}

export { STORAGE_KEY }
