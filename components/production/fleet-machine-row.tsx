'use client'

import { useRouter } from 'next/navigation'
import type { JSX, KeyboardEvent } from 'react'

import { FLEET_MACHINE_STATUS_CONFIG } from '@/components/production/status-config'
import { TonePill } from '@/components/production/tone-pill'
import { TableCell, TableRow } from '@/components/ui/table'
import { countdown } from '@/lib/format'
import type { FleetMachine } from '@/lib/validators/machine-fleet'

interface FleetMachineRowProps {
  brand: string
  machine: FleetMachine
}

export function FleetMachineRow({ brand, machine }: FleetMachineRowProps): JSX.Element {
  const router = useRouter()
  const status = FLEET_MACHINE_STATUS_CONFIG[machine.status]
  const href = `/dashboard/${brand}/production/machines/${machine.id}`

  const openDetail = (): void => router.push(href)
  const onKeyDown = (event: KeyboardEvent<HTMLTableRowElement>): void => {
    if (event.key === 'Enter') openDetail()
  }

  return (
    <TableRow
      tabIndex={0}
      onClick={openDetail}
      onKeyDown={onKeyDown}
      className="cursor-pointer"
      aria-label={`Open ${machine.name}`}
    >
      <TableCell className="font-medium">{machine.name}</TableCell>
      <TableCell className="text-muted-foreground font-mono text-sm">
        {machine.machine_id}
      </TableCell>
      <TableCell>
        <TonePill label={status.label} tone={status.tone} />
      </TableCell>
      <TableCell className="text-muted-foreground font-mono text-sm">
        {machine.current_batch_id ?? '—'}
      </TableCell>
      <TableCell numeric>
        {machine.current_layer !== null &&
        machine.current_layer !== undefined &&
        machine.total_layers !== null &&
        machine.total_layers !== undefined
          ? `${machine.current_layer} / ${machine.total_layers}`
          : '—'}
      </TableCell>
      <TableCell numeric>
        {machine.remaining_seconds !== null && machine.remaining_seconds !== undefined
          ? countdown(machine.remaining_seconds)
          : '—'}
      </TableCell>
      <TableCell numeric>{machine.filaments.length} loaded</TableCell>
    </TableRow>
  )
}
