import type { JSX } from 'react'

import { cn } from '@/lib/utils'

interface ViewToggleProps {
  active: boolean
  label: string
  onClick: () => void
  icon: JSX.Element
}

/** One half of the grid/table switch. */
export function ViewToggle({ active, label, onClick, icon }: ViewToggleProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'grid size-9 place-items-center rounded-full transition-colors',
        active
          ? 'bg-landing-ink dark:bg-foreground dark:text-background text-white'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {icon}
    </button>
  )
}
