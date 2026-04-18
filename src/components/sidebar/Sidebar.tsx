'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  Link as LinkIcon,
  File,
  Image as ImageIcon,
  Star,
  FolderOpen,
  ChevronDown,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { mockUser } from '@/lib/mock-data'
import { Badge } from '@/components/ui/badge'
import type { ItemTypeWithCount } from '@/lib/db/items'
import type { CollectionWithTypes } from '@/lib/db/collections'

const PRO_TYPES = new Set(['file', 'image'])

interface SidebarProps {
  collapsed: boolean
  itemTypes: ItemTypeWithCount[]
  collections: CollectionWithTypes[]
}

const iconMap: Record<string, React.ElementType> = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  Link: LinkIcon,
  File,
  Image: ImageIcon,
}

export function Sidebar({ collapsed, itemTypes, collections }: SidebarProps) {
  const pathname = usePathname()
  const [collectionsOpen, setCollectionsOpen] = useState(true)

  const favoriteCollections = collections.filter((c) => c.isFavorite)
  const recentCollections = collections.filter((c) => !c.isFavorite)

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r bg-card transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
          <FolderOpen className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <span className="text-lg font-semibold">DevStash</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {/* Item Types */}
        <div className="mb-4 px-3">
          {!collapsed && (
            <button className="mb-2 flex w-full items-center justify-between px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
              <span>Types</span>
              <ChevronDown className="h-3 w-3" />
            </button>
          )}
          <nav className="space-y-0.5">
            {itemTypes.map((type) => {
              const Icon = iconMap[type.icon] || Code
              const href = `/items/${type.name}s`
              const isActive = pathname === href
              const isPro = PRO_TYPES.has(type.name)

              return (
                <Link
                  key={type.id}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    collapsed && 'justify-center'
                  )}
                  title={collapsed ? type.name : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" style={{ color: type.color }} />
                  {!collapsed && (
                    <>
                      <span className="truncate">{type.name.charAt(0).toUpperCase() + type.name.slice(1)}s</span>
                      {isPro && (
                        <Badge
                          variant="outline"
                          className="h-4 border-muted-foreground/30 px-1 py-0 text-[9px] font-semibold tracking-wider text-muted-foreground"
                        >
                          PRO
                        </Badge>
                      )}
                      <span className="ml-auto text-xs text-muted-foreground">{type.count}</span>
                    </>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Collections Section */}
        <div className="px-3">
          {!collapsed && (
            <button
              className="mb-2 flex w-full items-center justify-between px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
              onClick={() => setCollectionsOpen((prev) => !prev)}
            >
              <span>Collections</span>
              <ChevronDown
                className={cn('h-3 w-3 transition-transform duration-200', !collectionsOpen && '-rotate-90')}
              />
            </button>
          )}

          {collectionsOpen && (
            <>
              {/* Favorites */}
              {favoriteCollections.length > 0 && (
                <div className="mb-4">
                  {!collapsed && (
                    <h3 className="mb-1 px-2 text-xs font-medium text-muted-foreground">
                      Favorites
                    </h3>
                  )}
                  <nav className="space-y-0.5">
                    {favoriteCollections.map((collection) => (
                      <Link
                        key={collection.id}
                        href={`/collections/${collection.id}`}
                        className={cn(
                          'flex items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors',
                          collapsed ? 'justify-center' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                        title={collapsed ? collection.name : undefined}
                      >
                        <FolderOpen className="h-4 w-4 shrink-0" />
                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate">{collection.name}</span>
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          </>
                        )}
                      </Link>
                    ))}
                  </nav>
                </div>
              )}

              {/* Recents */}
              {recentCollections.length > 0 && (
                <div>
                  {!collapsed && (
                    <h3 className="mb-1 px-2 text-xs font-medium text-muted-foreground">
                      Recents
                    </h3>
                  )}
                  <nav className="space-y-0.5">
                    {recentCollections.map((collection) => (
                      <Link
                        key={collection.id}
                        href={`/collections/${collection.id}`}
                        className={cn(
                          'flex items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors',
                          collapsed ? 'justify-center' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                        title={collapsed ? collection.name : undefined}
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: collection.dominantColor }}
                        />
                        {!collapsed && (
                          <span className="flex-1 truncate">{collection.name}</span>
                        )}
                      </Link>
                    ))}
                  </nav>
                </div>
              )}

              {/* View all collections */}
              {!collapsed && (
                <Link
                  href="/collections"
                  className="mt-2 flex items-center gap-3 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <span className="flex-1 truncate">View all collections</span>
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      {/* User Avatar Area */}
      <div className="border-t p-3">
        <div
          className={cn(
            'flex items-center gap-3 rounded-md px-2 py-2',
            collapsed && 'justify-center'
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
            <span className="text-sm font-semibold">
              {mockUser.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </span>
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{mockUser.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {mockUser.email}
                </p>
              </div>
              <button className="shrink-0 text-muted-foreground hover:text-foreground">
                <Settings className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
