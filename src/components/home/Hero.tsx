import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChaosVisual } from './ChaosVisual'
import { FadeOnScroll } from './FadeOnScroll'
import { HOMEPAGE_TYPE_COLORS } from './colors'

const HERO_BULLETS = [
  { label: 'Snippets', color: HOMEPAGE_TYPE_COLORS.snippet },
  { label: 'Prompts', color: HOMEPAGE_TYPE_COLORS.prompt },
  { label: 'Commands', color: HOMEPAGE_TYPE_COLORS.command },
  { label: 'Notes', color: HOMEPAGE_TYPE_COLORS.note },
  { label: 'Files', color: HOMEPAGE_TYPE_COLORS.file },
  { label: 'Images', color: HOMEPAGE_TYPE_COLORS.image },
  { label: 'Links', color: HOMEPAGE_TYPE_COLORS.link },
]

const SIDEBAR_TYPES = [
  { label: 'Snippets', color: HOMEPAGE_TYPE_COLORS.snippet },
  { label: 'Prompts', color: HOMEPAGE_TYPE_COLORS.prompt },
  { label: 'Commands', color: HOMEPAGE_TYPE_COLORS.command },
  { label: 'Notes', color: HOMEPAGE_TYPE_COLORS.note },
  { label: 'Links', color: HOMEPAGE_TYPE_COLORS.link },
]

const DASH_ITEMS: { title: string; meta: string; color: string }[] = [
  { title: 'useDebounce.ts', meta: 'Snippet · TS', color: HOMEPAGE_TYPE_COLORS.snippet },
  { title: 'Code review prompt', meta: 'Prompt', color: HOMEPAGE_TYPE_COLORS.prompt },
  { title: 'docker prune all', meta: 'Command', color: HOMEPAGE_TYPE_COLORS.command },
  { title: 'Sprint planning notes', meta: 'Note', color: HOMEPAGE_TYPE_COLORS.note },
  { title: 'Tailwind docs v4', meta: 'Link', color: HOMEPAGE_TYPE_COLORS.link },
  { title: 'design-system.png', meta: 'Image', color: HOMEPAGE_TYPE_COLORS.image },
]

