'use server'

import { z } from 'zod'
import { auth } from '@/auth'
import { getDemoUserId } from '@/lib/db/collections'
import {
  createItem as createItemQuery,
  deleteItem as deleteItemQuery,
  toggleItemFavorite as toggleItemFavoriteQuery,
  toggleItemPin as toggleItemPinQuery,
  updateItem as updateItemQuery,
  type ItemDetail,
} from '@/lib/db/items'
import { QuotaExceededError, isProForGating } from '@/lib/usage-limits'
import {
  createItemSchema,
  updateItemSchema,
  type CreateItemPayload,
  type UpdateItemPayload,
} from '@/lib/validations/items'

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

  const { title, description, content, url, language, tags, collectionIds } = parsed.data
  const dedupedTags = Array.from(new Set(tags))
  const dedupedCollectionIds = collectionIds ? Array.from(new Set(collectionIds)) : undefined

  const ownerId = (await getDemoUserId()) ?? session.user.id

  try {
    const updated = await updateItemQuery(itemId, ownerId, {
      title,
      description: description ?? null,
      content: content ?? null,
      url: url ?? null,
      language: language ?? null,
      tags: dedupedTags,
      collectionIds: dedupedCollectionIds,
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

export type CreateItemResult =
  | { success: true; data: ItemDetail }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

export async function createItem(payload: CreateItemPayload): Promise<CreateItemResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' }
  }

  const parsed = createItemSchema.safeParse(payload)
  if (!parsed.success) {
    return {
      success: false,
      error: 'Invalid input',
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    }
  }

  const {
    typeName,
    title,
    description,
    content,
    url,
    language,
    tags,
    fileUrl,
    fileName,
    fileSize,
    collectionIds,
  } = parsed.data
  const dedupedTags = Array.from(new Set(tags))
  const dedupedCollectionIds = collectionIds ? Array.from(new Set(collectionIds)) : undefined

  const ownerId = (await getDemoUserId()) ?? session.user.id
  const isPro = isProForGating(session)

  try {
    const created = await createItemQuery(ownerId, isPro, {
      typeName,
      title,
      description: description ?? null,
      content: content ?? null,
      url: url ?? null,
      language: language ?? null,
      tags: dedupedTags,
      fileUrl: fileUrl ?? null,
      fileName: fileName ?? null,
      fileSize: fileSize ?? null,
      collectionIds: dedupedCollectionIds,
    })

    if (!created) {
      return { success: false, error: 'Item type not found' }
    }

    return { success: true, data: created }
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      return { success: false, error: err.message }
    }
    console.error('createItem failed', err)
    return { success: false, error: 'Failed to create item' }
  }
}

export type ToggleItemFavoriteResult =
  | { success: true; isFavorite: boolean }
  | { success: false; error: string }

export async function toggleItemFavorite(
  itemId: string,
): Promise<ToggleItemFavoriteResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' }
  }

  const ownerId = (await getDemoUserId()) ?? session.user.id

  try {
    const result = await toggleItemFavoriteQuery(itemId, ownerId)
    if (!result) {
      return { success: false, error: 'Item not found' }
    }
    return { success: true, isFavorite: result.isFavorite }
  } catch (err) {
    console.error('toggleItemFavorite failed', err)
    return { success: false, error: 'Failed to update favorite' }
  }
}

export type ToggleItemPinResult =
  | { success: true; isPinned: boolean }
  | { success: false; error: string }

export async function toggleItemPin(
  itemId: string,
): Promise<ToggleItemPinResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' }
  }

  const ownerId = (await getDemoUserId()) ?? session.user.id

  try {
    const result = await toggleItemPinQuery(itemId, ownerId)
    if (!result) {
      return { success: false, error: 'Item not found' }
    }
    return { success: true, isPinned: result.isPinned }
  } catch (err) {
    console.error('toggleItemPin failed', err)
    return { success: false, error: 'Failed to update pin' }
  }
}

export type DeleteItemResult =
  | { success: true }
  | { success: false; error: string }

export async function deleteItem(itemId: string): Promise<DeleteItemResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' }
  }

  const ownerId = (await getDemoUserId()) ?? session.user.id

  try {
    const ok = await deleteItemQuery(itemId, ownerId)
    if (!ok) {
      return { success: false, error: 'Item not found' }
    }
    return { success: true }
  } catch (err) {
    console.error('deleteItem failed', err)
    return { success: false, error: 'Failed to delete item' }
  }
}
