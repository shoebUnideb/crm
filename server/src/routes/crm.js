import { Router } from 'express'
import authenticate from '../middleware/authenticate.js'
import { query } from '../db/index.js'

const router = Router()
router.use(authenticate)

const PROB = { lead: 10, qualified: 25, demo: 40, proposal: 60, negotiation: 80, won: 100, lost: 0 }
const uid = req => req.user.userId || req.user.id

// ── Deals ──────────────────────────────────────────────────────────────────────

router.get('/deals', async (req, res, next) => {
  try {
    const r = await query('SELECT * FROM crm_deals WHERE user_id = $1 ORDER BY updated_at DESC', [uid(req)])
    res.json(r.rows)
  } catch (e) { next(e) }
})

router.post('/deals', async (req, res, next) => {
  try {
    const {
      company_name, contact_name, contact_email, deal_value, stage,
      next_action, notes, last_contact_at, expected_close_date, probability,
      linkedin_url, follow_up_at, node_id, node_key, tags, assigned_to, project_id,
    } = req.body
    if (!company_name?.trim()) return res.status(400).json({ error: 'Company name is required' })
    const s = stage || 'lead'
    const r = await query(
      `INSERT INTO crm_deals
         (user_id, company_name, contact_name, contact_email, deal_value, stage, probability,
          next_action, notes, last_contact_at, expected_close_date,
          linkedin_url, follow_up_at, node_id, node_key, tags, assigned_to, stage_entered_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,NOW()) RETURNING *`,
      [uid(req), company_name.trim(), contact_name||null, contact_email||null,
       parseFloat(deal_value)||0, s, probability ?? PROB[s] ?? 10,
       next_action||null, notes||null, last_contact_at||null, expected_close_date||null,
       linkedin_url||null, follow_up_at||null, node_id||null, node_key||null,
       tags||'', assigned_to||null]
    )
    const deal = r.rows[0]

    if (node_id) {
      await query(
        `INSERT INTO entity_links (source_type, source_id, source_key, target_type, target_id, relation, user_id, project_id)
         VALUES ('node', $1, $2, 'crm_deal', $3, 'linked_to', $4, $5)
         ON CONFLICT (source_type, source_id, target_type, target_id, relation) WHERE deleted_at IS NULL DO NOTHING`,
        [node_id, node_key || null, String(deal.id), uid(req), project_id || null]
      )
    }

    res.status(201).json(deal)
  } catch (e) { next(e) }
})

