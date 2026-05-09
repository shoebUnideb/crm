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
  LINK_CREATED: 'link:created',
  LINK_DELETED: 'link:deleted',
  NODE_LINKS_CHANGED: 'node:links_changed',
  NODE_DELETED: 'node:deleted',
  GRAPH_OVERLAY_INVALIDATED: 'graph:overlay_invalidated',
  GRAPH_EDGE_CREATED: 'graph:edge_created',
  GRAPH_EDGE_DELETED: 'graph:edge_deleted',
  KICKED_FROM_PROJECT: 'collab:kicked',
}
