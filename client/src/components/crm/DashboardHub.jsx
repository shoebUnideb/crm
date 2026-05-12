import React, { useState } from 'react'
import CRMDashboard from './CRMDashboard.jsx'
import RevenueDashboard from './RevenueDashboard.jsx'
import ForecastDashboard from './ForecastDashboard.jsx'
import WinLossAnalysis from './WinLossAnalysis.jsx'

const NAVY = '#172B4D'
const SUBTLE = '#5E6C84'
const BORDER = '#DFE1E6'
const WHITE = '#fff'
const EMERALD = '#10b981'

const TABS = [
  {
    id: 'overview',
    label: 'Overview',
    color: '#10b981',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    id: 'revenue',
    label: 'Revenue',
    color: '#3B82F6',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
  },
  {
    id: 'forecast',
    label: 'Forecast',
    color: '#8B5CF6',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    id: 'winloss',
    label: 'Win/Loss',
    color: '#F59E0B',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/>
      </svg>
    ),
  },
]

export default function DashboardHub({ stages, onNavigate }) {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
      {/* Sub-navigation bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '0 24px', background: WHITE, borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '14px 18px',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? `2.5px solid ${EMERALD}` : '2.5px solid transparent',
                color: isActive ? NAVY : SUBTLE,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                transition: 'all 0.15s',
                marginBottom: -1,
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = NAVY }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = SUBTLE }}
            >
              <span style={{ color: isActive ? tab.color : 'inherit', display: 'flex', alignItems: 'center' }}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Dashboard content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === 'overview' && <CRMDashboard stages={stages} onNavigate={onNavigate} />}
        {activeTab === 'revenue' && <RevenueDashboard stages={stages} />}
        {activeTab === 'forecast' && <ForecastDashboard />}
        {activeTab === 'winloss' && <WinLossAnalysis />}
      </div>
    </div>
  )
}
