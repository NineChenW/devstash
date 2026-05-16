import { describe, expect, it } from 'vitest'
import { appendTagToInput, firstFieldError, parseTagsInput } from './item-utils'

describe('parseTagsInput', () => {
  it('splits, trims, and drops empty entries', () => {
    expect(parseTagsInput('react, hooks ,  state ')).toEqual(['react', 'hooks', 'state'])
  })

  it('returns an empty array for empty input', () => {
    expect(parseTagsInput('')).toEqual([])
    expect(parseTagsInput('   ')).toEqual([])
    expect(parseTagsInput(',,,')).toEqual([])
  })

  it('keeps order including duplicates (server dedups)', () => {
    expect(parseTagsInput('a, a, b')).toEqual(['a', 'a', 'b'])
  })
})

describe('firstFieldError', () => {
  it('returns the first matching key in order', () => {
    const errors = {
      title: ['Title is required'],
      url: ['Invalid URL'],
    }
    expect(firstFieldError(errors, 'url', 'title')).toBe('Invalid URL')
    expect(firstFieldError(errors, 'title', 'url')).toBe('Title is required')
  })

  it('falls through to the next key when the first is missing', () => {
    const errors = { title: ['Title is required'] }
    expect(firstFieldError(errors, 'url', 'title')).toBe('Title is required')
  })

  it('returns undefined when no key matches', () => {
    expect(firstFieldError({}, 'title')).toBeUndefined()
    expect(firstFieldError(undefined, 'title')).toBeUndefined()
    expect(firstFieldError({ other: ['nope'] }, 'title')).toBeUndefined()
  })

  it('skips empty arrays', () => {
    const errors = { title: [] as string[], url: ['Bad URL'] }
    expect(firstFieldError(errors, 'title', 'url')).toBe('Bad URL')
  })
})

describe('appendTagToInput', () => {
  it('returns the input unchanged when tag is empty or whitespace', () => {
    expect(appendTagToInput('react', '')).toBe('react')
    expect(appendTagToInput('react', '   ')).toBe('react')
  })

  it('sets the tag as the only entry for empty / whitespace-only input', () => {
    expect(appendTagToInput('', 'react')).toBe('react')
    expect(appendTagToInput('   ', 'react')).toBe('react')
  })

  it('appends with ", " when input already has tags', () => {
    expect(appendTagToInput('react', 'hooks')).toBe('react, hooks')
    expect(appendTagToInput('react, hooks', 'state')).toBe('react, hooks, state')
  })

  it('handles input ending in a trailing comma', () => {
    expect(appendTagToInput('react,', 'hooks')).toBe('react, hooks')
  })

  it('handles input ending in trailing whitespace', () => {
    expect(appendTagToInput('react ', 'hooks')).toBe('react hooks')
  })

  it('dedupes case-insensitively', () => {
    expect(appendTagToInput('React, hooks', 'react')).toBe('React, hooks')
    expect(appendTagToInput('react, HOOKS', 'hooks')).toBe('react, HOOKS')
  })

  it('trims the tag before appending', () => {
    expect(appendTagToInput('react', '  hooks  ')).toBe('react, hooks')
  })
})
