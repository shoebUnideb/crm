import React, { useEffect, useRef, useCallback } from 'react'
import { getShapeDims } from '../../lib/nodeShapes.js'

const W = 160
const H = 110
const PAD = 16

export default function Minimap({ nodes, transform, svgRef, onNavigate }) {
  const canvasRef = useRef(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, W, H)

    const nodeArr = Object.values(nodes).filter(n => n.x != null)
    if (nodeArr.length === 0) return

    // Compute bounding box of all nodes
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (const n of nodeArr) {
      const d = getShapeDims(n.shape)
      minX = Math.min(minX, n.x - d.w / 2)
      maxX = Math.max(maxX, n.x + d.w / 2)
      minY = Math.min(minY, n.y - d.h / 2)
      maxY = Math.max(maxY, n.y + d.h / 2)
    }
    const bw = maxX - minX || 1
    const bh = maxY - minY || 1
    const scale = Math.min((W - PAD * 2) / bw, (H - PAD * 2) / bh)
    const ox = (W - bw * scale) / 2 - minX * scale
    const oy = (H - bh * scale) / 2 - minY * scale

    // Background
    ctx.fillStyle = '#F8FAFC'
    ctx.fillRect(0, 0, W, H)

    // Nodes
    for (const n of nodeArr) {
      const d = getShapeDims(n.shape)
      const nx = n.x * scale + ox
      const ny = n.y * scale + oy
      const nw = d.w * scale
      const nh = d.h * scale
      ctx.fillStyle = '#94A3B8'
      ctx.beginPath()
      ctx.roundRect(nx - nw / 2, ny - nh / 2, nw, nh, 2)
      ctx.fill()
    }

    // Viewport rect
    const svg = svgRef.current
    if (svg) {
      const { width: vw, height: vh } = svg.getBoundingClientRect()
      const vpX = (-transform.translateX / transform.scale) * scale + ox
      const vpY = (-transform.translateY / transform.scale) * scale + oy
      const vpW = (vw / transform.scale) * scale
      const vpH = (vh / transform.scale) * scale
      ctx.strokeStyle = '#3B82F6'
      ctx.lineWidth = 1.5
      ctx.strokeRect(vpX, vpY, vpW, vpH)
      ctx.fillStyle = 'rgba(59,130,246,0.06)'
      ctx.fillRect(vpX, vpY, vpW, vpH)
    }

    // Store mapping for click handler
    canvas._mapScale = scale
    canvas._mapOx = ox
    canvas._mapOy = oy
  }, [nodes, transform, svgRef])

  useEffect(() => { draw() }, [draw])

  function handleClick(e) {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    // Convert minimap click → canvas coords
    const cx = (mx - canvas._mapOx) / canvas._mapScale
    const cy = (my - canvas._mapOy) / canvas._mapScale
    onNavigate(cx, cy)
  }

  return (
    <div className="absolute bottom-16 left-4 z-10 rounded-lg overflow-hidden border border-gray-200 shadow-md bg-white" style={{ width: W, height: H }}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        onClick={handleClick}
        style={{ cursor: 'crosshair', display: 'block' }}
      />
    </div>
  )
}
