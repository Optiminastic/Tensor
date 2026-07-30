import type { JSX } from 'react'

import type { FilamentRecord } from '@/components/production/types'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/table'

interface FilamentTableProps {
  filaments: FilamentRecord[]
}

export function FilamentTable({ filaments }: FilamentTableProps): JSX.Element {
  return (
    <Card>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Material</TableHeaderCell>
            <TableHeaderCell>Brand</TableHeaderCell>
            <TableHeaderCell>Color</TableHeaderCell>
            <TableHeaderCell className="text-right">Quantity</TableHeaderCell>
            <TableHeaderCell className="text-right">Diameter</TableHeaderCell>
            <TableHeaderCell className="text-right">Density</TableHeaderCell>
            <TableHeaderCell className="text-right">Price</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filaments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-muted-foreground text-center">
                No filaments match these filters.
              </TableCell>
            </TableRow>
          ) : (
            filaments.map(f => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{f.material}</TableCell>
                <TableCell className="text-muted-foreground">{f.brand}</TableCell>
                <TableCell>{f.color}</TableCell>
                <TableCell numeric>
                  {f.quantity} {f.quantityUnit}
                </TableCell>
                <TableCell numeric>{f.diameterMm.toFixed(2)} mm</TableCell>
                <TableCell numeric>{f.densityGCm3.toFixed(2)} g/cm³</TableCell>
                <TableCell numeric>₹{f.price.toLocaleString('en-IN')}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  )
}
