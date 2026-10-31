import { AlertTriangle, Check, Download } from 'lucide-react'
import type { JSX } from 'react'

import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/table'
import { Tag } from '@/components/ui/tag'
import type { AccountsReportRun } from '@/lib/validators/accounts-report'

interface AccountsReportRunsProps {
  brand: string
  runs: AccountsReportRun[]
  /** Decides which single sentence the empty state shows. */
  enabled: boolean
}

const FIGURE = 'font-mono tabular-nums'

/**
 * Every register that has gone out, and every one that failed trying.
 *
 * THE FAILURES ARE THE POINT, as much as the successes. "Nothing arrived on
 * Thursday" cannot be answered by a list of what did arrive, and the settings
 * row this page used to show kept only the LAST send - overwritten daily, so
 * the morning after a failure there was nothing left to read.
 *
 * The spreadsheet hangs off each row because the alternative is asking the
 * person who received the mail to forward it back.
 */
export function AccountsReportRuns({ brand, runs, enabled }: AccountsReportRunsProps): JSX.Element {
  if (runs.length === 0) {
    return (
      <Card className="flex flex-col gap-2 p-6">
        <h2 className="text-base font-medium">Sent registers</h2>
        {/* ONE SENTENCE, and which one depends on the switch. The commonest
            reason this is empty is that the daily send was never turned on,
            and that is a different thing to tell somebody than "wait". */}
        <p className="text-muted-foreground text-sm text-pretty">
          {enabled
            ? 'Nothing sent yet. The first register goes out after noon.'
            : 'Nothing sent yet. Switch on Sending daily to start.'}
        </p>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-medium">Sent registers</h2>
        <span className="text-muted-foreground text-xs">
          {runs.length} {runs.length === 1 ? 'run' : 'runs'}, newest first
        </span>
      </div>

      <Table dense>
        <TableHead>
          <TableRow>
            {['Day covered', 'Sent', 'Status', 'Rows', 'To', ''].map(h => (
              <TableHeaderCell key={h}>{h}</TableHeaderCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {runs.map(run => (
            <RunRow key={run.id} brand={brand} run={run} />
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}

function RunRow({ brand, run }: { brand: string; run: AccountsReportRun }): JSX.Element {
  const failed = run.status === 'failed'
  return (
    <TableRow>
      <TableCell className={`py-2 ${FIGURE}`}>{dayCovered(run)}</TableCell>
      <TableCell className={`py-2 ${FIGURE}`}>{when(run.sent_at)}</TableCell>
      <TableCell className="py-2">
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5">
            <Tag tone={failed ? 'danger' : 'success'}>
              {failed ? (
                <AlertTriangle className="size-3" aria-hidden />
              ) : (
                <Check className="size-3" aria-hidden />
              )}
              {failed ? 'Failed' : 'Sent'}
            </Tag>
            {/* A test send and the day's register look identical otherwise,
                and only one of them closes the window. */}
            {run.source === 'manual' ? <Tag tone="muted">Manual</Tag> : null}
          </span>
          {failed && run.detail ? (
            // The mail server's own words. "Could not send" tells nobody
            // whether to fix a password or a recipient.
            <span className="text-danger max-w-sm text-xs text-pretty">{run.detail}</span>
          ) : null}
        </div>
      </TableCell>
      <TableCell className={`py-2 ${FIGURE}`} numeric>
        {run.rows}
      </TableCell>
      <TableCell
        className="text-muted-foreground max-w-56 truncate py-2 text-sm"
        title={addresses(run)}
      >
        {addresses(run)}
      </TableCell>
      <TableCell className="py-2">
        {run.has_file ? (
          <a
            href={`/api/accounts-report/${encodeURIComponent(brand)}/runs/${encodeURIComponent(run.id)}`}
            className="text-foreground hover:text-accent inline-flex items-center gap-1.5 text-sm whitespace-nowrap"
          >
            <Download className="size-3.5" aria-hidden />
            Excel
          </a>
        ) : (
          // A failed run attached nothing, and a register sent before this
          // history existed was never stored. Both are honest dashes.
          <span className="text-subtle-foreground text-sm">—</span>
        )}
      </TableCell>
    </TableRow>
  )
}

/** Who it went to, To first, with the rest counted rather than listed. */
function addresses(run: AccountsReportRun): string {
  const hidden = run.cc.length + run.bcc.length
  const to = run.to.join(', ')
  return hidden > 0 ? `${to} (+${hidden})` : to
}

/**
 * The register's day, which is its window END - a spreadsheet covering noon
 * Tuesday to noon Wednesday is "Wednesday's", and that is what the accountant
 * asks for.
 */
function dayCovered(run: AccountsReportRun): string {
  const end = new Date(run.window_end)
  if (Number.isNaN(end.getTime())) return '—'
  return end.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
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
