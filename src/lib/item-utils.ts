export function parseTagsInput(raw: string): string[] {
  return raw
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
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
