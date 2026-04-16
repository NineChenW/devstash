'use client'

import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  Link as LinkIcon,
  File,
  Image as ImageIcon,
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

interface RecentItemProps {
  id: string
  title: string
  description?: string
  itemTypeId: string
  createdAt: string
}

export function RecentItem({ title, description, itemTypeId, createdAt }: RecentItemProps) {
  const type = mockItemTypes.find((t) => t.id === itemTypeId)
  const Icon = type ? iconMap[type.icon] || Code : Code
  const date = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <div
      className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-colors hover:bg-accent/50"
      style={{ borderLeftColor: type?.color, borderLeftWidth: '2px' }}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${type?.color}20` }}
      >
        <Icon className="h-4 w-4" style={{ color: type?.color }} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        {description && (
          <p className="truncate text-xs text-muted-foreground">{description}</p>
        )}
      </div>

      <span className="shrink-0 text-xs text-muted-foreground">{date}</span>
    </div>
  )
}
