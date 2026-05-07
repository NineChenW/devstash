import { z } from 'zod'

export const updateItemSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  url: z.url('Must be a valid URL').nullable().optional(),
  language: z.string().nullable().optional(),
  tags: z.array(z.string().trim().min(1)),
  collectionIds: z.array(z.string().min(1)).optional(),
})

export type UpdateItemPayload = z.input<typeof updateItemSchema>

export const CREATE_ITEM_TYPES = [
  'snippet',
  'prompt',
  'command',
  'note',
  'link',
  'file',
  'image',
] as const
export type CreateItemType = (typeof CREATE_ITEM_TYPES)[number]

export const createItemSchema = z
  .object({
    typeName: z.enum(CREATE_ITEM_TYPES),
    title: z.string().trim().min(1, 'Title is required'),
    description: z.string().nullable().optional(),
    content: z.string().nullable().optional(),
    url: z.url('Must be a valid URL').nullable().optional(),
    language: z.string().nullable().optional(),
    tags: z.array(z.string().trim().min(1)),
    fileUrl: z.string().min(1).nullable().optional(),
    fileName: z.string().min(1).nullable().optional(),
    fileSize: z.number().int().nonnegative().nullable().optional(),
    collectionIds: z.array(z.string().min(1)).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.typeName === 'link' && !data.url) {
      ctx.addIssue({
        code: 'custom',
        path: ['url'],
        message: 'URL is required for link items',
      })
    }
    if ((data.typeName === 'file' || data.typeName === 'image') && !data.fileUrl) {
      ctx.addIssue({
        code: 'custom',
        path: ['fileUrl'],
        message: 'A file is required',
      })
    }
  })

export type CreateItemPayload = z.input<typeof createItemSchema>
