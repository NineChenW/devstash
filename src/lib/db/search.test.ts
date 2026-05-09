import { describe, expect, it } from 'vitest'
import { PREVIEW_MAX, buildPreview } from './search'

describe('buildPreview', () => {
  it('returns null when all sources are null', () => {
    expect(
      buildPreview({ description: null, content: null, url: null, fileName: null }),
    ).toBeNull()
  })

  it('returns null when all sources are empty or whitespace-only', () => {
    expect(
      buildPreview({ description: '   ', content: '', url: null, fileName: null }),
    ).toBeNull()
  })

  it('prefers description over content', () => {
    expect(
      buildPreview({
        description: 'Desc',
        content: 'Content',
        url: null,
        fileName: null,
      }),
    ).toBe('Desc')
  })

  it('falls back to content when description is null', () => {
    expect(
      buildPreview({ description: null, content: 'Content', url: null, fileName: null }),
    ).toBe('Content')
  })

  it('falls back to url when description and content are null', () => {
    expect(
      buildPreview({
        description: null,
        content: null,
        url: 'https://example.com',
        fileName: null,
      }),
    ).toBe('https://example.com')
  })

  it('falls back to fileName when all earlier sources are null', () => {
    expect(
      buildPreview({
        description: null,
        content: null,
        url: null,
        fileName: 'report.pdf',
      }),
    ).toBe('report.pdf')
  })

  it('collapses internal whitespace to single spaces', () => {
    expect(
      buildPreview({
        description: 'Hello   world\n\tnext',
        content: null,
        url: null,
        fileName: null,
      }),
    ).toBe('Hello world next')
  })

  it('truncates with ellipsis past PREVIEW_MAX', () => {
    const long = 'a'.repeat(PREVIEW_MAX + 20)
    const result = buildPreview({
      description: long,
      content: null,
      url: null,
      fileName: null,
    })
    expect(result).toBe(`${'a'.repeat(PREVIEW_MAX)}…`)
    expect(result).toHaveLength(PREVIEW_MAX + 1)
  })

  it('does not truncate when length equals PREVIEW_MAX', () => {
    const exact = 'a'.repeat(PREVIEW_MAX)
    expect(
      buildPreview({ description: exact, content: null, url: null, fileName: null }),
    ).toBe(exact)
  })
})
