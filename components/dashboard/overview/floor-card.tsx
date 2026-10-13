import type { JSX } from 'react'

import { FloorFigure } from '@/components/dashboard/overview/floor-figure'
import { PrinterChip } from '@/components/dashboard/overview/printer-chip'
import { SkyBackdrop } from '@/components/landing/sky-backdrop'
import type { Machine } from '@/lib/validators/machines'

interface FloorCardProps {
  inProduction: number
  busyPrinters: number
  totalPrinters: number
  completedThisWeek: number
  machines: Machine[]
}

/** How many printers a row of chips shows before it would wrap untidily. */
const MAX_CHIPS = 6

/**
 * "On the print floor": the one place the landing page's sky appears in the
 * dashboard, holding the three numbers someone opening Tensor wants first.
 */
export function FloorCard(props: FloorCardProps): JSX.Element {
  const { inProduction, busyPrinters, totalPrinters, completedThisWeek, machines } = props
  return (
    <section
      aria-label="On the print floor"
      className="relative isolate overflow-hidden rounded-3xl p-6 text-white sm:p-8"
    >
      <SkyBackdrop variant="deep" />
      <div className="relative flex flex-col gap-8">
        <h2 className="font-mono text-xs tracking-[0.18em] uppercase">On the print floor</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <FloorFigure value={String(inProduction)} label="jobs in production" />
          <FloorFigure value={`${busyPrinters}/${totalPrinters}`} label="printers printing" />
          <FloorFigure value={String(completedThisWeek)} label="completed this week" />
        </div>
        {machines.length > 0 ? (
          <ul aria-label="Printers" className="flex flex-wrap gap-2">
            {machines.slice(0, MAX_CHIPS).map(m => (
              <PrinterChip key={m.id} name={m.name} status={m.status} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-white">No printers registered yet.</p>
        )}
      </div>
    </section>
  )
}
