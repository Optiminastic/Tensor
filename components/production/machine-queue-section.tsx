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
    <div className="flex flex-col gap-3">
      <h2 className="text-foreground text-sm font-semibold">Queued batches</h2>
      <MachineQueueBoard brand={brand} batches={batches} />
    </div>
  )
}
