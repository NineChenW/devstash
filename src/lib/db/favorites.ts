import { prisma } from '@/lib/prisma'

export interface FavoriteItem {
  id: string
  title: string
  typeName: string
  typeIcon: string
  typeColor: string
  updatedAt: Date
}

export interface FavoriteCollection {
  id: string
  name: string
  itemCount: number
  dominantColor: string
  updatedAt: Date
}

export interface FavoritesResult {
  items: FavoriteItem[]
  collections: FavoriteCollection[]
}

export async function getFavorites(userId: string): Promise<FavoritesResult> {
  const [items, collections] = await Promise.all([
    prisma.item.findMany({
      where: { userId, isFavorite: true },
      orderBy: { updatedAt: 'desc' },
      include: {
        itemType: { select: { name: true, icon: true, color: true } },
      },
    }),
    prisma.collection.findMany({
      where: { userId, isFavorite: true },
      orderBy: { updatedAt: 'desc' },
      include: {
        items: {
          select: {
            item: {
              select: { itemType: { select: { id: true, color: true } } },
            },
          },
        },
      },
    }),
  ])

  return {
    items: items.map((item) => ({
      id: item.id,
      title: item.title,
      typeName: item.itemType.name,
      typeIcon: item.itemType.icon,
      typeColor: item.itemType.color,
      updatedAt: item.updatedAt,
    })),
    collections: collections.map((collection) => ({
      id: collection.id,
      name: collection.name,
      itemCount: collection.items.length,
      dominantColor: pickDominantColor(collection.items.map((ic) => ic.item.itemType)),
      updatedAt: collection.updatedAt,
    })),
  }
}

function pickDominantColor(types: { id: string; color: string }[]): string {
  if (types.length === 0) return '#10b981'
  const counts = new Map<string, { count: number; color: string }>()
  for (const type of types) {
    const existing = counts.get(type.id)
    if (existing) {
      existing.count++
    } else {
      counts.set(type.id, { count: 1, color: type.color })
    }
  }
  let max = 0
  let color = '#10b981'
  for (const value of counts.values()) {
    if (value.count > max) {
      max = value.count
      color = value.color
    }
  }
  return color
}
