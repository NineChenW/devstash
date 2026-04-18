'use client'

import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="flex max-w-md flex-col items-center gap-4 rounded-xl border bg-card p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We couldn&apos;t load your dashboard. Try again in a moment.
          </p>
          {error.digest && (
            <p className="mt-2 text-xs text-muted-foreground">Ref: {error.digest}</p>
          )}
        </div>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  )
}
