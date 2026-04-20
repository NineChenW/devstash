import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { UserAvatar } from '@/components/user/UserAvatar'

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/sign-in?callbackUrl=/profile')
  }

  const user = session.user

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <div className="mb-6 flex items-center gap-4">
        <UserAvatar name={user.name} image={user.image} className="h-16 w-16" />
        <div>
          <h1 className="text-xl font-semibold">{user.name ?? 'Unnamed user'}</h1>
          {user.email && (
            <p className="text-sm text-muted-foreground">{user.email}</p>
          )}
        </div>
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        Profile settings will live here. This page is a placeholder.
      </p>

      <Link
        href="/dashboard"
        className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
      >
        ← Back to dashboard
      </Link>
    </main>
  )
}
