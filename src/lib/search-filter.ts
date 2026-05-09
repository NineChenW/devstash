export function searchFilter(
  _value: string,
  search: string,
  keywords?: string[],
): number {
  const q = search.trim().toLowerCase()
  if (!q) return 1
  const tokens = q.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return 1
  const lowered = (keywords ?? []).map((k) => k.toLowerCase())
  const haystack = lowered.join(' ')
  if (!tokens.every((t) => haystack.includes(t))) return 0
  const title = lowered[0] ?? ''
  return tokens.every((t) => title.includes(t)) ? 2 : 1
}
