'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { updateEditorPreferences } from '@/actions/editor-preferences'
import {
  EDITOR_THEMES,
  FONT_SIZE_OPTIONS,
  TAB_SIZE_OPTIONS,
  type EditorPreferences,
} from '@/lib/validations/editor-preferences'

const THEME_LABELS: Record<(typeof EDITOR_THEMES)[number], string> = {
  'vs-dark': 'VS Dark',
  monokai: 'Monokai',
  'github-dark': 'GitHub Dark',
}

const SELECT_CLASS =
  'h-9 w-48 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

const ROW_CLASS = 'flex items-center justify-between gap-4'
const ROW_DIVIDER_CLASS = `${ROW_CLASS} border-t pt-3`

export function EditorPreferencesForm({ initial }: { initial: EditorPreferences }) {
  const [prefs, setPrefs] = useState<EditorPreferences>(initial)
  const [, startTransition] = useTransition()

  const save = (next: EditorPreferences) => {
    setPrefs(next)
    startTransition(async () => {
      const result = await updateEditorPreferences(next)
      if (result.success) {
        toast.success('Preferences saved')
      } else {
        toast.error(result.error)
        setPrefs(prefs)
      }
    })
  }

  return (
    <div className="space-y-3">
      <Row
        label="Theme"
        description="Color scheme used in the code editor."
        htmlFor="editor-theme"
      >
        <select
          id="editor-theme"
          className={SELECT_CLASS}
          value={prefs.theme}
          onChange={(e) => save({ ...prefs, theme: e.target.value as EditorPreferences['theme'] })}
        >
          {EDITOR_THEMES.map((t) => (
            <option key={t} value={t}>
              {THEME_LABELS[t]}
            </option>
          ))}
        </select>
      </Row>

      <Row
        label="Font size"
        description="Editor text size."
        htmlFor="editor-font-size"
        divider
      >
        <select
          id="editor-font-size"
          className={SELECT_CLASS}
          value={prefs.fontSize}
          onChange={(e) => save({ ...prefs, fontSize: Number(e.target.value) })}
        >
          {FONT_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}px
            </option>
          ))}
        </select>
      </Row>

      <Row
        label="Tab size"
        description="Number of spaces per tab."
        htmlFor="editor-tab-size"
        divider
      >
        <select
          id="editor-tab-size"
          className={SELECT_CLASS}
          value={prefs.tabSize}
          onChange={(e) => save({ ...prefs, tabSize: Number(e.target.value) })}
        >
          {TAB_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size} spaces
            </option>
          ))}
        </select>
      </Row>

      <Row
        label="Word wrap"
        description="Wrap long lines instead of horizontal scroll."
        divider
      >
        <Switch checked={prefs.wordWrap} onChange={(v) => save({ ...prefs, wordWrap: v })} />
      </Row>

      <Row
        label="Minimap"
        description="Show the code overview minimap on the right."
        divider
      >
        <Switch checked={prefs.minimap} onChange={(v) => save({ ...prefs, minimap: v })} />
      </Row>
    </div>
  )
}

function Row({
  label,
  description,
  htmlFor,
  divider,
  children,
}: {
  label: string
  description: string
  htmlFor?: string
  divider?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={divider ? ROW_DIVIDER_CLASS : ROW_CLASS}>
      <div className="min-w-0">
        {htmlFor ? (
          <label htmlFor={htmlFor} className="text-sm font-medium">
            {label}
          </label>
        ) : (
          <p className="text-sm font-medium">{label}</p>
        )}
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Switch({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
        checked
          ? 'border-blue-500 bg-blue-500'
          : 'border-white/15 bg-[hsl(217.2_32.6%_18%)]'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}
