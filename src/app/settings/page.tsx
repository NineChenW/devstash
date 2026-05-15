import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { auth } from '@/auth'
import { BillingSection } from '@/components/settings/BillingSection'
import { BillingToast } from '@/components/settings/BillingToast'
import { ChangePasswordDialog } from '@/components/settings/ChangePasswordDialog'
import { DeleteAccountDialog } from '@/components/settings/DeleteAccountDialog'
import { EditorPreferencesForm } from '@/components/settings/EditorPreferencesForm'
import { getBillingUser } from '@/lib/db/billing'
import { getDemoUserId } from '@/lib/db/collections'
import { getEditorPreferences, getProfileUser } from '@/lib/db/profile'
import { prisma } from '@/lib/prisma'
import { FREE_COLLECTION_LIMIT, FREE_ITEM_LIMIT } from '@/lib/usage-limits'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/sign-in?callbackUrl=/settings')
  }

  const [user, billing, itemsUsed, collectionsUsed] = await Promise.all([
    getProfileUser(session.user.id),
    getBillingUser(session.user.id),
    prisma.item.count({ where: { userId: session.user.id } }),
    prisma.collection.count({ where: { userId: session.user.id } }),
  ])
  if (!user) {
    redirect('/sign-in?callbackUrl=/settings')
  }

  const editorOwnerId = (await getDemoUserId()) ?? session.user.id
  const editorPreferences = await getEditorPreferences(editorOwnerId)

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <BillingToast />

      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <h1 className="mb-8 text-2xl font-semibold">Settings</h1>

      <section id="billing" className="mb-8 scroll-mt-24">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Billing
        </h2>
        <div className="rounded-xl border bg-card p-5">
          <BillingSection
            isPro={billing?.isPro ?? false}
            itemsUsed={itemsUsed}
            collectionsUsed={collectionsUsed}
            itemLimit={FREE_ITEM_LIMIT}
            collectionLimit={FREE_COLLECTION_LIMIT}
          />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Editor Preferences
        </h2>
        <div className="rounded-xl border bg-card p-5">
          <EditorPreferencesForm initial={editorPreferences} />
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
