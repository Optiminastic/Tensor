import type { JSX } from 'react'

import { DataValue } from '@/components/ui/data-value'
import { StatusPill } from '@/components/ui/status-pill'
import { cn } from '@/lib/utils'

/**
 * Real output from `POST /pricing/design-cp` — a 2.5h print, 45g of filament on
 * stock assumptions. These are the engine's actual numbers, not a mock: a
 * costing tool that illustrates itself with invented figures is lying in its
 * own shop window.
 *
 * The Yellow is real too. `POST /pricing/status` returns yellow for this design
 * at ₹999, because its 2.50h effective machine time overruns the 2h target. The
 * honest result is also the better advert: catching exactly that is the job.
 */
const COST_LINES = [
  { label: 'Filament', value: '45.00' },
  { label: 'Machine', value: '112.50' },
  { label: 'Finishing', value: '30.00' },
  { label: 'Consumables', value: '15.00' },
  { label: 'Failure provision', value: '12.45' },
]

export interface CostPanelProps {
  className?: string
}

export function CostPanel({ className }: CostPanelProps): JSX.Element {
  return (
    <figure
      className={cn('border-border bg-surface w-full rounded-md border shadow-xs', className)}
    >
      <figcaption className="border-border flex items-center justify-between gap-3 border-b px-4 py-3">
        <span className="text-foreground text-sm font-semibold tracking-tight">Design CP</span>
        <StatusPill status="yellow" />
      </figcaption>

      <div className="text-subtle-foreground flex items-center justify-between px-4 pt-3 pb-1.5 font-mono text-xs tracking-widest uppercase">
        <span>Component</span>
        <span>Amount</span>
      </div>

      <dl className="px-4 pb-1">
        {COST_LINES.map(line => (
          <div
            key={line.label}
            className="border-border/70 flex items-center justify-between gap-4 border-b py-2 last:border-b-0"
          >
            <dt className="text-muted-foreground text-xs">{line.label}</dt>
            <dd>
              <DataValue value={`₹${line.value}`} className="text-xs" />
            </dd>
          </div>
        ))}
      </dl>

      <div className="border-border bg-surface-muted flex items-center justify-between gap-4 rounded-b-md border-t px-4 py-3">
        <span className="text-foreground text-xs font-semibold">Design CP</span>
        <DataValue value="₹219.95" className="text-base font-medium" />
      </div>
    </figure>
  )
}
