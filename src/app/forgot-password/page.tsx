import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { ForgotPasswordForm } from './ForgotPasswordForm'

export default async function ForgotPasswordPage() {
  const session = await auth()
  if (session?.user) {
    redirect('/dashboard')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <ForgotPasswordForm />
    </main>
  )
}
