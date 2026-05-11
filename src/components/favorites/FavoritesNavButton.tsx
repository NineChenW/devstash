import Link from 'next/link'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function FavoritesNavButton() {
  return (
    <Button asChild variant="ghost" size="icon" title="Favorites" aria-label="Favorites">
      <Link href="/favorites">
        <Star className="h-5 w-5" />
      </Link>
    </Button>
  )
}
