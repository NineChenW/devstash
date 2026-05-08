import { FolderOpen } from 'lucide-react'
import { auth } from '@/auth'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { CollectionCard } from '@/components/collections/CollectionCard'
import {
  getAllCollections,
  getDemoUserId,
  getRecentCollections,
} from '@/lib/db/collections'
import { getSystemItemTypesWithCounts } from '@/lib/db/items'

export default async function CollectionsPage() {
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

  const [collections, sidebarCollections, itemTypes] = await Promise.all([
    getAllCollections(userId),
    getRecentCollections(userId),
    getSystemItemTypesWithCounts(userId),
  ])

  return (
    <DashboardShell itemTypes={itemTypes} sidebarCollections={sidebarCollections} user={sidebarUser}>
      <div className="mb-8 flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: '#10b98120' }}
        >
          <FolderOpen className="h-5 w-5" style={{ color: '#10b981' }} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Collections</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {collections.length} {collections.length === 1 ? 'collection' : 'collections'}
          </p>
        </div>
      </div>

      {collections.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed">
          <p className="text-sm text-muted-foreground">
            No collections yet. Create one from the top bar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <CollectionCard
              key={collection.id}
              id={collection.id}
              name={collection.name}
              description={collection.description}
              itemCount={collection.itemCount}
              typeIcons={collection.typeIcons}
              isFavorite={collection.isFavorite}
              dominantColor={collection.dominantColor}
            />
          ))}
        </div>
      )}
    </DashboardShell>
  )
}
