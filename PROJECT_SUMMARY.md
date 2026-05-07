# Chart-to-Jira (bahnOS) — Complete Project Summary

## What This Is

A **collaborative mind-mapping and project management platform** that bridges visual planning with operational tools (Jira, CRM pipelines). Users create hierarchical node trees, enrich them with metadata (status, priority, story points, assignees), collaborate in real-time, and push structures directly to Jira as epics/stories/tasks. A built-in CRM pipeline lets users track deals linked to canvas nodes.

**Live deployment**: DigitalOcean droplet at `165.22.218.124:8080`, served via Nginx reverse proxy to a Vite-built React frontend, with the Node.js API on port 3001.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, React Router v6, Tailwind CSS |
| State | React Context + useReducer + localStorage (no Redux) |
| Backend | Node.js, Express 4 |
| Database | PostgreSQL (JSONB for tree state) |
| Real-time | Native WebSocket (ws library) |
| Auth | JWT (7-day expiry) + bcryptjs |
| Email | Nodemailer (SMTP, optional — logs to console in dev) |
| External | Jira REST API (Cloud), Google Calendar (activity scheduling) |

---

## Repository Structure

```
chart_to_jira/
├── server/
│   ├── index.js                          # Express + WebSocket server entry
│   ├── package.json
│   └── src/
│       ├── db/index.js                   # All DDL, table creation, migrations
│       ├── middleware/
│       │   ├── authenticate.js           # JWT verification → req.user
│       │   ├── adminOnly.js              # is_admin gate
│       │   └── errorHandler.js           # Catch-all error middleware
│       ├── routes/
│       │   ├── auth.js                   # Register, login, password reset
│       │   ├── projects.js               # CRUD, members, invites
│       │   ├── crm.js                    # Deals, contacts, activities, tasks, comments, goals, templates
│       │   ├── links.js                  # Entity relationship CRUD (node↔deal)
│       │   ├── jira.js                   # Fetch issue types, sprints, JQL search, bulk create
│       │   ├── analytics.js              # Event tracking, feedback
│       │   └── admin.js                  # Stats, users, feedback management
│       ├── services/
│       │   ├── authService.js            # Hash, verify, token generation
│       │   ├── projectService.js         # DB queries for projects/members
│       │   ├── jiraService.js            # Jira API calls (basic auth)
│       │   └── emailService.js           # SMTP send (invite, password reset)
│       └── websocket/
│           └── collaboration.js          # Room management, presence, action broadcast
│
├── client/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx                      # Entry: BrowserRouter + AuthProvider + AuthModalProvider
│       ├── App.jsx                       # Route definitions
│       ├── TreeApp.jsx                   # Main app shell (sidebar + canvas + panels)
│       ├── index.css                     # Tailwind imports + custom styles
│       ├── context/
│       │   ├── AuthContext.jsx           # Token, user, login/logout/register
│       │   └── AuthModalContext.jsx      # Global auth modal open/close state
│       ├── hooks/
│       │   ├── useProjects.js            # Core state: projects, maps, CRUD, undo/redo
│       │   ├── useCollaboration.js       # WebSocket room, presence, action sync
│       │   ├── useNodeLinks.js           # Fetch entity_links, badge map
│       │   ├── useNotifications.js       # Real-time invite notifications via WS
│       │   ├── usePanZoom.js             # Canvas pan/zoom transforms
│       │   └── useTree.js               # Layout algorithms (hierarchical + radial)
│       ├── store/
│       │   └── treeReducer.js            # All tree mutation actions (40+ action types)
│       ├── lib/
│       │   ├── projectsApi.js            # Projects/members/invites fetch wrapper
│       │   ├── crmApi.js                 # CRM deals/contacts/activities fetch wrapper
│       │   ├── linksApi.js               # Entity links fetch wrapper
│       │   ├── jiraApi.js                # Jira endpoints fetch wrapper
│       │   ├── analyticsApi.js           # Analytics/feedback fetch wrapper
│       │   ├── eventBus.js               # Lightweight pub/sub (CRM link events)
│       │   ├── exportUtils.js            # CSV, Confluence, Markdown, text parsing
│       │   ├── webhookClient.js          # Webhook fire mechanism
│       │   ├── nodeColors.js             # Color palette definitions
│       │   ├── nodeShapes.js             # Shape dimension helpers
│       │   └── localStorage.js           # Storage key constants
│       ├── components/
│       │   ├── canvas/                   # 40+ canvas components (see below)
│       │   ├── sidebar/                  # Jira panel, connection form
│       │   ├── collaboration/            # MembersPanel
│       │   ├── auth/                     # AuthModal (login/register/forgot tabs)
│       │   ├── projects/                 # ProjectsPanel, DashboardPanel
│       │   ├── landing/                  # Navbar, Footer
│       │   ├── ChatbotWidget.jsx         # Help chatbot
│       │   ├── FeedbackWidget.jsx        # Feedback form
│       │   └── NotificationBell.jsx      # Invite notifications
│       └── pages/                        # Route-level pages (Landing, CRM, Admin, Settings, etc.)
```

