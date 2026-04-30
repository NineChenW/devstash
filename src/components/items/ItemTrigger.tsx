'use client'

import { useItemDrawer } from './ItemDrawerContext'

interface ItemTriggerProps {
  itemId: string
  children: React.ReactNode
  className?: string
}

export function ItemTrigger({ itemId, children, className }: ItemTriggerProps) {
  const { openItem } = useItemDrawer()
  return (
    <button
      type="button"
      onClick={() => openItem(itemId)}
      className={
        'block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl' +
        (className ? ` ${className}` : '')
      }
    >
      {children}
    </button>
  )
}
