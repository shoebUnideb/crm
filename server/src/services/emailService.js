import nodemailer from 'nodemailer'

function createTransport() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  }
  return null
}

export async function sendPasswordResetEmail(email, resetToken) {
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`
  const transporter = createTransport()

  if (!transporter) {
    console.log('\n--- PASSWORD RESET (dev mode: no SMTP configured) ---')
    console.log(`To: ${email}`)
    console.log(`Reset link: ${resetUrl}`)
    console.log('-----------------------------------------------------\n')
    return
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@chart-to-jira.com',
    to: email,
    subject: 'Reset your chart-to-jira password',
    html: `
      <p>You requested a password reset.</p>
      <p><a href="${resetUrl}">Click here to reset your password</a></p>
      <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    `,
    text: `Reset your password: ${resetUrl}\n\nExpires in 1 hour.`,
  })
}

export async function sendInviteEmail(email, inviterEmail, projectName, role, token) {
  const inviteUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/invite/${token}`
  const roleLabel = role === 'admin' ? 'Admin' : role === 'edit' ? 'Editor' : 'Viewer'
  const transporter = createTransport()

  if (!transporter) {
    console.log('\n--- PROJECT INVITE (dev mode: no SMTP configured) ---')
    console.log(`To: ${email}`)
    console.log(`Invited by: ${inviterEmail}`)
    console.log(`Project: ${projectName}  Role: ${roleLabel}`)
    console.log(`Accept link: ${inviteUrl}`)
    console.log('------------------------------------------------------\n')
    return
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@chart-to-jira.com',
    to: email,
    subject: `${inviterEmail} invited you to collaborate on "${projectName}"`,
    html: `
      <p>Hi,</p>
      <p><strong>${inviterEmail}</strong> has invited you to join <strong>${projectName}</strong> on bahnOS as a <strong>${roleLabel}</strong>.</p>
      <p style="margin:24px 0">
        <a href="${inviteUrl}" style="background:#0052CC;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none;font-weight:600">
          Accept invitation
        </a>
      </p>
      <p style="color:#5E6C84;font-size:13px">This link expires in 7 days. If you don't have an account yet, you'll be able to create one when you accept.</p>
    `,
    text: `${inviterEmail} invited you to join "${projectName}" as ${roleLabel}.\n\nAccept: ${inviteUrl}\n\nExpires in 7 days.`,
  })
}
