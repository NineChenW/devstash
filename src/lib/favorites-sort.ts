import type { FavoriteCollection, FavoriteItem } from '@/lib/db/favorites'

export const FAVORITES_SORT_OPTIONS = ['date', 'name', 'type'] as const
export type FavoritesSort = (typeof FAVORITES_SORT_OPTIONS)[number]

export const DEFAULT_FAVORITES_SORT: FavoritesSort = 'date'

export function sortFavoriteItems(items: FavoriteItem[], sort: FavoritesSort): FavoriteItem[] {
  const copy = items.slice()
  switch (sort) {
    case 'name':
      return copy.sort((a, b) => a.title.localeCompare(b.title))
    case 'type':
      return copy.sort(
        (a, b) =>
          a.typeName.localeCompare(b.typeName) ||
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
    case 'date':
    default:
      return copy.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
  }
}

export function sortFavoriteCollections(
  collections: FavoriteCollection[],
  sort: FavoritesSort,
): FavoriteCollection[] {
  const copy = collections.slice()
  switch (sort) {
    case 'name':
      return copy.sort((a, b) => a.name.localeCompare(b.name))
    case 'type':
      return copy.sort(
        (a, b) =>
          a.dominantTypeName.localeCompare(b.dominantTypeName) ||
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
    case 'date':
    default:
      return copy.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
  }
}
