import type { ReactNode } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { HomeNav } from '@/components/home/HomeNav'
import { checkPasswordResetToken } from '@/lib/verification-token'
import { ResetPasswordForm } from './ResetPasswordForm'

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const session = await auth()
  if (session?.user) {
    redirect('/dashboard')
  }

  const { token } = await searchParams

  if (!token) {
    return <PageShell><TokenError reason="missing" /></PageShell>
  }

  const check = await checkPasswordResetToken(token)
  if (!check.ok) {
    const reason = check.reason === 'expired' ? 'expired' : 'invalid'
    return <PageShell><TokenError reason={reason} /></PageShell>
  }

  return (
    <PageShell>
      <ResetPasswordForm token={token} email={check.email} />
    </PageShell>
  )
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <HomeNav />
      <main className="flex min-h-screen items-center justify-center bg-background px-4 pb-12 pt-24">
        {children}
      </main>
    </>
  )
}

function TokenError({ reason }: { reason: 'expired' | 'invalid' | 'missing' }) {
  const title =
    reason === 'expired'
      ? 'This link has expired'
      : reason === 'missing'
        ? 'Missing reset token'
        : 'Invalid reset link'
  const body =
    reason === 'expired'
      ? 'Password reset links expire after 1 hour. Request a new one to continue.'
      : reason === 'missing'
        ? 'The reset link you used is missing its token. Request a new one to continue.'
        : 'The reset link is invalid or has already been used. Request a new one to continue.'

  return (
    <div className="w-full max-w-sm space-y-6 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{body}</p>
      </div>
      <div className="space-y-2 text-sm">
        <Link
          href="/forgot-password"
          className="inline-block font-medium text-foreground underline-offset-4 hover:underline"
        >
          Request a new link
        </Link>
        <div>
          <Link
            href="/sign-in"
            className="text-muted-foreground underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
