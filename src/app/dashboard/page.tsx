'use client'

import { useState, useEffect } from 'react'
import { Menu, PanelLeft, PanelLeftClose, Plus, FolderPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { SidebarDrawer } from '@/components/sidebar/SidebarDrawer'
import { CollectionCard } from '@/components/collections/CollectionCard'
import { PinnedItem } from '@/components/items/PinnedItem'
import { mockCollections, mockPinnedItems } from '@/lib/mock-data'

export default function Dashboard() {
  const [mounted, setMounted] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved !== null) {
      setCollapsed(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsed))
    }
  }, [collapsed, mounted])

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
              <Input
                placeholder="Search items..."
                className="w-full"
              />
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
          <Sidebar collapsed={collapsed} onToggle={handleToggle} />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="mt-1 text-muted-foreground">
              Your developer knowledge hub
            </p>
          </div>

          {/* Collections Section */}
          <section className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Collections</h2>
              <button className="text-sm text-muted-foreground hover:text-foreground">
                View all
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mockCollections.map((collection) => (
                <CollectionCard
                  key={collection.id}
                  id={collection.id}
                  name={collection.name}
                  description={collection.description}
                  itemCount={collection.itemCount}
                  typeIcons={collection.typeIcons}
                  isFavorite={collection.isFavorite}
                  defaultTypeId={collection.defaultTypeId}
                />
              ))}
            </div>
          </section>

          {/* Pinned Section */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <h2 className="text-lg font-semibold">Pinned</h2>
            </div>
            <div className="space-y-3">
              {mockPinnedItems.map((item) => (
                <PinnedItem
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  description={item.description}
                  itemTypeId={item.itemTypeId}
                  isFavorite={item.isFavorite}
                  tags={item.tags}
                  createdAt={item.createdAt}
                />
              ))}
            </div>
          </section>
        </main>
      </div>

      {/* Mobile Drawer */}
      <SidebarDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}
