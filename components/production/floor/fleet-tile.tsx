import type { JSX } from 'react'

import { OverviewTile } from '@/components/dashboard/overview/overview-tile'
import { TileLabel } from '@/components/dashboard/overview/tile-label'
import { PillLink } from '@/components/landing/pill-link'
import type { FleetRow } from '@/lib/production/floor-model'

import { PrinterCard } from './printer-card'

interface FleetTileProps {
  printers: FleetRow[]
  machinesHref: string
}

function headline(printers: FleetRow[]): string {
  const running = printers.filter(p => p.status === 'running').length
  const errors = printers.filter(p => p.status === 'error').length
  const base = `${running} of ${printers.length} printing`
  return errors > 0 ? `${base} · ${errors} need a person` : base
}

/** The fleet, live: every printer as a card, polled by the page. */
export function FleetTile({ printers, machinesHref }: FleetTileProps): JSX.Element {
  return (
    <OverviewTile label="Printers" className="h-full">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <TileLabel>Printers</TileLabel>
        {printers.length > 0 ? (
          <span className="text-muted-foreground text-sm tabular-nums">{headline(printers)}</span>
        ) : null}
      </div>
      {printers.length === 0 ? (
        <div className="flex flex-1 flex-col items-start justify-center gap-4 py-6">
          <p className="text-muted-foreground max-w-md text-sm">
            No printers are connected yet. Sync them from BambuBuddy on Machine management, and each
            one shows here with its plate and what waits for it.
          </p>
          <PillLink href={machinesHref} tone="lime" withArrow>
            Machine management
          </PillLink>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
          {printers.map(printer => (
            <PrinterCard
              key={printer.id}
              printer={printer}
              href={`${machinesHref}/${printer.id}`}
            />
          ))}
        </div>
      )}
    </OverviewTile>
  )
}
