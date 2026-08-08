import { AlertTriangle, Lightbulb } from 'lucide-react'
import type { JSX } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Stat } from '@/components/ui/stat'
import { StatusPill } from '@/components/ui/status-pill'
import { inr, pct } from '@/lib/format'
import type { CPBreakdown, DesignPricing } from '@/lib/validators/designs'

const BREAKDOWN_ROWS: { key: keyof CPBreakdown; label: string }[] = [
  { key: 'filament', label: 'Filament' },
  { key: 'purge', label: 'Purge' },
  { key: 'electricity', label: 'Electricity' },
  { key: 'machine', label: 'Machine time' },
  { key: 'finishing', label: 'Finishing labour' },
  { key: 'consumables', label: 'Consumables' },
  { key: 'failure_provision', label: 'Failure provision' },
]

interface DesignVerdictProps {
  pricing: DesignPricing
}

/** The detailed costing: selling-price economics, the Green/Yellow/Red reasons,
 * the fix suggestions, and the itemised Design CP. The headline figures and the
 * cost composition live in the Overview (DesignOverview). */
export function DesignVerdict({ pricing }: DesignVerdictProps): JSX.Element {
  const { breakdown, reasons, suggestions, sp_warnings } = pricing

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Selling price economics</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Stat
              label="Reverse-economics price"
              value={inr(pricing.raw_sp, 2)}
              hint="Before snapping to the ladder"
            />
            <Stat
              label="CP % at recommended"
              value={
                pricing.cp_pct_at_recommended !== null ? pct(pricing.cp_pct_at_recommended) : '-'
              }
              hint="Cost share at the snapped price"
            />
          </div>
          {sp_warnings.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {sp_warnings.map(warning => (
                <li key={warning} className="text-muted-foreground flex items-start gap-2 text-sm">
                  <AlertTriangle className="text-warning mt-0.5 size-4 shrink-0" aria-hidden />
                  {warning}
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pre-check</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <StatusPill status={pricing.verdict} />
          {reasons.length > 0 ? (
            <ul className="text-muted-foreground flex list-disc flex-col gap-1 pl-5 text-sm">
              {reasons.map(reason => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">
              This design meets the brand&apos;s cost target.
            </p>
          )}
        </CardContent>
      </Card>

      {suggestions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>How to improve it</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2">
              {suggestions.map(suggestion => (
                <li key={suggestion} className="text-foreground flex items-start gap-2 text-sm">
                  <Lightbulb className="text-accent mt-0.5 size-4 shrink-0" aria-hidden />
                  {suggestion}
                </li>
              ))}
            </ul>
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
