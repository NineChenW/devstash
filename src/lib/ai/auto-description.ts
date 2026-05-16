import { truncateContent } from './auto-tags'

export const MAX_DESCRIPTION_CHARS = 240

export interface BuildAutoDescriptionInput {
  title: string
  content?: string | null
  url?: string | null
  fileName?: string | null
  typeName?: string | null
}

export function buildAutoDescriptionInput(
  args: BuildAutoDescriptionInput,
): { instructions: string; input: string } {
  const instructions =
    'You are a developer-tool assistant that writes concise descriptions for saved items. ' +
    'Reply with JSON only — {"description": "..."}. ' +
    'The description must be 1-2 sentences of plain prose, no markdown, no surrounding quotes, ' +
    'and no filler phrases like "This is a...". ' +
    `Keep it under ${MAX_DESCRIPTION_CHARS} characters and focused on what the item is and when someone would use it.`

  const parts: string[] = [`Title: ${args.title}`]
  if (args.typeName) parts.push(`Type: ${args.typeName}`)
  if (args.url) parts.push(`URL: ${args.url}`)
  if (args.fileName) parts.push(`File name: ${args.fileName}`)
  const truncated = truncateContent(args.content)
  if (truncated) parts.push(`Content:\n${truncated}`)
  parts.push('Return JSON with a single "description" field.')

  return { instructions, input: parts.join('\n\n') }
}

/**
 * The model is asked for {"description": "..."} JSON. Be liberal in what we accept:
 * try fenced code blocks, raw JSON-in-prose, and finally fall back to treating
 * the whole reply as a prose description.
 */
export function parseDescriptionResponse(raw: string | null | undefined): string {
  if (!raw) return ''
  const trimmed = raw.trim()
  if (!trimmed) return ''

  const candidates: string[] = [trimmed]

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced && fenced[1]) candidates.push(fenced[1].trim())

  const objectMatch = trimmed.match(/\{[\s\S]*\}/)
  if (objectMatch) candidates.push(objectMatch[0])

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate)
      // JSON parsed — commit to that branch even if the description is empty.
      return cleanDescription(extractDescription(parsed))
    } catch {
      // try next candidate
    }
  }

  // No JSON anywhere — treat the raw reply as a prose description.
  return cleanDescription(trimmed)
}

function extractDescription(parsed: unknown): string {
  if (typeof parsed === 'string') return parsed
  if (parsed && typeof parsed === 'object' && 'description' in parsed) {
    const value = (parsed as { description: unknown }).description
    if (typeof value === 'string') return value
  }
  return ''
}

function cleanDescription(text: string): string {
  let out = text.trim()
  if (!out) return ''
  if (
    (out.startsWith('"') && out.endsWith('"')) ||
    (out.startsWith("'") && out.endsWith("'"))
  ) {
    out = out.slice(1, -1).trim()
  }
  out = out.replace(/\s+/g, ' ')
  if (out.length > MAX_DESCRIPTION_CHARS) {
    out = out.slice(0, MAX_DESCRIPTION_CHARS - 1).trimEnd() + '…'
  }
  return out
}
