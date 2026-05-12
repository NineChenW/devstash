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
  dominantTypeName: string
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
              select: { itemType: { select: { id: true, name: true, color: true } } },
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
    collections: collections.map((collection) => {
      const dominant = pickDominantType(collection.items.map((ic) => ic.item.itemType))
      return {
        id: collection.id,
        name: collection.name,
        itemCount: collection.items.length,
        dominantColor: dominant.color,
        dominantTypeName: dominant.name,
        updatedAt: collection.updatedAt,
      }
    }),
  }
}

function pickDominantType(
  types: { id: string; name: string; color: string }[],
): { name: string; color: string } {
  if (types.length === 0) return { name: '', color: '#10b981' }
  const counts = new Map<string, { count: number; name: string; color: string }>()
  for (const type of types) {
    const existing = counts.get(type.id)
    if (existing) {
      existing.count++
    } else {
      counts.set(type.id, { count: 1, name: type.name, color: type.color })
    }
  }
  let max = 0
  let result = { name: '', color: '#10b981' }
  for (const value of counts.values()) {
    if (value.count > max) {
      max = value.count
      result = { name: value.name, color: value.color }
    }
  }
  return result
}
