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
  await p.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT true`)
  await p.query(`
    CREATE TABLE IF NOT EXISTS email_verifications (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      otp VARCHAR(6) NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      attempts INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email)`)
  await p.query(`ALTER TABLE project_members ADD COLUMN IF NOT EXISTS scope VARCHAR(50) DEFAULT 'project'`)
  await p.query(`ALTER TABLE project_invites ADD COLUMN IF NOT EXISTS scope VARCHAR(50) DEFAULT 'project'`)
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
  await p.query(`ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS org_id INTEGER REFERENCES crm_organizations(id) ON DELETE SET NULL`)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_crm_deals_org ON crm_deals(org_id)`)

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
  await p.query(`ALTER TABLE crm_activities ADD COLUMN IF NOT EXISTS done BOOLEAN DEFAULT false`)
  await p.query(`ALTER TABLE crm_activities ADD COLUMN IF NOT EXISTS due_date DATE`)

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

  // ── Entity Links (Relationship Layer) ───────────────────────────────────────
  await p.query(`
    CREATE TABLE IF NOT EXISTS entity_links (
      id SERIAL PRIMARY KEY,
      source_type VARCHAR(50) NOT NULL,
      source_id TEXT NOT NULL,
      source_key VARCHAR(50),
      target_type VARCHAR(50) NOT NULL,
      target_id TEXT NOT NULL,
      relation VARCHAR(50) NOT NULL DEFAULT 'linked_to',
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      project_id VARCHAR(36),
      metadata JSONB DEFAULT '{}',
      deleted_at TIMESTAMPTZ DEFAULT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_entity_links_source ON entity_links(source_type, source_id) WHERE deleted_at IS NULL`)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_entity_links_target ON entity_links(target_type, target_id) WHERE deleted_at IS NULL`)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_entity_links_project ON entity_links(project_id) WHERE deleted_at IS NULL`)
  await p.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_entity_links_unique_active ON entity_links(source_type, source_id, target_type, target_id, relation) WHERE deleted_at IS NULL`)

  // Graph traversal indexes
  await p.query(`CREATE INDEX IF NOT EXISTS idx_entity_links_traverse_fwd ON entity_links(source_type, source_id, target_type, target_id) WHERE deleted_at IS NULL`)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_entity_links_traverse_rev ON entity_links(target_type, target_id, source_type, source_id) WHERE deleted_at IS NULL`)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_entity_links_relation_fwd ON entity_links(source_type, source_id, relation) WHERE deleted_at IS NULL`)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_entity_links_project_relation ON entity_links(project_id, relation) WHERE deleted_at IS NULL`)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_entity_links_project_created ON entity_links(project_id, created_at DESC) WHERE deleted_at IS NULL`)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_entity_links_metadata ON entity_links USING GIN(metadata) WHERE deleted_at IS NULL`)

  // Graph closure table (precomputed transitive closure for large projects)
  await p.query(`
    CREATE TABLE IF NOT EXISTS graph_closure (
      id SERIAL PRIMARY KEY,
      project_id VARCHAR(36) NOT NULL,
      ancestor_type VARCHAR(50) NOT NULL,
      ancestor_id TEXT NOT NULL,
      descendant_type VARCHAR(50) NOT NULL,
      descendant_id TEXT NOT NULL,
      relation VARCHAR(50) NOT NULL,
      depth INTEGER NOT NULL,
      path TEXT[] NOT NULL,
      computed_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_closure_ancestor ON graph_closure(project_id, ancestor_type, ancestor_id)`)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_closure_descendant ON graph_closure(project_id, descendant_type, descendant_id)`)

  // Backfill entity_links from existing crm_deals that have node_id
  await p.query(`
    INSERT INTO entity_links (source_type, source_id, source_key, target_type, target_id, relation, user_id)
    SELECT 'node', node_id, node_key, 'crm_deal', id::text, 'linked_to', user_id
    FROM crm_deals WHERE node_id IS NOT NULL AND node_id != ''
    ON CONFLICT DO NOTHING
  `)

  // CRM v4 — People & Organizations as first-class objects
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_people (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(100),
      organization VARCHAR(255),
      role VARCHAR(255),
      linkedin_url TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_crm_people_user ON crm_people(user_id)`)

  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_organizations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      industry VARCHAR(255),
      website TEXT,
      address TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_crm_orgs_user ON crm_organizations(user_id)`)
  await p.query(`ALTER TABLE crm_people ADD COLUMN IF NOT EXISTS org_id INTEGER REFERENCES crm_organizations(id) ON DELETE SET NULL`)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_crm_people_org ON crm_people(org_id)`)

  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_deal_people (
      id SERIAL PRIMARY KEY,
      deal_id INTEGER NOT NULL REFERENCES crm_deals(id) ON DELETE CASCADE,
      person_id INTEGER NOT NULL REFERENCES crm_people(id) ON DELETE CASCADE,
      role VARCHAR(255),
      UNIQUE(deal_id, person_id)
    )
  `)

  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_people_activities (
      id SERIAL PRIMARY KEY,
      person_id INTEGER NOT NULL REFERENCES crm_people(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL DEFAULT 'note',
      title VARCHAR(255),
      body TEXT,
      occurred_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_org_activities (
      id SERIAL PRIMARY KEY,
      org_id INTEGER NOT NULL REFERENCES crm_organizations(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL,
      type VARCHAR(50) NOT NULL DEFAULT 'note',
      title VARCHAR(255),
      body TEXT,
      occurred_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_crm_org_acts ON crm_org_activities(org_id)`)
  await p.query(`ALTER TABLE crm_org_activities ALTER COLUMN org_id DROP NOT NULL`)
  await p.query(`ALTER TABLE crm_org_activities DROP CONSTRAINT IF EXISTS crm_org_activities_org_id_fkey`)
  await p.query(`ALTER TABLE crm_org_activities ADD CONSTRAINT crm_org_activities_org_id_fkey FOREIGN KEY (org_id) REFERENCES crm_organizations(id) ON DELETE SET NULL`)
  // Cross-entity links: optional deal + person references on org activities
  await p.query(`ALTER TABLE crm_org_activities ADD COLUMN IF NOT EXISTS deal_id INTEGER REFERENCES crm_deals(id) ON DELETE SET NULL`)
  await p.query(`ALTER TABLE crm_org_activities ADD COLUMN IF NOT EXISTS person_id INTEGER REFERENCES crm_people(id) ON DELETE SET NULL`)

  await p.query(`ALTER TABLE crm_organizations ADD COLUMN IF NOT EXISTS parent_org_id INTEGER REFERENCES crm_organizations(id) ON DELETE SET NULL`)

  // Organization extended fields
  await p.query(`ALTER TABLE crm_organizations ADD COLUMN IF NOT EXISTS label VARCHAR(100)`)
  await p.query(`ALTER TABLE crm_organizations ADD COLUMN IF NOT EXISTS owner VARCHAR(255)`)
  await p.query(`ALTER TABLE crm_organizations ADD COLUMN IF NOT EXISTS visible_to VARCHAR(50) DEFAULT 'group'`)
  await p.query(`ALTER TABLE crm_organizations ADD COLUMN IF NOT EXISTS email VARCHAR(255)`)
  await p.query(`ALTER TABLE crm_organizations ADD COLUMN IF NOT EXISTS phone VARCHAR(100)`)
  await p.query(`ALTER TABLE crm_organizations ADD COLUMN IF NOT EXISTS linkedin VARCHAR(500)`)
  await p.query(`ALTER TABLE crm_organizations ADD COLUMN IF NOT EXISTS annual_revenue NUMERIC`)
  await p.query(`ALTER TABLE crm_organizations ADD COLUMN IF NOT EXISTS employees INTEGER`)
  await p.query(`ALTER TABLE crm_organizations ADD COLUMN IF NOT EXISTS street VARCHAR(500)`)
  await p.query(`ALTER TABLE crm_organizations ADD COLUMN IF NOT EXISTS city VARCHAR(255)`)
  await p.query(`ALTER TABLE crm_organizations ADD COLUMN IF NOT EXISTS state VARCHAR(255)`)
  await p.query(`ALTER TABLE crm_organizations ADD COLUMN IF NOT EXISTS zip_code VARCHAR(50)`)
  await p.query(`ALTER TABLE crm_organizations ADD COLUMN IF NOT EXISTS country VARCHAR(255)`)
  await p.query(`ALTER TABLE crm_organizations ADD COLUMN IF NOT EXISTS region VARCHAR(255)`)
  await p.query(`ALTER TABLE crm_organizations ADD COLUMN IF NOT EXISTS starred BOOLEAN DEFAULT false`)

  // Multi-value emails and phones for organizations
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_org_emails (
      id SERIAL PRIMARY KEY,
      org_id INTEGER NOT NULL REFERENCES crm_organizations(id) ON DELETE CASCADE,
      email VARCHAR(255) NOT NULL,
      type VARCHAR(50) DEFAULT 'work',
      is_primary BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_crm_org_emails_org ON crm_org_emails(org_id)`)

  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_org_phones (
      id SERIAL PRIMARY KEY,
      org_id INTEGER NOT NULL REFERENCES crm_organizations(id) ON DELETE CASCADE,
      phone VARCHAR(100) NOT NULL,
      type VARCHAR(50) DEFAULT 'work',
      is_primary BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_crm_org_phones_org ON crm_org_phones(org_id)`)

  // Migrate existing single-value emails/phones to junction tables
  await p.query(`
    INSERT INTO crm_org_emails (org_id, email, type, is_primary)
    SELECT id, email, 'work', true FROM crm_organizations
    WHERE email IS NOT NULL AND email != ''
    AND NOT EXISTS (SELECT 1 FROM crm_org_emails WHERE crm_org_emails.org_id = crm_organizations.id AND crm_org_emails.email = crm_organizations.email)
  `)
  await p.query(`
    INSERT INTO crm_org_phones (org_id, phone, type, is_primary)
    SELECT id, phone, 'work', true FROM crm_organizations
    WHERE phone IS NOT NULL AND phone != ''
    AND NOT EXISTS (SELECT 1 FROM crm_org_phones WHERE crm_org_phones.org_id = crm_organizations.id AND crm_org_phones.phone = crm_organizations.phone)
  `)

  // ── Feature additions ──────────────────────────────────────────────────────
  // Deal enhancements
  await p.query(`ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS stage_changed_at TIMESTAMPTZ DEFAULT NOW()`)
  await p.query(`ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD'`)
  await p.query(`ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS starred BOOLEAN DEFAULT false`)

  // Contact enhancements
  await p.query(`ALTER TABLE crm_people ADD COLUMN IF NOT EXISTS birthday DATE`)
  await p.query(`ALTER TABLE crm_people ADD COLUMN IF NOT EXISTS starred BOOLEAN DEFAULT false`)
  await p.query(`ALTER TABLE crm_people ADD COLUMN IF NOT EXISTS label VARCHAR(100)`)
  await p.query(`ALTER TABLE crm_people ADD COLUMN IF NOT EXISTS owner VARCHAR(255)`)
  await p.query(`ALTER TABLE crm_people ADD COLUMN IF NOT EXISTS visible_to VARCHAR(50) DEFAULT 'group'`)
  await p.query(`ALTER TABLE crm_people ADD COLUMN IF NOT EXISTS email_type VARCHAR(50) DEFAULT 'work'`)
  await p.query(`ALTER TABLE crm_people ADD COLUMN IF NOT EXISTS phone_type VARCHAR(50) DEFAULT 'work'`)

  // Activity enhancements (done + due_date on both tables)
  await p.query(`ALTER TABLE crm_people_activities ADD COLUMN IF NOT EXISTS done BOOLEAN DEFAULT false`)
  await p.query(`ALTER TABLE crm_people_activities ADD COLUMN IF NOT EXISTS due_date DATE`)
  await p.query(`ALTER TABLE crm_org_activities ADD COLUMN IF NOT EXISTS done BOOLEAN DEFAULT false`)
  await p.query(`ALTER TABLE crm_org_activities ADD COLUMN IF NOT EXISTS due_date DATE`)

  // Tags
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_tags (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      name VARCHAR(100) NOT NULL,
      color VARCHAR(20) DEFAULT '#10b981',
      UNIQUE(user_id, name)
    )
  `)
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_tag_links (
      id SERIAL PRIMARY KEY,
      tag_id INTEGER NOT NULL REFERENCES crm_tags(id) ON DELETE CASCADE,
      entity_type VARCHAR(20) NOT NULL,
      entity_id INTEGER NOT NULL,
      UNIQUE(tag_id, entity_type, entity_id)
    )
  `)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_crm_tag_links ON crm_tag_links(entity_type, entity_id)`)

  // Customizable pipeline stages
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_stages (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      label VARCHAR(100) NOT NULL,
      color VARCHAR(20) DEFAULT '#5E6C84',
      bg_color VARCHAR(20) DEFAULT '#F4F5F7',
      border_color VARCHAR(20) DEFAULT '#DFE1E6',
      probability INTEGER DEFAULT 10,
      position INTEGER DEFAULT 0,
      is_won BOOLEAN DEFAULT false,
      is_lost BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, name)
    )
  `)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_crm_stages_user ON crm_stages(user_id, position)`)

  // ── Feature 1: Email Integration ──────────────────────────────────────────
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_emails (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      deal_id INTEGER REFERENCES crm_deals(id) ON DELETE SET NULL,
      person_id INTEGER REFERENCES crm_people(id) ON DELETE SET NULL,
      direction VARCHAR(10) NOT NULL DEFAULT 'outbound',
      from_address VARCHAR(255),
      to_address VARCHAR(255),
      subject VARCHAR(500),
      body TEXT,
      status VARCHAR(20) DEFAULT 'sent',
      sent_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_crm_emails_deal ON crm_emails(deal_id)`)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_crm_emails_person ON crm_emails(person_id)`)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_crm_emails_user ON crm_emails(user_id)`)

  // ── Feature 2: Activity Timeline (unified) ────────────────────────────────
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_timeline (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      deal_id INTEGER REFERENCES crm_deals(id) ON DELETE CASCADE,
      person_id INTEGER REFERENCES crm_people(id) ON DELETE SET NULL,
      event_type VARCHAR(50) NOT NULL,
      title VARCHAR(500),
      body TEXT,
      metadata JSONB DEFAULT '{}',
      occurred_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_crm_timeline_deal ON crm_timeline(deal_id, occurred_at DESC)`)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_crm_timeline_person ON crm_timeline(person_id, occurred_at DESC)`)

  // ── Feature 3: Lead Scoring ────────────────────────────────────────────────
  await p.query(`ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0`)
  await p.query(`ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS lead_grade VARCHAR(2) DEFAULT 'D'`)
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_scoring_rules (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      field VARCHAR(100) NOT NULL,
      operator VARCHAR(20) NOT NULL,
      value TEXT NOT NULL,
      points INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_crm_scoring_rules_user ON crm_scoring_rules(user_id)`)

  // ── Feature 5: Custom Fields ───────────────────────────────────────────────
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_custom_fields (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      entity_type VARCHAR(30) NOT NULL DEFAULT 'deal',
      field_name VARCHAR(100) NOT NULL,
      field_label VARCHAR(100) NOT NULL,
      field_type VARCHAR(30) NOT NULL DEFAULT 'text',
      options JSONB DEFAULT '[]',
      required BOOLEAN DEFAULT false,
      position INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, entity_type, field_name)
    )
  `)
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_custom_field_values (
      id SERIAL PRIMARY KEY,
      field_id INTEGER NOT NULL REFERENCES crm_custom_fields(id) ON DELETE CASCADE,
      entity_type VARCHAR(30) NOT NULL,
      entity_id INTEGER NOT NULL,
      value TEXT,
      UNIQUE(field_id, entity_type, entity_id)
    )
  `)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_crm_cfv_entity ON crm_custom_field_values(entity_type, entity_id)`)

  // ── Feature 7: Deal Templates ──────────────────────────────────────────────
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_deal_templates (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      default_stage VARCHAR(100),
      default_value DECIMAL(12,2) DEFAULT 0,
      default_tasks JSONB DEFAULT '[]',
      default_fields JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  // ── Feature 8: Automation Rules ────────────────────────────────────────────
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_automations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      trigger_type VARCHAR(50) NOT NULL,
      trigger_config JSONB DEFAULT '{}',
      action_type VARCHAR(50) NOT NULL,
      action_config JSONB DEFAULT '{}',
      active BOOLEAN DEFAULT true,
      run_count INTEGER DEFAULT 0,
      last_run_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  // ── Feature 11: Call Logging ───────────────────────────────────────────────
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_calls (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      deal_id INTEGER REFERENCES crm_deals(id) ON DELETE SET NULL,
      person_id INTEGER REFERENCES crm_people(id) ON DELETE SET NULL,
      direction VARCHAR(10) DEFAULT 'outbound',
      outcome VARCHAR(30) DEFAULT 'connected',
      duration_seconds INTEGER DEFAULT 0,
      notes TEXT,
      called_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_crm_calls_deal ON crm_calls(deal_id)`)

  // ── Feature 12: Document Attachments ───────────────────────────────────────
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_documents (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      deal_id INTEGER REFERENCES crm_deals(id) ON DELETE SET NULL,
      person_id INTEGER REFERENCES crm_people(id) ON DELETE SET NULL,
      file_name VARCHAR(500) NOT NULL,
      file_size INTEGER DEFAULT 0,
      mime_type VARCHAR(100),
      file_data TEXT,
      version INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_crm_docs_deal ON crm_documents(deal_id)`)

  // ── Feature 13: Meeting Scheduler ──────────────────────────────────────────
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_meetings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      deal_id INTEGER REFERENCES crm_deals(id) ON DELETE SET NULL,
      person_id INTEGER REFERENCES crm_people(id) ON DELETE SET NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      start_at TIMESTAMPTZ NOT NULL,
      end_at TIMESTAMPTZ NOT NULL,
      location VARCHAR(500),
      status VARCHAR(20) DEFAULT 'scheduled',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_crm_meetings_user ON crm_meetings(user_id, start_at)`)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_crm_meetings_deal ON crm_meetings(deal_id)`)
  await p.query(`ALTER TABLE crm_meetings ADD COLUMN IF NOT EXISTS org_id INTEGER REFERENCES crm_organizations(id) ON DELETE SET NULL`)
  await p.query(`ALTER TABLE crm_meetings ADD COLUMN IF NOT EXISTS notes TEXT`)
  await p.query(`ALTER TABLE crm_meetings ADD COLUMN IF NOT EXISTS linked_entities TEXT DEFAULT '[]'`)

  // ── Feature 14: Product Catalog & Line Items ───────────────────────────────
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_products (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(12,2) DEFAULT 0,
      currency VARCHAR(10) DEFAULT 'USD',
      sku VARCHAR(100),
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_line_items (
      id SERIAL PRIMARY KEY,
      deal_id INTEGER NOT NULL REFERENCES crm_deals(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES crm_products(id) ON DELETE SET NULL,
      name VARCHAR(255) NOT NULL,
      quantity INTEGER DEFAULT 1,
      unit_price DECIMAL(12,2) DEFAULT 0,
      discount_pct DECIMAL(5,2) DEFAULT 0,
      total DECIMAL(12,2) DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_crm_line_items_deal ON crm_line_items(deal_id)`)

  // ── Feature 15: Win/Loss Analysis ──────────────────────────────────────────
  await p.query(`ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS loss_category VARCHAR(100)`)
  await p.query(`ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS competitor VARCHAR(255)`)
  await p.query(`ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS win_factors JSONB DEFAULT '[]'`)

  // ── Feature 17: Activity Sequences ─────────────────────────────────────────
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_sequences (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      steps JSONB DEFAULT '[]',
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_sequence_enrollments (
      id SERIAL PRIMARY KEY,
      sequence_id INTEGER NOT NULL REFERENCES crm_sequences(id) ON DELETE CASCADE,
      deal_id INTEGER REFERENCES crm_deals(id) ON DELETE SET NULL,
      person_id INTEGER REFERENCES crm_people(id) ON DELETE SET NULL,
      current_step INTEGER DEFAULT 0,
      status VARCHAR(20) DEFAULT 'active',
      next_action_at TIMESTAMPTZ,
      started_at TIMESTAMPTZ DEFAULT NOW(),
      completed_at TIMESTAMPTZ
    )
  `)

  // ── Feature 18: Dashboard Widgets ──────────────────────────────────────────
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_dashboard_layouts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(100) DEFAULT 'Default',
      widgets JSONB DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  // ── Feature 19: Audit Log ──────────────────────────────────────────────────
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_audit_log (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      entity_type VARCHAR(30) NOT NULL,
      entity_id INTEGER NOT NULL,
      action VARCHAR(30) NOT NULL,
      changes JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_crm_audit_entity ON crm_audit_log(entity_type, entity_id)`)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_crm_audit_user ON crm_audit_log(user_id, created_at DESC)`)

  // ── Feature 20: API & Webhooks ─────────────────────────────────────────────
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_webhooks (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      events TEXT[] NOT NULL DEFAULT '{}',
      secret VARCHAR(255),
      active BOOLEAN DEFAULT true,
      last_triggered_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_api_keys (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      key_hash VARCHAR(255) NOT NULL,
      name VARCHAR(100) NOT NULL,
      last_used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  // ══════════════════════════════════════════════════════════════════════════
  // CRM v6 — 20 Advanced Features
  // ══════════════════════════════════════════════════════════════════════════

  // F1: Smart Views
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_smart_views (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      filters JSONB DEFAULT '{}',
      columns JSONB DEFAULT '[]',
      sort_field VARCHAR(100) DEFAULT 'created_at',
      sort_dir VARCHAR(4) DEFAULT 'desc',
      group_by VARCHAR(100),
      is_default BOOLEAN DEFAULT false,
      shared BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  // F2: Deal Approval Workflows
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_approval_rules (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      trigger_stage VARCHAR(100),
      min_value DECIMAL(12,2) DEFAULT 0,
      approver_email VARCHAR(255),
      escalation_hours INTEGER DEFAULT 24,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_approvals (
      id SERIAL PRIMARY KEY,
      rule_id INTEGER REFERENCES crm_approval_rules(id) ON DELETE SET NULL,
      deal_id INTEGER NOT NULL REFERENCES crm_deals(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(20) DEFAULT 'pending',
      requested_at TIMESTAMPTZ DEFAULT NOW(),
      resolved_at TIMESTAMPTZ,
      resolved_by VARCHAR(255),
      rejection_reason TEXT
    )
  `)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_crm_approvals_deal ON crm_approvals(deal_id)`)

  // F3: Email Sequences with Conditions
  await p.query(`ALTER TABLE crm_sequences ADD COLUMN IF NOT EXISTS sequence_type VARCHAR(30) DEFAULT 'basic'`)
  await p.query(`ALTER TABLE crm_sequence_enrollments ADD COLUMN IF NOT EXISTS pause_reason VARCHAR(100)`)
  await p.query(`ALTER TABLE crm_sequence_enrollments ADD COLUMN IF NOT EXISTS last_step_at TIMESTAMPTZ`)

  // F4: Multiple Pipelines
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_pipelines (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      is_default BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await p.query(`ALTER TABLE crm_stages ADD COLUMN IF NOT EXISTS pipeline_id INTEGER REFERENCES crm_pipelines(id) ON DELETE SET NULL`)
  await p.query(`ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS pipeline_id INTEGER REFERENCES crm_pipelines(id) ON DELETE SET NULL`)
  // Change FK to CASCADE so deleting a pipeline also removes its stages/deals
  await p.query(`ALTER TABLE crm_stages DROP CONSTRAINT IF EXISTS crm_stages_pipeline_id_fkey`)
  await p.query(`DO $$ BEGIN ALTER TABLE crm_stages ADD CONSTRAINT crm_stages_pipeline_id_fkey FOREIGN KEY (pipeline_id) REFERENCES crm_pipelines(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
  await p.query(`ALTER TABLE crm_deals DROP CONSTRAINT IF EXISTS crm_deals_pipeline_id_fkey`)
  await p.query(`DO $$ BEGIN ALTER TABLE crm_deals ADD CONSTRAINT crm_deals_pipeline_id_fkey FOREIGN KEY (pipeline_id) REFERENCES crm_pipelines(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
  // Allow same stage name across different pipelines
  await p.query(`ALTER TABLE crm_stages DROP CONSTRAINT IF EXISTS crm_stages_user_id_name_key`)
  await p.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crm_stages_user_pipeline_name_key') THEN ALTER TABLE crm_stages ADD CONSTRAINT crm_stages_user_pipeline_name_key UNIQUE(user_id, pipeline_id, name); END IF; END $$`)
  // Cleanup orphaned stages/deals from old ON DELETE SET NULL behavior
  await p.query(`DELETE FROM crm_stages WHERE pipeline_id IS NULL AND name IN ('discovery','champion','technical-eval','security-review','business-case','procurement','legal','walk-in','follow-up','quote','negotiation','sold','inquiry','outreach','response','meeting','proposal_sent','verbal-yes','contract','kickoff','health-check','renewal-sent','expanded','at-risk','intervention','retained','churned','sourced','screening','phone-screen','onsite','offer','hired','rejected','research','loi','due-diligence','term-sheet','funded','declined','identified','contacted','interested','pitch','committed','passed','application','review','submitted','interview','awarded','sdr-qualified','demo_scheduled','champion-id','eval','poc','verbal-commit','closed-won','closed-lost','prospecting','connected','needs-analysis','value-prop','decision-maker','perception','partnership-close','new-lead','engaged','qualified','demo','trial','won','lost')`)
  await p.query(`DELETE FROM crm_deals WHERE pipeline_id IS NULL AND company_name IN ('TechStart Inc','CloudSync Labs','DataFlow Corp','ScaleUp HQ','Martinez Wedding','Johnson Family','Park Ave Dental','Global Financial Corp','MegaRetail Inc','Unified Health Systems','Acme Corp','Widget Co','InnoTech','FreshStart App','GreenLeaf Co','Stellar Media','CloudFirst','BrightPath','LogiFlow','DataNest','UrbanFit','PeakView Capital','Horizon Fund','BlueChip Angels','SeedStar','QuickGrant Foundation','CityBridge Initiative','LendFlex','CapitalOne SMB','TechRecruit Pro','DevHire','CorpStaff','InternLink','FastTrack Interns','PayConnect','APIHub','DataSync Pro','MarketBuzz','InfluencerNet','OnboardCo','NewClient Corp','StreamLine SaaS','ChurnRisk Corp','HighTouch Ent','Sunset Towers','Lakeside Villa','Metro Contractors','FreelancerX','Creative Co','DesignStudio','TechConf 2024','Product Summit','LaunchPad 2024','Smith & Associates','Legal Eagles','CityLaw Group','AccelCo','RocketStart','GrowthLab','ContentCo','MediaFlow','BlogNetwork')`)


  // F5: Territory & Lead Routing
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_territories (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      rules JSONB DEFAULT '{}',
      assigned_to VARCHAR(255),
      capacity INTEGER DEFAULT 100,
      current_load INTEGER DEFAULT 0,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_routing_rules (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      conditions JSONB DEFAULT '{}',
      action_type VARCHAR(30) DEFAULT 'assign',
      action_config JSONB DEFAULT '{}',
      priority INTEGER DEFAULT 0,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  // F6: SLA & Response Time Tracking
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_sla_policies (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      stage VARCHAR(100),
      max_hours INTEGER DEFAULT 24,
      warning_hours INTEGER DEFAULT 12,
      escalation_to VARCHAR(255),
      business_hours JSONB DEFAULT '{"start":9,"end":17,"days":[1,2,3,4,5]}',
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await p.query(`ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMPTZ`)
  await p.query(`ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS sla_breach BOOLEAN DEFAULT false`)

  // F7: Quote Builder
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_quotes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      deal_id INTEGER REFERENCES crm_deals(id) ON DELETE SET NULL,
      quote_number VARCHAR(50),
      status VARCHAR(20) DEFAULT 'draft',
      valid_until DATE,
      subtotal DECIMAL(12,2) DEFAULT 0,
      tax_rate DECIMAL(5,2) DEFAULT 0,
      tax_amount DECIMAL(12,2) DEFAULT 0,
      discount_amount DECIMAL(12,2) DEFAULT 0,
      total DECIMAL(12,2) DEFAULT 0,
      terms TEXT,
      notes TEXT,
      template_config JSONB DEFAULT '{}',
      line_items JSONB DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      sent_at TIMESTAMPTZ
    )
  `)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_crm_quotes_deal ON crm_quotes(deal_id)`)

  // F8: Deal Scoring
  await p.query(`ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS deal_score INTEGER DEFAULT 0`)
  await p.query(`ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS deal_health VARCHAR(20) DEFAULT 'neutral'`)
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_deal_scoring_rules (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      signal VARCHAR(100) NOT NULL,
      weight INTEGER DEFAULT 10,
      decay_days INTEGER DEFAULT 30,
      description TEXT,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  // F9: Contact Roles & Buying Committee
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_contact_roles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      influence_weight INTEGER DEFAULT 5,
      color VARCHAR(20) DEFAULT '#5E6C84',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, name)
    )
  `)
  await p.query(`ALTER TABLE crm_deal_people ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES crm_contact_roles(id) ON DELETE SET NULL`)
  await p.query(`ALTER TABLE crm_deal_people ADD COLUMN IF NOT EXISTS influence VARCHAR(20) DEFAULT 'medium'`)

  // F10: Recurring Revenue & Renewal Tracking
  await p.query(`ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false`)
  await p.query(`ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS mrr_value DECIMAL(12,2) DEFAULT 0`)
  await p.query(`ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS contract_start DATE`)
  await p.query(`ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS contract_end DATE`)
  await p.query(`ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS renewal_status VARCHAR(30) DEFAULT 'active'`)
  await p.query(`ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS parent_deal_id INTEGER REFERENCES crm_deals(id) ON DELETE SET NULL`)

  // F11: Form Builder
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_forms (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      fields JSONB DEFAULT '[]',
      settings JSONB DEFAULT '{}',
      pipeline_id INTEGER REFERENCES crm_pipelines(id) ON DELETE SET NULL,
      default_stage VARCHAR(100) DEFAULT 'lead',
      assigned_to VARCHAR(255),
      active BOOLEAN DEFAULT true,
      submissions_count INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_form_submissions (
      id SERIAL PRIMARY KEY,
      form_id INTEGER NOT NULL REFERENCES crm_forms(id) ON DELETE CASCADE,
      data JSONB DEFAULT '{}',
      deal_id INTEGER REFERENCES crm_deals(id) ON DELETE SET NULL,
      ip_address VARCHAR(50),
      submitted_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  // F12: Activity Cadence Templates
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_cadences (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      steps JSONB DEFAULT '[]',
      settings JSONB DEFAULT '{"skip_weekends":true,"exit_on_reply":true}',
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_cadence_enrollments (
      id SERIAL PRIMARY KEY,
      cadence_id INTEGER NOT NULL REFERENCES crm_cadences(id) ON DELETE CASCADE,
      deal_id INTEGER REFERENCES crm_deals(id) ON DELETE SET NULL,
      person_id INTEGER REFERENCES crm_people(id) ON DELETE SET NULL,
      current_step INTEGER DEFAULT 0,
      status VARCHAR(20) DEFAULT 'active',
      next_action_at TIMESTAMPTZ,
      paused_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      started_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  // F13: Deal Splitting & Multi-Currency
  await p.query(`ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS split_from_id INTEGER REFERENCES crm_deals(id) ON DELETE SET NULL`)
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_exchange_rates (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      from_currency VARCHAR(10) NOT NULL,
      to_currency VARCHAR(10) NOT NULL,
      rate DECIMAL(12,6) NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, from_currency, to_currency)
    )
  `)

  // F14: Conditional Field Visibility
  await p.query(`ALTER TABLE crm_custom_fields ADD COLUMN IF NOT EXISTS visibility_rules JSONB DEFAULT '[]'`)
  await p.query(`ALTER TABLE crm_custom_fields ADD COLUMN IF NOT EXISTS required_at_stages JSONB DEFAULT '[]'`)
  await p.query(`ALTER TABLE crm_custom_fields ADD COLUMN IF NOT EXISTS field_group VARCHAR(100)`)

  // F15: Goal Cascading & Quotas
  await p.query(`ALTER TABLE crm_goals ADD COLUMN IF NOT EXISTS goal_type VARCHAR(30) DEFAULT 'revenue'`)
  await p.query(`ALTER TABLE crm_goals ADD COLUMN IF NOT EXISTS team VARCHAR(100)`)
  await p.query(`ALTER TABLE crm_goals ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(255)`)
  await p.query(`ALTER TABLE crm_goals ADD COLUMN IF NOT EXISTS parent_goal_id INTEGER REFERENCES crm_goals(id) ON DELETE SET NULL`)
  await p.query(`ALTER TABLE crm_goals ADD COLUMN IF NOT EXISTS cascade_pct DECIMAL(5,2) DEFAULT 100`)

  // F16: Snooze & Remind Later
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_snoozes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      entity_type VARCHAR(30) NOT NULL,
      entity_id INTEGER NOT NULL,
      snooze_until TIMESTAMPTZ NOT NULL,
      reason VARCHAR(255),
      snoozed_at TIMESTAMPTZ DEFAULT NOW(),
      resolved BOOLEAN DEFAULT false
    )
  `)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_crm_snoozes_user ON crm_snoozes(user_id, resolved, snooze_until)`)

  // F17: Pipeline Velocity Rules
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_velocity_rules (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      stage VARCHAR(100) NOT NULL,
      max_days INTEGER NOT NULL DEFAULT 7,
      warning_days INTEGER DEFAULT 5,
      action_type VARCHAR(30) DEFAULT 'notify',
      action_config JSONB DEFAULT '{}',
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  // F18: Related Deals
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_deal_relations (
      id SERIAL PRIMARY KEY,
      deal_id INTEGER NOT NULL REFERENCES crm_deals(id) ON DELETE CASCADE,
      related_deal_id INTEGER NOT NULL REFERENCES crm_deals(id) ON DELETE CASCADE,
      relation_type VARCHAR(50) NOT NULL DEFAULT 'related',
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(deal_id, related_deal_id, relation_type)
    )
  `)

  // F19: Configurable Notifications Engine
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_notification_prefs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      event_type VARCHAR(50) NOT NULL,
      channel VARCHAR(20) DEFAULT 'in_app',
      enabled BOOLEAN DEFAULT true,
      digest_frequency VARCHAR(20) DEFAULT 'instant',
      quiet_start INTEGER DEFAULT 22,
      quiet_end INTEGER DEFAULT 7,
      UNIQUE(user_id, event_type, channel)
    )
  `)

  // F20: Stage Validation Rules
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_stage_validations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      stage VARCHAR(100) NOT NULL,
      field VARCHAR(100) NOT NULL,
      rule_type VARCHAR(30) DEFAULT 'required',
      rule_config JSONB DEFAULT '{}',
      blocking BOOLEAN DEFAULT true,
      message VARCHAR(500),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_crm_stage_validations ON crm_stage_validations(user_id, stage)`)

  // Leads (separate entity)
  await p.query(`
    CREATE TABLE IF NOT EXISTS crm_leads (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(100),
      company VARCHAR(255),
      title VARCHAR(255),
      source VARCHAR(100),
      status VARCHAR(50) DEFAULT 'new',
      lead_score INTEGER DEFAULT 0,
      assigned_to VARCHAR(255),
      last_contacted_at TIMESTAMPTZ,
      next_follow_up DATE,
      notes TEXT,
      tags TEXT DEFAULT '',
      linkedin_url TEXT,
      website TEXT,
      address TEXT,
      converted BOOLEAN DEFAULT false,
      converted_at TIMESTAMPTZ,
      converted_person_id INTEGER REFERENCES crm_people(id) ON DELETE SET NULL,
      converted_org_id INTEGER REFERENCES crm_organizations(id) ON DELETE SET NULL,
      converted_deal_id INTEGER REFERENCES crm_deals(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_crm_leads_user ON crm_leads(user_id)`)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON crm_leads(status)`)

  // ══════════════════════════════════════════════════════════════════════════
  // Docs Product — Spaces, Pages, Permissions, Versions, Comments
  // ══════════════════════════════════════════════════════════════════════════

  await p.query(`
    CREATE TABLE IF NOT EXISTS doc_spaces (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(100) UNIQUE NOT NULL,
      description TEXT,
      icon VARCHAR(10) DEFAULT '📄',
      owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_doc_spaces_owner ON doc_spaces(owner_id)`)

  await p.query(`
    CREATE TABLE IF NOT EXISTS doc_space_members (
      id SERIAL PRIMARY KEY,
      space_id INTEGER NOT NULL REFERENCES doc_spaces(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(20) NOT NULL DEFAULT 'edit',
      invited_by INTEGER REFERENCES users(id),
      joined_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(space_id, user_id)
    )
  `)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_doc_space_members_user ON doc_space_members(user_id)`)
  await p.query(`ALTER TABLE doc_space_members ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active'`)
  await p.query(`ALTER TABLE doc_space_members ADD COLUMN IF NOT EXISTS space_name_cache VARCHAR(255)`)

  await p.query(`
    CREATE TABLE IF NOT EXISTS doc_space_invites (
      id SERIAL PRIMARY KEY,
      space_id INTEGER NOT NULL REFERENCES doc_spaces(id) ON DELETE CASCADE,
      email VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'edit',
      token VARCHAR(64) UNIQUE NOT NULL,
      invited_by INTEGER NOT NULL REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL,
      accepted_at TIMESTAMPTZ DEFAULT NULL
    )
  `)

  await p.query(`
    CREATE TABLE IF NOT EXISTS doc_pages (
      id SERIAL PRIMARY KEY,
      space_id INTEGER NOT NULL REFERENCES doc_spaces(id) ON DELETE CASCADE,
      parent_id INTEGER REFERENCES doc_pages(id) ON DELETE CASCADE,
      title VARCHAR(500) NOT NULL DEFAULT 'Untitled',
      content JSONB NOT NULL DEFAULT '{}',
      status VARCHAR(20) NOT NULL DEFAULT 'draft',
      position INTEGER NOT NULL DEFAULT 0,
      created_by INTEGER NOT NULL REFERENCES users(id),
      last_edited_by INTEGER REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      deleted_at TIMESTAMPTZ DEFAULT NULL
    )
  `)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_doc_pages_space ON doc_pages(space_id) WHERE deleted_at IS NULL`)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_doc_pages_parent ON doc_pages(parent_id) WHERE deleted_at IS NULL`)
  await p.query(`ALTER TABLE doc_pages ADD COLUMN IF NOT EXISTS nav_title VARCHAR(500) DEFAULT NULL`)
  await p.query(`UPDATE doc_pages SET nav_title = title WHERE nav_title IS NULL`)

  await p.query(`
    CREATE TABLE IF NOT EXISTS doc_page_restrictions (
      id SERIAL PRIMARY KEY,
      page_id INTEGER NOT NULL REFERENCES doc_pages(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(20) NOT NULL,
      created_by INTEGER NOT NULL REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(page_id, user_id)
    )
  `)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_doc_page_restrictions_page ON doc_page_restrictions(page_id)`)

  await p.query(`
    CREATE TABLE IF NOT EXISTS doc_page_versions (
      id SERIAL PRIMARY KEY,
      page_id INTEGER NOT NULL REFERENCES doc_pages(id) ON DELETE CASCADE,
      title VARCHAR(500) NOT NULL,
      content JSONB NOT NULL,
      edited_by INTEGER NOT NULL REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_doc_page_versions_page ON doc_page_versions(page_id)`)

  await p.query(`
    CREATE TABLE IF NOT EXISTS doc_comments (
      id SERIAL PRIMARY KEY,
      page_id INTEGER NOT NULL REFERENCES doc_pages(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      resolved BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_doc_comments_page ON doc_comments(page_id)`)

  await p.query(`
    CREATE TABLE IF NOT EXISTS doc_page_stars (
      page_id INTEGER NOT NULL REFERENCES doc_pages(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY(page_id, user_id)
    )
  `)
  await p.query(`CREATE INDEX IF NOT EXISTS idx_doc_page_stars_user ON doc_page_stars(user_id)`)
}
