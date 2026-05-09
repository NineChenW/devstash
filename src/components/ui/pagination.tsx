import Link from 'next/link'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { buildPageHref, paginationWindow, totalPages } from '@/lib/pagination'
import { cn } from '@/lib/utils'

interface PaginationProps {
  currentPage: number
  total: number
  perPage: number
  basePath: string
  className?: string
}

const baseClasses =
  'inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground'
const disabledClasses =
  'pointer-events-none cursor-not-allowed opacity-50 hover:bg-background hover:text-foreground'
const activeClasses =
  'border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'

export function Pagination({
  currentPage,
  total,
  perPage,
  basePath,
  className,
}: PaginationProps) {
  const pages = totalPages(total, perPage)
  if (pages <= 1) return null

  const current = Math.max(1, Math.min(currentPage, pages))
  const tokens = paginationWindow(current, pages)
  const prevDisabled = current <= 1
  const nextDisabled = current >= pages

  return (
    <nav
      className={cn('flex items-center justify-center gap-1', className)}
      aria-label="Pagination"
    >
      {prevDisabled ? (
        <span className={cn(baseClasses, disabledClasses)} aria-disabled="true">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Prev
        </span>
      ) : (
        <Link
          href={buildPageHref(basePath, current - 1)}
          className={baseClasses}
          aria-label="Previous page"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Prev
        </Link>
      )}

      {tokens.map((token, i) => {
        if (token === 'ellipsis') {
          return (
            <span
              key={`ellipsis-${i}`}
              className="inline-flex h-9 min-w-9 items-center justify-center text-muted-foreground"
              aria-hidden="true"
            >
              <MoreHorizontal className="h-4 w-4" />
            </span>
          )
        }
        const isActive = token === current
        return (
          <Link
            key={token}
            href={buildPageHref(basePath, token)}
            className={cn(baseClasses, isActive && activeClasses)}
            aria-current={isActive ? 'page' : undefined}
            aria-label={`Page ${token}`}
          >
            {token}
          </Link>
        )
      })}

      {nextDisabled ? (
        <span className={cn(baseClasses, disabledClasses)} aria-disabled="true">
          Next
          <ChevronRight className="ml-1 h-4 w-4" />
        </span>
      ) : (
        <Link
          href={buildPageHref(basePath, current + 1)}
          className={baseClasses}
          aria-label="Next page"
        >
          Next
          <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      )}
    </nav>
  )
}
