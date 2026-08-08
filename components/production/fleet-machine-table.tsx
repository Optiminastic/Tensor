import type { JSX } from 'react'

import { FleetMachineRow } from '@/components/production/fleet-machine-row'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableHead, TableHeaderCell, TableRow } from '@/components/ui/table'
import type { FleetMachine } from '@/lib/validators/machine-fleet'

interface FleetMachineTableProps {
  brand: string
  machines: FleetMachine[]
}

const COLUMNS = ['Machine', 'Machine ID', 'Status', 'Current Batch', 'Layer', 'Time Remaining']

export function FleetMachineTable({ brand, machines }: FleetMachineTableProps): JSX.Element {
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
          {machines.map(machine => (
            <FleetMachineRow key={machine.id} brand={brand} machine={machine} />
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
