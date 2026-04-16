import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  label: string
  value: number
  icon: LucideIcon
  iconColor?: string
}

export function StatsCard({ label, value, icon: Icon, iconColor }: StatsCardProps) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-4 w-4" style={{ color: iconColor }} />
        </div>
      </div>
      <p className="mt-2 text-2xl font-semibold">{value.toLocaleString()}</p>
    </div>
  )
}
