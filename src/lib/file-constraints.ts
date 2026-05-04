export type UploadKind = 'file' | 'image'

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const MAX_FILE_BYTES = 10 * 1024 * 1024

export const IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
] as const

export const FILE_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/json',
  'application/x-yaml',
  'text/yaml',
  'application/xml',
  'text/xml',
  'text/csv',
  'application/toml',
] as const

export const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'] as const
export const FILE_EXTENSIONS = [
  '.pdf',
  '.txt',
  '.md',
  '.json',
  '.yaml',
  '.yml',
  '.xml',
  '.csv',
  '.toml',
  '.ini',
] as const

export const IMAGE_ACCEPT = [...IMAGE_MIME_TYPES, ...IMAGE_EXTENSIONS].join(',')
export const FILE_ACCEPT = [...FILE_MIME_TYPES, ...FILE_EXTENSIONS].join(',')

export function getExtension(name: string): string {
  const idx = name.lastIndexOf('.')
  return idx >= 0 ? name.slice(idx).toLowerCase() : ''
}

export interface ValidationFailure {
  ok: false
  error: string
}
export interface ValidationSuccess {
  ok: true
  kind: UploadKind
}
export type ValidationResult = ValidationSuccess | ValidationFailure

export function validateUpload(
  kind: UploadKind,
  fileName: string,
  size: number,
  mime: string,
): ValidationResult {
  const ext = getExtension(fileName)

  if (kind === 'image') {
    if (size > MAX_IMAGE_BYTES) {
      return { ok: false, error: `Image must be 5 MB or smaller (got ${formatBytes(size)})` }
    }
    const mimeOk = (IMAGE_MIME_TYPES as readonly string[]).includes(mime)
    const extOk = (IMAGE_EXTENSIONS as readonly string[]).includes(ext)
    if (!mimeOk && !extOk) {
      return {
        ok: false,
        error: 'Image type not allowed. Use png, jpg, jpeg, gif, webp, or svg.',
      }
    }
    return { ok: true, kind }
  }

  if (size > MAX_FILE_BYTES) {
    return { ok: false, error: `File must be 10 MB or smaller (got ${formatBytes(size)})` }
  }
  const mimeOk =
    (FILE_MIME_TYPES as readonly string[]).includes(mime) ||
    // .ini files commonly carry text/plain or application/octet-stream
    (ext === '.ini' && (mime === 'text/plain' || mime === 'application/octet-stream' || mime === ''))
  const extOk = (FILE_EXTENSIONS as readonly string[]).includes(ext)
  if (!mimeOk && !extOk) {
    return {
      ok: false,
      error: 'File type not allowed. Allowed: pdf, txt, md, json, yaml, yml, xml, csv, toml, ini.',
    }
  }
  return { ok: true, kind }
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

const SAFE_FILENAME_RE = /[^A-Za-z0-9._-]+/g

export function sanitizeFileName(name: string): string {
  const trimmed = name.trim().slice(-120)
  const cleaned = trimmed.replace(SAFE_FILENAME_RE, '_').replace(/^_+|_+$/g, '')
  return cleaned.length > 0 ? cleaned : 'file'
}
