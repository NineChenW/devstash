'use client'

import { useState, useEffect } from 'react'
import { Menu, PanelLeft, PanelLeftClose, Plus, FolderPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { SidebarDrawer } from '@/components/sidebar/SidebarDrawer'
import type { SidebarUserData } from '@/components/sidebar/SidebarUser'
import type { ItemTypeWithCount } from '@/lib/db/items'
import type { CollectionWithTypes } from '@/lib/db/collections'

interface DashboardShellProps {
  children: React.ReactNode
  itemTypes: ItemTypeWithCount[]
  sidebarCollections: CollectionWithTypes[]
  user: SidebarUserData | null
}

export function DashboardShell({ children, itemTypes, sidebarCollections, user }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved)
        if (typeof parsed === 'boolean') {
          setCollapsed(parsed)
        }
      } catch {
        // ignore malformed localStorage value
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsed))
  }, [collapsed])

  const handleToggle = () => {
    setCollapsed(!collapsed)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="border-b">
        <div className="flex h-16 items-center px-4">
          <div className="flex flex-1 items-center gap-4">
            {/* Drawer toggle for mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Sidebar collapse toggle for desktop */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex"
              onClick={handleToggle}
            >
              {collapsed ? (
                <PanelLeft className="h-5 w-5" />
              ) : (
                <PanelLeftClose className="h-5 w-5" />
              )}
            </Button>

            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Input placeholder="Search items..." className="w-full" />
              <kbd className="pointer-events-none absolute right-2 top-1/2 flex h-5 items-center gap-1 rounded border bg-muted px-1.5 text-xs text-muted-foreground -translate-y-1/2">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <FolderPlus className="mr-2 h-4 w-4" />
              New Collection
            </Button>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Item
            </Button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar collapsed={collapsed} itemTypes={itemTypes} collections={sidebarCollections} user={user} />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      {/* Mobile Drawer */}
      <SidebarDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        itemTypes={itemTypes}
        collections={sidebarCollections}
        user={user}
      />
    </div>
  )
}
