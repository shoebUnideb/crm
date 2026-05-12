import { useState, useEffect, useCallback } from 'react'
import { linksApi } from '../lib/linksApi.js'
import { eventBus, EVENTS } from '../lib/eventBus.js'

export function useNodeLinks(projectId) {
  const [linkMap, setLinkMap] = useState({})
  const [loading, setLoading] = useState(false)

  const fetchLinks = useCallback(async () => {
    if (!projectId) { setLinkMap({}); return }
    setLoading(true)
    try {
      const links = await linksApi.getForProject(projectId, 'node')
      const map = {}
      for (const link of links) {
        if (!map[link.source_id]) map[link.source_id] = []
        map[link.source_id].push(link)
      }
      setLinkMap(map)
    } catch {
      setLinkMap({})
    }
    setLoading(false)
  }, [projectId])

  useEffect(() => { fetchLinks() }, [fetchLinks])

  useEffect(() => {
    const unsub1 = eventBus.on(EVENTS.LINK_CREATED, fetchLinks)
    const unsub2 = eventBus.on(EVENTS.LINK_DELETED, fetchLinks)
    const unsub3 = eventBus.on(EVENTS.NODE_LINKS_CHANGED, fetchLinks)
    return () => { unsub1(); unsub2(); unsub3() }
  }, [fetchLinks])

  // Soft-delete links when a node is deleted
  useEffect(() => {
    const handleNodeDeleted = async ({ nodeId }) => {
      if (!linkMap[nodeId]?.length) return
      try {
        await linksApi.removeBySource('node', nodeId)
        fetchLinks()
      } catch { /* silent */ }
    }
    const unsub = eventBus.on(EVENTS.NODE_DELETED, handleNodeDeleted)
    return unsub
  }, [linkMap, fetchLinks])

  return { linkMap, loading, refetch: fetchLinks }
}
