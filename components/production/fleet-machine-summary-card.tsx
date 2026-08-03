import type { JSX } from 'react'

import { DetailField } from '@/components/production/detail-field'
import { FLEET_MACHINE_STATUS_CONFIG } from '@/components/production/status-config'
import { TonePill } from '@/components/production/tone-pill'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { countdown } from '@/lib/format'
import type { FleetMachine } from '@/lib/validators/machine-fleet'

interface FleetMachineSummaryCardProps {
  machine: FleetMachine
}

export function FleetMachineSummaryCard({ machine }: FleetMachineSummaryCardProps): JSX.Element {
  const status = FLEET_MACHINE_STATUS_CONFIG[machine.status]

  return (
    <Card>
      <div className="flex items-start justify-between px-5 py-4">
        <div className="flex flex-col gap-1">
          <span className="text-foreground text-base font-semibold">{machine.name}</span>
          <p className="text-muted-foreground text-xs">Machine ID {machine.machine_id}</p>
        </div>
        <TonePill label={status.label} tone={status.tone} />
      </div>
      <Separator />
      <div className="grid grid-cols-2 gap-x-6 gap-y-5 px-5 py-5 md:grid-cols-3">
        <DetailField label="Current batch" value={machine.current_batch_id ?? '—'} mono />
        <DetailField
          label="Layer"
          value={
            machine.current_layer !== null &&
            machine.current_layer !== undefined &&
            machine.total_layers !== null &&
            machine.total_layers !== undefined
              ? `${machine.current_layer} / ${machine.total_layers}`
              : '—'
          }
          mono
        />
        <DetailField
          label="Batch total time"
          value={
            machine.batch_total_time_minutes !== null &&
            machine.batch_total_time_minutes !== undefined
              ? `${machine.batch_total_time_minutes} min`
              : '—'
          }
          mono
        />
        <DetailField
          label="Time remaining"
          value={
            machine.remaining_seconds !== null && machine.remaining_seconds !== undefined
              ? countdown(machine.remaining_seconds)
              : '—'
          }
          mono
        />
        <DetailField label="Total waste" value={`${machine.total_waste_grams.toFixed(0)} g`} mono />
      </div>
    </Card>
  )
}
