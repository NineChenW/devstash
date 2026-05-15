import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UpgradeNavButtonProps {
  className?: string
}

export function UpgradeNavButton({ className }: UpgradeNavButtonProps) {
  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      title="Upgrade to Pro"
      aria-label="Upgrade to Pro"
      className={className}
    >
      <Link href="/upgrade">
        <Sparkles className="h-4 w-4 text-indigo-400" strokeWidth={1.75} />
        <span className="hidden sm:inline">Upgrade</span>
      </Link>
    </Button>
  )
}
