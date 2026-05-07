# bahnOS — Graph-Native UX & Productization Architecture

## Philosophy

bahnOS is not a project management tool with graph features bolted on. It is a **spatial operational instrument** — a surface where organizational topology becomes visible, navigable, and actionable without requiring users to think in graph theory.

The core UX principle: **the graph is felt, not seen.**

Users should experience operational pressure, dependency weight, and revenue flow the way a pilot reads instruments — through ambient signals that escalate to attention only when something demands action. The graph is the nervous system. The canvas is the body.

---

## 1. Graph-Native UX Philosophy

### "Gravity, Not Spaghetti"

Traditional graph tools show everything: every edge, every node, every connection. This creates visual spaghetti that overwhelms cognition. bahnOS takes the opposite approach:

**Graph intelligence manifests as gravitational forces on the canvas, not as visible edge lines.**

Principles:

1. **Ambient over explicit** — A node under dependency pressure doesn't show 12 incoming arrows. It shows a subtle weight indicator (thicker border, slight glow, density signal) that communicates "this node carries load" without rendering every relationship.

2. **Contextual revelation** — Edges appear only when the user focuses on a specific relationship question. Hovering a node reveals its immediate connections. Clicking "Show impact" renders the traversal path. The default state is clean.

3. **Operational semantics over graph semantics** — Users never see "traverse upstream" or "bidirectional edge." They see "What blocks this?" and "What's affected?" The graph vocabulary is translated into operational language.

4. **Proportional attention** — The visual weight of graph intelligence scales with operational urgency. A node blocking $500k in revenue gets more visual prominence than a node with one internal dependency. The graph decides what's important; the UX communicates proportionally.

5. **Canvas as instrument panel** — The canvas is not a drawing tool. It's an operational cockpit where spatial position, visual weight, and ambient signals communicate system state at a glance.

---

## 2. Information Hierarchy Model

### Four Layers of Visibility

```
┌─────────────────────────────────────────────────┐
│  LAYER 0: Always Visible (Ambient)               │
│  Node shape, color, title, status badge          │
│  Structural position in tree                     │
│  "Pulse" indicators (health signals)             │
├─────────────────────────────────────────────────┤
│  LAYER 1: Scannable (Glance)                     │
│  Dependency count chip, CRM link indicator       │
│  Risk coloring, workload heat                    │
│  Sprint/assignee badges                          │
├─────────────────────────────────────────────────┤
│  LAYER 2: Contextual (Focus)                     │
│  Relationship edges on hover/select              │
│  Impact radius preview                           │
│  Upstream/downstream mini-map                    │
├─────────────────────────────────────────────────┤
│  LAYER 3: Deep (Investigate)                     │
│  Full traversal visualization                    │
│  Revenue waterfall                               │
│  Critical path highlighting                      │
│  Dependency chain detail panel                   │
└─────────────────────────────────────────────────┘
```

### Transition Triggers

| From → To | Trigger | Duration |
|-----------|---------|----------|
| L0 → L1 | Zoom in past 75% | Persistent while zoomed |
| L1 → L2 | Hover node (300ms) or select | While focused |
| L2 → L3 | Explicit action ("Show impact", right-click menu, overlay toggle) | Until dismissed |
| Any → L0 | Click empty canvas, Escape, zoom out | Immediate |

### What Lives at Each Layer

**Layer 0 (Ambient):**
- Node title + shape
- Status dot (green/yellow/red/gray)
- A single "health pulse" — a subtle ring animation that appears only on nodes requiring attention (overdue, blocked, high-risk)
- Tree structure (parent-child edges only)
- Nothing else. The canvas breathes.

**Layer 1 (Scannable):**
- Small chip showing dependency count: `↑3 ↓7` (3 upstream, 7 downstream)
- CRM indicator: green `$` dot if linked to active deal
- Assignee avatar (tiny circle)
- Sprint label (compact pill)
- Risk tint: nodes on the critical path get a subtle warm-toned left border

**Layer 2 (Contextual):**
- On hover: ghost-line edges fade in showing immediate connections (1-hop)
- On select: edges solidify, connected nodes get a gentle highlight ring
- Mini traversal preview: a small radial "starburst" appears beside the node showing the shape of its dependency graph (dense = hub node, sparse = leaf)
- Tooltip showing: "Blocks 3 nodes, linked to 2 deals ($140k)"

**Layer 3 (Deep):**
- Full overlay rendering (dependency map, revenue flow, critical path)
- Side panel with traversal results
- Impact analysis cards
- Animated path highlighting

---

## 3. Operational Overlay System

### Overlay as "Lens" Metaphor

Overlays are not persistent visual modes. They are **lenses** — temporary analytical perspectives the user holds up to the canvas, then puts down.

### Available Lenses

