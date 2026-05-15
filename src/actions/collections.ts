'use server'

import { z } from 'zod'
import { auth } from '@/auth'
import {
  createCollection as createCollectionQuery,
  deleteCollection as deleteCollectionQuery,
  getDemoUserId,
  getUserCollections,
  toggleCollectionFavorite as toggleCollectionFavoriteQuery,
  updateCollection as updateCollectionQuery,
  type CreatedCollection,
  type UserCollectionOption,
} from '@/lib/db/collections'
import { QuotaExceededError, isProForGating } from '@/lib/usage-limits'
import {
  createCollectionSchema,
  updateCollectionSchema,
  type CreateCollectionPayload,
  type UpdateCollectionPayload,
} from '@/lib/validations/collections'

export async function listMyCollections(): Promise<UserCollectionOption[]> {
  const session = await auth()
  if (!session?.user?.id) return []
  const ownerId = (await getDemoUserId()) ?? session.user.id
  return getUserCollections(ownerId)
}

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
  const isPro = isProForGating(session)

  try {
    const created = await createCollectionQuery(ownerId, isPro, {
      name,
      description: description && description.length > 0 ? description : null,
    })
    return { success: true, data: created }
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      return { success: false, error: err.message }
    }
    console.error('createCollection failed', err)
    return { success: false, error: 'Failed to create collection' }
  }
}

export type UpdateCollectionResult =
  | { success: true; data: CreatedCollection }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

export async function updateCollection(
  collectionId: string,
  payload: UpdateCollectionPayload,
): Promise<UpdateCollectionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' }
  }

  const parsed = updateCollectionSchema.safeParse(payload)
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
    const updated = await updateCollectionQuery(collectionId, ownerId, {
      name,
      description: description && description.length > 0 ? description : null,
    })
    if (!updated) {
      return { success: false, error: 'Collection not found' }
    }
    return { success: true, data: updated }
  } catch (err) {
    console.error('updateCollection failed', err)
    return { success: false, error: 'Failed to update collection' }
  }
}

export type ToggleCollectionFavoriteResult =
  | { success: true; isFavorite: boolean }
  | { success: false; error: string }

export async function toggleCollectionFavorite(
  collectionId: string,
): Promise<ToggleCollectionFavoriteResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' }
  }

  const ownerId = (await getDemoUserId()) ?? session.user.id

  try {
    const result = await toggleCollectionFavoriteQuery(collectionId, ownerId)
    if (!result) {
      return { success: false, error: 'Collection not found' }
    }
    return { success: true, isFavorite: result.isFavorite }
  } catch (err) {
    console.error('toggleCollectionFavorite failed', err)
    return { success: false, error: 'Failed to update favorite' }
  }
}

export type DeleteCollectionResult =
  | { success: true }
  | { success: false; error: string }

export async function deleteCollection(
  collectionId: string,
): Promise<DeleteCollectionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' }
  }

  const ownerId = (await getDemoUserId()) ?? session.user.id

  try {
    const ok = await deleteCollectionQuery(collectionId, ownerId)
    if (!ok) {
      return { success: false, error: 'Collection not found' }
    }
    return { success: true }
  } catch (err) {
    console.error('deleteCollection failed', err)
    return { success: false, error: 'Failed to delete collection' }
  }
}
