import { useMemo } from 'react'

export const NODE_WIDTH = 200
export const NODE_HEIGHT = 50
export const H_GAP = 50
export const V_GAP = 90

// Actual rendered heights by shape — keep in sync with nodeShapes.js
const SHAPE_H = { rect: 44, circle: 80, diamond: 70, sticky: 90 }
const SHAPE_W = { rect: 160, circle: 80, diamond: 150, sticky: 160 }
function shapeH(node) { return SHAPE_H[node?.shape] ?? SHAPE_H.rect }
function shapeW(node) { return SHAPE_W[node?.shape] ?? SHAPE_W.rect }

export function computeLayout(nodes, rootId) {
  if (!nodes[rootId]) return {}

  // Measure the total horizontal span each subtree needs
  const widths = {}
  function measureSubtree(nodeId) {
    const node = nodes[nodeId]
    if (!node || node.childIds.length === 0 || node.collapsed) {
      widths[nodeId] = shapeW(node) + H_GAP
      return widths[nodeId]
    }
    let total = 0
    for (const childId of node.childIds) {
      total += measureSubtree(childId)
    }
    widths[nodeId] = Math.max(shapeW(node) + H_GAP, total)
    return widths[nodeId]
  }
  measureSubtree(rootId)

  const positions = {}

  // y is the top edge of the node
  function placeNode(nodeId, centerX, y) {
    positions[nodeId] = { x: centerX, y }
    const node = nodes[nodeId]
    if (!node || node.childIds.length === 0 || node.collapsed) return

    // Next row starts below the tallest node in the current row
    const childY = y + shapeH(node) + V_GAP
    const totalWidth = node.childIds.reduce((sum, id) => sum + (widths[id] || shapeW(nodes[id]) + H_GAP), 0)
    let cursorX = centerX - totalWidth / 2

    for (const childId of node.childIds) {
      const childWidth = widths[childId] || shapeW(nodes[childId]) + H_GAP
      placeNode(childId, cursorX + childWidth / 2, childY)
      cursorX += childWidth
    }
  }

  placeNode(rootId, 0, 0)
  return positions
}

// Count leaves in subtree for angle allocation
function countLeaves(nodes, nodeId) {
  const node = nodes[nodeId]
  if (!node) return 1
  if (node.childIds.length === 0 || node.collapsed) return 1
  return node.childIds.reduce((sum, id) => sum + countLeaves(nodes, id), 0)
}

export function computeRadialLayout(nodes, rootId) {
  if (!nodes[rootId]) return {}
  const LEVEL_RADIUS = 200
  const positions = {}
  positions[rootId] = { x: 0, y: 0 }

  function place(nodeId, startAngle, endAngle, depth) {
    const node = nodes[nodeId]
    if (!node || node.childIds.length === 0 || node.collapsed) return
    const totalLeaves = countLeaves(nodes, nodeId)
    let cursor = startAngle
    for (const childId of node.childIds) {
      const leaves = countLeaves(nodes, childId)
      const childAngle = cursor + (leaves / totalLeaves) * (endAngle - startAngle)
      const midAngle = (cursor + childAngle) / 2
      const r = depth * LEVEL_RADIUS
      positions[childId] = {
        x: Math.cos(midAngle) * r,
        y: Math.sin(midAngle) * r,
      }
      place(childId, cursor, childAngle, depth + 1)
      cursor = childAngle
    }
  }

  place(rootId, -Math.PI / 2, Math.PI * 1.5, 1)
  return positions
}

export function useLayout(nodes, rootId) {
  return useMemo(() => computeLayout(nodes, rootId), [nodes, rootId])
}
