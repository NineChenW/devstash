'use client'

import { FolderPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCreateCollection } from './CreateCollectionContext'

export function TopBarNewCollectionButton() {
  const { open } = useCreateCollection()
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={open}
      title="New Collection"
      aria-label="New Collection"
    >
      <FolderPlus className="h-4 w-4 sm:mr-2" />
      <span className="hidden sm:inline">New Collection</span>
    </Button>
  )
}
