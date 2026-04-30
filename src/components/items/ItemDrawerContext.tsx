'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import { ItemDrawer } from './ItemDrawer'

interface ItemDrawerContextValue {
  openItem: (id: string) => void
}

const Ctx = createContext<ItemDrawerContextValue | null>(null)

export function useItemDrawer() {
  const ctx = useContext(Ctx)
  if (!ctx) {
    throw new Error('useItemDrawer must be used inside <ItemDrawerProvider>')
  }
  return ctx
}

export function ItemDrawerProvider({ children }: { children: React.ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null)

  const openItem = useCallback((id: string) => setOpenId(id), [])
  const onClose = useCallback(() => setOpenId(null), [])

  return (
    <Ctx.Provider value={{ openItem }}>
      {children}
      <ItemDrawer itemId={openId} onClose={onClose} />
    </Ctx.Provider>
  )
}
