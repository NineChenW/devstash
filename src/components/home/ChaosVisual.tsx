'use client'

import { useEffect, useRef } from 'react'

interface ChaosIcon {
  name: string
  bg: string
  fg: string
  svg: string
}

const ICONS: ChaosIcon[] = [
  {
    name: 'Notion',
    bg: '#ffffff',
    fg: '#000',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5.1 4.2 18.5 3c1-.1 1.5.2 1.7 1.1l.7 13.3c0 .7-.3 1.1-1.1 1.2l-12.6 1c-.7 0-1.2-.2-1.5-.7L3 14.8c-.3-.5-.4-.9-.4-1.3l.4-8.4C3 4.4 4 4.3 5.1 4.2Zm7.7 4.4L9 8.9v4.7l1.6.4V10l3.2 4.7 1.4-.1V8.7l-1.4.1v3.5L9.6 8.4 7.9 8.5l-.1.3 1.7.5"/></svg>`,
  },
  {
    name: 'GitHub',
    bg: '#181717',
    fg: '#fff',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.6 2 12.3c0 4.5 2.9 8.4 6.8 9.7.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.2-3.4-1.2-.5-1.2-1.1-1.5-1.1-1.5-1-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1A9.4 9.4 0 0 1 12 7c.9 0 1.7.1 2.6.3 1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5 4-1.3 6.8-5.2 6.8-9.7C22 6.6 17.5 2 12 2Z"/></svg>`,
  },
  {
    name: 'Slack',
    bg: '#4a154b',
    fg: '#fff',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5.2 14.6a2 2 0 1 1-2 2v-2h2Zm1 0a2 2 0 1 1 4 0v5a2 2 0 0 1-4 0v-5ZM9.2 5.2a2 2 0 1 1 2-2v2h-2Zm0 1a2 2 0 1 1 0 4h-5a2 2 0 0 1 0-4h5ZM18.6 9.2a2 2 0 1 1 2 2h-2v-2Zm-1 0a2 2 0 1 1-4 0v-5a2 2 0 0 1 4 0v5ZM14.6 18.6a2 2 0 1 1-2 2v-2h2Zm0-1a2 2 0 1 1 0-4h5a2 2 0 0 1 0 4h-5Z"/></svg>`,
  },
  {
    name: 'VS Code',
    bg: '#007acc',
    fg: '#fff',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.4 2.3a1.5 1.5 0 0 1 .9.2L22 4.4c.4.2.7.6.7 1v13.2c0 .4-.3.8-.7 1l-3.7 1.9a1.5 1.5 0 0 1-1.7-.3L4 9 8 5.6l9 7.4V3.5L17.4 2.3ZM17 9l-4.1 3 4.1 3V9Z"/></svg>`,
  },
  {
    name: 'Tabs',
    bg: '#1a1a1a',
    fg: '#a78bfa',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="6" width="14" height="14" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v12"/></svg>`,
  },
  {
    name: 'Terminal',
    bg: '#1e1e1e',
    fg: '#22c55e',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3M13 15h4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
  {
    name: 'Text file',
    bg: '#f8fafc',
    fg: '#0f172a',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z"/><path d="M14 3v6h6M8 13h8M8 17h6" stroke-linecap="round"/></svg>`,
  },
  {
    name: 'Bookmark',
    bg: '#7c2d12',
    fg: '#fb923c',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z"/></svg>`,
  },
]

const ICON_SIZE = 44
const PAD = 10
const REPEL_RADIUS = 90
const REPEL_STRENGTH = 0.55
const FRICTION = 0.998
const TARGET_SPEED = 0.45

export function ChaosVisual() {
  const boxRef = useRef<HTMLDivElement | null>(null)
  const iconRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const box = boxRef.current
    if (!box) return

    const state = ICONS.map(() => ({
      x: 0,
      y: 0,
      vx: (Math.random() - 0.5) * 0.7,
      vy: (Math.random() - 0.5) * 0.7,
      rot: Math.random() * 360,
      rotV: (Math.random() - 0.5) * 0.4,
      pulse: Math.random() * Math.PI * 2,
    }))

    let boxW = 0
    let boxH = 0
    const layout = () => {
      const rect = box.getBoundingClientRect()
      boxW = rect.width
      boxH = rect.height
      for (const s of state) {
        if (s.x === 0 && s.y === 0) {
          s.x = PAD + Math.random() * Math.max(0, boxW - ICON_SIZE - PAD * 2)
          s.y = PAD + Math.random() * Math.max(0, boxH - ICON_SIZE - PAD * 2)
        } else {
          s.x = Math.max(PAD, Math.min(s.x, boxW - ICON_SIZE - PAD))
          s.y = Math.max(PAD, Math.min(s.y, boxH - ICON_SIZE - PAD))
        }
      }
    }
    layout()
    window.addEventListener('resize', layout)

    let mouseX = -9999
    let mouseY = -9999
    const onMove = (e: MouseEvent) => {
      const r = box.getBoundingClientRect()
      mouseX = e.clientX - r.left
      mouseY = e.clientY - r.top
    }
    const onLeave = () => {
      mouseX = -9999
      mouseY = -9999
    }
    box.addEventListener('mousemove', onMove)
    box.addEventListener('mouseleave', onLeave)

    let inView = true
    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              inView = entries[0]?.isIntersecting ?? true
            },
            { threshold: 0 },
          )
        : null
    io?.observe(box)

    let last = performance.now()
    let rafId = 0

    const tick = (now: number) => {
      const dt = Math.min(40, now - last)
      last = now

      if (!inView) {
        rafId = requestAnimationFrame(tick)
        return
      }

      for (let i = 0; i < state.length; i++) {
        const s = state[i]
        const cx = s.x + ICON_SIZE / 2
        const cy = s.y + ICON_SIZE / 2

        const dx = cx - mouseX
        const dy = cy - mouseY
        const distSq = dx * dx + dy * dy
        if (distSq < REPEL_RADIUS * REPEL_RADIUS && distSq > 1) {
          const dist = Math.sqrt(distSq)
          const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH
          s.vx += (dx / dist) * force
          s.vy += (dy / dist) * force
        }

        const speed = Math.hypot(s.vx, s.vy)
        if (speed < 0.08) {
          const ang = Math.random() * Math.PI * 2
          s.vx += Math.cos(ang) * 0.08
          s.vy += Math.sin(ang) * 0.08
        }
        if (speed > 2.5) {
          s.vx *= 2.5 / speed
          s.vy *= 2.5 / speed
        }

        const k = dt / 16.67
        s.x += s.vx * k * TARGET_SPEED * 2
        s.y += s.vy * k * TARGET_SPEED * 2
        s.vx *= FRICTION
        s.vy *= FRICTION
        s.rot += s.rotV * k
        s.pulse += 0.04 * k

        const maxX = boxW - ICON_SIZE - PAD
        const maxY = boxH - ICON_SIZE - PAD
        if (s.x < PAD) {
          s.x = PAD
          s.vx = Math.abs(s.vx)
        } else if (s.x > maxX) {
          s.x = maxX
          s.vx = -Math.abs(s.vx)
        }
        if (s.y < PAD) {
          s.y = PAD
          s.vy = Math.abs(s.vy)
        } else if (s.y > maxY) {
          s.y = maxY
          s.vy = -Math.abs(s.vy)
        }

        const scale = 1 + Math.sin(s.pulse) * 0.05
        const node = iconRefs.current[i]
        if (node) {
          node.style.transform = `translate3d(${s.x}px, ${s.y}px, 0) rotate(${s.rot}deg) scale(${scale})`
        }
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', layout)
      box.removeEventListener('mousemove', onMove)
      box.removeEventListener('mouseleave', onLeave)
      io?.disconnect()
    }
  }, [])

  return (
    <div
      ref={boxRef}
      aria-hidden="true"
      className="relative h-[280px] overflow-hidden rounded-2xl border border-dashed border-white/8 sm:h-[360px]"
      style={{
        background:
          'radial-gradient(circle at 40% 30%, rgba(236,72,153,0.08), transparent 60%), radial-gradient(circle at 70% 80%, rgba(99,102,241,0.08), transparent 60%), #0d1117',
      }}
    >
      {ICONS.map((icon, i) => (
        <div
          key={icon.name}
          ref={(el) => {
            iconRefs.current[i] = el
          }}
          className="absolute left-0 top-0 grid h-11 w-11 place-items-center rounded-xl border border-white/8 text-white shadow-[0_1px_2px_rgba(0,0,0,0.3)] will-change-transform [&_svg]:h-6 [&_svg]:w-6"
          style={{ background: icon.bg, color: icon.fg }}
          dangerouslySetInnerHTML={{ __html: icon.svg }}
        />
      ))}
    </div>
  )
}
