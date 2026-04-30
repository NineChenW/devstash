'use client'

import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  pendingLabel?: string
  variant?: 'destructive' | 'default'
  pending?: boolean
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  pendingLabel,
  variant = 'destructive',
  pending = false,
}: ConfirmDialogProps) {
  function handleClose() {
    if (pending) return
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title={title} description={description}>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={handleClose} disabled={pending}>
          {cancelLabel}
        </Button>
        <Button type="button" variant={variant} onClick={onConfirm} disabled={pending}>
          {pending ? pendingLabel ?? `${confirmLabel}…` : confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
