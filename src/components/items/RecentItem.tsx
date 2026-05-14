import { iconMap, DefaultIcon } from '@/lib/icon-map'
import { CopyButton } from './CopyButton'

interface RecentItemProps {
  id: string
  title: string
  description: string | null
  typeIcon: string
  typeColor: string
  typeName: string
  content: string | null
  url: string | null
  createdAt: Date
}

export function RecentItem({
  title,
  description,
  typeIcon,
  typeColor,
  typeName,
  content,
  url,
  createdAt,
}: RecentItemProps) {
  const Icon = iconMap[typeIcon] || DefaultIcon
  const date = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  const copyText = (content ?? url ?? '').trim()
  const showCopy = copyText.length > 0

  return (
    <div
      className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-colors hover:bg-accent/50"
      style={{ borderLeftColor: typeColor, borderLeftWidth: '2px' }}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${typeColor}20` }}
      >
        <Icon className="h-4 w-4" style={{ color: typeColor }} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium" title={title}>{title}</p>
          <span
            className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
            style={{ backgroundColor: `${typeColor}20`, color: typeColor }}
          >
            {typeName}
          </span>
        </div>
        {description && (
          <p className="truncate text-xs text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {showCopy && <CopyButton text={copyText} label={`Copy ${typeName}`} />}
        <span className="text-xs text-muted-foreground">{date}</span>
      </div>
    </div>
  )
}
