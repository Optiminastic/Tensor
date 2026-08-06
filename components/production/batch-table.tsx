import type { JSX } from 'react'

import { BatchRow } from '@/components/production/batch-row'
import type { BatchRecord } from '@/components/production/types'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableHead, TableHeaderCell, TableRow } from '@/components/ui/table'

interface BatchTableProps {
  brand: string
  batches: BatchRecord[]
}

const LEFT_COLUMNS = ['Batch', 'Status']
const NUMERIC_COLUMNS = ['Jobs', 'Units/Bed', 'Print Time', 'Filament', 'Utilisation']

export function BatchTable({ brand, batches }: BatchTableProps): JSX.Element {
  return (
    <Card>
      <Table>
        <TableHead>
          <TableRow>
            {LEFT_COLUMNS.map(column => (
              <TableHeaderCell key={column}>{column}</TableHeaderCell>
            ))}
            {NUMERIC_COLUMNS.map(column => (
              <TableHeaderCell key={column} className="text-right">
                {column}
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {batches.map(batch => (
            <BatchRow key={batch.id} brand={brand} batch={batch} />
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
