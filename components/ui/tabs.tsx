'use client'

import { useRef, type JSX, type KeyboardEvent } from 'react'

import { cn } from '@/lib/utils'

export interface TabItem {
  value: string
  label: string
  // An optional count shown beside the label (mono), like "Review 3".
  count?: number
  // 'live' colours the count to mark it as something happening right now
  // rather than something waiting. Saturated colour carries meaning here and
  // nothing else: a tab whose number is quiet is a tab nobody has to look at.
  countTone?: 'default' | 'live'
}

interface TabsProps {
  tabs: TabItem[]
  value: string
  onValueChange: (value: string) => void
  // Names the tablist for screen readers.
  label: string
  // 'segmented' (default) is the muted track used across the product; 'pill'
  // is the landing UI's row of rounded pills, used on the redesigned pages.
  variant?: TabsVariant
  className?: string
}

type TabsVariant = 'segmented' | 'pill'

const LIST_CLASSES: Record<TabsVariant, string> = {
  segmented:
    'border-border/70 bg-surface-muted inline-flex h-9 items-center gap-1 rounded-lg border p-1',
  pill: 'flex max-w-full items-center gap-1 overflow-x-auto',
}

const TAB_CLASSES: Record<TabsVariant, { base: string; active: string; idle: string }> = {
  segmented: {
    base: 'h-7 rounded-md px-3',
    active: 'bg-surface text-foreground shadow-xs',
    idle: 'text-muted-foreground hover:text-foreground',
  },
  pill: {
    base: 'h-9 shrink-0 rounded-full px-4 whitespace-nowrap',
    active: 'bg-landing-ink text-white dark:bg-foreground dark:text-background',
    idle: 'text-muted-foreground hover:bg-surface-muted hover:text-foreground',
  },
}

/**
 * A segmented tab bar: one active pill lifted off a muted track, the rest quiet.
 * Controlled - the caller owns the active value and renders the matching panel
 * with role="tabpanel" and aria-labelledby={`tab-${value}`}. Arrow / Home / End
 * move between tabs per the WAI-ARIA tabs pattern.
 */
export function Tabs({
  tabs,
  value,
  onValueChange,
  label,
  variant = 'segmented',
  className,
}: TabsProps): JSX.Element {
  const look = TAB_CLASSES[variant]
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  function move(event: KeyboardEvent<HTMLButtonElement>, index: number): void {
    const last = tabs.length - 1
    let next = index
    if (event.key === 'ArrowRight') next = index === last ? 0 : index + 1
    else if (event.key === 'ArrowLeft') next = index === 0 ? last : index - 1
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = last
    else return
    event.preventDefault()
    const target = tabs[next]
    if (!target) return
    onValueChange(target.value)
    refs.current[next]?.focus()
  }

  return (
    <div role="tablist" aria-label={label} className={cn(LIST_CLASSES[variant], className)}>
      {tabs.map((tab, index) => {
        const active = tab.value === value
        return (
          <button
            key={tab.value}
            ref={element => {
              refs.current[index] = element
            }}
            type="button"
            role="tab"
            id={`tab-${tab.value}`}
            aria-selected={active}
            aria-controls={`panel-${tab.value}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onValueChange(tab.value)}
            onKeyDown={event => move(event, index)}
            className={cn(
              'inline-flex items-center gap-1.5 text-sm font-medium transition-colors',
              look.base,
              active ? look.active : look.idle,
            )}
          >
            {tab.label}
            {typeof tab.count === 'number' ? (
              <span
                className={cn(
                  'font-mono text-xs tabular-nums',
                  tab.countTone === 'live' && 'text-danger font-semibold',
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
