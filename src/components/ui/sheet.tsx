'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
  ariaLabel?: string
}

export function Sheet({ open, onClose, children, className, ariaLabel }: SheetProps) {
  const [mounted, setMounted] = useState(open)

  useEffect(() => {
    if (open) {
      setMounted(true)
      return
    }
    const t = setTimeout(() => setMounted(false), 200)
    return () => clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!mounted && !open) return null

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <div
        className={cn(
          'absolute inset-0 bg-black/60 transition-opacity duration-200',
          open ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          'absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-[hsl(217.2_32.6%_25%)] bg-[hsl(217.2_32.6%_12%)] shadow-xl transition-transform duration-200 ease-out sm:max-w-lg',
          open ? 'translate-x-0' : 'translate-x-full',
          className,
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  )
}
