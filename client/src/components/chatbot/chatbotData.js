export const BOT_TREE = {
  root: {
    message: "Hi there! 👋 I'm **BahnBot**, your guide to bahnOS.\n\nWhat can I help you with today?",
    options: [
      { label: '🚀 Getting started', next: 'getting_started' },
      { label: '🗺️ Canvas & nodes', next: 'canvas' },
      { label: '🎫 Jira integration', next: 'jira' },
      { label: '👥 Collaboration', next: 'collab' },
      { label: '📊 Views & charts', next: 'views' },
      { label: '📤 Export & import', next: 'export' },
      { label: '💼 CRM Pipeline', next: 'crm' },
      { label: '📋 Templates', next: 'templates' },
      { label: '✨ Features', next: 'features' },
      { label: '🗺️ Roadmap', next: 'roadmap' },
      { label: 'ℹ️ About bahnOS', next: 'about' },
      { label: '⌨️ Keyboard shortcuts', next: 'shortcuts' },
      { label: '👤 Account & settings', next: 'account' },
    ],
  },

  // ── GETTING STARTED ────────────────────────────────────────────────────────
  getting_started: {
    message: "Let's get you started! What would you like to know?",
    options: [
      { label: 'What is bahnOS?', next: 'what_is_bahnos' },
      { label: 'How do I create my first map?', next: 'create_first_map' },
      { label: 'Guest vs registered account', next: 'guest_vs_account' },
      { label: 'Projects vs maps — what\'s the difference?', next: 'projects_vs_maps' },
    ],
  },
  what_is_bahnos: {
    message: "**bahnOS** is a visual project planning tool that turns mind maps into Jira tickets.\n\n• Build tree-structured mind maps on an infinite canvas\n• Add metadata: assignees, due dates, story points, priority\n• Push the whole tree directly to Jira with one click\n• Collaborate in real-time with your team\n• Visualize work as Kanban, Gantt, Burndown, and more",
    options: [{ label: 'How do I create my first map?', next: 'create_first_map' }],
  },
  create_first_map: {
    message: "Creating your first map is simple:\n\n1. Sign in (or continue as a guest)\n2. On the home screen click **New Project**\n3. Your project opens with a blank canvas and a root node\n4. Click the **+** button on any node to add children\n5. Double-click a node to edit its name\n6. Press **Tab** to add a child, **Enter** to add a sibling",
    options: [],
  },
  guest_vs_account: {
    message: "**Guest mode:**\n• No sign-up needed\n• Work is saved locally in your browser\n• Cannot collaborate or sync with Jira\n• Data may be lost if browser is cleared\n\n**Registered account:**\n• Data saved to the cloud\n• Full collaboration features\n• Access from any device\n• Jira integration available",
    options: [],
  },
  projects_vs_maps: {
    message: "**Projects** are the top-level container — like a folder.\n\n**Maps** live inside a project. One project can have multiple maps (e.g. \"Sprint 1\", \"Sprint 2\", \"Backlog\").\n\nYou can share an entire project with collaborators, or share just a single map for focused access.",
    options: [],
  },

  // ── CANVAS & NODES ─────────────────────────────────────────────────────────
  canvas: {
    message: "What do you want to know about the canvas?",
    options: [
      { label: 'Adding & editing nodes', next: 'add_edit_node' },
      { label: 'Moving & connecting nodes', next: 'move_nodes' },
      { label: 'Zooming & panning', next: 'zoom_pan' },
      { label: 'Node properties & metadata', next: 'node_properties' },
      { label: 'Search & filter', next: 'search_filter' },
      { label: 'Locking & deleting nodes', next: 'lock_delete' },
      { label: 'Undo & redo', next: 'undo_redo' },
      { label: 'Collapse & expand nodes', next: 'collapse_expand' },
      { label: 'Auto layout', next: 'auto_layout' },
      { label: 'Snap to grid', next: 'snap_grid' },
    ],
  },
  add_edit_node: {
    message: "**Adding nodes:**\n• Click **+** on any node → adds a child\n• Press **Tab** while a node is selected → add child\n• Press **Enter** → add sibling below\n• Drag from a node's edge to create a connected node\n\n**Editing nodes:**\n• Double-click a node to edit its label\n• Press **F2** to rename the selected node\n• Click outside or press **Escape** to confirm",
    options: [],
  },
  move_nodes: {
    message: "**Moving nodes:**\n• Drag any node to reposition it on the canvas\n• Hold **Shift** and drag to move a node along with all its children\n• Drag a node onto another node to reparent it\n\n**Dependency arrows:**\n• Drag from a node's edge handle to another node\n• Click an arrow then press **Delete** to remove it",
    options: [],
  },
  zoom_pan: {
    message: "**Zoom:**\n• Scroll wheel / trackpad pinch to zoom in and out\n• Use **−** and **+** buttons in the toolbar\n• Press **F** to fit all nodes to the screen\n• Click the zoom % in the toolbar to type an exact value\n\n**Pan:**\n• Click and drag on empty canvas space\n• Middle-click and drag",
    options: [],
  },
  node_properties: {
    message: "Click any node to open the **Properties Panel** on the right. You can set:\n\n• **Assignee** — team member responsible\n• **Due date** — deadline\n• **Priority** — Critical / High / Medium / Low\n• **Story points** — effort estimate\n• **Status** — workflow state (To Do, In Progress, Done…)\n• **Labels & tags**\n• **Description** — rich text notes\n• **Jira link** — auto-filled after pushing to Jira",
    options: [],
  },
  search_filter: {
    message: "**Search:**\n• Press **/** to open the search bar\n• Type to highlight matching nodes live\n• Press Enter to jump to the next match\n\n**Filter:**\n• Click the filter icon in the toolbar\n• Filter by assignee, priority, status, due date, or labels\n• Active filters show a **blue dot** on the filter button\n• Filtered-out nodes are dimmed on the canvas",
    options: [],
  },
  lock_delete: {
    message: "**Locking a node:**\n• Select a node → open the **Tools** menu → click **Lock node**\n• Locked nodes cannot be moved or edited accidentally\n• A lock icon appears; click **Unlock node** to release\n\n**Deleting:**\n• Select a node → press **Delete** or **Backspace**\n• Deleting a parent removes all its children too\n• Use **Undo (⌘Z)** immediately if accidental",
    options: [],
  },
  undo_redo: {
    message: "**Undo:** Press **⌘Z** (Mac) or **Ctrl+Z** (Windows)\n**Redo:** Press **⌘⇧Z** or **Ctrl+Y**\n\nThe toolbar also has Undo/Redo buttons at the far left.\n\nNote: undo history is per-session — refreshing the page clears it.",
    options: [],
  },
  collapse_expand: {
    message: "**Collapse/Expand nodes** to hide subtrees and reduce clutter:\n\n• Click the **arrow/chevron** on a node that has children\n• Or use the **Organize** menu in the toolbar:\n  – **Collapse all** — fold every subtree\n  – **Expand all** — unfold everything\n  – **Collapse depth 1/2/3** — fold to a specific level\n\nCollapsed nodes show a badge with the child count.",
    options: [],
  },
  auto_layout: {
    message: "**Auto layout** automatically arranges all nodes into a clean tree:\n\n• Open the **Organize** menu in the toolbar → **Auto layout**\n• Or try **Mind map layout** for a radial arrangement\n• Enable **Auto-layout on add** to rearrange automatically whenever you add a new node\n\nAuto layout can be undone with **⌘Z**.",
    options: [],
  },
  snap_grid: {
    message: "**Snap to grid** makes nodes align to an invisible grid as you drag them:\n\n• Open the **Organize** menu → toggle **Snap to grid**\n• Helps keep the canvas tidy when manually positioning nodes\n• Toggle it off for freeform placement",
    options: [],
  },

  // ── JIRA ───────────────────────────────────────────────────────────────────
  jira: {
    message: "What do you need help with for Jira?",
    options: [
      { label: 'How do I connect Jira?', next: 'connect_jira' },
      { label: 'Create Jira tickets from nodes', next: 'create_tickets' },
      { label: 'Two-way sync', next: 'two_way_sync' },
      { label: 'Import issues with JQL', next: 'jql_import' },
    ],
  },
  connect_jira: {
    message: "To connect your Jira account:\n\n1. Click the **Jira** button in the top toolbar\n2. Enter your:\n   • **Jira domain** (e.g. yourcompany.atlassian.net)\n   • **Email address**\n   • **API token** — generate one at id.atlassian.com → Security → API tokens\n3. Click **Connect**\n4. Select your **project** from the dropdown\n\nYour connection is saved for the session.",
    options: [],
  },
  create_tickets: {
    message: "Once connected to Jira:\n\n1. Build your node tree on the canvas\n2. Open the **Jira panel** (toolbar → Jira icon)\n3. Click **Push to Jira** / **Create tickets**\n4. All nodes with labels are created as Jira issues\n5. Parent-child relationships become Epic → Story → Subtask\n6. Story points, assignees, and due dates are mapped automatically",
    options: [],
  },
  two_way_sync: {
    message: "**Two-way sync** keeps canvas and Jira in sync:\n\n• Changes in Jira (status, assignee) pull back into your nodes\n• Canvas changes push to Jira\n• Click **Sync** in the Jira panel to refresh\n• Synced nodes show a **Jira icon** — click it to open the ticket in Jira",
    options: [],
  },
  jql_import: {
    message: "Import existing Jira issues using **JQL**:\n\n1. Open the Jira panel → **Import from JQL**\n2. Enter a query, e.g.:\n   `project = MYPROJ AND sprint = \"Sprint 5\"`\n3. Click **Import** — matching issues appear as nodes\n4. The hierarchy is preserved (Epics → Stories → Subtasks)",
    options: [],
  },

  // ── COLLABORATION ──────────────────────────────────────────────────────────
  collab: {
    message: "What do you need help with for collaboration?",
    options: [
      { label: 'Share a whole project', next: 'share_project' },
      { label: 'Share a single map', next: 'share_map' },
      { label: 'Roles & permissions', next: 'roles' },
      { label: 'Inviting members', next: 'invite_members' },
      { label: 'Real-time editing', next: 'realtime' },
    ],
  },
  share_project: {
    message: "To share an entire project:\n\n1. Open the **Projects** panel (top-left icon)\n2. Hover your project → click **Share**\n3. Click **Share whole project (N maps)**\n4. The collaborators dialog opens — copy the invite link or send by email\n5. All maps in the project are accessible to members",
    options: [],
  },
  share_map: {
    message: "To share just one specific map:\n\n1. Open the **Projects** panel\n2. Make sure you're viewing the map you want to share\n3. Click **Share this map only**\n4. An invite link is generated for that map alone\n5. Collaborators only see this map, not the whole project",
    options: [],
  },
  roles: {
    message: "There are 3 collaboration roles:\n\n• **Admin** — full control: edit, invite others, remove members, delete project\n• **Edit** — can edit all nodes, push to Jira, add/remove nodes\n• **View** — read-only: can see all nodes and live updates but cannot change anything",
    options: [],
  },
  invite_members: {
    message: "To invite members:\n\n1. Open the **Collaborators** dialog (people icon in toolbar)\n2. Copy the **invite link** and share it with teammates\n3. When they open the link and sign in, they join with **Edit** role by default\n4. You can change their role or remove them at any time from the dialog",
    options: [],
  },
  realtime: {
    message: "Real-time collaboration works automatically once a project is shared:\n\n• All connected users see changes instantly\n• A presence bar shows who is currently in the map\n• Node edits, new nodes, and deletions sync live across all sessions\n• If two users edit the same node simultaneously, the last save wins",
    options: [],
  },

  // ── VIEWS ──────────────────────────────────────────────────────────────────
  views: {
    message: "Which view would you like to know about?",
    options: [
      { label: 'Kanban board', next: 'kanban' },
      { label: 'Gantt chart', next: 'gantt' },
      { label: 'Burndown chart', next: 'burndown' },
      { label: 'Sprint board', next: 'sprint' },
      { label: 'Swimlanes', next: 'swimlanes' },
      { label: 'Critical path', next: 'critical_path' },
      { label: 'Heatmaps', next: 'heatmap' },
      { label: 'Minimap', next: 'minimap' },
      { label: 'Compact mode', next: 'compact_mode' },
    ],
  },
  kanban: {
    message: "**Kanban view** organizes nodes as cards in columns by status.\n\n• Open via **View** menu → **Kanban**\n• Columns match your workflow states (To Do, In Progress, Review, Done)\n• Drag cards between columns to update status\n• The canvas updates in sync\n• Filter by assignee or priority using the filter bar",
    options: [],
  },
  gantt: {
    message: "**Gantt chart** shows nodes on a timeline.\n\n• Open via **View** → **Gantt chart**\n• Nodes with start + due dates appear as horizontal bars\n• Bar length = duration, position = start date\n• Dependencies appear as arrows between bars\n• Scroll horizontally to navigate the timeline",
    options: [],
  },
  burndown: {
    message: "**Burndown chart** tracks remaining work over time.\n\n• Open via **View** → **Burndown chart**\n• Shows total story points remaining per day in the sprint\n• The ideal line shows the target burn pace\n• Useful for daily standups and sprint retrospectives",
    options: [],
  },
  sprint: {
    message: "**Sprint board** groups nodes by sprint.\n\n• Open via **View** → **Sprint Board**\n• Nodes assigned to a sprint appear in their sprint column\n• Unassigned nodes appear in the Backlog\n• Drag nodes between sprints to reschedule work",
    options: [],
  },
  swimlanes: {
    message: "**Swimlanes** organize nodes in horizontal rows by assignee.\n\n• Open via **View** → **Swimlanes**\n• Each row = one team member\n• Useful for visualizing workload distribution across the team\n• Drag nodes between rows to reassign them",
    options: [],
  },
  critical_path: {
    message: "**Critical path** highlights the longest dependency chain in your project.\n\n• Open via **View** → **Critical path**\n• Nodes on the critical path are highlighted in orange/red\n• These tasks directly control the project end date\n• Focus here first to avoid delays",
    options: [],
  },
  heatmap: {
    message: "**Heatmaps** color-code nodes based on a chosen metric:\n\n• **Due date** — red = overdue, yellow = due soon, green = on track\n• **Priority** — red = Critical → gray = Low\n• **Story points** — darker color = more points\n\nSwitch between them via **View** → **Heatmap: due date / priority / story points**",
    options: [],
  },
  minimap: {
    message: "**Minimap** shows a bird's-eye overview of the entire canvas.\n\n• Toggle via **View** → **Minimap**\n• Appears as a small panel in a corner of the canvas\n• Click anywhere on the minimap to jump to that area instantly\n• The highlighted rectangle shows your current viewport",
    options: [],
  },
  compact_mode: {
    message: "**Compact mode** reduces node size and spacing so more fits on screen.\n\n• Toggle via **View** → **Compact mode**\n• Useful when working with very large trees\n• Node labels are shorter; properties are hidden until you click",
    options: [],
  },

  // ── EXPORT & IMPORT ────────────────────────────────────────────────────────
  export: {
    message: "What do you want to export or import?",
    options: [
      { label: 'Export as PNG image', next: 'export_png' },
      { label: 'Export as SVG', next: 'export_svg' },
      { label: 'Export as CSV', next: 'export_csv' },
      { label: 'Export as Markdown', next: 'export_markdown' },
      { label: 'Export for Confluence', next: 'export_confluence' },
      { label: 'Copy share link', next: 'share_link' },
      { label: 'Import from CSV', next: 'import_csv' },
    ],
  },
  export_png: {
    message: "To export the canvas as a **PNG image**:\n\n1. Open the **Export** menu in the toolbar\n2. Click **Export PNG**\n3. The entire canvas is captured and downloaded as a .png file\n4. Perfect for presentations, docs, or sharing with stakeholders",
    options: [],
  },
  export_svg: {
    message: "To export as **SVG** (scalable vector):\n\n1. Open the **Export** menu → **Export SVG**\n2. SVG files are infinitely scalable — great for large prints or editing\n3. Can be opened and modified in Figma, Illustrator, or any vector editor",
    options: [],
  },
  export_csv: {
    message: "To export as **CSV spreadsheet**:\n\n1. Open the **Export** menu → **Export CSV**\n2. Each node becomes a row with columns:\n   ID, Label, Parent, Assignee, Due Date, Priority, Story Points, Status\n3. Open in Excel, Google Sheets, or import into other tools",
    options: [],
  },
  export_markdown: {
    message: "To export as a **Markdown outline**:\n\n1. Open the **Export** menu → **Markdown outline**\n2. The tree is converted to a nested Markdown list\n3. Paste into Notion, GitHub README, Obsidian, or any Markdown editor",
    options: [],
  },
  export_confluence: {
    message: "To export as **Confluence markup**:\n\n1. Open the **Export** menu → **Confluence markup**\n2. The tree is formatted as Confluence wiki markup\n3. Paste directly into a Confluence page\n4. Preserves hierarchy as indented bullet lists with metadata",
    options: [],
  },
  share_link: {
    message: "To create a **shareable link**:\n\n1. Open the **Export** menu → **Copy share link**\n2. A link is copied to your clipboard\n3. Share it with teammates — they need to be invited collaborators to edit\n4. View-only members can open the link to see the map",
    options: [],
  },
  import_csv: {
    message: "To **import from CSV**:\n\n1. Open the **Export** menu → **Import CSV**\n2. Select your CSV file\n3. Required columns: **Label** (node name), **Parent** (parent label or ID)\n4. Optional: Assignee, Due Date, Priority, Story Points, Status\n5. Nodes are created automatically as a tree on the canvas",
    options: [],
  },

  // ── CRM ────────────────────────────────────────────────────────────────────
  crm: {
    message: "**CRM Pipeline** is built right into bahnOS — a full sales pipeline with 20+ features. No HubSpot needed.\n\nWhat would you like to know?",
    options: [
      { label: 'What is the CRM?', next: 'crm_what' },
      { label: 'How do I open the CRM?', next: 'crm_open' },
      { label: 'Creating a new deal', next: 'crm_new_deal' },
      { label: 'Pipeline stages explained', next: 'crm_stages' },
      { label: 'Moving deals & lost reasons', next: 'crm_move' },
      { label: 'Contacts per deal', next: 'crm_contacts' },
      { label: 'Activity log & notes', next: 'crm_activity' },
      { label: 'Tasks & follow-up reminders', next: 'crm_tasks' },
      { label: 'Analytics & charts', next: 'crm_analytics' },
      { label: 'Deal fields & metadata', next: 'crm_fields' },
      { label: 'Pipeline stats bar', next: 'crm_stats' },
    ],
  },
  crm_what: {
    message: "The **CRM Pipeline** is a complete sales tracker inside bahnOS with 20 features:\n\n• Kanban board, List table, and Analytics views\n• Deal aging alerts (yellow/red when stale)\n• Deal score (value × probability)\n• Stage time tracker with benchmarks\n• Multiple contacts per deal\n• Activity timeline (emails, calls, meetings, notes)\n• Task/reminder system with due dates\n• Follow-up reminder badges\n• Lost reason tagging\n• Company profile page\n• LinkedIn URL field\n• Duplicate deal detector\n• Win/loss analysis charts\n• Monthly revenue bar chart\n• Sales velocity stats\n• Link deals to canvas nodes\n\nAll free, all inside bahnOS.",
    options: [{ label: 'How do I open it?', next: 'crm_open' }],
  },
  crm_open: {
    message: "There are 3 ways to open the CRM:\n\n1. **From the canvas** — click the **CRM** button in the top navigation bar\n2. **From the user menu** — click your avatar (top-right) → **CRM Pipeline**\n3. **Direct URL** — go to **/crm** in your browser\n\nThe CRM is a protected page — you need to be signed in to use it.",
    options: [],
  },
  crm_new_deal: {
    message: "To create a new deal:\n\n1. Click **+ New Deal** (top-right) or **+ Add** at the bottom of any stage column\n2. Fill in the required fields:\n   • **Company name** (required — checked for duplicates)\n   • Contact name & email\n   • Deal value ($) and probability slider\n   • Stage, expected close date, next action, notes\n3. Click **▼ More options** for advanced fields:\n   • LinkedIn URL, follow-up date, canvas node ID\n4. Click **Create Deal**\n\n💡 A duplicate warning appears if the same company already has an open deal.",
    options: [],
  },
  crm_stages: {
    message: "The pipeline has **7 stages** with colour-coding and default probabilities:\n\n• ⚫ **Lead** (10%) — First contact\n• 🔵 **Qualified** (25%) — Budget/need confirmed\n• 🟣 **Demo** (40%) — Demo scheduled/delivered\n• 🟢 **Proposal** (60%) — Quote sent\n• 🟡 **Negotiation** (80%) — Actively negotiating\n• ✅ **Won** (100%) — Closed successfully\n• ❌ **Lost** (0%) — Deal lost\n\nEach card shows **stage time** (days in current stage vs. benchmark average). Cards turn yellow after 7 days of no updates, red after 14 days.",
    options: [],
  },
  crm_move: {
    message: "**Drag and drop** to move deals between stages:\n\n1. Click and hold any deal card\n2. Drag it to the target stage column — it highlights when hovering\n3. Drop it — probability and stage_entered_at update automatically\n\n**Moving to Lost** opens a popup asking for a **lost reason** (e.g. \"Budget\", \"Competition\"). This is optional but helps the win/loss analysis chart.\n\nYou can also change the stage via the Edit modal's Stage dropdown.",
    options: [],
  },
  crm_contacts: {
    message: "Each deal can have **multiple contacts**.\n\nTo add contacts:\n1. Click any deal card to open the right-side panel\n2. Go to the **Contacts** tab\n3. Click **+ Add Contact** and fill in: Name, Email, Phone, Role\n4. Mark one contact as **Primary**\n\nContacts are separate from the main deal's contact fields — use this for deals with multiple stakeholders (CEO, CFO, technical champion, etc.).",
    options: [],
  },
  crm_activity: {
    message: "The **Activity** tab on each deal's panel logs all interactions:\n\n**Types:**\n• 📝 **Note** — general notes or meeting summaries\n• 📧 **Email** — paste or summarise email conversations\n• 🤝 **Meeting** — structured meeting notes\n• 📞 **Call** — call summaries\n\n**To log an activity:**\n1. Open any deal → **Activity** tab\n2. Click **+ Log Activity**\n3. Select the type, add a title and details\n4. Set the date (defaults to today)\n5. Click **Save**\n\nActivities appear in reverse-chronological order.",
    options: [],
  },
  crm_tasks: {
    message: "Each deal has a **Tasks** tab for to-dos and follow-ups:\n\n**To add a task:**\n1. Open a deal → **Tasks** tab\n2. Click **+ Add Task**\n3. Enter a title and optional due date\n4. Click **Add Task**\n\n**Features:**\n• Check off tasks when done (strikethrough)\n• Overdue tasks show a red ⚠ warning\n• The Tasks tab badge shows pending count and a 🔴 if any are overdue\n• **Follow-up date** — set on the deal itself (in More options) to get a badge on the Kanban card\n\nFollow-ups due today or overdue also count in the **Follow-ups Due** stat at the top.",
    options: [],
  },
  crm_analytics: {
    message: "Click **▲ Analytics** in the top bar to see:\n\n**Charts & metrics:**\n• **Monthly Revenue Won** — bar chart of closed deal value for the last 6 months\n• **Win/Loss Analysis** — win rate broken down by deal size buckets (< $10K, $10K–$50K, > $50K)\n• **Lost Reasons** — frequency breakdown of why deals were lost\n• **Sales Velocity** — avg days to win, active deals, weighted forecast, avg deal size\n• **My Performance** — won deals and revenue for This Month, Last Month, This Quarter\n• **Pipeline by Stage** — deal count and value per stage\n\nAll charts are computed live from your deal data — no setup needed.",
    options: [],
  },
  crm_fields: {
    message: "**Main fields** (shown in the edit modal):\n• Company name (required), Contact name, Contact email\n• Deal value ($), Stage, Probability (slider)\n• Expected close date, Last contact date\n• Next action (orange tag on card), Notes\n• Lost reason (appears when stage = Lost)\n\n**Advanced fields** (click ▼ More options):\n• **LinkedIn URL** — shown as 'in' badge on card\n• **Follow-up date** — reminder badge on card when due\n• **Canvas Node ID** — links deal to a node on the canvas\n\n**Auto-computed fields (not editable):**\n• **Deal score** — value × probability / 100 (shown as weighted value)\n• **Stage time** — days in current stage vs. benchmark\n• **Aging** — days since last update (turns card yellow/red)",
    options: [],
  },
  crm_edit: {
    message: "**To edit a deal:**\n1. Open any deal's right panel → click **Edit**\n   — or click the deal card to open the panel first\n2. The modal opens with all fields pre-filled\n3. Make changes and click **Save Changes**\n\n**To delete a deal:**\n1. In the edit modal, click **Delete** (top-right)\n2. Confirm in the dialog — deletion is permanent\n\n**To view the company profile:**\nClick the company name (underlined) in the deal panel header to see all deals for that company with combined stats.",
    options: [],
  },
  crm_stats: {
    message: "The **stats bar** below the top nav shows 6 live metrics:\n\n• **Pipeline** — total value of all active deals\n• **Forecast** — weighted pipeline (value × probability for each deal)\n• **Won This Month** — count and value of deals won this month\n• **Win Rate** — Won ÷ (Won + Lost) as a percentage\n• **Follow-ups Due** — deals with a follow-up date today or overdue (shown in red)\n• **Avg Close (days)** — average days from deal creation to won\n\nAll stats update instantly in real time.",
    options: [],
  },

  // ── TEMPLATES ─────────────────────────────────────────────────────────────
  templates: {
    message: "bahnOS has **40+ ready-made templates** across 8 categories.\n\nBrowse them at **/templates** or pick a category below to find the right one:",
    options: [
      { label: '🏢 Startup templates', next: 'tmpl_startup' },
      { label: '🏃 Engineering templates', next: 'tmpl_engineering' },
      { label: '🗺️ Product templates', next: 'tmpl_product' },
      { label: '📅 Marketing templates', next: 'tmpl_marketing' },
      { label: '👥 Team templates', next: 'tmpl_team' },
      { label: '🎨 Design templates', next: 'tmpl_design' },
      { label: '🧩 Strategy templates', next: 'tmpl_strategy' },
      { label: '💡 Personal templates', next: 'tmpl_personal' },
      { label: 'How do I use a template?', next: 'tmpl_how' },
    ],
  },
  tmpl_how: {
    message: "Using a template is simple:\n\n1. Go to the **Templates** page (top nav or **/templates**)\n2. Browse or search by name/category\n3. Click **Use template →** on any card\n4. If you're not signed in, you'll be prompted to log in or continue as guest\n5. The template loads onto a fresh canvas in the app\n6. Rename nodes and fill in your own content — the structure is yours to modify\n\nYou can also save your own canvas as a custom template from the Export menu → **Project templates**.",
    options: [],
  },
  tmpl_startup: {
    message: "**Startup templates (8 total):**\n\n🎤 **Pitch Deck Outline** — Problem, solution, market, business model, traction, team, and ask — structured for investors\n\n🏢 **Business Model Canvas** — Nine-block canvas: value prop, channels, revenue streams, cost structure\n\n💸 **Sales Pipeline** — Track leads from first touch to closed deal: qualified → demo → proposal → closed won\n\n📆 **Quarterly Planning** — OKRs mapped to workstreams with owners, milestones, and success criteria for a 13-week cycle\n\n📈 **KPI Dashboard** — Growth, product, revenue, and ops metrics for weekly review\n\n👥 **Hiring Pipeline** — Track candidates through sourcing, screening, interviews, offer, and onboarding\n\n💰 **Fundraising Tracker** — Track investors through intro → meeting → due diligence → term sheet → close\n\n🛫 **Budget & Runway Planner** — Monthly burn, revenue, headcount costs, and runway calculation",
    options: [],
  },
  tmpl_engineering: {
    message: "**Engineering templates (8 total):**\n\n🏃 **Sprint Planning** — Ready-made sprint board with user stories, tasks, and story point tracking\n\n✨ **Feature Breakdown** — Single feature split into epics, stories, and tasks across UX, backend, frontend, and QA\n\n🐛 **Bug Triage Board** — Prioritized bug tracking with critical, high, and low severity lanes\n\n🚀 **Release Planning** — Everything that needs to happen before a version ships\n\n🚨 **Incident Response** — Structured runbook for triaging, resolving, and learning from outages\n\n🔧 **Tech Debt Tracker** — Categorize and prioritize technical debt by area, impact, and effort\n\n🏗️ **System Architecture** — Frontend, backend, database, and infra layers with services and data flows\n\n✅ **Deployment Checklist** — Pre-deploy, deploy, and post-deploy steps with rollback triggers\n\n🔌 **API Design** — Endpoint tree with methods, auth layers, and request/response flows",
    options: [],
  },
  tmpl_product: {
    message: "**Product templates (7 total):**\n\n🗺️ **Product Roadmap** — Quarterly roadmap with themes, epics, and prioritized feature lanes\n\n🎯 **OKR Planning** — Objectives and key results mapped to initiatives and owners\n\n📣 **Go-to-Market Plan** — Launch checklist covering positioning, channels, and milestones\n\n🗂️ **User Story Map** — Map user journeys to activities, tasks, and release slices\n\n📊 **Competitive Analysis** — Side-by-side comparison of competitors across key dimensions\n\n⚖️ **Feature Prioritization** — Score features by impact, effort, and confidence to build a data-driven backlog\n\n📄 **PRD Template** — Problem statement, goals, user stories, scope, non-goals, and success metrics",
    options: [],
  },
  tmpl_marketing: {
    message: "**Marketing templates:**\n\n📅 **Content Calendar** — Content pillars, channel schedule, topics, and publishing workflow for consistent output\n\nThis is the current marketing template. More marketing templates are coming — check the Roadmap for what's planned.",
    options: [],
  },
  tmpl_team: {
    message: "**Team templates (6 total):**\n\n🔄 **Sprint Retrospective** — What went well, what didn't, and what to improve next sprint\n\n⚠️ **Risk Register** — Identify, score, and assign mitigation strategies to project risks\n\n👋 **Team Onboarding** — Structured onboarding plan with milestones for new team members\n\n📝 **Decision Log** — Record architectural and product decisions with context and trade-offs\n\n📋 **Meeting Agenda** — Recurring meeting structure with agenda items, owners, and action tracking\n\n🤝 **1-on-1 Template** — Wins, blockers, growth goals, and feedback prompts for a weekly 1-on-1",
    options: [],
  },
  tmpl_design: {
    message: "**Design templates (4 total):**\n\n🎨 **Design Sprint** — Five-day sprint structure: understand, sketch, decide, prototype, test\n\n🧭 **Customer Journey Map** — Map touchpoints, emotions, and pain points across the user lifecycle\n\n🙋 **User Persona** — Demographics, goals, pain points, motivations, and behavioral patterns for your key users\n\n🔍 **UX Audit** — Heuristic evaluation across usability, accessibility, consistency, and delight",
    options: [],
  },
  tmpl_strategy: {
    message: "**Strategy templates (4 total):**\n\n🧩 **SWOT Analysis** — Strengths, weaknesses, opportunities, and threats mapped visually\n\n📋 **Project Charter** — Define scope, stakeholders, goals, and success criteria before kickoff\n\n⭐ **North Star Metric** — One key metric tied to input drivers, initiatives, and weekly review — aligns the whole team\n\nMore strategy templates are in progress — check the Roadmap.",
    options: [],
  },
  tmpl_personal: {
    message: "**Personal templates (5 total):**\n\n💡 **Personal Project Plan** — Break a side project into phases, tasks, and milestones with a simple solo workflow\n\n📚 **Study Roadmap** — Curriculum, resources, milestones, and practice exercises for learning a new skill\n\n💼 **Job Search Tracker** — Track companies, application status, contacts, interview prep, and offers in one map\n\n✏️ **Essay / Report Outline** — Introduction, arguments, evidence, counterarguments, and conclusion with writing prompts\n\n🗓️ **Weekly Review** — Wins, open loops, top 3 priorities, habit tracker, and energy check (GTD-style)",
    options: [],
  },

  // ── FEATURES PAGE ─────────────────────────────────────────────────────────
  features: {
    message: "bahnOS is built around 6 core capability areas. What would you like to know more about?",
    options: [
      { label: 'Mind mapping & canvas', next: 'feat_canvas' },
      { label: 'Multiple project views', next: 'feat_views' },
      { label: 'Jira integration', next: 'feat_jira' },
      { label: 'Real-time collaboration', next: 'feat_collab' },
      { label: 'Charts & analytics', next: 'feat_analytics' },
      { label: 'Export & sharing', next: 'feat_export' },
      { label: 'Full feature list', next: 'feat_all' },
      { label: 'Is bahnOS free?', next: 'feat_pricing' },
    ],
  },
  feat_canvas: {
    message: "**Mind mapping & canvas:**\n\nbahnOS gives you an infinite, drag-and-drop canvas for building visual trees:\n\n• Drag-and-drop nodes with free-form edges\n• Custom shapes, color coding, and sticky notes\n• Collapsible frames to hide subtrees\n• One-click auto-layout and mind map (radial) layout\n• Snap to grid for clean alignment\n• Deep undo/redo history\n• Node templates for repeatable structures",
    options: [],
  },
  feat_views: {
    message: "**Multiple project views:**\n\nAll views are driven by the same underlying data — no duplication:\n\n• **Kanban** — status-based card board\n• **Gantt** — timeline with dependency arrows\n• **Sprint Board** — work organized by sprint\n• **Burndown** — story points remaining per day\n• **Swimlanes** — rows by assignee\n• **Critical Path** — highlight the longest dependency chain\n• **Priority/Due Date/Story Points heatmaps**\n\nSwitch between views with zero data loss.",
    options: [],
  },
  feat_jira: {
    message: "**Jira integration:**\n\nbahnOS connects directly to your Jira project:\n\n• Push nodes to Jira as issues (Epic → Story → Subtask)\n• Pull Jira issues back via JQL query\n• Two-way sync: status changes in Jira reflect on canvas\n• Story points, assignees, and due dates mapped automatically\n• Click any synced node to open the ticket in Jira",
    options: [],
  },
  feat_collab: {
    message: "**Real-time collaboration:**\n\nCollaboration is built into the core — not a bolt-on:\n\n• WebSocket sync — every teammate sees changes instantly\n• Live presence: see who is in the map right now\n• Role-based access: Admin, Edit, View\n• Share a whole project or just one specific map\n• Invite via link — no email required",
    options: [],
  },
  feat_analytics: {
    message: "**Charts & analytics:**\n\n• Velocity and burndown charts built in\n• Resource heatmaps (by assignee, priority, or due date)\n• Critical path highlighting\n• Statistics panel with per-project summaries\n• No separate BI tool needed — all driven by your node metadata",
    options: [],
  },
  feat_export: {
    message: "**Export & sharing:**\n\n• **PNG** — full canvas screenshot\n• **SVG** — scalable vector for design tools\n• **CSV** — spreadsheet with all node metadata\n• **Markdown** — nested list for Notion, GitHub, Obsidian\n• **Confluence markup** — paste directly into Confluence pages\n• **Shareable link** — read-only link for stakeholders",
    options: [],
  },
  feat_all: {
    message: "**Full feature list (everything is free):**\n\nUndo/Redo · Auto layout · Mind map layout · Snap to grid · Curved & straight edges · Edge labels · Collapsible frames · Sticky notes · Node templates · Custom metadata fields · Activity log · Named snapshots · Webhook triggers · Kanban board · Gantt chart · Sprint board · Burndown chart · Timeline view · Swimlanes · Critical path · Priority heatmap · Node checklists · Node locking · Groups · Real-time collaboration · Role-based access · Jira two-way sync · JQL import · PNG/SVG/CSV/Markdown/Confluence export · Project templates",
    options: [],
  },
  feat_pricing: {
    message: "**bahnOS is completely free.**\n\nEvery feature — including real-time collaboration, Jira sync, all views, and all exports — is available on the free plan with no paywalls or upgrade prompts.\n\nA Pro plan with higher collaborator limits and export quotas is planned for **Q3 2026** (see Roadmap). The free tier will always remain generous.",
    options: [],
  },

  // ── ROADMAP ───────────────────────────────────────────────────────────────
  roadmap: {
    message: "Here's what's happening on the bahnOS roadmap. What do you want to know?",
    options: [
      { label: '🔄 Q2 2026 — In progress', next: 'roadmap_q2' },
      { label: '📅 Q3 2026 — Planned', next: 'roadmap_q3' },
      { label: '🔮 Q4 2026 — Planned', next: 'roadmap_q4' },
      { label: '✅ Already shipped', next: 'roadmap_shipped' },
      { label: 'Can I suggest a feature?', next: 'roadmap_suggest' },
    ],
  },
  roadmap_q2: {
    message: "**Q2 2026 — Currently in progress:**\n\n🔍 **Global search across maps** — Fuzzy-search all nodes across every project and map from a single hotkey\n\n👋 **Onboarding flow** — Guided first-use tour for new users with interactive tooltips and a sample project\n\n📋 **Public roadmap page** — Open roadmap so users always know what's coming (that's this page!)\n\nExpect these to ship before end of June 2026.",
    options: [],
  },
  roadmap_q3: {
    message: "**Q3 2026 — Planned:**\n\n💳 **Pricing & billing** — Self-serve Pro plan with higher collaborator limits and export quotas\n\n📎 **Node attachments** — Attach files and images directly to nodes, stored with your project data\n\n💬 **Two-way Slack sync** — Get notified in Slack when nodes are updated; reply in Slack to add a comment\n\n🤖 **AI layout suggestions** — One-click AI that rearranges and groups your nodes by theme using embeddings",
    options: [],
  },
  roadmap_q4: {
    message: "**Q4 2026 — Planned:**\n\n📱 **Mobile app (iOS & Android)** — Native mobile companion for viewing and editing maps on the go\n\n🐙 **GitHub integration** — Link nodes to GitHub issues and PRs; auto-update status when issues close\n\n🔷 **Custom node shapes** — Diamonds, hexagons, circles, and custom SVG shapes beyond rectangles\n\n📴 **Offline mode** — Full offline editing with automatic sync when you reconnect",
    options: [],
  },
  roadmap_shipped: {
    message: "**Already shipped ✅:**\n\n✅ Real-time collaboration — live cursors, presence avatars, and conflict-free multi-user editing\n\n✅ Jira two-way sync — push nodes to Jira, pull status updates back automatically\n\n✅ Sprint board & burndown — built-in sprint planning directly from your mind map\n\n✅ Gantt chart view — auto-generated from node due dates and dependencies\n\n✅ CSV / PNG / SVG export — export your map in multiple formats\n\n✅ 40+ project templates — ready-made structures for every team type\n\n✅ Webhook & Slack triggers — send notifications when nodes change",
    options: [],
  },
  roadmap_suggest: {
    message: "We'd love to hear your ideas! Here's how to suggest a feature:\n\n• Use the **Feedback** button in the app (coming soon — being built now)\n• The team reviews every suggestion — popular requests move up the roadmap\n\nYou can also see what's already planned on the **/roadmap** page and vote with your emoji reactions once that feature ships.",
    options: [],
  },

  // ── ABOUT ─────────────────────────────────────────────────────────────────
  about: {
    message: "What would you like to know about bahnOS?",
    options: [
      { label: 'The mission', next: 'about_mission' },
      { label: 'Why bahnOS was built', next: 'about_why' },
      { label: 'Core values', next: 'about_values' },
      { label: 'Integrations & ecosystem', next: 'about_integrations' },
      { label: 'Is it really free?', next: 'feat_pricing' },
    ],
  },
  about_mission: {
    message: "**Our mission:**\n\n*Great teams don't just track work. They see it, shape it, and ship it together.*\n\nbahnOS exists to close the gap between how teams think about work (visually, spatially, in relationships) and how they track it (flat lists, disconnected tools).\n\nThe goal: one canvas where your plan and your execution live in the same place — always in sync.",
    options: [],
  },
  about_why: {
    message: "**Why bahnOS was built:**\n\nbahnOS was born from a frustration every product team shares: the tool you sketch ideas in is never the tool you track them in.\n\nYou end up with:\n• A Miro board no one checks\n• A Jira backlog no one trusts\n• A Confluence page three sprints out of date\n\nbahnOS replaces that entire handoff with a single surface. Sketch the plan, push to Jira, track progress — without ever leaving the canvas.",
    options: [],
  },
  about_values: {
    message: "**bahnOS core values:**\n\n**01 — Simplicity first**\nPowerful tools don't have to be complicated. Every interaction is intentional — nothing buried, nothing requiring a tutorial.\n\n**02 — Performance matters**\nLatency kills flow. Every render cycle and WebSocket event is optimized so the tool disappears and your thinking takes center stage.\n\n**03 — Built for teams**\nReal-time presence and role-based permissions are first-class — not bolt-ons added after launch.",
    options: [],
  },
  about_integrations: {
    message: "**Integrations bahnOS connects with:**\n\n✅ **Jira** — Full two-way sync (live now)\n✅ **Confluence** — Export directly to Confluence markup (live now)\n✅ **Slack** — Webhook triggers for node changes (live now)\n\n🔜 **Linear** — Coming soon for teams running Linear instead of Jira\n🔜 **GitHub** — Link nodes to issues and PRs (Q4 2026)\n🔜 **Two-way Slack sync** — Reply in Slack to add comments (Q3 2026)\n\nbahnOS doesn't ask your team to start over — it connects to the tools already powering your delivery.",
    options: [],
  },

  // ── KEYBOARD SHORTCUTS ─────────────────────────────────────────────────────
  shortcuts: {
    message: "**Essential keyboard shortcuts:**\n\n**Canvas:**\n• **F** — fit all nodes to screen\n• **/** — open search\n• **Esc** — deselect / close panels\n• **P** — toggle presentation mode\n• **?** — show full shortcuts dialog\n\n**Nodes:**\n• **Tab** — add child node\n• **Enter** — add sibling node\n• **F2** — rename selected node\n• **Delete / Backspace** — delete node\n\n**History:**\n• **⌘Z / Ctrl+Z** — undo\n• **⌘⇧Z / Ctrl+Y** — redo",
    options: [],
  },

  // ── ACCOUNT & SETTINGS ─────────────────────────────────────────────────────
  account: {
    message: "What account or settings question do you have?",
    options: [
      { label: 'Change my password', next: 'change_password' },
      { label: 'Update my avatar', next: 'avatar' },
      { label: 'Dark mode', next: 'dark_mode' },
      { label: 'Presentation mode', next: 'presentation_mode' },
      { label: 'Snapshots & history', next: 'snapshots' },
      { label: 'Activity log', next: 'activity_log' },
      { label: 'Webhooks & Slack', next: 'webhooks' },
    ],
  },
  change_password: {
    message: "To change your password:\n\n1. Click your avatar → **Profile & Settings**\n2. Scroll to **Change Password**\n3. Enter your current password\n4. Enter and confirm your new password (min. 8 characters)\n5. Click **Save**\n\nForgot your password? Use **Forgot password** on the login screen to receive a reset email.",
    options: [],
  },
  avatar: {
    message: "To update your profile picture:\n\n1. Click your avatar → **Profile & Settings**\n2. Click on your current avatar image\n3. Upload a new image (JPG or PNG, max 2 MB)\n4. Your avatar updates everywhere — canvas, collaboration panel, and comments",
    options: [],
  },
  dark_mode: {
    message: "**Dark mode** reduces eye strain in low-light conditions.\n\n• Click the **moon icon 🌙** in the bottom toolbar to toggle it\n• Your preference is saved automatically\n• All panels, dialogs, and the canvas switch to the dark theme",
    options: [],
  },
  presentation_mode: {
    message: "**Presentation mode** hides all toolbars for a clean, distraction-free view.\n\n• Press **P** or click the present icon (▶) in the toolbar\n• All UI chrome disappears — only the canvas remains\n• Use scroll/pinch to navigate\n• Press **Escape** or **P** again to exit",
    options: [],
  },
  snapshots: {
    message: "**Snapshots** save a point-in-time copy of your canvas:\n\n1. Open the **Tools** menu → **Snapshots**\n2. Click **Save snapshot** to capture the current state\n3. Name your snapshot (e.g. \"Before sprint 4 cleanup\")\n4. Restore any snapshot to roll back the canvas to that moment\n\nSnapshots are stored per project.",
    options: [],
  },
  activity_log: {
    message: "The **Activity log** shows a full history of every change made to the project:\n\n• Open via **Tools** menu → **Activity log**\n• See who changed what and when\n• Filter by user or action type\n• Useful for auditing changes in team projects",
    options: [],
  },
  webhooks: {
    message: "**Webhooks & Slack** let you send automated notifications when things change:\n\n1. Open **Tools** menu → **Webhooks & Slack**\n2. Add a webhook URL (e.g. a Slack incoming webhook)\n3. Choose trigger events: node added, status changed, pushed to Jira, etc.\n4. bahnOS will POST a JSON payload to your URL on each event",
    options: [],
  },
}
