'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GithubIcon } from '@/components/icons/GithubIcon'
import { signInWithGitHub } from '@/actions/auth'

interface SignInFormProps {
  emailVerificationEnabled: boolean
}

function safeCallbackUrl(raw: string | null): string {
  if (!raw) return '/dashboard'
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/dashboard'
  return raw
}

export function SignInForm({ emailVerificationEnabled }: SignInFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = safeCallbackUrl(searchParams.get('callbackUrl'))
  const justRegistered = searchParams.get('registered') === '1'
  const justVerified = searchParams.get('verified') === '1'
  const justReset = searchParams.get('reset') === '1'
  const verifyError = searchParams.get('verify')

  useEffect(() => {
    if (!justRegistered && !justVerified && !justReset && !verifyError) return

    if (justRegistered) {
      toast.success(
        emailVerificationEnabled
          ? 'Account created — check your email to verify before signing in.'
          : 'Account created — you can now sign in.',
        { id: 'registered-success' },
      )
    } else if (justVerified) {
      toast.success('Email verified — you can now sign in.', { id: 'verified-success' })
    } else if (justReset) {
      toast.success('Password updated — you can now sign in.', { id: 'reset-success' })
    } else if (verifyError === 'expired') {
      toast.error('That verification link has expired. Request a new one below.', {
        id: 'verify-expired',
      })
    } else if (verifyError === 'invalid' || verifyError === 'missing') {
      toast.error('That verification link is invalid or has already been used.', {
        id: 'verify-invalid',
      })
    }

    const params = new URLSearchParams(searchParams.toString())
    params.delete('registered')
    params.delete('verified')
    params.delete('reset')
    params.delete('verify')
    const query = params.toString()
    router.replace(query ? `/sign-in?${query}` : '/sign-in')
  }, [justRegistered, justVerified, justReset, verifyError, emailVerificationEnabled, router, searchParams])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNeedsVerification(false)

    if (!email || !password) {
      setError('Email and password are required')
      return
    }

    setSubmitting(true)
    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
      if (res?.error) {
        if (res.code === 'EmailNotVerified') {
          setNeedsVerification(true)
          setError('Please verify your email before signing in.')
        } else if (res.code === 'RateLimited') {
          const message = 'Too many sign-in attempts. Please try again in a few minutes.'
          toast.error(message, { id: 'signin-rate-limit' })
          setError(message)
        } else {
          setError('Invalid email or password')
        }
        return
      }
      router.push(callbackUrl)
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function onResend() {
    if (!email) {
      setError('Enter your email address first.')
      return
    }
    setResending(true)
    try {
      const res = await fetch('/api/auth/verify/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.status === 429) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        toast.error(data?.error || 'Too many attempts. Please try again later.', {
          id: 'resend-rate-limit',
        })
        return
      }
      toast.success('Verification email sent — check your inbox.', { id: 'resend-success' })
    } catch {
      toast.error('Could not send verification email. Try again in a moment.', {
        id: 'resend-error',
      })
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to your DevStash account</p>
      </div>

      <form action={signInWithGitHub}>
        <Button type="submit" variant="outline" className="w-full">
          <GithubIcon className="mr-2 h-4 w-4" />
          Sign in with GitHub
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-3" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        {needsVerification && (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onResend}
            disabled={resending}
          >
            {resending ? 'Sending…' : 'Resend verification email'}
          </Button>
        )}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
          Register
        </Link>
      </p>
    </div>
  )
}