router.put('/deals/:id', async (req, res, next) => {
  try {
    const {
      company_name, contact_name, contact_email, deal_value, stage,
      next_action, notes, last_contact_at, expected_close_date, probability,
      linkedin_url, follow_up_at, node_id, node_key, lost_reason, tags, assigned_to, project_id,
    } = req.body
    if (!company_name?.trim()) return res.status(400).json({ error: 'Company name is required' })
    const s = stage || 'lead'
    const dealId = parseInt(req.params.id)
    const existing = await query('SELECT stage, node_id FROM crm_deals WHERE id=$1 AND user_id=$2', [dealId, uid(req)])
    if (!existing.rows[0]) return res.status(404).json({ error: 'Deal not found' })
    const stageChanged = existing.rows[0].stage !== s
    const oldNodeId = existing.rows[0].node_id
    const r = await query(
      `UPDATE crm_deals SET
         company_name=$1, contact_name=$2, contact_email=$3, deal_value=$4, stage=$5,
         probability=$6, next_action=$7, notes=$8, last_contact_at=$9,
         expected_close_date=$10, updated_at=NOW(),
         linkedin_url=$11, follow_up_at=$12, node_id=$13, node_key=$14, lost_reason=$15,
         tags=$16, assigned_to=$17,
         stage_entered_at = CASE WHEN $18 THEN NOW() ELSE stage_entered_at END
       WHERE id=$19 AND user_id=$20 RETURNING *`,
      [company_name.trim(), contact_name||null, contact_email||null,
       parseFloat(deal_value)||0, s, probability ?? PROB[s] ?? 10,
       next_action||null, notes||null, last_contact_at||null, expected_close_date||null,
       linkedin_url||null, follow_up_at||null, node_id||null, node_key||null, lost_reason||null,
       tags||'', assigned_to||null,
       stageChanged, dealId, uid(req)]
    )

    // Sync entity_links when node linkage changes
    if (oldNodeId && oldNodeId !== node_id) {
      await query(
        `UPDATE entity_links SET deleted_at = NOW(), updated_at = NOW()
         WHERE source_type = 'node' AND source_id = $1 AND target_type = 'crm_deal' AND target_id = $2 AND deleted_at IS NULL`,
        [oldNodeId, String(dealId)]
      )
    }
    if (node_id && node_id !== oldNodeId) {
      await query(
        `INSERT INTO entity_links (source_type, source_id, source_key, target_type, target_id, relation, user_id, project_id)
         VALUES ('node', $1, $2, 'crm_deal', $3, 'linked_to', $4, $5)
         ON CONFLICT (source_type, source_id, target_type, target_id, relation) WHERE deleted_at IS NULL DO NOTHING`,
        [node_id, node_key || null, String(dealId), uid(req), project_id || null]
      )
    }

    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.patch('/deals/:id/stage', async (req, res, next) => {
  try {
    const { stage, lost_reason } = req.body
    if (!PROB.hasOwnProperty(stage)) return res.status(400).json({ error: 'Invalid stage' })
    const r = await query(
      `UPDATE crm_deals SET stage=$1, probability=$2, updated_at=NOW(), stage_entered_at=NOW(),
         lost_reason = COALESCE($3::text, lost_reason)
       WHERE id=$4 AND user_id=$5 RETURNING *`,
      [stage, PROB[stage], lost_reason||null, parseInt(req.params.id), uid(req)]
    )
    if (!r.rows[0]) return res.status(404).json({ error: 'Deal not found' })
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.patch('/deals/:id/followup', async (req, res, next) => {
  try {
    const { follow_up_at } = req.body
    const r = await query(
      'UPDATE crm_deals SET follow_up_at=$1, updated_at=NOW() WHERE id=$2 AND user_id=$3 RETURNING *',
      [follow_up_at||null, parseInt(req.params.id), uid(req)]
    )
    if (!r.rows[0]) return res.status(404).json({ error: 'Deal not found' })
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/deals/:id', async (req, res, next) => {
  try {
    const dealId = parseInt(req.params.id)
    await query(
      `UPDATE entity_links SET deleted_at = NOW(), updated_at = NOW()
       WHERE target_type = 'crm_deal' AND target_id = $1 AND deleted_at IS NULL`,
      [String(dealId)]
    )
    await query('DELETE FROM crm_deals WHERE id=$1 AND user_id=$2', [dealId, uid(req)])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// ── Contacts ───────────────────────────────────────────────────────────────────

router.get('/deals/:id/contacts', async (req, res, next) => {
  try {
    const r = await query(
      'SELECT * FROM crm_contacts WHERE deal_id=$1 ORDER BY is_primary DESC, created_at',
      [parseInt(req.params.id)]
    )
    res.json(r.rows)
  } catch (e) { next(e) }
})

router.post('/deals/:id/contacts', async (req, res, next) => {
  try {
    const { name, email, phone, role, linkedin_url, is_primary } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Name required' })
    const r = await query(
      'INSERT INTO crm_contacts (deal_id, name, email, phone, role, linkedin_url, is_primary) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [parseInt(req.params.id), name.trim(), email||null, phone||null, role||null, linkedin_url||null, is_primary||false]
    )
    res.status(201).json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/contacts/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM crm_contacts WHERE id=$1', [parseInt(req.params.id)])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// ── Activities ─────────────────────────────────────────────────────────────────

router.get('/deals/:id/activities', async (req, res, next) => {
  try {
    const r = await query(
      'SELECT * FROM crm_activities WHERE deal_id=$1 ORDER BY occurred_at DESC',
      [parseInt(req.params.id)]
    )
    res.json(r.rows)
  } catch (e) { next(e) }
})

router.post('/deals/:id/activities', async (req, res, next) => {
  try {
    const { type, title, body, occurred_at, remind_at } = req.body
    const r = await query(
      'INSERT INTO crm_activities (deal_id, type, title, body, occurred_at, remind_at) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [parseInt(req.params.id), type||'note', title||null, body||null,
       occurred_at||new Date().toISOString(), remind_at||null]
    )
    res.status(201).json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/activities/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM crm_activities WHERE id=$1', [parseInt(req.params.id)])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// ── Tasks ──────────────────────────────────────────────────────────────────────

router.get('/deals/:id/tasks', async (req, res, next) => {
  try {
    const r = await query(
      'SELECT * FROM crm_tasks WHERE deal_id=$1 ORDER BY done ASC, due_at ASC NULLS LAST, created_at',
      [parseInt(req.params.id)]
    )
    res.json(r.rows)
  } catch (e) { next(e) }
})

router.post('/deals/:id/tasks', async (req, res, next) => {
  try {
    const { title, due_at } = req.body
    if (!title?.trim()) return res.status(400).json({ error: 'Title required' })
    const r = await query(
      'INSERT INTO crm_tasks (deal_id, title, due_at) VALUES ($1,$2,$3) RETURNING *',
      [parseInt(req.params.id), title.trim(), due_at||null]
    )
    res.status(201).json(r.rows[0])
  } catch (e) { next(e) }
})

router.patch('/tasks/:id', async (req, res, next) => {
  try {
    const { done } = req.body
    const r = await query('UPDATE crm_tasks SET done=$1 WHERE id=$2 RETURNING *', [done, parseInt(req.params.id)])
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/tasks/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM crm_tasks WHERE id=$1', [parseInt(req.params.id)])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// ── Comments (F18) ─────────────────────────────────────────────────────────────

router.get('/deals/:id/comments', async (req, res, next) => {
  try {
    const r = await query(
      `SELECT c.*, u.email as author_email FROM crm_comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.deal_id=$1 ORDER BY c.created_at ASC`,
      [parseInt(req.params.id)]
    )
    res.json(r.rows)
  } catch (e) { next(e) }
})

router.post('/deals/:id/comments', async (req, res, next) => {
  try {
    const { body } = req.body
    if (!body?.trim()) return res.status(400).json({ error: 'Comment body required' })
    const r = await query(
      `INSERT INTO crm_comments (deal_id, user_id, body) VALUES ($1,$2,$3)
       RETURNING *, (SELECT email FROM users WHERE id=$2) as author_email`,
      [parseInt(req.params.id), uid(req), body.trim()]
    )
    res.status(201).json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/comments/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM crm_comments WHERE id=$1 AND user_id=$2', [parseInt(req.params.id), uid(req)])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// ── Goals (F19) ────────────────────────────────────────────────────────────────

router.get('/goals', async (req, res, next) => {
  try {
    const r = await query('SELECT * FROM crm_goals WHERE user_id=$1 ORDER BY period_key DESC', [uid(req)])
    res.json(r.rows)
  } catch (e) { next(e) }
})

router.post('/goals', async (req, res, next) => {
  try {
    const { period_key, target_value, target_count } = req.body
    if (!period_key) return res.status(400).json({ error: 'period_key required' })
    const r = await query(
      `INSERT INTO crm_goals (user_id, period_key, target_value, target_count)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (user_id, period_key)
       DO UPDATE SET target_value=$3, target_count=$4
       RETURNING *`,
      [uid(req), period_key, parseFloat(target_value)||0, parseInt(target_count)||0]
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/goals/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM crm_goals WHERE id=$1 AND user_id=$2', [parseInt(req.params.id), uid(req)])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// ── Email Templates (F5) ───────────────────────────────────────────────────────

router.get('/email-templates', async (req, res, next) => {
  try {
    const r = await query('SELECT * FROM crm_email_templates WHERE user_id=$1 ORDER BY created_at DESC', [uid(req)])
    res.json(r.rows)
  } catch (e) { next(e) }
})

router.post('/email-templates', async (req, res, next) => {
  try {
    const { name, subject, body } = req.body
    if (!name?.trim() || !body?.trim()) return res.status(400).json({ error: 'Name and body required' })
    const r = await query(
      'INSERT INTO crm_email_templates (user_id, name, subject, body) VALUES ($1,$2,$3,$4) RETURNING *',
      [uid(req), name.trim(), subject||null, body.trim()]
    )
    res.status(201).json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/email-templates/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM crm_email_templates WHERE id=$1 AND user_id=$2', [parseInt(req.params.id), uid(req)])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

export default router
