'use client'

import { X } from 'lucide-react'
import { Sidebar } from './Sidebar'

interface SidebarDrawerProps {
  open: boolean
  onClose: () => void
}

export function SidebarDrawer({ open, onClose }: SidebarDrawerProps) {
  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 md:hidden"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 md:hidden">
        <div className="relative flex h-full flex-col">
          <Sidebar collapsed={false} onToggle={onClose} />
        </div>
      </div>
    </>
  )
}
