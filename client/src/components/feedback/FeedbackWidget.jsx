import React, { useState } from 'react'
import { submitFeedback } from '../../lib/analyticsApi.js'
import { useAuth } from '../../context/AuthContext.jsx'

const CATEGORIES = [
  { id: 'rating',   emoji: '⭐', label: 'Rating',          placeholder: 'Tell us how you\'d rate your experience overall…', color: '#F29900', bg: '#FFF8E1' },
  { id: 'bug',      emoji: '🐛', label: 'Bug report',      placeholder: 'Describe the bug — what happened and how to reproduce it…', color: '#C5221F', bg: '#FFF0EE' },
  { id: 'feature',  emoji: '✨', label: 'Feature request', placeholder: 'What feature would make bahnOS more useful for you?', color: '#1E8E3E', bg: '#E8F5E9' },
  { id: 'love',     emoji: '❤️', label: 'Love',            placeholder: 'What do you love most about bahnOS?', color: '#D93025', bg: '#FDE8E8' },
  { id: 'dislike',  emoji: '😤', label: 'Dislike',         placeholder: 'What would you most like to change or improve?', color: '#E37400', bg: '#FFF3E0' },
  { id: 'other',    emoji: '💬', label: 'Other',           placeholder: 'Share any thoughts, ideas, or questions…', color: '#5F6368', bg: '#F1F3F4' },
]

