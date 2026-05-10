'use server'

import { z } from 'zod'
import { auth } from '@/auth'
import { getDemoUserId } from '@/lib/db/collections'
import { saveEditorPreferences } from '@/lib/db/profile'
import {
  editorPreferencesSchema,
  type EditorPreferences,
} from '@/lib/validations/editor-preferences'

export type UpdateEditorPreferencesResult =
  | { success: true; data: EditorPreferences }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

export async function updateEditorPreferences(
  payload: unknown,
): Promise<UpdateEditorPreferencesResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' }
  }

  const parsed = editorPreferencesSchema.safeParse(payload)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Invalid input',
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    }
  }

  const ownerId = (await getDemoUserId()) ?? session.user.id

  try {
    const saved = await saveEditorPreferences(ownerId, parsed.data)
    return { success: true, data: saved }
  } catch (err) {
    console.error('updateEditorPreferences failed', err)
    return { success: false, error: 'Failed to update preferences' }
  }
}
