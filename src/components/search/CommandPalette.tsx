'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import { FolderOpen, Search } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useItemDrawer } from '@/components/items/ItemDrawerContext'
import { iconMap, DefaultIcon } from '@/lib/icon-map'
import { fetchSearchData } from '@/actions/search'
import type { SearchData } from '@/lib/db/search'
import { searchFilter } from '@/lib/search-filter'

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter()
  const { openItem } = useItemDrawer()
  const [query, setQuery] = useState('')
  const [data, setData] = useState<SearchData>({ items: [], collections: [] })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    void fetchSearchData()
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((err) => {
        console.error('fetchSearchData failed', err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open])

  const handleSelectItem = (id: string) => {
    onClose()
    openItem(id)
  }

  const handleSelectCollection = (id: string) => {
    onClose()
    router.push(`/collections/${id}`)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-xl gap-0 overflow-hidden border-[hsl(217.2_32.6%_25%)] bg-[hsl(217.2_32.6%_12%)] p-0"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Global search</DialogTitle>
        <Command
          label="Global search"
          className="flex flex-col"
          loop
          filter={searchFilter}
        >
          <div className="flex items-center gap-2 border-b border-[hsl(217.2_32.6%_22%)] px-4">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search items and collections…"
              className="flex h-12 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 text-xs text-muted-foreground sm:flex">
              Esc
            </kbd>
          </div>

          <Command.List className="max-h-[60vh] overflow-y-auto p-2">
            {loading && data.items.length === 0 && data.collections.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                Loading…
              </div>
            ) : (
              <>
                <Command.Empty className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No results found.
                </Command.Empty>

                {data.items.length > 0 && (
                  <Command.Group
                    heading="Items"
                    className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-muted-foreground"
                  >
                    {data.items.map((item) => {
                      const Icon = iconMap[item.typeIcon] ?? DefaultIcon
                      return (
                        <Command.Item
                          key={item.id}
                          value={item.id}
                          keywords={[
                            item.title,
                            item.typeName,
                            item.contentPreview ?? '',
                          ]}
                          onSelect={() => handleSelectItem(item.id)}
                          className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                        >
                          <span
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                            style={{ backgroundColor: `${item.typeColor}20` }}
                          >
                            <Icon className="h-4 w-4" style={{ color: item.typeColor }} />
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate font-medium">{item.title}</span>
                            {item.contentPreview && (
                              <span className="truncate text-xs text-muted-foreground">
                                {item.contentPreview}
                              </span>
                            )}
                          </span>
                          <span className="ml-2 shrink-0 text-xs uppercase tracking-wide text-muted-foreground">
                            {item.typeName}
                          </span>
                        </Command.Item>
                      )
                    })}
                  </Command.Group>
                )}

                {data.collections.length > 0 && (
                  <Command.Group
                    heading="Collections"
                    className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-muted-foreground"
                  >
                    {data.collections.map((collection) => (
                      <Command.Item
                        key={collection.id}
                        value={collection.id}
                        keywords={[collection.name]}
                        onSelect={() => handleSelectCollection(collection.id)}
                        className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/20">
                          <FolderOpen className="h-4 w-4 text-emerald-500" />
                        </span>
                        <span className="min-w-0 flex-1 truncate font-medium">
                          {collection.name}
                        </span>
                        <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                          {collection.itemCount}{' '}
                          {collection.itemCount === 1 ? 'item' : 'items'}
                        </span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}
              </>
            )}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
