import { useRef, useState, useCallback, useEffect } from 'react'
import { NODE_WIDTH, NODE_HEIGHT } from './useLayout.js'

const MIN_SCALE = 0.1
const MAX_SCALE = 5

export function usePanZoom() {
  const [transform, setTransform] = useState({ scale: 1, translateX: 0, translateY: 60 })
  const svgRef = useRef(null)
  const isPanning = useRef(false)
  const panStart = useRef(null)
  const panDist = useRef(0)

  const centerView = useCallback((canvasWidth, canvasHeight) => {
    setTransform({ scale: 1, translateX: canvasWidth / 2, translateY: canvasHeight * 0.15 })
  }, [])

  const resetView = useCallback(() => {
    const svg = svgRef.current
    if (!svg) return
    const { width, height } = svg.getBoundingClientRect()
    centerView(width, height)
  }, [centerView])

  const zoomIn = useCallback(() => {
    const svg = svgRef.current
    if (!svg) return
    const { width, height } = svg.getBoundingClientRect()
    setTransform(t => {
      const newScale = Math.min(MAX_SCALE, t.scale * 1.25)
      const ratio = newScale / t.scale
      return {
        scale: newScale,
        translateX: width / 2 - (width / 2 - t.translateX) * ratio,
        translateY: height / 2 - (height / 2 - t.translateY) * ratio,
      }
    })
  }, [])

  const zoomOut = useCallback(() => {
    const svg = svgRef.current
    if (!svg) return
    const { width, height } = svg.getBoundingClientRect()
    setTransform(t => {
      const newScale = Math.max(MIN_SCALE, t.scale / 1.25)
      const ratio = newScale / t.scale
      return {
        scale: newScale,
        translateX: width / 2 - (width / 2 - t.translateX) * ratio,
        translateY: height / 2 - (height / 2 - t.translateY) * ratio,
      }
    })
  }, [])

  const fitToContent = useCallback((positions) => {
    const svg = svgRef.current
    if (!svg) return
    const posArr = Object.values(positions)
    if (posArr.length === 0) return
    const { width: canvasW, height: canvasH } = svg.getBoundingClientRect()
    const xs = posArr.map(p => p.x)
    const ys = posArr.map(p => p.y)
    const minX = Math.min(...xs) - NODE_WIDTH / 2
    const maxX = Math.max(...xs) + NODE_WIDTH / 2
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys) + NODE_HEIGHT
    const treeW = maxX - minX
    const treeH = maxY - minY
    const padding = 80
    const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.min(
      (canvasW - padding * 2) / treeW,
      (canvasH - padding * 2) / treeH
    )))
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2
    setTransform({
      scale,
      translateX: canvasW / 2 - centerX * scale,
      translateY: canvasH / 2 - centerY * scale,
    })
  }, [])

  const panToCenter = useCallback((cx, cy) => {
    const svg = svgRef.current
    if (!svg) return
    const { width, height } = svg.getBoundingClientRect()
    setTransform(t => ({
      ...t,
      translateX: width / 2 - cx * t.scale,
      translateY: height / 2 - cy * t.scale,
    }))
  }, [])

  const setScale = useCallback((targetScale) => {
    const svg = svgRef.current
    if (!svg) return
    const { width, height } = svg.getBoundingClientRect()
    setTransform(t => {
      const clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, targetScale))
      const ratio = clamped / t.scale
      return {
        scale: clamped,
        translateX: width / 2 - (width / 2 - t.translateX) * ratio,
        translateY: height / 2 - (height / 2 - t.translateY) * ratio,
      }
    })
  }, [])

  const onWheel = useCallback((e) => {
    e.preventDefault()
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top

    // Normalize delta across deltaMode: 0=pixels, 1=lines, 2=pages
    let dy = e.deltaY
    let dx = e.deltaX
    if (e.deltaMode === 1) { dy *= 16; dx *= 16 }
    else if (e.deltaMode === 2) { dy *= 500; dx *= 500 }

    // ctrlKey=true is synthesized by browsers for trackpad pinch gestures AND Ctrl+scroll
    // Plain scroll = zoom centered on cursor; pinch/Ctrl = same
    const clampedDy = Math.max(-200, Math.min(200, dy))
    const factor = Math.exp(-clampedDy * 0.003)
    setTransform(t => {
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, t.scale * factor))
      const ratio = newScale / t.scale
      return {
        scale: newScale,
        translateX: cx - (cx - t.translateX) * ratio,
        translateY: cy - (cy - t.translateY) * ratio,
      }
    })
  }, [])

  const onMouseDown = useCallback((e) => {
    if (e.target.closest('[data-node]')) return
    isPanning.current = true
    panDist.current = 0
    panStart.current = { x: e.clientX, y: e.clientY, originX: e.clientX, originY: e.clientY }
    e.currentTarget.style.cursor = 'grabbing'
  }, [])

  const onMouseMove = useCallback((e) => {
    if (!isPanning.current || !panStart.current) return
    const dx = e.clientX - panStart.current.x
    const dy = e.clientY - panStart.current.y
    panDist.current = Math.hypot(e.clientX - panStart.current.originX, e.clientY - panStart.current.originY)
    panStart.current = { ...panStart.current, x: e.clientX, y: e.clientY }
    setTransform(t => ({ ...t, translateX: t.translateX + dx, translateY: t.translateY + dy }))
  }, [])

  const onMouseUp = useCallback(() => {
    isPanning.current = false
    panStart.current = null
    if (svgRef.current) svgRef.current.style.cursor = ''
  }, [])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    svg.addEventListener('wheel', onWheel, { passive: false })
    return () => svg.removeEventListener('wheel', onWheel)
  }, [onWheel])

  const transformStr = `translate(${transform.translateX},${transform.translateY}) scale(${transform.scale})`

  return { transformStr, transform, svgRef, onMouseDown, onMouseMove, onMouseUp, resetView, centerView, zoomIn, zoomOut, fitToContent, panToCenter, setScale, panDist }
}
