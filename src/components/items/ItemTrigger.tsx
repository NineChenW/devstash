'use client'

import { useItemDrawer } from './ItemDrawerContext'

interface ItemTriggerProps {
  itemId: string
  children: React.ReactNode
  className?: string
}

export function ItemTrigger({ itemId, children, className }: ItemTriggerProps) {
  const { openItem } = useItemDrawer()
  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      openItem(itemId)
    }
  }
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => openItem(itemId)}
      onKeyDown={handleKey}
      className={
        'block w-full cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl' +
        (className ? ` ${className}` : '')
      }
    >
      {children}
    </div>
  )
}
