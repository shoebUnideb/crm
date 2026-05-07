const listeners = new Map()

export const eventBus = {
  on(event, callback) {
    if (!listeners.has(event)) listeners.set(event, new Set())
    listeners.get(event).add(callback)
    return () => listeners.get(event)?.delete(callback)
  },

  off(event, callback) {
    listeners.get(event)?.delete(callback)
  },

  emit(event, payload) {
    const cbs = listeners.get(event)
    if (cbs) cbs.forEach(cb => cb(payload))
  },
}

export const EVENTS = {
  CRM_DEAL_LINKED: 'crm:deal_linked',
  CRM_DEAL_UNLINKED: 'crm:deal_unlinked',
  NODE_LINKS_CHANGED: 'node:links_changed',
  NODE_DELETED: 'node:deleted',
}
