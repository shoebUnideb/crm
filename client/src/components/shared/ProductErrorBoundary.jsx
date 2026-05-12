import React from 'react'

export default class ProductErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error(`[${this.props.productName}] Unhandled error:`, error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    const { productName, accentColor } = this.props
    const otherProduct = productName === 'Canvas' ? 'CRM' : 'Canvas'
    const otherPath = productName === 'Canvas' ? '/app/crm' : '/canvas'

    return (
      <div style={{
        height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', background: '#F4F5F7',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}>
        {/* Accent bar at top */}
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 4, background: accentColor }} />

        <div style={{
          background: '#fff', borderRadius: 8, boxShadow: '0 4px 24px rgba(9,30,66,0.12)',
          border: '1px solid #DFE1E6', padding: '40px 48px', maxWidth: 480, width: '100%', textAlign: 'center',
        }}>
          {/* Icon */}
          <div style={{
            width: 56, height: 56, borderRadius: '50%', background: `${accentColor}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#172B4D', marginBottom: 8 }}>
            {productName} is temporarily unavailable
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#5E6C84', lineHeight: 1.6, marginBottom: 28 }}>
            An unexpected error occurred. Your data is safe.
          </p>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{
                background: accentColor, color: '#fff', border: 'none', borderRadius: 4,
                padding: '9px 20px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            >
              Try again
            </button>
            {/* Plain <a> tag — safe even when React Router context is inside crashed tree */}
            <a
              href={otherPath}
              style={{
                background: '#F4F5F7', color: '#172B4D', border: '1px solid #DFE1E6',
                borderRadius: 4, padding: '9px 20px', fontWeight: 500, fontSize: '0.875rem',
                cursor: 'pointer', textDecoration: 'none', display: 'inline-block',
              }}
            >
              Go to {otherProduct} →
            </a>
          </div>
        </div>

        {/* Error details (collapsed, for debugging) */}
        <details style={{ marginTop: 16, maxWidth: 480, width: '100%' }}>
          <summary style={{ fontSize: '0.75rem', color: '#97A0AF', cursor: 'pointer', textAlign: 'center' }}>
            Technical details
          </summary>
          <pre style={{
            marginTop: 8, padding: '12px 16px', background: '#172B4D', color: '#8993A4',
            borderRadius: 4, fontSize: '0.6875rem', overflow: 'auto', textAlign: 'left',
            maxHeight: 160,
          }}>
            {this.state.error?.toString()}
          </pre>
        </details>
      </div>
    )
  }
}
