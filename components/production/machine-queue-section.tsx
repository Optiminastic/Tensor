import type { JSX } from 'react'

import { BatchTable } from '@/components/production/batch-table'
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
      {batches.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nothing queued on this machine.</p>
      ) : (
        <BatchTable brand={brand} batches={batches} />
      )}
    </div>
  )
}
