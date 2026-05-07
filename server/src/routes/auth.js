import { Router } from 'express'
import {
  createUser, getUserByEmail, getUserById, getUserWithHashById, verifyPassword, signToken,
  createPasswordResetToken, validateResetToken, resetPassword, changePassword, updateAvatar,
} from '../services/authService.js'
import { sendPasswordResetEmail } from '../services/emailService.js'
import authenticate from '../middleware/authenticate.js'

const router = Router()

router.post('/register', async (req, res, next) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' })
  try {
    const existing = await getUserByEmail(email)
    if (existing) return res.status(409).json({ error: 'An account with this email already exists' })
    const user = await createUser({ email, password })
    res.status(201).json({ token: signToken(user.id, user.email), user: { id: user.id, email: user.email } })
  } catch (err) { next(err) }
})

router.post('/login', async (req, res, next) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })
  try {
    const user = await getUserByEmail(email)
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }
    res.json({ token: signToken(user.id, user.email), user: { id: user.id, email: user.email, avatar: user.avatar || null } })
  } catch (err) { next(err) }
})

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await getUserById(req.user.userId)
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json({ id: user.id, email: user.email, avatar: user.avatar || null, createdAt: user.created_at, isAdmin: !!user.is_admin })
  } catch (err) { next(err) }
})

router.post('/change-password', authenticate, async (req, res, next) => {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Current and new password are required' })
  if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' })
  try {
    const user = await getUserWithHashById(req.user.userId)
    if (!user) return res.status(404).json({ error: 'User not found' })
    const valid = await verifyPassword(currentPassword, user.password_hash)
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' })
    await changePassword(user.id, newPassword)
    res.json({ message: 'Password changed successfully' })
  } catch (err) { next(err) }
})

router.post('/forgot-password', async (req, res, next) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'Email is required' })
  try {
    const user = await getUserByEmail(email)
    if (user) {
      const token = await createPasswordResetToken(user.id)
      await sendPasswordResetEmail(user.email, token)
    }
    res.json({ message: 'If an account exists with that email, a reset link has been sent' })
  } catch (err) { next(err) }
})

router.post('/reset-password', async (req, res, next) => {
  const { token, password } = req.body
  if (!token || !password) return res.status(400).json({ error: 'Token and new password are required' })
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' })
  try {
    const tokenRow = await validateResetToken(token)
    if (!tokenRow) return res.status(400).json({ error: 'Reset link is invalid or has expired' })
    await resetPassword(tokenRow, password)
    res.json({ message: 'Password updated successfully' })
  } catch (err) { next(err) }
})

router.post('/avatar', authenticate, async (req, res, next) => {
  const { avatar } = req.body
  if (avatar != null) {
    if (typeof avatar !== 'string' || !avatar.startsWith('data:image/'))
      return res.status(400).json({ error: 'Invalid image format' })
    if (avatar.length > 800000)
      return res.status(400).json({ error: 'Image too large. Please use an image under 500KB.' })
  }
  try {
    await updateAvatar(req.user.userId, avatar ?? null)
    res.json({ avatar: avatar ?? null })
  } catch (err) { next(err) }
})

export default router
