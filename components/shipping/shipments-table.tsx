'use client'

import { ChevronRight, RotateCcw } from 'lucide-react'
import { type JSX, useState } from 'react'

import { ShipmentDetailSheet } from '@/components/shipping/shipment-detail-sheet'
import { daysWaiting, day, reasonTone } from '@/components/shipping/shipment-reason'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/table'
import type { Shipment } from '@/lib/validators/shipments'

interface ShipmentsTableProps {
  shipments: Shipment[]
}

/**
 * How long since the carrier last said anything, as the first column.
 *
 * It is first because on the rows that matter it is the only number that
 * changes what somebody does next: Delhivery re-attempts a failed delivery a
 * couple of times over a few days and then sends the parcel back, so one silent
 * for four days is nearly out of chances and one silent since this morning is
 * not.
 *
 * Amber at two days, red at four, and ONLY on a row that is somebody's work.
 * A parcel delivered a week ago is also "7d" and is not a problem; colouring it
 * red would make most of a healthy list look like an emergency.
 *
 * Two thresholds rather than a gradient, because the decision behind them is
 * "today or tomorrow", not a continuous feeling.
 */
function Waiting({ shipment }: { shipment: Shipment }): JSX.Element {
  const days = daysWaiting(shipment)
  if (days === null) {
    return <span className="text-subtle-foreground">—</span>
  }
  const tone = !shipment.actionable
    ? 'text-subtle-foreground'
    : days >= 4
      ? 'text-danger'
      : days >= 2
        ? 'text-warning'
        : 'text-muted-foreground'
  return (
    <span className={`font-mono tabular-nums ${tone}`}>{days === 0 ? 'today' : `${days}d`}</span>
  )
}

export function ShipmentsTable({ shipments }: ShipmentsTableProps): JSX.Element {
  const [open, setOpen] = useState<Shipment | null>(null)

  return (
    <>
      <Card>
        <Table dense>
          <TableHead>
            <TableRow>
              <TableHeaderCell className="whitespace-nowrap">Last scan</TableHeaderCell>
              <TableHeaderCell className="whitespace-nowrap">Order</TableHeaderCell>
              <TableHeaderCell className="whitespace-nowrap">Customer</TableHeaderCell>
              <TableHeaderCell className="whitespace-nowrap">Phone</TableHeaderCell>
              <TableHeaderCell className="whitespace-nowrap">Destination</TableHeaderCell>
              <TableHeaderCell className="whitespace-nowrap">Reason</TableHeaderCell>
              <TableHeaderCell className="text-right whitespace-nowrap">Tries</TableHeaderCell>
              <TableHeaderCell className="whitespace-nowrap">Promised</TableHeaderCell>
              <TableHeaderCell>Carrier said</TableHeaderCell>
              <TableHeaderCell className="w-8" />
            </TableRow>
          </TableHead>
          <TableBody>
            {shipments.map(shipment => (
              <TableRow
                key={shipment.waybill}
                // The whole row opens the panel. Aiming at a link in the last
                // column makes the reader hit six pixels to open something the
                // entire row is about.
                onClick={() => setOpen(shipment)}
                className="cursor-pointer"
              >
                <TableCell className="whitespace-nowrap">
                  <Waiting shipment={shipment} />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <span className="flex items-center gap-1.5">
                    {shipment.order_name || '—'}
                    {/* The deadline on every other row: once a parcel has
                        turned around, ringing the customer no longer helps. */}
                    {shipment.returning ? (
                      <RotateCcw
                        className="text-danger size-3.5"
                        aria-label="Returning to origin"
                      />
                    ) : null}
                  </span>
                </TableCell>
                <TableCell className="max-w-[10rem] truncate" title={shipment.customer_name}>
                  {shipment.customer_name || '—'}
                </TableCell>
                <TableCell className="font-mono whitespace-nowrap">
                  {shipment.phone ? (
                    // Stops the row's click so a tap on the number dials
                    // instead of opening the panel.
                    <a
                      href={`tel:${shipment.phone}`}
                      onClick={event => event.stopPropagation()}
                      className="hover:text-accent"
                    >
                      {shipment.phone}
                    </a>
                  ) : (
                    <span className="text-subtle-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="max-w-[11rem] truncate" title={shipment.address}>
                  {[shipment.city, shipment.state].filter(Boolean).join(', ') || '—'}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <Badge tone={reasonTone(shipment.reason)}>{shipment.reason_label}</Badge>
                </TableCell>
                <TableCell className="text-right font-mono whitespace-nowrap tabular-nums">
                  {shipment.attempts || '—'}
                </TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  {day(shipment.promised_at)}
                </TableCell>
                {/* Delhivery's own sentence. Truncated for width but complete
                    in the title and in the panel - the classification above is
                    derived from this, so it is never hidden entirely. */}
                <TableCell
                  className="text-muted-foreground max-w-[18rem] truncate"
                  title={shipment.instruction}
                >
                  {shipment.instruction || '—'}
                </TableCell>
                <TableCell className="text-right">
                  <ChevronRight className="text-muted-foreground size-4" aria-hidden />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <ShipmentDetailSheet shipment={open} onClose={() => setOpen(null)} />
    </>
  )
}
