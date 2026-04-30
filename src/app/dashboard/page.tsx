import { Layers, FolderOpen, Star, Bookmark, Pin } from 'lucide-react'
import { auth } from '@/auth'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { CollectionCard } from '@/components/collections/CollectionCard'
import { PinnedItem } from '@/components/items/PinnedItem'
import { RecentItem } from '@/components/items/RecentItem'
import { ItemTrigger } from '@/components/items/ItemTrigger'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { getRecentCollections, getCollectionStats, getDemoUserId } from '@/lib/db/collections'
import { getPinnedItems, getRecentItems, getSystemItemTypesWithCounts } from '@/lib/db/items'

export default async function Dashboard() {
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

  const [collections, stats, pinnedItems, recentItems, itemTypes] = await Promise.all([
    getRecentCollections(userId),
    getCollectionStats(userId),
    getPinnedItems(userId),
    getRecentItems(userId, 10),
    getSystemItemTypesWithCounts(userId),
  ])

  return (
    <DashboardShell itemTypes={itemTypes} sidebarCollections={collections} user={sidebarUser}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Your developer knowledge hub</p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard label="Total Items" value={stats.totalItems} icon={Layers} iconColor="#3b82f6" />
        <StatsCard label="Collections" value={stats.totalCollections} icon={FolderOpen} iconColor="#10b981" />
        <StatsCard label="Favorite Items" value={stats.favoriteItems} icon={Star} iconColor="#f59e0b" />
        <StatsCard label="Fav Collections" value={stats.favoriteCollections} icon={Bookmark} iconColor="#8b5cf6" />
      </div>

      {/* Recent Collections */}
      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Collections</h2>
          <button className="text-sm text-muted-foreground hover:text-foreground">View all</button>
        </div>
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
      </section>

      {/* Pinned Section */}
      {pinnedItems.length > 0 && (
        <section className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <Pin className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Pinned</h2>
          </div>
          <div className="space-y-3">
            {pinnedItems.map((item) => (
              <ItemTrigger key={item.id} itemId={item.id}>
                <PinnedItem
                  id={item.id}
                  title={item.title}
                  description={item.description}
                  typeIcon={item.typeIcon}
                  typeColor={item.typeColor}
                  typeName={item.typeName}
                  isFavorite={item.isFavorite}
                  tags={item.tags}
                  createdAt={item.createdAt}
                />
              </ItemTrigger>
            ))}
          </div>
        </section>
      )}

      {/* Recent Items */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Items</h2>
          <button className="text-sm text-muted-foreground hover:text-foreground">View all</button>
        </div>
        <div className="space-y-2">
          {recentItems.map((item) => (
            <ItemTrigger key={item.id} itemId={item.id}>
              <RecentItem
                id={item.id}
                title={item.title}
                description={item.description}
                typeIcon={item.typeIcon}
                typeColor={item.typeColor}
                typeName={item.typeName}
                createdAt={item.createdAt}
              />
            </ItemTrigger>
          ))}
        </div>
      </section>
    </DashboardShell>
  )
}
