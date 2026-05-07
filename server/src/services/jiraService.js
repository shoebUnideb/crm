function buildAuthHeader(email, apiToken) {
  return 'Basic ' + Buffer.from(`${email}:${apiToken}`).toString('base64')
}

async function jiraFetch(baseUrl, path, options, authHeader) {
  const url = `${baseUrl}/rest/api/3${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options?.headers,
    },
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const msg =
      (Array.isArray(data.errorMessages) && data.errorMessages[0]) ||
      data.errors?.summary ||
      JSON.stringify(data)
    const err = new Error(msg || `Jira API error ${res.status}`)
    err.status = res.status
    throw err
  }

  return data
}

export async function getIssueTypes({ baseUrl, email, apiToken, projectKey }) {
  const authHeader = buildAuthHeader(email, apiToken)
  const data = await jiraFetch(baseUrl, `/project/${projectKey}`, {}, authHeader)
  return (data.issueTypes || []).map(t => ({ id: t.id, name: t.name, subtask: t.subtask }))
}

export async function getSprints({ baseUrl, email, apiToken, boardId }) {
  const authHeader = buildAuthHeader(email, apiToken)
  // Agile API uses a different base path
  const url = `${baseUrl}/rest/agile/1.0/board/${boardId}/sprint?state=active,future`
  const res = await fetch(url, {
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = (Array.isArray(data.errorMessages) && data.errorMessages[0]) || JSON.stringify(data)
    throw new Error(msg || `Jira API error ${res.status}`)
  }
  return (data.values || []).map(s => ({ id: s.id, name: s.name, state: s.state }))
}

export async function searchIssues({ baseUrl, email, apiToken, jql }) {
  const authHeader = buildAuthHeader(email, apiToken)
  const data = await jiraFetch(
    baseUrl,
    `/search?jql=${encodeURIComponent(jql)}&maxResults=50&fields=summary,status,issuetype,assignee,priority`,
    {},
    authHeader
  )
  return (data.issues || []).map(issue => ({
    key: issue.key,
    summary: issue.fields?.summary || issue.key,
    status: issue.fields?.status?.name || null,
    issueType: issue.fields?.issuetype?.name || null,
    assignee: issue.fields?.assignee?.displayName || null,
    priority: issue.fields?.priority?.name || null,
  }))
}

export async function createTickets({ jira, tree }) {
  const { baseUrl, email, apiToken, projectKey, projectType, depthMap, sprintId } = jira
  const { nodes, rootId } = tree
  const authHeader = buildAuthHeader(email, apiToken)

  const depthMapInt = Object.fromEntries(
    Object.entries(depthMap).map(([k, v]) => [parseInt(k, 10), v])
  )
  const depthKeys = Object.keys(depthMapInt).map(Number).filter(k => isFinite(k))
  if (depthKeys.length === 0) throw new Error('depthMap must have at least one entry')
  const maxDepthKey = Math.max(...depthKeys)

  function getIssueType(depth) {
    return depthMapInt[depth] !== undefined ? depthMapInt[depth] : depthMapInt[maxDepthKey]
  }

  const createdMap = {}
  const tickets = []
  const keyMap = {} // nodeId → jiraKey for two-way sync
  const queue = [rootId]

  while (queue.length > 0) {
    const nodeId = queue.shift()
    const node = nodes[nodeId]
    if (!node) continue

    // Use per-node issueType override if set, otherwise use depth map
    const issueType = node.issueType
      ? node.issueType.charAt(0).toUpperCase() + node.issueType.slice(1)
      : getIssueType(node.depth)
    const parentInfo = node.parentId ? createdMap[node.parentId] : null

    const fields = {
      project: { key: projectKey },
      summary: node.title,
      issuetype: { name: issueType },
    }

    // Description from notes
    if (node.notes) {
      fields.description = {
        type: 'doc', version: 1,
        content: [{ type: 'paragraph', content: [{ type: 'text', text: node.notes }] }],
      }
    }

    // Story points
    if (node.storyPoints != null) {
      fields.story_points = node.storyPoints
      fields.customfield_10016 = node.storyPoints // common custom field for story points
    }

    // Priority
    if (node.priority) {
      const priorityMap = { critical: 'Highest', high: 'High', medium: 'Medium', low: 'Low' }
      fields.priority = { name: priorityMap[node.priority] || node.priority }
    }

    // Due date
    if (node.dueDate) {
      fields.duedate = node.dueDate
    }

    // Assignee
    if (node.assignee) {
      fields.assignee = { name: node.assignee }
    }

    // Sprint
    if (sprintId) {
      fields.customfield_10020 = { id: parseInt(sprintId, 10) }
    }

    // Parent linking
    if (parentInfo) {
      if (projectType === 'next-gen') {
        fields.parent = { id: parentInfo.jiraId }
      } else {
        if (issueType.toLowerCase() === 'subtask') {
          fields.parent = { id: parentInfo.jiraId }
        } else {
          fields.customfield_10014 = parentInfo.jiraKey
        }
      }
    }

    const created = await jiraFetch(
      baseUrl,
      '/issue',
      { method: 'POST', body: JSON.stringify({ fields }) },
      authHeader
    )

    createdMap[nodeId] = { jiraId: created.id, jiraKey: created.key }
    keyMap[nodeId] = created.key
    tickets.push({ key: created.key, title: node.title })

    for (const childId of node.childIds) {
      queue.push(childId)
    }
  }

  return { tickets, keyMap }
}
