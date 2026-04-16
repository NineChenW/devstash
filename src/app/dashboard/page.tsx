import { Layers, FolderOpen, Star, Bookmark, Pin } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { CollectionCard } from '@/components/collections/CollectionCard'
import { PinnedItem } from '@/components/items/PinnedItem'
import { RecentItem } from '@/components/items/RecentItem'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { mockCollections, mockPinnedItems, mockItems, mockStats } from '@/lib/mock-data'

export default function Dashboard() {
  return (
    <DashboardShell>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Your developer knowledge hub</p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard label="Total Items" value={mockStats.totalItems} icon={Layers} iconColor="#3b82f6" />
        <StatsCard label="Collections" value={mockStats.totalCollections} icon={FolderOpen} iconColor="#10b981" />
        <StatsCard label="Favorite Items" value={mockStats.favoriteItems} icon={Star} iconColor="#f59e0b" />
        <StatsCard label="Fav Collections" value={mockStats.favoriteCollections} icon={Bookmark} iconColor="#8b5cf6" />
      </div>

      {/* Recent Collections */}
      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Collections</h2>
          <button className="text-sm text-muted-foreground hover:text-foreground">View all</button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...mockCollections]
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .map((collection) => (
              <CollectionCard
                key={collection.id}
                id={collection.id}
                name={collection.name}
                description={collection.description}
                itemCount={collection.itemCount}
                typeIcons={collection.typeIcons}
                isFavorite={collection.isFavorite}
                defaultTypeId={collection.defaultTypeId}
              />
            ))}
        </div>
      </section>

      {/* Pinned Section */}
      <section className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <Pin className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Pinned</h2>
        </div>
        <div className="space-y-3">
          {mockPinnedItems.map((item) => (
            <PinnedItem
              key={item.id}
              id={item.id}
              title={item.title}
              description={item.description}
              itemTypeId={item.itemTypeId}
              isFavorite={item.isFavorite}
              tags={item.tags}
              createdAt={item.createdAt}
            />
          ))}
        </div>
      </section>

      {/* Recent Items */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Items</h2>
          <button className="text-sm text-muted-foreground hover:text-foreground">View all</button>
        </div>
        <div className="space-y-2">
          {[...mockItems]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 10)
            .map((item) => (
              <RecentItem
                key={item.id}
                id={item.id}
                title={item.title}
                description={item.description}
                itemTypeId={item.itemTypeId}
                createdAt={item.createdAt}
              />
            ))}
        </div>
      </section>
    </DashboardShell>
  )
}
