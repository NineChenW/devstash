import { describe, expect, it } from 'vitest'
import {
  DEFAULT_EDITOR_PREFERENCES,
  EDITOR_THEMES,
  FONT_SIZE_OPTIONS,
  TAB_SIZE_OPTIONS,
  editorPreferencesSchema,
  parseEditorPreferences,
} from './editor-preferences'

describe('editorPreferencesSchema', () => {
  it('accepts the defaults', () => {
    const result = editorPreferencesSchema.safeParse(DEFAULT_EDITOR_PREFERENCES)
    expect(result.success).toBe(true)
  })

  it('accepts every allowed font size', () => {
    for (const size of FONT_SIZE_OPTIONS) {
      const result = editorPreferencesSchema.safeParse({
        ...DEFAULT_EDITOR_PREFERENCES,
        fontSize: size,
      })
      expect(result.success).toBe(true)
    }
  })

  it('rejects an unsupported font size', () => {
    const result = editorPreferencesSchema.safeParse({
      ...DEFAULT_EDITOR_PREFERENCES,
      fontSize: 11,
    })
    expect(result.success).toBe(false)
  })

  it('accepts every allowed tab size', () => {
    for (const size of TAB_SIZE_OPTIONS) {
      const result = editorPreferencesSchema.safeParse({
        ...DEFAULT_EDITOR_PREFERENCES,
        tabSize: size,
      })
      expect(result.success).toBe(true)
    }
  })

  it('rejects an unsupported tab size', () => {
    const result = editorPreferencesSchema.safeParse({
      ...DEFAULT_EDITOR_PREFERENCES,
      tabSize: 3,
    })
    expect(result.success).toBe(false)
  })

  it('accepts every allowed theme', () => {
    for (const theme of EDITOR_THEMES) {
      const result = editorPreferencesSchema.safeParse({
        ...DEFAULT_EDITOR_PREFERENCES,
        theme,
      })
      expect(result.success).toBe(true)
    }
  })

  it('rejects an unsupported theme', () => {
    const result = editorPreferencesSchema.safeParse({
      ...DEFAULT_EDITOR_PREFERENCES,
      theme: 'solarized',
    })
    expect(result.success).toBe(false)
  })

  it('rejects non-boolean toggles', () => {
    const result = editorPreferencesSchema.safeParse({
      ...DEFAULT_EDITOR_PREFERENCES,
      wordWrap: 'yes',
    })
    expect(result.success).toBe(false)
  })

  it('coerces string numbers from JSON columns', () => {
    const result = editorPreferencesSchema.safeParse({
      ...DEFAULT_EDITOR_PREFERENCES,
      fontSize: '14',
      tabSize: '2',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.fontSize).toBe(14)
      expect(result.data.tabSize).toBe(2)
    }
  })
})

describe('parseEditorPreferences', () => {
  it('returns the defaults for null input', () => {
    expect(parseEditorPreferences(null)).toEqual(DEFAULT_EDITOR_PREFERENCES)
  })

  it('returns the defaults for malformed input', () => {
    expect(parseEditorPreferences({ theme: 'solarized', fontSize: 99 })).toEqual(
      DEFAULT_EDITOR_PREFERENCES,
    )
  })

  it('returns the defaults for non-object input', () => {
    expect(parseEditorPreferences('garbage')).toEqual(DEFAULT_EDITOR_PREFERENCES)
  })

  it('returns parsed prefs when valid', () => {
    const valid = {
      fontSize: 16,
      tabSize: 4,
      wordWrap: false,
      minimap: true,
      theme: 'monokai',
    }
    expect(parseEditorPreferences(valid)).toEqual(valid)
  })
})
