export const HOMEPAGE_TYPE_COLORS = {
  snippet: '#3b82f6',
  prompt: '#f59e0b',
  command: '#06b6d4',
  note: '#22c55e',
  file: '#64748b',
  image: '#ec4899',
  link: '#6366f1',
} as const

export type HomepageTypeKey = keyof typeof HOMEPAGE_TYPE_COLORS
