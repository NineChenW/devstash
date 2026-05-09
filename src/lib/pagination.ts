export const ITEMS_PER_PAGE = 21
export const COLLECTIONS_PER_PAGE = 21
export const DASHBOARD_COLLECTIONS_LIMIT = 6
export const DASHBOARD_RECENT_ITEMS_LIMIT = 10

export function parsePageParam(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (!value) return 1
  const n = Number.parseInt(value, 10)
  if (!Number.isFinite(n) || n < 1) return 1
  return n
}

export function totalPages(total: number, perPage: number): number {
  if (total <= 0) return 1
  return Math.max(1, Math.ceil(total / perPage))
}

export function buildPageHref(basePath: string, page: number): string {
  const url = new URL(basePath, 'http://x')
  if (page <= 1) {
    url.searchParams.delete('page')
  } else {
    url.searchParams.set('page', String(page))
  }
  const search = url.searchParams.toString()
  return search ? `${url.pathname}?${search}` : url.pathname
}

export type PaginationToken = number | 'ellipsis'

export function paginationWindow(
  current: number,
  total: number,
  siblings = 1,
): PaginationToken[] {
  if (total <= 1) return [1]
  const c = Math.max(1, Math.min(current, total))

  const pages = new Set<number>([1, total])
  const left = Math.max(2, c - siblings)
  const right = Math.min(total - 1, c + siblings)
  for (let p = left; p <= right; p++) pages.add(p)

  const sorted = [...pages].sort((a, b) => a - b)
  const tokens: PaginationToken[] = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0) {
      const gap = sorted[i] - sorted[i - 1]
      if (gap === 2) {
        tokens.push(sorted[i - 1] + 1)
      } else if (gap > 2) {
        tokens.push('ellipsis')
      }
    }
    tokens.push(sorted[i])
  }
  return tokens
}
