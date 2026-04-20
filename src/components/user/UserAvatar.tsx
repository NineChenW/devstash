import { cn } from '@/lib/utils'

interface UserAvatarProps {
  name?: string | null
  image?: string | null
  className?: string
}

function getInitials(name?: string | null): string {
  if (!name) return '?'
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2)
  return initials || '?'
}

export function UserAvatar({ name, image, className }: UserAvatarProps) {
  const base = cn(
    'flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted',
    className,
  )

  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name ?? 'User avatar'}
        className={cn(base, 'object-cover')}
      />
    )
  }

  return (
    <div className={base}>
      <span className="text-sm font-semibold">{getInitials(name)}</span>
    </div>
  )
}
