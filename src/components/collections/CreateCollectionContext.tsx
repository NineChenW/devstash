'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { CreateCollectionDialog } from './CreateCollectionDialog'

interface CreateCollectionContextValue {
  open: () => void
}

const CreateCollectionContext = createContext<CreateCollectionContextValue | null>(null)

export function useCreateCollection() {
  const ctx = useContext(CreateCollectionContext)
  if (!ctx) {
    throw new Error('useCreateCollection must be used inside CreateCollectionProvider')
  }
  return ctx
}

export function CreateCollectionProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)

  const handleOpen = useCallback(() => setOpen(true), [])
  const handleClose = useCallback(() => setOpen(false), [])

  return (
    <CreateCollectionContext.Provider value={{ open: handleOpen }}>
      {children}
      <CreateCollectionDialog open={open} onClose={handleClose} />
    </CreateCollectionContext.Provider>
  )
}
