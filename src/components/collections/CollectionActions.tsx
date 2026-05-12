'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Pencil, Star, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { deleteCollection, toggleCollectionFavorite } from '@/actions/collections'
import { EditCollectionDialog } from './EditCollectionDialog'

interface CollectionActionsProps {
  collection: {
    id: string
    name: string
    description: string | null
    isFavorite: boolean
  }
}

export function CollectionActions({ collection }: CollectionActionsProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isFavorite, setIsFavorite] = useState(collection.isFavorite)
  const [favoritePending, setFavoritePending] = useState(false)

  async function handleToggleFavorite() {
    if (favoritePending) return
    const previous = isFavorite
    const next = !previous
    setIsFavorite(next)
    setFavoritePending(true)
    try {
      const result = await toggleCollectionFavorite(collection.id)
      if (!result.success) {
        setIsFavorite(previous)
        toast.error(result.error)
        return
      }
      setIsFavorite(result.isFavorite)
      router.refresh()
    } catch {
      setIsFavorite(previous)
      toast.error('Failed to update favorite')
    } finally {
      setFavoritePending(false)
    }
  }

  async function handleConfirmDelete() {
    if (deleting) return
    setDeleting(true)
    try {
      const result = await deleteCollection(collection.id)
      if (!result.success) {
        toast.error(result.error)
        setDeleting(false)
        return
      }
      toast.success('Collection deleted')
      setConfirming(false)
      setDeleting(false)
      router.push('/collections')
    } catch {
      toast.error('Failed to delete collection')
      setDeleting(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={isFavorite ? 'Unfavorite collection' : 'Favorite collection'}
        aria-pressed={isFavorite}
        onClick={handleToggleFavorite}
        disabled={favoritePending}
      >
        <Star
          className={
            isFavorite
              ? 'h-4 w-4 fill-yellow-500 text-yellow-500'
              : 'h-4 w-4'
          }
        />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setEditing(true)}
      >
        <Pencil className="mr-1.5 h-3.5 w-3.5" />
        Edit
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setConfirming(true)}
      >
        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
        Delete
      </Button>

      <EditCollectionDialog
        open={editing}
        onClose={() => setEditing(false)}
        collection={{
          id: collection.id,
          name: collection.name,
          description: collection.description,
        }}
      />
      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={handleConfirmDelete}
        title="Delete collection?"
        description={`"${collection.name}" will be deleted. Items in this collection will not be deleted — they will simply no longer belong to it.`}
        confirmLabel="Delete"
        pendingLabel="Deleting…"
        pending={deleting}
      />
    </div>
  )
}
