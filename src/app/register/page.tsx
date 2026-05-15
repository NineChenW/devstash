import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { HomeNav } from '@/components/home/HomeNav'
import { RegisterForm } from './RegisterForm'

interface RegisterPageProps {
  searchParams: Promise<{ plan?: string | string[] }>
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const session = await auth()
  const { plan: planParam } = await searchParams
  const rawPlan = Array.isArray(planParam) ? planParam[0] : planParam
  const plan = rawPlan === 'monthly' || rawPlan === 'yearly' ? rawPlan : null

  if (session?.user) {
    if (plan) {
      redirect(`/settings?plan=${plan}#billing`)
    }
    redirect('/dashboard')
  }

  return (
    <>
      <HomeNav />
      <main className="flex min-h-screen items-center justify-center bg-background px-4 pb-12 pt-24">
        <RegisterForm />
      </main>
    </>
  )
}
