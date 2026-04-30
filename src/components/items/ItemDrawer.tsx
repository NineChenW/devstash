'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Pencil, Pin, Star, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Sheet } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { iconMap, DefaultIcon } from '@/lib/icon-map'
import { deleteItem, updateItem } from '@/actions/items'
import type { ItemDetail } from '@/lib/db/items'

interface ItemDrawerProps {
  itemId: string | null
  onClose: () => void
}

const TYPES_WITH_CONTENT = new Set(['snippet', 'prompt', 'command', 'note'])
const TYPES_WITH_LANGUAGE = new Set(['snippet', 'command'])

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
        const fetched = {
          ...data.item,
          createdAt: new Date(data.item.createdAt),
          updatedAt: new Date(data.item.updatedAt),
        }
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
    const normalized = {
      ...updated,
      createdAt: new Date(updated.createdAt),
      updatedAt: new Date(updated.updatedAt),
    }
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
          <DrawerContent
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
          <DrawerEdit
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

interface DrawerContentProps {
  item: ItemDetail
  favorite: boolean
  pinned: boolean
  onToggleFavorite: () => void
  onTogglePin: () => void
  onEdit: () => void
  onDelete: () => void
}

function DrawerContent({
  item,
  favorite,
  pinned,
  onToggleFavorite,
  onTogglePin,
  onEdit,
  onDelete,
}: DrawerContentProps) {
  const Icon = iconMap[item.type.icon] || DefaultIcon
  const fmtDate = (d: Date) =>
    new Date(d).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

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
                favorite
                  ? 'h-4 w-4 fill-yellow-500 text-yellow-500'
                  : 'h-4 w-4'
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
          <ContentPreview item={item} />
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
            <DetailRow label="Created" value={fmtDate(item.createdAt)} />
            <DetailRow label="Updated" value={fmtDate(item.updatedAt)} />
          </div>
        </Section>
      </div>
    </div>
  )
}

interface DrawerEditProps {
  item: ItemDetail
  onCancel: () => void
  onSaved: (updated: ItemDetail) => void
}

function DrawerEdit({ item, onCancel, onSaved }: DrawerEditProps) {
  const router = useRouter()
  const Icon = iconMap[item.type.icon] || DefaultIcon
  const typeName = item.type.name
  const showContent = TYPES_WITH_CONTENT.has(typeName)
  const showLanguage = TYPES_WITH_LANGUAGE.has(typeName)
  const showUrl = typeName === 'link'

  const [title, setTitle] = useState(item.title)
  const [description, setDescription] = useState(item.description ?? '')
  const [content, setContent] = useState(item.content ?? '')
  const [language, setLanguage] = useState(item.language ?? '')
  const [url, setUrl] = useState(item.url ?? '')
  const [tagsInput, setTagsInput] = useState(item.tags.join(', '))
  const [submitting, setSubmitting] = useState(false)

  const titleTrimmed = title.trim()
  const canSave = titleTrimmed.length > 0 && !submitting

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    if (!canSave) return

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

    setSubmitting(true)
    try {
      const result = await updateItem(item.id, {
        title: titleTrimmed,
        description: description.trim() ? description : null,
        content: showContent && content.trim() ? content : null,
        url: showUrl && url.trim() ? url : null,
        language: showLanguage && language.trim() ? language : null,
        tags,
      })

      if (!result.success) {
        const msg =
          result.fieldErrors?.url?.[0] ??
          result.fieldErrors?.title?.[0] ??
          result.error
        toast.error(msg)
        return
      }

      toast.success('Item updated')
      onSaved(result.data)
      router.refresh()
    } catch {
      toast.error('Failed to update item')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col overflow-hidden">
      <ItemHeader item={item} Icon={Icon} />

      <div className="mt-4 flex items-center gap-2 border-y border-[hsl(217.2_32.6%_22%)] bg-[hsl(217.2_32.6%_14%)] px-3 py-2">
        <Button type="submit" size="sm" disabled={!canSave}>
          {submitting ? 'Saving…' : 'Save'}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-4">
        <Field label="Title" htmlFor="edit-title">
          <Input
            id="edit-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />
        </Field>

        <Field label="Description" htmlFor="edit-description">
          <textarea
            id="edit-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </Field>

        {showContent && (
          <Field label="Content" htmlFor="edit-content">
            <textarea
              id="edit-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-xs leading-relaxed shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </Field>
        )}

        {showLanguage && (
          <Field label="Language" htmlFor="edit-language">
            <Input
              id="edit-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="e.g. typescript"
            />
          </Field>
        )}

        {showUrl && (
          <Field label="URL" htmlFor="edit-url">
            <Input
              id="edit-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
            />
          </Field>
        )}

        <Field label="Tags" htmlFor="edit-tags" hint="Comma-separated">
          <Input
            id="edit-tags"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="react, hooks, ui"
          />
        </Field>

        <Section title="Details">
          <div className="space-y-2 text-sm">
            <DetailRow label="Type" value={`${typeName.charAt(0).toUpperCase()}${typeName.slice(1)}s`} />
            {item.collections.length > 0 && (
              <DetailRow
                label="Collections"
                value={item.collections.map((c) => c.name).join(', ')}
              />
            )}
            <DetailRow
              label="Created"
              value={new Date(item.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            />
            <DetailRow
              label="Updated"
              value={new Date(item.updatedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            />
          </div>
        </Section>
      </div>
    </form>
  )
}

function ItemHeader({ item, Icon }: { item: ItemDetail; Icon: React.ElementType }) {
  return (
    <div className="flex items-start gap-3 px-6 pt-6 pr-12">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${item.type.color}20` }}
      >
        <Icon className="h-5 w-5" style={{ color: item.type.color }} />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="break-words text-lg font-semibold leading-tight">{item.title}</h2>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span
            className="rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
            style={{ backgroundColor: `${item.type.color}20`, color: item.type.color }}
          >
            {item.type.name}s
          </span>
          {item.language && (
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {item.language}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
      >
        {label}
        {hint && <span className="ml-2 normal-case text-[10px] text-muted-foreground/70">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground/90">{value}</span>
    </div>
  )
}

function ContentPreview({ item }: { item: ItemDetail }) {
  if (item.contentType === 'url' && item.url) {
    return (
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block break-all rounded-md border border-[hsl(217.2_32.6%_22%)] bg-[hsl(217.2_32.6%_14%)] p-3 text-sm text-emerald-400 hover:underline"
      >
        {item.url}
      </a>
    )
  }

  if (item.contentType === 'file') {
    return (
      <div className="rounded-md border border-[hsl(217.2_32.6%_22%)] bg-[hsl(217.2_32.6%_14%)] p-3 text-sm">
        <div className="font-medium">{item.fileName ?? 'Attached file'}</div>
        {item.fileSize != null && (
          <div className="mt-0.5 text-xs text-muted-foreground">
            {formatBytes(item.fileSize)}
          </div>
        )}
      </div>
    )
  }

  if (item.content) {
    return (
      <pre className="overflow-x-auto rounded-md border border-[hsl(217.2_32.6%_22%)] bg-[hsl(217.2_32.6%_14%)] p-3 text-xs leading-relaxed">
        <code>{item.content}</code>
      </pre>
    )
  }

  return <p className="text-sm text-muted-foreground">No content.</p>
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
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
