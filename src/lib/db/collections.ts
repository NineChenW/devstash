import { prisma } from '@/lib/prisma'
import type { ItemListItem } from '@/lib/db/items'
import {
  COLLECTIONS_PER_PAGE,
  DASHBOARD_COLLECTIONS_LIMIT,
  ITEMS_PER_PAGE,
} from '@/lib/pagination'

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
    take: DASHBOARD_COLLECTIONS_LIMIT,
    include: {
      items: {
        select: {
          item: {
            select: {
              itemType: { select: { id: true, icon: true, color: true } },
            },
          },
        },
      },
    },
  })

  return collections.map(toCollectionWithTypes)
}

export interface AllCollectionsResult {
  collections: CollectionWithTypes[]
  total: number
}

export async function getAllCollections(
  userId: string,
  page = 1,
): Promise<AllCollectionsResult> {
  const skip = (Math.max(1, page) - 1) * COLLECTIONS_PER_PAGE
  const where = { userId }
  const [collections, total] = await Promise.all([
    prisma.collection.findMany({
      where,
      orderBy: [{ isFavorite: 'desc' }, { name: 'asc' }],
      skip,
      take: COLLECTIONS_PER_PAGE,
      include: {
        items: {
          select: {
            item: {
              select: {
                itemType: { select: { id: true, icon: true, color: true } },
              },
            },
          },
        },
      },
    }),
    prisma.collection.count({ where }),
  ])

  return {
    collections: collections.map(toCollectionWithTypes),
    total,
  }
}

export interface CollectionWithItems {
  collection: CollectionWithTypes
  items: ItemListItem[]
  total: number
}

export async function getCollectionWithItems(
  collectionId: string,
  userId: string,
  page = 1,
): Promise<CollectionWithItems | null> {
  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    include: {
      items: {
        select: {
          item: {
            select: {
              itemType: { select: { id: true, icon: true, color: true } },
            },
          },
        },
      },
    },
  })
  if (!collection) return null

  const total = collection.items.length
  const skip = (Math.max(1, page) - 1) * ITEMS_PER_PAGE
  const sliceRows = await prisma.itemCollection.findMany({
    where: { collectionId },
    orderBy: { addedAt: 'desc' },
    skip,
    take: ITEMS_PER_PAGE,
    include: {
      item: {
        include: {
          itemType: true,
          tags: true,
        },
      },
    },
  })

  const items: ItemListItem[] = sliceRows.map(({ item }) => ({
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
    total,
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

export interface UpdateCollectionInput {
  name: string
  description: string | null
}

export async function updateCollection(
  collectionId: string,
  userId: string,
  data: UpdateCollectionInput,
): Promise<CreatedCollection | null> {
  const owned = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    select: { id: true },
  })
  if (!owned) return null

  const updated = await prisma.collection.update({
    where: { id: collectionId },
    data: {
      name: data.name,
      description: data.description,
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
  return updated
}

export async function toggleCollectionFavorite(
  collectionId: string,
  userId: string,
): Promise<{ isFavorite: boolean } | null> {
  const owned = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    select: { id: true, isFavorite: true },
  })
  if (!owned) return null

  const updated = await prisma.collection.update({
    where: { id: collectionId },
    data: { isFavorite: !owned.isFavorite },
    select: { isFavorite: true },
  })
  return { isFavorite: updated.isFavorite }
}

export async function deleteCollection(
  collectionId: string,
  userId: string,
): Promise<boolean> {
  const owned = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    select: { id: true },
  })
  if (!owned) return false

  await prisma.collection.delete({ where: { id: collectionId } })
  return true
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
