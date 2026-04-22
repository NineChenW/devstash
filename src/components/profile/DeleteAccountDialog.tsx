'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'

const CONFIRM_PHRASE = 'DELETE'

export function DeleteAccountDialog() {
  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function close() {
    if (submitting) return
    setOpen(false)
    setConfirmation('')
    setError(null)
  }

  async function onConfirm() {
    if (confirmation !== CONFIRM_PHRASE) {
      setError(`Type ${CONFIRM_PHRASE} to confirm`)
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/account', { method: 'DELETE' })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        setError(data?.error || 'Could not delete account')
        setSubmitting(false)
        return
      }
      toast.success('Account deleted.', { id: 'account-deleted' })
      await signOut({ callbackUrl: '/sign-in' })
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Delete account
      </Button>

      <Modal
        open={open}
        onClose={close}
        title="Delete account"
        description="This permanently removes your account, items, and collections. This action cannot be undone."
      >
        <div className="space-y-3">
          <label htmlFor="confirm" className="text-sm font-medium">
            Type <span className="font-mono font-semibold">{CONFIRM_PHRASE}</span> to confirm
          </label>
          <Input
            id="confirm"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            disabled={submitting}
            autoComplete="off"
          />

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={close} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={onConfirm}
              disabled={submitting || confirmation !== CONFIRM_PHRASE}
            >
              {submitting ? 'Deleting…' : 'Delete account'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
