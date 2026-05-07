import React from 'react'
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

export default function TermsPage() {
  return (
    <div style={{ background: '#FAFBFC', color: navy, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '72px 32px 96px' }}>
        <p style={{ fontSize: '0.8125rem', color: textSubtle, marginBottom: 8 }}>Last updated: 1 May 2026</p>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: navy, marginBottom: 8 }}>Terms of Service</h1>
        <p style={{ fontSize: '0.9375rem', color: textSubtle, lineHeight: 1.7, marginBottom: 40 }}>
          By using bahnOS you agree to these terms. Please read them — they're shorter than most.
        </p>

        <LegalSection title="1. Acceptance">
          <P>By creating an account or using the bahnOS service ("Service") you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</P>
        </LegalSection>

        <LegalSection title="2. The Service">
          <P>bahnOS provides a browser-based mind-mapping and project planning tool with optional Jira integration and real-time collaboration. We may modify, suspend, or discontinue parts of the Service with reasonable notice.</P>
        </LegalSection>

        <LegalSection title="3. Your account">
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <Li>You must be at least 16 years old to use the Service.</Li>
            <Li>You are responsible for keeping your credentials secure. Notify us immediately at security@bahn.app if you suspect unauthorised access.</Li>
            <Li>One person may not maintain multiple free accounts to circumvent plan limits.</Li>
          </ul>
        </LegalSection>

        <LegalSection title="4. Your content">
          <P>You own everything you create inside bahnOS — nodes, maps, notes, and project data. You grant us a limited licence to store and process your content solely to provide the Service.</P>
          <P>You must not upload content that is unlawful, infringes third-party intellectual property, or is designed to harm other users or systems.</P>
        </LegalSection>

        <LegalSection title="5. Acceptable use">
          <P>You may not use bahnOS to:</P>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <Li>Reverse-engineer, decompile, or extract source code from the Service</Li>
            <Li>Scrape or bulk-export other users' data without permission</Li>
            <Li>Use the Service to send unsolicited communications</Li>
            <Li>Attempt to gain unauthorised access to any bahnOS systems or other users' accounts</Li>
            <Li>Resell or sublicence access to the Service without prior written consent</Li>
          </ul>
        </LegalSection>

        <LegalSection title="6. Intellectual property">
          <P>The bahnOS name, logo, and the software underlying the Service are owned by bahnOS and protected by copyright and trademark law. These terms do not transfer any ownership rights to you.</P>
        </LegalSection>

        <LegalSection title="7. Third-party integrations">
          <P>The Jira integration connects to Atlassian services using credentials you supply. We are not affiliated with Atlassian. Your use of Jira is governed by Atlassian's own terms and privacy policy.</P>
        </LegalSection>

        <LegalSection title="8. Disclaimers">
          <P>The Service is provided "as is" without warranties of any kind, express or implied. We do not guarantee uninterrupted availability or that the Service will be error-free.</P>
        </LegalSection>

        <LegalSection title="9. Limitation of liability">
          <P>To the maximum extent permitted by law, bahnOS shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service. Our total liability to you shall not exceed the amount paid by you in the 12 months preceding the claim.</P>
        </LegalSection>

        <LegalSection title="10. Termination">
          <P>You may delete your account at any time from Settings. We may suspend or terminate accounts that violate these terms, with or without notice depending on the severity of the violation.</P>
        </LegalSection>

        <LegalSection title="11. Governing law">
          <P>These terms are governed by the laws of the jurisdiction in which bahnOS is incorporated. Disputes shall be resolved by binding arbitration unless both parties agree otherwise.</P>
        </LegalSection>

        <LegalSection title="12. Changes">
          <P>We may update these terms. Material changes will be communicated via email or in-app notice at least 14 days before they take effect. Continued use of the Service after that date constitutes acceptance.</P>
        </LegalSection>

        <LegalSection title="13. Contact">
          <P>Legal questions: <a href="mailto:legal@bahn.app" style={{ color: '#0052CC' }}>legal@bahn.app</a></P>
        </LegalSection>
      </div>
      <Footer />
    </div>
  )
}
