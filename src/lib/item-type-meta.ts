import type { CreateItemType } from './validations/items'

export const CREATE_TYPE_META: Record<
  CreateItemType,
  { label: string; icon: string; color: string }
> = {
  snippet: { label: 'Snippet', icon: 'Code', color: '#3b82f6' },
  prompt: { label: 'Prompt', icon: 'Sparkles', color: '#8b5cf6' },
  command: { label: 'Command', icon: 'Terminal', color: '#f97316' },
  note: { label: 'Note', icon: 'StickyNote', color: '#fde047' },
  link: { label: 'Link', icon: 'Link', color: '#10b981' },
  file: { label: 'File', icon: 'File', color: '#6b7280' },
  image: { label: 'Image', icon: 'Image', color: '#ec4899' },
}

export const TYPES_WITH_CONTENT: ReadonlySet<string> = new Set([
  'snippet',
  'prompt',
  'command',
  'note',
])
export const TYPES_WITH_LANGUAGE: ReadonlySet<string> = new Set(['snippet', 'command'])
export const TYPES_WITH_CODE_EDITOR: ReadonlySet<string> = new Set(['snippet', 'command'])
export const TYPES_WITH_MARKDOWN_EDITOR: ReadonlySet<string> = new Set(['note', 'prompt'])
export const TYPES_WITH_FILE_UPLOAD: ReadonlySet<string> = new Set(['file', 'image'])
