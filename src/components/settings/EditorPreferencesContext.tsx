'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import {
  DEFAULT_EDITOR_PREFERENCES,
  type EditorPreferences,
} from '@/lib/validations/editor-preferences'

interface EditorPreferencesContextValue {
  preferences: EditorPreferences
  setPreferences: (next: EditorPreferences) => void
}

const EditorPreferencesContext = createContext<EditorPreferencesContextValue | null>(null)

export function useEditorPreferences(): EditorPreferences {
  const ctx = useContext(EditorPreferencesContext)
  if (!ctx) return { ...DEFAULT_EDITOR_PREFERENCES }
  return ctx.preferences
}

export function useEditorPreferencesController(): EditorPreferencesContextValue {
  const ctx = useContext(EditorPreferencesContext)
  if (!ctx) {
    throw new Error(
      'useEditorPreferencesController must be used inside EditorPreferencesProvider',
    )
  }
  return ctx
}

export function EditorPreferencesProvider({
  initial,
  children,
}: {
  initial: EditorPreferences
  children: ReactNode
}) {
  const [preferences, setPreferences] = useState<EditorPreferences>(initial)
  return (
    <EditorPreferencesContext.Provider value={{ preferences, setPreferences }}>
      {children}
    </EditorPreferencesContext.Provider>
  )
}
