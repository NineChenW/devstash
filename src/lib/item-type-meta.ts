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
