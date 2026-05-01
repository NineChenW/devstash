'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCreateItem } from './CreateItemContext'
import { CREATE_TYPE_META } from '@/lib/item-type-meta'
import type { CreateItemType } from '@/lib/validations/items'

interface TypeAddButtonProps {
  type: CreateItemType
}

export function TypeAddButton({ type }: TypeAddButtonProps) {
  const { open } = useCreateItem()
  const meta = CREATE_TYPE_META[type]
  return (
    <Button size="sm" onClick={() => open(type)}>
      <Plus className="mr-2 h-4 w-4" style={{ color: meta.color }} />
      Add {meta.label}
    </Button>
  )
}
