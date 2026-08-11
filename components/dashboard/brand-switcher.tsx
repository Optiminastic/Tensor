'use client'

import { Check, ChevronsUpDown, Globe, Plus } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, type JSX, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { ALL_BRANDS, brandFromPathname } from './nav-config'

export interface BrandOption {
  slug: string
  name: string
}

interface BrandSwitcherProps {
  brands: BrandOption[]
  activeSlug: string | null
  canManageBrands: boolean
}

const ALL_BRANDS_LABEL = 'All brands'

interface SwitcherRowProps {
  label: string
  selected: boolean
  onSelect: () => void
  icon?: ReactNode
}

/** One selectable row in the switcher: the global "All brands" entry or a brand. */
function SwitcherRow({ label, selected, onSelect, icon }: SwitcherRowProps): JSX.Element {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
        selected
          ? 'bg-accent-subtle text-foreground font-medium'
          : 'text-muted-foreground hover:bg-surface-muted hover:text-foreground',
      )}
    >
      {icon ? <span className="shrink-0">{icon}</span> : null}
      <span className="flex-1 truncate">{label}</span>
      {selected ? <Check className="text-accent size-4 shrink-0" aria-hidden /> : null}
    </button>
  )
}

/**
 * Switches the dashboard's active brand. The first entry is always the global
 * "All brands" view (the sentinel {@link ALL_BRANDS}); selecting it aggregates
 * across every brand the user can access. Selecting a specific brand scopes down.
 * On select, it keeps the current section and swaps only the brand segment. Only
 * members who can manage brands (`brand:manage`) see the "New brand" link.
 */
export function BrandSwitcher({
  brands,
  activeSlug,
  canManageBrands,
}: BrandSwitcherProps): JSX.Element {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isAll = activeSlug === ALL_BRANDS
  const activeName = isAll
    ? ALL_BRANDS_LABEL
    : (brands.find(brand => brand.slug === activeSlug)?.name ?? ALL_BRANDS_LABEL)

  function switchTo(slug: string): void {
    setOpen(false)
    if (slug === activeSlug) return
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
        {isAll ? <Globe className="text-subtle-foreground size-4 shrink-0" aria-hidden /> : null}
        <span className="flex-1 truncate font-medium">{activeName}</span>
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
              <li>
                <SwitcherRow
                  label={ALL_BRANDS_LABEL}
                  selected={isAll}
                  onSelect={() => switchTo(ALL_BRANDS)}
                  icon={<Globe className="size-4" aria-hidden />}
                />
              </li>
              {brands.map(brand => (
                <li key={brand.slug}>
                  <SwitcherRow
                    label={brand.name}
                    selected={!isAll && brand.slug === activeSlug}
                    onSelect={() => switchTo(brand.slug)}
                  />
                </li>
              ))}
            </ul>
            {canManageBrands ? (
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
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  )
}
