'use client'

import { useEffect, useState } from 'react'
import { Menu, PanelLeft, PanelLeftClose } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { SidebarDrawer } from '@/components/sidebar/SidebarDrawer'
import { ItemDrawerProvider } from '@/components/items/ItemDrawerContext'
import { CreateItemProvider } from '@/components/items/CreateItemContext'
import { TopBarNewItemButton } from '@/components/items/TopBarNewItemButton'
import { CreateCollectionProvider } from '@/components/collections/CreateCollectionContext'
import { TopBarNewCollectionButton } from '@/components/collections/TopBarNewCollectionButton'
import { FavoritesNavButton } from '@/components/favorites/FavoritesNavButton'
import { UpgradeNavButton } from '@/components/billing/UpgradeNavButton'
import { CommandPaletteProvider } from '@/components/search/CommandPaletteContext'
import { SearchTrigger } from '@/components/search/SearchTrigger'
import { EditorPreferencesProvider } from '@/components/settings/EditorPreferencesContext'
import type { SidebarUserData } from '@/components/sidebar/SidebarUser'
import type { ItemTypeWithCount } from '@/lib/db/items'
import type { CollectionWithTypes } from '@/lib/db/collections'
import {
  DEFAULT_EDITOR_PREFERENCES,
  type EditorPreferences,
} from '@/lib/validations/editor-preferences'

interface DashboardShellProps {
  children: React.ReactNode
  itemTypes: ItemTypeWithCount[]
  sidebarCollections: CollectionWithTypes[]
  user: SidebarUserData | null
  editorPreferences?: EditorPreferences
  userIsPro?: boolean
}

export function DashboardShell({
  children,
  itemTypes,
  sidebarCollections,
  user,
  editorPreferences = DEFAULT_EDITOR_PREFERENCES,
  userIsPro = false,
}: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    const saved = window.localStorage.getItem('sidebar-collapsed')
    if (saved === null) return false
    try {
      const parsed = JSON.parse(saved)
      return typeof parsed === 'boolean' ? parsed : false
    } catch {
      return false
    }
  })
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsed))
  }, [collapsed])

  const handleToggle = () => {
    setCollapsed(!collapsed)
  }

  return (
    <div className="min-h-screen bg-background">
     <EditorPreferencesProvider initial={editorPreferences}>
      <ItemDrawerProvider>
       <CommandPaletteProvider>
        <CreateItemProvider userIsPro={userIsPro}>
         <CreateCollectionProvider>
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
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>

                {/* Sidebar collapse toggle for desktop */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:flex"
                  onClick={handleToggle}
                  aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  {collapsed ? (
                    <PanelLeft className="h-5 w-5" />
                  ) : (
                    <PanelLeftClose className="h-5 w-5" />
                  )}
                </Button>

                {/* Search */}
                <div className="flex-1 max-w-md">
                  <SearchTrigger />
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!userIsPro && <UpgradeNavButton />}
                <FavoritesNavButton className="hidden sm:inline-flex" />
                <TopBarNewCollectionButton />
                <TopBarNewItemButton />
              </div>
            </div>
          </header>

          {/* Main Layout */}
          <div className="flex h-[calc(100vh-4rem)]">
            {/* Desktop Sidebar */}
            <div className="hidden md:block">
              <Sidebar
                collapsed={collapsed}
                itemTypes={itemTypes}
                collections={sidebarCollections}
                user={user}
                userIsPro={userIsPro}
              />
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
            userIsPro={userIsPro}
          />
         </CreateCollectionProvider>
        </CreateItemProvider>
       </CommandPaletteProvider>
      </ItemDrawerProvider>
     </EditorPreferencesProvider>
    </div>
  )
}
