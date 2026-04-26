import { prisma } from '@/lib/prisma'

export interface DashboardItem {
  id: string
  title: string
  description: string | null
  typeIcon: string
  typeColor: string
  typeName: string
  isFavorite: boolean
  tags: string[]
  createdAt: Date
}

export interface ItemTypeWithCount {
  id: string
  name: string
  icon: string
  color: string
  count: number
}

const SYSTEM_TYPE_ORDER = ['snippet', 'prompt', 'command', 'note', 'file', 'image', 'link']

export async function getSystemItemTypesWithCounts(userId: string): Promise<ItemTypeWithCount[]> {
  const types = await prisma.itemType.findMany({
    where: { isSystem: true },
    include: {
      _count: {
        select: {
          items: { where: { userId } },
        },
      },
    },
  })

  const byName = new Map(types.map((t) => [t.name, t]))
  return SYSTEM_TYPE_ORDER.flatMap((name) => {
    const type = byName.get(name)
    if (!type) return []
    return [{
      id: type.id,
      name: type.name,
      icon: type.icon,
      color: type.color,
      count: type._count.items,
    }]
  })
}

export async function getPinnedItems(userId: string): Promise<DashboardItem[]> {
  const items = await prisma.item.findMany({
    where: { userId, isPinned: true },
    orderBy: { updatedAt: 'desc' },
    include: {
      itemType: true,
      tags: true,
    },
  })

  return items.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    typeIcon: item.itemType.icon,
    typeColor: item.itemType.color,
    typeName: item.itemType.name,
    isFavorite: item.isFavorite,
    tags: item.tags.map((t) => t.name),
    createdAt: item.createdAt,
  }))
}

export async function getRecentItems(userId: string, limit = 10): Promise<DashboardItem[]> {
  const items = await prisma.item.findMany({
    where: { userId },
    orderBy: [{ lastUsedAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
    take: limit,
    include: {
      itemType: true,
      tags: true,
    },
  })

  return items.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    typeIcon: item.itemType.icon,
    typeColor: item.itemType.color,
    typeName: item.itemType.name,
    isFavorite: item.isFavorite,
    tags: item.tags.map((t) => t.name),
    createdAt: item.createdAt,
  }))
}

export interface ItemListItem extends DashboardItem {
  isPinned: boolean
}

export interface ItemsByTypeResult {
  type: { name: string; icon: string; color: string }
  items: ItemListItem[]
}

export async function getItemsByType(
  userId: string,
  typeName: string,
): Promise<ItemsByTypeResult | null> {
  const type = await prisma.itemType.findFirst({
    where: {
      name: typeName,
      OR: [{ isSystem: true }, { userId }],
    },
  })
  if (!type) return null

  const items = await prisma.item.findMany({
    where: { userId, itemTypeId: type.id },
    orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
    include: {
      itemType: true,
      tags: true,
    },
  })

  return {
    type: { name: type.name, icon: type.icon, color: type.color },
    items: items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      typeIcon: item.itemType.icon,
      typeColor: item.itemType.color,
      typeName: item.itemType.name,
      isFavorite: item.isFavorite,
      isPinned: item.isPinned,
      tags: item.tags.map((t) => t.name),
      createdAt: item.createdAt,
    })),
  }
}
