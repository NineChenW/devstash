import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { SignInForm } from './SignInForm'

interface SignInPageProps {
  searchParams: Promise<{ callbackUrl?: string }>
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const session = await auth()
  if (session?.user) {
    const { callbackUrl } = await searchParams
    redirect(callbackUrl || '/dashboard')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <SignInForm />
    </main>
  )
}
