'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Download, Pencil, Pin, Star, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Sheet } from '@/components/ui/sheet'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { iconMap, DefaultIcon } from '@/lib/icon-map'
import { deleteItem } from '@/actions/items'
import type { ItemDetail } from '@/lib/db/items'
import { ItemContentPreview } from './ItemContentPreview'
import { ItemDrawerEdit } from './ItemDrawerEdit'
import { DetailRow, ItemHeader, Section, fmtLongDate } from './ItemDrawerLayout'

interface ItemDrawerProps {
  itemId: string | null
  onClose: () => void
}

function normalizeItemDates(item: ItemDetail): ItemDetail {
  return {
    ...item,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  }
}

export function ItemDrawer({ itemId, onClose }: ItemDrawerProps) {
  const router = useRouter()
  const open = itemId !== null
  const [item, setItem] = useState<ItemDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [favorite, setFavorite] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [editing, setEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!itemId) {
      setEditing(false)
      return
    }
    let cancelled = false
    setItem(null)
    setError(null)
    setLoading(true)
    setEditing(false)

    fetch(`/api/items/${itemId}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(res.status === 404 ? 'Item not found' : 'Failed to load item')
        }
        return res.json()
      })
      .then((data: { item: ItemDetail }) => {
        if (cancelled) return
        const fetched = normalizeItemDates(data.item)
        setItem(fetched)
        setFavorite(fetched.isFavorite)
        setPinned(fetched.isPinned)
      })
      .catch((err: Error) => {
        if (cancelled) return
        setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [itemId])

  const handleSaved = (updated: ItemDetail) => {
    const normalized = normalizeItemDates(updated)
    setItem(normalized)
    setFavorite(normalized.isFavorite)
    setPinned(normalized.isPinned)
    setEditing(false)
  }

  async function handleConfirmDelete() {
    if (!item || deleting) return
    setDeleting(true)
    try {
      const result = await deleteItem(item.id)
      if (!result.success) {
        toast.error(result.error)
        setDeleting(false)
        return
      }
      toast.success('Item deleted')
      setConfirmingDelete(false)
      setDeleting(false)
      onClose()
      router.refresh()
    } catch {
      toast.error('Failed to delete item')
      setDeleting(false)
    }
  }

  return (
    <>
      <Sheet open={open} onClose={onClose} ariaLabel="Item details">
        {loading && <DrawerSkeleton />}
        {error && !loading && (
          <div className="flex h-full items-center justify-center p-6">
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        )}
        {item && !loading && !error && !editing && (
          <DrawerView
            item={item}
            favorite={favorite}
            pinned={pinned}
            onToggleFavorite={() => setFavorite((v) => !v)}
            onTogglePin={() => setPinned((v) => !v)}
            onEdit={() => setEditing(true)}
            onDelete={() => setConfirmingDelete(true)}
          />
        )}
        {item && !loading && !error && editing && (
          <ItemDrawerEdit
            item={item}
            onCancel={() => setEditing(false)}
            onSaved={handleSaved}
          />
        )}
      </Sheet>
      <ConfirmDialog
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        onConfirm={handleConfirmDelete}
        title="Delete item"
        description={
          item
            ? `“${item.title}” will be permanently deleted. This action cannot be undone.`
            : 'This item will be permanently deleted. This action cannot be undone.'
        }
        confirmLabel="Delete"
        pendingLabel="Deleting…"
        pending={deleting}
      />
    </>
  )
}

function DrawerSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-6 pr-12">
      <div className="h-6 w-2/3 animate-pulse rounded bg-muted/50" />
      <div className="flex gap-2">
        <div className="h-5 w-16 animate-pulse rounded bg-muted/40" />
        <div className="h-5 w-12 animate-pulse rounded bg-muted/40" />
      </div>
      <div className="h-10 w-full animate-pulse rounded bg-muted/30" />
      <div className="h-4 w-1/3 animate-pulse rounded bg-muted/40" />
      <div className="h-20 w-full animate-pulse rounded bg-muted/30" />
      <div className="h-4 w-1/4 animate-pulse rounded bg-muted/40" />
      <div className="h-32 w-full animate-pulse rounded bg-muted/30" />
    </div>
  )
}

interface DrawerViewProps {
  item: ItemDetail
  favorite: boolean
  pinned: boolean
  onToggleFavorite: () => void
  onTogglePin: () => void
  onEdit: () => void
  onDelete: () => void
}

function DrawerView({
  item,
  favorite,
  pinned,
  onToggleFavorite,
  onTogglePin,
  onEdit,
  onDelete,
}: DrawerViewProps) {
  const Icon = iconMap[item.type.icon] || DefaultIcon

  const handleCopy = async () => {
    const text = item.content ?? item.url ?? item.fileUrl ?? ''
    if (!text) {
      toast.error('Nothing to copy')
      return
    }
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Copy failed')
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <ItemHeader item={item} Icon={Icon} />

      <div className="mt-4 flex items-center gap-1 border-y border-[hsl(217.2_32.6%_22%)] bg-[hsl(217.2_32.6%_14%)] px-3 py-2">
        <ActionButton
          icon={
            <Star
              className={
                favorite ? 'h-4 w-4 fill-yellow-500 text-yellow-500' : 'h-4 w-4'
              }
            />
          }
          label="Favorite"
          onClick={onToggleFavorite}
          active={favorite}
        />
        <ActionButton
          icon={<Pin className={pinned ? 'h-4 w-4 text-foreground' : 'h-4 w-4'} />}
          label="Pin"
          onClick={onTogglePin}
          active={pinned}
        />
        <ActionButton icon={<Copy className="h-4 w-4" />} label="Copy" onClick={handleCopy} />
        {item.contentType === 'file' && item.fileUrl && (
          <a
            href={`${item.fileUrl}?download=1`}
            download={item.fileName ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-foreground/80 hover:bg-accent hover:text-foreground"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </a>
        )}
        <ActionButton icon={<Pencil className="h-4 w-4" />} label="Edit" onClick={onEdit} />
        <ActionButton
          icon={<Trash2 className="h-4 w-4" />}
          label="Delete"
          onClick={onDelete}
          className="ml-auto text-destructive hover:text-destructive"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {item.description && (
          <Section title="Description">
            <p className="text-sm text-foreground/90">{item.description}</p>
          </Section>
        )}

        <Section title="Content">
          <ItemContentPreview item={item} />
        </Section>

        {item.tags.length > 0 && (
          <Section title="Tags">
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          </Section>
        )}

        {item.collections.length > 0 && (
          <Section title="Collections">
            <div className="flex flex-wrap gap-1.5">
              {item.collections.map((c) => (
                <span
                  key={c.id}
                  className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {c.name}
                </span>
              ))}
            </div>
          </Section>
        )}

        <Section title="Details">
          <div className="space-y-2 text-sm">
            <DetailRow label="Created" value={fmtLongDate(item.createdAt)} />
            <DetailRow label="Updated" value={fmtLongDate(item.updatedAt)} />
          </div>
        </Section>
      </div>
    </div>
  )
}

interface ActionButtonProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  active?: boolean
  className?: string
}

function ActionButton({ icon, label, onClick, active, className }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-foreground/80 hover:bg-accent hover:text-foreground' +
        (className ? ` ${className}` : '')
      }
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
