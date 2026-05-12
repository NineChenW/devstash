import { describe, it, expect } from 'vitest'
import type { FavoriteCollection, FavoriteItem } from '@/lib/db/favorites'
import {
  DEFAULT_FAVORITES_SORT,
  sortFavoriteCollections,
  sortFavoriteItems,
} from '@/lib/favorites-sort'

function makeItem(overrides: Partial<FavoriteItem>): FavoriteItem {
  return {
    id: overrides.id ?? 'i',
    title: overrides.title ?? 'Item',
    typeName: overrides.typeName ?? 'snippet',
    typeIcon: overrides.typeIcon ?? 'Code',
    typeColor: overrides.typeColor ?? '#3b82f6',
    updatedAt: overrides.updatedAt ?? new Date('2026-01-01T00:00:00Z'),
  }
}

function makeCollection(overrides: Partial<FavoriteCollection>): FavoriteCollection {
  return {
    id: overrides.id ?? 'c',
    name: overrides.name ?? 'Collection',
    itemCount: overrides.itemCount ?? 0,
    dominantColor: overrides.dominantColor ?? '#10b981',
    dominantTypeName: overrides.dominantTypeName ?? '',
    updatedAt: overrides.updatedAt ?? new Date('2026-01-01T00:00:00Z'),
  }
}

describe('DEFAULT_FAVORITES_SORT', () => {
  it('defaults to date', () => {
    expect(DEFAULT_FAVORITES_SORT).toBe('date')
  })
})

describe('sortFavoriteItems', () => {
  const a = makeItem({
    id: 'a',
    title: 'Beta',
    typeName: 'snippet',
    updatedAt: new Date('2026-01-01'),
  })
  const b = makeItem({
    id: 'b',
    title: 'Alpha',
    typeName: 'prompt',
    updatedAt: new Date('2026-03-01'),
  })
  const c = makeItem({
    id: 'c',
    title: 'Gamma',
    typeName: 'snippet',
    updatedAt: new Date('2026-02-01'),
  })

  it('sorts by name alphabetically', () => {
    expect(sortFavoriteItems([a, b, c], 'name').map((i) => i.id)).toEqual(['b', 'a', 'c'])
  })

  it('sorts by date with most recent first', () => {
    expect(sortFavoriteItems([a, b, c], 'date').map((i) => i.id)).toEqual(['b', 'c', 'a'])
  })

  it('sorts by type alphabetically, with date desc as tiebreaker', () => {
    // typeName: prompt < snippet; within snippet, c (Feb) is more recent than a (Jan)
    expect(sortFavoriteItems([a, b, c], 'type').map((i) => i.id)).toEqual(['b', 'c', 'a'])
  })

  it('returns a new array (does not mutate input)', () => {
    const input = [a, b, c]
    const result = sortFavoriteItems(input, 'name')
    expect(result).not.toBe(input)
    expect(input.map((i) => i.id)).toEqual(['a', 'b', 'c'])
  })

  it('handles an empty array', () => {
    expect(sortFavoriteItems([], 'name')).toEqual([])
    expect(sortFavoriteItems([], 'date')).toEqual([])
    expect(sortFavoriteItems([], 'type')).toEqual([])
  })

  it('handles a single item', () => {
    expect(sortFavoriteItems([a], 'name')).toEqual([a])
    expect(sortFavoriteItems([a], 'type')).toEqual([a])
  })
})

describe('sortFavoriteCollections', () => {
  const a = makeCollection({
    id: 'a',
    name: 'Beta',
    dominantTypeName: 'snippet',
    updatedAt: new Date('2026-01-01'),
  })
  const b = makeCollection({
    id: 'b',
    name: 'Alpha',
    dominantTypeName: 'prompt',
    updatedAt: new Date('2026-03-01'),
  })
  const c = makeCollection({
    id: 'c',
    name: 'Gamma',
    dominantTypeName: 'snippet',
    updatedAt: new Date('2026-02-01'),
  })

  it('sorts by name alphabetically', () => {
    expect(sortFavoriteCollections([a, b, c], 'name').map((c) => c.id)).toEqual(['b', 'a', 'c'])
  })

  it('sorts by date with most recent first', () => {
    expect(sortFavoriteCollections([a, b, c], 'date').map((c) => c.id)).toEqual(['b', 'c', 'a'])
  })

  it('sorts by dominant type name alphabetically, with date desc as tiebreaker', () => {
    // dominantTypeName: prompt < snippet; within snippet, c (Feb) more recent than a (Jan)
    expect(sortFavoriteCollections([a, b, c], 'type').map((c) => c.id)).toEqual(['b', 'c', 'a'])
  })

  it('returns a new array (does not mutate input)', () => {
    const input = [a, b, c]
    const result = sortFavoriteCollections(input, 'name')
    expect(result).not.toBe(input)
    expect(input.map((c) => c.id)).toEqual(['a', 'b', 'c'])
  })

  it('handles an empty array', () => {
    expect(sortFavoriteCollections([], 'name')).toEqual([])
    expect(sortFavoriteCollections([], 'date')).toEqual([])
    expect(sortFavoriteCollections([], 'type')).toEqual([])
  })

  it('places empty dominantTypeName at the start under type sort', () => {
    const empty = makeCollection({ id: 'empty', name: 'Empty', dominantTypeName: '' })
    const withType = makeCollection({
      id: 'with',
      name: 'With',
      dominantTypeName: 'snippet',
    })
    expect(
      sortFavoriteCollections([withType, empty], 'type').map((c) => c.id),
    ).toEqual(['empty', 'with'])
  })
})
