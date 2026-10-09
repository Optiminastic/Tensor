'use client'

import { Search } from 'lucide-react'
import type { JSX } from 'react'

interface NavSearchProps {
  value: string
  onChange: (value: string) => void
  /** Announced to screen readers, since the field carries no visible label. */
  label: string
}

/**
 * Filters the panel's own items.
 *
 * It searches the NAV, not the product. That is a deliberately small promise:
 * a box here that looked like global search but only matched menu labels would
 * be worse than no box, and a real one belongs in the page header where the
 * data is. Narrowing a long area like Production to one row is worth having on
 * its own.
 */
export function NavSearch({ value, onChange, label }: NavSearchProps): JSX.Element {
  return (
    <div className="relative">
      <Search
        className="text-subtle-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={event => onChange(event.target.value)}
        aria-label={label}
        placeholder="Search"
        className="border-border bg-surface text-foreground placeholder:text-subtle-foreground focus-visible:border-accent focus-visible:ring-accent/30 h-9 w-full rounded-xl border pr-3 pl-9 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
      />
    </div>
  )
}
