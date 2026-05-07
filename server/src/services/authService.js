import { query } from '../db/index.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'

export async function createUser({ email, password }) {
  const passwordHash = await bcrypt.hash(password, 12)
  const { rows } = await query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
    [email.toLowerCase().trim(), passwordHash]
  )
  return rows[0]
}

export async function getUserByEmail(email) {
  const { rows } = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()])
  return rows[0] || null
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash)
}

export function signToken(userId, email) {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET)
}

export async function createPasswordResetToken(userId) {
  await query('DELETE FROM password_reset_tokens WHERE user_id = $1', [userId])
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)
  await query(
    'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, token, expiresAt]
  )
  return token
}

export async function validateResetToken(token) {
  const { rows } = await query(
    'SELECT * FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW()',
    [token]
  )
  return rows[0] || null
}

export async function resetPassword(tokenRow, newPassword) {
  const hash = await bcrypt.hash(newPassword, 12)
  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, tokenRow.user_id])
  await query('DELETE FROM password_reset_tokens WHERE id = $1', [tokenRow.id])
}

export async function getUserById(userId) {
  const { rows } = await query('SELECT id, email, avatar, created_at, is_admin FROM users WHERE id = $1', [userId])
  return rows[0] || null
}

export async function getUserWithHashById(userId) {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [userId])
  return rows[0] || null
}

export async function changePassword(userId, newPassword) {
  const hash = await bcrypt.hash(newPassword, 12)
  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, userId])
}

export async function updateAvatar(userId, avatar) {
  await query('UPDATE users SET avatar = $1 WHERE id = $2', [avatar, userId])
}