| Lens | What it reveals | Visual treatment |
|------|----------------|------------------|
| **Dependencies** | All depends_on + blocks edges | Directed arrows: blue (depends), red (blocks) |
| **Revenue Flow** | Node → CRM deal connections with value | Green flow lines, node size scales with connected revenue |
| **Critical Path** | Longest dependency chain | Golden highlight on path nodes + edges, all else dims to 30% opacity |
| **Risk Heat** | Nodes with overdue dates + blocked status + high revenue | Red→orange→yellow gradient halos |
| **Workload** | Assignee load concentration | Assignee-colored rings, thickness = story points assigned |
| **Sprint Pressure** | Dependencies crossing sprint boundaries | Cross-sprint edges highlighted in orange warning |

### Lens Interaction Pattern

```
┌─────────────────────────────────────────┐
│  LENS BAR (bottom-center, minimal)       │
│                                          │
│  [👁 Dependencies] [💰 Revenue] [⚡ Risk]│
│  [🎯 Critical Path] [👥 Workload]       │
│                                          │
│  Click = toggle on/off                   │
│  Only ONE lens active at a time          │
│  ESC or click active lens = dismiss      │
└─────────────────────────────────────────┘
```

### Lens Rendering Rules

1. **Dim the irrelevant** — When a lens is active, nodes NOT part of the lens result drop to 40% opacity. This creates visual focus without hiding context.

2. **Animate entry** — Edges fade in over 200ms from the start node outward (like ripples). This gives the user a sense of propagation direction.

3. **Label edges contextually** — Dependency edges show relation type on hover only. Revenue edges show deal value on the connecting line.

4. **Auto-dismiss on interaction** — If the user starts editing a node title or dragging, the lens dismisses to prevent visual interference with work mode.

---

## 4. Relationship Visualization Strategy

### Edge Rendering Philosophy

**Default state: NO edges visible between non-parent-child nodes.**

The tree hierarchy edges (parent → child) are always visible — they define structure. All other relationships (dependencies, blockers, CRM links, cross-references) are hidden until requested.

### Edge Visual Language

| Relationship | Line style | Color | Arrow | When visible |
|-------------|-----------|-------|-------|--------------|
| Parent-child (tree) | Solid, 1.5px | Gray-400 | None (implied by hierarchy) | Always |
| depends_on | Solid, 2px | Blue-500 | → (triangle) | Lens or hover |
| blocks | Solid, 2.5px | Red-500 | ⊣ (flat bar) | Lens or hover |
| linked_to (CRM) | Dashed, 1.5px | Green-500 | ◇ (diamond) | Lens or hover |
| supports | Dotted, 1px | Purple-400 | → (small) | Lens only |
| cross-map reference | Dash-dot, 1px | Gray-500 | → | Explicit request only |

### Hover Behavior (The "Constellation" Pattern)

When a user hovers a node for 300ms:

1. The node elevates slightly (subtle shadow increase)
2. Immediate connections (1-hop) fade in as ghost lines
3. Connected nodes get a gentle pulse ring in the edge color
4. A micro-summary appears: `"← 2 blockers | → 5 dependents | $ 2 deals"`

When the user moves away, everything fades back in 150ms. Fast, respectful, non-sticky.

### Selected Node (Deeper Reveal)

When a node is clicked/selected:

1. All 1-hop edges render solidly
2. 2-hop edges render as ghosts (50% opacity)
3. A small "graph signature" appears in the node detail panel — a miniature force-directed layout of the node's local neighborhood (max 20 nodes, radius 2)
4. Connected nodes get a colored ring matching the relationship type

---

## 5. Progressive Disclosure Architecture

### The "Depth on Demand" Pattern

Every piece of graph intelligence follows this disclosure sequence:

```
Signal → Summary → Detail → Full
```

**Example: Revenue at Risk**

| Stage | What the user sees | Where |
|-------|-------------------|-------|
| Signal | Warm orange pulse on node | Canvas (Layer 0) |
| Summary | Hover tooltip: "Connected to $340k in pipeline" | Tooltip (Layer 2) |
| Detail | Side panel: list of connected deals, stages, amounts | Panel (Layer 3) |
| Full | Impact analysis: full traversal, affected sprints, assignees | Dedicated view |

### Disclosure Triggers (Never Auto-Escalate)

The system NEVER auto-opens panels, modals, or detailed views. It only signals. The user decides when to investigate.

**Anti-pattern**: Pop up "3 deals at risk!" modal on canvas load.
**Correct pattern**: Subtle warm pulse on relevant nodes. User notices when ready.

### First-Use Guided Disclosure

New users see a clean canvas with zero graph signals. As they:
1. Add their first dependency edge → brief tooltip: "You created a dependency. Hover to see connections."
2. Link first CRM deal → node gets `$` indicator with tooltip: "This node is linked to a deal."
3. Have 5+ edges in project → Lens Bar appears with subtle intro animation

