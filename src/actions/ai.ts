'use server'

import { z } from 'zod'
import { auth } from '@/auth'
import { AI_MODEL, getOpenAI, isOpenAIConfigured } from '@/lib/openai'
import {
  buildAutoTagInput,
  normalizeTags,
  parseTagResponse,
} from '@/lib/ai/auto-tags'
import {
  buildAutoDescriptionInput,
  parseDescriptionResponse,
} from '@/lib/ai/auto-description'
import { checkRateLimit, minutesUntil } from '@/lib/rate-limit'
import { isProForGating } from '@/lib/usage-limits'

const generateAutoTagsSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().max(20_000).nullable().optional(),
  typeName: z.string().max(40).nullable().optional(),
})

export type GenerateAutoTagsPayload = z.input<typeof generateAutoTagsSchema>

export type GenerateAutoTagsResult =
  | { success: true; tags: string[] }
  | { success: false; error: string }

export async function generateAutoTags(
  payload: GenerateAutoTagsPayload,
): Promise<GenerateAutoTagsResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' }
  }

  if (!isProForGating(session)) {
    return { success: false, error: 'AI tag suggestions are a Pro feature.' }
  }

  const parsed = generateAutoTagsSchema.safeParse(payload)
  if (!parsed.success) {
    return { success: false, error: 'Add a title before generating tags.' }
  }

  const rate = await checkRateLimit('ai', `user:${session.user.id}`)
  if (!rate.success) {
    const minutes = minutesUntil(rate.reset)
    return {
      success: false,
      error: `Too many AI requests. Try again in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}.`,
    }
  }

  if (!isOpenAIConfigured()) {
    return { success: false, error: 'AI is not configured on this server.' }
  }

  const { instructions, input } = buildAutoTagInput({
    title: parsed.data.title,
    content: parsed.data.content,
    typeName: parsed.data.typeName,
  })

  try {
    const client = getOpenAI()
    // Original (OpenAI Responses API — required for gpt-5-nano):
    // const response = await client.responses.create({
    //   model: AI_MODEL,
    //   instructions,
    //   input,
    //   text: { format: { type: 'json_object' } },
    // })
    // const rawText = response.output_text

    // SiliconFlow / GLM-4-9B uses the standard Chat Completions API.
    const completion = await client.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: instructions },
        { role: 'user', content: input },
      ],
      response_format: { type: 'json_object' },
    })
    const rawText = completion.choices[0]?.message?.content ?? ''

    const tags = normalizeTags(parseTagResponse(rawText))
    if (tags.length === 0) {
      return { success: false, error: 'AI did not return any tags. Try again.' }
    }
    return { success: true, tags }
  } catch (err) {
    console.error('generateAutoTags failed', err)
    return { success: false, error: 'AI request failed. Try again.' }
  }
}

const generateAutoDescriptionSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().max(20_000).nullable().optional(),
  url: z.string().max(2_000).nullable().optional(),
  fileName: z.string().max(500).nullable().optional(),
  typeName: z.string().max(40).nullable().optional(),
})

export type GenerateAutoDescriptionPayload = z.input<typeof generateAutoDescriptionSchema>

export type GenerateAutoDescriptionResult =
  | { success: true; description: string }
  | { success: false; error: string }

export async function generateAutoDescription(
  payload: GenerateAutoDescriptionPayload,
): Promise<GenerateAutoDescriptionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Not authenticated' }
  }

  if (!isProForGating(session)) {
    return {
      success: false,
      error: 'AI description suggestions are a Pro feature.',
    }
  }

  const parsed = generateAutoDescriptionSchema.safeParse(payload)
  if (!parsed.success) {
    return { success: false, error: 'Add a title before generating a description.' }
  }

  const rate = await checkRateLimit('ai', `user:${session.user.id}`)
  if (!rate.success) {
    const minutes = minutesUntil(rate.reset)
    return {
      success: false,
      error: `Too many AI requests. Try again in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}.`,
    }
  }

  if (!isOpenAIConfigured()) {
    return { success: false, error: 'AI is not configured on this server.' }
  }

  const { instructions, input } = buildAutoDescriptionInput({
    title: parsed.data.title,
    content: parsed.data.content,
    url: parsed.data.url,
    fileName: parsed.data.fileName,
    typeName: parsed.data.typeName,
  })

  try {
    const client = getOpenAI()
    const completion = await client.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: instructions },
        { role: 'user', content: input },
      ],
      response_format: { type: 'json_object' },
    })
    const rawText = completion.choices[0]?.message?.content ?? ''

    const description = parseDescriptionResponse(rawText)
    if (!description) {
      return {
        success: false,
        error: 'AI did not return a description. Try again.',
      }
    }
    return { success: true, description }
  } catch (err) {
    console.error('generateAutoDescription failed', err)
    return { success: false, error: 'AI request failed. Try again.' }
  }
}
