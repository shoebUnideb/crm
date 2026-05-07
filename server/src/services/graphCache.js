const cache = new Map()
const MAX_ENTRIES = 500
const DEFAULT_TTL = 60_000

function getCacheKey(projectId, startNode, direction, relations, maxDepth) {
  const rel = relations ? relations.sort().join(',') : '*'
  return `${projectId}:${startNode}:${direction}:${rel}:${maxDepth}`
}

export function get(projectId, startNode, direction, relations, maxDepth) {
  const key = getCacheKey(projectId, startNode, direction, relations, maxDepth)
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiry) {
    cache.delete(key)
    return null
  }
  return entry.result
}

export function set(projectId, startNode, direction, relations, maxDepth, result) {
  const key = getCacheKey(projectId, startNode, direction, relations, maxDepth)
  const serialized = JSON.stringify(result)
  if (serialized.length > 1_000_000) return
  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value
    cache.delete(oldest)
  }
  cache.set(key, { result, expiry: Date.now() + DEFAULT_TTL })
}

export function invalidateProject(projectId) {
  for (const key of cache.keys()) {
    if (key.startsWith(projectId + ':')) cache.delete(key)
  }
}

export function stats() {
  return { entries: cache.size, maxEntries: MAX_ENTRIES }
}
