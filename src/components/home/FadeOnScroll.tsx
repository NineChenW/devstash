'use client'

import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from 'react'

type FadeTag = 'div' | 'section' | 'article' | 'header' | 'footer'

interface FadeOnScrollProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  children: ReactNode
  className?: string
  as?: FadeTag
}

export function FadeOnScroll({
  children,
  className = '',
  as: Tag = 'div',
  ...rest
}: FadeOnScrollProps) {
  const ref = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            io.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [])

  const base =
    'transition-[opacity,transform] duration-[600ms] ease-out will-change-[opacity,transform]'
  const state = visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3.5'

  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`${base} ${state} ${className}`.trim()}
      data-fade-on-scroll
      {...rest}
    >
      {children}
    </Tag>
  )
}
