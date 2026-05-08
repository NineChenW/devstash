import { notFound } from 'next/navigation'
import { FolderOpen, Star } from 'lucide-react'
import { auth } from '@/auth'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { CollectionActions } from '@/components/collections/CollectionActions'
import { ItemCard } from '@/components/items/ItemCard'
import { ImageThumbnailCard } from '@/components/items/ImageThumbnailCard'
import { FileListRow } from '@/components/items/FileListRow'
import { ItemTrigger } from '@/components/items/ItemTrigger'
import {
  getCollectionWithItems,
  getDemoUserId,
  getRecentCollections,
} from '@/lib/db/collections'
import { getSystemItemTypesWithCounts, type ItemListItem } from '@/lib/db/items'

interface CollectionPageProps {
  params: Promise<{ id: string }>
}

const GRID_CLASS = 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'
const LIST_CLASS = 'flex flex-col gap-2'

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { id } = await params

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

  const [result, sidebarCollections, itemTypes] = await Promise.all([
    getCollectionWithItems(id, userId),
    getRecentCollections(userId),
    getSystemItemTypesWithCounts(userId),
  ])

  if (!result) {
    notFound()
  }

  const { collection, items } = result

  const groups = [
    {
      key: 'image',
      title: 'Images',
      items: items.filter((i) => i.typeName === 'image'),
      layoutClass: GRID_CLASS,
    },
    {
      key: 'file',
      title: 'Files',
      items: items.filter((i) => i.typeName === 'file'),
      layoutClass: LIST_CLASS,
    },
    {
      key: 'other',
      title: 'Other',
      items: items.filter((i) => i.typeName !== 'image' && i.typeName !== 'file'),
      layoutClass: GRID_CLASS,
    },
  ].filter((g) => g.items.length > 0)

  const showHeadings = groups.length > 1

  return (
    <DashboardShell itemTypes={itemTypes} sidebarCollections={sidebarCollections} user={sidebarUser}>
      <div className="mb-8 flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${collection.dominantColor}20` }}
        >
          <FolderOpen className="h-5 w-5" style={{ color: collection.dominantColor }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-2xl font-semibold">{collection.name}</h1>
            {collection.isFavorite && (
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
            )}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </p>
          {collection.description && (
            <p className="mt-2 text-sm text-muted-foreground">{collection.description}</p>
          )}
        </div>
        <CollectionActions
          collection={{
            id: collection.id,
            name: collection.name,
            description: collection.description,
            isFavorite: collection.isFavorite,
          }}
        />
      </div>

      {items.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed">
          <p className="text-sm text-muted-foreground">No items in this collection yet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.key}>
              {showHeadings && (
                <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                  {group.title}{' '}
                  <span className="text-muted-foreground/70">({group.items.length})</span>
                </h2>
              )}
              <div className={group.layoutClass}>{group.items.map(renderItem)}</div>
            </section>
          ))}
        </div>
      )}
    </DashboardShell>
  )
}

function renderItem(item: ItemListItem) {
  if (item.typeName === 'file') {
    return (
      <FileListRow
        key={item.id}
        id={item.id}
        title={item.title}
        fileUrl={item.fileUrl}
        fileName={item.fileName}
        fileSize={item.fileSize}
        isFavorite={item.isFavorite}
        isPinned={item.isPinned}
        createdAt={item.createdAt}
      />
    )
  }
  return (
    <ItemTrigger key={item.id} itemId={item.id}>
      {item.typeName === 'image' ? (
        <ImageThumbnailCard
          title={item.title}
          fileUrl={item.fileUrl}
          fileName={item.fileName}
          isFavorite={item.isFavorite}
          isPinned={item.isPinned}
        />
      ) : (
        <ItemCard
          id={item.id}
          title={item.title}
          description={item.description}
          typeIcon={item.typeIcon}
          typeColor={item.typeColor}
          typeName={item.typeName}
          content={item.content}
          url={item.url}
          isFavorite={item.isFavorite}
          isPinned={item.isPinned}
          tags={item.tags}
          createdAt={item.createdAt}
        />
      )}
    </ItemTrigger>
  )
}
