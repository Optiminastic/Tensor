import type { JSX } from 'react'

import { MachineQueueBoard } from '@/components/production/machine-queue-board'
import type { BatchRecord } from '@/components/production/types'

interface MachineQueueSectionProps {
  brand: string
  batches: BatchRecord[]
}

/** Every batch already queued (open or in_progress) on this physical unit's
 * linked profile - not just what it's printing right now. */
export function MachineQueueSection({ brand, batches }: MachineQueueSectionProps): JSX.Element {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <h2 className="text-foreground shrink-0 text-sm font-semibold">Queued batches</h2>
      {/* No period filter here: this board is where a machine's Completed
          batches are read, and filtering on createdAt drops them the moment
          the week rolls over. The Overview keeps DEFAULT_PERIOD. */}
      <MachineQueueBoard
        brand={brand}
        batches={batches}
        defaultPeriod={{ unit: 'all', anchor: '' }}
      />
    </div>
  )
}
