'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { FolderOpen, Star } from 'lucide-react'
import type { FavoriteCollection, FavoriteItem } from '@/lib/db/favorites'
import { ItemTrigger } from '@/components/items/ItemTrigger'
import { iconMap, DefaultIcon } from '@/lib/icon-map'
import {
  DEFAULT_FAVORITES_SORT,
  FAVORITES_SORT_OPTIONS,
  sortFavoriteCollections,
  sortFavoriteItems,
  type FavoritesSort,
} from '@/lib/favorites-sort'

const SORT_LABELS: Record<FavoritesSort, string> = {
  date: 'Date',
  name: 'Name',
  type: 'Type',
}

const SELECT_CLASS =
  'h-9 w-32 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

export function FavoritesContent({
  items,
  collections,
}: {
  items: FavoriteItem[]
  collections: FavoriteCollection[]
}) {
  const [sort, setSort] = useState<FavoritesSort>(DEFAULT_FAVORITES_SORT)
  const sortedItems = useMemo(() => sortFavoriteItems(items, sort), [items, sort])
  const sortedCollections = useMemo(
    () => sortFavoriteCollections(collections, sort),
    [collections, sort],
  )

  const isEmpty = items.length === 0 && collections.length === 0

  if (isEmpty) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-center">
        <Star className="h-8 w-8 text-muted-foreground/60" />
        <p className="text-sm text-muted-foreground">No favorites yet.</p>
        <p className="text-xs text-muted-foreground/80">
          Star items and collections to surface them here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <label htmlFor="favorites-sort" className="text-xs text-muted-foreground">
          Sort by
        </label>
        <select
          id="favorites-sort"
          className={SELECT_CLASS}
          value={sort}
          onChange={(e) => setSort(e.target.value as FavoritesSort)}
        >
          {FAVORITES_SORT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {SORT_LABELS[option]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-10 font-mono">
        {sortedItems.length > 0 && (
          <FavoritesSection title="Items" count={sortedItems.length}>
            {sortedItems.map((item) => (
              <ItemTrigger key={item.id} itemId={item.id}>
                <ItemRow item={item} />
              </ItemTrigger>
            ))}
          </FavoritesSection>
        )}

        {sortedCollections.length > 0 && (
          <FavoritesSection title="Collections" count={sortedCollections.length}>
            {sortedCollections.map((collection) => (
              <Link
                key={collection.id}
                href={`/collections/${collection.id}`}
                className="block rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <CollectionRow collection={collection} />
              </Link>
            ))}
          </FavoritesSection>
        )}
      </div>
    </div>
  )
}

function FavoritesSection({
  title,
  count,
  children,
}: {
  title: string
  count: number
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-2 flex items-baseline gap-2 border-b pb-1.5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h2>
        <span className="text-xs text-muted-foreground/70">({count})</span>
      </div>
      <div className="divide-y divide-border/50">{children}</div>
    </section>
  )
}

function ItemRow({ item }: { item: FavoriteItem }) {
  const Icon = iconMap[item.typeIcon] || DefaultIcon
  return (
    <div className="flex items-center gap-3 px-2 py-1.5 transition-colors hover:bg-accent/40">
      <Icon className="h-4 w-4 shrink-0" style={{ color: item.typeColor }} />
      <span className="min-w-0 flex-1 truncate text-sm">{item.title}</span>
      <span
        className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
        style={{ backgroundColor: `${item.typeColor}20`, color: item.typeColor }}
      >
        {item.typeName}
      </span>
      <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
        {formatDate(item.updatedAt)}
      </span>
    </div>
  )
}

function CollectionRow({ collection }: { collection: FavoriteCollection }) {
  return (
    <div className="flex items-center gap-3 px-2 py-1.5 transition-colors hover:bg-accent/40">
      <FolderOpen className="h-4 w-4 shrink-0" style={{ color: collection.dominantColor }} />
      <span className="min-w-0 flex-1 truncate text-sm">{collection.name}</span>
      <span
        className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
        style={{ backgroundColor: `${collection.dominantColor}20`, color: collection.dominantColor }}
      >
        {collection.itemCount} {collection.itemCount === 1 ? 'item' : 'items'}
      </span>
      <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
        {formatDate(collection.updatedAt)}
      </span>
    </div>
  )
}

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
