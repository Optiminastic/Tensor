import type { JSX } from 'react'

import { MACHINE_STATUS_CONFIG } from '@/components/production/status-config'
import { TonePill } from '@/components/production/tone-pill'
import type { MachineSummary } from '@/components/production/types'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface MachinesPanelProps {
  machines: MachineSummary[]
}

export function MachinesPanel({ machines }: MachinesPanelProps): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Machines</CardTitle>
        <CardDescription>Live status and jobs today.</CardDescription>
      </CardHeader>
      <ul className="divide-border divide-y">
        {machines.map(machine => {
          const status = MACHINE_STATUS_CONFIG[machine.status]
          return (
            <li key={machine.id} className="flex items-center justify-between px-5 py-3">
              <div className="flex flex-col gap-1">
                <span className="text-foreground text-sm font-medium">{machine.name}</span>
                <TonePill label={status.label} tone={status.tone} />
              </div>
              <span className="text-muted-foreground font-mono text-sm tabular-nums">
                {machine.jobsToday}
                <span className="text-subtle-foreground ml-1 text-xs">today</span>
              </span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
