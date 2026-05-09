import { describe, expect, it } from 'vitest'
import { searchFilter } from './search-filter'

describe('searchFilter', () => {
  it('returns 1 for empty search (no filtering)', () => {
    expect(searchFilter('id', '', ['Hello world'])).toBe(1)
    expect(searchFilter('id', '   ', ['Hello world'])).toBe(1)
  })

  it('returns 0 when search has no substring match in any keyword', () => {
    expect(searchFilter('id', 'test', ['React Hooks', 'snippet', 'A useful tip'])).toBe(0)
  })

  it('returns 0 for fuzzy subsequence (rejects cmdk default behavior)', () => {
    // "test" letters t-e-s-t appear as subsequence but not as substring
    expect(searchFilter('id', 'test', ['the slowest cat', 'note', ''])).toBe(0)
  })

  it('returns 2 when query is a substring of the first keyword (title)', () => {
    expect(searchFilter('id', 'react', ['React Hooks', 'snippet', 'preview'])).toBe(2)
  })

  it('returns 1 when query matches a non-title keyword only', () => {
    expect(
      searchFilter('id', 'preview', ['React Hooks', 'snippet', 'a long preview text']),
    ).toBe(1)
  })

  it('is case-insensitive on both query and keywords', () => {
    expect(searchFilter('id', 'REACT', ['react hooks', 'snippet'])).toBe(2)
    expect(searchFilter('id', 'react', ['REACT HOOKS', 'snippet'])).toBe(2)
  })

  it('requires every whitespace-separated token to appear (AND semantics)', () => {
    expect(searchFilter('id', 'react hooks', ['React Hooks', 'snippet', ''])).toBe(2)
    // Both tokens present but split across keywords — still matches haystack overall
    expect(searchFilter('id', 'react snippet', ['React Hooks', 'snippet', ''])).toBe(1)
    // Missing token
    expect(searchFilter('id', 'react missing', ['React Hooks', 'snippet', ''])).toBe(0)
  })

  it('handles missing/empty keywords array', () => {
    expect(searchFilter('id', 'anything', undefined)).toBe(0)
    expect(searchFilter('id', 'anything', [])).toBe(0)
    expect(searchFilter('id', '', undefined)).toBe(1)
  })
})
