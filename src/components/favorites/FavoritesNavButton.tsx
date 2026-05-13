import Link from 'next/link'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FavoritesNavButtonProps {
  className?: string
}

export function FavoritesNavButton({ className }: FavoritesNavButtonProps) {
  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      title="Favorites"
      aria-label="Favorites"
      className={className}
    >
      <Link href="/favorites">
        <Star className="h-5 w-5" />
      </Link>
    </Button>
  )
}