---

## 6. Interaction Model for Graph Traversal

### "Ask the Graph" — Natural Language Interaction

Users don't traverse graphs. They **ask operational questions**. The graph engine answers.

### Question Patterns (accessible from Command Palette or right-click)

| User question | Maps to | UI result |
|--------------|---------|-----------|
| "What depends on this?" | Downstream traversal | Highlight descendant nodes |
| "What's blocking this?" | Upstream traversal (blocks only) | Show blocker chain |
| "What happens if this slips?" | Impact analysis | Impact card + highlight |
| "How much revenue is connected?" | Aggregate (CRM sum) | Revenue summary tooltip |
| "Show me the critical path" | Longest chain | Golden path overlay |
| "Who else is affected?" | Traversal → assignee extraction | Assignee list with load |

### Right-Click Graph Menu

```
┌──────────────────────────────┐
│ 📊 Analyze                    │
│   ├─ What depends on this?   │
│   ├─ What blocks this?       │
│   ├─ Show impact if delayed  │
│   ├─ Connected revenue       │
│   └─ Find path to...        │
│                              │
│ 🔗 Relationships             │
│   ├─ Add dependency →        │
│   ├─ Mark as blocker →       │
│   ├─ Link to CRM deal       │
│   └─ View all connections    │
└──────────────────────────────┘
```

### Traversal Result Display

Results appear in a **slide-in panel** from the right (not a modal, not a new page):

```
┌────────────────────────────────────────────┐
│ Impact Analysis: "Auth Service Refactor"    │
│                                            │
│ If this slips:                             │
│ ───────────────────────────────────────    │
│ 🔴 5 nodes directly blocked               │
│ 🟠 12 nodes transitively affected          │
│ 💰 3 deals at risk ($240k total)           │
│ 👥 4 team members impacted                 │
│ 🏃 Sprint 5 delivery threatened            │
│                                            │
│ Critical chain:                            │
│ Auth Refactor → API Gateway → Mobile App   │
│ → Enterprise Onboarding (deal: $180k)      │
│                                            │
│ [Highlight on Canvas] [Export] [Dismiss]   │
└────────────────────────────────────────────┘
```

Clicking "Highlight on Canvas" activates a temporary overlay showing the traversal path. The user can explore, then press ESC to dismiss.

---

## 7. Multi-Layer Visibility System

### Layer Toggle Controls

A compact vertical toolbar on the left canvas edge:

```
┌───┐
│ T │  Tree structure (always on, not toggleable)
├───┤
│ D │  Dependency edges
├───┤
│ $ │  CRM connections
├───┤
│ G │  Groups
├───┤
│ F │  Frames
├───┤
│ H │  Heat signals
└───┘
```

- Single letter icons
- Active layers have a filled circle indicator
- Maximum 2 relationship layers active simultaneously (prevents visual overload)
- Attempting to activate a 3rd prompts: "Disable one layer to enable another"

### Opacity Stacking

When multiple layers are active, each gets proportional opacity:
- 1 layer active: 100% opacity
- 2 layers active: 80% / 60% (primary/secondary based on activation order)

### Layer Presets

Quick-switch presets for common operational views:

| Preset | Active layers | Use case |
|--------|--------------|----------|
| **Clean** | Tree only | Brainstorming, presenting |
| **Operational** | Tree + Dependencies + Heat | Daily planning |
| **Revenue** | Tree + CRM + Revenue heat | Sales review |
| **Sprint** | Tree + Dependencies + Sprint labels | Sprint planning |

Accessible via keyboard: `Ctrl+1` through `Ctrl+4`.

---

## 8. CRM Relationship Visualization

### The "Revenue Gravity" Model

CRM deals connected to nodes create **visual weight**. Nodes connected to higher-value deals appear "heavier" — communicated through:

1. **Border thickness** — Node border scales 1px → 3px proportional to connected deal value
2. **Deal pip** — A small green circle below the node. Multiple pips = multiple deals. Filled pip = active deal. Hollow pip = lost/closed.
3. **Value label** — On hover, the total connected revenue appears as a compact label: `$340k`

### CRM Indicators at Each Layer

**Layer 0**: Single green dot (has any CRM link)
**Layer 1**: Pip count + total value on hover
**Layer 2**: Deal names + stages visible, connection lines shown
**Layer 3**: Full deal cards in side panel, revenue flow overlay

### Inline CRM Card (on node select)

When a CRM-linked node is selected, its detail panel includes a compact CRM section:

```
┌─────────────────────────────────┐
│ 💰 Connected Deals              │
│                                 │
│ Acme Corp        $180k  Demo    │
│ ████████████░░░░░░░░ 60%        │
│                                 │
│ StartupXYZ       $45k   Lead    │
│ ██░░░░░░░░░░░░░░░░░░ 10%       │
│                                 │
│ [+ Link Deal] [View in CRM →]  │
└─────────────────────────────────┘
```

