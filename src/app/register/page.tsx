import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { HomeNav } from '@/components/home/HomeNav'
import { RegisterForm } from './RegisterForm'

export default async function RegisterPage() {
  const session = await auth()
  if (session?.user) {
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
