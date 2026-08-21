'use client'

import type { JSX } from 'react'

import { FleetMachineLiveCard } from '@/components/production/fleet-machine-live-card'
import { FleetMachineSummaryCard } from '@/components/production/fleet-machine-summary-card'
import { MachineCameraPanel } from '@/components/production/machine-camera-panel'
import { MachinePhotoCard } from '@/components/production/machine-photo-card'
import { MachineQueueSection } from '@/components/production/machine-queue-section'
import type { BatchRecord } from '@/components/production/types'
import { useFleetMachine, useFleetMachineLive } from '@/hooks/use-fleet-poll'
import type { FleetMachine, FleetMachineLive } from '@/lib/validators/machine-fleet'

interface FleetMachineDetailViewProps {
  brand: string
  /** Seeded by the server render, then kept current by polling. */
  initialMachine: FleetMachine
  queuedBatches: BatchRecord[]
  /** Live printer telemetry, null when BambuBuddy could not be reached. */
  initialLive: FleetMachineLive | null
}

/**
 * A client component only so the two cards above the queue can poll.
 *
 * Everything it renders stays exactly as it was: MachinePhotoCard,
 * FleetMachineSummaryCard and FleetMachineLiveCard are all pure props
 * components, so this is a prop swap rather than a rewrite - they simply
 * receive a fresher object every few seconds.
 *
 * queuedBatches deliberately does NOT poll. The board below has drag state a
 * refresh would fight, and a batch queue moves at human pace, not printer pace.
 */
export function FleetMachineDetailView({
  brand,
  initialMachine,
  queuedBatches,
  initialLive,
}: FleetMachineDetailViewProps): JSX.Element {
  const { data: machine } = useFleetMachine({
    machineId: initialMachine.id,
    initial: initialMachine,
  })
  const { data: live } = useFleetMachineLive({
    machineId: initialMachine.id,
    initial: initialLive,
  })

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
