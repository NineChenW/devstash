import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { auth } from '@/auth'
import { UpgradePane } from '@/components/billing/UpgradePane'
import { isProForGating } from '@/lib/usage-limits'

export default async function UpgradePage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/sign-in?callbackUrl=/upgrade')
  }

  if (isProForGating(session)) {
    redirect('/settings#billing')
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <header className="mb-10 text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Upgrade
        </p>
        <h1 className="mb-3 bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
          Unlock everything DevStash offers
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Files, images, AI features, unlimited items and collections. Cancel anytime.
        </p>
      </header>

      <UpgradePane />
    </main>
  )
}
