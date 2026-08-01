'use client'

import { LayoutGrid, List } from 'lucide-react'
import { useEffect, useState, type JSX } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Design } from '@/lib/validators/designs'

import { DesignGrid } from './design-grid'
import { DesignList } from './design-list'

type View = 'grid' | 'table'

const STORAGE_KEY = 'designs-view'

interface DesignsViewProps {
  brand: string
  designs: Design[]
}

/** The designs list with a grid/table toggle. The choice is remembered per
 * browser; the grid is the default (cover-forward, like the reference). */
export function DesignsView({ brand, designs }: DesignsViewProps): JSX.Element {
  const [view, setView] = useState<View>('grid')

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
      <Card>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No designs yet. Upload one to run the pre-check.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <div className="border-border bg-surface inline-flex items-center rounded-md border p-0.5">
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
        <DesignGrid brand={brand} designs={designs} />
      ) : (
        <DesignList brand={brand} designs={designs} />
      )}
    </div>
  )
}

interface ViewToggleProps {
  active: boolean
  label: string
  onClick: () => void
  icon: JSX.Element
}

function ViewToggle({ active, label, onClick, icon }: ViewToggleProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'flex items-center rounded px-2 py-1 transition-colors',
        active ? 'bg-surface-muted text-foreground' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {icon}
    </button>
  )
}
