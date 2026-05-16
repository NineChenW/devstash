import { describe, it, expect } from 'vitest'
import {
  MAX_CONTENT_CHARS,
  buildAutoTagInput,
  normalizeTags,
  parseTagResponse,
  truncateContent,
} from './auto-tags'

describe('truncateContent', () => {
  it('returns empty string for null', () => {
    expect(truncateContent(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(truncateContent(undefined)).toBe('')
  })

  it('passes through content shorter than the limit', () => {
    expect(truncateContent('hello world')).toBe('hello world')
  })

  it('truncates content longer than the limit', () => {
    const text = 'a'.repeat(MAX_CONTENT_CHARS + 500)
    const result = truncateContent(text)
    expect(result.length).toBe(MAX_CONTENT_CHARS)
    expect(result.startsWith('a')).toBe(true)
  })

  it('respects a custom max', () => {
    expect(truncateContent('abcdef', 3)).toBe('abc')
  })
})

describe('buildAutoTagInput', () => {
  it('includes the title and content when provided', () => {
    const result = buildAutoTagInput({ title: 'React hook', content: 'useDebounce body' })
    expect(result.input).toContain('Title: React hook')
    expect(result.input).toContain('useDebounce body')
    expect(result.instructions).toContain('JSON')
  })

  it('omits the content block when content is empty', () => {
    const result = buildAutoTagInput({ title: 'Just a title', content: '' })
    expect(result.input).not.toContain('Content:')
  })

  it('truncates content over MAX_CONTENT_CHARS', () => {
    const long = 'x'.repeat(MAX_CONTENT_CHARS + 100)
    const result = buildAutoTagInput({ title: 'x', content: long })
    const contentSegment = result.input.split('Content:\n')[1] ?? ''
    expect(contentSegment.length).toBeLessThanOrEqual(MAX_CONTENT_CHARS + 100)
    expect(contentSegment.startsWith('x'.repeat(10))).toBe(true)
  })

  it('includes the type when provided', () => {
    const result = buildAutoTagInput({ title: 't', content: null, typeName: 'snippet' })
    expect(result.input).toContain('Type: snippet')
  })
})

describe('parseTagResponse', () => {
  it('returns empty array for null', () => {
    expect(parseTagResponse(null)).toEqual([])
  })

  it('returns empty array for empty string', () => {
    expect(parseTagResponse('')).toEqual([])
  })

  it('parses {"tags": [...]} shape', () => {
    expect(parseTagResponse('{"tags":["react","hooks"]}')).toEqual(['react', 'hooks'])
  })

  it('parses bare array shape', () => {
    expect(parseTagResponse('["react","hooks"]')).toEqual(['react', 'hooks'])
  })

  it('strips markdown code fences', () => {
    const raw = '```json\n{"tags":["a","b"]}\n```'
    expect(parseTagResponse(raw)).toEqual(['a', 'b'])
  })

  it('extracts JSON from surrounding prose', () => {
    const raw = 'Sure! Here you go: {"tags":["alpha","beta"]} — good luck.'
    expect(parseTagResponse(raw)).toEqual(['alpha', 'beta'])
  })

  it('returns empty when JSON is malformed', () => {
    expect(parseTagResponse('not json at all')).toEqual([])
  })

  it('drops non-string entries in array', () => {
    expect(parseTagResponse('["one", 2, true, "two"]')).toEqual(['one', 'two'])
  })
})

describe('normalizeTags', () => {
  it('lowercases each tag', () => {
    expect(normalizeTags(['React', 'HOOKS', 'Ui'])).toEqual(['react', 'hooks', 'ui'])
  })

  it('strips leading hash characters', () => {
    expect(normalizeTags(['#react', '##hooks'])).toEqual(['react', 'hooks'])
  })

  it('collapses internal whitespace', () => {
    expect(normalizeTags(['state  management'])).toEqual(['state management'])
  })

  it('trims surrounding whitespace', () => {
    expect(normalizeTags(['  react  '])).toEqual(['react'])
  })

  it('drops empty entries', () => {
    expect(normalizeTags(['', '  ', 'react'])).toEqual(['react'])
  })

  it('dedupes case-insensitively', () => {
    expect(normalizeTags(['React', 'react', 'REACT'])).toEqual(['react'])
  })

  it('caps the result at 5 tags', () => {
    expect(normalizeTags(['a', 'b', 'c', 'd', 'e', 'f', 'g'])).toEqual([
      'a',
      'b',
      'c',
      'd',
      'e',
    ])
  })

  it('rejects tags longer than 32 chars', () => {
    const tooLong = 'a'.repeat(33)
    expect(normalizeTags([tooLong, 'react'])).toEqual(['react'])
  })

  it('ignores non-string entries defensively', () => {
    // @ts-expect-error testing runtime defensiveness
    expect(normalizeTags(['react', 42, null, 'hooks'])).toEqual(['react', 'hooks'])
  })
})
