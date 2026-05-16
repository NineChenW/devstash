import { describe, it, expect } from 'vitest'
import {
  MAX_DESCRIPTION_CHARS,
  buildAutoDescriptionInput,
  parseDescriptionResponse,
} from './auto-description'
import { MAX_CONTENT_CHARS } from './auto-tags'

describe('buildAutoDescriptionInput', () => {
  it('includes the title and a JSON-shaped instructions block', () => {
    const r = buildAutoDescriptionInput({ title: 'My snippet' })
    expect(r.input).toContain('Title: My snippet')
    expect(r.instructions).toContain('"description"')
    expect(r.instructions).toContain('JSON')
  })

  it('includes typeName when provided', () => {
    const r = buildAutoDescriptionInput({ title: 't', typeName: 'snippet' })
    expect(r.input).toContain('Type: snippet')
  })

  it('omits typeName section when null or undefined', () => {
    expect(buildAutoDescriptionInput({ title: 't', typeName: null }).input).not.toContain('Type:')
    expect(buildAutoDescriptionInput({ title: 't' }).input).not.toContain('Type:')
  })

  it('includes URL for link items', () => {
    const r = buildAutoDescriptionInput({ title: 't', url: 'https://example.com' })
    expect(r.input).toContain('URL: https://example.com')
  })

  it('includes fileName for file/image items', () => {
    const r = buildAutoDescriptionInput({ title: 't', fileName: 'resume.pdf' })
    expect(r.input).toContain('File name: resume.pdf')
  })

  it('includes content when provided', () => {
    const r = buildAutoDescriptionInput({ title: 't', content: 'function foo() {}' })
    expect(r.input).toContain('Content:\nfunction foo() {}')
  })

  it('truncates content over MAX_CONTENT_CHARS', () => {
    const long = 'x'.repeat(MAX_CONTENT_CHARS + 500)
    const r = buildAutoDescriptionInput({ title: 't', content: long })
    const match = r.input.match(/Content:\n(x+)/)
    expect(match).not.toBeNull()
    expect(match![1].length).toBe(MAX_CONTENT_CHARS)
  })

  it('omits the content section when content is empty/null/undefined', () => {
    expect(buildAutoDescriptionInput({ title: 't', content: '' }).input).not.toContain('Content:')
    expect(buildAutoDescriptionInput({ title: 't', content: null }).input).not.toContain('Content:')
    expect(buildAutoDescriptionInput({ title: 't' }).input).not.toContain('Content:')
  })

  it('combines all fields in the same input when all are provided', () => {
    const r = buildAutoDescriptionInput({
      title: 'A',
      typeName: 'link',
      url: 'https://x.com',
      fileName: 'thing.pdf',
      content: 'body',
    })
    expect(r.input).toContain('Title: A')
    expect(r.input).toContain('Type: link')
    expect(r.input).toContain('URL: https://x.com')
    expect(r.input).toContain('File name: thing.pdf')
    expect(r.input).toContain('Content:\nbody')
  })
})

describe('parseDescriptionResponse', () => {
  it('returns empty string for null', () => {
    expect(parseDescriptionResponse(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(parseDescriptionResponse(undefined)).toBe('')
  })

  it('returns empty string for empty or whitespace input', () => {
    expect(parseDescriptionResponse('')).toBe('')
    expect(parseDescriptionResponse('   ')).toBe('')
  })

  it('parses {"description": "..."} shape', () => {
    expect(parseDescriptionResponse('{"description":"A simple snippet."}')).toBe('A simple snippet.')
  })

  it('strips markdown code fences', () => {
    expect(parseDescriptionResponse('```json\n{"description":"Hello world."}\n```')).toBe(
      'Hello world.',
    )
  })

  it('extracts JSON from surrounding prose', () => {
    expect(parseDescriptionResponse('Sure: {"description":"x"} done.')).toBe('x')
  })

  it('falls back to raw text when not JSON at all', () => {
    expect(parseDescriptionResponse('A plain prose description.')).toBe(
      'A plain prose description.',
    )
  })

  it('returns empty when JSON parsed but description is empty', () => {
    expect(parseDescriptionResponse('{"description":""}')).toBe('')
  })

  it('returns empty when JSON parsed but description field is missing', () => {
    expect(parseDescriptionResponse('{"other":"value"}')).toBe('')
  })

  it('strips surrounding double quotes from raw text fallback', () => {
    expect(parseDescriptionResponse('"quoted"')).toBe('quoted')
  })

  it('collapses internal whitespace runs to single spaces', () => {
    expect(parseDescriptionResponse('{"description":"hello    world"}')).toBe('hello world')
  })

  it('truncates to MAX_DESCRIPTION_CHARS with ellipsis when over the cap', () => {
    const long = 'a'.repeat(MAX_DESCRIPTION_CHARS + 50)
    const result = parseDescriptionResponse(`{"description":"${long}"}`)
    expect(result.length).toBe(MAX_DESCRIPTION_CHARS)
    expect(result.endsWith('…')).toBe(true)
  })

  it('returns the value as-is when exactly MAX_DESCRIPTION_CHARS', () => {
    const exact = 'b'.repeat(MAX_DESCRIPTION_CHARS)
    const result = parseDescriptionResponse(`{"description":"${exact}"}`)
    expect(result).toBe(exact)
  })
})
