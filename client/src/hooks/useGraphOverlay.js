import { useState, useEffect, useCallback, useRef } from 'react'
import { graphApi } from '../lib/graphApi.js'
import { eventBus, EVENTS } from '../lib/eventBus.js'

export function useGraphOverlay(projectId, overlayType, enabled = false) {
  const [overlay, setOverlay] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)

  const fetchOverlay = useCallback(async () => {
    if (!projectId || !overlayType || !enabled) return
    setLoading(true)
    setError(null)
    try {
      const result = await graphApi.overlay({ projectId, overlayType })
      setOverlay(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [projectId, overlayType, enabled])

  useEffect(() => {
    if (enabled) fetchOverlay()
    else setOverlay(null)
  }, [enabled, fetchOverlay])

  useEffect(() => {
    if (!enabled) return
    const unsub = eventBus.on(EVENTS.GRAPH_OVERLAY_INVALIDATED, () => {
      fetchOverlay()
    })
    return unsub
  }, [enabled, fetchOverlay])

  return { overlay, loading, error, refetch: fetchOverlay }
}

export function useGraphTraversal() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const traverse = useCallback(async (params) => {
    setLoading(true)
    try {
      const data = await graphApi.traverse(params)
      setResult(data)
      return data
    } catch (err) {
      setResult(null)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getImpact = useCallback(async (params) => {
    setLoading(true)
    try {
      const data = await graphApi.impact(params)
      setResult(data)
      return data
    } catch (err) {
      setResult(null)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const findPaths = useCallback(async (params) => {
    setLoading(true)
    try {
      const data = await graphApi.paths(params)
      setResult(data)
      return data
    } catch (err) {
      setResult(null)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { result, loading, traverse, getImpact, findPaths }
}
