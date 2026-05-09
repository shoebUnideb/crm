import React from 'react'
import ProductErrorBoundary from '../components/shared/ProductErrorBoundary.jsx'
import TreeApp from '../TreeApp.jsx'

export default function CanvasShell() {
  return (
    <ProductErrorBoundary productName="Canvas" accentColor="#6366f1">
      <TreeApp />
    </ProductErrorBoundary>
  )
}
