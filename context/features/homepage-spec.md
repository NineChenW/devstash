# Homepage Spec

## Overview

Port the static `prototypes/homepage/` mockup into the live Next.js app at `/`, replacing the current landing splash. Keep the same visual design — nav, hero with chaos→order visual, features grid, AI section, pricing with monthly/yearly toggle, CTA, footer — and convert it to React/Tailwind/ShadCN, with all interactive pieces split into client components.

## Requirements

### Routing & file layout

- Replace `src/app/page.tsx` (currently a landing splash) with the new homepage. Public route, no auth gate.
- Add a `src/components/home/` folder for homepage-specific components. Co-locate everything related to the homepage there.
- The homepage page file itself stays a **server component** — it just composes child components.

### Server vs client components

Server components (no `'use client'`):
- `HomePage` (the route itself)
- `Hero` (text + CTAs, hosts the client `ChaosVisual`)
- `Features` (static grid of 6 feature cards)
- `AISection` (static two-column block, including the code-editor mockup)
- `FinalCTA`
- `Footer` (with the current year computed server-side via `new Date().getFullYear()` — no client effect needed)

Client components (`'use client'`):
- `HomeNav` — owns the scroll listener that ramps background opacity past ~12px scrolled
- `ChaosVisual` — the rAF physics animation for the 8 floating icons, including mouse-repel and `IntersectionObserver` pause-when-offscreen
- `PricingSection` — owns the monthly/yearly toggle state (Pro price + period swap, yearly note visibility)
- `FadeOnScroll` — generic wrapper using `IntersectionObserver` to add a `is-visible` class when the child enters the viewport. Used inline anywhere the prototype has `data-fade`.

### Styling

- Use Tailwind CSS v4 utility classes throughout — no new CSS files.
- For per-type accents (snippet `#3b82f6`, prompt `#f59e0b`, command `#06b6d4`, note `#22c55e`, file `#64748b`, image `#ec4899`, link/url `#6366f1`), reuse `CREATE_TYPE_META` from `src/lib/item-type-meta.ts` where possible. If a color is needed that isn't in that map (e.g. file/image use the same hex values, link uses indigo not emerald), define a small local `HOMEPAGE_TYPE_COLORS` const inside the homepage folder rather than hardcoding hex strings inline.
- For background gradients, hero gradient text, button gradients, Pro card glow, etc., use inline `style={{ background: ... }}` or arbitrary Tailwind values (e.g. `bg-[linear-gradient(...)]`) — the project doesn't wire `@theme` so utility classes like `bg-primary` will be transparent.
- Use ShadCN `Button` (already in `src/components/ui/button.tsx`) for the nav and CTA buttons. Map prototype variants:
  - `btn-primary` → custom indigo gradient via inline style on `<Button>`
  - `btn-outline` → `<Button variant="outline">`
  - `btn-ghost` → `<Button variant="ghost">`
  - `btn-lg` → `size="lg"`

### Links and CTAs

