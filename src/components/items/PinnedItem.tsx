import { Star, Pin } from 'lucide-react'
import { iconMap, DefaultIcon } from '@/lib/icon-map'
import { CopyButton } from './CopyButton'

interface PinnedItemProps {
  id: string
  title: string
  description: string | null
  typeIcon: string
  typeColor: string
  typeName: string
  isFavorite: boolean
  content: string | null
  url: string | null
  tags: string[]
  createdAt: Date
}

export function PinnedItem({
  title,
  description,
  typeIcon,
  typeColor,
  typeName,
  isFavorite,
  content,
  url,
  tags,
  createdAt,
}: PinnedItemProps) {
  const Icon = iconMap[typeIcon] || DefaultIcon
  const date = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  const copyText = (content ?? url ?? '').trim()
  const showCopy = copyText.length > 0

  return (
    <div
      className="flex items-start gap-4 rounded-xl border bg-card p-4 transition-colors hover:bg-accent/50"
      style={{ borderLeftColor: typeColor, borderLeftWidth: '2px' }}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${typeColor}20` }}
      >
        <Icon className="h-5 w-5" style={{ color: typeColor }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium">{title}</h4>
          <Pin className="h-3.5 w-3.5 text-muted-foreground" />
          {isFavorite && (
            <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
          )}
          <span
            className="rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
            style={{ backgroundColor: `${typeColor}20`, color: typeColor }}
          >
            {typeName}
          </span>
        </div>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
        {tags.length > 0 && (
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
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {showCopy && <CopyButton text={copyText} label={`Copy ${typeName}`} />}
        <span className="text-xs text-muted-foreground">{date}</span>
      </div>
    </div>
  )
}
