import type { ItemDetail } from '@/lib/db/items'

export function ItemHeader({
  item,
  Icon,
}: {
  item: ItemDetail
  Icon: React.ElementType
}) {
  return (
    <div className="flex items-start gap-3 px-6 pt-6 pr-12">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${item.type.color}20` }}
      >
        <Icon className="h-5 w-5" style={{ color: item.type.color }} />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="break-words text-lg font-semibold leading-tight">{item.title}</h2>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span
            className="rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
            style={{ backgroundColor: `${item.type.color}20`, color: item.type.color }}
          >
            {item.type.name}s
          </span>
          {item.language && (
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {item.language}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  )
}

export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground/90">{value}</span>
    </div>
  )
}

export function fmtLongDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
