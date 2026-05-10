import { prisma } from '@/lib/prisma'
import {
  parseEditorPreferences,
  type EditorPreferences,
} from '@/lib/validations/editor-preferences'

export async function getEditorPreferences(userId: string): Promise<EditorPreferences> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { editorPreferences: true },
  })
  return parseEditorPreferences(user?.editorPreferences ?? null)
}

export async function saveEditorPreferences(
  userId: string,
  preferences: EditorPreferences,
): Promise<EditorPreferences> {
  await prisma.user.update({
    where: { id: userId },
    data: { editorPreferences: preferences },
  })
  return preferences
}

export interface ProfileUser {
  id: string
  name: string | null
  email: string | null
  image: string | null
  createdAt: Date
  hasPassword: boolean
}

export interface ProfileTypeCount {
  name: string
  icon: string
  color: string
  count: number
}

export interface ProfileStats {
  totalItems: number
  totalCollections: number
  typeCounts: ProfileTypeCount[]
}

const SYSTEM_TYPE_ORDER = ['snippet', 'prompt', 'command', 'note', 'file', 'image', 'link']

export async function getProfileUser(userId: string): Promise<ProfileUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      password: true,
    },
  })
  if (!user) return null
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    createdAt: user.createdAt,
    hasPassword: Boolean(user.password),
  }
}

export async function getProfileStats(userId: string): Promise<ProfileStats> {
  const [totalItems, totalCollections, types] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.collection.count({ where: { userId } }),
    prisma.itemType.findMany({
      where: { isSystem: true },
      include: {
        _count: {
          select: { items: { where: { userId } } },
        },
      },
    }),
  ])

  const byName = new Map(types.map((t) => [t.name, t]))
  const typeCounts: ProfileTypeCount[] = SYSTEM_TYPE_ORDER.flatMap((name) => {
    const t = byName.get(name)
    if (!t) return []
    return [{ name: t.name, icon: t.icon, color: t.color, count: t._count.items }]
  })

  return { totalItems, totalCollections, typeCounts }
}
