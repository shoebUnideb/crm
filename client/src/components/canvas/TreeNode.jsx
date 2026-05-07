import React from 'react'
import { NODE_COLORS } from '../../lib/nodeColors.js'
import { getShapeDims } from '../../lib/nodeShapes.js'
import InlineEditor from './InlineEditor.jsx'

const MAX_CHARS = 22
const PORT_DIRS = ['N', 'S', 'E', 'W']

const STATUS_COLORS = { todo: '#9CA3AF', 'in-progress': '#3B82F6', done: '#22C55E', blocked: '#EF4444' }
const PRIORITY_COLORS = { critical: '#EF4444', high: '#F97316', medium: '#EAB308', low: '#22C55E' }
const PRIORITY_LABELS = { critical: 'C', high: 'H', medium: 'M', low: 'L' }
const ISSUE_TYPE_ICONS = { epic: '🟣', story: '🟢', task: '🔵', bug: '🔴', subtask: '⚪' }

function portCoords(w, h, dir) {
  switch (dir) {
    case 'N': return { x: 0,    y: -h / 2 }
    case 'S': return { x: 0,    y:  h / 2 }
    case 'E': return { x:  w / 2, y: 0 }
    case 'W': return { x: -w / 2, y: 0 }
  }
}

function getInitials(str) {
  if (!str) return ''
  return str.trim().split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase()
}