---

## Database Schema

### users
```sql
id SERIAL PRIMARY KEY,
email VARCHAR(255) UNIQUE NOT NULL,
password_hash TEXT NOT NULL,
avatar TEXT,                              -- base64 data URL
is_admin BOOLEAN DEFAULT false,
created_at TIMESTAMPTZ DEFAULT NOW()
```

### projects
```sql
id VARCHAR(36) PRIMARY KEY,              -- UUID generated client-side
name VARCHAR(255) NOT NULL,
owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
state JSONB,                             -- Full project tree state (maps, nodes, edges, groups)
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
```

### project_members
```sql
id SERIAL PRIMARY KEY,
project_id VARCHAR(36) REFERENCES projects(id) ON DELETE CASCADE,
user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
role VARCHAR(20) DEFAULT 'view',         -- admin | edit | view
invited_by INTEGER REFERENCES users(id),
joined_at TIMESTAMPTZ DEFAULT NOW(),
UNIQUE(project_id, user_id)
```

### project_invites
```sql
id SERIAL PRIMARY KEY,
project_id VARCHAR(36) REFERENCES projects(id) ON DELETE CASCADE,
email VARCHAR(255) NOT NULL,
role VARCHAR(20) DEFAULT 'view',
token VARCHAR(255) UNIQUE NOT NULL,      -- 32-byte hex
invited_by INTEGER REFERENCES users(id),
created_at TIMESTAMPTZ DEFAULT NOW(),
expires_at TIMESTAMPTZ,                  -- +7 days
accepted_at TIMESTAMPTZ
```

### password_reset_tokens
```sql
id SERIAL PRIMARY KEY,
user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
token VARCHAR(255) UNIQUE NOT NULL,
expires_at TIMESTAMPTZ NOT NULL,         -- +1 hour
created_at TIMESTAMPTZ DEFAULT NOW()
```

### crm_deals
```sql
id SERIAL PRIMARY KEY,
user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
company_name VARCHAR(255),
contact_name VARCHAR(255),
contact_email VARCHAR(255),
deal_value NUMERIC(12,2),
stage VARCHAR(50) DEFAULT 'lead',        -- lead|qualified|demo|proposal|negotiation|won|lost
probability INTEGER,                     -- Auto-set: lead=10, qualified=25, demo=40, proposal=60, negotiation=80, won=100, lost=0
next_action TEXT,
notes TEXT,
last_contact_at TIMESTAMPTZ,
expected_close_date DATE,
lost_reason TEXT,
stage_entered_at TIMESTAMPTZ DEFAULT NOW(),
linkedin_url TEXT,
follow_up_at TIMESTAMPTZ,
node_id TEXT,                            -- Links to mind map node (legacy, superseded by entity_links)
node_key VARCHAR(50),
tags TEXT[] DEFAULT '{}',
assigned_to TEXT,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
```

### crm_contacts
```sql
id SERIAL PRIMARY KEY,
deal_id INTEGER REFERENCES crm_deals(id) ON DELETE CASCADE,
name VARCHAR(255),
email VARCHAR(255),
phone VARCHAR(100),
role VARCHAR(100),
linkedin_url TEXT,
is_primary BOOLEAN DEFAULT false,
created_at TIMESTAMPTZ DEFAULT NOW()
```

### crm_activities
```sql
id SERIAL PRIMARY KEY,
deal_id INTEGER REFERENCES crm_deals(id) ON DELETE CASCADE,
type VARCHAR(50),                        -- note|email|meeting|call|whatsapp|sms
title VARCHAR(255),
body TEXT,
occurred_at TIMESTAMPTZ DEFAULT NOW(),
remind_at TIMESTAMPTZ,
created_at TIMESTAMPTZ DEFAULT NOW()
```

### crm_tasks
```sql
id SERIAL PRIMARY KEY,
deal_id INTEGER REFERENCES crm_deals(id) ON DELETE CASCADE,
title VARCHAR(255),
due_at TIMESTAMPTZ,
done BOOLEAN DEFAULT false,
created_at TIMESTAMPTZ DEFAULT NOW()
```