All anchor destinations:
- Nav "Sign in" → `/sign-in`
- Nav "Get started" → `/register`
- Hero "Get started — it's free" → `/register`
- Hero "See features" → `#features` (in-page anchor)
- Nav "Features" → `#features`
- Nav "Pricing" → `#pricing`
- Free plan "Start free" → `/register`
- Pro plan "Upgrade to Pro" → `/register` (Stripe isn't wired yet; route to register and gate the upsell after sign-up)
- Final CTA "Get started — it's free" → `/register`
- Logo (nav + footer) → `/`
- Footer "Features" / "Pricing" → `#features` / `#pricing`
- Footer Changelog / Roadmap / Docs / Guides / Templates / API / About / Contact / Privacy / Terms → `#` placeholders (these pages don't exist yet — leave as `#` rather than inventing routes)

Use Next.js `<Link>` for internal routes, plain `<a>` for in-page anchors.

### Chaos icons (`ChaosVisual`)

- Port the rAF physics loop, mouse-repel math, wall-bounce, gentle drift normalization, and pulse scale from `prototypes/homepage/script.js` more or less verbatim.
- Inline the 8 icon SVGs (Notion, GitHub, Slack, VS Code, Tabs, Terminal, Text file, Bookmark) as a `const ICONS` array inside the component — same shape as the prototype (`{ name, bg, fg, svg }`).
- Render the 8 icon nodes with `ref={(el) => { iconRefs.current[i] = el }}` so the rAF loop can read DOM via refs and mutate `style.transform` directly (don't drive position through React state — every frame would re-render the world).
- Per-icon state (`x, y, vx, vy, rot, rotV, pulse`) lives in a `useRef` array, also outside React state.
- `useEffect` mounts the rAF loop, the resize listener, the mousemove/mouseleave listeners on the chaos box, and an `IntersectionObserver` that pauses the loop when offscreen. Clean up all of these on unmount (`cancelAnimationFrame`, `removeEventListener`, `observer.disconnect()`).
- Style chaos card / dashboard card / arrow with Tailwind + inline gradients.

### Dashboard mock (inside `Hero`)

- Render as static JSX inside the hero — no DB fetching. The mock items are hardcoded display values (`useDebounce.ts`, `Code review prompt`, etc. — same as the prototype).
- Top-border color per dash item via `style={{ borderTopColor: color }}` + `borderTopWidth: 3`.

### Pricing toggle (`PricingSection`)

- Single `useState<'monthly' | 'yearly'>('monthly')`.
- Pro card price swaps `8` ↔ `6`, period swaps `/month` ↔ `/month, billed yearly`, and the yearly note (`$72 billed yearly — save $24.`) is shown only when yearly.
- Free card is static — both columns rendered inside the same `<section>` server-rendered shell, but the Pro card piece is the client island. Easiest: make the whole section a client component since the toggle controls live in the section head and need to drive Pro card state.

### Animations

- **Scroll fade-ins**: `FadeOnScroll` client component wraps anything that needs `data-fade` behavior. Initial state hidden (`opacity-0 translate-y-3.5`); when the observer fires `isIntersecting`, swap to `opacity-100 translate-y-0` with a 600ms transition. Unobserve after first show so each element only animates once.
- **Arrow pulse**: CSS `@keyframes` defined inline via Tailwind arbitrary values or a tiny `<style>` block on the component (the existing `globals.css` is shared with `.markdown-preview` etc., so prefer a scoped approach). Simpler: use Tailwind's `animate-pulse` if it looks close enough, otherwise inline the keyframes in a `<style jsx>`-style block — actually, Next.js + Tailwind v4 doesn't include `styled-jsx` by default, so add a small `@keyframes arrow-pulse` block under `@layer components` in `src/app/globals.css` (same pattern the markdown preview uses) and reference it via `animate-[arrow-pulse_2.2s_ease-in-out_infinite]`.
- **Nav scroll opacity**: in `HomeNav`, listener on `window.scroll` with `{ passive: true }`, sets `setScrolled(window.scrollY > 12)`; CSS-class swap controls the background opacity and bottom border.

### Responsive

Match the prototype's breakpoints with Tailwind responsive prefixes:
- `lg:` for the desktop layout (chaos / arrow / dashboard side-by-side, 3-col features, 2-col pricing, 2-col AI grid)
- `md:` for the 2-col features
- Default = mobile: stack chaos/arrow/dashboard vertically, single-col features, single-col pricing
- Arrow rotates 90° on mobile to point down — use `rotate-90 lg:rotate-0` on the inner SVG (the outer container is the pulsing element, rotating the SVG inside it keeps the pulse animation intact)

### Cleanup / DRY

- Reuse `Button` from ShadCN for every CTA.
- Reuse `iconMap` / `CREATE_TYPE_META` where the matching item-type icon/color is needed.
- Pull the 8 chaos icon definitions, 6 feature card definitions, and the 4 AI checklist entries into top-of-file `const` arrays and `.map()` them — don't repeat JSX.
- Footer link columns are 3 × 4 — same treatment: array of `{ heading, links: [{ label, href }] }`, then `.map`.
- One `<Section>` helper component for the consistent `max-w` + horizontal padding wrapper would be nice, but only if it actually reduces duplication across Features / AI / Pricing / CTA — don't add it speculatively.

## Notes

- The prototype's Google Fonts import (`Inter`, `JetBrains Mono`) — Inter is already the project's default; for the JetBrains Mono pieces (editor mockup, dashboard search kbd, chip text), use Tailwind's `font-mono` which the project already maps. Don't add a new Google Fonts import.
- The prototype has a stable `nav-logo` shape (gradient tile + svg + wordmark) reused in the nav and footer — extract to a small `Logo` component.
- The current `/` route shows a landing splash; check what's there now before replacing so any link that pointed at `/` (e.g. signed-out NextAuth redirects) still makes sense after the swap.
- `proxy.ts` only gates `/dashboard/*`, so `/` stays public without any auth changes.
- Out of scope: actually wiring Stripe / billing from the Pro CTA, building Changelog / Roadmap / Docs / etc. routes, dark/light theme toggle (homepage is dark-only per the prototype), SEO meta tags beyond the existing `metadata` export pattern.
- No new Vitest tests warranted — everything here is presentational (no server actions, no pure utility functions to extract). Per `coding-standards.md`, components are out of unit-test scope.
- Reference prototype: `prototypes/homepage/index.html` / `styles.css` / `script.js`.
