'use client'

import { useRef, type JSX, type KeyboardEvent } from 'react'

import { cn } from '@/lib/utils'

export interface TabItem {
  value: string
  label: string
  // An optional count shown beside the label (mono), like "Review 3".
  count?: number
}

interface TabsProps {
  tabs: TabItem[]
  value: string
  onValueChange: (value: string) => void
  // Names the tablist for screen readers.
  label: string
  className?: string
}

/**
 * A segmented tab bar: one active pill lifted off a muted track, the rest quiet.
 * Controlled - the caller owns the active value and renders the matching panel
 * with role="tabpanel" and aria-labelledby={`tab-${value}`}. Arrow / Home / End
 * move between tabs per the WAI-ARIA tabs pattern.
 */
export function Tabs({ tabs, value, onValueChange, label, className }: TabsProps): JSX.Element {
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
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        'border-border bg-surface-muted inline-flex items-center gap-1 rounded-lg border p-1',
        className,
      )}
    >
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
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'bg-surface text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
            {typeof tab.count === 'number' ? (
              <span className="font-mono text-xs tabular-nums">{tab.count}</span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
