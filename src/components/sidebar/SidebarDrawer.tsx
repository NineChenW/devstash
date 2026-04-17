'use client'

import { Sidebar } from './Sidebar'
import type { ItemTypeWithCount } from '@/lib/db/items'
import type { CollectionWithTypes } from '@/lib/db/collections'

interface SidebarDrawerProps {
  open: boolean
  onClose: () => void
  itemTypes: ItemTypeWithCount[]
  collections: CollectionWithTypes[]
}

export function SidebarDrawer({ open, onClose, itemTypes, collections }: SidebarDrawerProps) {
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
          <Sidebar collapsed={false} itemTypes={itemTypes} collections={collections} />
        </div>
      </div>
    </>
  )
}
