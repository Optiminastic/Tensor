import type { JSX } from 'react'

import { FleetMachineSummaryCard } from '@/components/production/fleet-machine-summary-card'
import { MachinePhotoCard } from '@/components/production/machine-photo-card'
import { MachineQueueSection } from '@/components/production/machine-queue-section'
import type { BatchRecord } from '@/components/production/types'
import type { FleetMachine } from '@/lib/validators/machine-fleet'

interface FleetMachineDetailViewProps {
  brand: string
  machine: FleetMachine
  queuedBatches: BatchRecord[]
}

export function FleetMachineDetailView({
  brand,
  machine,
  queuedBatches,
}: FleetMachineDetailViewProps): JSX.Element {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 md:grid-cols-[320px_1fr]">
        <MachinePhotoCard
          src={machine.image_url ?? '/production/h2c-printer.png'}
          alt={`${machine.name} printer`}
        />
        <FleetMachineSummaryCard machine={machine} />
      </div>
      <MachineQueueSection brand={brand} batches={queuedBatches} />
    </div>
  )
}
