import type { JSX } from 'react'

import { DetailField } from '@/components/production/detail-field'
import { MACHINE_LIVE_STATUS_CONFIG } from '@/components/production/status-config'
import type { MachineDetail } from '@/components/production/types'

interface MachineSpecsGridProps {
  machine: MachineDetail
}

export function MachineSpecsGrid({ machine }: MachineSpecsGridProps): JSX.Element {
  const status = MACHINE_LIVE_STATUS_CONFIG[machine.status]

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-5 px-5 py-5 md:grid-cols-3">
      <DetailField label="Machine number" value={machine.machineNumber} mono />
      <DetailField label="IP address" value={machine.ipAddress} mono />
      <DetailField label="Status" value={status.label} />
      <DetailField label="Left nozzle" value={`${machine.leftNozzleMm.toFixed(1)} mm`} mono />
      <DetailField label="Right nozzle" value={`${machine.rightNozzleMm.toFixed(1)} mm`} mono />
      <DetailField label="Available filaments" value={machine.availableFilaments.join(', ')} />
    </div>
  )
}
