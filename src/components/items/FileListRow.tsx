'use client'

import {
  Download,
  File as FileIcon,
  FileCode,
  FileSpreadsheet,
  FileText,
  Pin,
  Star,
  type LucideIcon,
} from 'lucide-react'
import { formatBytes, getExtension } from '@/lib/file-constraints'
import { useItemDrawer } from './ItemDrawerContext'

const EXTENSION_ICONS: Record<string, LucideIcon> = {
  '.pdf': FileText,
  '.txt': FileText,
  '.md': FileText,
  '.json': FileCode,
  '.yaml': FileCode,
  '.yml': FileCode,
  '.xml': FileCode,
  '.toml': FileCode,
  '.ini': FileCode,
  '.csv': FileSpreadsheet,
}

interface FileListRowProps {
  id: string
  title: string
  fileUrl: string | null
  fileName: string | null
  fileSize: number | null
  isFavorite: boolean
  isPinned: boolean
  createdAt: Date
}

export function FileListRow({
  id,
  title,
  fileUrl,
  fileName,
  fileSize,
  isFavorite,
  isPinned,
  createdAt,
}: FileListRowProps) {
  const { openItem } = useItemDrawer()
  const ext = fileName ? getExtension(fileName) : ''
  const Icon = EXTENSION_ICONS[ext] || FileIcon
  const date = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const size = fileSize !== null ? formatBytes(fileSize) : null
  const displayName = fileName || title

  const handleOpen = () => openItem(id)
  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      openItem(id)
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={handleKey}
      className="flex cursor-pointer items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{displayName}</p>
          {isPinned && <Pin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
          {isFavorite && (
            <Star className="h-3.5 w-3.5 shrink-0 fill-yellow-500 text-yellow-500" />
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground sm:hidden">
          {size ? `${size} · ${date}` : date}
        </p>
      </div>

      {size && (
        <p className="hidden w-20 shrink-0 text-right text-sm text-muted-foreground sm:block">
          {size}
        </p>
      )}
      <p className="hidden w-28 shrink-0 text-right text-sm text-muted-foreground sm:block">
        {date}
      </p>

      {fileUrl ? (
        <a
          href={`${fileUrl}?download=1`}
          download={fileName ?? undefined}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          aria-label={`Download ${displayName}`}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Download className="h-4 w-4" />
        </a>
      ) : (
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center text-muted-foreground/50">
          <Download className="h-4 w-4" />
        </span>
      )}
    </div>
  )
}
