import type { JSX } from 'react'

import { BATCH_STATUS_CONFIG } from '@/components/production/status-config'
import { TonePill } from '@/components/production/tone-pill'
import type { BatchRecord } from '@/components/production/types'
import type { Machine } from '@/lib/validators/machines'

interface BatchDetailHeaderProps {
  batch: BatchRecord
  machines: Machine[]
}

// Identity only - the Approve/Edit action lives at the page-header level,
// alongside the batch title.
export function BatchDetailHeader({ batch, machines }: BatchDetailHeaderProps): JSX.Element {
  const status = BATCH_STATUS_CONFIG[batch.status]
  const assignedMachine = machines.find(m => m.id === batch.machineId)

  return (
    <div className="flex flex-col gap-1.5 px-5 py-4">
      <div className="flex items-center gap-2">
        <span className="text-foreground text-base font-semibold">{batch.batchNumber}</span>
        <TonePill label={status.label} tone={status.tone} />
      </div>
      <p className="text-muted-foreground text-xs">
        {assignedMachine ? `Scheduled on ${assignedMachine.name}` : 'No machine scheduled yet'}
      </p>
    </div>
  )
}
