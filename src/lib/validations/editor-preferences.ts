import { z } from 'zod'

export const FONT_SIZE_OPTIONS = [12, 13, 14, 16, 18, 20] as const
export const TAB_SIZE_OPTIONS = [2, 4, 8] as const
export const EDITOR_THEMES = ['vs-dark', 'monokai', 'github-dark'] as const

export type EditorTheme = (typeof EDITOR_THEMES)[number]

export const DEFAULT_EDITOR_PREFERENCES = {
  fontSize: 14,
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  theme: 'vs-dark',
} as const

export const editorPreferencesSchema = z.object({
  fontSize: z.coerce
    .number()
    .int()
    .refine((n) => (FONT_SIZE_OPTIONS as readonly number[]).includes(n), {
      message: 'Invalid font size',
    }),
  tabSize: z.coerce
    .number()
    .int()
    .refine((n) => (TAB_SIZE_OPTIONS as readonly number[]).includes(n), {
      message: 'Invalid tab size',
    }),
  wordWrap: z.boolean(),
  minimap: z.boolean(),
  theme: z.enum(EDITOR_THEMES),
})

export type EditorPreferences = z.infer<typeof editorPreferencesSchema>

export function parseEditorPreferences(raw: unknown): EditorPreferences {
  const result = editorPreferencesSchema.safeParse(raw)
  if (result.success) return result.data
  return { ...DEFAULT_EDITOR_PREFERENCES }
}
