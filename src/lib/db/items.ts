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
