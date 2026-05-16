export const MAX_CONTENT_CHARS = 2000

export function truncateContent(text: string | null | undefined, max: number = MAX_CONTENT_CHARS): string {
  if (!text) return ""
  if (text.length <= max) return text
  return text.slice(0, max)
}

export function buildAutoTagInput(args: {
  title: string
  content: string | null | undefined
  typeName?: string | null
}): { instructions: string; input: string } {
  const instructions =
    "You are a developer-tool assistant that suggests concise tags for snippets, prompts, commands, notes, and links. " +
    "Reply with JSON only — either {\"tags\": [\"a\",\"b\"]} or [\"a\",\"b\"]. " +
    "Return 3-5 short lowercase tags (1-3 words each, no leading hash). " +
    "Tags should describe technologies, concepts, and purpose. " +
    "Do not include sentences, explanations, or markdown."

  const truncated = truncateContent(args.content)
  const parts: string[] = [`Title: ${args.title}`]
  if (args.typeName) parts.push(`Type: ${args.typeName}`)
  if (truncated) parts.push(`Content:\n${truncated}`)
  parts.push("Return JSON with 3-5 tag suggestions.")

  return { instructions, input: parts.join("\n\n") }
}

/**
 * The model returns either `{"tags": ["a","b"]}` or a bare `["a","b"]`.
 * Sometimes the JSON is wrapped in stray prose / code fences, so try a few
 * fallbacks before giving up.
 */
export function parseTagResponse(raw: string | null | undefined): string[] {
  if (!raw) return []
  const trimmed = raw.trim()
  if (!trimmed) return []

  const candidates: string[] = [trimmed]

  // Strip markdown code fences if present.
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced && fenced[1]) candidates.push(fenced[1].trim())

  // Extract the first JSON object/array if surrounded by prose.
  const objectMatch = trimmed.match(/\{[\s\S]*\}/)
  if (objectMatch) candidates.push(objectMatch[0])
  const arrayMatch = trimmed.match(/\[[\s\S]*\]/)
  if (arrayMatch) candidates.push(arrayMatch[0])

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate)
      const tags = extractTagsFromParsed(parsed)
      if (tags.length > 0) return tags
    } catch {
      // try next candidate
    }
  }

  return []
}

function extractTagsFromParsed(parsed: unknown): string[] {
  if (Array.isArray(parsed)) {
    return parsed.filter((t): t is string => typeof t === "string")
  }
  if (parsed && typeof parsed === "object" && "tags" in parsed) {
    const value = (parsed as { tags: unknown }).tags
    if (Array.isArray(value)) {
      return value.filter((t): t is string => typeof t === "string")
    }
  }
  return []
}

export function normalizeTags(raw: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const rawTag of raw) {
    if (typeof rawTag !== "string") continue
    const cleaned = rawTag
      .toLowerCase()
      .replace(/^#+/, "")
      .replace(/\s+/g, " ")
      .trim()
    if (!cleaned) continue
    if (cleaned.length > 32) continue
    if (seen.has(cleaned)) continue
    seen.add(cleaned)
    out.push(cleaned)
    if (out.length >= 5) break
  }
  return out
}
