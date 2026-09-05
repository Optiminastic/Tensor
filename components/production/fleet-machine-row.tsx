'use client'

import { useRouter } from 'next/navigation'
import type { JSX, KeyboardEvent } from 'react'

import { FailureNote, failureRowClass } from '@/components/production/failure-note'
import { FLEET_MACHINE_STATUS_CONFIG } from '@/components/production/status-config'
import { TonePill } from '@/components/production/tone-pill'
import { TableCell, TableRow } from '@/components/ui/table'
import { countdown } from '@/lib/format'
import { cn } from '@/lib/utils'
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
      className={cn('cursor-pointer', failureRowClass(machine.status === 'error'))}
      aria-label={`Open ${machine.name}`}
    >
      <TableCell className="font-medium">
        {machine.name}
        {machine.location ? (
          <span className="text-muted-foreground block text-xs font-normal">
            {machine.location}
          </span>
        ) : null}
      </TableCell>
      <TableCell>
        {machine.model ? (
          <span className="bg-surface-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-xs">
            {machine.model}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground font-mono text-sm">
        {machine.machine_id}
      </TableCell>
      <TableCell>
        <TonePill label={status.label} tone={status.tone} />
        {/* Advice, not a fault: a machine reporting this is idle and gets
            scheduled like any other - see fleetStatus. It just wants its plate
            cleared before the next plate lands on the last one. */}
        <FailureNote
          reason={machine.status_reason}
          tone={machine.status === 'error' ? 'danger' : 'advice'}
          className="mt-1"
        />
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