### crm_comments
```sql
id SERIAL PRIMARY KEY,
deal_id INTEGER REFERENCES crm_deals(id) ON DELETE CASCADE,
user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
body TEXT NOT NULL,
created_at TIMESTAMPTZ DEFAULT NOW()
```

### crm_goals
```sql
id SERIAL PRIMARY KEY,
user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
period_key VARCHAR(20),                  -- e.g. "2026-Q1", "2026-05"
target_value NUMERIC(12,2),
target_count INTEGER,
created_at TIMESTAMPTZ DEFAULT NOW(),
UNIQUE(user_id, period_key)
```

### crm_email_templates
```sql
id SERIAL PRIMARY KEY,
user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
name VARCHAR(255),
subject TEXT,
body TEXT,
created_at TIMESTAMPTZ DEFAULT NOW()
```

### entity_links (Relationship Layer)
```sql
id SERIAL PRIMARY KEY,
source_type VARCHAR(50) NOT NULL,        -- 'node'
source_id TEXT NOT NULL,                 -- node UUID
source_key VARCHAR(50),                  -- node_key (e.g. "PROJ-3")
target_type VARCHAR(50) NOT NULL,        -- 'crm_deal'
target_id TEXT NOT NULL,                 -- deal id
relation VARCHAR(50) DEFAULT 'linked_to',
user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
project_id VARCHAR(36),
metadata JSONB DEFAULT '{}',
deleted_at TIMESTAMPTZ DEFAULT NULL,     -- Soft delete
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()

-- Indexes
idx_entity_links_source ON (source_type, source_id) WHERE deleted_at IS NULL
idx_entity_links_target ON (target_type, target_id) WHERE deleted_at IS NULL
idx_entity_links_project ON (project_id) WHERE deleted_at IS NULL
UNIQUE idx_entity_links_unique_active ON (source_type, source_id, target_type, target_id, relation) WHERE deleted_at IS NULL
```

### analytics_events
```sql
id SERIAL PRIMARY KEY,
event_type VARCHAR(100),
feature_name VARCHAR(100),
user_id INTEGER REFERENCES users(id),
session_id VARCHAR(100),
is_guest BOOLEAN DEFAULT false,
metadata JSONB DEFAULT '{}',
created_at TIMESTAMPTZ DEFAULT NOW()
```

### feedback
```sql
id SERIAL PRIMARY KEY,
user_id INTEGER REFERENCES users(id),
session_id VARCHAR(100),
is_guest BOOLEAN DEFAULT false,
email VARCHAR(255),
rating INTEGER CHECK (rating >= 1 AND rating <= 5),
message TEXT,
category VARCHAR(100),
metadata JSONB DEFAULT '{}',
created_at TIMESTAMPTZ DEFAULT NOW()
```

---

## API Endpoints (Complete)

### Authentication — `/api/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /register | No | Create account → returns JWT |
| POST | /login | No | Authenticate → returns JWT |
| GET | /me | Yes | Get current user profile |
| POST | /change-password | Yes | Update password (requires old password) |
| POST | /forgot-password | No | Send reset email |
| POST | /reset-password | No | Reset with token + new password |
| POST | /avatar | Yes | Upload avatar (base64 data URL) |

### Projects — `/api/projects`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | / | Yes | List user's own + shared projects |
| POST | / | Yes | Create project (id, name, state) |
| GET | /:projectId | Yes | Get single project (checks membership) |
| PATCH | /:projectId/name | Yes | Rename project |
| PUT | /:projectId/state | Yes | Save full JSONB state |
| DELETE | /:projectId | Yes | Delete project (owner only) |
| GET | /:projectId/members | Yes | List members + roles |
| POST | /:projectId/members | Yes | Add member directly |
| DELETE | /:projectId/members/:userId | Yes | Remove member |
| PATCH | /:projectId/members/:userId/role | Yes | Change member role |
| POST | /:projectId/invites | Yes | Send invite email |
| GET | /:projectId/invites | Yes | List pending invites |
| DELETE | /:projectId/invites/:inviteId | Yes | Revoke invite |

### Invites — `/api/invites`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /mine | Yes | User's pending invites |
| GET | /:token | No | Get invite info (public page) |
| POST | /:token/accept | Yes | Accept invite → adds to project_members |
| DELETE | /:token/decline | Yes | Decline invite |

