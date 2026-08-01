'use client'

import type { JSX } from 'react'

import { MACHINE_LIVE_STATUS_CONFIG } from '@/components/production/status-config'
import { TonePill } from '@/components/production/tone-pill'
import type { MachineDetail } from '@/components/production/types'
import { useMachineStatus } from '@/components/production/use-machine-status'
import { Select } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

interface MachineStatusPanelProps {
  brand: string
  machine: MachineDetail
}

export function MachineStatusPanel({ brand, machine }: MachineStatusPanelProps): JSX.Element {
  const { status, pending, error, onChange } = useMachineStatus(brand, machine.id, machine.status)
  const config = MACHINE_LIVE_STATUS_CONFIG[status]

  return (
    <>
      <div className="flex items-start justify-between px-5 py-4">
        <div className="flex flex-col gap-1">
          <span className="text-foreground text-base font-semibold">{machine.name}</span>
          <p className="text-muted-foreground text-xs">Added {machine.addedAt}</p>
        </div>
        <TonePill label={config.label} tone={config.tone} />
      </div>
      <Separator />
      <div className="flex flex-col gap-2 px-5 py-4">
        <p className="text-foreground text-sm font-medium">Change status</p>
        <Select
          value={status}
          disabled={pending}
          onChange={onChange}
          aria-label={`Change status for ${machine.name}`}
          className="max-w-52"
        >
          <option value="online">online</option>
          <option value="offline">offline</option>
        </Select>
        {error ? (
          <p role="alert" className="text-danger text-xs">
            {error}
          </p>
        ) : null}
      </div>
    </>
  )
}
