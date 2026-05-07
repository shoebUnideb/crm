// BFS traversal helper
function bfsNodes(nodes, rootId) {
  const result = []
  const queue = [rootId]
  const seen = new Set()
  while (queue.length > 0) {
    const id = queue.shift()
    if (seen.has(id)) continue
    seen.add(id)
    const node = nodes[id]
    if (!node) continue
    result.push(node)
    for (const childId of node.childIds) queue.push(childId)
  }
  return result
}

export function exportCSV(nodes, rootId, projectName = 'Project') {
  const allNodes = bfsNodes(nodes, rootId)
  const headers = [
    'ID', 'Title', 'Parent ID', 'Depth', 'Status', 'Priority',
    'Story Points', 'Issue Type', 'Assignee', 'Tags', 'Due Date',
    'Sprint', 'Jira Key', 'Notes',
  ]

  const rows = allNodes.map(node => [
    node.id,
    node.title,
    node.parentId || '',
    node.depth,
    node.status || '',
    node.priority || '',
    node.storyPoints != null ? node.storyPoints : '',
    node.issueType || '',
    node.assignee || '',
    (node.tags || []).join('; '),
    node.dueDate || '',
    node.sprint || '',
    node.jiraKey || '',
    (node.notes || '').replace(/\n/g, ' '),
  ])

  const escape = (v) => {
    const s = String(v)
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }

  const csv = [headers, ...rows]
    .map(row => row.map(escape).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${projectName.replace(/\s+/g, '-')}-export.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function generateConfluenceMarkup(nodes, rootId, projectName = 'Project') {
  const lines = [`h1. ${projectName}\n`]

  function renderNode(nodeId, indent = 0) {
    const node = nodes[nodeId]
    if (!node) return

    const prefix = '#'.repeat(Math.max(1, indent + 1))
    lines.push(`${prefix} ${node.title}`)

    const meta = []
    if (node.status) meta.push(`*Status:* ${node.status}`)
    if (node.priority) meta.push(`*Priority:* ${node.priority}`)
    if (node.storyPoints != null) meta.push(`*Points:* ${node.storyPoints}`)
    if (node.issueType) meta.push(`*Type:* ${node.issueType}`)
    if (node.assignee) meta.push(`*Assignee:* ${node.assignee}`)
    if (node.dueDate) meta.push(`*Due:* ${node.dueDate}`)
    if (node.sprint) meta.push(`*Sprint:* ${node.sprint}`)
    if (node.jiraKey) meta.push(`*Jira:* [${node.jiraKey}]`)
    if (node.tags?.length) meta.push(`*Tags:* ${node.tags.join(', ')}`)

    if (meta.length > 0) {
      lines.push(meta.join(' | '))
    }

    if (node.notes) {
      lines.push(`{panel}\n${node.notes}\n{panel}`)
    }

    if ((node.comments || []).length > 0) {
      lines.push(`*Comments:*`)
      for (const c of node.comments) {
        lines.push(`* ${c.author}: ${c.text}`)
      }
    }

    lines.push('')

    for (const childId of node.childIds) {
      renderNode(childId, indent + 1)
    }
  }

  renderNode(rootId)
  return lines.join('\n')
}

export function exportMarkdown(nodes, rootId, projectName = 'Project') {
  const lines = [`# ${projectName}\n`]

  function renderNode(nodeId, depth = 0) {
    const node = nodes[nodeId]
    if (!node) return
    const indent = '  '.repeat(depth)
    const checkbox = node.status === 'done' ? '[x]' : '[ ]'
    const badges = []
    if (node.status) badges.push(`\`${node.status}\``)
    if (node.priority) badges.push(`\`${node.priority}\``)
    if (node.assignee) badges.push(`@${node.assignee}`)
    if (node.jiraKey) badges.push(`**${node.jiraKey}**`)
    const badgeStr = badges.length > 0 ? ' ' + badges.join(' ') : ''
    lines.push(`${indent}- ${checkbox} ${node.title}${badgeStr}`)
    if (node.notes) {
      const noteLines = node.notes.split('\n')
      for (const nl of noteLines) lines.push(`${indent}  > ${nl}`)
    }
    for (const childId of node.childIds) renderNode(childId, depth + 1)
  }

  const root = nodes[rootId]
  if (root) {
    for (const childId of root.childIds) renderNode(childId, 0)
  }

  const md = lines.join('\n')
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${projectName.replace(/\s+/g, '-')}-outline.md`
  a.click()
  URL.revokeObjectURL(url)
}

export function encodeShareLink(project) {
  try {
    const data = JSON.stringify({
      name: project.name,
      nodes: project.nodes,
      rootId: project.rootId,
      extraEdges: project.extraEdges || [],
    })
    const encoded = btoa(unescape(encodeURIComponent(data)))
    const url = `${window.location.origin}${window.location.pathname}?share=${encoded}`
    return url
  } catch {
    return null
  }
}

export function decodeShareLink(encoded) {
  try {
    const json = decodeURIComponent(escape(atob(encoded)))
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function importCSV(csvText) {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return null

  function parseRow(line) {
    const values = []
    let cur = '', inQ = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (inQ) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++ }
        else if (ch === '"') inQ = false
        else cur += ch
      } else {
        if (ch === '"') inQ = true
        else if (ch === ',') { values.push(cur); cur = '' }
        else cur += ch
      }
    }
    values.push(cur)
    return values
  }

  const rawHeaders = parseRow(lines[0]).map(h => h.trim())
  const lowerHeaders = rawHeaders.map(h => h.toLowerCase())

  // Detect Notion export: headers include "Name" or "Tags" columns
  const isNotion = lowerHeaders.includes('name') && !lowerHeaders.includes('title')
  // Detect Linear export: headers include "title" and ("identifier" or "team")
  const isLinear = lowerHeaders.includes('title') && (lowerHeaders.includes('identifier') || lowerHeaders.includes('team'))

  // Build column name remap
  const colMap = {}
  if (isNotion) {
    colMap['name'] = 'title'
    colMap['status'] = 'status'
    colMap['tags'] = 'tags'
    colMap['assignee'] = 'assignee'
    colMap['due'] = 'due_date'
    colMap['due date'] = 'due_date'
    colMap['priority'] = 'priority'
  } else if (isLinear) {
    colMap['title'] = 'title'
    colMap['identifier'] = 'jira_key'
    colMap['status'] = 'status'
    colMap['priority'] = 'priority'
    colMap['assignee'] = 'assignee'
    colMap['due date'] = 'due_date'
    colMap['estimate'] = 'story_points'
    colMap['team'] = 'sprint'
  }

  const headers = rawHeaders.map(h => {
    const lower = h.toLowerCase()
    return colMap[lower] || lower.replace(/\s+/g, '_')
  })

  const col = (row, name) => {
    const idx = headers.indexOf(name)
    return idx >= 0 ? (row[idx] || '').trim() : ''
  }

  const nodes = {}
  const rootId = crypto.randomUUID()
  nodes[rootId] = {
    id: rootId, title: 'Imported', parentId: null, childIds: [],
    depth: 0, color: null, collapsed: false, x: 0, y: 0, shape: 'rect',
    status: null, priority: null, storyPoints: null, issueType: null,
    assignee: null, tags: [], dueDate: null, sprint: null, jiraKey: null, notes: null,
    comments: [], reactions: {}, locked: false,
  }

  const idMap = {} // original ID → new UUID

  for (let i = 1; i < lines.length; i++) {
    const row = parseRow(lines[i])
    const origId = col(row, 'id') || col(row, 'id')
    const title = col(row, 'title')
    if (!title) continue

    const newId = crypto.randomUUID()
    if (origId) idMap[origId] = newId

    const sp = col(row, 'story_points')
    const tags = col(row, 'tags')

    nodes[newId] = {
      id: newId,
      title,
      parentId: null, // resolved in pass 2
      childIds: [],
      depth: parseInt(col(row, 'depth') || '1') || 1,
      color: null, collapsed: false, x: 0, y: 0, shape: 'rect',
      status: col(row, 'status') || null,
      priority: col(row, 'priority') || null,
      storyPoints: sp ? (isNaN(Number(sp)) ? null : Number(sp)) : null,
      issueType: col(row, 'issue_type') || null,
      assignee: col(row, 'assignee') || null,
      tags: tags ? tags.split(/[;,]/).map(t => t.trim()).filter(Boolean) : [],
      dueDate: col(row, 'due_date') || null,
      sprint: col(row, 'sprint') || null,
      jiraKey: col(row, 'jira_key') || null,
      notes: col(row, 'notes') || null,
      comments: [], reactions: {}, locked: false,
    }
  }

  // Pass 2: wire parent-child relationships
  for (let i = 1; i < lines.length; i++) {
    const row = parseRow(lines[i])
    const origId = col(row, 'id')
    const origParentId = col(row, 'parent_id')
    const title = col(row, 'title')
    if (!title) continue

    const newId = origId ? idMap[origId] : null
    if (!newId || !nodes[newId]) continue

    const resolvedParent = origParentId && idMap[origParentId] ? idMap[origParentId] : rootId
    nodes[newId].parentId = resolvedParent
    if (nodes[resolvedParent]) {
      nodes[resolvedParent].childIds.push(newId)
    }
  }

  return { nodes, rootId }
}

// Parse indented text (spaces, tabs, or markdown bullets) into a flat node map + rootId
// Returns { nodes, rootId } compatible with PASTE_SUBTREE
export function parseTextAsTree(text) {
  const rawLines = text.split('\n')
  // Strip bullet markers: -, *, numbered list
  const lines = rawLines
    .map(l => l.replace(/^(\s*)([-*]\s+|\d+\.\s+)/, '$1'))
    .filter(l => l.trim().length > 0)

  if (lines.length === 0) return null

  // Detect indent per line: count leading spaces (tabs = 2 spaces)
  function getIndent(line) {
    let count = 0
    for (const ch of line) {
      if (ch === ' ') count++
      else if (ch === '\t') count += 2
      else break
    }
    return count
  }

  const indents = lines.map(getIndent)
  // Normalize indent levels to 0,1,2,... by finding step size
  const uniqueIndents = [...new Set(indents)].sort((a, b) => a - b)
  const indentToLevel = new Map(uniqueIndents.map((ind, i) => [ind, i]))

  const nodes = {}
  const rootId = crypto.randomUUID()
  // Stack keeps { id, level } — tracks current parent chain
  const stack = [{ id: rootId, level: -1 }]

  // Create root from first line
  nodes[rootId] = {
    id: rootId, title: lines[0].trim(), parentId: null, childIds: [],
    depth: 0, color: null, collapsed: false, x: 0, y: 0, shape: 'rect',
  }

  for (let i = 1; i < lines.length; i++) {
    const title = lines[i].trim()
    if (!title) continue
    const level = indentToLevel.get(indents[i]) ?? 1

    // Pop stack until parent level < current level
    while (stack.length > 1 && stack[stack.length - 1].level >= level) stack.pop()
    const parentEntry = stack[stack.length - 1]
    const parentNode = nodes[parentEntry.id]

    const id = crypto.randomUUID()
    nodes[id] = {
      id, title, parentId: parentEntry.id, childIds: [],
      depth: (parentNode?.depth ?? 0) + 1, color: null, collapsed: false, x: 0, y: 0, shape: 'rect',
    }
    if (parentNode) parentNode.childIds.push(id)
    stack.push({ id, level })
  }

  return { nodes, rootId }
}
