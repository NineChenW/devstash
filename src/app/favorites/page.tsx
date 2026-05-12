import { Star } from 'lucide-react'
import { auth } from '@/auth'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { FavoritesContent } from '@/components/favorites/FavoritesContent'
import { getRecentCollections, getDemoUserId } from '@/lib/db/collections'
import { getSystemItemTypesWithCounts } from '@/lib/db/items'
import { getEditorPreferences } from '@/lib/db/profile'
import { getFavorites } from '@/lib/db/favorites'

export default async function FavoritesPage() {
  const session = await auth()
  const sidebarUser = session?.user
    ? { name: session.user.name, email: session.user.email, image: session.user.image }
    : null

  const userId = await getDemoUserId()

  if (!userId) {
    return (
      <DashboardShell itemTypes={[]} sidebarCollections={[]} user={sidebarUser}>
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">No demo user found. Run the seed script first.</p>
        </div>
      </DashboardShell>
    )
  }

  const [favorites, sidebarCollections, itemTypes, editorPreferences] = await Promise.all([
    getFavorites(userId),
    getRecentCollections(userId),
    getSystemItemTypesWithCounts(userId),
    getEditorPreferences(userId),
  ])

  const { items, collections } = favorites
  const total = items.length + collections.length

  return (
    <DashboardShell
      itemTypes={itemTypes}
      sidebarCollections={sidebarCollections}
      user={sidebarUser}
      editorPreferences={editorPreferences}
    >
      <div className="mb-8 flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: '#f59e0b20' }}
        >
          <Star className="h-5 w-5" style={{ color: '#f59e0b' }} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Favorites</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {total} {total === 1 ? 'favorite' : 'favorites'}
          </p>
        </div>
      </div>

      <FavoritesContent items={items} collections={collections} />
    </DashboardShell>
  )
}
