'use client'

import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  Link as LinkIcon,
  File,
  Image as ImageIcon,
  Star,
  Pin,
} from 'lucide-react'
import { mockItemTypes } from '@/lib/mock-data'

const iconMap: Record<string, React.ElementType> = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  Link: LinkIcon,
  File,
  Image: ImageIcon,
}

interface PinnedItemProps {
  id: string
  title: string
  description: string
  itemTypeId: string
  isFavorite: boolean
  tags: string[]
  createdAt: string
}

export function PinnedItem({
  title,
  description,
  itemTypeId,
  isFavorite,
  tags,
  createdAt,
}: PinnedItemProps) {
  const type = mockItemTypes.find((t) => t.id === itemTypeId)
  const Icon = type ? iconMap[type.icon] || Code : Code
  const date = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <div
      className="flex items-start gap-4 rounded-xl border bg-card p-4 transition-colors hover:bg-accent/50"
      style={{ borderLeftColor: type?.color, borderLeftWidth: '2px' }}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${type?.color}20` }}
      >
        <Icon className="h-5 w-5" style={{ color: type?.color }} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium">{title}</h4>
          <Pin className="h-3.5 w-3.5 text-muted-foreground" />
          {isFavorite && (
            <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      
      <span className="shrink-0 text-xs text-muted-foreground">{date}</span>
    </div>
  )
}
