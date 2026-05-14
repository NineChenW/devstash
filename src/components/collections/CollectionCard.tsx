'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Star } from 'lucide-react'
import { iconMap, DefaultIcon } from '@/lib/icon-map'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { deleteCollection, toggleCollectionFavorite } from '@/actions/collections'
import { CollectionCardMenu } from './CollectionCardMenu'
import { EditCollectionDialog } from './EditCollectionDialog'

interface CollectionCardProps {
  id: string
  name: string
  description: string | null
  itemCount: number
  typeIcons: { icon: string; color: string }[]
  isFavorite: boolean
  dominantColor: string
}

export function CollectionCard({
  id,
  name,
  description,
  itemCount,
  typeIcons,
  isFavorite,
  dominantColor,
}: CollectionCardProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [favorite, setFavorite] = useState(isFavorite)
  const [favoritePending, setFavoritePending] = useState(false)

  async function handleToggleFavorite() {
    if (favoritePending) return
    const previous = favorite
    const next = !previous
    setFavorite(next)
    setFavoritePending(true)
    try {
      const result = await toggleCollectionFavorite(id)
      if (!result.success) {
        setFavorite(previous)
        toast.error(result.error)
        return
      }
      setFavorite(result.isFavorite)
      router.refresh()
    } catch {
      setFavorite(previous)
      toast.error('Failed to update favorite')
    } finally {
      setFavoritePending(false)
    }
  }

  async function handleConfirmDelete() {
    setDeleting(true)
    try {
      const result = await deleteCollection(id)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success('Collection deleted')
      setConfirming(false)
      router.refresh()
    } catch {
      toast.error('Failed to delete collection')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="group relative">
      <Link
        href={`/collections/${id}`}
        className="flex flex-col rounded-xl border bg-card p-5 transition-colors hover:bg-accent/50"
        style={{ borderLeftColor: dominantColor, borderLeftWidth: '2px' }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold" title={name}>{name}</h3>
              {favorite && (
                <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{itemCount} items</p>
          </div>
          {/* Spacer so the absolutely-positioned menu trigger doesn't overlap text */}
          <div className="h-6 w-6 shrink-0" aria-hidden="true" />
        </div>

        <p className="mt-3 text-sm text-muted-foreground">{description}</p>

        <div className="mt-4 flex gap-1.5">
          {typeIcons.slice(0, 4).map((type, index) => {
            const Icon = iconMap[type.icon] || DefaultIcon
            return (
              <div
                key={index}
                className="flex h-6 w-6 items-center justify-center rounded bg-muted/50"
              >
                <Icon className="h-3.5 w-3.5" style={{ color: type.color }} />
              </div>
            )
          })}
        </div>
      </Link>

      <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <CollectionCardMenu
          isFavorite={favorite}
          onEdit={() => setEditing(true)}
          onDelete={() => setConfirming(true)}
          onFavorite={handleToggleFavorite}
        />
      </div>

      <EditCollectionDialog
        open={editing}
        onClose={() => setEditing(false)}
        collection={{ id, name, description }}
      />
      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={handleConfirmDelete}
        title="Delete collection?"
        description={`"${name}" will be deleted. Items in this collection will not be deleted — they will simply no longer belong to it.`}
        confirmLabel="Delete"
        pendingLabel="Deleting…"
        pending={deleting}
      />
    </div>
  )
}
