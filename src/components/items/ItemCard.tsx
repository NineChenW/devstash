import { Pin, Star } from 'lucide-react'
import { iconMap, DefaultIcon } from '@/lib/icon-map'
import { CopyButton } from './CopyButton'

interface ItemCardProps {
  id: string
  title: string
  description: string | null
  typeIcon: string
  typeColor: string
  typeName: string
  content: string | null
  url: string | null
  isFavorite: boolean
  isPinned: boolean
  tags: string[]
  createdAt: Date
}

export function ItemCard({
  title,
  description,
  typeIcon,
  typeColor,
  typeName,
  content,
  url,
  isFavorite,
  isPinned,
  tags,
  createdAt,
}: ItemCardProps) {
  const Icon = iconMap[typeIcon] || DefaultIcon
  const date = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  const copyText = (content ?? url ?? '').trim()
  const showCopy = copyText.length > 0

  return (
    <div
      className="flex h-full flex-col gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-accent/50"
      style={{ borderLeftColor: typeColor, borderLeftWidth: '3px' }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${typeColor}20` }}
        >
          <Icon className="h-4 w-4" style={{ color: typeColor }} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-medium">{title}</h3>
            {isPinned && <Pin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
            {isFavorite && (
              <Star className="h-3.5 w-3.5 shrink-0 fill-yellow-500 text-yellow-500" />
            )}
          </div>
          <span
            className="mt-1 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
            style={{ backgroundColor: `${typeColor}20`, color: typeColor }}
          >
            {typeName}
          </span>
        </div>

        <span className="shrink-0 text-xs text-muted-foreground">{date}</span>
      </div>

      {description && (
        <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>
      )}

      {(tags.length > 0 || showCopy) && (
        <div className="mt-auto flex items-end justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
          {showCopy && <CopyButton text={copyText} label={`Copy ${typeName}`} />}
        </div>
      )}
    </div>
  )
}
