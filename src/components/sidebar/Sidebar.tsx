'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Star,
  FolderOpen,
  ChevronDown,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { iconMap, DefaultIcon } from '@/lib/icon-map'
import { SidebarUser, type SidebarUserData } from './SidebarUser'
import type { ItemTypeWithCount } from '@/lib/db/items'
import type { CollectionWithTypes } from '@/lib/db/collections'

const PRO_TYPES = new Set(['file', 'image'])

interface SidebarProps {
  collapsed: boolean
  itemTypes: ItemTypeWithCount[]
  collections: CollectionWithTypes[]
  user: SidebarUserData | null
  userIsPro?: boolean
}

export function Sidebar({
  collapsed,
  itemTypes,
  collections,
  user,
  userIsPro = false,
}: SidebarProps) {
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
      <div className="flex h-16 items-center border-b px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-md transition-opacity hover:opacity-80"
          title="Back to dashboard"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
            <FolderOpen className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <span className="text-lg font-semibold">DevStash</span>
          )}
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {/* Favorites */}
        <div className="mb-4 px-3">
          <Link
            href="/favorites"
            className={cn(
              'flex items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              pathname === '/favorites'
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              collapsed && 'justify-center'
            )}
            title={collapsed ? 'Favorites' : undefined}
            aria-label={collapsed ? 'Favorites' : undefined}
          >
            <Star className="h-4 w-4 shrink-0 text-amber-400" />
            {!collapsed && <span className="truncate">Favorites</span>}
          </Link>
        </div>

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
              const Icon = iconMap[type.icon] || DefaultIcon
              const href = `/items/${type.name}s`
              const isActive = pathname === href
              const isProType = PRO_TYPES.has(type.name)
              const showProBadge = isProType && !userIsPro
              const showProUnlocked = isProType && userIsPro

              const label = `${type.name.charAt(0).toUpperCase()}${type.name.slice(1)}s`
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
                  title={collapsed ? label : undefined}
                  aria-label={collapsed ? label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" style={{ color: type.color }} />
                  {!collapsed && (
                    <>
                      <span className="truncate">{label}</span>
                      {showProBadge && (
                        <Badge
                          variant="outline"
                          className="h-4 border-muted-foreground/30 px-1 py-0 text-[9px] font-semibold tracking-wider text-muted-foreground"
                        >
                          PRO
                        </Badge>
                      )}
                      {showProUnlocked && (
                        <span
                          className="pro-badge-glow inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                          style={{
                            background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                          }}
                          aria-label="Pro feature"
                          title="Pro feature"
                        >
                          <Sparkles
                            className="h-2.5 w-2.5 text-white"
                            strokeWidth={2.5}
                          />
                        </span>
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
              {favoriteCollections.length > 0 && (
                <CollectionNavSection
                  heading="Favorites"
                  collections={favoriteCollections}
                  collapsed={collapsed}
                  className="mb-4"
                  leading={() => <FolderOpen className="h-4 w-4 shrink-0" />}
                  trailing={() => <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />}
                />
              )}

              {recentCollections.length > 0 && (
                <CollectionNavSection
                  heading="Recents"
                  collections={recentCollections}
                  collapsed={collapsed}
                  leading={(c) => (
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: c.dominantColor }}
                    />
                  )}
                />
              )}

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

      <SidebarUser
        collapsed={collapsed}
        name={user?.name}
        email={user?.email}
        image={user?.image}
      />
    </aside>
  )
}

interface CollectionNavSectionProps {
  heading: string
  collections: CollectionWithTypes[]
  collapsed: boolean
  leading: (collection: CollectionWithTypes) => React.ReactNode
  trailing?: (collection: CollectionWithTypes) => React.ReactNode
  className?: string
}

function CollectionNavSection({
  heading,
  collections,
  collapsed,
  leading,
  trailing,
  className,
}: CollectionNavSectionProps) {
  return (
    <div className={className}>
      {!collapsed && (
        <h3 className="mb-1 px-2 text-xs font-medium text-muted-foreground">{heading}</h3>
      )}
      <nav className="space-y-0.5">
        {collections.map((collection) => (
          <Link
            key={collection.id}
            href={`/collections/${collection.id}`}
            className={cn(
              'flex items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors',
              collapsed
                ? 'justify-center'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
            title={collapsed ? collection.name : undefined}
            aria-label={collapsed ? collection.name : undefined}
          >
            {leading(collection)}
            {!collapsed && (
              <>
                <span className="flex-1 truncate">{collection.name}</span>
                {trailing?.(collection)}
              </>
            )}
          </Link>
        ))}
      </nav>
    </div>
  )
}
