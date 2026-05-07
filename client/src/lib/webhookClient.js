const STORAGE_KEY = 'chart-to-jira-webhooks'

export function loadWebhooks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch {
    return []
  }
}

export function saveWebhooks(webhooks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(webhooks))
}

// events: 'status_change' | 'node_created' | 'node_deleted' | 'comment_added' | 'jira_synced'
export async function fireWebhooks(eventType, payload) {
  const webhooks = loadWebhooks()
  const active = webhooks.filter(w => w.active && w.events.includes(eventType) && w.url?.trim())

  for (const webhook of active) {
    try {
      const body = webhook.format === 'slack'
        ? { text: formatSlackMessage(eventType, payload) }
        : { event: eventType, timestamp: new Date().toISOString(), ...payload }

      await fetch(webhook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        mode: 'no-cors',
      })
    } catch {
      // Silent failure — webhooks are best-effort
    }
  }
}

function formatSlackMessage(eventType, payload) {
  switch (eventType) {
    case 'status_change':
      return `*${payload.nodeTitle}* status changed to *${payload.status}* in _${payload.projectName}_`
    case 'node_created':
      return `New node *${payload.nodeTitle}* created in _${payload.projectName}_`
    case 'node_deleted':
      return `Node *${payload.nodeTitle}* deleted from _${payload.projectName}_`
    case 'comment_added':
      return `*${payload.author}* commented on *${payload.nodeTitle}*: ${payload.text}`
    case 'jira_synced':
      return `Jira ticket *${payload.jiraKey}* synced for *${payload.nodeTitle}* in _${payload.projectName}_`
    default:
      return `[${eventType}] ${JSON.stringify(payload)}`
  }
}
