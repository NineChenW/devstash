import { describe, expect, it } from 'vitest'
import {
  formatBytes,
  getExtension,
  sanitizeFileName,
  validateUpload,
  MAX_FILE_BYTES,
  MAX_IMAGE_BYTES,
} from './file-constraints'

describe('getExtension', () => {
  it('returns extension lowercased with leading dot', () => {
    expect(getExtension('Photo.PNG')).toBe('.png')
    expect(getExtension('Notes.MD')).toBe('.md')
  })

  it('returns empty string when no extension', () => {
    expect(getExtension('readme')).toBe('')
  })

  it('handles dotfiles by treating leading dot as extension', () => {
    expect(getExtension('.env')).toBe('.env')
  })
})

describe('formatBytes', () => {
  it('formats bytes', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(900)).toBe('900 B')
  })

  it('formats kilobytes', () => {
    expect(formatBytes(1024)).toBe('1.0 KB')
    expect(formatBytes(2048)).toBe('2.0 KB')
  })

  it('formats megabytes', () => {
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB')
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB')
  })
})

describe('sanitizeFileName', () => {
  it('keeps allowed characters', () => {
    expect(sanitizeFileName('my-file_v2.pdf')).toBe('my-file_v2.pdf')
  })

  it('replaces unsafe characters with underscores', () => {
    expect(sanitizeFileName('weird name (1)/path.pdf')).toBe('weird_name_1_path.pdf')
  })

  it('strips leading/trailing underscores', () => {
    expect(sanitizeFileName('   spaces   ')).toBe('spaces')
  })

  it('falls back to "file" for empty input', () => {
    expect(sanitizeFileName('   ')).toBe('file')
    expect(sanitizeFileName('')).toBe('file')
  })
})

describe('validateUpload — image', () => {
  it('accepts a valid image by mime', () => {
    const r = validateUpload('image', 'photo.png', 1024, 'image/png')
    expect(r.ok).toBe(true)
  })

  it('accepts a valid image by extension when mime is empty', () => {
    const r = validateUpload('image', 'photo.svg', 1024, '')
    expect(r.ok).toBe(true)
  })

  it('rejects an image larger than 5 MB', () => {
    const r = validateUpload('image', 'big.png', MAX_IMAGE_BYTES + 1, 'image/png')
    expect(r.ok).toBe(false)
  })

  it('rejects an image with disallowed extension', () => {
    const r = validateUpload('image', 'photo.bmp', 1024, 'image/bmp')
    expect(r.ok).toBe(false)
  })
})

describe('validateUpload — file', () => {
  it('accepts a valid pdf', () => {
    const r = validateUpload('file', 'doc.pdf', 1024, 'application/pdf')
    expect(r.ok).toBe(true)
  })

  it('accepts an .ini with text/plain mime', () => {
    const r = validateUpload('file', 'config.ini', 1024, 'text/plain')
    expect(r.ok).toBe(true)
  })

  it('accepts yaml by extension', () => {
    const r = validateUpload('file', 'pipeline.yml', 1024, '')
    expect(r.ok).toBe(true)
  })

  it('rejects a file larger than 10 MB', () => {
    const r = validateUpload('file', 'big.pdf', MAX_FILE_BYTES + 1, 'application/pdf')
    expect(r.ok).toBe(false)
  })

  it('rejects an unknown extension', () => {
    const r = validateUpload('file', 'thing.exe', 1024, 'application/octet-stream')
    expect(r.ok).toBe(false)
  })
})
