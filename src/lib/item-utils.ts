export function parseTagsInput(raw: string): string[] {
  return raw
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
}

export function appendTagToInput(rawInput: string, tag: string): string {
  const cleaned = tag.trim()
  if (!cleaned) return rawInput
  const existing = parseTagsInput(rawInput)
  if (existing.some((t) => t.toLowerCase() === cleaned.toLowerCase())) {
    return rawInput
  }
  if (existing.length === 0) return cleaned
  const needsLeadingSpace = !rawInput.endsWith(' ') && !rawInput.endsWith(',')
  const separator = rawInput.endsWith(',') ? ' ' : needsLeadingSpace ? ', ' : ''
  return `${rawInput}${separator}${cleaned}`
}

export type FieldErrors = Record<string, string[] | undefined> | undefined

export function firstFieldError(
  fieldErrors: FieldErrors,
  ...keys: string[]
): string | undefined {
  if (!fieldErrors) return undefined
  for (const key of keys) {
    const value = fieldErrors[key]?.[0]
    if (value) return value
  }
  return undefined
}
