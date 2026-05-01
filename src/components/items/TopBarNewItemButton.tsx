'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCreateItem } from './CreateItemContext'

export function TopBarNewItemButton() {
  const { open } = useCreateItem()
  return (
    <Button size="sm" onClick={() => open()}>
      <Plus className="mr-2 h-4 w-4" />
      New Item
    </Button>
  )
}
