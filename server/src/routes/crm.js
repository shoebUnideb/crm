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
      linkedin_url, follow_up_at, node_id, node_key, tags, assigned_to, project_id, pipeline_id,
    } = req.body
    if (!company_name?.trim()) return res.status(400).json({ error: 'Company name is required' })
    const s = stage || 'lead'
    const r = await query(
      `INSERT INTO crm_deals
         (user_id, company_name, contact_name, contact_email, deal_value, stage, probability,
          next_action, notes, last_contact_at, expected_close_date,
          linkedin_url, follow_up_at, node_id, node_key, tags, assigned_to, stage_entered_at, pipeline_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,NOW(),$18) RETURNING *`,
      [uid(req), company_name.trim(), contact_name||null, contact_email||null,
       parseFloat(deal_value)||0, s, probability ?? PROB[s] ?? 10,
       next_action||null, notes||null, last_contact_at||null, expected_close_date||null,
       linkedin_url||null, follow_up_at||null, node_id||null, node_key||null,
       tags||'', assigned_to||null, pipeline_id||null]
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

    // Timeline + Audit
    await query(`INSERT INTO crm_timeline (user_id, deal_id, event_type, title) VALUES ($1,$2,'deal_created',$3)`, [uid(req), deal.id, `Deal created: ${deal.company_name}`]).catch(() => {})
    await query(`INSERT INTO crm_audit_log (user_id, entity_type, entity_id, action, changes) VALUES ($1,'deal',$2,'created',$3)`, [uid(req), deal.id, JSON.stringify({ company_name, deal_value, stage: s })]).catch(() => {})

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
    if (!stage) return res.status(400).json({ error: 'stage required' })
    const userId = uid(req)
    const dealId = parseInt(req.params.id)
    const oldDeal = (await query('SELECT stage FROM crm_deals WHERE id=$1 AND user_id=$2', [dealId, userId])).rows[0]
    const sr = await query('SELECT probability FROM crm_stages WHERE user_id=$1 AND name=$2', [userId, stage])
    const prob = sr.rows.length ? sr.rows[0].probability : (PROB[stage] ?? 10)
    const r = await query(
      `UPDATE crm_deals SET stage=$1, probability=$2, updated_at=NOW(), stage_entered_at=NOW(),
         lost_reason = COALESCE($3::text, lost_reason)
       WHERE id=$4 AND user_id=$5 RETURNING *`,
      [stage, prob, lost_reason||null, dealId, userId]
    )
    if (!r.rows[0]) return res.status(404).json({ error: 'Deal not found' })
    // Timeline + Audit log
    await query(
      `INSERT INTO crm_timeline (user_id, deal_id, event_type, title, metadata) VALUES ($1,$2,'stage_change',$3,$4)`,
      [userId, dealId, `Stage: ${oldDeal?.stage || '?'} → ${stage}`, JSON.stringify({ from: oldDeal?.stage, to: stage })]
    ).catch(() => {})
    await query(
      `INSERT INTO crm_audit_log (user_id, entity_type, entity_id, action, changes) VALUES ($1,'deal',$2,'stage_change',$3)`,
      [userId, dealId, JSON.stringify({ from: oldDeal?.stage, to: stage })]
    ).catch(() => {})
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
    const dealId = parseInt(req.params.id)
    const userId = uid(req)
    const r = await query(
      'INSERT INTO crm_contacts (deal_id, name, email, phone, role, linkedin_url, is_primary) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [dealId, name.trim(), email||null, phone||null, role||null, linkedin_url||null, is_primary||false]
    )
    const personR = await query(
      `INSERT INTO crm_people (user_id, name, email, phone, role, linkedin_url)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [userId, name.trim(), email||null, phone||null, role||null, linkedin_url||null]
    )
    const personId = personR.rows[0].id
    await query(
      `INSERT INTO crm_deal_people (deal_id, person_id, role) VALUES ($1,$2,$3)
       ON CONFLICT (deal_id, person_id) DO UPDATE SET role = EXCLUDED.role`,
      [dealId, personId, role||null]
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
    const dealId = parseInt(req.params.id)
    const userId = uid(req)
    const { type, title, body, occurred_at, remind_at } = req.body
    const r = await query(
      'INSERT INTO crm_activities (deal_id, type, title, body, occurred_at, remind_at) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [dealId, type||'note', title||null, body||null,
       occurred_at||new Date().toISOString(), remind_at||null]
    )
    if (type === 'meeting' || type === 'call') {
      const startAt = occurred_at || new Date().toISOString()
      const endAt = new Date(new Date(startAt).getTime() + 3600000).toISOString()
      await query(
        `INSERT INTO crm_meetings (user_id, deal_id, title, description, start_at, end_at)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [userId, dealId, title || body || type, body||'', startAt, endAt]
      )
    }
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

// ── People ─────────────────────────────────────────────────────────────────────

router.get('/people', async (req, res, next) => {
  try {
    const r = await query(
      `SELECT p.*,
         COUNT(DISTINCT CASE WHEN d.stage NOT IN ('won','lost') THEN dp.deal_id END) AS open_deals,
         COUNT(DISTINCT CASE WHEN d.stage IN ('won','lost') THEN dp.deal_id END) AS closed_deals,
         COUNT(DISTINCT CASE WHEN d.stage = 'won' THEN dp.deal_id END) AS won_deals,
         COUNT(DISTINCT CASE WHEN d.stage = 'lost' THEN dp.deal_id END) AS lost_deals,
         (SELECT COUNT(*) FROM crm_people_activities a WHERE a.person_id = p.id) AS total_activities,
         (SELECT COUNT(*) FROM crm_people_activities a WHERE a.person_id = p.id AND a.done = true) AS done_activities,
         (SELECT COUNT(*) FROM crm_people_activities a WHERE a.person_id = p.id AND a.done = false) AS activities_to_do,
         (SELECT MAX(a.occurred_at) FROM crm_people_activities a WHERE a.person_id = p.id AND a.done = true) AS last_activity_date
       FROM crm_people p
       LEFT JOIN crm_deal_people dp ON dp.person_id = p.id
       LEFT JOIN crm_deals d ON d.id = dp.deal_id
       WHERE p.user_id = $1
       GROUP BY p.id
       ORDER BY p.updated_at DESC`,
      [uid(req)]
    )
    res.json(r.rows)
  } catch (e) { next(e) }
})

