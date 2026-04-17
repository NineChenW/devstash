import { prisma } from '@/lib/prisma'

export interface CollectionWithTypes {
  id: string
  name: string
  description: string | null
  isFavorite: boolean
  itemCount: number
  dominantColor: string
  typeIcons: { icon: string; color: string }[]
  createdAt: Date
  updatedAt: Date
}

export async function getRecentCollections(userId: string): Promise<CollectionWithTypes[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      items: {
        include: {
          item: {
            include: {
              itemType: true,
            },
          },
        },
      },
    },
  })

  return collections.map((collection) => {
    const itemTypes = collection.items.map((ic) => ic.item.itemType)

    // Count occurrences of each type to find dominant
    const typeCounts = new Map<string, { count: number; icon: string; color: string }>()
    for (const type of itemTypes) {
      const existing = typeCounts.get(type.id)
      if (existing) {
        existing.count++
      } else {
        typeCounts.set(type.id, { count: 1, icon: type.icon, color: type.color })
      }
    }

    // Find dominant type (most used)
    let dominantColor = '#3b82f6'
    let maxCount = 0
    for (const [, value] of typeCounts) {
      if (value.count > maxCount) {
        maxCount = value.count
        dominantColor = value.color
      }
    }

    // Unique type icons
    const seen = new Set<string>()
    const typeIcons: { icon: string; color: string }[] = []
    for (const type of itemTypes) {
      if (!seen.has(type.id)) {
        seen.add(type.id)
        typeIcons.push({ icon: type.icon, color: type.color })
      }
    }

    return {
      id: collection.id,
      name: collection.name,
      description: collection.description,
      isFavorite: collection.isFavorite,
      itemCount: collection.items.length,
      dominantColor,
      typeIcons,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
    }
  })
}

export async function getCollectionStats(userId: string) {
  const [totalItems, totalCollections, favoriteItems, favoriteCollections] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.collection.count({ where: { userId } }),
    prisma.item.count({ where: { userId, isFavorite: true } }),
    prisma.collection.count({ where: { userId, isFavorite: true } }),
  ])

  return { totalItems, totalCollections, favoriteItems, favoriteCollections }
}

export async function getDemoUserId(): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { email: 'demo@devstash.io' },
    select: { id: true },
  })
  return user?.id ?? null
}
