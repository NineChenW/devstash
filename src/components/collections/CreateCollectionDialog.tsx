'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createCollection } from '@/actions/collections'
import { firstFieldError } from '@/lib/item-utils'

interface CreateCollectionDialogProps {
  open: boolean
  onClose: () => void
}

export function CreateCollectionDialog({ open, onClose }: CreateCollectionDialogProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) {
      setName('')
      setDescription('')
      setSubmitting(false)
    }
  }, [open])

  const nameTrimmed = name.trim()
  const canSubmit = nameTrimmed.length > 0 && !submitting

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    if (!canSubmit) return

    setSubmitting(true)
    try {
      const result = await createCollection({
        name: nameTrimmed,
        description: description.trim() ? description.trim() : null,
      })

      if (!result.success) {
        toast.error(firstFieldError(result.fieldErrors, 'name', 'description') ?? result.error)
        return
      }

      toast.success('Collection created')
      onClose()
      router.refresh()
    } catch {
      toast.error('Failed to create collection')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md border-[hsl(217.2_32.6%_25%)] bg-[hsl(217.2_32.6%_12%)] p-0">
        <form onSubmit={handleSubmit} className="flex flex-col">
          <DialogHeader className="border-b border-[hsl(217.2_32.6%_22%)] px-6 py-4">
            <DialogTitle>New Collection</DialogTitle>
            <DialogDescription>
              Group related items together. You can add items after creating it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 py-5">
            <div>
              <label
                htmlFor="collection-name"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Name
              </label>
              <Input
                id="collection-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. React Patterns"
                maxLength={80}
                autoFocus
                required
              />
            </div>

            <div>
              <label
                htmlFor="collection-description"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Description
                <span className="ml-2 normal-case text-[10px] text-muted-foreground/70">
                  Optional
                </span>
              </label>
              <textarea
                id="collection-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What goes in this collection?"
                rows={3}
                maxLength={500}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-[hsl(217.2_32.6%_22%)] px-6 py-4">
            <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {submitting ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
