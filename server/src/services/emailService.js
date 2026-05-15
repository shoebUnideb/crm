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

function getFrom() { return process.env.SMTP_FROM || 'noreply@bahnos.com' }

export async function sendVerificationEmail(email, otp) {
  const transporter = createTransport()

  if (!transporter) {
    console.log('\n--- EMAIL VERIFICATION OTP (dev: no SMTP configured) ---')
    console.log(`To: ${email}`)
    console.log(`OTP: ${otp}`)
    console.log('--------------------------------------------------------\n')
    return
  }

  try {
    await transporter.sendMail({
      from: `"bahnOS" <${getFrom()}>`,
      to: email,
      subject: `${otp} is your bahnOS verification code`,
      html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#F4F5F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(9,30,66,0.12);overflow:hidden">
        <tr><td style="background:#172B4D;padding:24px 32px;text-align:center">
          <span style="font-size:20px;font-weight:700;color:#fff;letter-spacing:-0.02em">bahnOS</span>
        </td></tr>
        <tr><td style="padding:36px 32px 28px">
          <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#172B4D">Verify your email address</h2>
          <p style="margin:0 0 28px;font-size:14px;color:#5E6C84;line-height:1.6">
            Enter the code below to complete your bahnOS sign up. It expires in 15 minutes.
          </p>
          <div style="background:#F0F4FF;border:2px solid #B3D4FF;border-radius:8px;padding:24px;text-align:center;margin-bottom:28px">
            <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#0052CC;font-variant-numeric:tabular-nums">${otp}</span>
          </div>
          <p style="margin:0;font-size:13px;color:#97A0AF;line-height:1.6">
            If you didn't create a bahnOS account, you can safely ignore this email.
          </p>
        </td></tr>
        <tr><td style="background:#FAFBFC;border-top:1px solid #DFE1E6;padding:16px 32px;text-align:center">
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
      text: `Your bahnOS verification code is: ${otp}\n\nThis code expires in 15 minutes.\n\nIf you didn't create a bahnOS account, ignore this email.`,
    })
  } catch (err) {
    console.log('\n--- EMAIL VERIFICATION OTP (SMTP failed — use this code to test) ---')
    console.log(`To: ${email}`)
    console.log(`OTP: ${otp}`)
    console.log(`Error: ${err.message}`)
    console.log('--------------------------------------------------------------------\n')
    throw err
  }
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
    from: `"bahnOS" <${FROM}>`,
    to: email,
    subject: 'Reset your bahnOS password',
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
    from: `"bahnOS" <${FROM}>`,
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
