import { z } from 'zod'

export const createCollectionSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80, 'Name must be 80 characters or fewer'),
  description: z.string().trim().max(500, 'Description must be 500 characters or fewer').nullable().optional(),
})

export type CreateCollectionPayload = z.input<typeof createCollectionSchema>
