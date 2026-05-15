'use client'

import { useState, useTransition } from 'react'
import { Check, Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { createCheckoutSession } from '@/actions/billing'

type Period = 'monthly' | 'yearly'

interface PriceFeature {
  label: string
  included: boolean
}

const FREE_FEATURES: PriceFeature[] = [
  { label: 'Up to 50 items', included: true },
  { label: 'Up to 3 collections', included: true },
  { label: 'Snippets, prompts, commands, notes, links', included: true },
  { label: 'Full-text search', included: true },
  { label: 'Files & images', included: false },
  { label: 'AI features', included: false },
]

const PRO_FEATURES: PriceFeature[] = [
  { label: 'Unlimited items', included: true },
  { label: 'Unlimited collections', included: true },
  { label: 'Files & images', included: true },
  { label: 'All AI features', included: true },
  { label: 'Custom item types', included: true },
  { label: 'Export as JSON / ZIP', included: true },
]

export function UpgradePane() {
  const [period, setPeriod] = useState<Period>('monthly')
  const [pending, startTransition] = useTransition()
  const isYearly = period === 'yearly'

  const handleUpgrade = () => {
    startTransition(async () => {
      const result = await createCheckoutSession(period)
      if (result.success) {
        window.location.href = result.url
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label="Billing period"
        className="mx-auto mb-8 inline-flex gap-1 rounded-full border bg-card p-1"
      >
        <PeriodTab
          active={!isYearly}
          onClick={() => setPeriod('monthly')}
        >
          Monthly
        </PeriodTab>
        <PeriodTab
          active={isYearly}
          onClick={() => setPeriod('yearly')}
        >
          Yearly
          <span
            className={
              'rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ' +
              (isYearly
                ? 'bg-white/20 text-white'
                : 'bg-emerald-500/15 text-emerald-400')
            }
          >
            Save 25%
          </span>
        </PeriodTab>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <PlanCard
          name="Free"
          tagline="For the everyday developer."
          priceMain="0"
          priceTail="/forever"
          features={FREE_FEATURES}
          action={
            <div className="inline-flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              Current plan
            </div>
          }
        />

        <PlanCard
          name="Pro"
          tagline="Everything, unlocked."
          highlighted
          badge="Most popular"
          priceMain={isYearly ? '6' : '8'}
          priceTail={isYearly ? '/month, billed yearly' : '/month'}
          subnote={isYearly ? '$72 billed yearly — save $24.' : undefined}
          features={PRO_FEATURES}
          action={
            <Button
              onClick={handleUpgrade}
              disabled={pending}
              className="w-full border-0 text-white shadow-[0_4px_16px_rgba(99,102,241,0.45)] hover:opacity-90"
              style={{
                background: 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)',
              }}
            >
              <Sparkles className="mr-2 h-4 w-4" strokeWidth={1.75} />
              {pending
                ? 'Redirecting…'
                : isYearly
                  ? 'Upgrade to Pro · $72/year'
                  : 'Upgrade to Pro · $8/month'}
            </Button>
          }
        />
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        You&apos;ll be redirected to Stripe&apos;s secure checkout. Cancel anytime
        from Settings.
      </p>
    </div>
  )
}

function PeriodTab({
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
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={
        'inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ' +
        (active
          ? 'text-white shadow-[0_4px_12px_rgba(99,102,241,0.35)]'
          : 'text-muted-foreground hover:text-foreground')
      }
      style={
        active
          ? { background: 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)' }
          : undefined
      }
    >
      {children}
    </button>
  )
}

interface PlanCardProps {
  name: string
  tagline: string
  priceMain: string
  priceTail: string
  subnote?: string
  features: PriceFeature[]
  highlighted?: boolean
  badge?: string
  action: React.ReactNode
}

function PlanCard({
  name,
  tagline,
  priceMain,
  priceTail,
  subnote,
  features,
  highlighted,
  badge,
  action,
}: PlanCardProps) {
  return (
    <article
      className="relative grid gap-5 rounded-2xl border bg-card p-7"
      style={
        highlighted
          ? {
              borderColor: 'rgba(99,102,241,0.45)',
              background:
                'radial-gradient(120% 80% at 50% 0%, rgba(99,102,241,0.18), transparent 60%), linear-gradient(180deg, rgba(99,102,241,0.06), rgba(99,102,241,0.02))',
              boxShadow: '0 20px 60px -20px rgba(99,102,241,0.45)',
            }
          : undefined
      }
    >
      {badge && (
        <span
          className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #ec4899)',
            boxShadow: '0 6px 16px rgba(99,102,241,0.4)',
          }}
        >
          {badge}
        </span>
      )}
      <header>
        <h3 className="mb-1 text-lg font-bold">{name}</h3>
        <p className="text-sm text-muted-foreground">{tagline}</p>
      </header>
      <div className="flex items-baseline gap-0.5">
        <span className="text-lg text-muted-foreground">$</span>
        <span className="text-5xl font-extrabold leading-none tracking-tight">
          {priceMain}
        </span>
        <span className="ml-1.5 text-sm text-muted-foreground">{priceTail}</span>
      </div>
      {subnote && (
        <p className="-mt-3 text-sm text-emerald-400">{subnote}</p>
      )}
      <ul className="grid gap-2.5" role="list">
        {features.map((f) => (
          <FeatureRow key={f.label} feature={f} />
        ))}
      </ul>
      {action}
    </article>
  )
}

function FeatureRow({ feature }: { feature: PriceFeature }) {
  return (
    <li className="grid grid-cols-[20px_1fr] items-center gap-2.5 text-sm">
      <span
        aria-hidden="true"
        className={
          'grid h-5 w-5 place-items-center rounded-full ' +
          (feature.included
            ? 'bg-indigo-500/20 text-indigo-400'
            : 'bg-muted text-muted-foreground')
        }
      >
        {feature.included ? (
          <Check className="h-3 w-3" strokeWidth={3} />
        ) : (
          <X className="h-3 w-3" strokeWidth={3} />
        )}
      </span>
      <span className={feature.included ? '' : 'text-muted-foreground'}>
        {feature.label}
      </span>
    </li>
  )
}
