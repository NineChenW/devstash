'use server'

import { z } from 'zod'
import { auth } from '@/auth'
import {
  createCollection as createCollectionQuery,
  getDemoUserId,
  type CreatedCollection,
} from '@/lib/db/collections'
import {
  createCollectionSchema,
  type CreateCollectionPayload,
} from '@/lib/validations/collections'

export type CreateCollectionResult =
  | { success: true; data: CreatedCollection }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

export async function createCollection(
  payload: CreateCollectionPayload,
): Promise<CreateCollectionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' }
  }

  const parsed = createCollectionSchema.safeParse(payload)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Invalid input',
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    }
  }

  const { name, description } = parsed.data
  const ownerId = (await getDemoUserId()) ?? session.user.id

  try {
    const created = await createCollectionQuery(ownerId, {
      name,
      description: description && description.length > 0 ? description : null,
    })
    return { success: true, data: created }
  } catch (err) {
    console.error('createCollection failed', err)
    return { success: false, error: 'Failed to create collection' }
  }
}
