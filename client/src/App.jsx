import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import ChatbotWidget from './components/chatbot/ChatbotWidget.jsx'
import FeedbackWidget from './components/feedback/FeedbackWidget.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import ResetPasswordPage from './pages/ResetPasswordPage.jsx'
import InviteAcceptPage from './pages/InviteAcceptPage.jsx'
import LandingPage from './pages/LandingPage.jsx'
import FeaturesPage from './pages/FeaturesPage.jsx'
import AboutPage from './pages/AboutPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import AdminPage from './pages/AdminPage.jsx'
import CanvasInfoPage from './pages/CanvasInfoPage.jsx'
import CRMInfoPage from './pages/CRMInfoPage.jsx'
import TemplatesPage from './pages/TemplatesPage.jsx'
import ChangelogPage from './pages/ChangelogPage.jsx'
import DocsPage from './pages/DocsPage.jsx'
import CommunityPage from './pages/CommunityPage.jsx'
import BlogPage from './pages/BlogPage.jsx'
import CareersPage from './pages/CareersPage.jsx'
import PrivacyPage from './pages/PrivacyPage.jsx'
import TermsPage from './pages/TermsPage.jsx'
import CookiesPage from './pages/CookiesPage.jsx'
import RoadmapPage from './pages/RoadmapPage.jsx'
import CapsulePage from './pages/CapsulePage.jsx'
import CRMProductPage from './pages/CRMProductPage.jsx'
import WikiPage from './pages/WikiPage.jsx'
import PlatformPage from './pages/PlatformPage.jsx'
import PricingPage from './pages/PricingPage.jsx'
import SolutionsPage from './pages/SolutionsPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import { useAuthModal } from './context/AuthModalContext.jsx'
import { useAuth } from './context/AuthContext.jsx'

// Lazy-loaded product shells — each compiles to a separate JS chunk.
// A crash in one shell never affects the other.
const CanvasShell = React.lazy(() => import('./shells/CanvasShell.jsx'))
const CRMShell    = React.lazy(() => import('./shells/CRMShell.jsx'))
const DocsShell   = React.lazy(() => import('./shells/DocsShell.jsx'))
const DocsTemplatesPage = React.lazy(() => import('./pages/DocsTemplatesPage.jsx'))

// Redirects /login, /register, /forgot-password to / and opens the modal
function OpenAuthModal({ view }) {
  const { setView, setMessage } = useAuthModal()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app/canvas', { replace: true })
    } else {
      if (location.state?.message) setMessage(location.state.message)
      setView(view)
      navigate('/', { replace: true })
    }
  }, [])

  return null
}

function AppLoadingScreen() {
  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F4F5F7', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <div style={{ textAlign: 'center' }}>
        <svg width="32" height="32" viewBox="0 0 30 30" fill="none">
          <circle cx="10" cy="15" r="9" fill="#0052CC" opacity="0.9"/>
          <circle cx="20" cy="15" r="9" fill="#4C9AFF" opacity="0.85"/>
        </svg>
      </div>
    </div>
  )
}

function NavigateCRM() {
  const location = useLocation()
  const subpath = location.pathname.replace(/^\/crm\/?/, '')
  return <Navigate to={`/app/crm/${subpath}`} replace />
}

export default function App() {
  return (
    <>
      <React.Suspense fallback={<AppLoadingScreen />}>
        <Routes>
          {/* Public landing routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/changelog" element={<ChangelogPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/cookies" element={<CookiesPage />} />

          {/* Auth routes — open modal overlay instead of full pages */}
          <Route path="/login" element={<OpenAuthModal view="login" />} />
          <Route path="/register" element={<OpenAuthModal view="register" />} />
          <Route path="/forgot-password" element={<OpenAuthModal view="forgot" />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/invite/:token" element={<InviteAcceptPage />} />

          {/* Protected product shells (lazy-loaded, fault-isolated) */}
          <Route path="/app/canvas" element={<ProtectedRoute><CanvasShell /></ProtectedRoute>} />
          <Route path="/app/crm/*"  element={<ProtectedRoute><CRMShell /></ProtectedRoute>} />
          <Route path="/app/docs/templates" element={<ProtectedRoute><DocsTemplatesPage /></ProtectedRoute>} />
          <Route path="/app/docs/*" element={<ProtectedRoute><DocsShell /></ProtectedRoute>} />
          <Route path="/app/canvas-info" element={<ProtectedRoute><CanvasInfoPage /></ProtectedRoute>} />
          <Route path="/app/crm-info"    element={<ProtectedRoute><CRMInfoPage /></ProtectedRoute>} />
          <Route path="/app/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/app/admin"    element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />

          {/* Legacy redirects */}
          <Route path="/canvas" element={<Navigate to="/app/canvas" replace />} />
          <Route path="/crm/*"  element={<NavigateCRM />} />
          <Route path="/crm"    element={<Navigate to="/app/crm" replace />} />
          <Route path="/settings" element={<Navigate to="/app/settings" replace />} />
          <Route path="/admin"    element={<Navigate to="/app/admin" replace />} />

          <Route path="/roadmap" element={<RoadmapPage />} />
          <Route path="/capsule" element={<CapsulePage />} />
          <Route path="/crm-product" element={<CRMProductPage />} />
          <Route path="/wiki" element={<WikiPage />} />
          <Route path="/platform" element={<PlatformPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/solutions/:slug" element={<SolutionsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </React.Suspense>
      {/* These stay outside Suspense so they don't disappear during chunk loading */}
      <ChatbotWidget />
      <FeedbackWidget />
    </>
  )
}
