import React from 'react'
import ProductErrorBoundary from '../components/shared/ProductErrorBoundary.jsx'
import DocsWorkspace from '../pages/DocsWorkspace.jsx'

export default function DocsShell() {
  return (
    <ProductErrorBoundary productName="Docs" accentColor="#f59e0b">
      <DocsWorkspace />
    </ProductErrorBoundary>
  )
}
