import { FadeOnScroll } from './FadeOnScroll'

interface AICheck {
  title: string
  body: string
}

const CHECKLIST: AICheck[] = [
  { title: 'Auto-tagging', body: 'Suggested tags based on the content of any item.' },
  { title: 'AI summaries', body: 'Plain-language summaries for long notes or files.' },
  { title: 'Explain this code', body: 'Step-by-step walkthroughs of any snippet you save.' },
  { title: 'Prompt optimiser', body: "Refines and improves the prompts you've stashed." },
]

const TAG_CHIPS = ['react', 'hook', 'typescript', 'debounce', 'performance']

export function AISection() {
  return (
    <section
      className="bg-[linear-gradient(180deg,rgba(99,102,241,0.04),transparent_80%)]"
    >
      <div className="mx-auto grid max-w-[1180px] items-center gap-8 px-6 py-20 sm:py-24 lg:grid-cols-2 lg:gap-14">
        <FadeOnScroll className="ai-copy">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]"
            style={{
              background:
                'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(236,72,153,0.2))',
              borderColor: 'rgba(245,158,11,0.35)',
              color: '#f59e0b',
            }}
          >
            Pro feature
          </span>
          <h2 className="my-4 text-[clamp(1.6rem,2.6vw,2.2rem)] font-bold tracking-tight text-white">
            Your knowledge, supercharged by AI
          </h2>
          <p className="text-base text-[#aab1c2]">
            Let GPT-4o handle the busywork. DevStash AI reads your content and suggests tags,
            summaries, explanations, and refinements — so you spend less time organising and more
            time building.
          </p>
          <ul className="mt-6 grid gap-3.5" role="list">
            {CHECKLIST.map((c) => (
              <li key={c.title} className="grid grid-cols-[22px_1fr] items-start gap-3">
                <span
                  aria-hidden="true"
                  className="grid h-[22px] w-[22px] place-items-center rounded-full text-[13px] font-bold"
                  style={{ background: 'rgba(59,130,246,0.24)', color: '#3b82f6' }}
                >
                  ✓
                </span>
                <div>
                  <strong className="mb-0.5 block text-[0.98rem] text-white">{c.title}</strong>
                  <p className="text-[0.92rem] text-[#aab1c2]">{c.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </FadeOnScroll>

        <FadeOnScroll
          className="overflow-hidden rounded-2xl border border-white/8 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)]"
          aria-hidden="true"
        >
          <div
            className="flex items-center gap-2 border-b border-white/8 px-3.5 py-3"
            style={{ background: '#1a2236' }}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            <span className="ml-2 font-mono text-xs text-[#6f7689]">useDebounce.ts</span>
          </div>
          <pre
            className="m-0 overflow-x-auto p-[18px] font-mono text-[12.5px] leading-[1.7] text-[#e6e8ee]"
            style={{ background: '#0c1322' }}
          >
            <code>
              <span style={{ color: '#5d6b85', fontStyle: 'italic' }}>{'// Hook to debounce a value'}</span>{'\n'}
              <span style={{ color: '#c084fc' }}>import</span>{' '}
              {'{ useEffect, useState }'}{' '}
              <span style={{ color: '#c084fc' }}>from</span>{' '}
              <span style={{ color: '#34d399' }}>{'"react"'}</span>;{'\n\n'}
              <span style={{ color: '#c084fc' }}>export function</span>{' '}
              <span style={{ color: '#60a5fa' }}>useDebounce</span>
              {'<T>(value: T, ms = '}
              <span style={{ color: '#fbbf24' }}>300</span>
              {') {\n  '}
              <span style={{ color: '#c084fc' }}>const</span>
              {' [v, setV] = useState(value);\n  useEffect(() => {\n    '}
              <span style={{ color: '#c084fc' }}>const</span>
              {' id = setTimeout(() => setV(value), ms);\n    '}
              <span style={{ color: '#c084fc' }}>return</span>
              {' () => clearTimeout(id);\n  }, [value, ms]);\n  '}
              <span style={{ color: '#c084fc' }}>return</span>
              {' v;\n}'}
            </code>
          </pre>
          <div
            className="border-t border-white/8 px-[18px] pb-[18px] pt-3.5"
            style={{ background: 'rgba(255,255,255,0.015)' }}
          >
            <span className="mb-2.5 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] text-[#f59e0b]">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-[13px] w-[13px]">
                <path
                  d="M3 12 12 3l9 9-9 9-9-9Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <circle cx="8.5" cy="8.5" r="1.25" fill="currentColor" />
              </svg>
              AI generated tags
            </span>
            <div className="flex flex-wrap gap-1.5">
              {TAG_CHIPS.map((t) => (
                <span
                  key={t}
                  className="rounded-full border px-2.5 py-1 font-mono text-[11.5px]"
                  style={{
                    background: 'rgba(245,158,11,0.14)',
                    borderColor: 'rgba(245,158,11,0.3)',
                    color: '#fbbf24',
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </FadeOnScroll>
      </div>
    </section>
  )
}