The progress bar represents deal probability. This gives immediate operational context without leaving the canvas.

---

## 9. Dependency Visualization Patterns

### The "Tension Wire" Model

Dependencies are not generic arrows. They are **tension wires** — visual elements that communicate load, strain, and slack.

| Dependency state | Visual treatment |
|-----------------|------------------|
| Healthy (on track) | Thin blue line, relaxed curve |
| At risk (dependent approaching due date) | Thicker line, warm color shift (blue → amber) |
| Blocked (upstream node is blocked/overdue) | Thick red line, slight pulse animation |
| Resolved (both complete) | Fades to 20% opacity gray, thin |

### Dependency Count Chip

Every node with dependencies shows a compact chip (Layer 1):

```
┌─────────────────┐
│  Auth Service    │
│                  │
│     ↑2  ↓5      │  ← upstream count, downstream count
└─────────────────┘
```

Color coding:
- Gray numbers: all healthy
- Amber number: some at-risk connections
- Red number: blocking or blocked

### Dependency Chain Preview (on hover)

Hovering the dependency chip shows a micro-visualization:

```
         ┌─ DB Migration
 Blocker ─┤
         └─ Config Update
                           ↓
                    ┌─ Auth Service ←── YOU ARE HERE
                    ↓
         ┌─ API Gateway
         ├─ Mobile App
         ├─ Web Dashboard
         ├─ Notification Service
         └─ Onboarding Flow
```

This is rendered as a tiny tree (max 200px wide) in a tooltip-like floating panel. It gives instant structural awareness without activating a full overlay.

---

## 10. AI Insight Presentation Strategy

### "The Advisor" Pattern

AI insights in bahnOS are presented as a **quiet advisor**, not an intrusive assistant. The AI never interrupts. It signals availability.

### Insight Delivery Hierarchy

**Passive signals** (always available, zero noise):
- A small ✦ sparkle icon appears on nodes where the AI has detected something notable
- The sparkle is contextual: amber ✦ = risk insight, blue ✦ = optimization suggestion, green ✦ = opportunity

**On-demand insights** (user pulls):
- User clicks sparkle → compact insight card appears inline
- User opens "Insights" panel → aggregated list of all AI observations
- User asks via Command Palette → conversational response

### Insight Card Format

```
┌─────────────────────────────────────────┐
│ ✦ Dependency Bottleneck Detected         │
│                                          │
│ "Auth Service" has 7 downstream          │
│ dependents but no parallel path.         │
│ If it slips 2 days, Sprint 5 delivery   │
│ shifts by 5 days.                        │
│                                          │
│ Suggestion: Split into 2 parallel        │
│ workstreams to reduce single-point risk. │
│                                          │
│ [Show Impact] [Dismiss] [Snooze 7d]     │
└─────────────────────────────────────────┘
```

### AI Insight Types

| Category | Example | Signal |
|----------|---------|--------|
| Bottleneck | "Node X has no parallel path" | Amber ✦ |
| Cycle risk | "Adding this dependency would create a cycle" | Red ✦ (preventive) |
| Opportunity | "Deal Y is 2 hops from completion — one unblocking task remaining" | Green ✦ |
| Anomaly | "Sprint 6 has 3x the dependency density of other sprints" | Amber ✦ |
| Optimization | "Reassigning task Z to Alice reduces critical path by 2 days" | Blue ✦ |

### AI Context Injection (for LLM-powered features)

When the user invokes AI assistance (future), the graph provides context:

```javascript
// Graph context for AI prompt construction
{
  node: { id, title, status, assignee },
  localGraph: {
    upstream: [{ title, relation, depth }],
    downstream: [{ title, relation, depth }],
    crmDeals: [{ company, value, stage }],
  },
  criticalPath: { onIt: boolean, position: "3 of 7" },
  riskSignals: ["high dependency fan-out", "approaching due date"],
  projectContext: { sprint: "Sprint 4", totalNodes: 89 }
}
```

This structured context allows AI to reason about operational topology, not just individual ticket content.

---

## 11. Risk / Revenue / Workload Overlays

### Risk Overlay

**Visual language**: Warm-to-hot color temperature on node boundaries.

```
Low risk    ──────────────────────────────  High risk
(no signal)    (amber glow)    (orange ring)    (red pulse)
```

**Risk scoring** (computed from graph):
- Node is on critical path: +30
- Node has overdue dependents: +20 per dependent
- Connected deal value > $100k: +15
- No assignee but has downstream dependents: +25
- Blocked status for > 2 days: +20

**Visual rules**:
- Score 0-20: no visual signal
- Score 21-50: thin amber left-border (subtle, scannable)
- Score 51-80: amber glow ring (2px, noticeable)
- Score 81+: red pulse ring (animated, demands attention)

