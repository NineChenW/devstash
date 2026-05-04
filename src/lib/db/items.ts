import { prisma } from '@/lib/prisma'
import { deleteObject, isR2Configured } from '@/lib/r2'

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

export interface ItemDetail {
  id: string
  title: string
  description: string | null
  contentType: string
  content: string | null
  fileUrl: string | null
  fileName: string | null
  fileSize: number | null
  url: string | null
  language: string | null
  isFavorite: boolean
  isPinned: boolean
  tags: string[]
  collections: { id: string; name: string }[]
  type: { name: string; icon: string; color: string }
  createdAt: Date
  updatedAt: Date
}

export async function getItemDetail(
  itemId: string,
  userId: string,
): Promise<ItemDetail | null> {
  const item = await prisma.item.findFirst({
    where: { id: itemId, userId },
    include: {
      itemType: true,
      tags: true,
      collections: { include: { collection: true } },
    },
  })
  if (!item) return null

  return {
    id: item.id,
    title: item.title,
    description: item.description,
    contentType: item.contentType,
    content: item.content,
    fileUrl: item.fileUrl,
    fileName: item.fileName,
    fileSize: item.fileSize,
    url: item.url,
    language: item.language,
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    tags: item.tags.map((t) => t.name),
    collections: item.collections.map((ic) => ({
      id: ic.collection.id,
      name: ic.collection.name,
    })),
    type: {
      name: item.itemType.name,
      icon: item.itemType.icon,
      color: item.itemType.color,
    },
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

export interface UpdateItemInput {
  title: string
  description: string | null
  content: string | null
  url: string | null
  language: string | null
  tags: string[]
}

export async function updateItem(
  itemId: string,
  userId: string,
  data: UpdateItemInput,
): Promise<ItemDetail | null> {
  const owned = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { id: true },
  })
  if (!owned) return null

  await prisma.item.update({
    where: { id: itemId },
    data: {
      title: data.title,
      description: data.description,
      content: data.content,
      url: data.url,
      language: data.language,
      tags: {
        set: [],
        connectOrCreate: data.tags.map((name) => ({
          where: { name },
          create: { name },
        })),
      },
    },
  })

  return getItemDetail(itemId, userId)
}

export interface CreateItemInput {
  typeName: string
  title: string
  description: string | null
  content: string | null
  url: string | null
  language: string | null
  tags: string[]
  fileUrl?: string | null
  fileName?: string | null
  fileSize?: number | null
}

const TYPE_CONTENT_TYPE: Record<string, string> = {
  snippet: 'text',
  prompt: 'text',
  command: 'text',
  note: 'text',
  link: 'url',
  file: 'file',
  image: 'file',
}

export async function createItem(
  userId: string,
  data: CreateItemInput,
): Promise<ItemDetail | null> {
  const type = await prisma.itemType.findFirst({
    where: {
      name: data.typeName,
      OR: [{ isSystem: true }, { userId }],
    },
    select: { id: true },
  })
  if (!type) return null

  const created = await prisma.item.create({
    data: {
      title: data.title,
      description: data.description,
      contentType: TYPE_CONTENT_TYPE[data.typeName] ?? 'text',
      content: data.content,
      url: data.url,
      language: data.language,
      fileUrl: data.fileUrl ?? null,
      fileName: data.fileName ?? null,
      fileSize: data.fileSize ?? null,
      userId,
      itemTypeId: type.id,
      tags: {
        connectOrCreate: data.tags.map((name) => ({
          where: { name },
          create: { name },
        })),
      },
    },
    select: { id: true },
  })

  return getItemDetail(created.id, userId)
}

export async function deleteItem(
  itemId: string,
  userId: string,
): Promise<boolean> {
  const owned = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { id: true, fileUrl: true },
  })
  if (!owned) return false

  await prisma.item.delete({ where: { id: itemId } })

  if (owned.fileUrl && owned.fileUrl.startsWith('/api/files/') && isR2Configured()) {
    const key = owned.fileUrl.slice('/api/files/'.length)
    try {
      await deleteObject(key)
    } catch (err) {
      console.error('R2 deleteObject failed for', key, err)
    }
  }

  return true
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
