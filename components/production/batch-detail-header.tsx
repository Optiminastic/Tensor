import type { JSX } from 'react'

import { BatchApproveDialog } from '@/components/production/batch-approve-dialog'
import { BatchEditDialog } from '@/components/production/batch-edit-dialog'
import { BATCH_STATUS_CONFIG } from '@/components/production/status-config'
import { TonePill } from '@/components/production/tone-pill'
import type { BatchRecord } from '@/components/production/types'
import type { Machine } from '@/lib/validators/machines'

interface BatchDetailHeaderProps {
  brand: string
  batch: BatchRecord
  machines: Machine[]
}

export function BatchDetailHeader({ brand, batch, machines }: BatchDetailHeaderProps): JSX.Element {
  const status = BATCH_STATUS_CONFIG[batch.status]
  const assignedMachine = machines.find(m => m.id === batch.machineId)

  return (
    <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-foreground text-base font-semibold">{batch.batchNumber}</span>
          <TonePill label={status.label} tone={status.tone} />
        </div>
        <p className="text-muted-foreground text-xs">
          {assignedMachine ? `Scheduled on ${assignedMachine.name}` : 'No machine scheduled yet'}
        </p>
      </div>
      {batch.status === 'pending_approval' ? (
        <BatchApproveDialog
          brand={brand}
          batchId={batch.id}
          assignedMachineId={batch.machineId}
          machines={machines}
        />
      ) : (
        <BatchEditDialog
          brand={brand}
          batchId={batch.id}
          status={batch.status}
          machineId={batch.machineId}
          machines={machines}
        />
      )}
    </div>
  )
}
