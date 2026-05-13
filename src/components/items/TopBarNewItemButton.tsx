'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCreateItem } from './CreateItemContext'

export function TopBarNewItemButton() {
  const { open } = useCreateItem()
  return (
    <Button
      size="sm"
      onClick={() => open()}
      title="New Item"
      aria-label="New Item"
    >
      <Plus className="h-4 w-4 sm:mr-2" />
      <span className="hidden sm:inline">New Item</span>
    </Button>
  )
}
