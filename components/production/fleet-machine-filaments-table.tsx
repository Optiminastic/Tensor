import type { JSX } from 'react'

import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/table'
import type { FleetFilament } from '@/lib/validators/machine-fleet'

interface FleetMachineFilamentsTableProps {
  filaments: FleetFilament[]
}

export function FleetMachineFilamentsTable({
  filaments,
}: FleetMachineFilamentsTableProps): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Loaded filaments</CardTitle>
      </CardHeader>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Colour</TableHeaderCell>
            <TableHeaderCell>Type</TableHeaderCell>
            <TableHeaderCell className="text-right">Remaining</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filaments.map(filament => (
            <TableRow key={`${filament.colour}-${filament.type}`}>
              <TableCell>{filament.colour}</TableCell>
              <TableCell>{filament.type}</TableCell>
              <TableCell numeric>{filament.remaining_grams.toFixed(0)} g</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
