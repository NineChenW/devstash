import { prisma } from '@/lib/prisma'
import type { ItemListItem } from '@/lib/db/items'

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

interface CollectionWithItemTypes {
  id: string
  name: string
  description: string | null
  isFavorite: boolean
  createdAt: Date
  updatedAt: Date
  items: { item: { itemType: { id: string; icon: string; color: string } } }[]
}

function toCollectionWithTypes(collection: CollectionWithItemTypes): CollectionWithTypes {
  const itemTypes = collection.items.map((ic) => ic.item.itemType)

  const typeCounts = new Map<string, { count: number; icon: string; color: string }>()
  for (const type of itemTypes) {
    const existing = typeCounts.get(type.id)
    if (existing) {
      existing.count++
    } else {
      typeCounts.set(type.id, { count: 1, icon: type.icon, color: type.color })
    }
  }

  let dominantColor = '#3b82f6'
  let maxCount = 0
  for (const [, value] of typeCounts) {
    if (value.count > maxCount) {
      maxCount = value.count
      dominantColor = value.color
    }
  }

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
}

export async function getRecentCollections(userId: string): Promise<CollectionWithTypes[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: 20,
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

  return collections.map(toCollectionWithTypes)
}

export async function getAllCollections(userId: string): Promise<CollectionWithTypes[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: [{ isFavorite: 'desc' }, { name: 'asc' }],
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

  return collections.map(toCollectionWithTypes)
}

export interface CollectionWithItems {
  collection: CollectionWithTypes
  items: ItemListItem[]
}

export async function getCollectionWithItems(
  collectionId: string,
  userId: string,
): Promise<CollectionWithItems | null> {
  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    include: {
      items: {
        orderBy: { addedAt: 'desc' },
        include: {
          item: {
            include: {
              itemType: true,
              tags: true,
            },
          },
        },
      },
    },
  })
  if (!collection) return null

  const items: ItemListItem[] = collection.items.map(({ item }) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    typeIcon: item.itemType.icon,
    typeColor: item.itemType.color,
    typeName: item.itemType.name,
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    content: item.content,
    url: item.url,
    fileUrl: item.fileUrl,
    fileName: item.fileName,
    fileSize: item.fileSize,
    tags: item.tags.map((t) => t.name),
    createdAt: item.createdAt,
  }))

  return {
    collection: toCollectionWithTypes({
      id: collection.id,
      name: collection.name,
      description: collection.description,
      isFavorite: collection.isFavorite,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
      items: collection.items.map((ic) => ({ item: { itemType: ic.item.itemType } })),
    }),
    items,
  }
}

export interface UserCollectionOption {
  id: string
  name: string
  itemCount: number
}

export async function getUserCollections(userId: string): Promise<UserCollectionOption[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      _count: { select: { items: true } },
    },
  })

  return collections.map((c) => ({
    id: c.id,
    name: c.name,
    itemCount: c._count.items,
  }))
}

export interface CreateCollectionInput {
  name: string
  description: string | null
}

export interface CreatedCollection {
  id: string
  name: string
  description: string | null
  isFavorite: boolean
  createdAt: Date
  updatedAt: Date
}

export async function createCollection(
  userId: string,
  data: CreateCollectionInput,
): Promise<CreatedCollection> {
  const created = await prisma.collection.create({
    data: {
      name: data.name,
      description: data.description,
      userId,
    },
    select: {
      id: true,
      name: true,
      description: true,
      isFavorite: true,
      createdAt: true,
      updatedAt: true,
    },
  })
  return created
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