### Revenue Overlay

**Visual language**: Green intensity proportional to connected pipeline value.

- Nodes with no CRM links: normal appearance
- Nodes connected to <$50k: faint green bottom-border
- Nodes connected to $50k-$200k: green glow
- Nodes connected to >$200k: strong green glow + value label auto-shown

**Revenue flow lines**: Dashed green curves from nodes to a small deal card floating nearby. Multiple deals = stacked cards.

### Workload Overlay

**Visual language**: Assignee-colored halos with size proportional to story points.

```
Each assignee gets a unique color (from collaboration palette).
Nodes assigned to them get a thin ring of that color.
Ring thickness = story points assigned.
```

Additionally, a **workload bar** appears at the top of the canvas:

```
┌──────────────────────────────────────────────────┐
│ Alice ████████████████░░░░ 34pts                  │
│ Bob   ████████░░░░░░░░░░░░ 18pts                  │
│ Carol ██████████████████████████████ 52pts ⚠️      │
└──────────────────────────────────────────────────┘
```

The ⚠️ appears when load exceeds a threshold (e.g., 2x team average).

---

## 12. Large-Project Graph Readability Strategies

### Problem: >100 nodes becomes unreadable

### Strategy 1: Semantic Zoom

At different zoom levels, the canvas shows different information densities:

| Zoom level | What's visible |
|-----------|---------------|
| <25% (eagle view) | Clusters/groups only, node titles hidden, just colored dots |
| 25-50% | Node titles, status dots, group labels |
| 50-100% | Full Layer 1 (chips, badges, avatars) |
| >100% | Layer 2 activated (edges on hover, detail tooltips) |

### Strategy 2: Focus Mode (existing, enhanced)

Current: dims non-related nodes.
**Enhanced**: when a user enters Focus Mode on a node:
1. Only the node's connected subgraph remains at full opacity
2. Everything else drops to 15% opacity (effectively invisible)
3. The subgraph re-layouts to fill available space (temporary layout, reverts on exit)
4. A breadcrumb shows: "Focused: Auth Service (12 connected nodes)"

### Strategy 3: Cluster Collapse

Groups of nodes can be collapsed into a single "cluster node":

```
Before:                          After collapse:
┌─ Sprint 4 ──────────┐        ┌──────────────────┐
│ Task A  Task B       │        │  Sprint 4 (8)    │
│ Task C  Task D       │   →    │  ↑4 ↓12 $340k   │
│ Task E  Task F       │        └──────────────────┘
│ Task G  Task H       │
└──────────────────────┘
```

The cluster node shows:
- Group label + node count
- Aggregate dependency count
- Aggregate connected revenue
- Highest risk signal from any contained node

Edges to/from contained nodes are merged into cluster-level edges.

### Strategy 4: "Above the Fold" Sorting

When there are too many nodes to display meaningfully, the canvas prioritizes display of nodes that:
1. Are on the critical path
2. Have the highest dependency fan-out
3. Are connected to highest-value deals
4. Are blocked or blocking others
5. Are assigned to the current user

Other nodes are still accessible but rendered smaller or with reduced detail.

### Strategy 5: Viewport-Scoped Queries

Graph overlays only compute and render edges for nodes currently in the viewport (plus a 200px buffer). As the user pans, edges dynamically load/unload. This prevents the "spaghetti explosion" of showing all 500 edges at once.

---

## 13. Cognitive Load Reduction Patterns

### Pattern 1: "One Number" Summaries

Complex graph state is reduced to a single meaningful number wherever possible:

- Impact score: `"If this slips: 12 nodes affected"`
- Revenue link: `"$340k connected"`
- Dependency depth: `"3 hops to critical path"`
- Risk level: `"Risk: High (score 74/100)"`

### Pattern 2: Binary Signals Over Continuous Spectrums

Instead of showing exact dependency counts on every node:
- **Yes/No**: Does this node have dependencies? (show/hide chip)
- **Healthy/Unhealthy**: Are any dependencies in trouble? (green/amber chip)
- **Details on demand**: Exact counts only on hover or select

### Pattern 3: Whitespace as Communication

Intentionally NOT filling space communicates:
- Empty overlay = healthy (no risk, no bottlenecks)
- No amber/red signals = system operating normally
- Clean canvas = psychological safety to explore

### Pattern 4: Temporal Fading

Information that was relevant but is no longer actionable fades:
- Completed dependency chains fade to 20% opacity after 24h
- Won deals fade their CRM indicator after closing
- Resolved risk signals disappear entirely after acknowledgment

### Pattern 5: Consistent Spatial Meaning

