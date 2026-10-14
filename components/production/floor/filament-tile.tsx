import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import type { JSX } from 'react'

import { OverviewTile } from '@/components/dashboard/overview/overview-tile'
import { TileLabel } from '@/components/dashboard/overview/tile-label'
import type { Filament } from '@/lib/validators/production'

/** How many low spools the tile lists before pointing at Inventory. */
const SHOWN = 4
const GRAMS_PER_KG = 1000

function kg(grams: number): string {
  return `${(grams / GRAMS_PER_KG).toFixed(1)} kg`
}

interface FilamentTileProps {
  low: Filament[]
  tracked: number
  inventoryHref: string
}

/** Filament under its reorder level, emptiest first. Live stock, not ranged. */
export function FilamentTile({ low, tracked, inventoryHref }: FilamentTileProps): JSX.Element {
  return (
    <OverviewTile tone="paper" label="Filament running low" className="h-full">
      <div className="flex items-start justify-between gap-3">
        <TileLabel>Filament running low</TileLabel>
        <Link
          href={inventoryHref}
          aria-label="Open inventory"
          className="-m-1.5 grid size-8 place-items-center rounded-full transition-colors hover:bg-current/10"
        >
          <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      </div>
      <p className="text-6xl font-medium tracking-[-0.04em] tabular-nums">
        {low.length}
        <span className="text-muted-foreground ml-2 text-base tracking-normal">of {tracked}</span>
      </p>
      {low.length === 0 ? (
        <p className="text-muted-foreground mt-auto text-sm">
          Every spool is above its reorder level.
        </p>
      ) : (
        <ul className="mt-auto flex flex-col gap-3">
          {low.slice(0, SHOWN).map(spool => (
            <li key={spool.id} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-sm">
                {/* The spool's own colour: data, so not a class. */}
                <span
                  aria-hidden
                  className="ring-border size-3 shrink-0 rounded-full ring-1"
                  style={{ background: spool.colour_hex ?? 'transparent' }}
                />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate">{spool.colour ?? spool.material}</span>
                  <span className="text-muted-foreground truncate font-mono text-xs">
                    {spool.material}
                  </span>
                </span>
                <span className="font-mono text-xs tabular-nums">{kg(spool.grams_available)}</span>
              </div>
              <div className="bg-border h-1.5 overflow-hidden rounded-full">
                <div
                  className="bg-danger h-full rounded-full"
                  style={{
                    width: `${Math.min(1, spool.grams_available / Math.max(1, spool.reorder_level_grams)) * 100}%`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </OverviewTile>
  )
}
