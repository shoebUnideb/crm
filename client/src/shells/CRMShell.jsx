import React from 'react'
import ProductErrorBoundary from '../components/shared/ProductErrorBoundary.jsx'
import CRMPage from '../pages/CRMPage.jsx'

export default function CRMShell() {
  return (
    <ProductErrorBoundary productName="CRM" accentColor="#10b981">
      <CRMPage />
    </ProductErrorBoundary>
  )
}
