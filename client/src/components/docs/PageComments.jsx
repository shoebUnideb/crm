import React, { useState, useEffect } from 'react'
import * as docsApi from '../../lib/docsApi.js'

const ACCENT = '#0052CC'

export default function PageComments({ pageId, isReadOnly }) {
  const [comments, setComments] = useState([])
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    docsApi.getComments(pageId)
      .then(setComments)
      .catch(err => console.error('Failed to load comments:', err))
      .finally(() => setLoading(false))
  }, [pageId])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!body.trim()) return
    setSubmitting(true)
    try {
      const comment = await docsApi.addComment(pageId, body.trim())
      setComments(prev => [...prev, comment])
      setBody('')
    } catch (err) {
      console.error('Failed to post comment:', err)
    } finally { setSubmitting(false) }
  }

  async function handleDelete(id) {
    try {
      await docsApi.deleteComment(id)
      setComments(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      console.error('Failed to delete comment:', err)
    }
  }

  async function handleResolve(comment) {
    try {
      const updated = await docsApi.resolveComment(comment.id, !comment.resolved)
      setComments(prev => prev.map(c => c.id === comment.id ? updated : c))
    } catch (err) {
      console.error('Failed to resolve comment:', err)
    }
  }

  if (loading) return <div style={{ padding: 16, color: '#97A0AF', fontSize: '0.8125rem' }}>Loading…</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Comment list */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
        {comments.length === 0 && (
          <p style={{ color: '#97A0AF', fontSize: '0.8125rem', textAlign: 'center', marginTop: 24 }}>No comments yet</p>
        )}
        {comments.map(comment => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onDelete={handleDelete}
            onResolve={handleResolve}
          />
        ))}
      </div>

      {/* Add comment */}
      {!isReadOnly && (
        <form onSubmit={handleSubmit} style={{ padding: '10px 16px', borderTop: '1px solid #EBECF0', flexShrink: 0 }}>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Add a comment…"
            rows={2}
            style={{
              width: '100%', padding: '8px 10px', border: '1px solid #DFE1E6', borderRadius: 6,
              fontSize: '0.8125rem', color: '#172B4D', resize: 'none', outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={e => e.target.style.borderColor = ACCENT}
            onBlur={e => e.target.style.borderColor = '#DFE1E6'}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
            <button type="submit" disabled={submitting || !body.trim()} style={{
              background: ACCENT, color: '#fff', border: 'none', borderRadius: 5,
              padding: '5px 12px', cursor: submitting || !body.trim() ? 'default' : 'pointer',
              fontSize: '0.8125rem', fontWeight: 600, opacity: !body.trim() ? 0.5 : 1,
            }}>
              {submitting ? 'Posting…' : 'Comment'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

function CommentItem({ comment, onDelete, onResolve }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '10px 0', borderBottom: '1px solid #F4F5F7',
        opacity: comment.resolved ? 0.55 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <div style={{
          width: 24, height: 24, borderRadius: '50%', background: '#0052CC',
          color: '#fff', fontSize: '0.6875rem', fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {comment.email?.slice(0, 2).toUpperCase()}
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#172B4D', flex: 1 }}>{comment.email}</span>
        <span style={{ fontSize: '0.6875rem', color: '#97A0AF' }}>
          {new Date(comment.created_at).toLocaleDateString()}
        </span>
        {comment.resolved && (
          <span style={{ fontSize: '0.6875rem', color: '#36B37E', background: '#E3FCEF', borderRadius: 3, padding: '1px 5px' }}>resolved</span>
        )}
      </div>
      <p style={{ margin: '0 0 6px', fontSize: '0.8125rem', color: '#172B4D', lineHeight: 1.5, paddingLeft: 30 }}>
        {comment.body}
      </p>
      {hovered && (
        <div style={{ display: 'flex', gap: 6, paddingLeft: 30 }}>
          <button onClick={() => onResolve(comment)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '0.6875rem', color: '#36B37E', padding: '2px 0',
          }}>
            {comment.resolved ? 'Unresolve' : 'Resolve'}
          </button>
          <button onClick={() => onDelete(comment.id)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '0.6875rem', color: '#DE350B', padding: '2px 0',
          }}>
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