- Left = upstream (what this depends on)
- Right = downstream (what depends on this)
- Above = higher in hierarchy (parent)
- Below = lower in hierarchy (children)
- Warm colors = needs attention
- Cool colors = informational
- Green = value/revenue
- Size = importance/load

Users develop spatial intuition without explicit training.

---

## 14. Mobile / Responsive Graph UX Considerations

### Core Principle: "Read on Mobile, Work on Desktop"

Mobile does NOT attempt to replicate the full canvas editing experience. Instead:

### Mobile Canvas (Read-only + Simple Interactions)

- Pan/zoom via touch gestures
- Tap node → detail panel slides up (bottom sheet)
- No edge rendering (too noisy on small screens)
- Status-colored dots only
- Double-tap = expand/collapse

### Mobile Graph Intelligence

- Insight cards (AI/risk/revenue) render as a scrollable card feed
- Impact analysis shows as a structured list, not a visual overlay
- Notification-style alerts for: "Node X is now blocking 5 items"

### Responsive Breakpoints

| Width | Canvas behavior |
|-------|----------------|
| >1200px | Full experience: overlays, side panels, layer controls |
| 800-1200px | Compact: panels float instead of docking, smaller badges |
| <800px | Read-only canvas + card-based panels, no overlays |

### Offline-First Graph Signals

On mobile with poor connectivity:
- Badge counts come from the last-fetched linkMap (cached)
- Overlays are unavailable (require server traversal)
- Clear indicator: "Offline — graph insights unavailable"

---

## 15. Real-Time Collaboration Visualization

### Presence in Graph Context

When multiple users are in the same project:

1. **Cursor trails** — Each user's cursor has a colored dot + name label (existing)
2. **Focus indicators** — If User B is viewing a node's impact analysis, other users see a subtle `👁` icon on that node indicating "someone is investigating this"
3. **Edit locks** — When User B is editing a node, it gets their color ring (existing). Graph edges involving that node show a subtle animation indicating "in flux."

### Collaborative Graph Actions

When User A activates a lens (e.g., "Critical Path"):
- Only User A sees the overlay (personal view)
- NOT broadcast to others (overlays are personal analytical tools)

When User A creates/deletes an edge:
- All users see the change in real-time (action broadcast)
- If another user has a lens active that includes that edge, their overlay auto-refreshes

### Conflict-Free Graph Editing

Two users editing the same node's dependencies simultaneously:
- Each edge creation is independent (no conflicts possible — different source+target)
- If both try to create the same edge: server deduplicates via unique constraint, second user's UI shows edge already exists
- If User A deletes an edge while User B is viewing it in an overlay: B's overlay refreshes, edge disappears with a brief "removed" animation

### Presence-Aware Impact Analysis

When viewing impact analysis results, nodes that are currently being edited by other users show a `⚡` indicator:
- "Auth Service ⚡ (Bob is editing)" 
- This communicates: impact may change momentarily

---

## 16. Multi-User Graph Interaction Patterns

### Shared Analytical Sessions

A new interaction mode: **"Share This View"**

When a user runs an impact analysis or activates an overlay, they can click "Share View" → All room members see the same overlay with a banner:

```
┌──────────────────────────────────────────────────────┐
│ 👁 Alice is sharing: Impact Analysis on "Auth Refactor" │
│ [View] [Dismiss]                                      │
└──────────────────────────────────────────────────────┘
```

This enables:
- Sprint planning discussions: "Look at this critical path"
- Risk reviews: "See how this node blocks everything"
- Revenue conversations: "Notice how much pipeline connects here"

### Role-Appropriate Graph Access

| Role | Can create edges | Can view overlays | Can run impact analysis | Can share views |
|------|-----------------|-------------------|------------------------|-----------------|
| Admin | Yes | Yes | Yes | Yes |
| Edit | Yes | Yes | Yes | Yes |
| View | No | Yes (personal) | Yes (read-only) | No |

### Graph Discussion Annotations

Users can pin a comment to a specific graph state:
- "When I ran impact analysis on Auth Service, it showed 12 affected nodes. We should parallelize."
- The comment includes a snapshot link that re-renders the same overlay state when clicked.

---

## 17. Operational Intelligence Dashboard Concepts

### "Pulse" — The Project Health Dashboard

Accessible via a dedicated tab or keyboard shortcut (`Ctrl+Shift+P`):

