'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  createBillingPortalSession,
  createCheckoutSession,
} from '@/actions/billing'

export interface BillingSectionProps {
  isPro: boolean
  itemsUsed: number
  collectionsUsed: number
  itemLimit: number
  collectionLimit: number
}

export function BillingSection({
  isPro,
  itemsUsed,
  collectionsUsed,
  itemLimit,
  collectionLimit,
}: BillingSectionProps) {
  if (isPro) {
    return <ProState />
  }

  return (
    <FreeState
      itemsUsed={itemsUsed}
      collectionsUsed={collectionsUsed}
      itemLimit={itemLimit}
      collectionLimit={collectionLimit}
    />
  )
}

function FreeState({
  itemsUsed,
  collectionsUsed,
  itemLimit,
  collectionLimit,
}: Omit<BillingSectionProps, 'isPro'>) {
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('monthly')
  const [pending, startTransition] = useTransition()

  const handleUpgrade = () => {
    startTransition(async () => {
      const result = await createCheckoutSession(plan)
      if (result.success) {
        window.location.href = result.url
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium">Plan: Free</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {itemsUsed} / {itemLimit} items · {collectionsUsed} / {collectionLimit}{' '}
          collections
        </p>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Choose plan
        </p>
        <div className="inline-flex rounded-md border bg-background p-1">
          <PlanButton active={plan === 'monthly'} onClick={() => setPlan('monthly')}>
            Monthly · $8
          </PlanButton>
          <PlanButton active={plan === 'yearly'} onClick={() => setPlan('yearly')}>
            Yearly · $72
          </PlanButton>
        </div>
        {plan === 'yearly' && (
          <p className="mt-2 text-xs text-muted-foreground">
            $72 billed yearly — save $24.
          </p>
        )}
      </div>

      <Button onClick={handleUpgrade} disabled={pending}>
        <Sparkles className="mr-2 h-4 w-4" />
        {pending ? 'Redirecting…' : 'Upgrade to Pro'}
      </Button>
    </div>
  )
}

function ProState() {
  const [pending, startTransition] = useTransition()

  const handleManage = () => {
    startTransition(async () => {
      const result = await createBillingPortalSession()
      if (result.success) {
        window.location.href = result.url
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium">Plan: DevStash Pro</p>
        <p className="mt-1 text-xs text-muted-foreground">Unlimited everything.</p>
      </div>
      <Button variant="outline" onClick={handleManage} disabled={pending}>
        {pending ? 'Opening…' : 'Manage billing'}
      </Button>
    </div>
  )
}

function PlanButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded px-3 py-1.5 text-sm transition-colors ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}
