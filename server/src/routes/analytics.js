import { Router } from 'express'
import { query } from '../db/index.js'

const router = Router()

// Track a feature event — no auth required (works for guests too)
router.post('/event', async (req, res, next) => {
  try {
    const { eventType, featureName, sessionId, isGuest, userId, metadata } = req.body
    if (!eventType) return res.status(400).json({ error: 'eventType required' })
    await query(
      `INSERT INTO analytics_events (event_type, feature_name, user_id, session_id, is_guest, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        eventType,
        featureName || null,
        userId && !isGuest ? userId : null,
        sessionId || null,
        isGuest === true,
        metadata ? JSON.stringify(metadata) : '{}',
      ]
    )
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// Submit feedback — no auth required
router.post('/feedback', async (req, res, next) => {
  try {
    const { sessionId, isGuest, userId, email, rating, message, category, metadata } = req.body
    if (!message && !rating) return res.status(400).json({ error: 'message or rating required' })
    await query(
      `INSERT INTO feedback (user_id, session_id, is_guest, email, rating, message, category, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        userId && !isGuest ? userId : null,
        sessionId || null,
        isGuest === true,
        email || null,
        rating || null,
        message || null,
        category || 'general',
        metadata ? JSON.stringify(metadata) : '{}',
      ]
    )
    res.json({ ok: true })
  } catch (e) { next(e) }
})

export default router
