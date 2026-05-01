'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { CreateItemDialog } from './CreateItemDialog'
import type { CreateItemType } from '@/lib/validations/items'

interface CreateItemContextValue {
  open: (type?: CreateItemType) => void
}

const CreateItemContext = createContext<CreateItemContextValue | null>(null)

export function useCreateItem() {
  const ctx = useContext(CreateItemContext)
  if (!ctx) {
    throw new Error('useCreateItem must be used inside CreateItemProvider')
  }
  return ctx
}

export function CreateItemProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ open: boolean; type?: CreateItemType }>({
    open: false,
  })

  const open = useCallback((type?: CreateItemType) => {
    setState({ open: true, type })
  }, [])

  const close = useCallback(() => {
    setState((prev) => ({ open: false, type: prev.type }))
  }, [])

  return (
    <CreateItemContext.Provider value={{ open }}>
      {children}
      <CreateItemDialog open={state.open} onClose={close} defaultType={state.type} />
    </CreateItemContext.Provider>
  )
}
