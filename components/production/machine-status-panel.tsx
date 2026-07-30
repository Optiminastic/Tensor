import type { JSX } from 'react'

import { MACHINE_LIVE_STATUS_CONFIG } from '@/components/production/status-config'
import { TonePill } from '@/components/production/tone-pill'
import type { MachineDetail } from '@/components/production/types'
import { Select } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

interface MachineStatusPanelProps {
  machine: MachineDetail
}

export function MachineStatusPanel({ machine }: MachineStatusPanelProps): JSX.Element {
  const status = MACHINE_LIVE_STATUS_CONFIG[machine.status]

  return (
    <>
      <div className="flex items-start justify-between px-5 py-4">
        <div className="flex flex-col gap-1">
          <span className="text-foreground text-base font-semibold">{machine.name}</span>
          <p className="text-muted-foreground text-xs">Added {machine.addedAt}</p>
        </div>
        <TonePill label={status.label} tone={status.tone} />
      </div>
      <Separator />
      <div className="flex flex-col gap-2 px-5 py-4">
        <p className="text-foreground text-sm font-medium">Change status</p>
        <Select defaultValue={machine.status} className="max-w-52">
          <option value="online">online</option>
          <option value="offline">offline</option>
        </Select>
      </div>
    </>
  )
}
