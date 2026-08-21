import type { JSX } from 'react'

import { FleetMachineLiveCard } from '@/components/production/fleet-machine-live-card'
import { FleetMachineSummaryCard } from '@/components/production/fleet-machine-summary-card'
import { MachineCameraPanel } from '@/components/production/machine-camera-panel'
import { MachinePhotoCard } from '@/components/production/machine-photo-card'
import { MachineQueueSection } from '@/components/production/machine-queue-section'
import type { BatchRecord } from '@/components/production/types'
import type { FleetMachine, FleetMachineLive } from '@/lib/validators/machine-fleet'

interface FleetMachineDetailViewProps {
  brand: string
  machine: FleetMachine
  queuedBatches: BatchRecord[]
  /** Live printer telemetry, null when BambuBuddy could not be reached. */
  live: FleetMachineLive | null
}

export function FleetMachineDetailView({
  brand,
  machine,
  queuedBatches,
  live,
}: FleetMachineDetailViewProps): JSX.Element {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {/* The photo/summary header keeps its natural height; the queue section
          below takes whatever is left of the viewport. */}
      <div className="grid shrink-0 gap-4 md:grid-cols-[260px_1fr]">
        <MachinePhotoCard
          src={machine.image_url ?? '/production/h2c-printer.png'}
          alt={`${machine.name} printer`}
        />
        <FleetMachineSummaryCard machine={machine} />
      </div>
      <div className="shrink-0">
        <FleetMachineLiveCard live={live} />
      </div>
      {/* Below the telemetry, and off by default: the numbers above answer most
          questions, and the camera is the expensive way to ask. */}
      <div className="shrink-0">
        <MachineCameraPanel machineId={machine.id} machineName={machine.name} />
      </div>
      <MachineQueueSection brand={brand} batches={queuedBatches} />
    </div>
  )
}