```
┌─────────────────────────────────────────────────────────┐
│                    PROJECT PULSE                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  HEALTH SCORE: 72/100 (▼ 3 from yesterday)              │
│  ══════════════════════════░░░░░░░░                      │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Critical     │  │ Revenue     │  │ Blocked     │     │
│  │ Path: 7      │  │ At Risk:    │  │ Nodes: 4    │     │
│  │ nodes        │  │ $240k       │  │             │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                          │
│  TOP RISKS                                               │
│  ─────────                                               │
│  1. Auth Service (blocks 7, on critical path)            │
│  2. API Gateway (2 days overdue, blocks 3)               │
│  3. Mobile SDK (no assignee, $180k downstream)           │
│                                                          │
│  DEPENDENCY HEALTH                                       │
│  ─────────────────                                       │
│  47 edges total │ 41 healthy │ 4 at-risk │ 2 blocked    │
│                                                          │
│  SPRINT FORECAST                                         │
│  ───────────────                                         │
│  Sprint 5: 🟡 At risk (critical path extends 2d beyond) │
│  Sprint 6: 🟢 On track                                  │
│                                                          │
│  [View Critical Path] [View Risks] [View Revenue]       │
└─────────────────────────────────────────────────────────┘
```

### Health Score Computation

```
Health = 100 - (blocked_penalty + risk_penalty + overdue_penalty + orphan_penalty)

blocked_penalty = blocked_nodes * 5
risk_penalty = critical_path_length > 8 ? 15 : critical_path_length > 5 ? 8 : 0
overdue_penalty = overdue_nodes * 3
orphan_penalty = nodes_without_assignee_on_critical_path * 4
```

### Trend Sparkline

A tiny 7-day sparkline beside the health score shows trajectory. Users instantly see: "Are things improving or degrading?"

---

## 18. Node Detail Evolution Strategy

### Current: Flat Property List

The current NodeDetailDialog shows all properties as a flat form. This doesn't communicate operational context.

### Evolved: "Node as Operational Entity"

The node detail view evolves into three tabs:

**Tab 1: Properties** (existing, refined)
- Standard fields: status, priority, assignee, sprint, story points
- Clean form layout, unchanged

**Tab 2: Connections** (new)
```
┌─────────────────────────────────────────┐
│ UPSTREAM (what this needs)               │
│ ├─ DB Migration [depends_on] ✅ Done     │
│ ├─ Config Service [depends_on] 🟡 WIP   │
│ └─ Security Review [blocks] 🔴 Blocked  │
│                                          │
│ DOWNSTREAM (what needs this)             │
│ ├─ API Gateway [depends_on]              │
│ ├─ Mobile App [depends_on]              │
│ ├─ Web Dashboard [depends_on]           │
│ └─ +4 more...                           │
│                                          │
│ CRM DEALS                                │
│ ├─ Acme Corp — $180k — Demo stage       │
│ └─ StartupXYZ — $45k — Lead stage       │
│                                          │
│ [+ Add Dependency] [+ Link Deal]        │
└─────────────────────────────────────────┘
```

**Tab 3: Intelligence** (new)
```
┌─────────────────────────────────────────┐
│ OPERATIONAL CONTEXT                      │
│                                          │
│ Position: 4th on critical path (of 7)   │
│ Impact if delayed: 12 nodes, $240k      │
│ Dependency depth: 3 upstream, 5 down    │
│ Risk score: 74/100 (High)               │
│                                          │
│ ✦ AI INSIGHT                             │
│ "This node is the primary bottleneck    │
│ for Sprint 5. Consider splitting into   │
│ parallel workstreams."                   │
│                                          │
│ [Show Full Impact] [View Critical Path] │
└─────────────────────────────────────────┘
```

---

## 19. Visual Language System

### Color Palette (Operational Semantics)

| Color | Meaning | Usage |
|-------|---------|-------|
| **Gray-400** | Neutral, structural | Tree edges, inactive states |
| **Blue-500** | Dependency, information | depends_on edges, info badges |
| **Red-500** | Blocking, urgent | blocks edges, overdue, errors |
| **Amber-500** | Warning, at-risk | approaching deadline, moderate risk |
| **Green-500** | Value, health, done | CRM links, revenue, completed |
| **Purple-400** | Support, secondary | supports edges, secondary connections |
| **Indigo-500** | AI, intelligence | AI insights, suggestions |

### Shape Language

| Shape | Represents |
|-------|-----------|
| Rectangle | Standard operational node |
| Circle | Decision point or milestone |
| Diamond | Conditional/branching |
| Sticky | Note, comment, temporary |
| Cluster (rounded rect) | Collapsed group |

### Icon Language (Badges)

| Icon | Meaning |
|------|---------|
| `$` | CRM-linked |
| `↑↓` | Has dependencies |
| `⚡` | On critical path |
| `✦` | AI insight available |
| `🔴` | Blocked |
| `🟡` | At risk |
| `🟢` | Healthy/On track |
| `👁` | Someone investigating |
| `🔒` | Locked |

### Motion Language

| Motion | Communicates |
|--------|-------------|
| Slow pulse (2s cycle) | Needs attention (not urgent) |
| Fast pulse (0.5s) | Urgent/blocked |
| Fade in (200ms) | New information appearing |
| Fade out (150ms) | Information dismissed |
| Ripple outward | Propagation direction |
| Subtle bounce | Action completed |

