import { FadeOnScroll } from './FadeOnScroll'
import { HOMEPAGE_TYPE_COLORS } from './colors'

interface FeatureCard {
  title: string
  body: string
  color: string
  icon: React.ReactNode
}

const FEATURES: FeatureCard[] = [
  {
    title: 'Code Snippets',
    body: 'Reusable functions, hooks, and patterns in any language — syntax-highlighted and instantly searchable.',
    color: HOMEPAGE_TYPE_COLORS.snippet,
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="m8 8-4 4 4 4M16 8l4 4-4 4M14 4l-4 16"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: 'AI Prompts',
    body: 'Save and refine the prompts that actually work. System messages, role configs, and reusable templates.',
    color: HOMEPAGE_TYPE_COLORS.prompt,
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M9.94 14.06 5 19m11-4-5.94-5.94M3 21l3-3M14 3l-3 3m10 1-3 3m-2 8 3-3m-9-7L8 9"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: 'Instant Search',
    body: 'Hit ⌘K and fuzzy-search across every title, body, tag, and type. Find what you saved in milliseconds.',
    color: HOMEPAGE_TYPE_COLORS.link,
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
        <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Commands',
    body: 'Stop digging through bash history. Keep your gnarliest one-liners next to a copy button.',
    color: HOMEPAGE_TYPE_COLORS.command,
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="m4 7 4 4-4 4m6 1h10"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: 'Files & Docs',
    body: 'Drop in PDFs, markdown, JSON, configs, and design references. All securely stored and downloadable.',
    color: HOMEPAGE_TYPE_COLORS.file,
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Collections',
    body: 'Group anything by project, topic, or workflow. An item can belong to as many collections as you like.',
    color: HOMEPAGE_TYPE_COLORS.note,
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
]

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-[1180px] px-6 py-20 sm:py-24">
      <FadeOnScroll className="mx-auto mb-12 max-w-[720px] text-center">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6f7689]">
          What you can stash
        </p>
        <h2 className="mb-3 text-[clamp(1.6rem,2.6vw,2.2rem)] font-bold tracking-tight text-white">
          Everything you&apos;d otherwise scatter
        </h2>
        <p className="text-base text-[#aab1c2]">
          One unified hub for every kind of knowledge a developer accumulates.
        </p>
      </FadeOnScroll>

      <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <FadeOnScroll
            key={f.title}
            as="article"
            className="group relative overflow-hidden rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.008))] p-[22px] transition-[transform,border-color] hover:-translate-y-[3px]"
          >
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-[3px]"
              style={{ background: f.color }}
            />
            <span
              aria-hidden="true"
              className="mb-4 grid h-10 w-10 place-items-center rounded-[10px] [&_svg]:h-[22px] [&_svg]:w-[22px]"
              style={{ background: `${f.color}29`, color: f.color }}
            >
              {f.icon}
            </span>
            <h3 className="mb-2 text-[1.05rem] font-semibold text-white">{f.title}</h3>
            <p className="text-[0.95rem] text-[#aab1c2]">{f.body}</p>
          </FadeOnScroll>
        ))}
      </div>
    </section>
  )
}
