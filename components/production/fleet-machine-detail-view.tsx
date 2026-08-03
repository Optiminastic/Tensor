import type { JSX } from 'react'

import { FleetMachineFilamentsTable } from '@/components/production/fleet-machine-filaments-table'
import { FleetMachineSummaryCard } from '@/components/production/fleet-machine-summary-card'
import { MachinePhotoCard } from '@/components/production/machine-photo-card'
import type { FleetMachine } from '@/lib/validators/machine-fleet'

interface FleetMachineDetailViewProps {
  machine: FleetMachine
}

export function FleetMachineDetailView({ machine }: FleetMachineDetailViewProps): JSX.Element {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 md:grid-cols-[320px_1fr]">
        <MachinePhotoCard
          src={machine.image_url ?? '/production/h2c-printer.png'}
          alt={`${machine.name} printer`}
        />
        <FleetMachineSummaryCard machine={machine} />
      </div>
      <FleetMachineFilamentsTable filaments={machine.filaments} />
    </div>
  )
}
