'use client'

import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { MoreHorizontal, Pencil, Star, Trash2 } from 'lucide-react'

interface CollectionCardMenuProps {
  isFavorite: boolean
  onEdit: () => void
  onDelete: () => void
  onFavorite: () => void
}

export function CollectionCardMenu({
  isFavorite,
  onEdit,
  onDelete,
  onFavorite,
}: CollectionCardMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: globalThis.MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function stop(e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
  }

  function pick(action: () => void) {
    return (e: MouseEvent) => {
      stop(e)
      setOpen(false)
      action()
    }
  }

  return (
    <div ref={containerRef} className="relative" onClick={stop}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Collection actions"
        onClick={(e) => {
          stop(e)
          setOpen((prev) => !prev)
        }}
        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-md border bg-popover shadow-md"
        >
          <button
            type="button"
            role="menuitem"
            onClick={pick(onEdit)}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-popover-foreground hover:bg-accent"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={pick(onFavorite)}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-popover-foreground hover:bg-accent"
          >
            <Star
              className={
                isFavorite
                  ? 'h-4 w-4 fill-yellow-500 text-yellow-500'
                  : 'h-4 w-4'
              }
            />
            {isFavorite ? 'Unfavorite' : 'Favorite'}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={pick(onDelete)}
            className="flex w-full items-center gap-2 border-t px-3 py-2 text-sm text-destructive hover:bg-accent"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