router.post('/people', async (req, res, next) => {
  try {
    const { name, email, phone, organization, org_id, role, linkedin_url, notes, label, birthday, owner, visible_to, email_type, phone_type } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Name required' })
    const r = await query(
      `INSERT INTO crm_people (user_id, name, email, phone, organization, org_id, role, linkedin_url, notes, label, birthday, owner, visible_to, email_type, phone_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [uid(req), name.trim(), email||null, phone||null, organization||null, org_id||null, role||null, linkedin_url||null, notes||null, label||null, birthday||null, owner||null, visible_to||'group', email_type||'work', phone_type||'work']
    )
    res.status(201).json(r.rows[0])
  } catch (e) { next(e) }
})

router.get('/people/:id', async (req, res, next) => {
  try {
    const personId = parseInt(req.params.id)
    const [person, deals, activities] = await Promise.all([
      query('SELECT * FROM crm_people WHERE id=$1 AND user_id=$2', [personId, uid(req)]),
      query(
        `SELECT d.*, dp.role AS link_role FROM crm_deals d
         JOIN crm_deal_people dp ON dp.deal_id = d.id
         WHERE dp.person_id = $1 ORDER BY d.updated_at DESC`,
        [personId]
      ),
      query('SELECT * FROM crm_people_activities WHERE person_id=$1 ORDER BY occurred_at DESC', [personId]),
    ])
    if (!person.rows[0]) return res.status(404).json({ error: 'Person not found' })
    res.json({ ...person.rows[0], deals: deals.rows, activities: activities.rows })
  } catch (e) { next(e) }
})

router.put('/people/:id', async (req, res, next) => {
  try {
    const { name, email, phone, organization, org_id, role, linkedin_url, notes, label, birthday, owner, visible_to, email_type, phone_type } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Name required' })
    const r = await query(
      `UPDATE crm_people SET name=$1, email=$2, phone=$3, organization=$4, org_id=$5, role=$6,
         linkedin_url=$7, notes=$8, label=$9, birthday=$10, owner=$11, visible_to=$12,
         email_type=$13, phone_type=$14, updated_at=NOW()
       WHERE id=$15 AND user_id=$16 RETURNING *`,
      [name.trim(), email||null, phone||null, organization||null, org_id||null, role||null,
       linkedin_url||null, notes||null, label||null, birthday||null, owner||null, visible_to||'group',
       email_type||'work', phone_type||'work', parseInt(req.params.id), uid(req)]
    )
    if (!r.rows[0]) return res.status(404).json({ error: 'Person not found' })
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/people/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM crm_people WHERE id=$1 AND user_id=$2', [parseInt(req.params.id), uid(req)])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

router.get('/people/:id/activities', async (req, res, next) => {
  try {
    const r = await query(
      'SELECT * FROM crm_people_activities WHERE person_id=$1 ORDER BY occurred_at DESC',
      [parseInt(req.params.id)]
    )
    res.json(r.rows)
  } catch (e) { next(e) }
})

router.post('/people/:id/activities', async (req, res, next) => {
  try {
    const { type, title, body, occurred_at, due_date } = req.body
    const r = await query(
      `INSERT INTO crm_people_activities (person_id, type, title, body, occurred_at, due_date)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [parseInt(req.params.id), type||'note', title||null, body||null, occurred_at||new Date().toISOString(), due_date||null]
    )
    res.status(201).json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/people/activities/:actId', async (req, res, next) => {
  try {
    await query('DELETE FROM crm_people_activities WHERE id=$1', [parseInt(req.params.actId)])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

router.put('/people/activities/:actId', async (req, res, next) => {
  try {
    const { type, title, body, occurred_at, due_date } = req.body
    const r = await query(
      `UPDATE crm_people_activities SET type=$1, title=$2, body=$3, occurred_at=$4, due_date=$5 WHERE id=$6 RETURNING *`,
      [type || 'note', title || '', body || '', occurred_at || new Date().toISOString(), due_date || null, parseInt(req.params.actId)]
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.post('/deals/:id/people/:personId', async (req, res, next) => {
  try {
    const { role } = req.body
    await query(
      `INSERT INTO crm_deal_people (deal_id, person_id, role) VALUES ($1,$2,$3)
       ON CONFLICT (deal_id, person_id) DO UPDATE SET role = EXCLUDED.role`,
      [parseInt(req.params.id), parseInt(req.params.personId), role||null]
    )
    res.json({ ok: true })
  } catch (e) { next(e) }
})

router.delete('/deals/:id/people/:personId', async (req, res, next) => {
  try {
    await query(
      'DELETE FROM crm_deal_people WHERE deal_id=$1 AND person_id=$2',
      [parseInt(req.params.id), parseInt(req.params.personId)]
    )
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// ── Organizations ───────────────────────────────────────────────────────────────

router.get('/organizations', async (req, res, next) => {
  try {
    const r = await query(
      `SELECT o.*,
         COALESCE(
           json_agg(
             json_build_object('id', p.id, 'name', p.name, 'role', p.role, 'email', p.email)
             ORDER BY p.name
           ) FILTER (WHERE p.id IS NOT NULL), '[]'
         ) AS people,
         COUNT(DISTINCT p.id) FILTER (WHERE p.id IS NOT NULL) AS people_count,
         (SELECT COUNT(*) FROM crm_deals d WHERE d.user_id = o.user_id AND LOWER(d.company_name) = LOWER(o.name) AND d.stage NOT IN ('lost')) AS open_deals,
         (SELECT COUNT(*) FROM crm_deals d WHERE d.user_id = o.user_id AND LOWER(d.company_name) = LOWER(o.name) AND d.stage = 'won') AS won_deals,
         (SELECT COUNT(*) FROM crm_deals d WHERE d.user_id = o.user_id AND LOWER(d.company_name) = LOWER(o.name) AND d.stage = 'lost') AS lost_deals,
         (SELECT COUNT(*) FROM crm_deals d WHERE d.user_id = o.user_id AND LOWER(d.company_name) = LOWER(o.name) AND d.stage IN ('won','lost')) AS closed_deals,
         (SELECT COUNT(*) FROM crm_org_activities a WHERE a.org_id = o.id) AS total_activities,
         (SELECT COUNT(*) FROM crm_org_activities a WHERE a.org_id = o.id AND a.done = true) AS done_activities,
         (SELECT COUNT(*) FROM crm_org_activities a WHERE a.org_id = o.id AND a.done = false) AS activities_to_do,
         (SELECT MAX(a.due_date) FROM crm_org_activities a WHERE a.org_id = o.id AND a.done = true) AS last_activity_date,
         COALESCE((SELECT json_agg(json_build_object('id', e.id, 'email', e.email, 'type', e.type, 'is_primary', e.is_primary) ORDER BY e.is_primary DESC, e.id) FROM crm_org_emails e WHERE e.org_id = o.id), '[]') AS emails,
         COALESCE((SELECT json_agg(json_build_object('id', ph.id, 'phone', ph.phone, 'type', ph.type, 'is_primary', ph.is_primary) ORDER BY ph.is_primary DESC, ph.id) FROM crm_org_phones ph WHERE ph.org_id = o.id), '[]') AS phones
       FROM crm_organizations o
       LEFT JOIN crm_people p ON p.org_id = o.id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.updated_at DESC`,
      [uid(req)]
    )
    res.json(r.rows)
  } catch (e) { next(e) }
})

router.post('/organizations', async (req, res, next) => {
  try {
    const { name, industry, website, address, notes, parent_org_id, label, owner, visible_to, email, phone, linkedin, annual_revenue, employees, street, city, state, zip_code, country, region } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Name required' })
    const r = await query(
      `INSERT INTO crm_organizations (user_id, name, industry, website, address, notes, parent_org_id, label, owner, visible_to, email, phone, linkedin, annual_revenue, employees, street, city, state, zip_code, country, region)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21) RETURNING *`,
      [uid(req), name.trim(), industry||null, website||null, address||null, notes||null, parent_org_id||null, label||null, owner||null, visible_to||'group', email||null, phone||null, linkedin||null, annual_revenue||null, employees||null, street||null, city||null, state||null, zip_code||null, country||null, region||null]
    )
    res.status(201).json(r.rows[0])
  } catch (e) { next(e) }
})

router.put('/organizations/:id', async (req, res, next) => {
  try {
    const { name, industry, website, address, notes, parent_org_id, label, owner, visible_to, email, phone, linkedin, annual_revenue, employees, street, city, state, zip_code, country, region } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Name required' })
    const r = await query(
      `UPDATE crm_organizations SET name=$1, industry=$2, website=$3, address=$4, notes=$5, parent_org_id=$6,
       label=$7, owner=$8, visible_to=$9, email=$10, phone=$11, linkedin=$12,
       annual_revenue=$13, employees=$14, street=$15, city=$16, state=$17, zip_code=$18, country=$19, region=$20, updated_at=NOW()
       WHERE id=$21 AND user_id=$22 RETURNING *`,
      [name.trim(), industry||null, website||null, address||null, notes||null, parent_org_id||null, label||null, owner||null, visible_to||'group', email||null, phone||null, linkedin||null, annual_revenue||null, employees||null, street||null, city||null, state||null, zip_code||null, country||null, region||null, parseInt(req.params.id), uid(req)]
    )
    if (!r.rows[0]) return res.status(404).json({ error: 'Organization not found' })
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/organizations/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM crm_organizations WHERE id=$1 AND user_id=$2', [parseInt(req.params.id), uid(req)])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// PATCH /organizations/:id — partial update for inline editing
const ORG_EDITABLE_FIELDS = ['name','email','phone','address','industry','website','linkedin','annual_revenue','employees','label','owner','visible_to','street','city','state','zip_code','country','region','notes']
router.patch('/organizations/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    const updates = req.body
    const fields = Object.keys(updates).filter(k => ORG_EDITABLE_FIELDS.includes(k))
    if (fields.length === 0) return res.status(400).json({ error: 'No valid fields to update' })
    const sets = fields.map((f, i) => `${f}=$${i + 1}`)
    sets.push(`updated_at=NOW()`)
    const vals = fields.map(f => updates[f] || null)
    vals.push(id, uid(req))
    const r = await query(
      `UPDATE crm_organizations SET ${sets.join(', ')} WHERE id=$${vals.length - 1} AND user_id=$${vals.length} RETURNING *`,
      vals
    )
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' })
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

// POST /organizations/:id/clone
router.post('/organizations/:id/clone', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    const orig = await query('SELECT * FROM crm_organizations WHERE id=$1 AND user_id=$2', [id, uid(req)])
    if (!orig.rows[0]) return res.status(404).json({ error: 'Not found' })
    const o = orig.rows[0]
    const r = await query(
      `INSERT INTO crm_organizations (user_id, name, industry, website, address, notes, parent_org_id, label, owner, visible_to, email, phone, linkedin, annual_revenue, employees, street, city, state, zip_code, country, region)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21) RETURNING *`,
      [uid(req), o.name + ' (Copy)', o.industry, o.website, o.address, o.notes, o.parent_org_id, o.label, o.owner, o.visible_to, o.email, o.phone, o.linkedin, o.annual_revenue, o.employees, o.street, o.city, o.state, o.zip_code, o.country, o.region]
    )
    const newId = r.rows[0].id
    await query(`INSERT INTO crm_org_emails (org_id, email, type, is_primary) SELECT $1, email, type, is_primary FROM crm_org_emails WHERE org_id=$2`, [newId, id])
    await query(`INSERT INTO crm_org_phones (org_id, phone, type, is_primary) SELECT $1, phone, type, is_primary FROM crm_org_phones WHERE org_id=$2`, [newId, id])
    res.status(201).json(r.rows[0])
  } catch (e) { next(e) }
})

// Org Emails CRUD
router.get('/organizations/:id/emails', async (req, res, next) => {
  try {
    const r = await query('SELECT * FROM crm_org_emails WHERE org_id=$1 ORDER BY is_primary DESC, id', [parseInt(req.params.id)])
    res.json(r.rows)
  } catch (e) { next(e) }
})

router.post('/organizations/:id/emails', async (req, res, next) => {
  try {
    const orgId = parseInt(req.params.id)
    const { email, type, is_primary } = req.body
    if (!email?.trim()) return res.status(400).json({ error: 'Email required' })
    if (is_primary) await query('UPDATE crm_org_emails SET is_primary=false WHERE org_id=$1', [orgId])
    const r = await query(
      'INSERT INTO crm_org_emails (org_id, email, type, is_primary) VALUES ($1,$2,$3,$4) RETURNING *',
      [orgId, email.trim(), type || 'work', is_primary || false]
    )
    if (is_primary) await query('UPDATE crm_organizations SET email=$1, updated_at=NOW() WHERE id=$2', [email.trim(), orgId])
    res.status(201).json(r.rows[0])
  } catch (e) { next(e) }
})

router.put('/organizations/:id/emails/:eid', async (req, res, next) => {
  try {
    const orgId = parseInt(req.params.id)
    const eid = parseInt(req.params.eid)
    const { email, type, is_primary } = req.body
    if (is_primary) await query('UPDATE crm_org_emails SET is_primary=false WHERE org_id=$1', [orgId])
    const r = await query(
      'UPDATE crm_org_emails SET email=COALESCE($1,email), type=COALESCE($2,type), is_primary=COALESCE($3,is_primary) WHERE id=$4 AND org_id=$5 RETURNING *',
      [email || null, type || null, is_primary, eid, orgId]
    )
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' })
    if (is_primary) await query('UPDATE crm_organizations SET email=$1, updated_at=NOW() WHERE id=$2', [r.rows[0].email, orgId])
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/organizations/:id/emails/:eid', async (req, res, next) => {
  try {
    const orgId = parseInt(req.params.id)
    await query('DELETE FROM crm_org_emails WHERE id=$1 AND org_id=$2', [parseInt(req.params.eid), orgId])
    const primary = await query('SELECT email FROM crm_org_emails WHERE org_id=$1 AND is_primary=true LIMIT 1', [orgId])
    const fallback = await query('SELECT email FROM crm_org_emails WHERE org_id=$1 ORDER BY id LIMIT 1', [orgId])
    const newPrimary = primary.rows[0]?.email || fallback.rows[0]?.email || null
    await query('UPDATE crm_organizations SET email=$1, updated_at=NOW() WHERE id=$2', [newPrimary, orgId])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// Org Phones CRUD
router.get('/organizations/:id/phones', async (req, res, next) => {
  try {
    const r = await query('SELECT * FROM crm_org_phones WHERE org_id=$1 ORDER BY is_primary DESC, id', [parseInt(req.params.id)])
    res.json(r.rows)
  } catch (e) { next(e) }
})

router.post('/organizations/:id/phones', async (req, res, next) => {
  try {
    const orgId = parseInt(req.params.id)
    const { phone, type, is_primary } = req.body
    if (!phone?.trim()) return res.status(400).json({ error: 'Phone required' })
    if (is_primary) await query('UPDATE crm_org_phones SET is_primary=false WHERE org_id=$1', [orgId])
    const r = await query(
      'INSERT INTO crm_org_phones (org_id, phone, type, is_primary) VALUES ($1,$2,$3,$4) RETURNING *',
      [orgId, phone.trim(), type || 'work', is_primary || false]
    )
    if (is_primary) await query('UPDATE crm_organizations SET phone=$1, updated_at=NOW() WHERE id=$2', [phone.trim(), orgId])
    res.status(201).json(r.rows[0])
  } catch (e) { next(e) }
})

router.put('/organizations/:id/phones/:pid', async (req, res, next) => {
  try {
    const orgId = parseInt(req.params.id)
    const pid = parseInt(req.params.pid)
    const { phone, type, is_primary } = req.body
    if (is_primary) await query('UPDATE crm_org_phones SET is_primary=false WHERE org_id=$1', [orgId])
    const r = await query(
      'UPDATE crm_org_phones SET phone=COALESCE($1,phone), type=COALESCE($2,type), is_primary=COALESCE($3,is_primary) WHERE id=$4 AND org_id=$5 RETURNING *',
      [phone || null, type || null, is_primary, pid, orgId]
    )
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' })
    if (is_primary) await query('UPDATE crm_organizations SET phone=$1, updated_at=NOW() WHERE id=$2', [r.rows[0].phone, orgId])
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/organizations/:id/phones/:pid', async (req, res, next) => {
  try {
    const orgId = parseInt(req.params.id)
    await query('DELETE FROM crm_org_phones WHERE id=$1 AND org_id=$2', [parseInt(req.params.pid), orgId])
    const primary = await query('SELECT phone FROM crm_org_phones WHERE org_id=$1 AND is_primary=true LIMIT 1', [orgId])
    const fallback = await query('SELECT phone FROM crm_org_phones WHERE org_id=$1 ORDER BY id LIMIT 1', [orgId])
    const newPrimary = primary.rows[0]?.phone || fallback.rows[0]?.phone || null
    await query('UPDATE crm_organizations SET phone=$1, updated_at=NOW() WHERE id=$2', [newPrimary, orgId])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

router.post('/organizations/:id/people/:personId', async (req, res, next) => {
  try {
    const r = await query(
      `UPDATE crm_people SET org_id=$1, updated_at=NOW() WHERE id=$2 AND user_id=$3 RETURNING *`,
      [parseInt(req.params.id), parseInt(req.params.personId), uid(req)]
    )
    if (!r.rows[0]) return res.status(404).json({ error: 'Person not found' })
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/organizations/:id/people/:personId', async (req, res, next) => {
  try {
    await query(
      `UPDATE crm_people SET org_id=NULL, updated_at=NOW() WHERE id=$1 AND user_id=$2`,
      [parseInt(req.params.personId), uid(req)]
    )
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// Link deal to org
router.post('/organizations/:id/deals/:dealId', async (req, res, next) => {
  try {
    const orgId = parseInt(req.params.id)
    const dealId = parseInt(req.params.dealId)
    await query(
      `UPDATE crm_deals SET org_id=$1, updated_at=NOW() WHERE id=$2 AND user_id=$3`,
      [orgId, dealId, uid(req)]
    )
    const r = await query(`SELECT * FROM crm_deals WHERE id=$1`, [dealId])
    res.json(r.rows[0] || { ok: true })
  } catch (e) { next(e) }
})

// Unlink deal from org
router.delete('/organizations/:id/deals/:dealId', async (req, res, next) => {
  try {
    const dealId = parseInt(req.params.dealId)
    await query(
      `UPDATE crm_deals SET org_id=NULL, updated_at=NOW() WHERE id=$1 AND user_id=$2`,
      [dealId, uid(req)]
    )
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// Get all deals (for linking)
router.get('/organizations/all-deals', async (req, res, next) => {
  try {
    const r = await query(
      `SELECT id, company_name, deal_value, stage, currency FROM crm_deals WHERE user_id=$1 ORDER BY updated_at DESC`,
      [uid(req)]
    )
    res.json(r.rows)
  } catch (e) { next(e) }
})

// ── Bulk operations ─────────────────────────────────────────────────────────────

router.post('/organizations/bulk-delete', async (req, res, next) => {
  try {
    const { ids } = req.body
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'ids required' })
    await query('DELETE FROM crm_organizations WHERE id = ANY($1) AND user_id=$2', [ids, uid(req)])
    res.json({ ok: true, deleted: ids.length })
  } catch (e) { next(e) }
})

router.patch('/organizations/bulk-update', async (req, res, next) => {
  try {
    const { ids, ...data } = req.body
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'ids required' })
    const allowed = ['industry', 'label', 'owner', 'visible_to', 'website', 'region', 'country']
    const sets = []
    const vals = []
    let idx = 1
    for (const field of allowed) {
      if (data[field] !== undefined) {
        sets.push(`${field}=$${idx}`)
        vals.push(data[field])
        idx++
      }
    }
    if (sets.length > 0) {
      sets.push('updated_at=NOW()')
      vals.push(ids, uid(req))
      await query(`UPDATE crm_organizations SET ${sets.join(', ')} WHERE id = ANY($${idx}) AND user_id=$${idx + 1}`, vals)
    }
    res.json({ ok: true })
  } catch (e) { next(e) }
})

router.post('/organizations/merge', async (req, res, next) => {
  try {
    const { primaryId, mergeIds } = req.body
    const userId = uid(req)
    if (!primaryId || !Array.isArray(mergeIds) || !mergeIds.length) return res.status(400).json({ error: 'primaryId and mergeIds required' })
    // Move people links to primary
    await query('UPDATE crm_people SET org_id=$1 WHERE org_id = ANY($2) AND user_id=$3', [primaryId, mergeIds, userId])
    // Move activities to primary
    await query('UPDATE crm_org_activities SET org_id=$1 WHERE org_id = ANY($2)', [primaryId, mergeIds])
    // Delete merged orgs
    await query('DELETE FROM crm_organizations WHERE id = ANY($1) AND user_id=$2', [mergeIds, userId])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

router.post('/export/orgs/selected', async (req, res, next) => {
  try {
    const { ids } = req.body
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'ids required' })
    const r = await query(
      `SELECT name, industry, website, address, notes, created_at
       FROM crm_organizations WHERE id = ANY($1) AND user_id=$2 ORDER BY name`, [ids, uid(req)]
    )
    const header = 'Name,Industry,Website,Address,Notes,Created\n'
    const rows = r.rows.map(row =>
      [row.name, row.industry || '', row.website || '', row.address || '', (row.notes || '').replace(/[\n,]/g, ' '), row.created_at || ''].map(v => `"${v}"`).join(',')
    ).join('\n')
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="organizations_selected.csv"')
    res.send(header + rows)
  } catch (e) { next(e) }
})

// Org detail
router.get('/organizations/:id', async (req, res, next) => {
  try {
    const orgId = parseInt(req.params.id)
    const userId = uid(req)
    const [orgR, peopleR, dealsR, actsR] = await Promise.all([
      query(`SELECT o.*, po.name AS parent_org_name FROM crm_organizations o
             LEFT JOIN crm_organizations po ON po.id = o.parent_org_id
             WHERE o.id=$1 AND o.user_id=$2`, [orgId, userId]),
      query(`SELECT id, name, role, email, phone FROM crm_people WHERE org_id=$1 ORDER BY name`, [orgId]),
      query(`SELECT * FROM crm_deals WHERE user_id=$1 AND (
               org_id=$2 OR LOWER(company_name) IN (
                 SELECT LOWER(name) FROM crm_organizations WHERE id=$2
               )
             ) ORDER BY updated_at DESC`, [userId, orgId]),
      query(`SELECT a.*, d.company_name AS deal_name, p.name AS person_name
             FROM crm_org_activities a
             LEFT JOIN crm_deals d ON d.id = a.deal_id
             LEFT JOIN crm_people p ON p.id = a.person_id
             WHERE a.org_id=$1 ORDER BY a.occurred_at DESC`, [orgId]),
    ])
    if (!orgR.rows[0]) return res.status(404).json({ error: 'Organization not found' })
    res.json({ ...orgR.rows[0], people: peopleR.rows, deals: dealsR.rows, activities: actsR.rows })
  } catch (e) { next(e) }
})

// Org activities
router.get('/organizations/:id/activities', async (req, res, next) => {
  try {
    const r = await query(
      `SELECT a.*, d.company_name AS deal_name, p.name AS person_name
       FROM crm_org_activities a
       LEFT JOIN crm_deals d ON d.id = a.deal_id
       LEFT JOIN crm_people p ON p.id = a.person_id
       WHERE a.org_id=$1 ORDER BY a.occurred_at DESC`,
      [parseInt(req.params.id)]
    )
    res.json(r.rows)
  } catch (e) { next(e) }
})

router.post('/organizations/:id/activities', async (req, res, next) => {
  try {
    const { type, title, body, occurred_at, deal_id, person_id } = req.body
    const r = await query(
      `INSERT INTO crm_org_activities (org_id, user_id, type, title, body, occurred_at, deal_id, person_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [parseInt(req.params.id), uid(req), type||'note', title||null, body||null,
       occurred_at||new Date().toISOString(), deal_id||null, person_id||null]
    )
    res.status(201).json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/organizations/activities/:actId', async (req, res, next) => {
  try {
    await query('DELETE FROM crm_org_activities WHERE id=$1', [parseInt(req.params.actId)])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// Update GET /organizations to also include parent_org fields
// Org stats
router.get('/organizations/:id/stats', async (req, res, next) => {
  try {
    const orgId = parseInt(req.params.id)
    const userId = uid(req)
    const r = await query(
      `SELECT
         type,
         COUNT(*) AS cnt
       FROM crm_org_activities
       WHERE org_id=$1
       GROUP BY type
       ORDER BY cnt DESC`,
      [orgId]
    )
    const dealsR = await query(
      `SELECT stage, COUNT(*) AS cnt, SUM(deal_value) AS total
       FROM crm_deals WHERE user_id=$1 AND LOWER(company_name) IN (
         SELECT LOWER(name) FROM crm_organizations WHERE id=$2
       ) GROUP BY stage`,
      [userId, orgId]
    )
    res.json({ activity_breakdown: r.rows, deal_breakdown: dealsR.rows })
  } catch (e) { next(e) }
})

// ── Global search ──────────────────────────────────────────────────────────────
router.get('/search', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim()
    if (!q || q.length < 2) return res.json({ deals: [], people: [], orgs: [] })
    const like = `%${q}%`
    const userId = uid(req)
    const [dealsR, peopleR, orgsR] = await Promise.all([
      query(`SELECT id, company_name, stage, deal_value, currency FROM crm_deals
             WHERE user_id=$1 AND (company_name ILIKE $2 OR contact_name ILIKE $2 OR contact_email ILIKE $2)
             LIMIT 8`, [userId, like]),
      query(`SELECT id, name, email, organization, role FROM crm_people
             WHERE user_id=$1 AND (name ILIKE $2 OR email ILIKE $2 OR organization ILIKE $2)
             LIMIT 8`, [userId, like]),
      query(`SELECT id, name, industry, website FROM crm_organizations
             WHERE user_id=$1 AND (name ILIKE $2 OR industry ILIKE $2)
             LIMIT 8`, [userId, like]),
    ])
    res.json({ deals: dealsR.rows, people: peopleR.rows, orgs: orgsR.rows })
  } catch (e) { next(e) }
})

// ── Dashboard metrics ──────────────────────────────────────────────────────────
router.get('/dashboard', async (req, res, next) => {
  try {
    const userId = uid(req)
    const [stagesR, forecastR, recentDealsR, recentPeopleR, activityR, lostR, convR] = await Promise.all([
      // Pipeline by stage
      query(`SELECT stage, COUNT(*) AS cnt, COALESCE(SUM(deal_value),0) AS total
             FROM crm_deals WHERE user_id=$1 AND stage != 'lost' GROUP BY stage`, [userId]),
      // Weighted forecast
      query(`SELECT COALESCE(SUM(deal_value * probability / 100), 0) AS forecast,
                    COALESCE(SUM(deal_value),0) AS pipeline
             FROM crm_deals WHERE user_id=$1 AND stage NOT IN ('won','lost')`, [userId]),
      // Recent deals
      query(`SELECT id, company_name, stage, deal_value, currency, updated_at
             FROM crm_deals WHERE user_id=$1 ORDER BY updated_at DESC LIMIT 5`, [userId]),
      // Recent contacts
      query(`SELECT id, name, organization, created_at FROM crm_people
             WHERE user_id=$1 ORDER BY created_at DESC LIMIT 5`, [userId]),
      // Activity type breakdown (30 days)
      query(`SELECT type, COUNT(*) AS cnt FROM crm_org_activities
             WHERE user_id=$1 AND occurred_at > NOW()-INTERVAL '30 days'
             GROUP BY type
             UNION ALL
             SELECT pa.type, COUNT(*) AS cnt FROM crm_people_activities pa
             JOIN crm_people p ON p.id = pa.person_id
             WHERE p.user_id=$1 AND pa.occurred_at > NOW()-INTERVAL '30 days'
             GROUP BY pa.type`, [userId]),
      // Lost reason breakdown
      query(`SELECT lost_reason, COUNT(*) AS cnt FROM crm_deals
             WHERE user_id=$1 AND stage='lost' AND lost_reason IS NOT NULL
             GROUP BY lost_reason ORDER BY cnt DESC LIMIT 8`, [userId]),
      // Conversion rates between stages
      query(`SELECT stage, COUNT(*) AS cnt FROM crm_deals WHERE user_id=$1 GROUP BY stage`, [userId]),
    ])
    // Aggregate activity types
    const actMap = {}
    activityR.rows.forEach(r => { actMap[r.type] = (actMap[r.type] || 0) + parseInt(r.cnt) })
    res.json({
      stages: stagesR.rows,
      forecast: forecastR.rows[0],
      recent_deals: recentDealsR.rows,
      recent_people: recentPeopleR.rows,
      activity_breakdown: Object.entries(actMap).map(([type, cnt]) => ({ type, cnt })),
      lost_reasons: lostR.rows,
      stage_counts: convR.rows,
    })
  } catch (e) { next(e) }
})

// ── CSV export ─────────────────────────────────────────────────────────────────
router.get('/export/contacts', async (req, res, next) => {
  try {
    const r = await query(
      `SELECT name, email, phone, organization, role, linkedin_url, birthday, notes, created_at
       FROM crm_people WHERE user_id=$1 ORDER BY name`, [uid(req)]
    )
    const cols = ['name','email','phone','organization','role','linkedin_url','birthday','notes','created_at']
    const csv = [cols.join(','), ...r.rows.map(row =>
      cols.map(c => `"${(row[c] ?? '').toString().replace(/"/g, '""')}"`).join(',')
    )].join('\n')
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="contacts.csv"')
    res.send(csv)
  } catch (e) { next(e) }
})

router.get('/export/orgs', async (req, res, next) => {
  try {
    const r = await query(
      `SELECT name, industry, website, address, notes, created_at
       FROM crm_organizations WHERE user_id=$1 ORDER BY name`, [uid(req)]
    )
    const cols = ['name','industry','website','address','notes','created_at']
    const csv = [cols.join(','), ...r.rows.map(row =>
      cols.map(c => `"${(row[c] ?? '').toString().replace(/"/g, '""')}"`).join(',')
    )].join('\n')
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="organizations.csv"')
    res.send(csv)
  } catch (e) { next(e) }
})

router.get('/export/deals', async (req, res, next) => {
  try {
    const r = await query(
      `SELECT company_name, contact_name, contact_email, deal_value, currency, stage,
              probability, expected_close_date, lost_reason, notes, created_at
       FROM crm_deals WHERE user_id=$1 ORDER BY created_at DESC`, [uid(req)]
    )
    const cols = ['company_name','contact_name','contact_email','deal_value','currency','stage','probability','expected_close_date','lost_reason','notes','created_at']
    const csv = [cols.join(','), ...r.rows.map(row =>
      cols.map(c => `"${(row[c] ?? '').toString().replace(/"/g, '""')}"`).join(',')
    )].join('\n')
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="deals.csv"')
    res.send(csv)
  } catch (e) { next(e) }
})

// ── Deal clone ─────────────────────────────────────────────────────────────────
router.post('/deals/:id/clone', async (req, res, next) => {
  try {
    const src = await query('SELECT * FROM crm_deals WHERE id=$1 AND user_id=$2', [parseInt(req.params.id), uid(req)])
    if (!src.rows[0]) return res.status(404).json({ error: 'Deal not found' })
    const d = src.rows[0]
    const r = await query(
      `INSERT INTO crm_deals (user_id, company_name, contact_name, contact_email, deal_value, stage,
         probability, next_action, notes, expected_close_date, linkedin_url, currency, tags,
         assigned_to, follow_up_at, last_contact_at, pipeline_id, stage_entered_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,NOW()) RETURNING *`,
      [uid(req), d.company_name + ' (Copy)', d.contact_name, d.contact_email, d.deal_value,
       d.stage, d.probability, d.next_action, d.notes, d.expected_close_date, d.linkedin_url,
       d.currency||'USD', d.tags||'', d.assigned_to||null, d.follow_up_at||null, d.last_contact_at||null, d.pipeline_id||null]
    )
    res.status(201).json(r.rows[0])
  } catch (e) { next(e) }
})

// ── Pipeline funnel / conversion ───────────────────────────────────────────────
router.get('/pipeline/funnel', async (req, res, next) => {
  try {
    const r = await query(
      `SELECT stage,
              COUNT(*) AS cnt,
              COALESCE(SUM(deal_value),0) AS total,
              COALESCE(AVG(EXTRACT(EPOCH FROM (NOW()-stage_entered_at))/86400), 0) AS avg_days
       FROM crm_deals WHERE user_id=$1
       GROUP BY stage`, [uid(req)]
    )
    res.json(r.rows)
  } catch (e) { next(e) }
})

// ── Tags ────────────────────────────────────────────────────────────────────────
router.get('/tags', async (req, res, next) => {
  try {
    const r = await query('SELECT * FROM crm_tags WHERE user_id=$1 ORDER BY name', [uid(req)])
    res.json(r.rows)
  } catch (e) { next(e) }
})

router.post('/tags', async (req, res, next) => {
  try {
    const { name, color } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Name required' })
    const r = await query(
      `INSERT INTO crm_tags (user_id, name, color) VALUES ($1,$2,$3)
       ON CONFLICT (user_id, name) DO UPDATE SET color=EXCLUDED.color RETURNING *`,
      [uid(req), name.trim(), color || '#10b981']
    )
    res.status(201).json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/tags/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM crm_tags WHERE id=$1 AND user_id=$2', [parseInt(req.params.id), uid(req)])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

router.get('/tags/entity/:type/:id', async (req, res, next) => {
  try {
    const r = await query(
      `SELECT t.* FROM crm_tags t JOIN crm_tag_links l ON l.tag_id=t.id
       WHERE l.entity_type=$1 AND l.entity_id=$2 AND t.user_id=$3`,
      [req.params.type, parseInt(req.params.id), uid(req)]
    )
    res.json(r.rows)
  } catch (e) { next(e) }
})

router.post('/tags/:id/link', async (req, res, next) => {
  try {
    const { entity_type, entity_id } = req.body
    await query(
      `INSERT INTO crm_tag_links (tag_id, entity_type, entity_id) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
      [parseInt(req.params.id), entity_type, parseInt(entity_id)]
    )
    res.json({ ok: true })
  } catch (e) { next(e) }
})

router.delete('/tags/:id/link', async (req, res, next) => {
  try {
    const { entity_type, entity_id } = req.body
    await query(
      `DELETE FROM crm_tag_links WHERE tag_id=$1 AND entity_type=$2 AND entity_id=$3`,
      [parseInt(req.params.id), entity_type, parseInt(entity_id)]
    )
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// ── Star / unstar ──────────────────────────────────────────────────────────────
router.patch('/people/:id/star', async (req, res, next) => {
  try {
    const r = await query(
      `UPDATE crm_people SET starred = NOT starred WHERE id=$1 AND user_id=$2 RETURNING starred`,
      [parseInt(req.params.id), uid(req)]
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.patch('/deals/:id/star', async (req, res, next) => {
  try {
    const r = await query(
      `UPDATE crm_deals SET starred = NOT starred WHERE id=$1 AND user_id=$2 RETURNING starred`,
      [parseInt(req.params.id), uid(req)]
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.patch('/organizations/:id/star', async (req, res, next) => {
  try {
    const r = await query(
      `UPDATE crm_organizations SET starred = NOT starred WHERE id=$1 AND user_id=$2 RETURNING starred`,
      [parseInt(req.params.id), uid(req)]
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

// ── Activity done toggle ───────────────────────────────────────────────────────
router.patch('/people/activities/:actId/done', async (req, res, next) => {
  try {
    const r = await query(
      `UPDATE crm_people_activities SET done = NOT done WHERE id=$1 RETURNING *`,
      [parseInt(req.params.actId)]
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.patch('/organizations/activities/:actId/done', async (req, res, next) => {
  try {
    const r = await query(
      `UPDATE crm_org_activities SET done = NOT done WHERE id=$1 RETURNING *`,
      [parseInt(req.params.actId)]
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

// ── Duplicate detection ────────────────────────────────────────────────────────
router.get('/people/duplicates', async (req, res, next) => {
  try {
    const { name, email } = req.query
    const userId = uid(req)
    let r
    if (email) {
      r = await query(`SELECT id, name, email FROM crm_people WHERE user_id=$1 AND LOWER(email)=LOWER($2) LIMIT 3`, [userId, email])
    } else if (name) {
      r = await query(`SELECT id, name, email FROM crm_people WHERE user_id=$1 AND LOWER(name) ILIKE $2 LIMIT 3`, [userId, `%${name}%`])
    } else {
      return res.json([])
    }
    res.json(r.rows)
  } catch (e) { next(e) }
})

// ── Pipeline Stages ───────────────────────────────────────────────────────────
const DEFAULT_STAGES = [
  { name:'lead',        label:'Lead',        color:'#5E6C84', bg_color:'#F4F5F7', border_color:'#DFE1E6', probability:10,  position:0, is_won:false, is_lost:false },
  { name:'qualified',   label:'Qualified',   color:'#0052CC', bg_color:'#DEEBFF', border_color:'#4C9AFF', probability:25,  position:1, is_won:false, is_lost:false },
  { name:'demo',        label:'Demo',        color:'#6554C0', bg_color:'#EAE6FF', border_color:'#8777D9', probability:40,  position:2, is_won:false, is_lost:false },
  { name:'proposal',    label:'Proposal',    color:'#00875A', bg_color:'#E3FCEF', border_color:'#57D9A3', probability:60,  position:3, is_won:false, is_lost:false },
  { name:'negotiation', label:'Negotiation', color:'#974F0C', bg_color:'#FFFAE6', border_color:'#FFE380', probability:80,  position:4, is_won:false, is_lost:false },
  { name:'won',         label:'Won ✓',       color:'#006644', bg_color:'#E3FCEF', border_color:'#36B37E', probability:100, position:5, is_won:true,  is_lost:false },
  { name:'lost',        label:'Lost ✗',      color:'#BF2600', bg_color:'#FFEBE6', border_color:'#FF8F73', probability:0,   position:6, is_won:false, is_lost:true  },
]

router.get('/stages', async (req, res, next) => {
  try {
    const userId = uid(req)
    const existing = await query('SELECT id FROM crm_stages WHERE user_id=$1 LIMIT 1', [userId])
    if (existing.rows.length === 0) {
      for (const s of DEFAULT_STAGES) {
        await query(
          `INSERT INTO crm_stages(user_id,name,label,color,bg_color,border_color,probability,position,is_won,is_lost)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT DO NOTHING`,
          [userId, s.name, s.label, s.color, s.bg_color, s.border_color, s.probability, s.position, s.is_won, s.is_lost]
        )
      }
    }
    const r = await query('SELECT * FROM crm_stages WHERE user_id=$1 ORDER BY position', [userId])
    res.json(r.rows)
  } catch (e) { next(e) }
})

router.post('/stages', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { name, label, color='#5E6C84', bg_color='#F4F5F7', border_color='#DFE1E6', probability=10, is_won=false, is_lost=false, pipeline_id } = req.body
    if (!name || !label) return res.status(400).json({ error: 'name and label are required' })
    const maxPos = await query('SELECT COALESCE(MAX(position),0)+1 AS pos FROM crm_stages WHERE user_id=$1', [userId])
    const r = await query(
      `INSERT INTO crm_stages(user_id,name,label,color,bg_color,border_color,probability,position,is_won,is_lost,pipeline_id)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [userId, name, label, color, bg_color, border_color, probability, maxPos.rows[0].pos, is_won, is_lost, pipeline_id||null]
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.post('/stages/reorder', async (req, res, next) => {
  try {
    const userId = uid(req)
    for (const { id, position } of req.body) {
      await query('UPDATE crm_stages SET position=$1 WHERE id=$2 AND user_id=$3', [position, id, userId])
    }
    res.json({ ok: true })
  } catch (e) { next(e) }
})

router.put('/stages/:id', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { label, color, bg_color, border_color, probability, is_won, is_lost } = req.body
    const r = await query(
      `UPDATE crm_stages SET label=$1,color=$2,bg_color=$3,border_color=$4,probability=$5,is_won=$6,is_lost=$7
       WHERE id=$8 AND user_id=$9 RETURNING *`,
      [label, color, bg_color, border_color, probability, is_won, is_lost, req.params.id, userId]
    )
    if (!r.rows[0]) return res.status(404).json({ error: 'Stage not found' })
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/stages/:id', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { reassign_to } = req.query
    if (reassign_to) {
      const target = await query('SELECT name FROM crm_stages WHERE id=$1 AND user_id=$2', [reassign_to, userId])
      if (target.rows.length) {
        await query(
          `UPDATE crm_deals SET stage=$1 WHERE stage=(SELECT name FROM crm_stages WHERE id=$2) AND user_id=$3`,
          [target.rows[0].name, req.params.id, userId]
        )
      }
    }
    await query('DELETE FROM crm_stages WHERE id=$1 AND user_id=$2', [req.params.id, userId])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// ── Bulk deal operations ──────────────────────────────────────────────────────
router.post('/deals/bulk', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { ids, action, payload = {} } = req.body
    if (!Array.isArray(ids) || ids.length === 0 || ids.length > 100) {
      return res.status(400).json({ error: 'ids must be an array of 1-100 deal IDs' })
    }
    const intIds = ids.map(Number).filter(n => n > 0)
    if (intIds.length === 0) return res.status(400).json({ error: 'Invalid IDs' })

    if (action === 'move_stage') {
      const { stage } = payload
      if (!stage) return res.status(400).json({ error: 'payload.stage required' })
      const sr = await query('SELECT probability FROM crm_stages WHERE user_id=$1 AND name=$2', [userId, stage])
      const prob = sr.rows.length ? sr.rows[0].probability : (PROB[stage] ?? 10)
      const r = await query(
        `UPDATE crm_deals SET stage=$1, probability=$2, stage_entered_at=NOW(), updated_at=NOW()
         WHERE id=ANY($3::int[]) AND user_id=$4 RETURNING *`,
        [stage, prob, intIds, userId]
      )
      return res.json(r.rows)
    }

    if (action === 'delete') {
      await query(
        `UPDATE entity_links SET deleted_at=NOW(), updated_at=NOW()
         WHERE target_type='crm_deal' AND target_id=ANY($1::text[]) AND deleted_at IS NULL`,
        [intIds.map(String)]
      )
      await query('DELETE FROM crm_deals WHERE id=ANY($1::int[]) AND user_id=$2', [intIds, userId])
      return res.json({ ok: true, deleted: intIds.length })
    }

    if (action === 'assign') {
      const { assigned_to } = payload
      if (!assigned_to) return res.status(400).json({ error: 'payload.assigned_to required' })
      const r = await query(
        `UPDATE crm_deals SET assigned_to=$1, updated_at=NOW()
         WHERE id=ANY($2::int[]) AND user_id=$3 RETURNING *`,
        [assigned_to, intIds, userId]
      )
      return res.json(r.rows)
    }

    res.status(400).json({ error: 'Invalid action. Use: move_stage, delete, assign' })
  } catch (e) { next(e) }
})

// ── CRM Notifications ─────────────────────────────────────────────────────────
router.get('/notifications', async (req, res, next) => {
  try {
    const userId = uid(req)
    const today = new Date().toISOString().slice(0, 10)

    const [followUpsR, tasksR, staleR] = await Promise.all([
      query(
        `SELECT id, company_name, follow_up_at, stage, deal_value
         FROM crm_deals
         WHERE user_id=$1 AND follow_up_at <= $2 AND stage NOT IN ('won','lost')
         ORDER BY follow_up_at ASC LIMIT 20`,
        [userId, today]
      ),
      query(
        `SELECT t.id, t.title, t.due_at, t.deal_id, d.company_name
         FROM crm_tasks t JOIN crm_deals d ON d.id = t.deal_id
         WHERE d.user_id=$1 AND t.done = false AND t.due_at <= $2
         ORDER BY t.due_at ASC LIMIT 20`,
        [userId, today]
      ),
      query(
        `SELECT id, company_name, stage, deal_value, updated_at
         FROM crm_deals
         WHERE user_id=$1 AND stage NOT IN ('won','lost')
           AND updated_at < NOW() - INTERVAL '7 days'
         ORDER BY updated_at ASC LIMIT 20`,
        [userId]
      ),
    ])

    res.json({
      follow_ups: followUpsR.rows,
      tasks: tasksR.rows,
      stale_deals: staleR.rows,
      total: followUpsR.rows.length + tasksR.rows.length + staleR.rows.length,
    })
  } catch (e) { next(e) }
})

// ── Revenue Dashboard ─────────────────────────────────────────────────────────
router.get('/revenue', async (req, res, next) => {
  try {
    const userId = uid(req)

    const [wonByMonthR, lostByMonthR, avgSizeR, velocityR, goalsR] = await Promise.all([
      query(
        `SELECT TO_CHAR(updated_at, 'YYYY-MM') AS month, COUNT(*)::int AS count, COALESCE(SUM(deal_value),0) AS total
         FROM crm_deals WHERE user_id=$1 AND stage='won' AND updated_at >= NOW() - INTERVAL '12 months'
         GROUP BY 1 ORDER BY 1`, [userId]
      ),
      query(
        `SELECT TO_CHAR(updated_at, 'YYYY-MM') AS month, COUNT(*)::int AS count, COALESCE(SUM(deal_value),0) AS total
         FROM crm_deals WHERE user_id=$1 AND stage='lost' AND updated_at >= NOW() - INTERVAL '12 months'
         GROUP BY 1 ORDER BY 1`, [userId]
      ),
      query(
        `SELECT TO_CHAR(updated_at, 'YYYY-MM') AS month, COALESCE(AVG(deal_value),0) AS avg_value
         FROM crm_deals WHERE user_id=$1 AND stage='won' AND updated_at >= NOW() - INTERVAL '12 months'
         GROUP BY 1 ORDER BY 1`, [userId]
      ),
      query(
        `SELECT TO_CHAR(updated_at, 'YYYY-MM') AS month,
                COALESCE(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400), 0) AS avg_days
         FROM crm_deals WHERE user_id=$1 AND stage='won' AND updated_at >= NOW() - INTERVAL '12 months'
         GROUP BY 1 ORDER BY 1`, [userId]
      ),
      query('SELECT * FROM crm_goals WHERE user_id=$1 ORDER BY period_key DESC LIMIT 12', [userId]),
    ])

    res.json({
      won_by_month: wonByMonthR.rows,
      lost_by_month: lostByMonthR.rows,
      avg_deal_size: avgSizeR.rows,
      avg_days_to_close: velocityR.rows,
      goals: goalsR.rows,
    })
  } catch (e) { next(e) }
})

// ══════════════════════════════════════════════════════════════════════════════
// FEATURE 1: Email Integration
// ══════════════════════════════════════════════════════════════════════════════

router.get('/deals/:dealId/emails', async (req, res, next) => {
  try {
    const userId = uid(req)
    const r = await query('SELECT * FROM crm_emails WHERE deal_id=$1 AND user_id=$2 ORDER BY sent_at DESC', [req.params.dealId, userId])
    res.json(r.rows)
  } catch (e) { next(e) }
})

router.get('/emails', async (req, res, next) => {
  try {
    const userId = uid(req)
    const r = await query('SELECT e.*, d.company_name FROM crm_emails e LEFT JOIN crm_deals d ON d.id=e.deal_id WHERE e.user_id=$1 ORDER BY e.sent_at DESC LIMIT 100', [userId])
    res.json(r.rows)
  } catch (e) { next(e) }
})

router.post('/deals/:dealId/emails', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { direction, from_address, to_address, subject, body, status } = req.body
    const r = await query(
      `INSERT INTO crm_emails (user_id, deal_id, direction, from_address, to_address, subject, body, status, sent_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW()) RETURNING *`,
      [userId, req.params.dealId, direction || 'outbound', from_address, to_address, subject, body, status || 'sent']
    )
    // Timeline entry
    await query(
      `INSERT INTO crm_timeline (user_id, deal_id, event_type, title, body, metadata)
       VALUES ($1,$2,'email',$3,$4,$5)`,
      [userId, req.params.dealId, subject || 'Email', body, JSON.stringify({ direction: direction || 'outbound', to: to_address })]
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.post('/emails', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { deal_id, person_id, direction, from_address, to_address, subject, body, status } = req.body
    const r = await query(
      `INSERT INTO crm_emails (user_id, deal_id, person_id, direction, from_address, to_address, subject, body, status, sent_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW()) RETURNING *`,
      [userId, deal_id || null, person_id || null, direction || 'outbound', from_address, to_address, subject, body, status || 'sent']
    )
    if (deal_id) {
      await query(
        `INSERT INTO crm_timeline (user_id, deal_id, event_type, title, body, metadata)
         VALUES ($1,$2,'email',$3,$4,$5)`,
        [userId, deal_id, subject || 'Email', body, JSON.stringify({ direction: direction || 'outbound', to: to_address })]
      )
    }
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/emails/:id', async (req, res, next) => {
  try {
    const userId = uid(req)
    await query('DELETE FROM crm_emails WHERE id=$1 AND user_id=$2', [req.params.id, userId])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// ══════════════════════════════════════════════════════════════════════════════
// FEATURE 2: Activity Timeline
// ══════════════════════════════════════════════════════════════════════════════

router.get('/deals/:dealId/timeline', async (req, res, next) => {
  try {
    const userId = uid(req)
    const r = await query(
      `SELECT * FROM crm_timeline WHERE deal_id=$1 AND user_id=$2 ORDER BY occurred_at DESC LIMIT 200`,
      [req.params.dealId, userId]
    )
    res.json(r.rows)
  } catch (e) { next(e) }
})

router.post('/deals/:dealId/timeline', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { event_type, title, body, metadata } = req.body
    const r = await query(
      `INSERT INTO crm_timeline (user_id, deal_id, event_type, title, body, metadata)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [userId, req.params.dealId, event_type || 'note', title, body, JSON.stringify(metadata || {})]
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/timeline/:id', async (req, res, next) => {
  try {
    const userId = uid(req)
    await query('DELETE FROM crm_timeline WHERE id=$1 AND user_id=$2', [req.params.id, userId])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// ══════════════════════════════════════════════════════════════════════════════
// FEATURE 3: Lead Scoring
// ══════════════════════════════════════════════════════════════════════════════

router.get('/scoring-rules', async (req, res, next) => {
  try {
    const userId = uid(req)
    const r = await query('SELECT * FROM crm_scoring_rules WHERE user_id=$1 ORDER BY id', [userId])
    res.json(r.rows)
  } catch (e) { next(e) }
})

router.post('/scoring-rules', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { field, operator, value, points } = req.body
    const r = await query(
      'INSERT INTO crm_scoring_rules (user_id, field, operator, value, points) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [userId, field, operator, value, points || 0]
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.put('/scoring-rules/:id', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { field, operator, value, points } = req.body
    const r = await query(
      'UPDATE crm_scoring_rules SET field=$1, operator=$2, value=$3, points=$4 WHERE id=$5 AND user_id=$6 RETURNING *',
      [field, operator, value, points, req.params.id, userId]
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/scoring-rules/:id', async (req, res, next) => {
  try {
    const userId = uid(req)
    await query('DELETE FROM crm_scoring_rules WHERE id=$1 AND user_id=$2', [req.params.id, userId])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

router.post('/deals/recalculate-scores', async (req, res, next) => {
  try {
    const userId = uid(req)
    const rules = (await query('SELECT * FROM crm_scoring_rules WHERE user_id=$1', [userId])).rows
    const deals = (await query("SELECT * FROM crm_deals WHERE user_id=$1 AND stage NOT IN ('won','lost')", [userId])).rows

    for (const deal of deals) {
      let score = 0
      for (const rule of rules) {
        const val = deal[rule.field]
        let match = false
        if (rule.operator === 'gt') match = parseFloat(val) > parseFloat(rule.value)
        else if (rule.operator === 'lt') match = parseFloat(val) < parseFloat(rule.value)
        else if (rule.operator === 'eq') match = String(val) === rule.value
        else if (rule.operator === 'contains') match = String(val || '').toLowerCase().includes(rule.value.toLowerCase())
        else if (rule.operator === 'not_empty') match = !!val && val !== ''
        if (match) score += rule.points
      }
      const grade = score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 30 ? 'C' : 'D'
      await query('UPDATE crm_deals SET lead_score=$1, lead_grade=$2 WHERE id=$3', [score, grade, deal.id])
    }
    res.json({ updated: deals.length })
  } catch (e) { next(e) }
})

// ══════════════════════════════════════════════════════════════════════════════
// FEATURE 4: Sales Forecasting
// ══════════════════════════════════════════════════════════════════════════════

router.get('/forecast', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { period } = req.query // 'monthly' or 'quarterly'

    // Weighted pipeline
    const pipeline = (await query(
      `SELECT stage, SUM(deal_value) as total, COUNT(*) as count,
              SUM(deal_value * COALESCE(probability,10) / 100.0) as weighted_value
       FROM crm_deals WHERE user_id=$1 AND stage NOT IN ('won','lost')
       GROUP BY stage`,
      [userId]
    )).rows

    // Historical monthly won
    const historical = (await query(
      `SELECT TO_CHAR(updated_at,'YYYY-MM') AS month, SUM(deal_value) AS total, COUNT(*) AS count
       FROM crm_deals WHERE user_id=$1 AND stage='won' AND updated_at >= NOW() - INTERVAL '12 months'
       GROUP BY 1 ORDER BY 1`,
      [userId]
    )).rows

    // Deals by expected close date
    const byCloseDate = (await query(
      `SELECT TO_CHAR(follow_up_at,'YYYY-MM') AS month, SUM(deal_value) AS total, COUNT(*) AS count,
              SUM(deal_value * COALESCE(probability,10) / 100.0) AS weighted
       FROM crm_deals WHERE user_id=$1 AND stage NOT IN ('won','lost') AND follow_up_at IS NOT NULL
       GROUP BY 1 ORDER BY 1`,
      [userId]
    )).rows

    const totalWeighted = pipeline.reduce((s, r) => s + parseFloat(r.weighted_value || 0), 0)
    const avgMonthlyWon = historical.length > 0 ? historical.reduce((s, r) => s + parseFloat(r.total), 0) / historical.length : 0

    res.json({ pipeline, historical, byCloseDate, totalWeighted, avgMonthlyWon })
  } catch (e) { next(e) }
})

// ══════════════════════════════════════════════════════════════════════════════
// FEATURE 5: Custom Fields
// ══════════════════════════════════════════════════════════════════════════════

router.get('/custom-fields', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { entity_type } = req.query
    let q = 'SELECT * FROM crm_custom_fields WHERE user_id=$1'
    const params = [userId]
    if (entity_type) { q += ' AND entity_type=$2'; params.push(entity_type) }
    q += ' ORDER BY position, id'
    res.json((await query(q, params)).rows)
  } catch (e) { next(e) }
})

router.post('/custom-fields', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { entity_type, field_name, field_label, field_type, options, required } = req.body
    const r = await query(
      `INSERT INTO crm_custom_fields (user_id, entity_type, field_name, field_label, field_type, options, required)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [userId, entity_type || 'deal', field_name, field_label, field_type || 'text', JSON.stringify(options || []), required || false]
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.put('/custom-fields/:id', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { field_label, field_type, options, required, position } = req.body
    const r = await query(
      `UPDATE crm_custom_fields SET field_label=COALESCE($1,field_label), field_type=COALESCE($2,field_type), options=COALESCE($3,options), required=COALESCE($4,required), position=COALESCE($5,position)
       WHERE id=$6 AND user_id=$7 RETURNING *`,
      [field_label, field_type, options ? JSON.stringify(options) : null, required, position, req.params.id, userId]
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/custom-fields/:id', async (req, res, next) => {
  try {
    const userId = uid(req)
    await query('DELETE FROM crm_custom_fields WHERE id=$1 AND user_id=$2', [req.params.id, userId])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// Custom field values
router.get('/custom-field-values/:entityType', async (req, res, next) => {
  try {
    const userId = uid(req)
    const r = await query(
      `SELECT cfv.*, cf.field_name, cf.field_label, cf.field_type
       FROM crm_custom_field_values cfv JOIN crm_custom_fields cf ON cf.id=cfv.field_id
       WHERE cfv.entity_type=$1 AND cf.user_id=$2`,
      [req.params.entityType, userId]
    )
    res.json(r.rows)
  } catch (e) { next(e) }
})

router.get('/custom-field-values/:entityType/:entityId', async (req, res, next) => {
  try {
    const r = await query(
      `SELECT cfv.*, cf.field_name, cf.field_label, cf.field_type, cf.options
       FROM crm_custom_field_values cfv JOIN crm_custom_fields cf ON cf.id=cfv.field_id
       WHERE cfv.entity_type=$1 AND cfv.entity_id=$2`,
      [req.params.entityType, req.params.entityId]
    )
    res.json(r.rows)
  } catch (e) { next(e) }
})

router.post('/custom-field-values', async (req, res, next) => {
  try {
    const { field_id, entity_type, entity_id, value } = req.body
    const r = await query(
      `INSERT INTO crm_custom_field_values (field_id, entity_type, entity_id, value)
       VALUES ($1,$2,$3,$4) ON CONFLICT (field_id, entity_type, entity_id) DO UPDATE SET value=$4 RETURNING *`,
      [field_id, entity_type, entity_id, value]
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

// ══════════════════════════════════════════════════════════════════════════════
// FEATURE 6: Import/Export CSV
// ══════════════════════════════════════════════════════════════════════════════

router.get('/export/deals', async (req, res, next) => {
  try {
    const userId = uid(req)
    const deals = (await query('SELECT * FROM crm_deals WHERE user_id=$1 ORDER BY created_at DESC', [userId])).rows
    const header = 'id,company_name,contact_name,contact_email,deal_value,stage,probability,source,follow_up_at,created_at\n'
    const csv = header + deals.map(d =>
      [d.id, `"${(d.company_name||'').replace(/"/g,'""')}"`, `"${(d.contact_name||'').replace(/"/g,'""')}"`, d.contact_email, d.deal_value, d.stage, d.probability, d.source, d.follow_up_at||'', d.created_at].join(',')
    ).join('\n')
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename=crm_deals_export.csv')
    res.send(csv)
  } catch (e) { next(e) }
})

router.get('/export/contacts', async (req, res, next) => {
  try {
    const userId = uid(req)
    const people = (await query('SELECT * FROM crm_people WHERE user_id=$1 ORDER BY name', [userId])).rows
    const header = 'id,name,email,phone,organization,role,linkedin_url,created_at\n'
    const csv = header + people.map(p =>
      [p.id, `"${(p.name||'').replace(/"/g,'""')}"`, p.email||'', p.phone||'', `"${(p.organization||'').replace(/"/g,'""')}"`, `"${(p.role||'').replace(/"/g,'""')}"`, p.linkedin_url||'', p.created_at].join(',')
    ).join('\n')
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename=crm_contacts_export.csv')
    res.send(csv)
  } catch (e) { next(e) }
})

router.post('/import/deals', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { rows } = req.body
    if (!Array.isArray(rows)) return res.status(400).json({ error: 'rows must be an array' })
    let imported = 0
    for (const row of rows.slice(0, 500)) {
      await query(
        `INSERT INTO crm_deals (user_id, company_name, contact_name, contact_email, deal_value, stage, source)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [userId, row.company_name||'Unnamed', row.contact_name||'', row.contact_email||'', parseFloat(row.deal_value)||0, row.stage||'lead', row.source||'import']
      )
      imported++
    }
    res.json({ imported })
  } catch (e) { next(e) }
})

router.post('/import/contacts', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { rows } = req.body
    if (!Array.isArray(rows)) return res.status(400).json({ error: 'rows must be an array' })
    let imported = 0
    for (const row of rows.slice(0, 500)) {
      await query(
        `INSERT INTO crm_people (user_id, name, email, phone, organization, role, linkedin_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [userId, row.name||'Unnamed', row.email||'', row.phone||'', row.organization||'', row.role||'', row.linkedin_url||'']
      )
      imported++
    }
    res.json({ imported })
  } catch (e) { next(e) }
})

// ══════════════════════════════════════════════════════════════════════════════
// FEATURE 7: Deal Templates
// ══════════════════════════════════════════════════════════════════════════════

router.get('/deal-templates', async (req, res, next) => {
  try {
    const userId = uid(req)
    res.json((await query('SELECT * FROM crm_deal_templates WHERE user_id=$1 ORDER BY name', [userId])).rows)
  } catch (e) { next(e) }
})

router.post('/deal-templates', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { name, description, default_stage, default_value, default_tasks, default_fields } = req.body
    const r = await query(
      `INSERT INTO crm_deal_templates (user_id, name, description, default_stage, default_value, default_tasks, default_fields)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [userId, name, description, default_stage||'lead', default_value||0, JSON.stringify(default_tasks||[]), JSON.stringify(default_fields||{})]
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.put('/deal-templates/:id', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { name, description, default_stage, default_value, default_tasks, default_fields } = req.body
    const r = await query(
      `UPDATE crm_deal_templates SET name=$1,description=$2,default_stage=$3,default_value=$4,default_tasks=$5,default_fields=$6
       WHERE id=$7 AND user_id=$8 RETURNING *`,
      [name, description, default_stage, default_value, JSON.stringify(default_tasks||[]), JSON.stringify(default_fields||{}), req.params.id, userId]
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/deal-templates/:id', async (req, res, next) => {
  try {
    const userId = uid(req)
    await query('DELETE FROM crm_deal_templates WHERE id=$1 AND user_id=$2', [req.params.id, userId])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// Create deal from template
router.post('/deal-templates/:id/apply', async (req, res, next) => {
  try {
    const userId = uid(req)
    const tmpl = (await query('SELECT * FROM crm_deal_templates WHERE id=$1 AND user_id=$2', [req.params.id, userId])).rows[0]
    if (!tmpl) return res.status(404).json({ error: 'Template not found' })
    const { company_name, contact_name, contact_email } = req.body
    const r = await query(
      `INSERT INTO crm_deals (user_id, company_name, contact_name, contact_email, deal_value, stage, source)
       VALUES ($1,$2,$3,$4,$5,$6,'template') RETURNING *`,
      [userId, company_name||'New Deal', contact_name||'', contact_email||'', tmpl.default_value, tmpl.default_stage||'lead']
    )
    const deal = r.rows[0]
    const tasks = tmpl.default_tasks || []
    for (const t of tasks) {
      await query('INSERT INTO crm_tasks (deal_id, title) VALUES ($1,$2)', [deal.id, t.title || t])
    }
    res.json(deal)
  } catch (e) { next(e) }
})

// ══════════════════════════════════════════════════════════════════════════════
// FEATURE 8: Automation Rules
// ══════════════════════════════════════════════════════════════════════════════

router.get('/automations', async (req, res, next) => {
  try {
    const userId = uid(req)
    res.json((await query('SELECT * FROM crm_automations WHERE user_id=$1 ORDER BY created_at DESC', [userId])).rows)
  } catch (e) { next(e) }
})

router.post('/automations', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { name, trigger_type, trigger_config, action_type, action_config } = req.body
    const r = await query(
      `INSERT INTO crm_automations (user_id, name, trigger_type, trigger_config, action_type, action_config)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [userId, name, trigger_type, JSON.stringify(trigger_config||{}), action_type, JSON.stringify(action_config||{})]
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.put('/automations/:id', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { name, trigger_type, trigger_config, action_type, action_config, active } = req.body
    const r = await query(
      `UPDATE crm_automations SET name=$1,trigger_type=$2,trigger_config=$3,action_type=$4,action_config=$5,active=$6
       WHERE id=$7 AND user_id=$8 RETURNING *`,
      [name, trigger_type, JSON.stringify(trigger_config||{}), action_type, JSON.stringify(action_config||{}), active, req.params.id, userId]
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/automations/:id', async (req, res, next) => {
  try {
    const userId = uid(req)
    await query('DELETE FROM crm_automations WHERE id=$1 AND user_id=$2', [req.params.id, userId])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// Run automations for a deal (called internally on stage changes etc)
router.post('/automations/trigger', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { deal_id, trigger_type, trigger_data } = req.body
    const rules = (await query(
      'SELECT * FROM crm_automations WHERE user_id=$1 AND trigger_type=$2 AND active=true',
      [userId, trigger_type]
    )).rows

    let executed = 0
    for (const rule of rules) {
      const config = rule.trigger_config || {}
      let shouldRun = false
      if (trigger_type === 'stage_change' && config.to_stage === trigger_data.new_stage) shouldRun = true
      if (trigger_type === 'deal_created') shouldRun = true
      if (trigger_type === 'value_above' && parseFloat(trigger_data.value) >= parseFloat(config.threshold)) shouldRun = true

      if (shouldRun) {
        const action = rule.action_config || {}
        if (rule.action_type === 'create_task' && deal_id) {
          await query('INSERT INTO crm_tasks (deal_id, title, due_at) VALUES ($1,$2,$3)', [deal_id, action.task_title||'Auto task', action.due_days ? new Date(Date.now() + action.due_days * 86400000) : null])
        } else if (rule.action_type === 'send_email' && deal_id) {
          const deal = (await query('SELECT * FROM crm_deals WHERE id=$1', [deal_id])).rows[0]
          if (deal && deal.contact_email) {
            await query(
              'INSERT INTO crm_emails (user_id, deal_id, direction, to_address, subject, body, status) VALUES ($1,$2,$3,$4,$5,$6,$7)',
              [userId, deal_id, 'outbound', deal.contact_email, action.subject||'Follow up', action.body||'', 'queued']
            )
          }
        } else if (rule.action_type === 'move_stage' && deal_id) {
          await query('UPDATE crm_deals SET stage=$1, updated_at=NOW() WHERE id=$2', [action.stage, deal_id])
        }
        await query('UPDATE crm_automations SET run_count=run_count+1, last_run_at=NOW() WHERE id=$1', [rule.id])
        executed++
      }
    }
    res.json({ executed })
  } catch (e) { next(e) }
})

// ══════════════════════════════════════════════════════════════════════════════
// FEATURE 9: Tags & Filters
// ══════════════════════════════════════════════════════════════════════════════

router.get('/tags', async (req, res, next) => {
  try {
    const userId = uid(req)
    res.json((await query('SELECT * FROM crm_tags WHERE user_id=$1 ORDER BY name', [userId])).rows)
  } catch (e) { next(e) }
})

router.post('/tags', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { name, color } = req.body
    const r = await query(
      'INSERT INTO crm_tags (user_id, name, color) VALUES ($1,$2,$3) ON CONFLICT (user_id, name) DO UPDATE SET color=$3 RETURNING *',
      [userId, name, color || '#10b981']
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/tags/:id', async (req, res, next) => {
  try {
    const userId = uid(req)
    await query('DELETE FROM crm_tags WHERE id=$1 AND user_id=$2', [req.params.id, userId])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

router.post('/tags/:tagId/link', async (req, res, next) => {
  try {
    const { entity_type, entity_id } = req.body
    const r = await query(
      'INSERT INTO crm_tag_links (tag_id, entity_type, entity_id) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING RETURNING *',
      [req.params.tagId, entity_type, entity_id]
    )
    res.json(r.rows[0] || { ok: true })
  } catch (e) { next(e) }
})

router.delete('/tags/:tagId/link', async (req, res, next) => {
  try {
    const { entity_type, entity_id } = req.body
    await query('DELETE FROM crm_tag_links WHERE tag_id=$1 AND entity_type=$2 AND entity_id=$3', [req.params.tagId, entity_type, entity_id])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

router.get('/tags/entity/:entityType/:entityId', async (req, res, next) => {
  try {
    const r = await query(
      `SELECT t.* FROM crm_tags t JOIN crm_tag_links tl ON tl.tag_id=t.id
       WHERE tl.entity_type=$1 AND tl.entity_id=$2`,
      [req.params.entityType, req.params.entityId]
    )
    res.json(r.rows)
  } catch (e) { next(e) }
})

// Filtered deals (Feature 9)
router.post('/deals/filter', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { stages, tags, min_value, max_value, assigned_to, source, date_from, date_to } = req.body
    let q = 'SELECT d.* FROM crm_deals d WHERE d.user_id=$1'
    const params = [userId]
    let idx = 2
    if (stages && stages.length) { q += ` AND d.stage=ANY($${idx}::text[])`; params.push(stages); idx++ }
    if (min_value) { q += ` AND d.deal_value>=$${idx}`; params.push(min_value); idx++ }
    if (max_value) { q += ` AND d.deal_value<=$${idx}`; params.push(max_value); idx++ }
    if (assigned_to) { q += ` AND d.assigned_to=$${idx}`; params.push(assigned_to); idx++ }
    if (source) { q += ` AND d.source=$${idx}`; params.push(source); idx++ }
    if (date_from) { q += ` AND d.created_at>=$${idx}`; params.push(date_from); idx++ }
    if (date_to) { q += ` AND d.created_at<=$${idx}`; params.push(date_to); idx++ }
    if (tags && tags.length) {
      q += ` AND d.id IN (SELECT entity_id FROM crm_tag_links WHERE entity_type='deal' AND tag_id=ANY($${idx}::int[]))`
      params.push(tags); idx++
    }
    q += ' ORDER BY d.created_at DESC LIMIT 500'
    res.json((await query(q, params)).rows)
  } catch (e) { next(e) }
})

// ══════════════════════════════════════════════════════════════════════════════
// FEATURE 11: Call Logging
// ══════════════════════════════════════════════════════════════════════════════

router.get('/deals/:dealId/calls', async (req, res, next) => {
  try {
    const userId = uid(req)
    res.json((await query('SELECT * FROM crm_calls WHERE deal_id=$1 AND user_id=$2 ORDER BY called_at DESC', [req.params.dealId, userId])).rows)
  } catch (e) { next(e) }
})

router.post('/deals/:dealId/calls', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { direction, outcome, duration_seconds, notes, person_id } = req.body
    const r = await query(
      `INSERT INTO crm_calls (user_id, deal_id, person_id, direction, outcome, duration_seconds, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [userId, req.params.dealId, person_id||null, direction||'outbound', outcome||'connected', duration_seconds||0, notes||'']
    )
    await query(
      `INSERT INTO crm_timeline (user_id, deal_id, event_type, title, metadata)
       VALUES ($1,$2,'call',$3,$4)`,
      [userId, req.params.dealId, `${direction||'outbound'} call — ${outcome||'connected'}`, JSON.stringify({ duration: duration_seconds, outcome })]
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/calls/:id', async (req, res, next) => {
  try {
    const userId = uid(req)
    await query('DELETE FROM crm_calls WHERE id=$1 AND user_id=$2', [req.params.id, userId])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// ══════════════════════════════════════════════════════════════════════════════
// FEATURE 12: Document Attachments
// ══════════════════════════════════════════════════════════════════════════════

router.get('/deals/:dealId/documents', async (req, res, next) => {
  try {
    const userId = uid(req)
    res.json((await query(
      'SELECT id, deal_id, person_id, file_name, file_size, mime_type, version, created_at FROM crm_documents WHERE deal_id=$1 AND user_id=$2 ORDER BY created_at DESC',
      [req.params.dealId, userId]
    )).rows)
  } catch (e) { next(e) }
})

router.post('/deals/:dealId/documents', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { file_name, file_size, mime_type, file_data } = req.body
    const r = await query(
      `INSERT INTO crm_documents (user_id, deal_id, file_name, file_size, mime_type, file_data)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, deal_id, file_name, file_size, mime_type, version, created_at`,
      [userId, req.params.dealId, file_name, file_size||0, mime_type||'application/octet-stream', file_data||'']
    )
    await query(
      `INSERT INTO crm_timeline (user_id, deal_id, event_type, title, metadata)
       VALUES ($1,$2,'document',$3,$4)`,
      [userId, req.params.dealId, `Uploaded: ${file_name}`, JSON.stringify({ file_name, file_size })]
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.get('/documents/:id/download', async (req, res, next) => {
  try {
    const userId = uid(req)
    const r = await query('SELECT * FROM crm_documents WHERE id=$1 AND user_id=$2', [req.params.id, userId])
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' })
    const doc = r.rows[0]
    if (doc.file_data) {
      const buf = Buffer.from(doc.file_data, 'base64')
      res.setHeader('Content-Type', doc.mime_type || 'application/octet-stream')
      res.setHeader('Content-Disposition', `attachment; filename="${doc.file_name}"`)
      res.send(buf)
    } else {
      res.status(404).json({ error: 'No file data' })
    }
  } catch (e) { next(e) }
})

router.delete('/documents/:id', async (req, res, next) => {
  try {
    const userId = uid(req)
    await query('DELETE FROM crm_documents WHERE id=$1 AND user_id=$2', [req.params.id, userId])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// ══════════════════════════════════════════════════════════════════════════════
// FEATURE 13: Meeting Scheduler
// ══════════════════════════════════════════════════════════════════════════════

async function resolveLinkedNames(rows, userId) {
  for (const row of rows) {
    let entities = []
    try { entities = JSON.parse(row.linked_entities || '[]') } catch { entities = [] }
    if (!entities.length && (row.deal_id || row.person_id || row.org_id)) {
      if (row.deal_id) entities.push({ type: 'deal', id: row.deal_id })
      if (row.person_id) entities.push({ type: 'contact', id: row.person_id })
      if (row.org_id) entities.push({ type: 'org', id: row.org_id })
    }
    const dealIds = entities.filter(e => e.type === 'deal').map(e => e.id)
    const contactIds = entities.filter(e => e.type === 'contact').map(e => e.id)
    const orgIds = entities.filter(e => e.type === 'org').map(e => e.id)
    const names = {}
    if (dealIds.length) {
      const dr = await query(`SELECT id, company_name FROM crm_deals WHERE id = ANY($1)`, [dealIds])
      dr.rows.forEach(d => { names[`deal_${d.id}`] = d.company_name })
    }
    if (contactIds.length) {
      const cr = await query(`SELECT id, name FROM crm_people WHERE id = ANY($1)`, [contactIds])
      cr.rows.forEach(c => { names[`contact_${c.id}`] = c.name })
    }
    if (orgIds.length) {
      const or2 = await query(`SELECT id, name FROM crm_organizations WHERE id = ANY($1)`, [orgIds])
      or2.rows.forEach(o => { names[`org_${o.id}`] = o.name })
    }
    row.linked_entities = entities.map(e => ({ ...e, name: names[`${e.type}_${e.id}`] || `#${e.id}` }))
  }
  return rows
}

router.get('/meetings', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { from, to } = req.query
    let q = `SELECT m.*, d.company_name, p.name AS person_name, o.name AS org_name
             FROM crm_meetings m
             LEFT JOIN crm_deals d ON d.id=m.deal_id
             LEFT JOIN crm_people p ON p.id=m.person_id
             LEFT JOIN crm_organizations o ON o.id=m.org_id
             WHERE m.user_id=$1`
    const params = [userId]
    if (from) { q += ' AND m.start_at>=$2'; params.push(from) }
    if (to) { q += ` AND m.end_at<=$${params.length+1}`; params.push(to) }
    q += ' ORDER BY m.start_at'
    const rows = (await query(q, params)).rows
    res.json(await resolveLinkedNames(rows, userId))
  } catch (e) { next(e) }
})

router.get('/deals/:dealId/meetings', async (req, res, next) => {
  try {
    const userId = uid(req)
    res.json((await query('SELECT * FROM crm_meetings WHERE deal_id=$1 AND user_id=$2 ORDER BY start_at', [req.params.dealId, userId])).rows)
  } catch (e) { next(e) }
})

router.post('/meetings', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { deal_id, person_id, org_id, title, description, start_at, end_at, location, notes, linked_entities } = req.body
    const entities = Array.isArray(linked_entities) ? linked_entities : []
    const firstDeal = deal_id || entities.find(e => e.type === 'deal')?.id || null
    const firstContact = person_id || entities.find(e => e.type === 'contact')?.id || null
    const firstOrg = org_id || entities.find(e => e.type === 'org')?.id || null
    const r = await query(
      `INSERT INTO crm_meetings (user_id, deal_id, person_id, org_id, title, description, start_at, end_at, location, notes, linked_entities)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [userId, firstDeal, firstContact, firstOrg, title, description||'', start_at, end_at, location||'', notes||null, JSON.stringify(entities)]
    )
    if (firstDeal) {
      await query(
        `INSERT INTO crm_timeline (user_id, deal_id, event_type, title, metadata)
         VALUES ($1,$2,'meeting',$3,$4)`,
        [userId, firstDeal, title, JSON.stringify({ start_at, end_at, location })]
      )
    }
    const rows = await resolveLinkedNames([r.rows[0]], userId)
    res.json(rows[0])
  } catch (e) { next(e) }
})

router.put('/meetings/:id', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { title, description, start_at, end_at, location, status, deal_id, person_id, org_id, notes, linked_entities } = req.body
    const entities = Array.isArray(linked_entities) ? linked_entities : []
    const firstDeal = entities.find(e => e.type === 'deal')?.id || deal_id || null
    const firstContact = entities.find(e => e.type === 'contact')?.id || person_id || null
    const firstOrg = entities.find(e => e.type === 'org')?.id || org_id || null
    const r = await query(
      `UPDATE crm_meetings SET title=$1,description=$2,start_at=$3,end_at=$4,location=$5,status=$6,
       deal_id=$7,person_id=$8,org_id=$9,notes=$10,linked_entities=$11
       WHERE id=$12 AND user_id=$13 RETURNING *`,
      [title, description, start_at, end_at, location, status||'scheduled',
       firstDeal, firstContact, firstOrg, notes||null, JSON.stringify(entities), req.params.id, userId]
    )
    const rows = await resolveLinkedNames(r.rows, userId)
    res.json(rows[0])
  } catch (e) { next(e) }
})

router.delete('/meetings/:id', async (req, res, next) => {
  try {
    const userId = uid(req)
    await query('DELETE FROM crm_meetings WHERE id=$1 AND user_id=$2', [req.params.id, userId])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// ══════════════════════════════════════════════════════════════════════════════
// FEATURE 14: Product Catalog & Line Items
// ══════════════════════════════════════════════════════════════════════════════

router.get('/products', async (req, res, next) => {
  try {
    const userId = uid(req)
    res.json((await query('SELECT * FROM crm_products WHERE user_id=$1 ORDER BY name', [userId])).rows)
  } catch (e) { next(e) }
})

router.post('/products', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { name, description, price, currency, sku } = req.body
    const r = await query(
      'INSERT INTO crm_products (user_id, name, description, price, currency, sku) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [userId, name, description||'', price||0, currency||'USD', sku||'']
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.put('/products/:id', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { name, description, price, currency, sku, active } = req.body
    const r = await query(
      'UPDATE crm_products SET name=$1,description=$2,price=$3,currency=$4,sku=$5,active=$6 WHERE id=$7 AND user_id=$8 RETURNING *',
      [name, description, price, currency, sku, active !== false, req.params.id, userId]
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/products/:id', async (req, res, next) => {
  try {
    const userId = uid(req)
    await query('DELETE FROM crm_products WHERE id=$1 AND user_id=$2', [req.params.id, userId])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// Line Items
router.get('/deals/:dealId/line-items', async (req, res, next) => {
  try {
    const r = await query(
      `SELECT li.*, p.name as product_name FROM crm_line_items li LEFT JOIN crm_products p ON p.id=li.product_id
       WHERE li.deal_id=$1 ORDER BY li.id`,
      [req.params.dealId]
    )
    res.json(r.rows)
  } catch (e) { next(e) }
})

router.post('/deals/:dealId/line-items', async (req, res, next) => {
  try {
    const { product_id, name, quantity, unit_price, discount_pct } = req.body
    const qty = quantity || 1
    const up = unit_price || 0
    const disc = discount_pct || 0
    const total = qty * up * (1 - disc / 100)
    const r = await query(
      'INSERT INTO crm_line_items (deal_id, product_id, name, quantity, unit_price, discount_pct, total) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [req.params.dealId, product_id||null, name, qty, up, disc, total]
    )
    // Update deal value
    const sum = (await query('SELECT COALESCE(SUM(total),0) as total FROM crm_line_items WHERE deal_id=$1', [req.params.dealId])).rows[0].total
    await query('UPDATE crm_deals SET deal_value=$1, updated_at=NOW() WHERE id=$2', [sum, req.params.dealId])
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/line-items/:id', async (req, res, next) => {
  try {
    const item = (await query('SELECT deal_id FROM crm_line_items WHERE id=$1', [req.params.id])).rows[0]
    await query('DELETE FROM crm_line_items WHERE id=$1', [req.params.id])
    if (item) {
      const sum = (await query('SELECT COALESCE(SUM(total),0) as total FROM crm_line_items WHERE deal_id=$1', [item.deal_id])).rows[0].total
      await query('UPDATE crm_deals SET deal_value=$1, updated_at=NOW() WHERE id=$2', [sum, item.deal_id])
    }
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// ══════════════════════════════════════════════════════════════════════════════
// FEATURE 15: Win/Loss Analysis
// ══════════════════════════════════════════════════════════════════════════════

router.get('/win-loss-analysis', async (req, res, next) => {
  try {
    const userId = uid(req)
    const [wonR, lostR, reasonsR, competitorsR] = await Promise.all([
      query("SELECT COUNT(*) as count, SUM(deal_value) as total FROM crm_deals WHERE user_id=$1 AND stage='won'", [userId]),
      query("SELECT COUNT(*) as count, SUM(deal_value) as total FROM crm_deals WHERE user_id=$1 AND stage='lost'", [userId]),
      query("SELECT lost_reason, COUNT(*) as count FROM crm_deals WHERE user_id=$1 AND stage='lost' AND lost_reason IS NOT NULL AND lost_reason!='' GROUP BY lost_reason ORDER BY count DESC LIMIT 10", [userId]),
      query("SELECT competitor, COUNT(*) as count, SUM(deal_value) as total FROM crm_deals WHERE user_id=$1 AND competitor IS NOT NULL AND competitor!='' GROUP BY competitor ORDER BY count DESC LIMIT 10", [userId]),
    ])
    res.json({
      won: wonR.rows[0],
      lost: lostR.rows[0],
      loss_reasons: reasonsR.rows,
      competitors: competitorsR.rows,
    })
  } catch (e) { next(e) }
})

router.patch('/deals/:id/win-loss', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { lost_reason, loss_category, competitor, win_factors } = req.body
    const r = await query(
      `UPDATE crm_deals SET lost_reason=COALESCE($1,lost_reason), loss_category=COALESCE($2,loss_category),
       competitor=COALESCE($3,competitor), win_factors=COALESCE($4,win_factors), updated_at=NOW()
       WHERE id=$5 AND user_id=$6 RETURNING *`,
      [lost_reason, loss_category, competitor, win_factors ? JSON.stringify(win_factors) : null, req.params.id, userId]
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

// ══════════════════════════════════════════════════════════════════════════════
// FEATURE 16: Duplicate Detection
// ══════════════════════════════════════════════════════════════════════════════

router.get('/duplicates/deals', async (req, res, next) => {
  try {
    const userId = uid(req)
    const r = await query(
      `SELECT a.id as id_a, b.id as id_b, a.company_name as name_a, b.company_name as name_b,
              a.contact_email as email_a, b.contact_email as email_b
       FROM crm_deals a JOIN crm_deals b ON a.id < b.id AND a.user_id=b.user_id
       WHERE a.user_id=$1 AND (
         LOWER(a.company_name) = LOWER(b.company_name) OR
         (a.contact_email != '' AND a.contact_email IS NOT NULL AND LOWER(a.contact_email) = LOWER(b.contact_email))
       ) LIMIT 50`,
      [userId]
    )
    res.json(r.rows)
  } catch (e) { next(e) }
})

router.get('/duplicates/contacts', async (req, res, next) => {
  try {
    const userId = uid(req)
    const r = await query(
      `SELECT a.id as id_a, b.id as id_b, a.name as name_a, b.name as name_b,
              a.email as email_a, b.email as email_b
       FROM crm_people a JOIN crm_people b ON a.id < b.id AND a.user_id=b.user_id
       WHERE a.user_id=$1 AND (
         LOWER(a.name) = LOWER(b.name) OR
         (a.email != '' AND a.email IS NOT NULL AND LOWER(a.email) = LOWER(b.email))
       ) LIMIT 50`,
      [userId]
    )
    res.json(r.rows)
  } catch (e) { next(e) }
})

router.post('/duplicates/merge-deals', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { keep_id, remove_id } = req.body
    // Move children to kept deal
    await query('UPDATE crm_contacts SET deal_id=$1 WHERE deal_id=$2', [keep_id, remove_id])
    await query('UPDATE crm_activities SET deal_id=$1 WHERE deal_id=$2', [keep_id, remove_id])
    await query('UPDATE crm_tasks SET deal_id=$1 WHERE deal_id=$2', [keep_id, remove_id])
    await query('UPDATE crm_emails SET deal_id=$1 WHERE deal_id=$2', [keep_id, remove_id])
    await query('UPDATE crm_calls SET deal_id=$1 WHERE deal_id=$2', [keep_id, remove_id])
    await query('UPDATE crm_documents SET deal_id=$1 WHERE deal_id=$2', [keep_id, remove_id])
    await query('UPDATE crm_timeline SET deal_id=$1 WHERE deal_id=$2', [keep_id, remove_id])
    await query('DELETE FROM crm_deals WHERE id=$1 AND user_id=$2', [remove_id, userId])
    const kept = (await query('SELECT * FROM crm_deals WHERE id=$1 AND user_id=$2', [keep_id, userId])).rows[0]
    res.json(kept)
  } catch (e) { next(e) }
})

// ══════════════════════════════════════════════════════════════════════════════
// FEATURE 17: Activity Sequences
// ══════════════════════════════════════════════════════════════════════════════

router.get('/sequences', async (req, res, next) => {
  try {
    const userId = uid(req)
    res.json((await query('SELECT * FROM crm_sequences WHERE user_id=$1 ORDER BY name', [userId])).rows)
  } catch (e) { next(e) }
})

router.post('/sequences', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { name, steps } = req.body
    const r = await query(
      'INSERT INTO crm_sequences (user_id, name, steps) VALUES ($1,$2,$3) RETURNING *',
      [userId, name, JSON.stringify(steps||[])]
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.put('/sequences/:id', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { name, steps, active } = req.body
    const r = await query(
      'UPDATE crm_sequences SET name=$1, steps=$2, active=$3 WHERE id=$4 AND user_id=$5 RETURNING *',
      [name, JSON.stringify(steps||[]), active !== false, req.params.id, userId]
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/sequences/:id', async (req, res, next) => {
  try {
    const userId = uid(req)
    await query('DELETE FROM crm_sequences WHERE id=$1 AND user_id=$2', [req.params.id, userId])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

router.post('/sequences/:id/enroll', async (req, res, next) => {
  try {
    const { deal_id, person_id } = req.body
    const seq = (await query('SELECT * FROM crm_sequences WHERE id=$1', [req.params.id])).rows[0]
    if (!seq) return res.status(404).json({ error: 'Sequence not found' })
    const steps = seq.steps || []
    const nextAction = steps[0]?.delay_days ? new Date(Date.now() + steps[0].delay_days * 86400000) : new Date()
    const r = await query(
      'INSERT INTO crm_sequence_enrollments (sequence_id, deal_id, person_id, next_action_at) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.params.id, deal_id||null, person_id||null, nextAction]
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.get('/sequences/:id/enrollments', async (req, res, next) => {
  try {
    const r = await query(
      `SELECT se.*, d.company_name, p.name as person_name
       FROM crm_sequence_enrollments se
       LEFT JOIN crm_deals d ON d.id=se.deal_id
       LEFT JOIN crm_people p ON p.id=se.person_id
       WHERE se.sequence_id=$1 ORDER BY se.started_at DESC`,
      [req.params.id]
    )
    res.json(r.rows)
  } catch (e) { next(e) }
})

router.delete('/enrollments/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM crm_sequence_enrollments WHERE id=$1', [req.params.id])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// ══════════════════════════════════════════════════════════════════════════════
// FEATURE 18: Dashboard Widgets (layout persistence)
// ══════════════════════════════════════════════════════════════════════════════

router.get('/dashboard-layouts', async (req, res, next) => {
  try {
    const userId = uid(req)
    res.json((await query('SELECT * FROM crm_dashboard_layouts WHERE user_id=$1 ORDER BY name', [userId])).rows)
  } catch (e) { next(e) }
})

router.post('/dashboard-layouts', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { name, widgets } = req.body
    const r = await query(
      'INSERT INTO crm_dashboard_layouts (user_id, name, widgets) VALUES ($1,$2,$3) RETURNING *',
      [userId, name||'Default', JSON.stringify(widgets||[])]
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.put('/dashboard-layouts/:id', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { name, widgets } = req.body
    const r = await query(
      'UPDATE crm_dashboard_layouts SET name=$1, widgets=$2, updated_at=NOW() WHERE id=$3 AND user_id=$4 RETURNING *',
      [name, JSON.stringify(widgets||[]), req.params.id, userId]
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/dashboard-layouts/:id', async (req, res, next) => {
  try {
    const userId = uid(req)
    await query('DELETE FROM crm_dashboard_layouts WHERE id=$1 AND user_id=$2', [req.params.id, userId])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// ══════════════════════════════════════════════════════════════════════════════
// FEATURE 19: Audit Log
// ══════════════════════════════════════════════════════════════════════════════

router.get('/audit-log', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { entity_type, entity_id, limit: lim } = req.query
    let q = 'SELECT * FROM crm_audit_log WHERE user_id=$1'
    const params = [userId]
    if (entity_type) { q += ` AND entity_type=$${params.length+1}`; params.push(entity_type) }
    if (entity_id) { q += ` AND entity_id=$${params.length+1}`; params.push(entity_id) }
    q += ` ORDER BY created_at DESC LIMIT $${params.length+1}`
    params.push(parseInt(lim) || 100)
    res.json((await query(q, params)).rows)
  } catch (e) { next(e) }
})

// ══════════════════════════════════════════════════════════════════════════════
// FEATURE 20: API & Webhooks
// ══════════════════════════════════════════════════════════════════════════════

router.get('/webhooks', async (req, res, next) => {
  try {
    const userId = uid(req)
    res.json((await query('SELECT id, url, events, active, last_triggered_at, created_at FROM crm_webhooks WHERE user_id=$1', [userId])).rows)
  } catch (e) { next(e) }
})

router.post('/webhooks', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { url, events, secret } = req.body
    const r = await query(
      'INSERT INTO crm_webhooks (user_id, url, events, secret) VALUES ($1,$2,$3,$4) RETURNING id, url, events, active, created_at',
      [userId, url, events||[], secret||'']
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.put('/webhooks/:id', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { url, events, active } = req.body
    const r = await query(
      'UPDATE crm_webhooks SET url=$1, events=$2, active=$3 WHERE id=$4 AND user_id=$5 RETURNING id, url, events, active, created_at',
      [url, events, active !== false, req.params.id, userId]
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/webhooks/:id', async (req, res, next) => {
  try {
    const userId = uid(req)
    await query('DELETE FROM crm_webhooks WHERE id=$1 AND user_id=$2', [req.params.id, userId])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// API Keys
router.get('/api-keys', async (req, res, next) => {
  try {
    const userId = uid(req)
    res.json((await query('SELECT id, name, last_used_at, created_at FROM crm_api_keys WHERE user_id=$1', [userId])).rows)
  } catch (e) { next(e) }
})

router.post('/api-keys', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { name } = req.body
    const crypto = await import('crypto')
    const key = 'crm_' + crypto.randomBytes(24).toString('hex')
    const keyHash = crypto.createHash('sha256').update(key).digest('hex')
    const r = await query(
      'INSERT INTO crm_api_keys (user_id, key_hash, name) VALUES ($1,$2,$3) RETURNING id, name, created_at',
      [userId, keyHash, name||'API Key']
    )
    res.json({ ...r.rows[0], key })
  } catch (e) { next(e) }
})

router.delete('/api-keys/:id', async (req, res, next) => {
  try {
    const userId = uid(req)
    await query('DELETE FROM crm_api_keys WHERE id=$1 AND user_id=$2', [req.params.id, userId])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// ══════════════════════════════════════════════════════════════════════════════
// CRM v6 FEATURE 1: Smart Views (Saved Filters)
// ══════════════════════════════════════════════════════════════════════════════

router.get('/smart-views', async (req, res, next) => {
  try {
    const userId = uid(req)
    res.json((await query('SELECT * FROM crm_smart_views WHERE user_id=$1 OR shared=true ORDER BY name', [userId])).rows)
  } catch (e) { next(e) }
})

router.post('/smart-views', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { name, filters, columns, sort_field, sort_dir, group_by, is_default, shared } = req.body
    const r = await query(
      `INSERT INTO crm_smart_views (user_id, name, filters, columns, sort_field, sort_dir, group_by, is_default, shared)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [userId, name, JSON.stringify(filters||{}), JSON.stringify(columns||[]), sort_field||'created_at', sort_dir||'desc', group_by||null, is_default||false, shared||false]
    )
    if (is_default) await query('UPDATE crm_smart_views SET is_default=false WHERE user_id=$1 AND id!=$2', [userId, r.rows[0].id])
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.put('/smart-views/:id', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { name, filters, columns, sort_field, sort_dir, group_by, is_default, shared } = req.body
    const r = await query(
      `UPDATE crm_smart_views SET name=$1,filters=$2,columns=$3,sort_field=$4,sort_dir=$5,group_by=$6,is_default=$7,shared=$8
       WHERE id=$9 AND user_id=$10 RETURNING *`,
      [name, JSON.stringify(filters||{}), JSON.stringify(columns||[]), sort_field, sort_dir, group_by, is_default, shared, req.params.id, userId]
    )
    if (is_default) await query('UPDATE crm_smart_views SET is_default=false WHERE user_id=$1 AND id!=$2', [userId, r.rows[0]?.id])
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/smart-views/:id', async (req, res, next) => {
  try { await query('DELETE FROM crm_smart_views WHERE id=$1 AND user_id=$2', [req.params.id, uid(req)]); res.json({ ok: true }) } catch (e) { next(e) }
})

// ══════════════════════════════════════════════════════════════════════════════
// CRM v6 FEATURE 2: Deal Approval Workflows
// ══════════════════════════════════════════════════════════════════════════════

router.get('/approval-rules', async (req, res, next) => {
  try { res.json((await query('SELECT * FROM crm_approval_rules WHERE user_id=$1 ORDER BY id', [uid(req)])).rows) } catch (e) { next(e) }
})

router.post('/approval-rules', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { name, trigger_stage, min_value, approver_email, escalation_hours } = req.body
    const r = await query(
      'INSERT INTO crm_approval_rules (user_id,name,trigger_stage,min_value,approver_email,escalation_hours) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [userId, name, trigger_stage, min_value||0, approver_email, escalation_hours||24]
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.put('/approval-rules/:id', async (req, res, next) => {
  try {
    const { name, trigger_stage, min_value, approver_email, escalation_hours, active } = req.body
    const r = await query(
      'UPDATE crm_approval_rules SET name=$1,trigger_stage=$2,min_value=$3,approver_email=$4,escalation_hours=$5,active=$6 WHERE id=$7 AND user_id=$8 RETURNING *',
      [name, trigger_stage, min_value, approver_email, escalation_hours, active, req.params.id, uid(req)]
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/approval-rules/:id', async (req, res, next) => {
  try { await query('DELETE FROM crm_approval_rules WHERE id=$1 AND user_id=$2', [req.params.id, uid(req)]); res.json({ ok: true }) } catch (e) { next(e) }
})

router.post('/deals/:id/request-approval', async (req, res, next) => {
  try {
    const userId = uid(req)
    const dealId = parseInt(req.params.id)
    const r = await query('INSERT INTO crm_approvals (deal_id, user_id, rule_id) VALUES ($1,$2,$3) RETURNING *', [dealId, userId, req.body.rule_id||null])
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.get('/approvals/pending', async (req, res, next) => {
  try {
    const r = await query(
      `SELECT a.*, d.company_name, d.deal_value, d.stage FROM crm_approvals a JOIN crm_deals d ON d.id=a.deal_id WHERE a.user_id=$1 AND a.status='pending' ORDER BY a.requested_at DESC`,
      [uid(req)]
    )
    res.json(r.rows)
  } catch (e) { next(e) }
})

router.patch('/approvals/:id', async (req, res, next) => {
  try {
    const { status, rejection_reason } = req.body
    const r = await query(
      'UPDATE crm_approvals SET status=$1, rejection_reason=$2, resolved_at=NOW(), resolved_by=$3 WHERE id=$4 RETURNING *',
      [status, rejection_reason||null, req.user?.email||'system', req.params.id]
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

// ══════════════════════════════════════════════════════════════════════════════
// CRM v6 FEATURE 4: Multiple Pipelines
// ══════════════════════════════════════════════════════════════════════════════

router.get('/pipelines', async (req, res, next) => {
  try { res.json((await query('SELECT * FROM crm_pipelines WHERE user_id=$1 ORDER BY name', [uid(req)])).rows) } catch (e) { next(e) }
})

router.post('/pipelines', async (req, res, next) => {
  try {
    const { name, description, is_default } = req.body
    const r = await query('INSERT INTO crm_pipelines (user_id,name,description,is_default) VALUES ($1,$2,$3,$4) RETURNING *', [uid(req), name, description||'', is_default||false])
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.put('/pipelines/:id', async (req, res, next) => {
  try {
    const { name, description, is_default } = req.body
    const r = await query('UPDATE crm_pipelines SET name=$1,description=$2,is_default=$3 WHERE id=$4 AND user_id=$5 RETURNING *', [name, description, is_default, req.params.id, uid(req)])
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/pipelines/:id', async (req, res, next) => {
  try {
    const pid = req.params.id, userId = uid(req)
    await query('DELETE FROM crm_deals WHERE pipeline_id=$1 AND user_id=$2', [pid, userId])
    await query('DELETE FROM crm_stages WHERE pipeline_id=$1 AND user_id=$2', [pid, userId])
    await query('DELETE FROM crm_pipelines WHERE id=$1 AND user_id=$2', [pid, userId])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// ══════════════════════════════════════════════════════════════════════════════
// CRM v6 FEATURE 5: Territory & Lead Routing
// ══════════════════════════════════════════════════════════════════════════════

router.get('/territories', async (req, res, next) => {
  try { res.json((await query('SELECT * FROM crm_territories WHERE user_id=$1 ORDER BY name', [uid(req)])).rows) } catch (e) { next(e) }
})

router.post('/territories', async (req, res, next) => {
  try {
    const { name, rules, assigned_to, capacity } = req.body
    const r = await query('INSERT INTO crm_territories (user_id,name,rules,assigned_to,capacity) VALUES ($1,$2,$3,$4,$5) RETURNING *', [uid(req), name, JSON.stringify(rules||{}), assigned_to, capacity||100])
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.put('/territories/:id', async (req, res, next) => {
  try {
    const { name, rules, assigned_to, capacity, active } = req.body
    const r = await query('UPDATE crm_territories SET name=$1,rules=$2,assigned_to=$3,capacity=$4,active=$5 WHERE id=$6 AND user_id=$7 RETURNING *', [name, JSON.stringify(rules||{}), assigned_to, capacity, active, req.params.id, uid(req)])
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/territories/:id', async (req, res, next) => {
  try { await query('DELETE FROM crm_territories WHERE id=$1 AND user_id=$2', [req.params.id, uid(req)]); res.json({ ok: true }) } catch (e) { next(e) }
})

router.get('/routing-rules', async (req, res, next) => {
  try { res.json((await query('SELECT * FROM crm_routing_rules WHERE user_id=$1 ORDER BY priority DESC', [uid(req)])).rows) } catch (e) { next(e) }
})

router.post('/routing-rules', async (req, res, next) => {
  try {
    const { name, conditions, action_type, action_config, priority } = req.body
    const r = await query('INSERT INTO crm_routing_rules (user_id,name,conditions,action_type,action_config,priority) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *', [uid(req), name, JSON.stringify(conditions||{}), action_type||'assign', JSON.stringify(action_config||{}), priority||0])
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/routing-rules/:id', async (req, res, next) => {
  try { await query('DELETE FROM crm_routing_rules WHERE id=$1 AND user_id=$2', [req.params.id, uid(req)]); res.json({ ok: true }) } catch (e) { next(e) }
})

router.post('/routing/apply', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { deal_id } = req.body
    const deal = (await query('SELECT * FROM crm_deals WHERE id=$1 AND user_id=$2', [deal_id, userId])).rows[0]
    if (!deal) return res.status(404).json({ error: 'Deal not found' })
    const rules = (await query('SELECT * FROM crm_routing_rules WHERE user_id=$1 AND active=true ORDER BY priority DESC', [userId])).rows
    for (const rule of rules) {
      const cond = rule.conditions || {}
      let match = true
      if (cond.min_value && parseFloat(deal.deal_value) < parseFloat(cond.min_value)) match = false
      if (cond.source && deal.source !== cond.source) match = false
      if (cond.stage && deal.stage !== cond.stage) match = false
      if (match) {
        const cfg = rule.action_config || {}
        if (rule.action_type === 'assign' && cfg.assigned_to) {
          await query('UPDATE crm_deals SET assigned_to=$1, updated_at=NOW() WHERE id=$2', [cfg.assigned_to, deal_id])
        }
        return res.json({ routed: true, rule: rule.name, assigned_to: cfg.assigned_to })
      }
    }
    res.json({ routed: false })
  } catch (e) { next(e) }
})

// ══════════════════════════════════════════════════════════════════════════════
// CRM v6 FEATURE 6: SLA & Response Time Tracking
// ══════════════════════════════════════════════════════════════════════════════

router.get('/sla-policies', async (req, res, next) => {
  try { res.json((await query('SELECT * FROM crm_sla_policies WHERE user_id=$1 ORDER BY id', [uid(req)])).rows) } catch (e) { next(e) }
})

router.post('/sla-policies', async (req, res, next) => {
  try {
    const { name, stage, max_hours, warning_hours, escalation_to, business_hours } = req.body
    const r = await query(
      'INSERT INTO crm_sla_policies (user_id,name,stage,max_hours,warning_hours,escalation_to,business_hours) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [uid(req), name, stage, max_hours||24, warning_hours||12, escalation_to||'', JSON.stringify(business_hours||{start:9,end:17,days:[1,2,3,4,5]})]
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.put('/sla-policies/:id', async (req, res, next) => {
  try {
    const { name, stage, max_hours, warning_hours, escalation_to, business_hours, active } = req.body
    const r = await query(
      'UPDATE crm_sla_policies SET name=$1,stage=$2,max_hours=$3,warning_hours=$4,escalation_to=$5,business_hours=$6,active=$7 WHERE id=$8 AND user_id=$9 RETURNING *',
      [name, stage, max_hours, warning_hours, escalation_to, JSON.stringify(business_hours||{}), active, req.params.id, uid(req)]
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/sla-policies/:id', async (req, res, next) => {
  try { await query('DELETE FROM crm_sla_policies WHERE id=$1 AND user_id=$2', [req.params.id, uid(req)]); res.json({ ok: true }) } catch (e) { next(e) }
})

router.get('/sla/breaches', async (req, res, next) => {
  try {
    const userId = uid(req)
    const policies = (await query('SELECT * FROM crm_sla_policies WHERE user_id=$1 AND active=true', [userId])).rows
    const breaches = []
    for (const p of policies) {
      const deals = (await query(
        `SELECT * FROM crm_deals WHERE user_id=$1 AND stage=$2 AND stage_entered_at < NOW() - INTERVAL '1 hour' * $3 AND stage NOT IN ('won','lost')`,
        [userId, p.stage, p.max_hours]
      )).rows
      for (const d of deals) breaches.push({ deal: d, policy: p, hours_over: Math.round((Date.now() - new Date(d.stage_entered_at)) / 3600000 - p.max_hours) })
    }
    res.json(breaches)
  } catch (e) { next(e) }
})

// ══════════════════════════════════════════════════════════════════════════════
// CRM v6 FEATURE 7: Quote Builder
// ══════════════════════════════════════════════════════════════════════════════

router.get('/quotes', async (req, res, next) => {
  try {
    const { deal_id } = req.query
    let q = 'SELECT q.*, d.company_name FROM crm_quotes q LEFT JOIN crm_deals d ON d.id=q.deal_id WHERE q.user_id=$1'
    const params = [uid(req)]
    if (deal_id) { q += ' AND q.deal_id=$2'; params.push(deal_id) }
    q += ' ORDER BY q.created_at DESC'
    res.json((await query(q, params)).rows)
  } catch (e) { next(e) }
})

router.post('/quotes', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { deal_id, valid_until, tax_rate, discount_amount, terms, notes, template_config, line_items } = req.body
    const items = line_items || []
    const subtotal = items.reduce((s, i) => s + (i.quantity || 1) * (i.unit_price || 0), 0)
    const taxAmt = subtotal * (tax_rate || 0) / 100
    const total = subtotal + taxAmt - (discount_amount || 0)
    const num = `Q-${Date.now().toString(36).toUpperCase()}`
    const r = await query(
      `INSERT INTO crm_quotes (user_id,deal_id,quote_number,valid_until,subtotal,tax_rate,tax_amount,discount_amount,total,terms,notes,template_config,line_items)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [userId, deal_id||null, num, valid_until||null, subtotal, tax_rate||0, taxAmt, discount_amount||0, total, terms||'', notes||'', JSON.stringify(template_config||{}), JSON.stringify(items)]
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.put('/quotes/:id', async (req, res, next) => {
  try {
    const { status, valid_until, tax_rate, discount_amount, terms, notes, template_config, line_items } = req.body
    const items = line_items || []
    const subtotal = items.reduce((s, i) => s + (i.quantity || 1) * (i.unit_price || 0), 0)
    const taxAmt = subtotal * (tax_rate || 0) / 100
    const total = subtotal + taxAmt - (discount_amount || 0)
    const r = await query(
      `UPDATE crm_quotes SET status=$1,valid_until=$2,tax_rate=$3,discount_amount=$4,subtotal=$5,tax_amount=$6,total=$7,terms=$8,notes=$9,template_config=$10,line_items=$11,sent_at=CASE WHEN $1='sent' THEN NOW() ELSE sent_at END
       WHERE id=$12 AND user_id=$13 RETURNING *`,
      [status||'draft', valid_until, tax_rate||0, discount_amount||0, subtotal, taxAmt, total, terms, notes, JSON.stringify(template_config||{}), JSON.stringify(items), req.params.id, uid(req)]
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/quotes/:id', async (req, res, next) => {
  try { await query('DELETE FROM crm_quotes WHERE id=$1 AND user_id=$2', [req.params.id, uid(req)]); res.json({ ok: true }) } catch (e) { next(e) }
})

// ══════════════════════════════════════════════════════════════════════════════
// CRM v6 FEATURE 8: Deal Scoring
// ══════════════════════════════════════════════════════════════════════════════

router.get('/deal-scoring-rules', async (req, res, next) => {
  try { res.json((await query('SELECT * FROM crm_deal_scoring_rules WHERE user_id=$1 ORDER BY weight DESC', [uid(req)])).rows) } catch (e) { next(e) }
})

router.post('/deal-scoring-rules', async (req, res, next) => {
  try {
    const { signal, weight, decay_days, description } = req.body
    const r = await query('INSERT INTO crm_deal_scoring_rules (user_id,signal,weight,decay_days,description) VALUES ($1,$2,$3,$4,$5) RETURNING *', [uid(req), signal, weight||10, decay_days||30, description||''])
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/deal-scoring-rules/:id', async (req, res, next) => {
  try { await query('DELETE FROM crm_deal_scoring_rules WHERE id=$1 AND user_id=$2', [req.params.id, uid(req)]); res.json({ ok: true }) } catch (e) { next(e) }
})

router.post('/deals/recalculate-deal-scores', async (req, res, next) => {
  try {
    const userId = uid(req)
    const rules = (await query('SELECT * FROM crm_deal_scoring_rules WHERE user_id=$1 AND active=true', [userId])).rows
    const deals = (await query("SELECT * FROM crm_deals WHERE user_id=$1 AND stage NOT IN ('won','lost')", [userId])).rows
    for (const deal of deals) {
      let score = 0
      for (const rule of rules) {
        if (rule.signal === 'has_contacts') { const c = (await query('SELECT COUNT(*) FROM crm_deal_people WHERE deal_id=$1', [deal.id])).rows[0].count; if (parseInt(c) > 0) score += rule.weight }
        else if (rule.signal === 'has_activities') { const a = (await query('SELECT COUNT(*) FROM crm_activities WHERE deal_id=$1', [deal.id])).rows[0].count; if (parseInt(a) > 0) score += rule.weight }
        else if (rule.signal === 'has_value') { if (parseFloat(deal.deal_value) > 0) score += rule.weight }
        else if (rule.signal === 'recent_activity') { const a = (await query("SELECT COUNT(*) FROM crm_activities WHERE deal_id=$1 AND created_at > NOW()-INTERVAL '7 days'", [deal.id])).rows[0].count; if (parseInt(a) > 0) score += rule.weight }
        else if (rule.signal === 'has_next_step') { if (deal.follow_up_at) score += rule.weight }
        else if (rule.signal === 'stage_velocity') { const days = (Date.now() - new Date(deal.stage_entered_at)) / 86400000; if (days <= (rule.decay_days || 30)) score += rule.weight }
      }
      const health = score >= 70 ? 'strong' : score >= 40 ? 'neutral' : 'at_risk'
      await query('UPDATE crm_deals SET deal_score=$1, deal_health=$2 WHERE id=$3', [score, health, deal.id])
    }
    res.json({ updated: deals.length })
  } catch (e) { next(e) }
})

// ══════════════════════════════════════════════════════════════════════════════
// CRM v6 FEATURE 9: Contact Roles & Buying Committee
// ══════════════════════════════════════════════════════════════════════════════

router.get('/contact-roles', async (req, res, next) => {
  try { res.json((await query('SELECT * FROM crm_contact_roles WHERE user_id=$1 ORDER BY name', [uid(req)])).rows) } catch (e) { next(e) }
})

router.post('/contact-roles', async (req, res, next) => {
  try {
    const { name, influence_weight, color } = req.body
    const r = await query('INSERT INTO crm_contact_roles (user_id,name,influence_weight,color) VALUES ($1,$2,$3,$4) ON CONFLICT (user_id,name) DO UPDATE SET influence_weight=$3,color=$4 RETURNING *', [uid(req), name, influence_weight||5, color||'#5E6C84'])
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/contact-roles/:id', async (req, res, next) => {
  try { await query('DELETE FROM crm_contact_roles WHERE id=$1 AND user_id=$2', [req.params.id, uid(req)]); res.json({ ok: true }) } catch (e) { next(e) }
})

router.patch('/deal-people/:id/role', async (req, res, next) => {
  try {
    const { role_id, influence } = req.body
    const r = await query('UPDATE crm_deal_people SET role_id=$1, influence=$2 WHERE id=$3 RETURNING *', [role_id||null, influence||'medium', req.params.id])
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

// ══════════════════════════════════════════════════════════════════════════════
// CRM v6 FEATURE 10: Recurring Revenue & Renewal Tracking
// ══════════════════════════════════════════════════════════════════════════════

router.get('/renewals', async (req, res, next) => {
  try {
    const userId = uid(req)
    const r = await query(
      `SELECT * FROM crm_deals WHERE user_id=$1 AND is_recurring=true AND contract_end IS NOT NULL ORDER BY contract_end`,
      [userId]
    )
    res.json(r.rows)
  } catch (e) { next(e) }
})

router.get('/renewals/upcoming', async (req, res, next) => {
  try {
    const userId = uid(req)
    const days = parseInt(req.query.days) || 30
    const r = await query(
      `SELECT * FROM crm_deals WHERE user_id=$1 AND is_recurring=true AND contract_end BETWEEN NOW() AND NOW() + INTERVAL '1 day' * $2 ORDER BY contract_end`,
      [userId, days]
    )
    res.json(r.rows)
  } catch (e) { next(e) }
})

router.post('/deals/:id/create-renewal', async (req, res, next) => {
  try {
    const userId = uid(req)
    const parent = (await query('SELECT * FROM crm_deals WHERE id=$1 AND user_id=$2', [req.params.id, userId])).rows[0]
    if (!parent) return res.status(404).json({ error: 'Deal not found' })
    const r = await query(
      `INSERT INTO crm_deals (user_id, company_name, contact_name, contact_email, deal_value, stage, is_recurring, mrr_value, parent_deal_id, source)
       VALUES ($1,$2,$3,$4,$5,'lead',true,$6,$7,'renewal') RETURNING *`,
      [userId, parent.company_name, parent.contact_name, parent.contact_email, parent.deal_value, parent.mrr_value || 0, parent.id]
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

// ══════════════════════════════════════════════════════════════════════════════
// CRM v6 FEATURE 11: Form Builder
// ══════════════════════════════════════════════════════════════════════════════

router.get('/forms', async (req, res, next) => {
  try { res.json((await query('SELECT * FROM crm_forms WHERE user_id=$1 ORDER BY name', [uid(req)])).rows) } catch (e) { next(e) }
})

router.post('/forms', async (req, res, next) => {
  try {
    const { name, fields, settings, pipeline_id, default_stage, assigned_to } = req.body
    const r = await query(
      'INSERT INTO crm_forms (user_id,name,fields,settings,pipeline_id,default_stage,assigned_to) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [uid(req), name, JSON.stringify(fields||[]), JSON.stringify(settings||{}), pipeline_id||null, default_stage||'lead', assigned_to||null]
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.put('/forms/:id', async (req, res, next) => {
  try {
    const { name, fields, settings, pipeline_id, default_stage, assigned_to, active } = req.body
    const r = await query(
      'UPDATE crm_forms SET name=$1,fields=$2,settings=$3,pipeline_id=$4,default_stage=$5,assigned_to=$6,active=$7 WHERE id=$8 AND user_id=$9 RETURNING *',
      [name, JSON.stringify(fields||[]), JSON.stringify(settings||{}), pipeline_id, default_stage, assigned_to, active, req.params.id, uid(req)]
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/forms/:id', async (req, res, next) => {
  try { await query('DELETE FROM crm_forms WHERE id=$1 AND user_id=$2', [req.params.id, uid(req)]); res.json({ ok: true }) } catch (e) { next(e) }
})

// Public form submission (no auth)
router.post('/forms/:id/submit', async (req, res, next) => {
  try {
    const form = (await query('SELECT * FROM crm_forms WHERE id=$1 AND active=true', [req.params.id])).rows[0]
    if (!form) return res.status(404).json({ error: 'Form not found' })
    const data = req.body
    const dealFields = {}
    for (const f of (form.fields || [])) {
      if (f.map_to && data[f.name]) dealFields[f.map_to] = data[f.name]
    }
    const deal = (await query(
      `INSERT INTO crm_deals (user_id, company_name, contact_name, contact_email, stage, source, assigned_to, pipeline_id)
       VALUES ($1,$2,$3,$4,$5,'form_submission',$6,$7) RETURNING *`,
      [form.user_id, dealFields.company_name||data.company||'Web Lead', dealFields.contact_name||data.name||'', dealFields.contact_email||data.email||'', form.default_stage||'lead', form.assigned_to, form.pipeline_id]
    )).rows[0]
    await query('INSERT INTO crm_form_submissions (form_id, data, deal_id, ip_address) VALUES ($1,$2,$3,$4)', [form.id, JSON.stringify(data), deal.id, req.ip||''])
    await query('UPDATE crm_forms SET submissions_count=submissions_count+1 WHERE id=$1', [form.id])
    res.json({ ok: true, deal_id: deal.id })
  } catch (e) { next(e) }
})

router.get('/forms/:id/submissions', async (req, res, next) => {
  try { res.json((await query('SELECT * FROM crm_form_submissions WHERE form_id=$1 ORDER BY submitted_at DESC LIMIT 200', [req.params.id])).rows) } catch (e) { next(e) }
})

// ══════════════════════════════════════════════════════════════════════════════
// CRM v6 FEATURE 12: Activity Cadence Templates
// ══════════════════════════════════════════════════════════════════════════════

router.get('/cadences', async (req, res, next) => {
  try { res.json((await query('SELECT * FROM crm_cadences WHERE user_id=$1 ORDER BY name', [uid(req)])).rows) } catch (e) { next(e) }
})

router.post('/cadences', async (req, res, next) => {
  try {
    const { name, description, steps, settings } = req.body
    const r = await query('INSERT INTO crm_cadences (user_id,name,description,steps,settings) VALUES ($1,$2,$3,$4,$5) RETURNING *', [uid(req), name, description||'', JSON.stringify(steps||[]), JSON.stringify(settings||{})])
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.put('/cadences/:id', async (req, res, next) => {
  try {
    const { name, description, steps, settings, active } = req.body
    const r = await query('UPDATE crm_cadences SET name=$1,description=$2,steps=$3,settings=$4,active=$5 WHERE id=$6 AND user_id=$7 RETURNING *', [name, description, JSON.stringify(steps||[]), JSON.stringify(settings||{}), active, req.params.id, uid(req)])
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/cadences/:id', async (req, res, next) => {
  try { await query('DELETE FROM crm_cadences WHERE id=$1 AND user_id=$2', [req.params.id, uid(req)]); res.json({ ok: true }) } catch (e) { next(e) }
})

router.post('/cadences/:id/enroll', async (req, res, next) => {
  try {
    const { deal_id, person_id } = req.body
    const cadence = (await query('SELECT * FROM crm_cadences WHERE id=$1', [req.params.id])).rows[0]
    if (!cadence) return res.status(404).json({ error: 'Cadence not found' })
    const steps = cadence.steps || []
    const nextAt = steps[0]?.delay_days ? new Date(Date.now() + steps[0].delay_days * 86400000) : new Date()
    const r = await query('INSERT INTO crm_cadence_enrollments (cadence_id,deal_id,person_id,next_action_at) VALUES ($1,$2,$3,$4) RETURNING *', [req.params.id, deal_id||null, person_id||null, nextAt])
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.get('/cadences/:id/enrollments', async (req, res, next) => {
  try {
    const r = await query('SELECT ce.*, d.company_name FROM crm_cadence_enrollments ce LEFT JOIN crm_deals d ON d.id=ce.deal_id WHERE ce.cadence_id=$1 ORDER BY ce.started_at DESC', [req.params.id])
    res.json(r.rows)
  } catch (e) { next(e) }
})

router.patch('/cadence-enrollments/:id', async (req, res, next) => {
  try {
    const { status } = req.body
    const sets = status === 'paused' ? 'status=$1, paused_at=NOW()' : status === 'completed' ? 'status=$1, completed_at=NOW()' : 'status=$1, paused_at=NULL'
    const r = await query(`UPDATE crm_cadence_enrollments SET ${sets} WHERE id=$2 RETURNING *`, [status, req.params.id])
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

// ══════════════════════════════════════════════════════════════════════════════
// CRM v6 FEATURE 13: Deal Splitting & Multi-Currency
// ══════════════════════════════════════════════════════════════════════════════

router.post('/deals/:id/split', async (req, res, next) => {
  try {
    const userId = uid(req)
    const parent = (await query('SELECT * FROM crm_deals WHERE id=$1 AND user_id=$2', [req.params.id, userId])).rows[0]
    if (!parent) return res.status(404).json({ error: 'Deal not found' })
    const { splits } = req.body // [{ company_name, deal_value, stage }]
    const results = []
    for (const s of (splits || [])) {
      const r = await query(
        `INSERT INTO crm_deals (user_id,company_name,contact_name,contact_email,deal_value,stage,split_from_id,currency,source)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'split') RETURNING *`,
        [userId, s.company_name||parent.company_name, parent.contact_name, parent.contact_email, s.deal_value||0, s.stage||parent.stage, parent.id, s.currency||parent.currency]
      )
      results.push(r.rows[0])
    }
    res.json(results)
  } catch (e) { next(e) }
})

router.get('/exchange-rates', async (req, res, next) => {
  try { res.json((await query('SELECT * FROM crm_exchange_rates WHERE user_id=$1', [uid(req)])).rows) } catch (e) { next(e) }
})

router.post('/exchange-rates', async (req, res, next) => {
  try {
    const { from_currency, to_currency, rate } = req.body
    const r = await query(
      'INSERT INTO crm_exchange_rates (user_id,from_currency,to_currency,rate) VALUES ($1,$2,$3,$4) ON CONFLICT (user_id,from_currency,to_currency) DO UPDATE SET rate=$4,updated_at=NOW() RETURNING *',
      [uid(req), from_currency, to_currency, rate]
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/exchange-rates/:id', async (req, res, next) => {
  try { await query('DELETE FROM crm_exchange_rates WHERE id=$1 AND user_id=$2', [req.params.id, uid(req)]); res.json({ ok: true }) } catch (e) { next(e) }
})

// ══════════════════════════════════════════════════════════════════════════════
// CRM v6 FEATURE 15: Goal Cascading
// ══════════════════════════════════════════════════════════════════════════════

router.get('/goals/cascaded', async (req, res, next) => {
  try {
    const r = await query('SELECT * FROM crm_goals WHERE user_id=$1 ORDER BY period_key DESC, parent_goal_id NULLS FIRST', [uid(req)])
    res.json(r.rows)
  } catch (e) { next(e) }
})

// ══════════════════════════════════════════════════════════════════════════════
// CRM v6 FEATURE 16: Snooze & Remind Later
// ══════════════════════════════════════════════════════════════════════════════

router.get('/snoozes', async (req, res, next) => {
  try { res.json((await query('SELECT * FROM crm_snoozes WHERE user_id=$1 AND resolved=false ORDER BY snooze_until', [uid(req)])).rows) } catch (e) { next(e) }
})

router.post('/snoozes', async (req, res, next) => {
  try {
    const { entity_type, entity_id, snooze_until, reason } = req.body
    const r = await query('INSERT INTO crm_snoozes (user_id,entity_type,entity_id,snooze_until,reason) VALUES ($1,$2,$3,$4,$5) RETURNING *', [uid(req), entity_type, entity_id, snooze_until, reason||''])
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.patch('/snoozes/:id/resolve', async (req, res, next) => {
  try {
    const r = await query('UPDATE crm_snoozes SET resolved=true WHERE id=$1 AND user_id=$2 RETURNING *', [req.params.id, uid(req)])
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.get('/snoozes/due', async (req, res, next) => {
  try { res.json((await query('SELECT * FROM crm_snoozes WHERE user_id=$1 AND resolved=false AND snooze_until <= NOW() ORDER BY snooze_until', [uid(req)])).rows) } catch (e) { next(e) }
})

// ══════════════════════════════════════════════════════════════════════════════
// CRM v6 FEATURE 17: Pipeline Velocity Rules
// ══════════════════════════════════════════════════════════════════════════════

router.get('/velocity-rules', async (req, res, next) => {
  try { res.json((await query('SELECT * FROM crm_velocity_rules WHERE user_id=$1 ORDER BY stage', [uid(req)])).rows) } catch (e) { next(e) }
})

router.post('/velocity-rules', async (req, res, next) => {
  try {
    const { stage, max_days, warning_days, action_type, action_config } = req.body
    const r = await query('INSERT INTO crm_velocity_rules (user_id,stage,max_days,warning_days,action_type,action_config) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *', [uid(req), stage, max_days||7, warning_days||5, action_type||'notify', JSON.stringify(action_config||{})])
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.put('/velocity-rules/:id', async (req, res, next) => {
  try {
    const { stage, max_days, warning_days, action_type, action_config, active } = req.body
    const r = await query('UPDATE crm_velocity_rules SET stage=$1,max_days=$2,warning_days=$3,action_type=$4,action_config=$5,active=$6 WHERE id=$7 AND user_id=$8 RETURNING *', [stage, max_days, warning_days, action_type, JSON.stringify(action_config||{}), active, req.params.id, uid(req)])
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/velocity-rules/:id', async (req, res, next) => {
  try { await query('DELETE FROM crm_velocity_rules WHERE id=$1 AND user_id=$2', [req.params.id, uid(req)]); res.json({ ok: true }) } catch (e) { next(e) }
})

router.get('/velocity/violations', async (req, res, next) => {
  try {
    const userId = uid(req)
    const rules = (await query('SELECT * FROM crm_velocity_rules WHERE user_id=$1 AND active=true', [userId])).rows
    const violations = []
    for (const rule of rules) {
      const deals = (await query(
        `SELECT * FROM crm_deals WHERE user_id=$1 AND stage=$2 AND stage_entered_at < NOW() - INTERVAL '1 day' * $3 AND stage NOT IN ('won','lost')`,
        [userId, rule.stage, rule.max_days]
      )).rows
      for (const d of deals) violations.push({ deal: d, rule, days_over: Math.round((Date.now() - new Date(d.stage_entered_at)) / 86400000 - rule.max_days) })
    }
    res.json(violations)
  } catch (e) { next(e) }
})

// ══════════════════════════════════════════════════════════════════════════════
// CRM v6 FEATURE 18: Related Deals
// ══════════════════════════════════════════════════════════════════════════════

router.get('/deals/:id/relations', async (req, res, next) => {
  try {
    const r = await query(
      `SELECT dr.*, d.company_name as related_company, d.deal_value as related_value, d.stage as related_stage
       FROM crm_deal_relations dr JOIN crm_deals d ON d.id=dr.related_deal_id WHERE dr.deal_id=$1
       UNION ALL
       SELECT dr.*, d.company_name, d.deal_value, d.stage
       FROM crm_deal_relations dr JOIN crm_deals d ON d.id=dr.deal_id WHERE dr.related_deal_id=$1`,
      [req.params.id]
    )
    res.json(r.rows)
  } catch (e) { next(e) }
})

router.post('/deal-relations', async (req, res, next) => {
  try {
    const { deal_id, related_deal_id, relation_type, notes } = req.body
    const r = await query(
      'INSERT INTO crm_deal_relations (deal_id,related_deal_id,relation_type,notes) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING RETURNING *',
      [deal_id, related_deal_id, relation_type||'related', notes||'']
    )
    res.json(r.rows[0] || { ok: true })
  } catch (e) { next(e) }
})

router.delete('/deal-relations/:id', async (req, res, next) => {
  try { await query('DELETE FROM crm_deal_relations WHERE id=$1', [req.params.id]); res.json({ ok: true }) } catch (e) { next(e) }
})

// ══════════════════════════════════════════════════════════════════════════════
// CRM v6 FEATURE 19: Configurable Notifications Engine
// ══════════════════════════════════════════════════════════════════════════════

router.get('/notification-prefs', async (req, res, next) => {
  try { res.json((await query('SELECT * FROM crm_notification_prefs WHERE user_id=$1', [uid(req)])).rows) } catch (e) { next(e) }
})

router.post('/notification-prefs', async (req, res, next) => {
  try {
    const { event_type, channel, enabled, digest_frequency, quiet_start, quiet_end } = req.body
    const r = await query(
      `INSERT INTO crm_notification_prefs (user_id,event_type,channel,enabled,digest_frequency,quiet_start,quiet_end)
       VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (user_id,event_type,channel) DO UPDATE SET enabled=$4,digest_frequency=$5,quiet_start=$6,quiet_end=$7 RETURNING *`,
      [uid(req), event_type, channel||'in_app', enabled!==false, digest_frequency||'instant', quiet_start||22, quiet_end||7]
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/notification-prefs/:id', async (req, res, next) => {
  try { await query('DELETE FROM crm_notification_prefs WHERE id=$1 AND user_id=$2', [req.params.id, uid(req)]); res.json({ ok: true }) } catch (e) { next(e) }
})

// ══════════════════════════════════════════════════════════════════════════════
// CRM v6 FEATURE 20: Stage Validation Rules
// ══════════════════════════════════════════════════════════════════════════════

router.get('/stage-validations', async (req, res, next) => {
  try { res.json((await query('SELECT * FROM crm_stage_validations WHERE user_id=$1 ORDER BY stage, field', [uid(req)])).rows) } catch (e) { next(e) }
})

router.post('/stage-validations', async (req, res, next) => {
  try {
    const { stage, field, rule_type, rule_config, blocking, message } = req.body
    const r = await query(
      'INSERT INTO crm_stage_validations (user_id,stage,field,rule_type,rule_config,blocking,message) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [uid(req), stage, field, rule_type||'required', JSON.stringify(rule_config||{}), blocking!==false, message||'']
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.put('/stage-validations/:id', async (req, res, next) => {
  try {
    const { stage, field, rule_type, rule_config, blocking, message } = req.body
    const r = await query(
      'UPDATE crm_stage_validations SET stage=$1,field=$2,rule_type=$3,rule_config=$4,blocking=$5,message=$6 WHERE id=$7 AND user_id=$8 RETURNING *',
      [stage, field, rule_type, JSON.stringify(rule_config||{}), blocking, message, req.params.id, uid(req)]
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/stage-validations/:id', async (req, res, next) => {
  try { await query('DELETE FROM crm_stage_validations WHERE id=$1 AND user_id=$2', [req.params.id, uid(req)]); res.json({ ok: true }) } catch (e) { next(e) }
})

router.post('/stage-validations/check', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { deal_id, target_stage } = req.body
    const deal = (await query('SELECT * FROM crm_deals WHERE id=$1 AND user_id=$2', [deal_id, userId])).rows[0]
    if (!deal) return res.status(404).json({ error: 'Deal not found' })
    const rules = (await query('SELECT * FROM crm_stage_validations WHERE user_id=$1 AND stage=$2', [userId, target_stage])).rows
    const errors = []
    const warnings = []
    for (const rule of rules) {
      let valid = true
      const val = deal[rule.field]
      if (rule.rule_type === 'required') valid = !!val && val !== '' && val !== '0' && val !== 0
      else if (rule.rule_type === 'min_value') valid = parseFloat(val) >= parseFloat((rule.rule_config||{}).min || 0)
      else if (rule.rule_type === 'regex') { try { valid = new RegExp((rule.rule_config||{}).pattern || '').test(String(val||'')) } catch { valid = true } }
      else if (rule.rule_type === 'not_empty') valid = !!val && String(val).trim() !== ''
      if (!valid) {
        const msg = rule.message || `${rule.field} is required for ${target_stage}`
        if (rule.blocking) errors.push(msg)
        else warnings.push(msg)
      }
    }
    res.json({ valid: errors.length === 0, errors, warnings })
  } catch (e) { next(e) }
})

// ══════════════════════════════════════════════════════════════════════════════
// GLOBAL ACTIVITIES (unified across deals, people, orgs, meetings)
// ══════════════════════════════════════════════════════════════════════════════

router.get('/activities', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { from, to, type } = req.query
    let typeFilter = ''
    const typeList = type ? type.split(',').filter(Boolean) : []

    const params = [userId]
    let dateFilter = ''
    if (from) { params.push(from); dateFilter += ` AND occurred_at >= $${params.length}` }
    if (to) { params.push(to); dateFilter += ` AND occurred_at <= $${params.length}` }

    const sql = `
      SELECT id, 'deal' as source, type, title, body, occurred_at, created_at, deal_id, NULL::int as person_id, NULL::int as org_id, false as done, NULL::date as due_date, NULL as entity_name
      FROM crm_activities WHERE deal_id IN (SELECT id FROM crm_deals WHERE user_id = $1) ${dateFilter}
      UNION ALL
      SELECT pa.id, 'person' as source, pa.type, pa.title, pa.body, pa.occurred_at, pa.created_at, NULL::int, pa.person_id, NULL::int, COALESCE(pa.done, false), pa.due_date, p.name as entity_name
      FROM crm_people_activities pa LEFT JOIN crm_people p ON p.id = pa.person_id WHERE pa.person_id IN (SELECT id FROM crm_people WHERE user_id = $1) ${dateFilter.replace(/occurred_at/g, 'pa.occurred_at')}
      UNION ALL
      SELECT oa.id, 'org' as source, oa.type, oa.title, oa.body, oa.occurred_at, oa.created_at, oa.deal_id, oa.person_id, oa.org_id, COALESCE(oa.done, false), oa.due_date, o.name as entity_name
      FROM crm_org_activities oa LEFT JOIN crm_organizations o ON o.id = oa.org_id WHERE oa.user_id = $1 ${dateFilter.replace(/occurred_at/g, 'oa.occurred_at')}
      UNION ALL
      SELECT m.id, 'meeting' as source, 'meeting' as type, m.title, m.description as body, m.start_at as occurred_at, m.created_at, m.deal_id, m.person_id, m.org_id, CASE WHEN m.status='completed' THEN true ELSE false END as done, NULL::date as due_date, NULL as entity_name
      FROM crm_meetings m WHERE m.user_id = $1 ${dateFilter.replace(/occurred_at/g, 'm.start_at')}
      ORDER BY occurred_at DESC
    `
    let rows = (await query(sql, params)).rows
    if (typeList.length > 0) rows = rows.filter(r => typeList.includes(r.type))
    res.json(rows)
  } catch (e) { next(e) }
})

router.post('/activities', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { type, title, body, occurred_at, due_date, deal_id, person_id, org_id, done } = req.body
    await query(`ALTER TABLE crm_org_activities ALTER COLUMN org_id DROP NOT NULL`).catch(() => {})
    const r = await query(
      `INSERT INTO crm_org_activities (user_id, org_id, type, title, body, occurred_at, due_date, deal_id, person_id, done)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [userId, org_id || null, type || 'task', title || '', body || '', occurred_at || new Date().toISOString(), due_date || null, deal_id || null, person_id || null, done || false]
    )
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.patch('/activities/:source/:id/done', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { source, id } = req.params
    let table, userCheck
    if (source === 'deal') { table = 'crm_activities'; userCheck = `deal_id IN (SELECT id FROM crm_deals WHERE user_id = $2)` }
    else if (source === 'person') { table = 'crm_people_activities'; userCheck = `person_id IN (SELECT id FROM crm_people WHERE user_id = $2)` }
    else if (source === 'org') { table = 'crm_org_activities'; userCheck = `user_id = $2` }
    else if (source === 'meeting') {
      const r = await query('UPDATE crm_meetings SET status = CASE WHEN status=\'completed\' THEN \'scheduled\' ELSE \'completed\' END WHERE id=$1 AND user_id=$2 RETURNING *', [id, userId])
      return res.json(r.rows[0] || {})
    }
    else return res.status(400).json({ error: 'Invalid source' })

    const r = await query(`UPDATE ${table} SET done = NOT COALESCE(done, false) WHERE id = $1 AND ${userCheck} RETURNING *`, [id, userId])
    res.json(r.rows[0] || {})
  } catch (e) { next(e) }
})

router.delete('/activities/:source/:id', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { source, id } = req.params
    let table, userCheck
    if (source === 'deal') { table = 'crm_activities'; userCheck = `deal_id IN (SELECT id FROM crm_deals WHERE user_id = $2)` }
    else if (source === 'person') { table = 'crm_people_activities'; userCheck = `person_id IN (SELECT id FROM crm_people WHERE user_id = $2)` }
    else if (source === 'org') { table = 'crm_org_activities'; userCheck = `user_id = $2` }
    else if (source === 'meeting') { table = 'crm_meetings'; userCheck = `user_id = $2` }
    else return res.status(400).json({ error: 'Invalid source' })
    await query(`DELETE FROM ${table} WHERE id = $1 AND ${userCheck}`, [id, userId])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// ── Leads ─────────────────────────────────────────────────────────────────────

router.get('/leads', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { status, source, assigned_to, converted } = req.query
    let sql = 'SELECT * FROM crm_leads WHERE user_id = $1'
    const params = [userId]
    let idx = 2
    if (status) { sql += ` AND status = $${idx++}`; params.push(status) }
    if (source) { sql += ` AND source = $${idx++}`; params.push(source) }
    if (assigned_to) { sql += ` AND assigned_to = $${idx++}`; params.push(assigned_to) }
    if (converted !== undefined) { sql += ` AND converted = $${idx++}`; params.push(converted === 'true') }
    sql += ' ORDER BY created_at DESC'
    const r = await query(sql, params)
    res.json(r.rows)
  } catch (e) { next(e) }
})

router.post('/leads', async (req, res, next) => {
  try {
    const { name, email, phone, company, title, source, status, lead_score,
            assigned_to, next_follow_up, notes, tags, linkedin_url, website, address } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Lead name is required' })
    const r = await query(
      `INSERT INTO crm_leads (user_id, name, email, phone, company, title, source, status,
       lead_score, assigned_to, next_follow_up, notes, tags, linkedin_url, website, address)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [uid(req), name.trim(), email||null, phone||null, company||null, title||null,
       source||null, status||'new', lead_score||0, assigned_to||null,
       next_follow_up||null, notes||null, tags||'', linkedin_url||null, website||null, address||null]
    )
    res.status(201).json(r.rows[0])
  } catch (e) { next(e) }
})

router.put('/leads/:id', async (req, res, next) => {
  try {
    const { name, email, phone, company, title, source, status, lead_score,
            assigned_to, last_contacted_at, next_follow_up, notes, tags, linkedin_url, website, address } = req.body
    const r = await query(
      `UPDATE crm_leads SET name=$3, email=$4, phone=$5, company=$6, title=$7, source=$8, status=$9,
       lead_score=$10, assigned_to=$11, last_contacted_at=$12, next_follow_up=$13, notes=$14,
       tags=$15, linkedin_url=$16, website=$17, address=$18, updated_at=NOW()
       WHERE id=$1 AND user_id=$2 RETURNING *`,
      [parseInt(req.params.id), uid(req), name, email||null, phone||null, company||null, title||null,
       source||null, status||'new', lead_score||0, assigned_to||null, last_contacted_at||null,
       next_follow_up||null, notes||null, tags||'', linkedin_url||null, website||null, address||null]
    )
    if (!r.rows[0]) return res.status(404).json({ error: 'Lead not found' })
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.delete('/leads/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM crm_leads WHERE id=$1 AND user_id=$2', [parseInt(req.params.id), uid(req)])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

router.patch('/leads/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body
    const r = await query(
      'UPDATE crm_leads SET status=$3, updated_at=NOW() WHERE id=$1 AND user_id=$2 RETURNING *',
      [parseInt(req.params.id), uid(req), status]
    )
    if (!r.rows[0]) return res.status(404).json({ error: 'Lead not found' })
    res.json(r.rows[0])
  } catch (e) { next(e) }
})

router.post('/leads/:id/convert', async (req, res, next) => {
  try {
    const userId = uid(req)
    const leadId = parseInt(req.params.id)
    const { pipeline_id, stage, deal_value, expected_close_date, existing_org_id } = req.body

    const leadR = await query('SELECT * FROM crm_leads WHERE id=$1 AND user_id=$2', [leadId, userId])
    if (leadR.rows.length === 0) return res.status(404).json({ error: 'Lead not found' })
    const lead = leadR.rows[0]

    const personR = await query(
      `INSERT INTO crm_people (user_id, name, email, phone, organization, role, linkedin_url, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [userId, lead.name, lead.email, lead.phone, lead.company, lead.title, lead.linkedin_url, lead.notes]
    )
    const person = personR.rows[0]

    let org = null
    if (existing_org_id) {
      const orgR = await query('SELECT * FROM crm_organizations WHERE id=$1 AND user_id=$2', [existing_org_id, userId])
      org = orgR.rows[0] || null
    }
    if (!org && lead.company?.trim()) {
      const orgR = await query(
        `INSERT INTO crm_organizations (user_id, name, website, address)
         VALUES ($1,$2,$3,$4) RETURNING *`,
        [userId, lead.company.trim(), lead.website||null, lead.address||null]
      )
      org = orgR.rows[0]
    }

    if (org) {
      await query('UPDATE crm_people SET org_id=$1, organization=$2 WHERE id=$3', [org.id, org.name, person.id])
    }

    const prob = PROB[stage] ?? 10
    const dealR = await query(
      `INSERT INTO crm_deals (user_id, company_name, contact_name, contact_email, deal_value, stage,
       probability, expected_close_date, pipeline_id, org_id, stage_entered_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW()) RETURNING *`,
      [userId, lead.company||lead.name, lead.name, lead.email,
       parseFloat(deal_value)||0, stage||'lead', prob,
       expected_close_date||null, pipeline_id||null, org?.id||null]
    )
    const deal = dealR.rows[0]

    await query('INSERT INTO crm_deal_people (deal_id, person_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [deal.id, person.id])

    await query(
      `UPDATE crm_leads SET converted=true, converted_at=NOW(), converted_person_id=$3,
       converted_org_id=$4, converted_deal_id=$5, status='converted', updated_at=NOW()
       WHERE id=$1 AND user_id=$2`,
      [leadId, userId, person.id, org?.id||null, deal.id]
    )

    res.json({ person, organization: org, deal })
  } catch (e) { next(e) }
})

router.post('/leads/import', async (req, res, next) => {
  try {
    const userId = uid(req)
    const { rows } = req.body
    if (!Array.isArray(rows)) return res.status(400).json({ error: 'rows must be an array' })
    let imported = 0
    for (const row of rows.slice(0, 500)) {
      if (!row.name?.trim()) continue
      await query(
        `INSERT INTO crm_leads (user_id, name, email, phone, company, title, source, status, lead_score, assigned_to, next_follow_up, notes, tags, linkedin_url, website, address)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [userId, row.name.trim(), row.email||null, row.phone||null, row.company||null,
         row.title||null, row.source||'import', row.status||'new',
         parseInt(row.lead_score)||0, row.assigned_to||null, row.next_follow_up||null,
         row.notes||null, row.tags||'', row.linkedin_url||null, row.website||null, row.address||null]
      )
      imported++
    }
    res.json({ imported })
  } catch (e) { next(e) }
})

router.post('/leads/bulk-delete', async (req, res, next) => {
  try {
    const { ids } = req.body
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'ids required' })
    await query('DELETE FROM crm_leads WHERE id = ANY($1) AND user_id = $2', [ids, uid(req)])
    res.json({ ok: true, deleted: ids.length })
  } catch (e) { next(e) }
})

router.post('/leads/bulk-update', async (req, res, next) => {
  try {
    const { ids, status, assigned_to } = req.body
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'ids required' })
    const sets = []
    const params = [ids, uid(req)]
    let idx = 3
    if (status) { sets.push(`status = $${idx++}`); params.push(status) }
    if (assigned_to !== undefined) { sets.push(`assigned_to = $${idx++}`); params.push(assigned_to) }
    if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' })
    sets.push('updated_at = NOW()')
    await query(`UPDATE crm_leads SET ${sets.join(', ')} WHERE id = ANY($1) AND user_id = $2`, params)
    res.json({ ok: true })
  } catch (e) { next(e) }
})

export default router
