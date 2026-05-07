'use client'

import { FolderPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCreateCollection } from './CreateCollectionContext'

export function TopBarNewCollectionButton() {
  const { open } = useCreateCollection()
  return (
    <Button variant="outline" size="sm" onClick={open}>
      <FolderPlus className="mr-2 h-4 w-4" />
      New Collection
    </Button>
  )
}