### CRM — `/api/crm`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /deals | Yes | List all user's deals |
| POST | /deals | Yes | Create deal (+ entity_link if node_id provided) |
| PUT | /deals/:id | Yes | Update deal (syncs entity_link on node_id change) |
| PATCH | /deals/:id/stage | Yes | Change stage (auto-sets probability) |
| PATCH | /deals/:id/followup | Yes | Set follow_up_at |
| DELETE | /deals/:id | Yes | Delete deal (+ soft-delete entity_links) |
| GET | /deals/:id/contacts | Yes | List contacts for deal |
| POST | /deals/:id/contacts | Yes | Add contact |
| DELETE | /contacts/:id | Yes | Remove contact |
| GET | /deals/:id/activities | Yes | List activities |
| POST | /deals/:id/activities | Yes | Log activity (note/email/call/meeting/whatsapp/sms) |
| DELETE | /activities/:id | Yes | Remove activity |
| GET | /deals/:id/tasks | Yes | List tasks |
| POST | /deals/:id/tasks | Yes | Create task |
| PATCH | /tasks/:id | Yes | Toggle task done |
| DELETE | /tasks/:id | Yes | Remove task |
| GET | /deals/:id/comments | Yes | List comments |
| POST | /deals/:id/comments | Yes | Add comment |
| DELETE | /comments/:id | Yes | Remove comment |
| GET | /goals | Yes | List user's goals |
| POST | /goals | Yes | Create/upsert goal |
| DELETE | /goals/:id | Yes | Remove goal |
| GET | /email-templates | Yes | List templates |
| POST | /email-templates | Yes | Create template |
| DELETE | /email-templates/:id | Yes | Remove template |

### Entity Links — `/api/links`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | / | Yes | Create link (source→target) |
| GET | /by-source/:sourceType/:sourceId | Yes | Links from a source |
| GET | /by-target/:targetType/:targetId | Yes | Links to a target |
| GET | /project/:projectId | Yes | All links in project (?source_type=node) |
| DELETE | /:id | Yes | Soft-delete link |
| DELETE | /by-source/:sourceType/:sourceId | Yes | Bulk soft-delete by source |
| PATCH | /:id/restore | Yes | Restore soft-deleted link |

### Jira — `/api/jira`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /issue-types | Yes | Fetch project issue types (query: baseUrl, email, apiToken, projectKey) |
| GET | /sprints | Yes | Fetch active/future sprints (query: baseUrl, email, apiToken, boardId) |
| GET | /search | Yes | JQL search (query: baseUrl, email, apiToken, jql) |
| POST | /create-tickets | Yes | Bulk create Jira issues from tree structure |

### Analytics — `/api/analytics`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /event | No | Track feature usage event |
| POST | /feedback | No | Submit user feedback |

### Admin — `/api/admin`
| Method | Path | Admin | Description |
|--------|------|-------|-------------|
| GET | /stats | Yes | User count, project count, signups over time |
| GET | /features | Yes | Feature usage breakdown |
| GET | /activity | Yes | Activity log (paginated, filterable) |
| GET | /users | Yes | User list with search |
| PATCH | /users/:userId/admin | Yes | Toggle admin flag |
| GET | /feedback | Yes | Feedback list (paginated) |
| DELETE | /feedback/:id | Yes | Delete feedback entry |

---

## WebSocket Protocol

**Connection URL**: `ws://<host>:3001/ws` (derived from `VITE_API_URL` or `window.location`)

### Message Types (Client → Server)

```jsonc
// 1. Authenticate for user-level notifications (invites)
{ "type": "auth", "token": "JWT" }

// 2. Join a project collaboration room
{ "type": "join", "projectId": "UUID", "token": "JWT" }

// 3. Broadcast a tree action to room members
{ "type": "action", "action": { "type": "EDIT_NODE", ... }, "state": { /* full state */ } }

// 4. Persist state to DB without broadcasting
{ "type": "state_sync", "state": { /* full state */ } }

// 5. Share cursor position
{ "type": "cursor", "x": 150, "y": 300 }

// 6. Leave current room
{ "type": "leave" }
```

### Message Types (Server → Client)

