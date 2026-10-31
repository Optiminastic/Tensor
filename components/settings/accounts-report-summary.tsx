import type { JSX } from 'react'

import { Card } from '@/components/ui/card'
import type { AccountsReport } from '@/lib/validators/accounts-report'

interface AccountsReportSummaryProps {
  report: AccountsReport
}

/**
 * The four facts worth knowing before scrolling: who it reaches, when the
 * next one goes, when the last one went, and which mailbox it comes from.
 *
 * A DEFINITION LIST, NOT KPI TILES. None of these is a figure to compare -
 * an address and a timestamp set in a large tabular face would read as
 * numbers that mean something, and they do not. The labels carry the
 * micro-label treatment and the values sit at body size.
 *
 * This was the "Last run" card, which lived at the bottom of the settings
 * form and therefore moved into the dialog with it - putting the date of the
 * last send behind a button marked Add email.
 */
export function AccountsReportSummary({ report }: AccountsReportSummaryProps): JSX.Element {
  const to = report.to.length
  const hidden = report.cc.length + report.bcc.length

  return (
    <Card className="p-5">
      {report.last_error ? (
        // The mail server's own words, above everything else on the page: a
        // register that failed last night is the only thing worth reading
        // first.
        <p role="alert" className="text-danger mb-4 text-sm text-pretty">
          Last attempt failed: {report.last_error}
        </p>
      ) : null}

      <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Item
          label="Goes to"
          value={to === 0 ? 'nobody yet' : report.to.join(', ')}
          note={hidden > 0 ? `+${hidden} cc/bcc` : undefined}
        />
        <Item label="Next run" value={day(report.next_window_end)} note="shortly after noon" />
        <Item
          label="Last sent"
          value={report.last_sent_at ? when(report.last_sent_at) : 'never'}
          note={report.last_sent_at ? `${report.last_row_count} line items` : undefined}
        />
        <Item label="Sent from" value={report.mailbox_from || 'not configured'} />
      </dl>
    </Card>
  )
}

function Item({
  label,
  value,
  note,
}: {
  label: string
  value: string
  note?: string
}): JSX.Element {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-muted-foreground font-mono text-[11px] tracking-[0.14em] uppercase">
        {label}
      </dt>
      {/* Truncated with the full value on hover: an address list is the one
          field here that can run to any length, and wrapping it would push
          the row out of alignment with its neighbours. */}
      <dd className="truncate text-sm" title={value}>
        {value}
      </dd>
      {note ? <dd className="text-subtle-foreground text-xs">{note}</dd> : null}
    </div>
  )
}

function day(value: string): string {
  const at = new Date(value)
  if (Number.isNaN(at.getTime())) return '—'
  return at.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

function when(value: string): string {
  const at = new Date(value)
  if (Number.isNaN(at.getTime())) return '—'
  return at.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
