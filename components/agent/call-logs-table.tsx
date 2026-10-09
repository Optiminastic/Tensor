'use client'

import { Play } from 'lucide-react'
import { type JSX, useState } from 'react'

import { CallDetailSheet } from '@/components/agent/call-detail-sheet'
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
import type { CallLog } from '@/lib/validators/call-logs'

interface CallLogsTableProps {
  brand: string
  logs: CallLog[]
}

/** mm:ss. A call is seconds-to-minutes; anything longer is another problem. */
function duration(seconds: number): string {
  const whole = Math.round(seconds)
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
}

/** Sarvam sends "2026-10-07T07:49:48" with no zone; it is UTC. */
function when(raw: string): string {
  const parsed = new Date(raw.endsWith('Z') ? raw : `${raw}Z`)
  if (Number.isNaN(parsed.getTime())) return raw
  return parsed.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * The outcome, as the AGENT recorded it.
 *
 * `no_response` is not a failure - the call connected and the customer said
 * nothing useful - so it is neutral rather than red. Red is for a call that
 * never reached anybody, which is the one an operator can act on.
 */
function dispositionTone(log: CallLog): 'success' | 'warning' | 'neutral' | 'danger' {
  if (!log.connected) return 'danger'
  if (log.disposition === '' || log.disposition === 'no_response') return 'neutral'
  if (log.disposition.includes('agreed') || log.disposition.includes('success')) return 'success'
  if (log.disposition.includes('wrong') || log.disposition.includes('not_interested')) {
    return 'warning'
  }
  return 'neutral'
}

/** Human form of Sarvam's SCREAMING_SNAKE outcomes. */
function readable(value: string): string {
  if (!value || value.startsWith('NO_')) return '—'
  return value.toLowerCase().replaceAll('_', ' ')
}

export function CallLogsTable({ brand, logs }: CallLogsTableProps): JSX.Element {
  const [open, setOpen] = useState<CallLog | null>(null)

  return (
    <>
      <Card>
        <Table dense>
          <TableHead>
            <TableRow>
              <TableHeaderCell className="whitespace-nowrap">When</TableHeaderCell>
              <TableHeaderCell className="whitespace-nowrap">Checkout</TableHeaderCell>
              <TableHeaderCell className="whitespace-nowrap">Customer</TableHeaderCell>
              <TableHeaderCell className="whitespace-nowrap">Contact</TableHeaderCell>
              <TableHeaderCell className="whitespace-nowrap">Outcome</TableHeaderCell>
              <TableHeaderCell className="whitespace-nowrap">Length</TableHeaderCell>
              <TableHeaderCell>Summary</TableHeaderCell>
              <TableHeaderCell className="text-right whitespace-nowrap">Details</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map(log => (
              <TableRow
                key={log.attempt_id}
                // The whole row opens the panel. A link in the last column
                // would make the reader aim at six pixels to open something
                // the entire row is about.
                onClick={() => setOpen(log)}
                className="cursor-pointer"
              >
                <TableCell className="whitespace-nowrap">{when(log.started_at)}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {log.checkout_name ? (
                    <span
                      className="flex items-center gap-1.5"
                      // The id copies on click, which must not also open the
                      // panel behind it.
                      onClick={event => event.stopPropagation()}
                    >
                      <CopyableId value={log.checkout_name} />
                      {log.matched_by === 'phone' ? (
                        <Badge tone="neutral" title="Matched on the phone number, not the call id">
                          ~
                        </Badge>
                      ) : null}
                    </span>
                  ) : log.from_console ? (
                    <Badge tone="neutral">Console test</Badge>
                  ) : (
                    <span className="text-subtle-foreground">Not a checkout call</span>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap">{log.customer_name || '—'}</TableCell>
                <TableCell className="max-w-[12rem] truncate font-mono" title={log.phone}>
                  {log.phone}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <Badge tone={dispositionTone(log)}>
                    {log.connected ? readable(log.disposition) : readable(log.failure_reason)}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono whitespace-nowrap tabular-nums">
                  {duration(log.duration_seconds)}
                </TableCell>
                <TableCell
                  className="text-muted-foreground max-w-[24rem] truncate"
                  title={log.summary}
                >
                  {log.summary || '—'}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <span className="text-accent inline-flex items-center gap-1 text-xs">
                    <Play className="size-3" aria-hidden />
                    Open
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <CallDetailSheet brand={brand} call={open} onClose={() => setOpen(null)} />
    </>
  )
}