```jsonc
// Auth confirmed
{ "type": "authenticated", "userId": 123 }

// Joined room — includes latest state and presence
{ "type": "joined", "projectId": "...", "state": {...}, "myRole": "admin", "myUserId": 123, "myColor": "#3B82F6", "presence": [...] }

// Remote user performed action
{ "type": "action", "projectId": "...", "action": {...}, "userId": 123, "email": "..." }

// Room presence update
{ "type": "presence", "projectId": "...", "users": [{ "userId": 1, "email": "...", "role": "admin", "cursor": {x,y}, "color": "#..." }, ...] }

// Remote cursor move
{ "type": "cursor", "userId": 123, "email": "...", "color": "#3B82F6", "x": 150, "y": 300 }

// Real-time invite notification (user-level, not room-level)
{ "type": "invite_received", "invite": { "id": 1, "project_name": "...", "role": "edit", "token": "..." } }
```

### Server-Side In-Memory State
```javascript
rooms       = Map<projectId, Map<userId, { ws, email, userId, role, cursor, color }>>
roomStates  = Map<projectId, latestProjectState>   // Cache for fast rejoin
userSockets = Map<userId, Set<ws>>                 // For user-level notifications
```

### Collaboration Rules
- Only `admin` and `edit` roles can send `action` messages (server enforces)
- `view` role receives actions but cannot broadcast
- Server persists state to DB on `state_sync` messages
- On join, server returns cached `roomStates[projectId]` or fetches from DB
- On disconnect, user is removed from room and presence broadcast fires
- Client auto-reconnects after 3 seconds on unexpected close

---

## Client-Side State Architecture

### AuthContext (`context/AuthContext.jsx`)
```javascript
{
  token: string | null,       // JWT from localStorage
  user: { id, email, avatar, is_admin } | null,
  loading: boolean,
  login(email, password),
  register(email, password),
  logout(),
  updateAvatar(dataUrl),
}
```

### Project State (`hooks/useProjects.js`)

The primary state container. Manages an array of projects, each containing multiple mind maps.

```javascript
// Top-level state shape (persisted to localStorage + synced to server)
{
  projects: [Project, ...],
  activeProjectId: string | null,
}

// Project shape
{
  id: UUID,
  name: string,
  collab: { id: projectId, role: string } | null,
  activeMapId: UUID,
  maps: { [mapId]: MindMap },
  mapOrder: [mapId, ...],
  nodeCounter: number,          // Auto-increment for node keys
  nodePrefix: string,           // Derived from project name (e.g. "PROJ")
  createdAt: ISO,
  updatedAt: ISO,
}

// MindMap shape
{
  id: UUID,
  name: string,
  nodes: { [nodeId]: Node },
  rootId: string,
  extraEdges: [{ from, to, type, label }],
  groups: [{ id, nodeIds, label, color }],
  customStatuses: [{ name, color }],
  customFields: [{ name, type }],
  frames: [{ id, x, y, w, h, label }],
  selectedNodeId: string | null,
  collab: { id, role } | null,
  createdAt: ISO,
  updatedAt: ISO,
}
```

### Node Shape (complete)
```javascript
{
  id: UUID,
  title: string,
  parentId: string | null,
  childIds: [string],
  depth: number,

  // Visual
  color: string,               // Hex color
  shape: 'rect' | 'circle' | 'diamond' | 'sticky',
  collapsed: boolean,
  x: number, y: number,        // Layout position (computed client-side)
  customIcon: string | null,
  image: string | null,         // base64 data URL

  // Jira/PM metadata
  status: string,              // todo|in-progress|blocked|done (or custom)
  priority: string,            // critical|high|medium|low
  storyPoints: number,
  issueType: string,           // epic|story|task|subtask|bug
  assignee: string,
  tags: [string],
  dueDate: string,             // ISO date
  sprint: string,
  jiraKey: string,             // e.g. "PROJ-42"
  nodeKey: string,             // Internal key (e.g. "PROJ-3")

  // Content
  notes: string,               // Markdown
  url: string,
  comments: [{ id, text, author, timestamp }],
  checked: boolean,            // Checklist mode

  // Collaboration
  reactions: { [emoji]: [userId] },
  locked: boolean,

  // Time tracking
  timeEstimate: number,        // Minutes
  timeLogged: number,          // Minutes

  // Relationships
  alias: string,               // Subtitle
  recurring: boolean,

  // Audit
  auditEntries: [{ field, oldValue, newValue, user, timestamp }],
}
```

