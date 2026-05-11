import Link from 'next/link'
import { FolderOpen, Star } from 'lucide-react'
import { auth } from '@/auth'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { ItemTrigger } from '@/components/items/ItemTrigger'
import { iconMap, DefaultIcon } from '@/lib/icon-map'
import { getRecentCollections, getDemoUserId } from '@/lib/db/collections'
import { getSystemItemTypesWithCounts } from '@/lib/db/items'
import { getEditorPreferences } from '@/lib/db/profile'
import { getFavorites, type FavoriteCollection, type FavoriteItem } from '@/lib/db/favorites'

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
  const isEmpty = items.length === 0 && collections.length === 0

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
            {items.length + collections.length}{' '}
            {items.length + collections.length === 1 ? 'favorite' : 'favorites'}
          </p>
        </div>
      </div>

      {isEmpty ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-center">
          <Star className="h-8 w-8 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">No favorites yet.</p>
          <p className="text-xs text-muted-foreground/80">
            Star items and collections to surface them here.
          </p>
        </div>
      ) : (
        <div className="space-y-10 font-mono">
          {items.length > 0 && (
            <FavoritesSection title="Items" count={items.length}>
              {items.map((item) => (
                <ItemTrigger key={item.id} itemId={item.id}>
                  <ItemRow item={item} />
                </ItemTrigger>
              ))}
            </FavoritesSection>
          )}

          {collections.length > 0 && (
            <FavoritesSection title="Collections" count={collections.length}>
              {collections.map((collection) => (
                <Link
                  key={collection.id}
                  href={`/collections/${collection.id}`}
                  className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  <CollectionRow collection={collection} />
                </Link>
              ))}
            </FavoritesSection>
          )}
        </div>
      )}
    </DashboardShell>
  )
}

function FavoritesSection({
  title,
  count,
  children,
}: {
  title: string
  count: number
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-2 flex items-baseline gap-2 border-b pb-1.5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h2>
        <span className="text-xs text-muted-foreground/70">({count})</span>
      </div>
      <div className="divide-y divide-border/50">{children}</div>
    </section>
  )
}

function ItemRow({ item }: { item: FavoriteItem }) {
  const Icon = iconMap[item.typeIcon] || DefaultIcon
  return (
    <div className="flex items-center gap-3 px-2 py-1.5 transition-colors hover:bg-accent/40">
      <Icon className="h-4 w-4 shrink-0" style={{ color: item.typeColor }} />
      <span className="min-w-0 flex-1 truncate text-sm">{item.title}</span>
      <span
        className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
        style={{ backgroundColor: `${item.typeColor}20`, color: item.typeColor }}
      >
        {item.typeName}
      </span>
      <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
        {formatDate(item.updatedAt)}
      </span>
    </div>
  )
}

function CollectionRow({ collection }: { collection: FavoriteCollection }) {
  return (
    <div className="flex items-center gap-3 px-2 py-1.5 transition-colors hover:bg-accent/40">
      <FolderOpen className="h-4 w-4 shrink-0" style={{ color: collection.dominantColor }} />
      <span className="min-w-0 flex-1 truncate text-sm">{collection.name}</span>
      <span
        className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
        style={{ backgroundColor: `${collection.dominantColor}20`, color: collection.dominantColor }}
      >
        {collection.itemCount} {collection.itemCount === 1 ? 'item' : 'items'}
      </span>
      <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
        {formatDate(collection.updatedAt)}
      </span>
    </div>
  )
}

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
