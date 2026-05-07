'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import type { UserCollectionOption } from '@/lib/db/collections'

interface CollectionSelectProps {
  collections: UserCollectionOption[]
  value: string[]
  onChange: (ids: string[]) => void
  loading?: boolean
}

export function CollectionSelect({
  collections,
  value,
  onChange,
  loading = false,
}: CollectionSelectProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
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

  const byId = useMemo(() => {
    const map = new Map<string, UserCollectionOption>()
    for (const c of collections) map.set(c.id, c)
    return map
  }, [collections])

  const selected = value.filter((id) => byId.has(id))

  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id))
    } else {
      onChange([...value, id])
    }
  }

  const remove = (id: string) => onChange(value.filter((v) => v !== id))

  const hasNone = !loading && collections.length === 0
  const triggerLabel = loading
    ? 'Loading…'
    : hasNone
      ? 'No collections yet'
      : selected.length === 0
        ? 'Select collections…'
        : `${selected.length} selected`

  return (
    <div ref={containerRef} className="relative">
      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selected.map((id) => {
            const c = byId.get(id)
            if (!c) return null
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-md border border-[hsl(217.2_32.6%_30%)] bg-[hsl(217.2_32.6%_18%)] px-2 py-0.5 text-xs text-foreground"
              >
                {c.name}
                <button
                  type="button"
                  onClick={() => remove(id)}
                  aria-label={`Remove ${c.name}`}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )
          })}
        </div>
      )}

      <button
        type="button"
        onClick={() => !hasNone && !loading && setOpen((p) => !p)}
        disabled={hasNone || loading}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className={selected.length === 0 ? 'text-muted-foreground' : 'text-foreground'}>
          {triggerLabel}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      {open && !hasNone && !loading && (
        <div
          role="listbox"
          aria-multiselectable
          className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-[hsl(217.2_32.6%_30%)] bg-[hsl(217.2_32.6%_15%)] shadow-lg"
        >
          {collections.map((c) => {
            const checked = value.includes(c.id)
            return (
              <button
                key={c.id}
                type="button"
                role="option"
                aria-selected={checked}
                onClick={() => toggle(c.id)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[hsl(217.2_32.6%_20%)]"
              >
                <span
                  aria-hidden
                  className={
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded border ' +
                    (checked
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-[hsl(217.2_32.6%_35%)]')
                  }
                >
                  {checked && <Check className="h-3 w-3" />}
                </span>
                <span className="flex-1 truncate">{c.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {c.itemCount} {c.itemCount === 1 ? 'item' : 'items'}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
