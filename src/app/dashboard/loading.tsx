export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="flex h-16 items-center px-4">
          <div className="h-8 w-8 animate-pulse rounded bg-muted" />
          <div className="ml-4 h-8 w-64 animate-pulse rounded-md bg-muted" />
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        <div className="hidden w-64 border-r bg-card p-4 md:block">
          <div className="mb-4 h-6 w-24 animate-pulse rounded bg-muted" />
          <div className="space-y-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-8 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-8">
            <div className="h-7 w-48 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-4 w-64 animate-pulse rounded bg-muted" />
          </div>

          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl border bg-card" />
            ))}
          </div>

          <div className="mb-8">
            <div className="mb-4 h-6 w-40 animate-pulse rounded bg-muted" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-xl border bg-card" />
              ))}
            </div>
          </div>

          <div>
            <div className="mb-4 h-6 w-40 animate-pulse rounded bg-muted" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl border bg-card" />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
