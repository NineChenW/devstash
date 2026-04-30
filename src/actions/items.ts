'use server'

import { z } from 'zod'
import { auth } from '@/auth'
import { getDemoUserId } from '@/lib/db/collections'
import { updateItem as updateItemQuery, type ItemDetail } from '@/lib/db/items'
import { updateItemSchema, type UpdateItemPayload } from '@/lib/validations/items'

export type UpdateItemResult =
  | { success: true; data: ItemDetail }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

export async function updateItem(
  itemId: string,
  payload: UpdateItemPayload,
): Promise<UpdateItemResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' }
  }

  const parsed = updateItemSchema.safeParse(payload)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Invalid input',
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    }
  }

  const { title, description, content, url, language, tags } = parsed.data
  const dedupedTags = Array.from(new Set(tags))

  const ownerId = (await getDemoUserId()) ?? session.user.id

  try {
    const updated = await updateItemQuery(itemId, ownerId, {
      title,
      description: description ?? null,
      content: content ?? null,
      url: url ?? null,
      language: language ?? null,
      tags: dedupedTags,
    })

    if (!updated) {
      return { success: false, error: 'Item not found' }
    }

    return { success: true, data: updated }
  } catch (err) {
    console.error('updateItem failed', err)
    return { success: false, error: 'Failed to update item' }
  }
}
