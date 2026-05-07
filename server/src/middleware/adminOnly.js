import { query } from '../db/index.js'

export default async function adminOnly(req, res, next) {
  try {
    const result = await query('SELECT is_admin FROM users WHERE id = $1', [req.user.id || req.user.userId])
    if (!result.rows[0]?.is_admin) return res.status(403).json({ error: 'Admin access required' })
    next()
  } catch (e) { next(e) }
}
