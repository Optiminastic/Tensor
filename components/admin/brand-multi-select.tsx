'use client'

import { Check } from 'lucide-react'
import type { JSX } from 'react'

import { cn } from '@/lib/utils'

export interface BrandChoice {
  slug: string
  name: string
}

interface BrandMultiSelectProps {
  brands: BrandChoice[]
  selected: string[]
  onChange: (slugs: string[]) => void
  disabled?: boolean
}

/**
 * A compact, accessible checkbox group for picking which brands a member may
 * access. Each brand is a real checkbox (keyboard- and screen-reader-friendly)
 * styled as a selectable chip. Selection is controlled by the parent.
 */
export function BrandMultiSelect({
  brands,
  selected,
  onChange,
  disabled = false,
}: BrandMultiSelectProps): JSX.Element {
  if (brands.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No brands exist yet. Create a brand first, then you can assign it.
      </p>
    )
  }

  function toggle(slug: string): void {
    onChange(selected.includes(slug) ? selected.filter(s => s !== slug) : [...selected, slug])
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {brands.map(brand => {
        const isSelected = selected.includes(brand.slug)
        return (
          <li key={brand.slug}>
            <label
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors',
                isSelected
                  ? 'border-accent bg-accent-subtle text-foreground font-medium'
                  : 'border-border text-muted-foreground hover:bg-surface-muted hover:text-foreground',
                disabled && 'cursor-not-allowed opacity-60',
              )}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={isSelected}
                disabled={disabled}
                onChange={() => toggle(brand.slug)}
              />
              <span
                aria-hidden
                className={cn(
                  'flex size-4 shrink-0 items-center justify-center rounded border',
                  isSelected ? 'border-accent bg-accent text-white' : 'border-border',
                )}
              >
                {isSelected ? <Check className="size-3" /> : null}
              </span>
              {brand.name}
            </label>
          </li>
        )
      })}
    </ul>
  )
}
