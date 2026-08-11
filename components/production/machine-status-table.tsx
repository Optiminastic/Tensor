import Link from 'next/link'
import type { JSX } from 'react'

import { FLEET_MACHINE_STATUS_CONFIG } from '@/components/production/status-config'
import { TonePill } from '@/components/production/tone-pill'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/table'
import type { FleetMachineStatus } from '@/lib/validators/machine-fleet'

export interface MachineStatusRow {
  id: string
  name: string
  status: FleetMachineStatus
  jobsDone: number
  queuedBatches: number
}

interface MachineStatusTableProps {
  brand: string
  rows: MachineStatusRow[]
}

const COLUMNS = ['Machine', 'Status', 'Jobs Done', 'Queued Batches']

/** One row per printer: live status, jobs completed in the selected date
 * range, and batches currently waiting on it (not date-scoped - "currently
 * queued" is a live count regardless of the range above). */
export function MachineStatusTable({ brand, rows }: MachineStatusTableProps): JSX.Element {
  return (
    <Card>
      <Table>
        <TableHead>
          <TableRow>
            {COLUMNS.map(column => (
              <TableHeaderCell
                key={column}
                className={column === 'Machine' || column === 'Status' ? undefined : 'text-right'}
              >
                {column}
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={COLUMNS.length}
                className="text-muted-foreground text-center text-sm"
              >
                No machines registered yet.
              </TableCell>
            </TableRow>
          ) : (
            rows.map(row => {
              const status = FLEET_MACHINE_STATUS_CONFIG[row.status]
              return (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/${brand}/production/machines/${row.id}`}
                      className="hover:text-accent"
                    >
                      {row.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <TonePill label={status.label} tone={status.tone} />
                  </TableCell>
                  <TableCell numeric>{row.jobsDone}</TableCell>
                  <TableCell numeric>{row.queuedBatches}</TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </Card>
  )
}
