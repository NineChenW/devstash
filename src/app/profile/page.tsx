import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Layers, FolderOpen, ArrowLeft } from 'lucide-react'
import { auth } from '@/auth'
import { UserAvatar } from '@/components/user/UserAvatar'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { ChangePasswordDialog } from '@/components/profile/ChangePasswordDialog'
import { DeleteAccountDialog } from '@/components/profile/DeleteAccountDialog'
import { iconMap, DefaultIcon } from '@/lib/icon-map'
import { getProfileStats, getProfileUser } from '@/lib/db/profile'

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/sign-in?callbackUrl=/profile')
  }

  const [user, stats] = await Promise.all([
    getProfileUser(session.user.id),
    getProfileStats(session.user.id),
  ])

  if (!user) {
    redirect('/sign-in?callbackUrl=/profile')
  }

  const memberSince = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(user.createdAt)

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <section className="mb-8 flex items-center gap-5">
        <UserAvatar name={user.name} image={user.image} className="h-20 w-20 text-lg" />
        <div>
          <h1 className="text-2xl font-semibold">{user.name ?? 'Unnamed user'}</h1>
          {user.email && (
            <p className="text-sm text-muted-foreground">{user.email}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">Member since {memberSince}</p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Usage
        </h2>
        <div className="mb-4 grid grid-cols-2 gap-4">
          <StatsCard
            label="Total Items"
            value={stats.totalItems}
            icon={Layers}
            iconColor="#3b82f6"
          />
          <StatsCard
            label="Collections"
            value={stats.totalCollections}
            icon={FolderOpen}
            iconColor="#10b981"
          />
        </div>

        <div className="rounded-xl border bg-card p-5">
          <p className="mb-4 text-sm font-medium">Items by type</p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {stats.typeCounts.map((type) => {
              const Icon = iconMap[type.icon] ?? DefaultIcon
              return (
                <li
                  key={type.name}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-md"
                    style={{ backgroundColor: `${type.color}1a` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: type.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm capitalize">{type.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {type.count.toLocaleString()} {type.count === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Account
        </h2>
        <div className="space-y-3 rounded-xl border bg-card p-5">
          {user.hasPassword && (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Password</p>
                <p className="text-xs text-muted-foreground">
                  Update the password you use to sign in with email.
                </p>
              </div>
              <ChangePasswordDialog />
            </div>
          )}

          <div
            className={
              user.hasPassword
                ? 'flex items-center justify-between gap-4 border-t pt-3'
                : 'flex items-center justify-between gap-4'
            }
          >
            <div>
              <p className="text-sm font-medium text-destructive">Delete account</p>
              <p className="text-xs text-muted-foreground">
                Permanently remove your account and all of your data.
              </p>
            </div>
            <DeleteAccountDialog />
          </div>
        </div>
      </section>
    </main>
  )
}
