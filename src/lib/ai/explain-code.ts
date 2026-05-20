import { truncateContent } from './auto-tags'

export const MAX_EXPLAIN_CONTENT_CHARS = 4000

export interface BuildExplainCodeInput {
  title: string
  content: string | null | undefined
  language?: string | null
  typeName?: string | null
}

export function buildExplainCodeInput(
  args: BuildExplainCodeInput,
): { instructions: string; input: string } {
  const instructions =
    "You are a code-explanation assistant for a developer knowledge tool.\n" +
    "Explain what the code does in a concise way (200-300 words).\n" +
    "Cover what it does and key concepts, performance considerations, or idiomatic patterns.\n" +
    "Use markdown formatting with H3 headers for sections.\n" +
    "Quote short fragments of the original code where it clarifies the explanation.\n" +
    "Do not rewrite the code. Do not propose changes. Do not use bullet points — use prose.\n" +
    "Aim for clarity for an intermediate developer."

  const parts: string[] = []
  if (args.typeName) parts.push(`Item type: ${args.typeName}`)
  parts.push(`Title: ${args.title}`)
  if (args.language) parts.push(`Language: ${args.language}`)
  const truncated = truncateContent(args.content, MAX_EXPLAIN_CONTENT_CHARS)
  if (truncated) parts.push(`Code:\n\`\`\`\n${truncated}\n\`\`\``)

  return { instructions, input: parts.join('\n\n') }
}

/**
 * Parse the explanation from the AI response.
 * The response is plain markdown text, so we just clean it up.
 */
export function parseExplainCodeResponse(raw: string | null | undefined): string {
  if (!raw) return ''
  const trimmed = raw.trim()
  if (!trimmed) return ''
  return trimmed
}