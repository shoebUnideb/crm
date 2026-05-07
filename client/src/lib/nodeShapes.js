export const SHAPES = ['rect', 'circle', 'diamond', 'sticky']

export const SHAPE_DIMS = {
  rect:    { w: 160, h: 44 },
  circle:  { w: 80,  h: 80 },
  diamond: { w: 150, h: 70 },
  sticky:  { w: 160, h: 90 },
}

export function getShapeDims(shape) {
  return SHAPE_DIMS[shape] ?? SHAPE_DIMS.rect
}

// Given a node center (cx, cy) and dimensions, compute the port point
// on the node boundary facing toward target (targetCX, targetCY).
// Returns { x, y, nx, ny } where nx/ny is the outward normal.
export function getPortPoint(cx, cy, w, h, targetCX, targetCY) {
  const dx = targetCX - cx
  const dy = targetCY - cy

  // Compare how far along each axis relative to node half-dimensions
  if (Math.abs(dx) * h > Math.abs(dy) * w) {
    // Exit left or right
    if (dx >= 0) return { x: cx + w / 2, y: cy, nx: 1, ny: 0 }
    return { x: cx - w / 2, y: cy, nx: -1, ny: 0 }
  } else {
    // Exit top or bottom
    if (dy >= 0) return { x: cx, y: cy + h / 2, nx: 0, ny: 1 }
    return { x: cx, y: cy - h / 2, nx: 0, ny: -1 }
  }
}
