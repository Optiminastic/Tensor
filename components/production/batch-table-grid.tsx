import type { JSX, ReactNode } from 'react'

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
  /**
   * Rendered inside the card, under the table - the pagination bar, where the
   * caller pages.
   *
   * A slot rather than paging in here, because this grid is presentational and
   * has two callers: the Batch Management page, which pages a filtered list,
   * and the machine board's List view, which shows one machine's beds and has
   * nothing to page.
   */
  footer?: ReactNode
}

// Jobs sits on the left now: it holds the orders on the bed as tags, not a
// figure, and right-aligning a wrapping list of chips reads as ragged.
const LEFT_COLUMNS = ['Batch', 'Status', 'Colours', 'Jobs']
const NUMERIC_COLUMNS = ['Units/Bed', 'Print Time', 'Filament', 'Utilisation']
// Trailing action column. Unlabelled: the buttons in it say what they do, and a
// header reading "Actions" would only widen the row.
const ACTION_COLUMNS = ['']

/** The plain batch table - no filter bar of its own. Used by BatchTable
 * (which adds its own search/status/material filter bar) and by
 * MachineQueueBoard's List view (which reuses the board's own filter row
 * instead of showing a second, duplicate one). */
export function BatchTableGrid({ brand, batches, footer }: BatchTableGridProps): JSX.Element {
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
            {ACTION_COLUMNS.map((column, i) => (
              <TableHeaderCell key={`action-${i}`} className="text-right">
                <span className="sr-only">Actions</span>
                {column}
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {batches.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={LEFT_COLUMNS.length + NUMERIC_COLUMNS.length + ACTION_COLUMNS.length}
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
      {footer}
    </Card>
  )
}
