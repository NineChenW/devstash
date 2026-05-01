import { describe, expect, it } from 'vitest'
import { createItemSchema, updateItemSchema } from './items'

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

describe('createItemSchema', () => {
  const baseSnippet = {
    typeName: 'snippet' as const,
    title: 'My Snippet',
    description: null,
    content: null,
    url: null,
    language: null,
    tags: [] as string[],
  }

  const baseLink = {
    typeName: 'link' as const,
    title: 'My Link',
    description: null,
    content: null,
    url: 'https://example.com',
    language: null,
    tags: [] as string[],
  }

  it('accepts a minimal valid snippet payload', () => {
    const result = createItemSchema.safeParse(baseSnippet)
    expect(result.success).toBe(true)
  })

  it('accepts a valid link payload with url', () => {
    const result = createItemSchema.safeParse(baseLink)
    expect(result.success).toBe(true)
  })

  it('rejects a link payload without url', () => {
    const result = createItemSchema.safeParse({ ...baseLink, url: null })
    expect(result.success).toBe(false)
    if (!result.success) {
      const urlIssue = result.error.issues.find((i) => i.path[0] === 'url')
      expect(urlIssue).toBeDefined()
    }
  })

  it('rejects an invalid url for link', () => {
    const result = createItemSchema.safeParse({ ...baseLink, url: 'not-a-url' })
    expect(result.success).toBe(false)
  })

  it('rejects an unknown type', () => {
    const result = createItemSchema.safeParse({ ...baseSnippet, typeName: 'file' })
    expect(result.success).toBe(false)
  })

  it('rejects an empty title', () => {
    const result = createItemSchema.safeParse({ ...baseSnippet, title: '' })
    expect(result.success).toBe(false)
  })

  it('trims the title', () => {
    const result = createItemSchema.safeParse({ ...baseSnippet, title: '  Padded  ' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('Padded')
    }
  })

  it('trims tag entries', () => {
    const result = createItemSchema.safeParse({
      ...baseSnippet,
      tags: ['  react  ', 'hooks'],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.tags).toEqual(['react', 'hooks'])
    }
  })

  it('allows note and prompt with no url', () => {
    const note = createItemSchema.safeParse({ ...baseSnippet, typeName: 'note' })
    const prompt = createItemSchema.safeParse({ ...baseSnippet, typeName: 'prompt' })
    expect(note.success).toBe(true)
    expect(prompt.success).toBe(true)
  })
})
