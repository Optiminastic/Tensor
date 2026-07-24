import { AlertTriangle } from 'lucide-react'
import type { JSX } from 'react'

import type { CalculationResult } from '@/app/dashboard/[brand]/costing/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Stat } from '@/components/ui/stat'
import { StatusPill } from '@/components/ui/status-pill'

interface PriceResultProps {
  result: CalculationResult
}

function inr(value: number, digits = 0): string {
  return `₹${value.toLocaleString('en-IN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`
}

function pct(fraction: number): string {
  return `${(fraction * 100).toFixed(1)}%`
}

const BREAKDOWN_ROWS: { key: keyof CalculationResult['breakdown']; label: string }[] = [
  { key: 'filament', label: 'Filament' },
  { key: 'purge', label: 'Purge' },
  { key: 'electricity', label: 'Electricity' },
  { key: 'machine', label: 'Machine time' },
  { key: 'finishing', label: 'Finishing labour' },
  { key: 'consumables', label: 'Consumables' },
  { key: 'failure_provision', label: 'Failure provision' },
]

/** The priced result: headline figures, the pre-check verdict, and the CP breakdown. */
export function PriceResult({ result }: PriceResultProps): JSX.Element {
  const { breakdown, selling, status } = result
  const recommended = selling.recommended_sp

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Design CP" value={inr(breakdown.design_cp, 2)} hint="True per-unit cost" />
        <Stat
          label="Recommended price"
          value={recommended !== null ? inr(recommended) : '-'}
          hint={recommended !== null ? 'Snapped up to the ladder' : 'Raw price is above the ladder'}
        />
        <Stat
          label="CP % at price"
          value={selling.cp_pct_at_recommended !== null ? pct(selling.cp_pct_at_recommended) : '-'}
          hint="Cost as a share of price"
        />
      </div>

      {status ? (
        <Card>
          <CardHeader>
            <CardTitle>Pre-check</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <StatusPill status={status.status} />
              <span className="text-muted-foreground font-mono text-sm tabular-nums">
                CP {pct(status.cp_pct)} of price
              </span>
              <span className="text-muted-foreground text-sm">
                {selling.survives_stress
                  ? 'Survives the 40% ad-spend stress test'
                  : 'Does not survive the 40% ad-spend stress test'}
              </span>
            </div>
            {status.reasons.length > 0 ? (
              <ul className="text-muted-foreground flex list-disc flex-col gap-1 pl-5 text-sm">
                {status.reasons.map(reason => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {selling.warnings.length > 0 ? (
        <Card>
          <CardContent className="flex flex-col gap-2">
            {selling.warnings.map(warning => (
              <p key={warning} className="text-warning flex items-start gap-2 text-sm">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {warning}
              </p>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Design CP breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="flex flex-col">
            {BREAKDOWN_ROWS.map(row => (
              <div
                key={row.key}
                className="border-border flex items-center justify-between border-b py-2 last:border-b-0"
              >
                <dt className="text-muted-foreground text-sm">{row.label}</dt>
                <dd className="text-foreground font-mono text-sm tabular-nums">
                  {inr(breakdown[row.key], 2)}
                </dd>
              </div>
            ))}
            <div className="border-border flex items-center justify-between border-t-2 py-2">
              <dt className="text-foreground text-sm font-medium">Design CP</dt>
              <dd className="text-foreground font-mono text-sm font-medium tabular-nums">
                {inr(breakdown.design_cp, 2)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
