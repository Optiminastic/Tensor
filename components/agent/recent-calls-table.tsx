import Link from 'next/link'
import type { JSX } from 'react'

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
import { rupees } from '@/lib/agent-costs'
import type { RecentCall } from '@/lib/agent-overview'
import { callTime, duration, readable } from '@/lib/call-format'

interface RecentCallsTableProps {
  brand: string
  calls: RecentCall[]
}

/**
 * The last ten calls, each with what it cost.
 *
 * The cost column is the reason this table exists: a total says what the
 * agent spent, and only the rows say where - one long call that went nowhere
 * can be most of a week's bill.
 */
export function RecentCallsTable({ brand, calls }: RecentCallsTableProps): JSX.Element {
  if (calls.length === 0) {
    return (
      <p className="text-muted-foreground rounded-md border border-dashed px-4 py-8 text-center text-sm">
        No calls in this period. The agent rings a checkout once it has been quiet long enough.
      </p>
    )
  }

  return (
    <Card>
      <Table dense aria-label="Latest calls">
        <TableHead>
          <TableRow>
            <TableHeaderCell>When</TableHeaderCell>
            <TableHeaderCell>Customer</TableHeaderCell>
            <TableHeaderCell>Outcome</TableHeaderCell>
            <TableHeaderCell className="text-right">Length</TableHeaderCell>
            <TableHeaderCell className="text-right">Cost</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {calls.map(({ call, cost }) => (
            <TableRow key={call.attempt_id}>
              <TableCell className="whitespace-nowrap">{callTime(call.started_at)}</TableCell>
              <TableCell>
                <span className="text-foreground font-medium">{call.customer_name || '—'}</span>
                {call.checkout_name ? (
                  <Link
                    href={`/dashboard/${brand}/agent/abandoned-checkout`}
                    className="text-subtle-foreground block font-mono text-xs whitespace-nowrap hover:underline"
                  >
                    {call.checkout_name}
                  </Link>
                ) : null}
              </TableCell>
              <TableCell>
                {call.connected ? (
                  <Badge tone="neutral">
                    {readable(call.disposition) === '—' ? 'Connected' : readable(call.disposition)}
                  </Badge>
                ) : (
                  <Badge tone="danger">
                    {readable(call.failure_reason) === '—'
                      ? 'Not connected'
                      : readable(call.failure_reason)}
                  </Badge>
                )}
              </TableCell>
              <TableCell numeric>{duration(call.duration_seconds)}</TableCell>
              <TableCell numeric>{rupees(cost)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
