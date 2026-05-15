import { notFound, redirect } from 'next/navigation'
import { iconMap, DefaultIcon } from '@/lib/icon-map'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { ItemCard } from '@/components/items/ItemCard'
import { ImageThumbnailCard } from '@/components/items/ImageThumbnailCard'
import { FileListRow } from '@/components/items/FileListRow'
import { ItemTrigger } from '@/components/items/ItemTrigger'
import { TypeAddButton } from '@/components/items/TypeAddButton'
import { auth } from '@/auth'
import { getRecentCollections, getDemoUserId } from '@/lib/db/collections'
import { getItemsByType, getSystemItemTypesWithCounts } from '@/lib/db/items'
import { getEditorPreferences } from '@/lib/db/profile'
import { CREATE_ITEM_TYPES, type CreateItemType } from '@/lib/validations/items'
import { Pagination } from '@/components/ui/pagination'
import { ITEMS_PER_PAGE, parsePageParam } from '@/lib/pagination'
import { isProForGating, PRO_ITEM_TYPES } from '@/lib/usage-limits'

interface ItemsByTypePageProps {
  params: Promise<{ type: string }>
  searchParams: Promise<{ page?: string | string[] }>
}

export default async function ItemsByTypePage({
  params,
  searchParams,
}: ItemsByTypePageProps) {
  const { type: typeParam } = await params
  const { page: pageParam } = await searchParams
  const page = parsePageParam(pageParam)

  if (!typeParam.endsWith('s')) {
    notFound()
  }
  const singularType = typeParam.slice(0, -1)

  const session = await auth()
  const sidebarUser = session?.user
    ? { name: session.user.name, email: session.user.email, image: session.user.image }
    : null
  const userIsPro = isProForGating(session)

  const userId = await getDemoUserId()

  if (!userId) {
    return (
      <DashboardShell
        itemTypes={[]}
        sidebarCollections={[]}
        user={sidebarUser}
        userIsPro={userIsPro}
      >
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">No demo user found. Run the seed script first.</p>
        </div>
      </DashboardShell>
    )
  }

  const isProOnlyType = PRO_ITEM_TYPES.has(singularType as 'file' | 'image')
  if (isProOnlyType && !userIsPro) {
    redirect('/upgrade')
  }

  const [result, collections, itemTypes, editorPreferences] = await Promise.all([
    getItemsByType(userId, singularType, page),
    getRecentCollections(userId),
    getSystemItemTypesWithCounts(userId),
    getEditorPreferences(userId),
  ])

  if (!result) {
    notFound()
  }

  const { type, items, total } = result
  const Icon = iconMap[type.icon] || DefaultIcon
  const heading = type.name.charAt(0).toUpperCase() + type.name.slice(1) + 's'
  const isCreatable = (CREATE_ITEM_TYPES as readonly string[]).includes(type.name)

  return (
    <DashboardShell itemTypes={itemTypes} sidebarCollections={collections} user={sidebarUser} editorPreferences={editorPreferences} userIsPro={userIsPro}>
      <div className="mb-8 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${type.color}20` }}
          >
            <Icon className="h-5 w-5" style={{ color: type.color }} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{heading}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {total} {total === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>
        {isCreatable && <TypeAddButton type={type.name as CreateItemType} />}
      </div>

      {items.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed">
          <p className="text-sm text-muted-foreground">No {heading.toLowerCase()} yet.</p>
        </div>
      ) : type.name === 'image' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ItemTrigger key={item.id} itemId={item.id}>
              <ImageThumbnailCard
                title={item.title}
                fileUrl={item.fileUrl}
                fileName={item.fileName}
                isFavorite={item.isFavorite}
                isPinned={item.isPinned}
              />
            </ItemTrigger>
          ))}
        </div>
      ) : type.name === 'file' ? (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
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
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ItemTrigger key={item.id} itemId={item.id}>
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
            </ItemTrigger>
          ))}
        </div>
      )}

      <Pagination
        className="mt-8"
        currentPage={page}
        total={total}
        perPage={ITEMS_PER_PAGE}
        basePath={`/items/${typeParam}`}
      />
    </DashboardShell>
  )
}
