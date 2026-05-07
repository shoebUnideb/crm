import React, { useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import ChatbotWidget from './components/chatbot/ChatbotWidget.jsx'
import FeedbackWidget from './components/feedback/FeedbackWidget.jsx'
import TreeApp from './TreeApp.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import ResetPasswordPage from './pages/ResetPasswordPage.jsx'
import InviteAcceptPage from './pages/InviteAcceptPage.jsx'
import LandingPage from './pages/LandingPage.jsx'
import FeaturesPage from './pages/FeaturesPage.jsx'
import AboutPage from './pages/AboutPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import AdminPage from './pages/AdminPage.jsx'
import CRMPage from './pages/CRMPage.jsx'
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
import NotFoundPage from './pages/NotFoundPage.jsx'
import { useAuthModal } from './context/AuthModalContext.jsx'
import { useAuth } from './context/AuthContext.jsx'

// Redirects /login, /register, /forgot-password to / and opens the modal
function OpenAuthModal({ view }) {
  const { setView, setMessage } = useAuthModal()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app', { replace: true })
    } else {
      if (location.state?.message) setMessage(location.state.message)
      setView(view)
      navigate('/', { replace: true })
    }
  }, [])

  return null
}

export default function App() {
  return (
    <>
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

      {/* Protected routes */}
      <Route path="/app" element={<ProtectedRoute><TreeApp /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
      <Route path="/crm" element={<ProtectedRoute><CRMPage /></ProtectedRoute>} />

      <Route path="/roadmap" element={<RoadmapPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    <ChatbotWidget />
    <FeedbackWidget />
    </>
  )
}
