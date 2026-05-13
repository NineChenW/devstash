import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FadeOnScroll } from './FadeOnScroll'

export function FinalCTA() {
  return (
    <section className="mx-auto max-w-[1180px] px-6 pb-20 pt-10 sm:pb-24">
      <FadeOnScroll
        className="mx-auto max-w-[720px] rounded-[22px] border border-white/8 px-8 py-14 text-center"
        style={{
          background:
            'radial-gradient(80% 80% at 50% 0%, rgba(236,72,153,0.16), transparent 60%), linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.005))',
        }}
      >
        <h2 className="mb-3 text-[clamp(1.6rem,2.6vw,2.2rem)] font-bold tracking-tight text-white">
          Ready to organise your knowledge?
        </h2>
        <p className="mb-6 text-base text-[#aab1c2]">
          Join developers using DevStash to keep every snippet, prompt, and command one keystroke away.
        </p>
        <Button
          asChild
          size="lg"
          className="rounded-xl border-0 text-white shadow-[0_4px_16px_rgba(99,102,241,0.45)] transition-transform hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)' }}
        >
          <Link href="/register">Get started — it&apos;s free</Link>
        </Button>
      </FadeOnScroll>
    </section>
  )
}
