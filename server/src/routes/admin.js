import { Router } from 'express'
import authenticate from '../middleware/authenticate.js'
import adminOnly from '../middleware/adminOnly.js'
import { query } from '../db/index.js'

const router = Router()
router.use(authenticate, adminOnly)

// ── Overview stats ─────────────────────────────────────────────────────────────
router.get('/stats', async (req, res, next) => {
  try {
    const [users, projects, eventsToday, newUsersToday, guestSessions, feedbackCount, collab] = await Promise.all([
      query(`SELECT COUNT(*) FROM users`),
      query(`SELECT COUNT(*) FROM projects`),
      query(`SELECT COUNT(*) FROM analytics_events WHERE created_at >= NOW() - INTERVAL '24 hours'`),
      query(`SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '24 hours'`),
      query(`SELECT COUNT(DISTINCT session_id) FROM analytics_events WHERE is_guest = true AND created_at >= NOW() - INTERVAL '7 days'`),
      query(`SELECT COUNT(*) FROM feedback`),
      query(`SELECT COUNT(DISTINCT project_id) FROM project_members`),
    ])

    // Signups over last 30 days (daily)
    const signupTrend = await query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `)

    // Events over last 7 days (daily)
    const activityTrend = await query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM analytics_events
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `)

    res.json({
      totalUsers: parseInt(users.rows[0].count),
      totalProjects: parseInt(projects.rows[0].count),
      eventsToday: parseInt(eventsToday.rows[0].count),
      newUsersToday: parseInt(newUsersToday.rows[0].count),
      guestSessionsWeek: parseInt(guestSessions.rows[0].count),
      feedbackCount: parseInt(feedbackCount.rows[0].count),
      activeCollabProjects: parseInt(collab.rows[0].count),
      signupTrend: signupTrend.rows,
      activityTrend: activityTrend.rows,
    })
  } catch (e) { next(e) }
})

// ── Feature usage ──────────────────────────────────────────────────────────────
router.get('/features', async (req, res, next) => {
  try {
    const features = await query(`
      SELECT
        feature_name,
        COUNT(*) as total_uses,
        COUNT(DISTINCT COALESCE(user_id::text, session_id)) as unique_users,
        MAX(created_at) as last_used,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as uses_last_7d,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as uses_last_24h
      FROM analytics_events
      WHERE event_type = 'feature_used' AND feature_name IS NOT NULL
      GROUP BY feature_name
      ORDER BY total_uses DESC
    `)
    res.json(features.rows)
  } catch (e) { next(e) }
})

// ── Activity log ───────────────────────────────────────────────────────────────
router.get('/activity', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200)
    const offset = parseInt(req.query.offset) || 0
    const filter = req.query.filter || '' // event_type filter

    const whereClause = filter ? `WHERE a.event_type = $3` : ''
    const params = filter ? [limit, offset, filter] : [limit, offset]

    const events = await query(`
      SELECT
        a.id, a.event_type, a.feature_name, a.is_guest, a.metadata, a.created_at,
        a.session_id,
        u.email as user_email, u.id as user_id
      FROM analytics_events a
      LEFT JOIN users u ON u.id = a.user_id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT $1 OFFSET $2
    `, params)

    const total = await query(
      filter
        ? `SELECT COUNT(*) FROM analytics_events WHERE event_type = $1`
        : `SELECT COUNT(*) FROM analytics_events`,
      filter ? [filter] : []
    )

    res.json({
      events: events.rows,
      total: parseInt(total.rows[0].count),
      limit,
      offset,
    })
  } catch (e) { next(e) }
})

// ── Users list ─────────────────────────────────────────────────────────────────
router.get('/users', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200)
    const offset = parseInt(req.query.offset) || 0
    const search = req.query.search || ''

    const whereClause = search ? `WHERE u.email ILIKE $3` : ''
    const params = search ? [limit, offset, `%${search}%`] : [limit, offset]

    const users = await query(`
      SELECT
        u.id, u.email, u.avatar, u.created_at, u.is_admin,
        COUNT(DISTINCT pm.project_id) as project_count,
        MAX(ae.created_at) as last_active
      FROM users u
      LEFT JOIN project_members pm ON pm.user_id = u.id
      LEFT JOIN analytics_events ae ON ae.user_id = u.id
      ${whereClause}
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT $1 OFFSET $2
    `, params)

    const total = await query(
      search ? `SELECT COUNT(*) FROM users WHERE email ILIKE $1` : `SELECT COUNT(*) FROM users`,
      search ? [`%${search}%`] : []
    )

    res.json({
      users: users.rows,
      total: parseInt(total.rows[0].count),
      limit,
      offset,
    })
  } catch (e) { next(e) }
})

// ── Toggle admin ───────────────────────────────────────────────────────────────
router.patch('/users/:userId/admin', async (req, res, next) => {
  try {
    const { isAdmin } = req.body
    await query('UPDATE users SET is_admin = $1 WHERE id = $2', [!!isAdmin, parseInt(req.params.userId)])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// ── Feedback ───────────────────────────────────────────────────────────────────
router.get('/feedback', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200)
    const offset = parseInt(req.query.offset) || 0
    const category = req.query.category || ''

    const whereClause = category ? `WHERE f.category = $3` : ''
    const params = category ? [limit, offset, category] : [limit, offset]

    const rows = await query(`
      SELECT
        f.id, f.is_guest, f.email, f.rating, f.message, f.category, f.metadata, f.created_at,
        f.session_id,
        u.email as user_email
      FROM feedback f
      LEFT JOIN users u ON u.id = f.user_id
      ${whereClause}
      ORDER BY f.created_at DESC
      LIMIT $1 OFFSET $2
    `, params)

    const total = await query(
      category ? `SELECT COUNT(*) FROM feedback WHERE category = $1` : `SELECT COUNT(*) FROM feedback`,
      category ? [category] : []
    )

    const avgRating = await query(`SELECT AVG(rating) FROM feedback WHERE rating IS NOT NULL`)

    res.json({
      feedback: rows.rows,
      total: parseInt(total.rows[0].count),
      avgRating: parseFloat(avgRating.rows[0].avg || 0).toFixed(1),
      limit,
      offset,
    })
  } catch (e) { next(e) }
})

// ── Delete feedback ────────────────────────────────────────────────────────────
router.delete('/feedback/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM feedback WHERE id = $1', [parseInt(req.params.id)])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

export default router
