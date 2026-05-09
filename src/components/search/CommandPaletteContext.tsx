'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { CommandPalette } from './CommandPalette'

interface CommandPaletteContextValue {
  open: () => void
}

const Ctx = createContext<CommandPaletteContextValue | null>(null)

export function useCommandPalette() {
  const ctx = useContext(Ctx)
  if (!ctx) {
    throw new Error('useCommandPalette must be used inside <CommandPaletteProvider>')
  }
  return ctx
}

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <Ctx.Provider value={{ open }}>
      {children}
      <CommandPalette open={isOpen} onClose={close} />
    </Ctx.Provider>
  )
}
