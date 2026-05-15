'use client'

import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

export function BillingToast() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const status = searchParams.get('checkout')
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    if (status !== 'success' && status !== 'cancelled') return
    fired.current = true

    if (status === 'success') {
      toast.success('Processing your subscription…')
      const t = setTimeout(() => router.refresh(), 3000)
      router.replace('/settings')
      return () => clearTimeout(t)
    }

    toast.message('Checkout cancelled')
    router.replace('/settings')
  }, [status, router])

  return null
}
