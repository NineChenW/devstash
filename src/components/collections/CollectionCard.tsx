'use client'

import Link from 'next/link'
import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  Link as LinkIcon,
  File,
  Image as ImageIcon,
  Star,
  MoreHorizontal,
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

interface CollectionCardProps {
  id: string
  name: string
  description: string
  itemCount: number
  typeIcons: string[]
  isFavorite: boolean
  defaultTypeId?: string
}

export function CollectionCard({
  id,
  name,
  description,
  itemCount,
  typeIcons,
  isFavorite,
  defaultTypeId,
}: CollectionCardProps) {
  const dominantType = mockItemTypes.find((t) => t.id === defaultTypeId)
  const borderColor = dominantType?.color || '#3b82f6'

  return (
    <Link
      href={`/collections/${id}`}
      className="group relative flex flex-col rounded-xl border bg-card p-5 transition-colors hover:bg-accent/50"
      style={{ borderLeftColor: borderColor, borderLeftWidth: '2px' }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{name}</h3>
            {isFavorite && (
              <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {itemCount} items
          </p>
        </div>
        <button
          className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-accent-foreground group-hover:opacity-100"
          onClick={(e) => e.preventDefault()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">{description}</p>

      <div className="mt-4 flex gap-1.5">
        {typeIcons.slice(0, 4).map((iconName, index) => {
          const Icon = iconMap[iconName] || Code
          const type = mockItemTypes.find((t) => t.icon === iconName)
          return (
            <div
              key={index}
              className="flex h-6 w-6 items-center justify-center rounded bg-muted/50"
            >
              <Icon className="h-3.5 w-3.5" style={{ color: type?.color }} />
            </div>
          )
        })}
      </div>
    </Link>
  )
}
