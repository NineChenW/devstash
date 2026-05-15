'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FadeOnScroll } from './FadeOnScroll'

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

function FeatureRow({ feature }: { feature: PriceFeature }) {
  return (
    <li className="grid grid-cols-[22px_1fr] items-center gap-2.5 text-[0.92rem] text-[#aab1c2]">
      <span
        aria-hidden="true"
        className="grid h-[22px] w-[22px] place-items-center rounded-full text-[13px] font-bold"
        style={
          feature.included
            ? { background: 'rgba(59,130,246,0.24)', color: '#3b82f6' }
            : { background: 'rgba(255,255,255,0.05)', color: '#6f7689' }
        }
      >
        {feature.included ? '✓' : '✕'}
      </span>
      {feature.label}
    </li>
  )
}

export function PricingSection() {
  const [period, setPeriod] = useState<Period>('monthly')
  const isYearly = period === 'yearly'

  return (
    <section id="pricing" className="mx-auto max-w-[1180px] px-6 py-20 sm:py-24">
      <FadeOnScroll className="mx-auto mb-12 max-w-[720px] text-center">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6f7689]">
          Pricing
        </p>
        <h2 className="mb-3 text-[clamp(1.6rem,2.6vw,2.2rem)] font-bold tracking-tight text-white">
          Simple pricing. Pro when you need it.
        </h2>
        <p className="text-base text-[#aab1c2]">
          All features are unlocked for everyone during the beta.
        </p>

        <div
          role="tablist"
          aria-label="Billing period"
          className="mt-5 inline-flex gap-1 rounded-full border border-white/8 bg-white/[0.03] p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={!isYearly}
            onClick={() => setPeriod('monthly')}
            className={
              'inline-flex items-center gap-2 rounded-full px-4.5 py-2 text-[13px] font-medium transition-colors ' +
              (!isYearly
                ? 'text-white shadow-[0_4px_12px_rgba(99,102,241,0.35)]'
                : 'text-[#aab1c2] hover:text-white')
            }
            style={
              !isYearly
                ? { background: 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)' }
                : undefined
            }
          >
            Monthly
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isYearly}
            onClick={() => setPeriod('yearly')}
            className={
              'inline-flex items-center gap-2 rounded-full px-4.5 py-2 text-[13px] font-medium transition-colors ' +
              (isYearly
                ? 'text-white shadow-[0_4px_12px_rgba(99,102,241,0.35)]'
                : 'text-[#aab1c2] hover:text-white')
            }
            style={
              isYearly
                ? { background: 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)' }
                : undefined
            }
          >
            Yearly
            <span
              className="rounded text-[10px] font-semibold tracking-[0.04em]"
              style={
                isYearly
                  ? { background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '2px 6px' }
                  : { background: 'rgba(34,197,94,0.18)', color: '#22c55e', padding: '2px 6px' }
              }
            >
              Save 25%
            </span>
          </button>
        </div>
      </FadeOnScroll>

      <div className="mx-auto grid max-w-[880px] gap-5 sm:grid-cols-2">
        <FadeOnScroll
          as="article"
          className="relative grid gap-[18px] rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.008))] p-7"
        >
          <header>
            <h3 className="mb-1 text-[1.2rem] font-bold text-white">Free</h3>
            <p className="text-[0.92rem] text-[#aab1c2]">For the everyday developer.</p>
          </header>
          <div className="flex items-baseline gap-0.5">
            <span className="text-[1.4rem] text-[#aab1c2]">$</span>
            <span className="text-[3.2rem] font-extrabold leading-none tracking-[-0.04em] text-white">
              0
            </span>
            <span className="ml-1.5 text-[0.92rem] text-[#6f7689]">/forever</span>
          </div>
          <ul className="grid gap-2.5" role="list">
            {FREE_FEATURES.map((f) => (
              <FeatureRow key={f.label} feature={f} />
            ))}
          </ul>
          <Button
            asChild
            variant="outline"
            className="w-full border-white/14 bg-transparent text-white hover:bg-white/5 hover:text-white"
          >
            <Link href="/register?plan=free">Start free</Link>
          </Button>
        </FadeOnScroll>

        <FadeOnScroll
          as="article"
          className="relative grid gap-[18px] rounded-[22px] border p-7"
          style={{
            borderColor: 'rgba(99,102,241,0.45)',
            background:
              'radial-gradient(120% 80% at 50% 0%, rgba(99,102,241,0.18), transparent 60%), linear-gradient(180deg, rgba(99,102,241,0.06), rgba(99,102,241,0.02))',
            boxShadow: '0 20px 60px -20px rgba(99,102,241,0.45)',
          }}
        >
          <span
            className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #ec4899)',
              boxShadow: '0 6px 16px rgba(99,102,241,0.4)',
            }}
          >
            Most popular
          </span>
          <header>
            <h3 className="mb-1 text-[1.2rem] font-bold text-white">Pro</h3>
            <p className="text-[0.92rem] text-[#aab1c2]">Everything, unlocked.</p>
          </header>
          <div className="flex items-baseline gap-0.5">
            <span className="text-[1.4rem] text-[#aab1c2]">$</span>
            <span className="text-[3.2rem] font-extrabold leading-none tracking-[-0.04em] text-white">
              {isYearly ? 6 : 8}
            </span>
            <span className="ml-1.5 text-[0.92rem] text-[#6f7689]">
              {isYearly ? '/month, billed yearly' : '/month'}
            </span>
          </div>
          {isYearly && (
            <p className="-mt-2.5 text-[0.85rem] text-[#22c55e]">
              $72 billed yearly — save $24.
            </p>
          )}
          <ul className="grid gap-2.5" role="list">
            {PRO_FEATURES.map((f) => (
              <FeatureRow key={f.label} feature={f} />
            ))}
          </ul>
          <Button
            asChild
            className="w-full border-0 text-white shadow-[0_4px_16px_rgba(99,102,241,0.45)] hover:opacity-90"
            style={{ background: 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)' }}
          >
            <Link href={`/register?plan=${isYearly ? 'yearly' : 'monthly'}`}>
              Upgrade to Pro
            </Link>
          </Button>
        </FadeOnScroll>
      </div>
    </section>
  )
}
