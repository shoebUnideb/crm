import React from 'react'
import { NODE_COLORS } from '../../lib/nodeColors.js'
import { getShapeDims, getPortPoint } from '../../lib/nodeShapes.js'

// Orthogonal elbow path for top-down tree layout
function elbowPath(x1, y1, x2, y2) {
  if (Math.abs(x1 - x2) < 1) return `M ${x1} ${y1} L ${x2} ${y2}`
  const midY = (y1 + y2) / 2
  return `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`
}

// Smooth bezier path for curved tree edges
function bezierPath(x1, y1, x2, y2) {
  const cp = (y2 - y1) * 0.5
  return `M ${x1} ${y1} C ${x1} ${y1 + cp}, ${x2} ${y2 - cp}, ${x2} ${y2}`
}

// type: 'tree' | 'extra' | 'ghost'
// edgeType (for extra): undefined | 'blocker' | 'dependency'
export default function TreeEdge({ fromNode, toNode, type = 'tree', toX, toY, isSelected, onClick, edgeType, label, curved = false }) {
  const fromDims = getShapeDims(fromNode?.shape)
  const toDims = getShapeDims(toNode?.shape)

  const fromCX = fromNode?.x ?? 0
  const fromCY = fromNode?.y ?? 0
  const toCX = type === 'ghost' ? toX : (toNode?.x ?? 0)
  const toCY = type === 'ghost' ? toY : (toNode?.y ?? 0)

  if (type === 'ghost') {
    const fromPort = getPortPoint(fromCX, fromCY, fromDims.w, fromDims.h, toCX, toCY)
    return (
      <line
        x1={fromPort.x} y1={fromPort.y}
        x2={toCX} y2={toCY}
        stroke="#3B82F6"
        strokeWidth="2"
        strokeDasharray="6 4"
        strokeOpacity="0.8"
        style={{ pointerEvents: 'none' }}
      />
    )
  }

  if (type === 'tree') {
    const x1 = fromCX
    const y1 = fromCY + fromDims.h / 2
    const x2 = toCX
    const y2 = toCY - toDims.h / 2
    const strokeColor = fromNode?.color
      ? (NODE_COLORS[fromNode.color]?.border ?? '#94A3B8')
      : '#94A3B8'
    const sw = fromNode?.storyPoints ? Math.min(4, 1.5 + fromNode.storyPoints / 8) : 1.5
    return (
      <path
        d={curved ? bezierPath(x1, y1, x2, y2) : elbowPath(x1, y1, x2, y2)}
        fill="none"
        stroke={strokeColor}
        strokeWidth={sw}
        strokeOpacity="0.7"
        style={{ pointerEvents: 'none' }}
      />
    )
  }

  // extra edge — styled by edgeType
  const isBlocker = edgeType === 'blocker'
  const isDependency = edgeType === 'dependency'

  let strokeColor = '#64748B'
  let strokeDash = 'none'
  let arrowId = 'arrowhead'
  if (isSelected) {
    strokeColor = '#3B82F6'
    arrowId = 'arrowhead-selected'
  } else if (isBlocker) {
    strokeColor = '#EF4444'
    strokeDash = '8 4'
    arrowId = 'arrowhead-blocker'
  } else if (isDependency) {
    strokeColor = '#8B5CF6'
    strokeDash = '6 3'
    arrowId = 'arrowhead-dependency'
  }

  const fromPort = getPortPoint(fromCX, fromCY, fromDims.w, fromDims.h, toCX, toCY)
  const toPort = getPortPoint(toCX, toCY, toDims.w, toDims.h, fromCX, fromCY)
  return (
    <g onClick={onClick} data-edge="true" style={{ cursor: onClick ? 'pointer' : 'default' }}>
      {/* Wider invisible stroke for easier clicking */}
      <line
        x1={fromPort.x} y1={fromPort.y}
        x2={toPort.x} y2={toPort.y}
        stroke="transparent"
        strokeWidth="12"
        style={{ pointerEvents: 'stroke' }}
      />
      <line
        x1={fromPort.x} y1={fromPort.y}
        x2={toPort.x} y2={toPort.y}
        stroke={strokeColor}
        strokeWidth={isSelected ? 2.5 : 2}
        strokeOpacity="0.9"
        strokeDasharray={strokeDash === 'none' ? undefined : strokeDash}
        markerEnd={`url(#${arrowId})`}
        style={{ pointerEvents: 'none' }}
      />
      {label && (
        <text
          x={(fromPort.x + toPort.x) / 2}
          y={(fromPort.y + toPort.y) / 2 - 6}
          textAnchor="middle"
          fontSize="10"
          fill={strokeColor}
          fontWeight="600"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {label}
        </text>
      )}
    </g>
  )
}