export default function FeedbackWidget() {
  const { user, isGuest } = useAuth()
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState(null)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const isLoggedIn = !!user && !isGuest
  const cat = CATEGORIES.find(c => c.id === category)

  function handleOpen() { setOpen(true); setDone(false); setError('') }
  function handleClose() {
    setOpen(false)
    setTimeout(() => {
      setCategory(null); setRating(0); setHoverRating(0)
      setMessage(''); setEmail(''); setDone(false); setError('')
    }, 250)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!category) { setError('Please select a category.'); return }
    if (!message.trim() && category !== 'rating') { setError('Please write a message.'); return }
    if (category === 'rating' && rating === 0) { setError('Please select a star rating.'); return }
    setError(''); setSubmitting(true)
    try {
      await submitFeedback({
        userId: isLoggedIn ? user.id : null,
        isGuest: !isLoggedIn,
        email: isLoggedIn ? user.email : (email.trim() || null),
        rating: rating || null,
        message: message.trim() || null,
        category,
      })
      setDone(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Side tab */}
      <button
        onClick={handleOpen}
        style={{
          position: 'fixed', right: 0, top: '50%', transform: 'translateY(-50%)',
          zIndex: 9998, writingMode: 'vertical-rl', textOrientation: 'mixed',
          padding: '14px 10px', background: '#0052CC', color: '#fff',
          border: 'none', cursor: 'pointer', borderRadius: '8px 0 0 8px',
          fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
          boxShadow: '-2px 2px 10px rgba(0,82,204,0.3)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          transition: 'background 0.15s, transform 0.15s',
          display: 'flex', alignItems: 'center', gap: 6,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#0747A6' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#0052CC' }}
        title="Share feedback"
      >
        Feedback
      </button>

      {/* Backdrop */}
      {open && (
        <div
          onClick={handleClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 9998,
            background: 'rgba(9,30,66,0.45)',
            animation: 'fbFadeIn 0.2s ease',
          }}
        />
      )}

      {/* Modal */}
      {open && (
        <div
          style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999, width: 460, maxWidth: 'calc(100vw - 32px)',
            background: '#fff', borderRadius: 14,
            boxShadow: '0 20px 60px rgba(9,30,66,0.25)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            animation: 'fbSlideUp 0.22s ease',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{ padding: '18px 20px 16px', borderBottom: '1px solid #EBECF0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#172B4D' }}>Share your feedback</h2>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: '#6B778C' }}>
                {isLoggedIn ? `Sending as ${user.email}` : 'You\'re sending as a guest'}
              </p>
            </div>
            <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 6, color: '#97A0AF', display: 'flex' }}
              onMouseEnter={e => e.currentTarget.style.background = '#F4F5F7'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {done ? (
            /* Success state */
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🙏</div>
              <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 700, color: '#172B4D' }}>Thank you!</h3>
              <p style={{ margin: '0 0 24px', fontSize: 13.5, color: '#6B778C', lineHeight: 1.6 }}>
                Your feedback has been received. We read every response and it shapes what we build next.
              </p>
              <button onClick={handleClose} style={{ padding: '9px 24px', background: '#0052CC', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Category grid */}
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
                    What kind of feedback? <span style={{ color: '#DE350B' }}>*</span>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7 }}>
                    {CATEGORIES.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => { setCategory(c.id); setError('') }}
                        style={{
                          padding: '9px 6px', borderRadius: 8, cursor: 'pointer',
                          border: `1.5px solid ${category === c.id ? c.color : '#DFE1E6'}`,
                          background: category === c.id ? c.bg : '#FAFBFC',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                          transition: 'border-color 0.12s, background 0.12s',
                        }}
                        onMouseEnter={e => { if (category !== c.id) { e.currentTarget.style.borderColor = c.color; e.currentTarget.style.background = c.bg } }}
                        onMouseLeave={e => { if (category !== c.id) { e.currentTarget.style.borderColor = '#DFE1E6'; e.currentTarget.style.background = '#FAFBFC' } }}
                      >
                        <span style={{ fontSize: 18, lineHeight: 1 }}>{c.emoji}</span>
                        <span style={{ fontSize: 11, fontWeight: category === c.id ? 700 : 500, color: category === c.id ? c.color : '#5E6C84' }}>{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Star rating — always visible, required for 'rating' category */}
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
                    Overall rating {category === 'rating' ? <span style={{ color: '#DE350B' }}>*</span> : <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>}
                  </label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                        onMouseEnter={() => setHoverRating(n)}
                        onMouseLeave={() => setHoverRating(0)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: 26, padding: '0 2px', lineHeight: 1,
                          color: n <= (hoverRating || rating) ? '#F9AB00' : '#DFE1E6',
                          transition: 'color 0.1s',
                        }}
                      >★</button>
                    ))}
                    {rating > 0 && (
                      <span style={{ fontSize: 12, color: '#6B778C', alignSelf: 'center', marginLeft: 4 }}>
                        {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
                    Message {category !== 'rating' && <span style={{ color: '#DE350B' }}>*</span>}
                  </label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder={cat?.placeholder || 'Share your thoughts…'}
                    rows={4}
                    style={{
                      width: '100%', boxSizing: 'border-box', resize: 'vertical',
                      padding: '10px 12px', borderRadius: 6, fontSize: 13, lineHeight: 1.6,
                      border: '1.5px solid #DFE1E6', outline: 'none', color: '#172B4D',
                      fontFamily: 'inherit', background: '#FAFBFC',
                      transition: 'border-color 0.12s',
                    }}
                    onFocus={e => e.target.style.borderColor = '#0052CC'}
                    onBlur={e => e.target.style.borderColor = '#DFE1E6'}
                  />
                </div>

                {/* Email — hidden for logged-in users, optional for guests */}
                {!isLoggedIn && (
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
                      Your email <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional — for follow-up)</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        padding: '9px 12px', borderRadius: 6, fontSize: 13,
                        border: '1.5px solid #DFE1E6', outline: 'none', color: '#172B4D',
                        fontFamily: 'inherit', background: '#FAFBFC',
                        transition: 'border-color 0.12s',
                      }}
                      onFocus={e => e.target.style.borderColor = '#0052CC'}
                      onBlur={e => e.target.style.borderColor = '#DFE1E6'}
                    />
                  </div>
                )}

                {/* Error */}
                {error && (
                  <p style={{ margin: 0, fontSize: 12.5, color: '#DE350B', background: '#FFEBE6', padding: '8px 12px', borderRadius: 6 }}>
                    {error}
                  </p>
                )}

                {/* Footer */}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
                  <button type="button" onClick={handleClose} style={{ padding: '8px 18px', background: 'none', border: '1.5px solid #DFE1E6', borderRadius: 6, cursor: 'pointer', fontSize: 13, color: '#5E6C84', fontWeight: 500 }}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      padding: '8px 22px', background: submitting ? '#0052CC88' : '#0052CC',
                      color: '#fff', border: 'none', borderRadius: 6, cursor: submitting ? 'default' : 'pointer',
                      fontSize: 13, fontWeight: 700, transition: 'background 0.15s',
                    }}
                  >
                    {submitting ? 'Sending…' : 'Send feedback'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      <style>{`
        @keyframes fbFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes fbSlideUp { from { opacity: 0; transform: translate(-50%, calc(-50% + 16px)) } to { opacity: 1; transform: translate(-50%, -50%) } }
      `}</style>
    </>
  )
}
