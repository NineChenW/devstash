'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Logo } from './Logo'

export function HomeNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={
        'fixed inset-x-0 top-0 z-50 backdrop-blur-md transition-[background-color,border-color] duration-200 ' +
        (scrolled
          ? 'border-b border-white/10 bg-[rgba(7,9,15,0.85)]'
          : 'border-b border-transparent bg-[rgba(7,9,15,0.35)]')
      }
    >
      <div className="mx-auto flex max-w-[1180px] items-center gap-6 px-6 py-3.5">
        <Logo />

        <ul className="ml-4 hidden flex-1 gap-7 sm:flex" role="list">
          <li>
            <a
              href="#features"
              className="text-sm font-medium text-[#aab1c2] transition-colors hover:text-white"
            >
              Features
            </a>
          </li>
          <li>
            <a
              href="#pricing"
              className="text-sm font-medium text-[#aab1c2] transition-colors hover:text-white"
            >
              Pricing
            </a>
          </li>
        </ul>

        <div className="ml-auto flex items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-[#aab1c2] hover:bg-white/5 hover:text-white"
          >
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="border-0 text-white shadow-[0_4px_16px_rgba(99,102,241,0.45)] hover:opacity-90"
            style={{ background: 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)' }}
          >
            <Link href="/register">Get started</Link>
          </Button>
        </div>
      </div>
    </nav>
  )
}
