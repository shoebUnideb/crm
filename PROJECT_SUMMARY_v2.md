# Architecture Report: chart_to_jira

## Context
This is a comprehensive architecture analysis of the chart_to_jira project — a multi-product SaaS platform consisting of three main products: (1) a collaborative mind-map / canvas tool with Jira integration, (2) a full CRM module, and (3) a wiki/documentation module. The goal is to give an AI a full picture of the codebase including dead code, complexity hotspots, and unnecessary duplication.

---

## 1. PROJECT OVERVIEW

| Metric | Value |
|--------|-------|
| Total size | 119 MB |
| Client source files | 163 JSX/JS files |
| Client LOC | ~57,744 |
| Server routes | 9 files, 5,114 lines |
| Server services | 7 files, 2,134 lines |
| Database tables | 100+ |
| API endpoints | 100+ |
| WebSocket messages | 8+ types |
| Git branch | arch_change |
| Build tool | Vite 5.4 (React 18.3) |
| Backend | Node.js + Express + PostgreSQL |
| Styling | Tailwind CSS 3.4 |

**Three Product Areas:**
- `/app/canvas` → Canvas/MindMap (TreeApp.jsx, Canvas.jsx, useProjects.js)
- `/app/crm/*` → CRM (CRMPage.jsx, components/crm/*)
- `/app/docs/*` → Wiki/Docs (DocsPage.jsx, components/docs/*)

---

## 2. TECH STACK

### Frontend
- React 18.3.1 (no TypeScript)
- React Router 6.28.0
- No Redux/Zustand — uses `useReducer` + React Context
- Tiptap 3.23.1 (rich text editor for Docs module)
- Tailwind CSS 3.4.17
- Vite 5.4.11
- ~17 runtime npm dependencies (lightweight)

### Backend
- Node.js + Express 4.21.2
- PostgreSQL (via `pg` 8.13)
- JWT auth (`jsonwebtoken` 9.0.2) — 7-day expiry
- Bcrypt password hashing (12 rounds)
- WebSocket (`ws` 8.20) for real-time collaboration
- Nodemailer for email invites
- No ORM — raw SQL queries

---

## 3. FILE STRUCTURE

```
chart_to_jira/
├── client/
│   ├── src/
│   │   ├── App.jsx                       (131 lines) — Router + public routes
│   │   ├── TreeApp.jsx                   (787 lines) — Canvas app container
│   │   ├── main.jsx                      (26 lines)  — Entry point
│   │   ├── components/
│   │   │   ├── canvas/                   (38 files, 13,104 lines)
│   │   │   ├── crm/                      (23 files, 10,646 lines)
│   │   │   ├── docs/                     (15 files,  4,410 lines)
│   │   │   ├── sidebar/                  (3 files,   1,168 lines)
│   │   │   ├── projects/                 (2 files,     855 lines)
│   │   │   ├── shared/                   (5 files,     611 lines)
│   │   │   ├── landing/                  (2 files,     557 lines)
│   │   │   ├── chatbot/                  (2 files,     357 lines)
│   │   │   ├── auth/                     (1 file,      451 lines)
│   │   │   ├── collaboration/            (1 file,      407 lines)
│   │   │   ├── feedback/                 (1 file,      280 lines)
│   │   │   └── notifications/            (1 file,      253 lines)
│   │   ├── pages/                        (27 pages)
│   │   ├── hooks/                        (10 hooks)
│   │   ├── store/
│   │   │   ├── treeReducer.js            (623 lines)
│   │   │   └── treeActions.js            (41 lines)
│   │   ├── lib/                          (12+ utilities)
│   │   ├── context/                      (2 contexts)
│   │   └── shells/                       (3 lazy-loaded shells)
├── server/
│   ├── index.js                          (60 lines) — Express + WS setup
│   └── src/
│       ├── routes/
│       │   ├── auth.js                   (96 lines)
│       │   ├── admin.js                  (206 lines)
│       │   ├── analytics.js              (50 lines)
│       │   ├── invites.js                (61 lines)
│       │   ├── jira.js                   (62 lines)
│       │   ├── projects.js               (185 lines)
│       │   ├── graph.js                  (170 lines)
│       │   ├── links.js                  (110 lines)
│       │   ├── docs.js                   (453 lines)
│       │   └── crm.js                    (3,704 lines) ← LARGEST FILE
│       ├── services/
│       │   ├── authService.js            (76 lines)
│       │   ├── emailService.js           (71 lines)
│       │   ├── graphCache.js             (40 lines)
│       │   ├── graphService.js           (607 lines)
│       │   ├── jiraService.js            (178 lines)
│       │   ├── projectsService.js        (278 lines)
│       │   ├── docsService.js            (526 lines)
│       │   └── graphSync.js              (103 lines)
│       ├── middleware/
│       │   ├── authenticate.js           (15 lines)
│       │   ├── adminOnly.js              (9 lines)
│       │   └── errorHandler.js           (4 lines)
│       └── websocket/
│           └── collabServer.js           (287 lines)
│   └── db/
│       └── index.js                      (1,248 lines) — Schema + migrations
├── PROJECT_SUMMARY.md                    (35KB)
├── GRAPH_ENGINE_ARCHITECTURE.md          (41KB)
├── GRAPH_UX_ARCHITECTURE.md             (44KB)
└── HOW_TO_USE.txt                       (66KB)
```

---

## 4. ROUTING STRUCTURE (client/src/App.jsx)

```
Public Routes (no auth):
  /                        → LandingPage
  /features                → FeaturesPage
  /about                   → AboutPage
  /templates               → TemplatesPage
  /changelog               → ChangelogPage
  /blog                    → BlogPage
  /careers                 → CareersPage
  /privacy, /terms, /cookies, /roadmap, /community → Static pages

Auth Flow:
  /login, /register, /forgot-password  → AuthModal overlay on landing
  /reset-password                       → Full page
  /invite/:token                        → InviteAcceptPage

Protected Product Routes (lazy + shell):
  /app/canvas              → CanvasShell → TreeApp
  /app/crm/*               → CRMShell → CRMPage
  /app/docs/*              → DocsShell → DocsPage / DocsWorkspace
  /app/settings            → SettingsPage
  /app/admin               → AdminPage

Legacy Redirects:
  /canvas  → /app/canvas
  /crm/*   → /app/crm/*
```

---

## 5. STATE MANAGEMENT

### Dual State Architecture
1. **Canvas state** — `useReducer(treeReducer)` inside `useProjects` hook
2. **App state** — React Context (AuthContext, AuthModalContext)

### treeReducer.js (41 action types)
```
Node ops:    ADD_CHILD, DELETE_NODE, EDIT_NODE, SELECT_NODE, DESELECT, MOVE_NODE, REPARENT_NODE
Styling:     UPDATE_NODE_COLOR, SET_SHAPE, AUTO_COLOR, TOGGLE_LOCK, TOGGLE_REACTION
Graph:       ADD_EDGE, DELETE_EDGE, SET_EDGE_TYPE, SET_EDGE_LABEL
Bulk:        DUPLICATE_NODE, MERGE_NODE, SPLIT_NODE, PASTE_SUBTREE, BULK_DELETE
Metadata:    EDIT_NODE_NOTES, SET_NODE_META, SET_NODE_URL, SET_NODE_CHECKLIST,
             UPDATE_METADATA, ADD_NODE_COMMENT, DELETE_NODE_COMMENT
Layout:      APPLY_LAYOUT, APPLY_RADIAL_LAYOUT, COLLAPSE_ALL, EXPAND_ALL, COLLAPSE_TO_DEPTH
Integration: APPLY_JIRA_KEYS, ADD_AUDIT_ENTRY
Groups:      ADD_GROUP, DELETE_GROUP, RENAME_GROUP, SET_CUSTOM_FIELDS
Collapse:    TOGGLE_COLLAPSE
```

### State Shape (tree)
```javascript
{
  nodes: { [nodeId]: {
    id, title, parentId, childIds, depth, color, collapsed,
    x, y, shape, status, assignee, priority, tags, comments,
    notes, url, checklist, metadata, jiraKey, ...
  }},
  rootId: 'root',
  selectedNodeId: null,
  extraEdges: [{ id, from, to, type?, label? }],
  groups: [{ id, label, nodeIds, color }],
  customStatuses: [],
  customFields: [],
  frames: []
}
```

### Data Persistence (3 layers)
1. **localStorage** — fast, offline-first, per user per project key
2. **Server REST API** — `/api/projects/:id` saves full state as JSONB
3. **Real-time WebSocket** — broadcasts actions to collaborators

---

## 6. SERVER ARCHITECTURE

### API Endpoints Summary

| Route File | LOC | Endpoint Count | Notable |
|-----------|-----|---------------|---------|
| crm.js | 3,704 | ~100+ | Deals, People, Orgs, Leads, Activities, Tasks, Tags, Custom Fields, Pipelines, Stages, Approvals, Templates, Automations, Goals, Quotas |
| docs.js | 453 | ~35 | Spaces, Pages (hierarchy), Versions, Restrictions, Comments, Stars |
| admin.js | 206 | 7 | Platform stats, users, feedback, activity log |
| projects.js | 185 | 14 | Projects, Members, Invites, RBAC |
| graph.js | 170 | 12 | Traversal, Impact, Paths, Overlay, Aggregate, Summarize, Health |
| links.js | 110 | 7 | CRUD on entity_links |
| auth.js | 96 | 7 | Register, Login, Me, Password reset, Avatar |
| jira.js | 62 | 4 | Issue types, Sprints, JQL search, Create tickets |
| analytics.js | 50 | 2 | Event tracking, Feedback |
| invites.js | 61 | 4 | Accept, Decline, View invites |

### Middleware
- `authenticate.js` — JWT Bearer token validation → `req.user = {userId, email}`
- `adminOnly.js` — checks `users.is_admin` flag, requires `authenticate` first
- `errorHandler.js` — global error handler (4 lines, minimal)

### WebSocket (collabServer.js — 287 lines)
- Per-project rooms: `Map<projectId, Map<userId, {ws, email, role, cursor, color}>>`
- State cache: `Map<projectId, fullProjectState>` (avoids DB reads on join)
- User sockets: `Map<userId, Set<ws>>` for push notifications
- Message types: `auth`, `join`, `leave`, `action`, `state`, `users`, `action_applied`, `user_joined`, `user_left`, `error`
- User color: `colors[userId % colors.length]` (consistent per user)
- Auto-reconnect: clients retry every 3s

---

## 7. DATABASE SCHEMA (server/src/db/index.js — 1,248 lines)

### Schema Management Pattern
- No migration versioning tool (no Flyway/Knex/Sequelize migrations)
- Uses `ALTER TABLE ... IF NOT EXISTS` for safe incremental changes
- All migrations embedded in `initDb()` function — runs on every startup
- Risk: no rollback capability, migration order matters

### Table Groups

**Auth & Projects (6 tables):**
- `users` — id, email, password_hash, avatar, is_admin
- `password_reset_tokens`
- `projects` — id (UUID), name, owner_id, state (JSONB)
- `project_members` — role: admin/edit/view
- `project_invites`

**Analytics (2 tables):**
- `analytics_events`
- `feedback`

**Graph/Entity Links (2 tables):**
- `entity_links` — source_type, source_id, target_type, target_id, relation, project_id, metadata (JSONB), soft-delete
- `graph_closure` — precomputed ancestor/descendant/depth/path

**CRM (~35+ tables):**
- Deals: `crm_deals`, `crm_pipelines`, `crm_stages`, `crm_line_items`
- People/Orgs: `crm_people`, `crm_organizations`, `crm_org_emails`, `crm_org_phones`, `crm_deal_people`
- Activities: `crm_activities`, `crm_people_activities`, `crm_org_activities`, `crm_emails`, `crm_calls`, `crm_meetings`
- CRM Support: `crm_contacts`, `crm_tasks`, `crm_comments`, `crm_tags`, `crm_tag_links`
- CRM Advanced: `crm_scoring_rules`, `crm_leads`, `crm_custom_fields`, `crm_custom_field_values`
- CRM Automation: `crm_templates`, `crm_automations`, `crm_sequences`, `crm_goals`, `crm_quotas`
- CRM Products: `crm_products`, `crm_quotes`
- CRM Enterprise: `crm_approval_rules`, `crm_approvals`, `crm_territories`, `crm_routing_rules`, `crm_sla_policies`
- CRM Config: `crm_dashboard_layouts`, `crm_audit_log`, `crm_webhooks`, `crm_api_keys`
- CRM v6+: `crm_smart_views`, `crm_contact_roles`, `crm_deal_relations`, `crm_velocity_rules`, `crm_snoozes`, `crm_notification_prefs`, `crm_stage_validations`, `crm_cadences`, `crm_exchange_rates`

**Docs (8 tables):**
- `doc_spaces`, `doc_space_members`, `doc_space_invites`
- `doc_pages` (hierarchical, soft-delete), `doc_page_versions`, `doc_page_restrictions`
- `doc_comments`, `doc_page_stars`

---

## 8. COMPLEXITY HOTSPOTS (Files Over 500 LOC That Need Attention)

### CRITICAL — Must Refactor

| File | Lines | Problem |
|------|-------|---------|
| `client/src/pages/CRMPage.jsx` | 4,713 | Entire CRM app in one file — deeply broken SRP |
| `server/src/routes/crm.js` | 3,704 | All CRM REST endpoints in one file — untestable |
| `client/src/components/canvas/Canvas.jsx` | 3,164 | God component: state hub + rendering + modal manager + keyboard shortcuts + exports |
| `client/src/components/canvas/TemplatesDialog.jsx` | 2,183 | Template modal too large — should split into TemplatePreview + CategoryFilter + TemplateData |
| `client/src/components/crm/OrganizationsSection.jsx` | 2,220 | Duplicate of ContactsSection pattern |
| `client/src/components/canvas/NodeDetailDialog.jsx` | 1,846 | Node editor dialog with CRM integration — too many concerns |
| `client/src/hooks/useProjects.js` | 1,249 | All project/map/node ops + undo/redo + collab sync + localStorage + server sync in one hook |
| `client/src/components/crm/ContactsSection.jsx` | 1,678 | Near-duplicate of OrganizationsSection.jsx |
| `client/src/pages/LandingPage.jsx` | 1,280+ | Marketing page — could split sections into sub-components |
| `server/src/db/index.js` | 1,248 | Schema + all migrations in one function |
| `client/src/components/canvas/NodePropertiesPanel.jsx` | 690 | Side panel with too much inline logic |
| `client/src/components/crm/LeadsSection.jsx` | 734 | Same table pattern as Contacts/Orgs |
| `client/src/store/treeReducer.js` | 623 | Large reducer — manageable but on boundary |
| `server/src/services/graphService.js` | 607 | 10 graph algorithms — acceptable, well-separated |
| `server/src/services/docsService.js` | 526 | Docs CRUD + versioning + permissions — acceptable |

---

## 9. DEAD CODE & UNUSED ARTIFACTS

### Confirmed Dead/Orphaned

| Item | Location | Reason |
|------|----------|--------|
| `useTree.js` | `client/src/hooks/useTree.js` | Simple reducer wrapper (32 lines) — `useProjects` does all this and more; likely unused |
| `PublicOnlyRoute.jsx` | `client/src/components/` | Very likely orphaned — check if imported anywhere |
| Large doc files in repo root | `PROJECT_SUMMARY.md`, `GRAPH_ENGINE_ARCHITECTURE.md`, `GRAPH_UX_ARCHITECTURE.md`, `HOW_TO_USE.txt` | 186KB of docs in root — not part of app, likely stale reference docs |
| `"updated May09.txt"` | root | Deleted in current branch — was a note file |

### Suspected Dead (Needs Verification)

| Item | Location | Reason |
|------|----------|--------|
| `OpenAuthModal` component | `App.jsx` | Auth redirect component — check if needed now login is modal-based |
| Legacy redirects `/canvas → /app/canvas` | `App.jsx` | If all links updated, these can go |
| CRM v6 tables | `db/index.js` | 9 new tables (velocity_rules, cadences, etc.) — added but may have no UI implementation yet |
| Several CRM automation tables | `db/index.js` | `crm_automations`, `crm_sequences`, `crm_approval_rules`, `crm_routing_rules`, `crm_sla_policies` — may be DB-only with no UI/API |
| `graph_closure` table | `db/index.js` | Precomputed closure table — verify if used by graph routes or dead |
| `crm_exchange_rates` table | `db/index.js` | Added in v6 — check if currency conversion is active in UI |
| Sprint-related components | `canvas/SprintBoard.jsx`, `SprintPlanningView.jsx`, `GanttPanel.jsx` | Check if actually accessible from UI or stub components |
| `webhookClient.js` | `client/src/lib/` | Webhook firing from client — check if used |
| `eventBus.js` | `client/src/lib/` | Pub/sub event system — check if all events are subscribed |

---

## 10. UNNECESSARY COMPLEXITY / ANTI-PATTERNS

### A) Dual Graph Storage (Biggest Architectural Issue)
- Canvas nodes have `extraEdges` in `projects.state` (JSONB)
- Same data also synced to `entity_links` table (normalized PostgreSQL)
- `graphSync.js` keeps them in sync; `reconcile` and `health` endpoints detect divergence
- **Problem:** Two sources of truth, sync bugs possible, `reconcile` endpoint is a code smell
- **Should be:** Single source of truth (either JSONB or normalized, not both)

### B) Database Without Migrations
- All schema changes live in `initDb()` via `ALTER TABLE ... IF NOT EXISTS`
- No migration versioning (no rollbacks, no history, no tracking)
- On production DB, all migrations run every restart
- **Should be:** Flyway, Knex migrations, or at minimum numbered migration scripts

### C) In-Memory Cache Not Production-Safe
- `graphCache.js` is an LRU in-memory cache (500 entries, 60s TTL)
- Works fine for single-instance dev, fails with horizontal scaling (multiple Node processes)
- **Should be:** Redis for production multi-instance deployment

### D) useProjects.js — Fat Hook Anti-Pattern (1,249 lines)
Contains: project CRUD + map CRUD + node operations + undo/redo + localStorage + server sync + collab broadcast + webhook firing
- Should split into: `useProjectCRUD`, `useMapCRUD`, `useNodeOperations`, `useUndoRedo`, `useServerSync`

### E) CRMPage.jsx as Monolith (4,713 lines)
- All CRM tabs/views rendered conditionally inside one component
- Section components (ContactsSection, OrganizationsSection, LeadsSection) are correct but still huge
- No lazy loading within CRM routes

### F) Duplicate Table Section Pattern
Three components implement the same "filterable, sortable data table with column customizer + inline editing + bulk actions":
- `ContactsSection.jsx` (1,678 lines)
- `OrganizationsSection.jsx` (2,220 lines)
- `LeadsSection.jsx` (734 lines)
- **Should be:** A single generic `<EntityTable>` component configured via props

### G) Canvas.jsx Imports 40+ Modules Eagerly
All panels/modals are eagerly imported, increasing initial bundle size even for panels users never open.
- **Should be:** Dynamic `React.lazy()` imports for rarely-used panels

### H) No TypeScript
Large codebase (57K+ LOC client) with no type safety. Complex data structures (node state, CRM entities, WebSocket messages) would benefit greatly from TypeScript interfaces.

### I) localStorage Unbounded Growth
Key pattern: `chart-to-jira-projects-${userId}` stores all projects per user.
No archival, expiry, or max-size strategy. Can cause storage quota issues for power users.

### J) Password Reset Token — No Single-Use Enforcement Visible
- Reset tokens stored in `password_reset_tokens` table with 1-hour expiry
- Verify tokens are deleted after use to prevent replay attacks

---

## 11. MISSING ABSTRACTIONS

| Missing | Impact | Where Needed |
|---------|--------|-------------|
| Generic `<DataTable>` component | HIGH | ContactsSection, OrganizationsSection, LeadsSection all duplicate this |
| Generic `<Modal>` / `<Panel>` wrapper | MEDIUM | 15+ modals with inconsistent styling/close behavior |
| `useDebounce` hook | MEDIUM | Server save is debounced inline, not via reusable hook |
| Centralized error handling in API clients | MEDIUM | Each `lib/*.js` file handles errors differently |
| OpenAPI/Swagger docs | LOW | No API documentation for 100+ endpoints |
| Component lazy loading within CRM | MEDIUM | CRMPage eagerly renders all views |
| Redis cache service | HIGH | graphCache.js is single-instance only |

---

## 12. ARCHITECTURE STRENGTHS (What's Working Well)

1. **Three-shell isolation** — CanvasShell, CRMShell, DocsShell are lazy-loaded with error boundaries; crash in one won't crash others
2. **Clear service layer** — Server services (authService, projectsService, docsService, graphService) are well-separated from routes
3. **RBAC** — Consistent admin/edit/view role checking across all server routes
4. **Soft deletes** — `deleted_at IS NULL` pattern consistently applied to entity_links, doc_pages
5. **Graph engine** — Recursive CTE traversal, impact analysis, path finding, health checks are sophisticated
6. **WebSocket architecture** — Clean room-based collab with state caching, presence, cursor tracking
7. **Jira integration** — Well-designed breadth-first tree → ticket mapping with depth-based issue types
8. **Lightweight dependencies** — Only 17 client deps, 9 server deps; no dependency bloat

---

## 13. ALL SERVER ENDPOINTS

### /api/auth (7 endpoints)
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | /register | — | Create account |
| POST | /login | — | Get JWT |
| GET | /me | ✓ | Current user |
| POST | /change-password | ✓ | Update password |
| POST | /forgot-password | — | Send reset email |
| POST | /reset-password | — | Complete reset |
| POST | /avatar | ✓ | Upload base64 avatar |

### /api/projects (14 endpoints)
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | / | ✓ | List user projects |
| POST | / | ✓ | Create project |
| GET | /:id | ✓ | Get project + state |
| PATCH | /:id/name | admin | Rename |
| PUT | /:id/state | edit+ | Save full state |
| DELETE | /:id | admin | Delete/leave |
| POST | /:id/leave | ✓ | Leave project |
| GET | /:id/members | ✓ | List members |
| POST | /:id/members | admin | Add member |
| DELETE | /:id/members/:uid | admin | Remove member |
| PATCH | /:id/members/:uid/role | admin | Change role |
| POST | /:id/invites | admin | Send email invite |
| GET | /:id/invites | admin | List pending invites |
| DELETE | /:id/invites/:iid | admin | Revoke invite |

### /api/graph (12 endpoints)
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | /traverse | ✓ | Upstream/downstream traversal |
| POST | /impact | ✓ | Impact analysis |
| POST | /overlay | ✓ | Full dependency overlay |
| GET | /stats/:projectId | ✓ | Graph statistics |
| POST | /paths | ✓ | Find paths between nodes |
| POST | /backfill | admin | Sync extraEdges → entity_links |
| POST | /aggregate | ✓ | Aggregate across graph |
| GET | /summarize/:projectId | ✓ | LLM text summary |
| POST | /reconcile/:projectId | edit+ | Sync JSONB ↔ entity_links |
| GET | /health/:projectId | ✓ | Divergence check |
| PATCH | /edges/:linkId/metadata | ✓ | Enrich edge |
| GET | /cache-stats | — | Cache metrics |

### /api/links (7 endpoints)
| Method | Path | Purpose |
|--------|------|---------|
| POST | / | Create link between entities |
| GET | /by-source/:type/:id | Get links from source |
| GET | /by-target/:type/:id | Get links to target |
| GET | /project/:projectId | All project links |
| DELETE | /:id | Soft-delete link |
| PATCH | /:id/restore | Restore soft-deleted link |
| DELETE | /by-source/:type/:id | Delete all source links |

### /api/docs (~35 endpoints)
- Spaces: CRUD + members + invites
- Pages: CRUD + hierarchy + move + duplicate + status
- Versions: history + restore
- Restrictions: per-user page access
- Comments: CRUD + resolve
- Stars: toggle + list
- Linked pages: create/list/delete links

### /api/crm (~100+ endpoints)
- Deals: CRUD + pipeline + stages + line items + contact linking
- Organizations: CRUD + emails + phones + activities
- People: CRUD + activities + deals
- Leads: CRUD + scoring + conversion
- Activities: CRUD (tasks, emails, calls, meetings)
- Tags: CRUD + linking
- Custom Fields: CRUD + values
- Advanced: approvals, templates, automations, goals, quotas, products, quotes, territories, SLA, webhooks, API keys, dashboard layouts, audit log

### /api/admin (7 endpoints)
- Stats, feature analytics, activity log, users list, toggle admin, feedback

### /api/analytics (2 endpoints)
- Event tracking (public), feedback submission (public)

### /api/invites (4 endpoints)
- Mine, view by token, accept, decline

### /api/jira (4 endpoints)
- Issue types, sprints, JQL search, create tickets

---

## 14. QUICK DEAD CODE CHECKS

```bash
# Verify useTree.js is unused
grep -rn "useTree" client/src/

# Verify PublicOnlyRoute is unused
grep -rn "PublicOnlyRoute" client/src/

# Check CRM v6 table usage in routes
grep -rn "crm_velocity_rules\|crm_cadences\|crm_stage_validations" server/src/routes/

# Check event bus subscribers
grep -rn "eventBus\.on\|eventBus\.emit" client/src/

# Check webhook client usage
grep -rn "webhookClient" client/src/

# Find largest files
find client/src -name "*.jsx" -o -name "*.js" | xargs wc -l | sort -rn | head -20
```

---

## 15. RECOMMENDED PRIORITIES FOR REFACTORING

### Priority 1 — Quick Wins (Low Risk)
1. Delete `useTree.js` if confirmed unused
2. Delete `PublicOnlyRoute.jsx` if confirmed unused
3. Add proper migration versioning (Knex or numbered SQL files)

### Priority 2 — High Impact Refactors
4. Split `crm.js` route file into `routes/crm/deals.js`, `routes/crm/people.js`, `routes/crm/orgs.js`, etc.
5. Split `CRMPage.jsx` into sub-route components per CRM section
6. Extract abstract `<EntityTable>` component; refactor Contacts/Organizations/Leads to use it
7. Split `useProjects.js` into focused hooks (`useProjectCRUD`, `useMapCRUD`, `useNodeOperations`, `useUndoRedo`, `useServerSync`)

### Priority 3 — Architecture
8. Resolve dual graph storage — pick `entity_links` or `projects.state` JSONB, not both
9. Replace `graphCache.js` with Redis for production readiness
10. Add TypeScript incrementally (start with shared types for node state + CRM entities)
11. Add `React.lazy()` for Canvas panel components to reduce bundle size

### Priority 4 — Long Term
12. Break `Canvas.jsx` into Canvas + CanvasPanelManager + CanvasKeyboardHandler
13. Add OpenAPI documentation for all 100+ endpoints
14. Add component-level test coverage for `useProjects`, `useCollaboration`
