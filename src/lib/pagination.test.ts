import { describe, expect, it } from 'vitest'
import {
  buildPageHref,
  parsePageParam,
  totalPages,
  paginationWindow,
} from './pagination'

describe('parsePageParam', () => {
  it('returns 1 when missing or empty', () => {
    expect(parsePageParam(undefined)).toBe(1)
    expect(parsePageParam('')).toBe(1)
  })

  it('parses positive integers', () => {
    expect(parsePageParam('3')).toBe(3)
    expect(parsePageParam('100')).toBe(100)
  })

  it('returns 1 for non-numeric, zero, or negative input', () => {
    expect(parsePageParam('abc')).toBe(1)
    expect(parsePageParam('0')).toBe(1)
    expect(parsePageParam('-5')).toBe(1)
  })

  it('takes the first element when given an array', () => {
    expect(parsePageParam(['4', '7'])).toBe(4)
    expect(parsePageParam([])).toBe(1)
  })
})

describe('totalPages', () => {
  it('returns 1 when total is 0 or negative (always at least 1 page)', () => {
    expect(totalPages(0, 21)).toBe(1)
    expect(totalPages(-3, 21)).toBe(1)
  })

  it('rounds up partial pages', () => {
    expect(totalPages(1, 21)).toBe(1)
    expect(totalPages(21, 21)).toBe(1)
    expect(totalPages(22, 21)).toBe(2)
    expect(totalPages(63, 21)).toBe(3)
    expect(totalPages(64, 21)).toBe(4)
  })
})

describe('paginationWindow', () => {
  it('returns [1] when total is 0 or 1', () => {
    expect(paginationWindow(1, 0)).toEqual([1])
    expect(paginationWindow(1, 1)).toEqual([1])
  })

  it('returns all pages when small (no ellipses)', () => {
    expect(paginationWindow(1, 3)).toEqual([1, 2, 3])
    expect(paginationWindow(2, 5)).toEqual([1, 2, 3, 4, 5])
    expect(paginationWindow(3, 5)).toEqual([1, 2, 3, 4, 5])
  })

  it('shows right ellipsis when current is near the start', () => {
    expect(paginationWindow(1, 12)).toEqual([1, 2, 'ellipsis', 12])
    expect(paginationWindow(2, 12)).toEqual([1, 2, 3, 'ellipsis', 12])
  })

  it('shows left ellipsis when current is near the end', () => {
    expect(paginationWindow(12, 12)).toEqual([1, 'ellipsis', 11, 12])
    expect(paginationWindow(11, 12)).toEqual([1, 'ellipsis', 10, 11, 12])
  })

  it('inlines a single hidden page instead of an ellipsis', () => {
    // total=5, current=2 → would have hidden only page 4; show it directly
    expect(paginationWindow(2, 5)).toEqual([1, 2, 3, 4, 5])
  })

  it('clamps out-of-range current to valid bounds', () => {
    // current=0 clamps to 1 → window centered on page 1
    expect(paginationWindow(0, 3)).toEqual([1, 2, 3])
    // current=99 clamps to total=3 → window centered on page 3
    expect(paginationWindow(99, 3)).toEqual([1, 2, 3])
  })

  it('shows both ellipses when current is in the middle', () => {
    expect(paginationWindow(6, 12)).toEqual([1, 'ellipsis', 5, 6, 7, 'ellipsis', 12])
  })

  it('respects custom siblings parameter', () => {
    expect(paginationWindow(6, 12, 2)).toEqual([
      1,
      'ellipsis',
      4,
      5,
      6,
      7,
      8,
      'ellipsis',
      12,
    ])
  })
})

describe('buildPageHref', () => {
  it('strips ?page when page <= 1', () => {
    expect(buildPageHref('/items/snippets', 1)).toBe('/items/snippets')
    expect(buildPageHref('/items/snippets', 0)).toBe('/items/snippets')
  })

  it('appends ?page=N for pages > 1', () => {
    expect(buildPageHref('/items/snippets', 2)).toBe('/items/snippets?page=2')
    expect(buildPageHref('/collections', 7)).toBe('/collections?page=7')
  })

  it('removes a stale page param when page <= 1', () => {
    expect(buildPageHref('/items/snippets?page=5', 1)).toBe('/items/snippets')
  })

  it('overwrites an existing page param', () => {
    expect(buildPageHref('/items/snippets?page=3', 7)).toBe('/items/snippets?page=7')
  })

  it('preserves other query params on basePath', () => {
    expect(buildPageHref('/items/snippets?q=foo', 2)).toBe(
      '/items/snippets?q=foo&page=2',
    )
    expect(buildPageHref('/items/snippets?q=foo&page=4', 1)).toBe(
      '/items/snippets?q=foo',
    )
  })
})