export function Hero() {
  return (
    <header className="px-6 pb-16 pt-[120px] sm:px-6 sm:pb-20 sm:pt-[140px]">
      <div className="mx-auto grid max-w-[1180px] gap-14">
        <div className="mx-auto max-w-[820px] text-center">
          <p className="mb-4 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6f7689]">
            Developer knowledge, organised
          </p>
          <h1 className="mb-5 text-[2rem] font-extrabold leading-[1.08] tracking-tight sm:text-[clamp(2.2rem,4.6vw,3.6rem)]">
            Stop Losing Your{' '}
            <span
              className="inline bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  'linear-gradient(90deg, #6366f1 0%, #ec4899 50%, #f59e0b 100%)',
              }}
            >
              Developer Knowledge
            </span>
          </h1>
          <p className="mx-auto mb-7 max-w-[680px] text-base text-[#aab1c2] sm:text-[clamp(1rem,1.4vw,1.125rem)]">
            Your snippets live in VS Code, prompts in chat history, commands in random text files, and
            links in bookmarks. DevStash brings every piece of your developer knowledge into one fast,
            searchable, AI-enhanced hub.
          </p>
          <div className="mb-7 flex flex-wrap justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="rounded-xl border-0 text-white shadow-[0_4px_16px_rgba(99,102,241,0.45)] transition-transform hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)' }}
            >
              <Link href="/register">Get started — it&apos;s free</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-xl border-white/14 bg-transparent text-white hover:bg-white/5 hover:text-white"
            >
              <a href="#features">See features</a>
            </Button>
          </div>
          <ul className="flex flex-wrap justify-center gap-x-[22px] gap-y-[14px] text-[13px] text-[#6f7689]" role="list">
            {HERO_BULLETS.map((b) => (
              <li key={b.label}>
                <span
                  className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
                  style={{ background: b.color }}
                />
                {b.label}
              </li>
            ))}
          </ul>
        </div>

        <FadeOnScroll className="mx-auto grid w-full max-w-[1080px] items-center gap-5 lg:grid-cols-[1fr_auto_1fr] lg:gap-6">
          <div
            className="relative rounded-[22px] border border-white/8 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
            }}
            aria-labelledby="chaos-label"
          >
            <div
              id="chaos-label"
              className="absolute -top-2.5 left-4 rounded-full border border-white/8 px-2.5 py-0.5 text-[11px] uppercase tracking-[0.06em] text-[#6f7689]"
              style={{ background: '#0d1117' }}
            >
              Your knowledge today…
            </div>
            <ChaosVisual />
          </div>

          <div
            aria-hidden="true"
            className="justify-self-center grid h-20 w-20 place-items-center rounded-full animate-[arrow-pulse_2.2s_ease-in-out_infinite]"
            style={{
              background:
                'radial-gradient(circle, rgba(99,102,241,0.18), transparent 70%)',
            }}
          >
            <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 rotate-90 lg:rotate-0">
              <defs>
                <linearGradient id="arrowGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
              <path
                d="M6 32h44m0 0L36 18m14 14L36 46"
                stroke="url(#arrowGrad)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>

          <div
            className="relative rounded-[22px] border border-white/8 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
            }}
            aria-labelledby="dash-label"
          >
            <div
              id="dash-label"
              className="absolute -top-2.5 left-4 rounded-full border border-white/8 px-2.5 py-0.5 text-[11px] uppercase tracking-[0.06em] text-[#6f7689]"
              style={{ background: '#0d1117' }}
            >
              …with DevStash
            </div>
            <div
              className="grid h-[320px] grid-cols-[110px_1fr] overflow-hidden rounded-2xl border border-white/8 sm:h-[360px] sm:grid-cols-[140px_1fr]"
              style={{ background: '#0d1117' }}
              aria-hidden="true"
            >
              <div className="overflow-hidden border-r border-white/8 px-3 py-3.5 text-[11px] text-[#aab1c2]" style={{ background: 'rgba(255,255,255,0.015)' }}>
                <div className="mb-3.5 flex items-center gap-1.5 text-[12px] font-bold text-white">
                  <span
                    className="h-3.5 w-3.5 rounded"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}
                  />
                  <span>DevStash</span>
                </div>
                <div className="mb-1.5 mt-2 text-[9.5px] uppercase tracking-[0.1em] text-[#6f7689]">
                  Item types
                </div>
                <ul role="list" className="grid gap-1">
                  {SIDEBAR_TYPES.map((t) => (
                    <li key={t.label} className="flex items-center gap-1.5 rounded-md px-1.5 py-1">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: t.color }} />
                      {t.label}
                    </li>
                  ))}
                </ul>
                <div className="mb-1.5 mt-2 text-[9.5px] uppercase tracking-[0.1em] text-[#6f7689]">
                  Collections
                </div>
                <ul role="list" className="grid gap-1">
                  {['React Patterns', 'AI Workflows', 'DevOps'].map((c) => (
                    <li key={c} className="flex items-center gap-1.5 rounded-md px-1.5 py-1">
                      <span
                        className="h-2 w-2.5 rounded-sm"
                        style={{ background: HOMEPAGE_TYPE_COLORS.note, opacity: 0.8 }}
                      />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-rows-[auto_1fr] gap-2.5 overflow-hidden p-3.5" aria-hidden="true">
                <div
                  className="flex items-center gap-2 rounded-lg border border-white/8 px-2.5 py-2 text-[11px] text-[#6f7689]"
                  style={{ background: 'rgba(255,255,255,0.015)' }}
                >
                  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                  </svg>
                  <span>Search items and collections…</span>
                  <span className="ml-auto rounded border border-white/8 px-1.5 py-0.5 font-mono text-[10px]">
                    ⌘K
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 overflow-hidden">
                  {DASH_ITEMS.map((it) => (
                    <div
                      key={it.title}
                      className="grid gap-0.5 rounded-lg border border-white/8 px-3 py-2.5"
                      style={{
                        background: '#131b2a',
                        borderTopColor: it.color,
                        borderTopWidth: 3,
                      }}
                    >
                      <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[11.5px] font-semibold text-white">
                        {it.title}
                      </span>
                      <span className="text-[10px] text-[#6f7689]">{it.meta}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </FadeOnScroll>
      </div>
    </header>
  )
}