### Tree Reducer Actions (40+ types)
```
ADD_CHILD, DELETE_NODE, EDIT_NODE, SELECT_NODE, DESELECT,
UPDATE_NODE_COLOR, TOGGLE_COLLAPSE, MOVE_NODE, SET_SHAPE,
ADD_EDGE, DELETE_EDGE, APPLY_LAYOUT, DUPLICATE_NODE, EDIT_NODE_NOTES,
COLLAPSE_ALL, EXPAND_ALL, AUTO_COLOR, SET_NODE_URL,
PASTE_SUBTREE, BULK_DELETE, SET_NODE_META, ADD_NODE_COMMENT,
DELETE_NODE_COMMENT, COLLAPSE_TO_DEPTH, APPLY_JIRA_KEYS,
SET_EDGE_TYPE, ADD_GROUP, DELETE_GROUP, RENAME_GROUP,
APPLY_RADIAL_LAYOUT, TOGGLE_LOCK, TOGGLE_REACTION,
ADD_AUDIT_ENTRY, REPARENT_NODE, SET_NODE_CHECKLIST,
SET_EDGE_LABEL, SET_CUSTOM_FIELDS, MERGE_NODE, SPLIT_NODE
```

### Undo/Redo
- Per-map history stack, max 50 entries
- Each mutation pushes a shallow copy of the map state
- `undo()` / `redo()` swap current state with stack entry

---

## Key Data Flows

### 1. Creating a Project
```
User clicks "New Project" → useProjects.createProject(name)
  → Generates UUID client-side
  → Creates project object with one default map (root node: project name)
  → Saves to localStorage immediately
  → If authenticated: POST /api/projects { id, name, state }
  → Server stores in PostgreSQL
```

### 2. Editing a Node (Solo)
```
User double-clicks node title → InlineEditor opens
  → User types new title → onBlur/Enter
  → dispatch({ type: 'EDIT_NODE', nodeId, title })
  → treeReducer produces new state
  → useProjects persists to localStorage
  → If project has collab room: skip (handled by collab flow)
```

### 3. Editing a Node (Collaborative)
```
User edits node → dispatch({ type: 'EDIT_NODE', nodeId, title })
  → treeReducer produces new state
  → useProjects calls collabSendRef.current(action, newState)
  → WebSocket sends { type: 'action', action, state }
  → Server broadcasts to all other room members
  → Their remoteActionCallback receives action
  → They apply action to their local state (treeReducer)
  → Server caches latest state in roomStates map
  → Periodically: client sends { type: 'state_sync', state } to persist to DB
```

### 4. CRM Deal Linked to Node
```
User opens NodeDetailDialog → clicks "Add to CRM"
  → InlineCRMModal opens (prefilled with node title as company name)
  → User fills deal details → Submit
  → POST /api/crm/deals { company_name, node_id, ... }
  → Server creates crm_deals row
  → Server INSERT INTO entity_links (source_type='node', target_type='crm_deal')
  → Client: linksApi.create() as backup (if server didn't handle)
  → eventBus.emit('CRM_DEAL_LINKED', { nodeId, dealId })
  → useNodeLinks hears event → refetches linkMap
  → TreeNode re-renders with green "$" badge
```

### 5. Pushing to Jira
```
User opens Jira Panel → enters credentials (baseUrl, email, apiToken)
  → Selects project key, fetches issue types + sprints
  → Configures depth mapping (depth 0=Epic, 1=Story, 2=Task, etc.)
  → Clicks "Push to Jira"
  → POST /api/jira/create-tickets { jira: credentials, tree: { root, nodes, depthMap } }
  → Server traverses tree depth-first:
    - Creates parent issues first (epics)
    - Creates children with parent link
    - Assigns story points, priority, sprint, assignee per node metadata
  → Returns { created: [{ nodeId, jiraKey }] }
  → Client dispatches APPLY_JIRA_KEYS → nodes get jiraKey field
  → Nodes now display Jira key badge
```

### 6. Importing from Jira via JQL
```
User enters JQL query in Jira Panel → "Import"
  → GET /api/jira/search?jql=...
  → Server calls Jira REST API, returns issues
  → Client builds tree from issue hierarchy (epic→story→subtask)
  → dispatch({ type: 'PASTE_SUBTREE', parentId: rootId, subtree })
  → Nodes created with jiraKey, status, storyPoints, assignee filled from Jira data
```

### 7. Real-time Invite Flow
```
Admin opens MembersPanel → enters email + role → "Invite"
  → POST /api/projects/:id/invites { email, role }
  → Server creates project_invites row (token, 7-day expiry)
  → Server sends email with accept link
  → Server checks if invitee is online via userSockets map
  → If online: sends WS message { type: 'invite_received', invite: {...} }
  → Invitee's NotificationBell shows badge
  → Invitee clicks "Accept"
  → POST /api/invites/:token/accept
  → Server adds to project_members, sets accepted_at
  → Project appears in invitee's project list
```

