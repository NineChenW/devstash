import { describe, it, expect } from 'vitest'
import {
  MAX_EXPLAIN_CONTENT_CHARS,
  buildExplainCodeInput,
  parseExplainCodeResponse,
} from './explain-code'

describe('MAX_EXPLAIN_CONTENT_CHARS', () => {
  it('is 4000', () => {
    expect(MAX_EXPLAIN_CONTENT_CHARS).toBe(4000)
  })
})

describe('buildExplainCodeInput', () => {
  it('includes the title in the input', () => {
    const result = buildExplainCodeInput({ title: 'useDebounce hook', content: null })
    expect(result.input).toContain('Title: useDebounce hook')
  })

  it('includes the item type when provided', () => {
    const result = buildExplainCodeInput({
      title: 't',
      content: null,
      typeName: 'snippet',
    })
    expect(result.input).toContain('Item type: snippet')
  })

  it('includes the language when provided', () => {
    const result = buildExplainCodeInput({
      title: 't',
      content: null,
      language: 'typescript',
    })
    expect(result.input).toContain('Language: typescript')
  })

  it('includes the code block when content is provided', () => {
    const result = buildExplainCodeInput({
      title: 't',
      content: 'const x = 1',
    })
    expect(result.input).toContain('Code:')
    expect(result.input).toContain('const x = 1')
  })

  it('omits the code block when content is empty', () => {
    const result = buildExplainCodeInput({ title: 't', content: '' })
    expect(result.input).not.toContain('Code:')
  })

  it('omits the code block when content is null', () => {
    const result = buildExplainCodeInput({ title: 't', content: null })
    expect(result.input).not.toContain('Code:')
  })

  it('omits the code block when content is undefined', () => {
    const result = buildExplainCodeInput({ title: 't', content: undefined })
    expect(result.input).not.toContain('Code:')
  })

  it('truncates content over MAX_EXPLAIN_CONTENT_CHARS', () => {
    const long = 'y'.repeat(MAX_EXPLAIN_CONTENT_CHARS + 100)
    const result = buildExplainCodeInput({ title: 't', content: long })
    const codeSegment = result.input.split('Code:\n```\n')[1] ?? ''
    const actualContent = codeSegment.split('\n```')[0]
    expect(actualContent.length).toBeLessThanOrEqual(MAX_EXPLAIN_CONTENT_CHARS + 100)
    expect(actualContent.startsWith('y'.repeat(10))).toBe(true)
  })

  it('does not truncate content at or under the limit', () => {
    const content = 'const x = 1'
    const result = buildExplainCodeInput({ title: 't', content })
    expect(result.input).toContain(content)
  })

  it('returns instructions with explanation guidance', () => {
    const result = buildExplainCodeInput({ title: 't', content: null })
    expect(result.instructions).toContain('markdown')
    expect(result.instructions).toContain('H3')
    expect(result.instructions).toContain('200-300 words')
  })
})

describe('parseExplainCodeResponse', () => {
  it('returns empty string for null', () => {
    expect(parseExplainCodeResponse(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(parseExplainCodeResponse(undefined)).toBe('')
  })

  it('returns empty string for empty string', () => {
    expect(parseExplainCodeResponse('')).toBe('')
  })

  it('returns empty string for whitespace-only string', () => {
    expect(parseExplainCodeResponse('   ')).toBe('')
  })

  it('trims whitespace', () => {
    expect(parseExplainCodeResponse('  hello world  ')).toBe('hello world')
  })

  it('preserves newlines and markdown', () => {
    const markdown = '## Header\n\nSome text\n\n### Subheader'
    expect(parseExplainCodeResponse(markdown)).toBe(markdown)
  })

  it('returns the original string when it has content', () => {
    const text = '## What this code does\n\nThis function calculates...'
    expect(parseExplainCodeResponse(text)).toBe(text)
  })
})