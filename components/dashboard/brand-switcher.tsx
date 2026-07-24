'use client'

import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import { cn } from '@/lib/utils'

import { brandFromPathname } from './nav-config'

export interface BrandOption {
  slug: string
  name: string
}

interface BrandSwitcherProps {
  brands: BrandOption[]
  activeSlug: string | null
}

/**
 * Switches the dashboard's active brand. Shows the current brand and, on select,
 * navigates to the same section under the chosen brand (or its overview). Also
 * links to create a new brand.
 */
export function BrandSwitcher({ brands, activeSlug }: BrandSwitcherProps): JSX.Element {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const active = brands.find(brand => brand.slug === activeSlug) ?? brands[0]

  function switchTo(slug: string): void {
    setOpen(false)
    if (slug === active?.slug) return
    // Keep the current section, swapping the brand segment.
    const rest = brandFromPathname(pathname) ? pathname.split('/').slice(3).join('/') : ''
    router.push(rest ? `/dashboard/${slug}/${rest}` : `/dashboard/${slug}`)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="border-border hover:bg-surface-muted flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors"
      >
        <span className="flex-1 truncate font-medium">{active?.name ?? 'Select brand'}</span>
        <ChevronsUpDown className="text-subtle-foreground size-4 shrink-0" aria-hidden />
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close brand menu"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="border-border bg-surface absolute top-full left-0 z-20 mt-1 flex w-full flex-col rounded-md border p-1 shadow-md">
            <ul role="listbox" className="flex max-h-64 flex-col gap-0.5 overflow-y-auto">
              {brands.map(brand => {
                const selected = brand.slug === active?.slug
                return (
                  <li key={brand.slug}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => switchTo(brand.slug)}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                        selected
                          ? 'bg-accent-subtle text-foreground font-medium'
                          : 'text-muted-foreground hover:bg-surface-muted hover:text-foreground',
                      )}
                    >
                      <span className="flex-1 truncate">{brand.name}</span>
                      {selected ? (
                        <Check className="text-accent size-4 shrink-0" aria-hidden />
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </ul>
            <div className="border-border mt-1 border-t pt-1">
              <Link
                href="/create-brand"
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:bg-surface-muted hover:text-foreground flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors"
              >
                <Plus className="size-4 shrink-0" aria-hidden />
                New brand
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