### 8. Saving Project State to Server
```
Triggered by: explicit save button, periodic auto-save (5min), or collab state_sync
  → PUT /api/projects/:id/state { state: fullProjectState }
  → Server: UPDATE projects SET state = $1, updated_at = NOW() WHERE id = $2
  → State is stored as JSONB (includes all maps, nodes, edges, groups, frames)
```

---

## Feature Inventory

### Canvas & Mind Map
- Hierarchical tree rendering (SVG)
- Radial/mind-map layout algorithm
- Node shapes: rectangle, circle, diamond, sticky note
- Node colors (12-color palette + custom)
- Collapse/expand subtrees
- Drag-to-reparent nodes
- Extra edges (arrows, blockers, dependencies) with labels
- Groups (visual containers around node sets)
- Frames (labeled rectangular regions)
- Focus mode (dim unrelated nodes)
- Minimap navigation
- Pan/zoom with scroll + pinch
- Snap to grid
- Breadcrumb navigation (click ancestors)
- Keyboard shortcuts (Tab, Enter, Delete, arrows, Ctrl+Z/Y, etc.)

### Views (19 visualization modes)
1. **Tree** — Default hierarchical SVG
2. **Kanban** — Columns by status, WIP limits, drag between lanes
3. **Table** — Sortable/filterable flat table with inline editing
4. **Timeline** — Horizontal timeline by due date
5. **Gantt** — Horizontal bars (start → due date)
6. **Sprint Board** — Swimlanes: sprint × status
7. **Sprint Planning** — Two-column: backlog ↔ sprint drag
8. **Burndown** — Story points remaining over time (SVG chart)
9. **Velocity** — Points completed per sprint (bar chart)
10. **Resource Heatmap** — Workload grid by assignee
11. **Priority Board** — Columns by priority level
12. **Statistics** — Breakdown charts (status, priority, assignee, type)
13. **Critical Path** — Highlights longest dependency chain
14. **Swimlanes** — Rows by assignee or sprint
15. **Compact Mode** — Hide all badges/metadata
16. **Heatmap (Due Date)** — Color nodes by urgency
17. **Heatmap (Priority)** — Color nodes by priority
18. **Heatmap (Story Points)** — Color nodes by effort
19. **Presentation Mode** — Step through nodes, centered, full-screen

### Node Metadata & Properties
- Status, Priority, Story Points, Issue Type
- Assignee, Tags (multi-value), Due Date, Sprint
- Jira Key, Node Key (auto-generated)
- Notes (markdown), URL, Alias (subtitle)
- Comments (threaded), Reactions (emoji per user)
- Checklist (todo items within node)
- Time estimate + time logged (with timer)
- Custom icon, Image attachment
- Recurring flag, Locked flag
- Audit trail (field-level change history)
- Custom fields (project-level text/number definitions)

### CRM Pipeline
- 7-stage deal pipeline (lead → won/lost)
- Auto-probability by stage
- Multi-contact management per deal
- Activity logging (note, email, call, meeting, WhatsApp, SMS)
- Task management per deal
- Comment threads per deal
- Goals/targets by period
- Email templates (reusable)
- Follow-up reminders
- Deal-to-node linking (entity_links)
- Lost reason tracking
- LinkedIn URL storage
- Tag-based categorization
- Assigned-to field

### Jira Integration
- Connect with Jira Cloud credentials (email + API token)
- Fetch project issue types for depth mapping
- Fetch sprints (active + future)
- Bulk create tickets from tree (respects hierarchy)
- Import issues via JQL search
- Two-way status sync (push node status to Jira)
- Sprint assignment
- Story point mapping
- Priority mapping

### Collaboration
- Real-time multi-user editing
- Live cursor positions (colored per user)
- Role-based access control (admin/edit/view)
- Email invitations with 7-day expiry
- In-app notification bell for invites
- Accept/decline invites
- Member management panel
- Automatic reconnection (3s backoff)
- State reconciliation on rejoin

### Export & Import
- **PNG** — Canvas snapshot
- **SVG** — Vector export
- **PDF** — Via browser print dialog
- **CSV** — Flat table (compatible with Excel, Notion, Linear)
- **Confluence** — Wiki markup with panels and headings
- **Markdown** — Checkbox outline format
- **JSON** — Full project state (import/export)
- **Share Link** — Base64-encoded project state in URL
- **Text Paste** — Indented or bulleted text → tree nodes

