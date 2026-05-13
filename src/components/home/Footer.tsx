import { Logo } from './Logo'

interface FooterCol {
  heading: string
  links: { label: string; href: string }[]
}

const COLUMNS: FooterCol[] = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Changelog', href: '#' },
      { label: 'Roadmap', href: '#' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Docs', href: '#' },
      { label: 'Guides', href: '#' },
      { label: 'Templates', href: '#' },
      { label: 'API', href: '#' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Contact', href: '#' },
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' },
    ],
  },
]

export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer
      className="mt-10 border-t border-white/8 px-6 pb-7 pt-14"
      style={{ background: 'rgba(0,0,0,0.2)' }}
    >
      <div className="mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-[1.2fr_2fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-[320px] text-[0.92rem] text-[#aab1c2]">
            One fast, searchable, AI-enhanced hub for all your dev knowledge.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h4 className="mb-3.5 text-[0.8rem] uppercase tracking-[0.1em] text-[#6f7689]">
                {col.heading}
              </h4>
              <ul role="list" className="grid gap-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-[0.92rem] text-[#aab1c2] transition-colors hover:text-white"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-[1180px] border-t border-white/8 pt-5 text-center text-[0.85rem] text-[#6f7689]">
        © {year} DevStash. Built for developers, by developers.
      </div>
    </footer>
  )
}
