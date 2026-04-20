'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { LogOut, MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { UserAvatar } from '@/components/user/UserAvatar'

export interface SidebarUserData {
  name?: string | null
  email?: string | null
  image?: string | null
}

interface SidebarUserProps extends SidebarUserData {
  collapsed: boolean
}

export function SidebarUser({ collapsed, name, email, image }: SidebarUserProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative border-t p-3">
      <div
        className={cn(
          'flex items-center gap-3 rounded-md px-2 py-2',
          collapsed && 'justify-center',
        )}
      >
        <Link
          href="/profile"
          aria-label="Go to profile"
          className="shrink-0 rounded-full transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <UserAvatar name={name} image={image} />
        </Link>
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{name ?? 'Unknown user'}</p>
              {email && (
                <p className="truncate text-xs text-muted-foreground">{email}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={open}
              className="shrink-0 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {open && !collapsed && (
        <div
          role="menu"
          className="absolute bottom-full left-3 right-3 mb-1 overflow-hidden rounded-md border bg-popover shadow-md"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              void signOut({ callbackUrl: '/sign-in' })
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-popover-foreground hover:bg-accent"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
