import Link from 'next/link'
import { Lock, Sparkles } from 'lucide-react'

interface UpgradePromptProps {
  feature: string
  description?: string
}

export function UpgradePrompt({ feature, description }: UpgradePromptProps) {
  return (
    <div className="rounded-xl border border-dashed bg-muted/30 p-5 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        <Lock className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">{feature} is a Pro feature</p>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      )}
      <Link
        href="/settings#billing"
        className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Upgrade to Pro
      </Link>
    </div>
  )
}