### Typography Hierarchy

| Level | Style | Usage |
|-------|-------|-------|
| Node title | 14px medium | Primary content |
| Badge/chip | 10px mono | Counts, keys |
| Panel header | 16px semibold | Section labels |
| Insight text | 13px regular | AI cards, tooltips |
| Value label | 12px mono bold | $340k, 89pts |

---

## 20. Anti-Patterns to Avoid

### 1. "Dashboard Vomit"
**Problem**: Showing every metric, graph, chart on the main canvas.
**bahnOS rule**: The canvas is for operational work. Dashboards exist in a separate view. Never mix analytical displays with the working surface.

### 2. "Edge Spaghetti"
**Problem**: Rendering all relationships simultaneously.
**bahnOS rule**: Maximum 1 overlay lens active. Default state shows ZERO non-tree edges. Edges are contextual, not persistent.

### 3. "Notification Hell"
**Problem**: Alerting on every graph change, risk shift, new insight.
**bahnOS rule**: The system signals passively (badges, pulses). It NEVER interrupts with modals, toasts, or pop-ups for graph intelligence. User pulls information; system doesn't push.

### 4. "Graph Theory Leakage"
**Problem**: Exposing terms like "traversal," "node degree," "adjacency," "transitive closure" in the UI.
**bahnOS rule**: All graph concepts are translated to operational language. "Dependencies" not "downstream edges." "What's affected?" not "bidirectional traversal." "Revenue connected" not "aggregate over CRM target nodes."

### 5. "Feature Checkbox Syndrome"
**Problem**: Adding every possible overlay, visualization, and metric because the backend supports it.
**bahnOS rule**: Fewer, more opinionated features. 5 lenses, not 20. Each one has a clear operational question it answers.

### 6. "Enterprise Bloat"
**Problem**: Configuration panels, admin settings for every feature, role matrices for every action.
**bahnOS rule**: Sensible defaults. No configuration required. Power users discover depth through progressive disclosure, not settings pages.

### 7. "Clippy AI"
**Problem**: AI that proactively interrupts with suggestions nobody asked for.
**bahnOS rule**: AI surfaces insights as passive signals (sparkles). User actively requests analysis. AI never speaks first. Never auto-opens. Never blocks workflow.

### 8. "Dead Data Displays"
**Problem**: Showing metrics that don't lead to action (vanity metrics).
**bahnOS rule**: Every displayed number must answer "So what?" If the user can't act on it, don't show it. "47 total edges" is dead data. "3 edges blocking Sprint 5" is actionable.

### 9. "Mode Confusion"
**Problem**: User doesn't know if they're in analysis mode or edit mode.
**bahnOS rule**: Overlays and analysis are clearly visually distinct from the working canvas (dimmed background, colored banner). The user always knows: "I'm looking at the graph" vs "I'm working on the tree."

### 10. "Zoom Level Whiplash"
**Problem**: Information density doesn't adapt to zoom level, causing either information overload or information desert.
**bahnOS rule**: Semantic zoom. Every zoom level has exactly the right amount of information for that perspective. Eagle view = clusters. Working view = full detail. Never show badge text at 20% zoom.

---

## The "Aha Moment"

The user creates their third dependency edge. They hover the node and see:

> "← 2 blockers | → 5 dependents | $180k connected"

They think: *"I never realized this node was carrying that much weight."*

They right-click → "Show Impact" and see 12 nodes light up, a deal card pulse green, and the panel reads:

> "If Auth Service slips 3 days, Sprint 5 delivery shifts by 5 days. $240k in pipeline is affected."

They think: *"This isn't a mind map anymore. This is a nervous system."*

That's the moment bahnOS becomes indispensable. Not because it has more features than Jira. Because it shows operational reality that no other tool makes visible.

---

## Differentiators from Competitors

| Competitor | Their model | bahnOS difference |
|-----------|-------------|-------------------|
| **Jira** | Ticket database with flat links | bahnOS: spatial operational graph with propagation awareness |
| **Linear** | Fast ticket CRUD, clean UI | bahnOS: reveals hidden topology that Linear can't see |
| **ClickUp** | Feature soup, everything configurable | bahnOS: opinionated, progressive, graph-native intelligence |
| **Monday** | Colorful dashboards, workflows | bahnOS: graph = intelligence layer, not decoration |
| **Miro** | Free-form canvas, no operational semantics | bahnOS: canvas WITH operational semantics and real relationships |
| **Notion** | Document-first, blocks | bahnOS: spatial-first, topology-aware, real-time collaborative |

bahnOS's unique value: **it's the only tool where creating relationships between work items immediately produces operational intelligence** — impact analysis, risk signals, revenue awareness, dependency pressure — without requiring the user to build dashboards, write queries, or configure analytics.

The graph IS the product.