### Templates (19 built-in)
**General**: Sprint Backlog, Product Roadmap, Feature Spec, Bug Triage, OKR Tree, SWOT Analysis, Meeting Notes, User Story Map, Risk Register, Stakeholder Map, Decision Tree, Retrospective, Knowledge Base, Onboarding Plan

**Operations**: SOP Builder, Vendor Management, Capacity Planning, Incident Postmortem, Change Management

**CRM & Sales**: Sales Playbook, Account Plan, Lead Qualification (BANT), Partnership Pipeline, Customer Success Plan

**Social Media Marketing**: Content Calendar, Campaign Planner, Influencer Outreach, Social Media Audit, Brand Launch Playbook

### Analytics & Admin
- Feature usage tracking (anonymous + authenticated)
- Session-based event grouping
- Feedback collection (1-5 rating, categories, free text)
- Admin dashboard: user stats, signup trends, feature usage
- Activity log with pagination and date filtering
- User management (search, toggle admin)
- Feedback moderation (view, filter, delete)

### Other
- Dark mode
- Webhook system (Slack-ready: node_created, status_change, comment_added, etc.)
- Activity log (in-memory, 200 entries)
- Snapshots (save/restore named project states)
- Auto-backup to localStorage (5-min interval)
- Command palette (Ctrl+P) for quick navigation
- Find & Replace (Ctrl+H) across all nodes
- Global search (Ctrl+K) across projects
- Chatbot widget (FAQ-based help)
- Feedback widget (always-on button)
- Onboarding tutorial (first-time user modal)
- `crypto.randomUUID` polyfill for non-HTTPS contexts

---

## Environment Variables

### Server (.env)
```
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/chart_to_jira
JWT_SECRET=<random-secret>
CLIENT_URL=http://localhost:5173       # For CORS + email links
SMTP_HOST=                             # Optional — blank = console log emails
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@chart-to-jira.com
```

### Client (.env)
```
VITE_API_URL=                          # Empty = same origin (production)
                                       # http://localhost:3001 for local dev with separate server
```

---

## Running Locally

```bash
# Terminal 1 — Server
cd server
cp .env.example .env                   # Edit DATABASE_URL, JWT_SECRET
npm install
npm run dev                            # nodemon, port 3001

# Terminal 2 — Client
cd client
npm install
npm run dev                            # Vite, port 5173

# Or from root:
npm run dev:server                     # cd server && npm run dev
npm run dev:client                     # cd client && npm run dev
```

### Production Build
```bash
cd client && npm run build             # Outputs to client/dist/
# Server serves client/dist as static files in production
```

---

## Deployment (DigitalOcean)

- **Nginx** reverse proxy on port 8080 routes to Node.js on port 3001
- **PM2** manages the Node process (`pm2 start server/index.js --name bahnos`)
- Frontend is pre-built (`client/dist/`) and served by Express static middleware
- PostgreSQL runs locally on the droplet
- Coexists with another app (mytowntutor.com) on port 80/443 via separate Nginx server block

---

## Key Architectural Decisions

1. **JSONB for tree state**: Entire project state (all maps, nodes, edges, groups) stored as one JSONB column. Enables atomic reads/writes but means no SQL queries on individual nodes.

2. **Client-side layout computation**: Node x/y positions are computed by `useTree` hook (Reingold-Tilford algorithm). Positions are stored in nodes for persistence but recomputed on layout changes.

3. **Event bus for cross-module communication**: CRM ↔ Canvas communication uses a lightweight pub/sub rather than prop drilling or global state, keeping modules decoupled.

4. **Soft deletes on entity_links**: Links use `deleted_at` instead of hard delete, enabling restore and audit trail without losing relationship history.

5. **WebSocket rooms with in-memory state cache**: `roomStates` map holds latest state per active room, avoiding DB reads on every action. State is persisted via periodic `state_sync` messages.

6. **Dual persistence**: localStorage for offline/fast access + PostgreSQL for durability and collaboration. On collab join, server state wins (source of truth).

7. **No Redux**: All state management is via `useReducer` in custom hooks, passed through props and context. Keeps bundle small and avoids boilerplate.

8. **UUID generation client-side**: Project and node IDs are UUIDs generated in the browser (`crypto.randomUUID()`), enabling offline-first creation without server round-trips.

9. **Nullish coalescing for API URLs**: Uses `??` not `||` so that `VITE_API_URL=""` (empty string = same origin) works correctly in production where frontend and API share a host.

10. **Role enforcement at WebSocket level**: The collaboration server checks role before broadcasting actions. View-only users can't send mutations even if they modify client code.
