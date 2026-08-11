import type { JSX } from 'react'

import { DispatchCreateDialog } from '@/components/production/dispatch-create-dialog'
import { DispatchRow } from '@/components/production/dispatch-row'
import type { DispatchReadyOrder } from '@/components/production/types'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/table'
import type { DispatchOrder } from '@/lib/validators/dispatch'

const COLUMNS = ['Order', 'Carrier', 'Tracking', 'Status', 'Dispatched', 'Booked']

interface DispatchQueueTableProps {
  brand: string
  dispatches: DispatchOrder[]
  readyOrders: DispatchReadyOrder[]
  // order_id -> order_number, resolved by the page so rows can show something
  // human-readable (the dispatch DTO carries only the id).
  orderNumbers: Record<string, string>
}

/** The last stage of the pipeline: shipments booked against packed orders, and
 * the handover that flips one to dispatched (internal/httpapi/dispatch.go). */
export function DispatchQueueTable({
  brand,
  dispatches,
  readyOrders,
  orderNumbers,
}: DispatchQueueTableProps): JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm">
          {readyOrders.length > 0
            ? `${readyOrders.length} packed ${readyOrders.length === 1 ? 'order is' : 'orders are'} waiting on a shipment.`
            : 'No packed orders are waiting on a shipment.'}
        </p>
        <DispatchCreateDialog brand={brand} readyOrders={readyOrders} />
      </div>
      <Card>
        <Table>
          <TableHead>
            <TableRow>
              {COLUMNS.map(column => (
                <TableHeaderCell key={column}>{column}</TableHeaderCell>
              ))}
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dispatches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COLUMNS.length + 1} className="text-muted-foreground">
                  No shipments booked yet.
                </TableCell>
              </TableRow>
            ) : (
              dispatches.map(dispatch => (
                <DispatchRow
                  key={dispatch.id}
                  brand={brand}
                  dispatch={dispatch}
                  orderNumber={orderNumbers[dispatch.order_id] ?? null}
                />
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
