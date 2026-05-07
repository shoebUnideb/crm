import React from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/landing/Navbar.jsx'
import Footer from '../components/landing/Footer.jsx'

const navy = '#172B4D'
const textSubtle = '#5E6C84'
const border = '#DFE1E6'

function LegalSection({ title, children }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: navy, marginBottom: 12, borderBottom: `1px solid ${border}`, paddingBottom: 8 }}>{title}</h2>
      {children}
    </section>
  )
}
function P({ children }) {
  return <p style={{ fontSize: '0.9rem', color: '#344563', lineHeight: 1.8, marginBottom: 10 }}>{children}</p>
}
function Li({ children }) {
  return <li style={{ fontSize: '0.9rem', color: '#344563', lineHeight: 1.8, marginBottom: 6 }}>{children}</li>
}

export default function PrivacyPage() {
  return (
    <div style={{ background: '#FAFBFC', color: navy, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '72px 32px 96px' }}>
        <p style={{ fontSize: '0.8125rem', color: textSubtle, marginBottom: 8 }}>Last updated: 1 May 2026</p>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: navy, marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ fontSize: '0.9375rem', color: textSubtle, lineHeight: 1.7, marginBottom: 40 }}>
          This policy explains what data bahnOS collects, how we use it, and your rights around it. We aim to keep this plain and readable — not a wall of legal text you'll never get through.
        </p>

        <LegalSection title="1. Who we are">
          <P>bahnOS ("we", "us", "our") is a visual mind-mapping and project planning tool. Our service is available at bahn.app. For privacy questions, contact us at privacy@bahn.app.</P>
        </LegalSection>

        <LegalSection title="2. What data we collect">
          <P><strong>Account data</strong> — when you register, we collect your email address and a hashed password. Optionally, you may add a display name and avatar.</P>
          <P><strong>Project data</strong> — the mind maps, nodes, metadata, and settings you create are stored on our servers to enable sync, backup, and collaboration.</P>
          <P><strong>Usage data</strong> — we collect anonymised events (page views, feature usage) to understand how the product is being used and where to improve it. This data is never sold.</P>
          <P><strong>Collaboration data</strong> — when you use real-time collaboration, cursor positions and node edits are broadcast over WebSocket to room participants. This data is transient and not persisted beyond the session.</P>
          <P><strong>Jira credentials</strong> — Jira access tokens are stored locally in your browser. They are never transmitted to our servers.</P>
        </LegalSection>

        <LegalSection title="3. How we use your data">
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <Li>To provide, maintain, and improve the bahnOS service</Li>
            <Li>To authenticate your account and protect against unauthorised access</Li>
            <Li>To sync your projects across devices and enable collaboration</Li>
            <Li>To send transactional emails (password reset, account confirmation) — never marketing without opt-in</Li>
            <Li>To understand aggregate usage patterns and prioritise features</Li>
          </ul>
        </LegalSection>

        <LegalSection title="4. Data sharing">
          <P>We do not sell your personal data. We may share it with:</P>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <Li><strong>Cloud infrastructure providers</strong> — for hosting and database services (e.g. AWS, Vercel). These providers are contractually bound to data protection standards.</Li>
            <Li><strong>Analytics tools</strong> — anonymised, aggregated usage data only.</Li>
            <Li><strong>Law enforcement</strong> — only when required by applicable law and after legal review.</Li>
          </ul>
        </LegalSection>

        <LegalSection title="5. Cookies">
          <P>We use cookies for authentication sessions and anonymised analytics. See our <Link to="/cookies" style={{ color: '#0052CC' }}>Cookie Policy</Link> for a full breakdown of what we set and why.</P>
        </LegalSection>

        <LegalSection title="6. Data retention">
          <P>Account and project data is retained for as long as your account is active. If you delete your account, we permanently delete your data within 30 days, except where retention is required by law.</P>
        </LegalSection>

        <LegalSection title="7. Your rights">
          <P>Depending on your location, you may have rights under GDPR, CCPA, or similar laws, including:</P>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <Li><strong>Access</strong> — request a copy of the data we hold about you</Li>
            <Li><strong>Correction</strong> — ask us to correct inaccurate data</Li>
            <Li><strong>Deletion</strong> — request deletion of your account and data</Li>
            <Li><strong>Portability</strong> — export your projects as JSON from the app at any time</Li>
            <Li><strong>Objection</strong> — opt out of analytics tracking</Li>
          </ul>
          <P style={{ marginTop: 12 }}>To exercise any of these rights, email privacy@bahn.app.</P>
        </LegalSection>

        <LegalSection title="8. Security">
          <P>Passwords are hashed using bcrypt. Data in transit is encrypted with TLS. We perform regular dependency audits and follow responsible disclosure for security reports.</P>
        </LegalSection>

        <LegalSection title="9. Changes to this policy">
          <P>We may update this policy as the product evolves. Material changes will be communicated via email or an in-app notice at least 14 days before they take effect.</P>
        </LegalSection>

        <LegalSection title="10. Contact">
          <P>Questions or concerns? Email us at <a href="mailto:privacy@bahn.app" style={{ color: '#0052CC' }}>privacy@bahn.app</a>.</P>
        </LegalSection>
      </div>
      <Footer />
    </div>
  )
}
