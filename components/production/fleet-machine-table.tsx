'use client'

import type { JSX } from 'react'

import { FleetMachineRow } from '@/components/production/fleet-machine-row'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableHead, TableHeaderCell, TableRow } from '@/components/ui/table'
import { useFleetMachines } from '@/hooks/use-fleet-poll'
import type { FleetMachine } from '@/lib/validators/machine-fleet'

interface FleetMachineTableProps {
  brand: string
  /** Seeded by the server render, then kept current by polling. */
  initialMachines: FleetMachine[]
}

const COLUMNS = [
  'Machine',
  'Model',
  'Machine ID',
  'Status',
  'Current Batch',
  'Layer',
  'Time Remaining',
]

/**
 * Errored machines first; everything else keeps the backend's order.
 *
 * Sorted here rather than in SQL because the list is polled and re-sorted on
 * every tick, and a machine that develops a fault should rise to the top
 * without a round trip. It is a stable partition, not a full sort: the
 * backend's ordering within each group is deliberate and preserved.
 */
function errorsFirst(machines: FleetMachine[]): FleetMachine[] {
  const failed = machines.filter(m => m.status === 'error')
  if (failed.length === 0) return machines
  return [...failed, ...machines.filter(m => m.status !== 'error')]
}

/**
 * The fleet, updating on its own.
 *
 * A client component only so it can poll - the markup is unchanged, and
 * FleetMachineRow was already a client component for row navigation. It reads
 * the persisted machine rows rather than BambuBuddy directly: the backend's
 * periodic sync keeps those current, so this stays a database read no matter
 * how many people have the page open.
 *
 * initialMachines comes from the server render, so there is no loading state
 * and no empty first paint.
 */
export function FleetMachineTable({ brand, initialMachines }: FleetMachineTableProps): JSX.Element {
  const { data: machines } = useFleetMachines(initialMachines)
  const ordered = errorsFirst(machines)

  return (
    <Card>
      <Table>
        <TableHead>
          <TableRow>
            {COLUMNS.map(column => (
              <TableHeaderCell key={column}>{column}</TableHeaderCell>
            ))}
            <TableHeaderCell className="text-right">Filaments</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {ordered.map(machine => (
            <FleetMachineRow key={machine.id} brand={brand} machine={machine} />
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
