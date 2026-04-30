import { notFound } from 'next/navigation'
import { iconMap, DefaultIcon } from '@/lib/icon-map'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { ItemCard } from '@/components/items/ItemCard'
import { ItemTrigger } from '@/components/items/ItemTrigger'
import { auth } from '@/auth'
import { getRecentCollections, getDemoUserId } from '@/lib/db/collections'
import { getItemsByType, getSystemItemTypesWithCounts } from '@/lib/db/items'

interface ItemsByTypePageProps {
  params: Promise<{ type: string }>
}

export default async function ItemsByTypePage({ params }: ItemsByTypePageProps) {
  const { type: typeParam } = await params

  if (!typeParam.endsWith('s')) {
    notFound()
  }
  const singularType = typeParam.slice(0, -1)

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

  const [result, collections, itemTypes] = await Promise.all([
    getItemsByType(userId, singularType),
    getRecentCollections(userId),
    getSystemItemTypesWithCounts(userId),
  ])

  if (!result) {
    notFound()
  }

  const { type, items } = result
  const Icon = iconMap[type.icon] || DefaultIcon
  const heading = type.name.charAt(0).toUpperCase() + type.name.slice(1) + 's'

  return (
    <DashboardShell itemTypes={itemTypes} sidebarCollections={collections} user={sidebarUser}>
      <div className="mb-8 flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${type.color}20` }}
        >
          <Icon className="h-5 w-5" style={{ color: type.color }} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">{heading}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed">
          <p className="text-sm text-muted-foreground">No {heading.toLowerCase()} yet.</p>
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
                isFavorite={item.isFavorite}
                isPinned={item.isPinned}
                tags={item.tags}
                createdAt={item.createdAt}
              />
            </ItemTrigger>
          ))}
        </div>
      )}
    </DashboardShell>
  )
}
