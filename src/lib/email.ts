import { Resend } from "resend"

let cached: Resend | null = null

function getResend(): Resend {
  if (cached) return cached
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error("RESEND_API_KEY is not set")
  cached = new Resend(key)
  return cached
}

function getFrom(): string {
  return process.env.EMAIL_FROM || "DevStash <onboarding@resend.dev>"
}

function getAppUrl(): string {
  return (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.AUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "")
}

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${getAppUrl()}/api/auth/verify?token=${encodeURIComponent(token)}`

  const { error } = await getResend().emails.send({
    from: getFrom(),
    to: email,
    subject: "Verify your DevStash email",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #111;">
        <h1 style="font-size: 20px; margin: 0 0 16px;">Verify your email</h1>
        <p style="margin: 0 0 16px; line-height: 1.5;">
          Thanks for signing up for DevStash. Click the button below to verify your email address and activate your account.
        </p>
        <p style="margin: 24px 0;">
          <a href="${verifyUrl}" style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-weight: 500;">Verify email</a>
        </p>
        <p style="margin: 0 0 8px; font-size: 13px; color: #555;">Or paste this link into your browser:</p>
        <p style="margin: 0 0 24px; font-size: 13px; word-break: break-all;"><a href="${verifyUrl}" style="color: #2563eb;">${verifyUrl}</a></p>
        <p style="margin: 0; font-size: 12px; color: #777;">This link expires in 24 hours. If you didn't create a DevStash account, you can safely ignore this email.</p>
      </div>
    `,
    text: `Verify your DevStash email by opening this link: ${verifyUrl}\n\nThis link expires in 24 hours. If you didn't sign up, ignore this email.`,
  })

  if (error) {
    throw new Error(`Resend error: ${error.message ?? "unknown"}`)
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${getAppUrl()}/reset-password?token=${encodeURIComponent(token)}`

  const { error } = await getResend().emails.send({
    from: getFrom(),
    to: email,
    subject: "Reset your DevStash password",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #111;">
        <h1 style="font-size: 20px; margin: 0 0 16px;">Reset your password</h1>
        <p style="margin: 0 0 16px; line-height: 1.5;">
          We received a request to reset the password for your DevStash account. Click the button below to choose a new password.
        </p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-weight: 500;">Reset password</a>
        </p>
        <p style="margin: 0 0 8px; font-size: 13px; color: #555;">Or paste this link into your browser:</p>
        <p style="margin: 0 0 24px; font-size: 13px; word-break: break-all;"><a href="${resetUrl}" style="color: #2563eb;">${resetUrl}</a></p>
        <p style="margin: 0; font-size: 12px; color: #777;">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email — your password won't change.</p>
      </div>
    `,
    text: `Reset your DevStash password by opening this link: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request a reset, ignore this email.`,
  })

  if (error) {
    throw new Error(`Resend error: ${error.message ?? "unknown"}`)
  }
}
