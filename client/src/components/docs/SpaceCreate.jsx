import React, { useState } from 'react'
import * as docsApi from '../../lib/docsApi.js'

const ACCENT = '#0052CC'
const EMOJIS = ['📄', '📁', '📚', '🚀', '💡', '🔧', '🎯', '📊', '🛡️', '🌐', '✅', '⚙️']

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
}

export default function SpaceCreate({ onCreated, onClose }) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('📄')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleNameChange(e) {
    const val = e.target.value
    setName(val)
    if (!slugEdited) setSlug(slugify(val))
  }

  function handleSlugChange(e) {
    setSlugEdited(true)
    setSlug(slugify(e.target.value) || e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) { setError('Space name is required'); return }
    if (!slug.trim()) { setError('Slug is required'); return }
    setLoading(true)
    setError('')
    try {
      const space = await docsApi.createSpace({ name: name.trim(), slug: slug.trim(), icon, description: description.trim() || null })
      onCreated(space)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(9,30,66,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: '#fff', borderRadius: 12, width: 480,
        boxShadow: '0 20px 60px rgba(9,30,66,0.3)', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F4F5F7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 700, color: '#172B4D' }}>Create space</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#97A0AF', padding: 4 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>

          {/* Icon picker */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#172B4D', marginBottom: 8 }}>Icon</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {EMOJIS.map(e => (
                <button
                  key={e} type="button"
                  onClick={() => setIcon(e)}
                  style={{
                    width: 36, height: 36, borderRadius: 6, fontSize: '1.125rem',
                    border: icon === e ? `2px solid ${ACCENT}` : '2px solid #DFE1E6',
                    background: icon === e ? '#EAF3FF' : '#F4F5F7',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#172B4D', marginBottom: 6 }}>
              Space name <span style={{ color: '#DE350B' }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="e.g. Engineering, Product, Sales"
              autoFocus
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 6, boxSizing: 'border-box',
                border: '1px solid #DFE1E6', fontSize: '0.875rem', color: '#172B4D',
                outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = ACCENT}
              onBlur={e => e.target.style.borderColor = '#DFE1E6'}
            />
          </div>

          {/* Slug */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#172B4D', marginBottom: 6 }}>Slug</label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #DFE1E6', borderRadius: 6, overflow: 'hidden' }}
              onFocusCapture={e => e.currentTarget.style.borderColor = ACCENT}
              onBlurCapture={e => e.currentTarget.style.borderColor = '#DFE1E6'}
            >
              <span style={{ padding: '8px 10px', background: '#F4F5F7', color: '#97A0AF', fontSize: '0.8125rem', borderRight: '1px solid #DFE1E6', flexShrink: 0 }}>
                /app/docs/
              </span>
              <input
                type="text"
                value={slug}
                onChange={handleSlugChange}
                placeholder="my-space"
                style={{ flex: 1, padding: '8px 10px', border: 'none', outline: 'none', fontSize: '0.875rem', color: '#172B4D' }}
              />
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#172B4D', marginBottom: 6 }}>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What is this space about? (optional)"
              rows={2}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 6, boxSizing: 'border-box',
                border: '1px solid #DFE1E6', fontSize: '0.875rem', color: '#172B4D',
                outline: 'none', resize: 'vertical',
              }}
              onFocus={e => e.target.style.borderColor = ACCENT}
              onBlur={e => e.target.style.borderColor = '#DFE1E6'}
            />
          </div>

          {error && (
            <p style={{ margin: '0 0 12px', fontSize: '0.8125rem', color: '#DE350B', background: '#FFEBE6', padding: '8px 12px', borderRadius: 6 }}>
              {error}
            </p>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" onClick={onClose} style={{
              padding: '8px 16px', borderRadius: 6, border: '1px solid #DFE1E6',
              background: '#fff', color: '#172B4D', cursor: 'pointer', fontSize: '0.875rem',
            }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{
              padding: '8px 16px', borderRadius: 6, border: 'none',
              background: loading ? '#4C9AFF' : ACCENT, color: '#fff',
              cursor: loading ? 'default' : 'pointer', fontSize: '0.875rem', fontWeight: 600,
            }}>
              {loading ? 'Creating…' : 'Create space'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
