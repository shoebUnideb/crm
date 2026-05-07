import { verifyToken } from '../services/authService.js'

export default function authenticate(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  try {
    const payload = verifyToken(header.slice(7))
    req.user = { ...payload, id: payload.userId }
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired session — please sign in again' })
  }
}
