'use client'

import { Sidebar } from './Sidebar'
import type { SidebarUserData } from './SidebarUser'
import type { ItemTypeWithCount } from '@/lib/db/items'
import type { CollectionWithTypes } from '@/lib/db/collections'

interface SidebarDrawerProps {
  open: boolean
  onClose: () => void
  itemTypes: ItemTypeWithCount[]
  collections: CollectionWithTypes[]
  user: SidebarUserData | null
}

export function SidebarDrawer({ open, onClose, itemTypes, collections, user }: SidebarDrawerProps) {
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
          <Sidebar collapsed={false} itemTypes={itemTypes} collections={collections} user={user} />
        </div>
      </div>
    </>
  )
}
