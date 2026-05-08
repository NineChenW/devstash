import { describe, expect, it } from 'vitest'
import { createCollectionSchema, updateCollectionSchema } from './collections'

describe('createCollectionSchema', () => {
  const base = {
    name: 'React Patterns',
    description: null,
  }

  it('accepts a minimal valid payload', () => {
    const result = createCollectionSchema.safeParse(base)
    expect(result.success).toBe(true)
  })

  it('accepts a payload with description', () => {
    const result = createCollectionSchema.safeParse({
      ...base,
      description: 'Reusable hooks and components',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.description).toBe('Reusable hooks and components')
    }
  })

  it('trims the name before validating length', () => {
    const result = createCollectionSchema.safeParse({ ...base, name: '  Padded  ' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Padded')
    }
  })

  it('trims the description', () => {
    const result = createCollectionSchema.safeParse({
      ...base,
      description: '  surrounded by spaces  ',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.description).toBe('surrounded by spaces')
    }
  })

  it('rejects an empty name', () => {
    const result = createCollectionSchema.safeParse({ ...base, name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects a name that is only whitespace', () => {
    const result = createCollectionSchema.safeParse({ ...base, name: '   ' })
    expect(result.success).toBe(false)
  })

  it('rejects a name longer than 80 characters', () => {
    const result = createCollectionSchema.safeParse({ ...base, name: 'a'.repeat(81) })
    expect(result.success).toBe(false)
  })

  it('accepts a name exactly 80 characters', () => {
    const result = createCollectionSchema.safeParse({ ...base, name: 'a'.repeat(80) })
    expect(result.success).toBe(true)
  })

  it('rejects a description longer than 500 characters', () => {
    const result = createCollectionSchema.safeParse({ ...base, description: 'a'.repeat(501) })
    expect(result.success).toBe(false)
  })

  it('accepts null description', () => {
    const result = createCollectionSchema.safeParse({ ...base, description: null })
    expect(result.success).toBe(true)
  })

  it('accepts omitted description', () => {
    const result = createCollectionSchema.safeParse({ name: 'Standalone' })
    expect(result.success).toBe(true)
  })
})

describe('updateCollectionSchema', () => {
  const base = {
    name: 'React Patterns',
    description: null,
  }

  it('accepts a minimal valid payload', () => {
    const result = updateCollectionSchema.safeParse(base)
    expect(result.success).toBe(true)
  })

  it('accepts a payload with description', () => {
    const result = updateCollectionSchema.safeParse({
      ...base,
      description: 'Reusable hooks and components',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.description).toBe('Reusable hooks and components')
    }
  })

  it('trims the name', () => {
    const result = updateCollectionSchema.safeParse({ ...base, name: '  Padded  ' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Padded')
    }
  })

  it('trims the description', () => {
    const result = updateCollectionSchema.safeParse({
      ...base,
      description: '  surrounded by spaces  ',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.description).toBe('surrounded by spaces')
    }
  })

  it('rejects an empty name', () => {
    const result = updateCollectionSchema.safeParse({ ...base, name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects a whitespace-only name', () => {
    const result = updateCollectionSchema.safeParse({ ...base, name: '   ' })
    expect(result.success).toBe(false)
  })

  it('rejects a name longer than 80 characters', () => {
    const result = updateCollectionSchema.safeParse({ ...base, name: 'a'.repeat(81) })
    expect(result.success).toBe(false)
  })

  it('accepts a name exactly 80 characters', () => {
    const result = updateCollectionSchema.safeParse({ ...base, name: 'a'.repeat(80) })
    expect(result.success).toBe(true)
  })

  it('rejects a description longer than 500 characters', () => {
    const result = updateCollectionSchema.safeParse({ ...base, description: 'a'.repeat(501) })
    expect(result.success).toBe(false)
  })

  it('accepts null description', () => {
    const result = updateCollectionSchema.safeParse({ ...base, description: null })
    expect(result.success).toBe(true)
  })

  it('accepts omitted description', () => {
    const result = updateCollectionSchema.safeParse({ name: 'Standalone' })
    expect(result.success).toBe(true)
  })
})
