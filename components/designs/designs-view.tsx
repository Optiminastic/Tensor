'use client'

import { LayoutGrid, List } from 'lucide-react'
import { useEffect, useState, type JSX } from 'react'

import { isAllBrands } from '@/components/dashboard/nav-config'
import type { Design } from '@/lib/validators/designs'

import { DesignGrid } from './design-grid'
import { DesignList } from './design-list'
import { ViewToggle } from './view-toggle'

type View = 'grid' | 'table'

const STORAGE_KEY = 'designs-view'

interface DesignsViewProps {
  brand: string
  designs: Design[]
  // The empty-state copy for the active lifecycle view (drafts, archived, ...).
  emptyMessage?: string
}

/** The designs list with a grid/table toggle. The choice is remembered per
 * browser; the grid is the default (cover-forward, like the reference). Delete
 * and archive live on each design's Settings tab, not on the browse cards/rows. */
export function DesignsView({ brand, designs, emptyMessage }: DesignsViewProps): JSX.Element {
  const [view, setView] = useState<View>('grid')
  const showBrand = isAllBrands(brand)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'grid' || saved === 'table') setView(saved)
  }, [])

  function choose(next: View): void {
    setView(next)
    localStorage.setItem(STORAGE_KEY, next)
  }

  if (designs.length === 0) {
    return (
      <div className="bg-surface ring-border rounded-3xl px-6 py-16 text-center ring-1">
        <p className="text-muted-foreground mx-auto max-w-md text-sm text-pretty">
          {emptyMessage ?? 'No designs yet. Upload one to run the pre-check.'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          <span className="text-foreground font-medium tabular-nums">{designs.length}</span>{' '}
          {designs.length === 1 ? 'design' : 'designs'}
        </p>
        <div className="bg-surface ring-border inline-flex items-center gap-0.5 rounded-full p-1 ring-1">
          <ViewToggle
            active={view === 'grid'}
            label="Grid view"
            onClick={() => choose('grid')}
            icon={<LayoutGrid className="size-4" aria-hidden />}
          />
          <ViewToggle
            active={view === 'table'}
            label="Table view"
            onClick={() => choose('table')}
            icon={<List className="size-4" aria-hidden />}
          />
        </div>
      </div>
      {view === 'grid' ? (
        <DesignGrid designs={designs} showBrand={showBrand} />
      ) : (
        <DesignList designs={designs} showBrand={showBrand} />
      )}
    </div>
  )
}
