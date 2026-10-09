'use client'

import type { JSX } from 'react'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { CopyableId } from '@/components/ui/copyable-id'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/table'
import type { MessageLog, MessageLogStatus } from '@/lib/validators/message-logs'

interface MessageLogsTableProps {
  logs: MessageLog[]
}

/**
 * The status, in the only three words the data supports.
 *
 * `sent` is NOT green on purpose. Green reads as "this worked", and all it
 * means is that Meta accepted the message - it accepts sends to numbers that
 * are not on WhatsApp, and India's per-recipient marketing cap drops accepted
 * messages silently. Neutral is honest; green would be a claim.
 */
const STATUS: Record<MessageLogStatus, { label: string; tone: 'neutral' | 'danger' | 'warning' }> =
  {
    sent: { label: 'Sent', tone: 'neutral' },
    failed: { label: 'Not sent', tone: 'danger' },
    pending: { label: 'Unfinished', tone: 'warning' },
  }

function when(raw: string): string {
  if (!raw) return '—'
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return raw
  return parsed.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function MessageLogsTable({ logs }: MessageLogsTableProps): JSX.Element {
  return (
    <Card>
      <Table dense>
        <TableHead>
          <TableRow>
            <TableHeaderCell className="whitespace-nowrap">When</TableHeaderCell>
            <TableHeaderCell className="whitespace-nowrap">Checkout</TableHeaderCell>
            <TableHeaderCell className="whitespace-nowrap">Customer</TableHeaderCell>
            <TableHeaderCell className="whitespace-nowrap">Phone</TableHeaderCell>
            <TableHeaderCell className="whitespace-nowrap">Status</TableHeaderCell>
            <TableHeaderCell className="text-right whitespace-nowrap">Tries</TableHeaderCell>
            <TableHeaderCell>Detail</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {logs.map(log => {
            const status = STATUS[log.status]
            return (
              <TableRow key={`${log.checkout_id}-${log.created_at}`}>
                <TableCell className="whitespace-nowrap">{when(log.sent_at)}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {log.checkout_name ? (
                    <CopyableId value={log.checkout_name} />
                  ) : (
                    <span className="text-subtle-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="max-w-[10rem] truncate" title={log.customer_name}>
                  {log.customer_name || '—'}
                </TableCell>
                <TableCell className="font-mono whitespace-nowrap">{log.phone || '—'}</TableCell>
                <TableCell className="whitespace-nowrap">
                  <Badge tone={status.tone}>{status.label}</Badge>
                </TableCell>
                <TableCell className="text-right font-mono whitespace-nowrap tabular-nums">
                  {log.attempts || '—'}
                </TableCell>
                {/* The sender's own sentence. On a failure this is the whole
                    value of the row - it names the thing to fix - so it is
                    never truncated away entirely. */}
                <TableCell
                  className="text-muted-foreground max-w-[26rem] truncate"
                  title={log.detail || log.message_id}
                >
                  {log.detail || (log.message_id ? 'Accepted by WhatsApp' : '—')}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Card>
  )
}
