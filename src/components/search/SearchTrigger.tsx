'use client'

import { Search } from 'lucide-react'
import { useCommandPalette } from './CommandPaletteContext'

export function SearchTrigger() {
  const { open } = useCommandPalette()

  return (
    <button
      type="button"
      onClick={open}
      className="relative flex h-9 w-full max-w-md items-center gap-2 rounded-md border border-input bg-transparent px-3 py-1 text-left text-sm text-muted-foreground transition-colors hover:bg-accent/50 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      aria-label="Open command palette"
    >
      <Search className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate">
        <span className="sm:hidden">Search…</span>
        <span className="hidden sm:inline">Search items and collections…</span>
      </span>
      <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 text-xs text-muted-foreground sm:flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  )
}
