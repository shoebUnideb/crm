import React from 'react'
import TreeNode from './TreeNode.jsx'
import TreeEdge from './TreeEdge.jsx'

function countDescendants(nodes, nodeId) {
  let count = 0
  const queue = [...(nodes[nodeId]?.childIds ?? [])]
  while (queue.length > 0) {
    const id = queue.shift()
    count++
    if (nodes[id]) queue.push(...nodes[id].childIds)
  }
  return count
}

function computeRollup(nodes, nodeId) {
  const queue = [...(nodes[nodeId]?.childIds ?? [])]
  let total = 0, done = 0
  while (queue.length > 0) {
    const id = queue.shift()
    const n = nodes[id]
    if (!n) continue
    total++
    if (n.status === 'done') done++
    queue.push(...n.childIds)
  }
  // Only show rollup if at least one descendant has a status set
  const hasAnyStatus = total > 0 && [...queue, nodeId].some(() => {
    const q2 = [...(nodes[nodeId]?.childIds ?? [])]
    while (q2.length > 0) {
      const id = q2.shift()
      const n = nodes[id]
      if (!n) continue
      if (n.status) return true
      q2.push(...n.childIds)
    }
    return false
  })
  if (total === 0) return null
  return Math.round((done / total) * 100)
}

function hasDescendantWithStatus(nodes, nodeId) {
  const queue = [...(nodes[nodeId]?.childIds ?? [])]
  while (queue.length > 0) {
    const id = queue.shift()
    const n = nodes[id]
    if (!n) continue
    if (n.status) return true
    queue.push(...n.childIds)
  }
  return false
}

function collectVisible(nodes, rootId) {
  const visible = new Set()
  const queue = [rootId]
  while (queue.length > 0) {
    const id = queue.shift()
    if (!nodes[id]) continue
    visible.add(id)
    if (!nodes[id].collapsed) {
      for (const cId of nodes[id].childIds) queue.push(cId)
    }
  }
  return visible
}

export default function GraphRenderer({
  treeState,
  dragPos,
  dropTargetId,
  ghostEdge,
  hoveredNodeId,
  selectedEdgeId,
  multiSelectIds,
  editingNodeId,
  heatmapColors,
  filteredNodeIds,
  compactMode,
  depsOnlyView = false,
  curved = false,
  nodeSizeOverrides = null,
  linkMap = {},
  onSelectNode,
  onDeselect,
  onStopEditing,
  onEditNode,
  onDeleteNode,
  onAddChild,
  onToggleCollapse,
  onNodeMouseDown,
  onPortMouseDown,
  onNodeMouseEnter,
  onNodeMouseLeave,
  onNodeDoubleClick,
  onEdgeClick,
  onNodeContextMenu,
}) {
  const { nodes, rootId, selectedNodeId, extraEdges = [] } = treeState

  const visible = collectVisible(nodes, rootId)

  const treeEdges = []
  for (const id of visible) {
    const node = nodes[id]
    if (!node || !node.parentId || !visible.has(node.parentId)) continue
    treeEdges.push({ parentId: node.parentId, childId: id })
  }

  function getNode(id) {
    const n = nodes[id]
    if (!n) return null
    if (dragPos?.nodeId === id) return { ...n, x: dragPos.x, y: dragPos.y }
    return n
  }

  return (
    <g>
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="7" refY="3.5" orient="auto">
          <polygon points="0 0, 8 3.5, 0 7" fill="#64748B" fillOpacity="0.85" />
        </marker>
        <marker id="arrowhead-selected" markerWidth="8" markerHeight="8" refX="7" refY="3.5" orient="auto">
          <polygon points="0 0, 8 3.5, 0 7" fill="#3B82F6" />
        </marker>
        <marker id="arrowhead-blocker" markerWidth="8" markerHeight="8" refX="7" refY="3.5" orient="auto">
          <polygon points="0 0, 8 3.5, 0 7" fill="#EF4444" />
        </marker>
        <marker id="arrowhead-dependency" markerWidth="8" markerHeight="8" refX="7" refY="3.5" orient="auto">
          <polygon points="0 0, 8 3.5, 0 7" fill="#8B5CF6" />
        </marker>
      </defs>

      {!depsOnlyView && treeEdges.map(({ parentId, childId }) => {
        const from = getNode(parentId)
        const to = getNode(childId)
        if (!from || !to) return null
        return (
          <TreeEdge key={`tree-${parentId}-${childId}`} fromNode={from} toNode={to} type="tree" curved={curved} />
        )
      })}

      {extraEdges.map(edge => {
        const from = getNode(edge.from)
        const to = getNode(edge.to)
        if (!from || !to) return null
        return (
          <TreeEdge
            key={`extra-${edge.id}`}
            fromNode={from} toNode={to} type="extra"
            edgeType={edge.type}
            isSelected={selectedEdgeId === edge.id}
            onClick={() => onEdgeClick?.(edge.id)}
            label={edge.label}
          />
        )
      })}

      {ghostEdge && (() => {
        const from = getNode(ghostEdge.fromNodeId)
        if (!from) return null
        return (
          <TreeEdge
            key="ghost"
            fromNode={from}
            type="ghost"
            toX={ghostEdge.toX}
            toY={ghostEdge.toY}
          />
        )
      })()}

      {Array.from(visible).map(id => {
        const node = getNode(id)
        if (!node) return null
        const rollupPct = node.childIds.length > 0 && hasDescendantWithStatus(nodes, id)
          ? computeRollup(nodes, id)
          : null
        return (
          <TreeNode
            key={id}
            node={node}
            isSelected={selectedNodeId === id}
            isEditing={editingNodeId === id}
            isRoot={id === rootId}
            isHovered={hoveredNodeId === id}
            isDragging={dragPos?.nodeId === id}
            isDropTarget={dropTargetId === id}
            isEdgeTarget={ghostEdge != null && hoveredNodeId === id && ghostEdge.fromNodeId !== id}
            isMultiSelected={multiSelectIds?.has(id) ?? false}
            rollupPct={rollupPct}
            colorOverride={heatmapColors?.get(id)}
            dimmed={filteredNodeIds != null && !filteredNodeIds.has(id)}
            compactMode={compactMode}
            sizeScale={nodeSizeOverrides?.[id] ?? 1}
            crmLinked={!!linkMap[id]?.length}
            onSelect={() => onSelectNode(id)}
            onDelete={() => {
              if (node.childIds.length > 0) {
                const total = countDescendants(nodes, id)
                if (!window.confirm(`Delete "${node.title}" and ${total} child node${total !== 1 ? 's' : ''}?`)) return
              }
              onDeleteNode(id)
            }}
            onAdd={() => onAddChild(id)}
            onEdit={(title, trigger) => { onEditNode(id, title); onStopEditing(trigger) }}
            onStopEditing={onStopEditing}
            onToggleCollapse={() => onToggleCollapse(id)}
            onNodeMouseDown={onNodeMouseDown}
            onPortMouseDown={onPortMouseDown}
            onMouseEnter={onNodeMouseEnter}
            onMouseLeave={onNodeMouseLeave}
            onDoubleClick={() => onNodeDoubleClick?.(id)}
            onContextMenu={(e) => onNodeContextMenu?.(id, e)}
          />
        )
      })}
    </g>
  )
}