export default function TreeNode({
  node, isSelected, isEditing, isRoot, isHovered, isDragging, isEdgeTarget, isDropTarget, isMultiSelected,
  rollupPct, colorOverride, dimmed, compactMode, sizeScale = 1, crmLinked,
  onSelect, onDelete, onEdit, onStopEditing, onToggleCollapse, onAdd,
  onNodeMouseDown, onPortMouseDown,
  onMouseEnter, onMouseLeave, onDoubleClick, onContextMenu,
}) {
  const { w: baseW, h: baseH } = getShapeDims(node.shape)
  const w = baseW * sizeScale
  const h = baseH * sizeScale
  const { x: cx, y: cy } = node
  const originX = cx - w / 2
  const originY = cy - h / 2

  const isSticky = node.shape === 'sticky'
  const defaultBg = isSticky ? '#FEFCE8' : '#FFFFFF'
  const defaultBorder = isSticky ? '#FDE047' : '#D1D5DB'

  const baseColors = colorOverride ?? (NODE_COLORS[node.color] ?? { bg: defaultBg, border: defaultBorder })
  const bgColor = isSelected ? '#EFF6FF' : isMultiSelected ? '#F0FDF4' : baseColors.bg
  const borderColor = isSelected ? '#3B82F6' : isMultiSelected ? '#22C55E' : baseColors.border
  const borderWidth = (isSelected || isMultiSelected) ? 2 : 1

  const showPortsOnHover = isHovered && !isSelected
  const hasChildren = node.childIds.length > 0

  const truncated = node.title.length > MAX_CHARS
    ? node.title.slice(0, MAX_CHARS) + '…'
    : node.title

  const statusColor = STATUS_COLORS[node.status]
  const overdue = node.dueDate && new Date(node.dueDate) < new Date() && node.status !== 'done'

  // Indicator positions at bottom-right
  const indicators = []
  if (node.url) indicators.push('url')
  if (node.notes) indicators.push('notes')

  function renderShape() {
    switch (node.shape) {
      case 'circle':
        return (
          <ellipse
            cx={w / 2} cy={h / 2} rx={w / 2} ry={h / 2}
            fill={bgColor} stroke={borderColor} strokeWidth={borderWidth}
            style={{ cursor: 'pointer', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.1))' }}
            onClick={onSelect}
            onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick?.() }}
          />
        )
      case 'diamond': {
        const pts = `${w / 2},0 ${w},${h / 2} ${w / 2},${h} 0,${h / 2}`
        return (
          <polygon
            points={pts}
            fill={bgColor} stroke={borderColor} strokeWidth={borderWidth}
            style={{ cursor: 'pointer', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.1))' }}
            onClick={onSelect}
            onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick?.() }}
          />
        )
      }
      case 'sticky': {
        const fold = 14
        const pts = `0,0 ${w - fold},0 ${w},${fold} ${w},${h} 0,${h}`
        return (
          <g onClick={onSelect} onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick?.() }}>
            <polygon
              points={pts}
              fill={bgColor} stroke={borderColor} strokeWidth={borderWidth}
              style={{ cursor: 'pointer', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.12))' }}
            />
            <polyline
              points={`${w - fold},0 ${w - fold},${fold} ${w},${fold}`}
              fill="none" stroke={borderColor} strokeWidth={borderWidth * 0.8}
              style={{ pointerEvents: 'none' }}
            />
          </g>
        )
      }
      default: // rect
        return (
          <rect
            width={w} height={h} rx="8" ry="8"
            fill={bgColor} stroke={borderColor} strokeWidth={borderWidth}
            style={{ cursor: 'pointer', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.1))' }}
            onClick={onSelect}
            onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick?.() }}
          />
        )
    }
  }

  return (
    <g
      transform={`translate(${originX},${originY})`}
      data-node={node.id}
      style={{ opacity: isDragging ? 0.7 : dimmed ? 0.2 : 1, transition: 'opacity 0.15s' }}
      onMouseDown={(e) => { e.stopPropagation(); onNodeMouseDown(node.id, e) }}
      onMouseEnter={() => onMouseEnter(node.id)}
      onMouseLeave={() => onMouseLeave(node.id)}
      onContextMenu={onContextMenu}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Shape */}
      {renderShape()}

      {/* Status strip on left edge (rect + sticky shapes only) */}
      {statusColor && (node.shape === 'rect' || node.shape === 'sticky') && (
        <rect x={0} y={5} width={3} height={h - 10} rx={1.5} fill={statusColor} style={{ pointerEvents: 'none' }} />
      )}

      {/* Completion progress bar at bottom (for parent nodes with status data) */}
      {hasChildren && rollupPct != null && (
        <g style={{ pointerEvents: 'none' }}>
          <rect x={4} y={h - 4} width={w - 8} height={3} rx={1.5} fill="#E5E7EB" />
          <rect x={4} y={h - 4} width={(w - 8) * rollupPct / 100} height={3} rx={1.5} fill="#22C55E" />
        </g>
      )}

      {/* Progress ring — top-right corner overlay, only when rollupPct > 0, not compact */}
      {!compactMode && hasChildren && rollupPct != null && rollupPct > 0 && (() => {
        const R = 9
        const CX = w - 11
        const CY = 11
        const pct = rollupPct / 100
        const angle = pct * 2 * Math.PI
        const x1 = CX + R * Math.sin(0)
        const y1 = CY - R * Math.cos(0)
        const x2 = CX + R * Math.sin(angle)
        const y2 = CY - R * Math.cos(angle)
        const large = pct > 0.5 ? 1 : 0
        const arcPath = pct >= 1
          ? `M ${CX} ${CY - R} A ${R} ${R} 0 1 1 ${CX - 0.001} ${CY - R}`
          : `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`
        return (
          <g style={{ pointerEvents: 'none' }}>
            <circle cx={CX} cy={CY} r={R} fill="rgba(255,255,255,0.9)" stroke="#E5E7EB" strokeWidth={1.5} />
            <path d={arcPath} fill="none" stroke="#22C55E" strokeWidth={2.5} strokeLinecap="round" />
            <text x={CX} y={CY} textAnchor="middle" dominantBaseline="middle" fontSize="7" fill="#374151" fontWeight="700">
              {rollupPct}%
            </text>
          </g>
        )
      })()}

      {/* Edge-target highlight ring */}
      {isEdgeTarget && (
        <rect
          x={-4} y={-4} width={w + 8} height={h + 8} rx="10" ry="10"
          fill="none" stroke="#3B82F6" strokeWidth={2.5} strokeDasharray="5 3"
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Drop-target highlight (reparent) */}
      {isDropTarget && (
        <rect
          x={-5} y={-5} width={w + 10} height={h + 10} rx="10" ry="10"
          fill="rgba(34,197,94,0.08)" stroke="#22C55E" strokeWidth={2.5}
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Title or inline editor */}
      {isEditing ? (
        <foreignObject x="8" y={(h - 28) / 2} width={w - 16} height={28}>
          <div xmlns="http://www.w3.org/1999/xhtml" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
            <InlineEditor value={node.title} onSave={onEdit} onCancel={onStopEditing} />
          </div>
        </foreignObject>
      ) : (
        <>
          <text
            x={hasChildren ? (w - 20) / 2 + (node.priority ? 5 : 0) : w / 2 + (node.priority ? 3 : 0)}
            y={node.alias ? h / 2 - 6 : h / 2 - (rollupPct != null ? 2 : 0)}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="13"
            fill="#374151"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {truncated}
          </text>
          {node.alias && (
            <text
              x={w / 2}
              y={h / 2 + 10}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="9"
              fill="#9CA3AF"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {node.alias.length > 28 ? node.alias.slice(0, 28) + '…' : node.alias}
            </text>
          )}
        </>
      )}

      {/* Priority indicator — small colored dot top-left inside node */}
      {!compactMode && node.priority && (
        <circle cx={9} cy={9} r={4} fill={PRIORITY_COLORS[node.priority]} style={{ pointerEvents: 'none' }}>
          <title>{node.priority}</title>
        </circle>
      )}

      {/* Issue type icon or custom icon — top-left (after priority) */}
      {!compactMode && (node.icon || (node.issueType && ISSUE_TYPE_ICONS[node.issueType])) && (
        <text
          x={node.priority ? 20 : 9}
          y={9}
          fontSize="9"
          dominantBaseline="middle"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >{node.icon || ISSUE_TYPE_ICONS[node.issueType]}</text>
      )}

      {/* Assignee initials — above top-right of node */}
      {!compactMode && node.assignee && (
        <g transform={`translate(${w - 10}, -14)`} style={{ pointerEvents: 'none' }}>
          <circle cx={0} cy={0} r={9} fill="#818CF8" stroke="white" strokeWidth={1.5} />
          <text x={0} y={0} textAnchor="middle" dominantBaseline="middle" fontSize="7" fill="white" fontWeight="700">
            {getInitials(node.assignee)}
          </text>
        </g>
      )}

      {/* Story points badge — above top-left of node */}
      {!compactMode && node.storyPoints != null && (
        <g transform={`translate(${-2}, -14)`} style={{ pointerEvents: 'none' }}>
          <rect width={26} height={16} rx={8} fill="#6B7280" />
          <text x={13} y={8} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="white" fontWeight="600">
            {node.storyPoints}
          </text>
        </g>
      )}

      {/* Jira key badge — below node */}
      {!compactMode && node.jiraKey && (
        <g transform={`translate(${w / 2 - 22}, ${h + (node.collapsed ? 22 : 4)})`} style={{ pointerEvents: 'none' }}>
          <rect width={44} height={14} rx={7} fill="#EFF6FF" stroke="#BFDBFE" strokeWidth={0.8} />
          <text x={22} y={7} textAnchor="middle" dominantBaseline="middle" fontSize="8.5" fill="#3B82F6" fontWeight="600">
            {node.jiraKey.length > 10 ? node.jiraKey.slice(0, 10) : node.jiraKey}
          </text>
        </g>
      )}

      {/* CRM deal badge — below node, offset right of Jira key */}
      {!compactMode && crmLinked && (
        <g transform={`translate(${w / 2 + (node.jiraKey ? 26 : -12)}, ${h + (node.collapsed ? 22 : 4)})`} style={{ pointerEvents: 'none' }}>
          <rect width={24} height={14} rx={7} fill="#F0FDF4" stroke="#86EFAC" strokeWidth={0.8} />
          <text x={12} y={7} textAnchor="middle" dominantBaseline="middle" fontSize="8.5" fill="#15803D" fontWeight="700">$</text>
        </g>
      )}

      {/* Time tracking badge — shown when timeEstimate or timeLogged is set */}
      {!compactMode && (node.timeEstimate != null || node.timeLogged != null) && (
        <g transform={`translate(${w + 5}, ${h / 2 - 8})`} style={{ pointerEvents: 'none' }}>
          <rect width={36} height={16} rx={8}
            fill={node.timeLogged != null && node.timeEstimate != null && node.timeLogged > node.timeEstimate ? '#FEE2E2' : '#F0FDF4'}
            stroke={node.timeLogged != null && node.timeEstimate != null && node.timeLogged > node.timeEstimate ? '#FCA5A5' : '#86EFAC'}
            strokeWidth={0.8}
          />
          <text x={18} y={8} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill={node.timeLogged != null && node.timeEstimate != null && node.timeLogged > node.timeEstimate ? '#DC2626' : '#16A34A'} fontWeight="600">
            {node.timeLogged != null ? `${node.timeLogged}h` : ''}
            {node.timeEstimate != null ? `/${node.timeEstimate}h` : ''}
          </text>
        </g>
      )}

      {/* Overdue warning */}
      {!compactMode && overdue && (
        <g transform={`translate(${w + 3}, ${h / 2 - 8})`} style={{ pointerEvents: 'none' }}>
          <text fontSize="13">⚠️</text>
        </g>
      )}

      {/* Lock badge — top-right inside node */}
      {node.locked && (
        <g transform={`translate(${w - 18}, 4)`} style={{ pointerEvents: 'none' }}>
          <text fontSize="10">🔒</text>
        </g>
      )}

      {/* Reaction badges — below node */}
      {!compactMode && node.reactions && Object.keys(node.reactions).length > 0 && (
        <g transform={`translate(4, ${h + (node.collapsed ? 26 : node.jiraKey ? 22 : 6)})`} style={{ pointerEvents: 'none' }}>
          {Object.entries(node.reactions).slice(0, 4).map(([emoji, users], i) => (
            <g key={emoji} transform={`translate(${i * 30}, 0)`}>
              <rect width={26} height={14} rx={7} fill="rgba(0,0,0,0.06)" />
              <text x={5} y={7} dominantBaseline="middle" fontSize="8">{emoji}</text>
              <text x={17} y={7} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="#6B7280" fontWeight="600">{users.length}</text>
            </g>
          ))}
        </g>
      )}

      {/* Collapse toggle */}
      {hasChildren && (
        <g
          transform={`translate(${w - 22},${h / 2 - 9})`}
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); onToggleCollapse?.() }}
        >
          <rect width="18" height="18" rx="4" fill="rgba(0,0,0,0.07)" />
          <text x="9" y="9" textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#6B7280" style={{ pointerEvents: 'none' }}>
            {node.collapsed ? '▶' : '▼'}
          </text>
        </g>
      )}

      {/* Collapsed badge */}
      {node.collapsed && (
        <g transform={`translate(${w / 2 - 28},${h + 4})`} style={{ pointerEvents: 'none' }}>
          <rect width="56" height="18" rx="9" fill="#6B7280" />
          <text x="28" y="9" textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="white">
            {node.childIds.length} hidden
          </text>
        </g>
      )}

      {/* Delete button */}
      {!isRoot && (isSelected || isHovered) && (
        <g
          transform={`translate(${w - 10},-10)`}
          style={{ cursor: 'pointer' }}
          data-node={node.id}
          onClick={(e) => { e.stopPropagation(); onDelete?.() }}
        >
          <circle cx="8" cy="8" r="8" fill="#FEE2E2" />
          <text x="8" y="8" textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="#EF4444" style={{ pointerEvents: 'none' }}>×</text>
        </g>
      )}

      {/* Invisible hover bridge */}
      {!node.collapsed && !isSelected && (
        <rect
          x={w / 2 - 14} y={h}
          width={28} height={28}
          fill="transparent"
          style={{ cursor: 'default' }}
        />
      )}

      {/* Add child button */}
      {!node.collapsed && isHovered && !isSelected && (
        <g
          transform={`translate(${w / 2 - 10},${h + 6})`}
          style={{ cursor: 'pointer' }}
          data-node={node.id}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onAdd?.() }}
        >
          <circle cx="10" cy="10" r="10" fill="#E5E7EB" />
          <text x="10" y="10" textAnchor="middle" dominantBaseline="middle" fontSize="16" fill="#6B7280" style={{ pointerEvents: 'none' }}>+</text>
        </g>
      )}

      {/* Notes preview tooltip on hover */}
      {isHovered && !isSelected && node.notes && (
        <foreignObject
          x={w + 8} y={0}
          width={200} height={80}
          style={{ overflow: 'visible', pointerEvents: 'none' }}
        >
          <div xmlns="http://www.w3.org/1999/xhtml" style={{
            background: '#1E293B', color: '#F1F5F9', fontSize: '11px',
            borderRadius: '8px', padding: '7px 10px', lineHeight: '1.4',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            maxWidth: '200px', wordBreak: 'break-word',
            display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {node.notes}
          </div>
        </foreignObject>
      )}

      {/* Indicators bottom-right: URL + Notes */}
      {!compactMode && node.url && (
        <g transform={`translate(${w - 22}, ${h - 22})`} style={{ pointerEvents: 'none' }}>
          <circle cx="8" cy="8" r="8" fill="rgba(59,130,246,0.15)" />
          <text x="8" y="8" textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#3B82F6">🔗</text>
        </g>
      )}
      {!compactMode && node.notes && (
        <g transform={`translate(${node.url ? w - 42 : w - 22}, ${h - 22})`} style={{ pointerEvents: 'none' }}>
          <circle cx="8" cy="8" r="8" fill="rgba(234,179,8,0.15)" />
          <text x="8" y="8" textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#B45309">📝</text>
        </g>
      )}

      {/* Tags indicator */}
      {!compactMode && node.tags?.length > 0 && (
        <g transform={`translate(4, ${h - 22})`} style={{ pointerEvents: 'none' }}>
          <circle cx="8" cy="8" r="8" fill="rgba(139,92,246,0.15)" />
          <text x="8" y="8" textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="#7C3AED">{node.tags.length}</text>
        </g>
      )}

      {/* Comments indicator */}
      {!compactMode && (node.comments?.length ?? 0) > 0 && (
        <g transform={`translate(${node.tags?.length > 0 ? 22 : 4}, ${h - 22})`} style={{ pointerEvents: 'none' }}>
          <circle cx="8" cy="8" r="8" fill="rgba(249,115,22,0.15)" />
          <text x="8" y="8" textAnchor="middle" dominantBaseline="middle" fontSize="8" fill="#EA580C">{node.comments.length}</text>
        </g>
      )}

      {/* Image indicator badge — Feature 27 */}
      {!compactMode && node.imageUrl && (
        <g transform={`translate(${w - 62}, ${h - 22})`} style={{ pointerEvents: 'none' }}>
          <circle cx="8" cy="8" r="8" fill="rgba(239,68,68,0.15)" />
          <text x="8" y="8" textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#DC2626">🖼</text>
        </g>
      )}

      {/* Recurring indicator — Feature 28 */}
      {!compactMode && node.recurring && (
        <g transform={`translate(${w - 18}, ${h - 22})`} style={{ pointerEvents: 'none' }}>
          <circle cx="8" cy="8" r="8" fill="rgba(34,197,94,0.15)" />
          <text x="8" y="8" textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#16A34A">🔄</text>
        </g>
      )}

      {/* nodeKey badge — floating above the node, subtle ID chip */}
      {!compactMode && node.nodeKey && (
        <g transform={`translate(0, -16)`} style={{ pointerEvents: 'none' }}>
          <rect x={0} y={0} width={node.nodeKey.length * 6.2 + 8} height={13} rx={3} fill="#EFF6FF" stroke="#BFDBFE" strokeWidth={0.8} />
          <text x={4} y={7} dominantBaseline="middle" fontSize="8.5" fill="#2563EB" fontWeight="700" letterSpacing="0.04em" fontFamily="monospace">
            {node.nodeKey}
          </text>
        </g>
      )}

      {/* Checklist indicator badge */}
      {!compactMode && node.checklist?.length > 0 && (
        <g transform={`translate(${w - 18}, ${h + 5})`} style={{ pointerEvents: 'none' }}>
          <rect width={32} height={14} rx={7} fill={node.checklist.every(i => i.done) ? '#DCFCE7' : '#F3F4F6'} stroke={node.checklist.every(i => i.done) ? '#86EFAC' : '#D1D5DB'} strokeWidth={0.8} />
          <text x={16} y={7} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill={node.checklist.every(i => i.done) ? '#16A34A' : '#6B7280'} fontWeight="600">
            {node.checklist.filter(i => i.done).length}/{node.checklist.length}
          </text>
        </g>
      )}

      {/* Connection ports */}
      {showPortsOnHover && PORT_DIRS.map(dir => {
        const { x: px, y: py } = portCoords(w, h, dir)
        return (
          <circle
            key={dir}
            cx={w / 2 + px}
            cy={h / 2 + py}
            r={5}
            fill="#3B82F6"
            stroke="white"
            strokeWidth={1.5}
            data-port={dir}
            data-node-id={node.id}
            data-node={node.id}
            style={{ cursor: 'crosshair' }}
            onMouseDown={(e) => {
              e.stopPropagation()
              onPortMouseDown(node.id, dir, e)
            }}
          />
        )
      })}
    </g>
  )
}
