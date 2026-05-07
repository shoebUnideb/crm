import pg from 'pg'
const { Pool } = pg

let pool = null

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set. Add it to server/.env to enable authentication.')
    }
    pool = new Pool({ connectionString: process.env.DATABASE_URL })
  }
  return pool
}

export async function query(text, params) {
  return getPool().query(text, params)
}

export async function initDb() {
  const p = getPool()
  await p.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await p.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(64) UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await p.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      state JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await p.query(`
    CREATE TABLE IF NOT EXISTS project_members (
      id SERIAL PRIMARY KEY,
      project_id VARCHAR(36) REFERENCES projects(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(20) NOT NULL DEFAULT 'edit',
      invited_by INTEGER REFERENCES users(id),
      joined_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(project_id, user_id)
    )
  `)
  await p.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT`)
  await p.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false`)
  await p.query(`
    CREATE TABLE IF NOT EXISTS project_invites (
      id SERIAL PRIMARY KEY,
      project_id VARCHAR(36) REFERENCES projects(id) ON DELETE CASCADE,
      email VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'edit',
      token VARCHAR(64) UNIQUE NOT NULL,
      invited_by INTEGER REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL,
      accepted_at TIMESTAMPTZ DEFAULT NULL
    )
  `)
  await p.query(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id SERIAL PRIMARY KEY,
      event_type VARCHAR(100) NOT NULL,
      feature_name VARCHAR(100),
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      session_id VARCHAR(64),
      is_guest BOOLEAN DEFAULT false,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at DESC)`)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_analytics_events_feature ON analytics_events(feature_name)`)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type)`)
  await p.query(`
    CREATE TABLE IF NOT EXISTS feedback (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      session_id VARCHAR(64),
      is_guest BOOLEAN DEFAULT false,
      email VARCHAR(255),
      rating INTEGER CHECK (rating >= 1 AND rating <= 5),
      message TEXT,
      category VARCHAR(50) DEFAULT 'general',
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at DESC)`)

  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_deals (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      company_name VARCHAR(255) NOT NULL,
      contact_name VARCHAR(255),
      contact_email VARCHAR(255),
      deal_value DECIMAL(12,2) DEFAULT 0,
      stage VARCHAR(50) DEFAULT 'lead',
      probability INTEGER DEFAULT 10,
      next_action TEXT,
      notes TEXT,
      last_contact_at TIMESTAMPTZ,
      expected_close_date DATE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_crm_deals_user ON crm_deals(user_id)`)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_crm_deals_stage ON crm_deals(stage)`)

  // CRM v2 columns
  await p.query(`ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS lost_reason TEXT`)
  await p.query(`ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW()`)
  await p.query(`ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS linkedin_url TEXT`)
  await p.query(`ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS follow_up_at DATE`)
  await p.query(`ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS node_id TEXT`)

  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_contacts (
      id SERIAL PRIMARY KEY,
      deal_id INTEGER NOT NULL REFERENCES crm_deals(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(100),
      role VARCHAR(100),
      linkedin_url TEXT,
      is_primary BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_crm_contacts_deal ON crm_contacts(deal_id)`)

  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_activities (
      id SERIAL PRIMARY KEY,
      deal_id INTEGER NOT NULL REFERENCES crm_deals(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL DEFAULT 'note',
      title VARCHAR(255),
      body TEXT,
      occurred_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_crm_activities_deal ON crm_activities(deal_id)`)

  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_tasks (
      id SERIAL PRIMARY KEY,
      deal_id INTEGER NOT NULL REFERENCES crm_deals(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      due_at DATE,
      done BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_crm_tasks_deal ON crm_tasks(deal_id)`)

  // CRM v3 columns
  await p.query(`ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS tags TEXT DEFAULT ''`)
  await p.query(`ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(255)`)
  await p.query(`ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS node_key VARCHAR(50)`)
  await p.query(`ALTER TABLE crm_activities ADD COLUMN IF NOT EXISTS remind_at DATE`)

  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_comments (
      id SERIAL PRIMARY KEY,
      deal_id INTEGER NOT NULL REFERENCES crm_deals(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_crm_comments_deal ON crm_comments(deal_id)`)

  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_goals (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      period_key VARCHAR(10) NOT NULL,
      target_value DECIMAL(12,2) DEFAULT 0,
      target_count INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, period_key)
    )
  `)

  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_email_templates (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      subject VARCHAR(255),
      body TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
}
