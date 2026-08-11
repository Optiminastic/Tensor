import type { JSX } from 'react'

import { BatchRow } from '@/components/production/batch-row'
import type { BatchRecord } from '@/components/production/types'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/table'

interface BatchTableGridProps {
  brand: string
  batches: BatchRecord[]
}

const LEFT_COLUMNS = ['Batch', 'Status']
const NUMERIC_COLUMNS = ['Jobs', 'Units/Bed', 'Print Time', 'Filament', 'Utilisation']

/** The plain batch table - no filter bar of its own. Used by BatchTable
 * (which adds its own search/status/material filter bar) and by
 * MachineQueueBoard's List view (which reuses the board's own filter row
 * instead of showing a second, duplicate one). */
export function BatchTableGrid({ brand, batches }: BatchTableGridProps): JSX.Element {
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
          {batches.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={LEFT_COLUMNS.length + NUMERIC_COLUMNS.length}
                className="text-muted-foreground text-center text-sm"
              >
                No batches match these filters.
              </TableCell>
            </TableRow>
          ) : (
            batches.map(batch => <BatchRow key={batch.id} brand={brand} batch={batch} />)
          )}
        </TableBody>
      </Table>
    </Card>
  )
}
