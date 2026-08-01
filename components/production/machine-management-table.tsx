import type { JSX } from 'react'

import { MachineManagementRow } from '@/components/production/machine-management-row'
import type { MachineRecord } from '@/components/production/types'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableHead, TableHeaderCell, TableRow } from '@/components/ui/table'

interface MachineManagementTableProps {
  brand: string
  machines: MachineRecord[]
}

export function MachineManagementTable({
  brand,
  machines,
}: MachineManagementTableProps): JSX.Element {
  return (
    <Card>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Machine</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Added</TableHeaderCell>
            <TableHeaderCell className="text-right">Change status</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {machines.map(machine => (
            <MachineManagementRow key={machine.id} brand={brand} machine={machine} />
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
