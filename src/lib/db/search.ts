import { prisma } from '@/lib/prisma'

export interface SearchItem {
  id: string
  title: string
  contentPreview: string | null
  typeName: string
  typeIcon: string
  typeColor: string
}

export interface SearchCollection {
  id: string
  name: string
  itemCount: number
}

export interface SearchData {
  items: SearchItem[]
  collections: SearchCollection[]
}

export const PREVIEW_MAX = 80

export function buildPreview(item: {
  description: string | null
  content: string | null
  url: string | null
  fileName: string | null
}): string | null {
  const source = item.description ?? item.content ?? item.url ?? item.fileName
  if (!source) return null
  const trimmed = source.trim().replace(/\s+/g, ' ')
  if (trimmed.length === 0) return null
  return trimmed.length > PREVIEW_MAX ? `${trimmed.slice(0, PREVIEW_MAX)}…` : trimmed
}

export async function getSearchData(userId: string): Promise<SearchData> {
  const [items, collections] = await Promise.all([
    prisma.item.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        content: true,
        url: true,
        fileName: true,
        itemType: { select: { name: true, icon: true, color: true } },
      },
    }),
    prisma.collection.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        _count: { select: { items: true } },
      },
    }),
  ])

  return {
    items: items.map((item) => ({
      id: item.id,
      title: item.title,
      contentPreview: buildPreview(item),
      typeName: item.itemType.name,
      typeIcon: item.itemType.icon,
      typeColor: item.itemType.color,
    })),
    collections: collections.map((c) => ({
      id: c.id,
      name: c.name,
      itemCount: c._count.items,
    })),
  }
}
