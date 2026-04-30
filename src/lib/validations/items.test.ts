import { describe, expect, it } from 'vitest'
import { updateItemSchema } from './items'

describe('updateItemSchema', () => {
  const base = {
    title: 'My Item',
    description: null,
    content: null,
    url: null,
    language: null,
    tags: [] as string[],
  }

  it('accepts a minimal valid payload', () => {
    const result = updateItemSchema.safeParse(base)
    expect(result.success).toBe(true)
  })

  it('trims the title before validating length', () => {
    const result = updateItemSchema.safeParse({ ...base, title: '  Padded  ' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('Padded')
    }
  })

  it('rejects an empty title', () => {
    const result = updateItemSchema.safeParse({ ...base, title: '' })
    expect(result.success).toBe(false)
  })

  it('rejects a title that is only whitespace', () => {
    const result = updateItemSchema.safeParse({ ...base, title: '   ' })
    expect(result.success).toBe(false)
  })

  it('accepts a valid url', () => {
    const result = updateItemSchema.safeParse({ ...base, url: 'https://example.com' })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid url', () => {
    const result = updateItemSchema.safeParse({ ...base, url: 'not-a-url' })
    expect(result.success).toBe(false)
  })

  it('accepts null url', () => {
    const result = updateItemSchema.safeParse({ ...base, url: null })
    expect(result.success).toBe(true)
  })

  it('accepts a tags array', () => {
    const result = updateItemSchema.safeParse({ ...base, tags: ['react', 'hooks'] })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.tags).toEqual(['react', 'hooks'])
    }
  })

  it('trims tag entries', () => {
    const result = updateItemSchema.safeParse({ ...base, tags: ['  react  ', 'hooks'] })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.tags).toEqual(['react', 'hooks'])
    }
  })

  it('rejects tag arrays with empty strings after trim', () => {
    const result = updateItemSchema.safeParse({ ...base, tags: ['react', '   '] })
    expect(result.success).toBe(false)
  })
})
