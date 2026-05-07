import React from 'react'
import { getShapeDims, getPortPoint } from '../../lib/nodeShapes.js'

const EDGE_STYLES = {
  depends_on: { color: '#3B82F6', dash: '6 3', width: 2, arrow: 'arrow-dep' },
  blocks: { color: '#EF4444', dash: '8 4', width: 2.5, arrow: 'arrow-block' },
  linked_to: { color: '#10B981', dash: '4 4', width: 1.5, arrow: 'arrow-link' },
  supports: { color: '#8B5CF6', dash: '3 3', width: 1.5, arrow: 'arrow-support' },
}

function getStyle(relation) {
  return EDGE_STYLES[relation] || EDGE_STYLES.depends_on
}

function bezierEdge(x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  const cx1 = x1 + dx * 0.4
  const cy1 = y1
  const cx2 = x2 - dx * 0.4
  const cy2 = y2
  return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`
}

export default function OverlayRenderer({ overlay, nodes, opacity = 0.85 }) {
  if (!overlay || !nodes) return null
  const hasEdges = overlay.edges?.length > 0
  const hasHighlights = overlay.nodeHighlights?.length > 0
  if (!hasEdges && !hasHighlights) return null

  const edges = (overlay.edges || []).map((edge, i) => {
    const fromNode = nodes[edge.from]
    const toNode = nodes[edge.to]
    if (!fromNode || !toNode) return null

    const fromDims = getShapeDims(fromNode.shape)
    const toDims = getShapeDims(toNode.shape)
    const fromPort = getPortPoint(fromNode.x, fromNode.y, fromDims.w, fromDims.h, toNode.x, toNode.y)
    const toPort = getPortPoint(toNode.x, toNode.y, toDims.w, toDims.h, fromNode.x, fromNode.y)

    const style = getStyle(edge.relation)

    return (
      <g key={`overlay-edge-${i}`} opacity={opacity}>
        <path
          d={bezierEdge(fromPort.x, fromPort.y, toPort.x, toPort.y)}
          fill="none"
          stroke={style.color}
          strokeWidth={style.width}
          strokeDasharray={style.dash}
          markerEnd={`url(#${style.arrow})`}
          style={{ pointerEvents: 'none' }}
        />
        {edge.company_name && (
          <text
            x={(fromPort.x + toPort.x) / 2}
            y={(fromPort.y + toPort.y) / 2 - 8}
            textAnchor="middle"
            fontSize="9"
            fill={style.color}
            fontWeight="600"
            opacity="0.9"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {edge.company_name}{edge.deal_value ? ` ($${(edge.deal_value / 1000).toFixed(0)}k)` : ''}
          </text>
        )}
      </g>
    )
  })

  const highlights = (overlay.nodeHighlights || []).map((h, i) => {
    const node = nodes[h.nodeId]
    if (!node) return null
    const dims = getShapeDims(node.shape)
    return (
      <g key={`overlay-highlight-${i}`} style={{ pointerEvents: 'none' }}>
        <rect
          x={node.x - dims.w / 2 - 4}
          y={node.y - dims.h / 2 - 4}
          width={dims.w + 8}
          height={dims.h + 8}
          rx={8}
          fill="none"
          stroke={h.borderColor}
          strokeWidth={2.5}
          strokeDasharray="4 2"
          opacity={0.8}
        />
        {h.badge && (
          <g>
            <rect
              x={node.x + dims.w / 2 - 8}
              y={node.y - dims.h / 2 - 14}
              width={Math.max(h.badge.length * 7 + 6, 20)}
              height={16}
              rx={8}
              fill={h.borderColor}
            />
            <text
              x={node.x + dims.w / 2 - 8 + Math.max(h.badge.length * 7 + 6, 20) / 2}
              y={node.y - dims.h / 2 - 3}
              textAnchor="middle"
              fontSize="9"
              fill="white"
              fontWeight="700"
              style={{ userSelect: 'none' }}
            >
              {h.badge}
            </text>
          </g>
        )}
      </g>
    )
  })

  return (
    <g className="graph-overlay-layer">
      <defs>
        <marker id="arrow-dep" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#3B82F6" />
        </marker>
        <marker id="arrow-block" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#EF4444" />
        </marker>
        <marker id="arrow-link" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#10B981" />
        </marker>
        <marker id="arrow-support" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#8B5CF6" />
        </marker>
      </defs>
      {edges}
      {highlights}
    </g>
  )
}
