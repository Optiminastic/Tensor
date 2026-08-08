import { Check, X } from 'lucide-react'
import type { JSX } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { StatusPill } from '@/components/ui/status-pill'
import { inr, pct } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { CPBreakdown, DesignPricing, Verdict } from '@/lib/validators/designs'

// The seven cost components, in a fixed order. The order is the identity: each
// slot maps to a fixed step of the azure ramp, so a segment's colour follows the
// component, not its rank - it never repaints as the figures change.
const COMPONENTS: { key: keyof CPBreakdown; label: string }[] = [
  { key: 'filament', label: 'Filament' },
  { key: 'machine', label: 'Machine time' },
  { key: 'purge', label: 'Purge' },
  { key: 'finishing', label: 'Finishing labour' },
  { key: 'electricity', label: 'Electricity' },
  { key: 'consumables', label: 'Consumables' },
  { key: 'failure_provision', label: 'Failure provision' },
]

// A single-hue sequential ramp: the accent mixed down into the muted surface, so
// the scale is one considered azure light->dark rather than a decorative rainbow.
// Lightness-ordered, so it stays legible under colour-vision deficiency.
const RAMP_WEIGHTS = [100, 84, 70, 56, 44, 34, 26]

// The reserved status fills for the Green / Yellow / Red verdict. Status colour
// is never reused for a data series; it always ships beside the StatusPill's
// icon + label, so meaning is never carried by colour alone.
const VERDICT_FILL: Record<Verdict, string> = {
  green: 'var(--success)',
  yellow: 'var(--warning)',
  red: 'var(--danger)',
}

function rampColor(index: number): string {
  const weight = RAMP_WEIGHTS[index] ?? 20
  return `color-mix(in oklab, var(--accent) ${weight}%, var(--surface-muted))`
}

interface Segment {
  key: string
  label: string
  value: number
  fraction: number
  color: string
}

function buildSegments(breakdown: CPBreakdown): Segment[] {
  const total = COMPONENTS.reduce((sum, row) => sum + Math.max(0, breakdown[row.key]), 0)
  return COMPONENTS.map((row, index) => {
    const value = Math.max(0, breakdown[row.key])
    return {
      key: String(row.key),
      label: row.label,
      value,
      fraction: total > 0 ? value / total : 0,
      color: rampColor(index),
    }
  })
}

interface DesignOverviewProps {
  pricing: DesignPricing
  onSeePricing: () => void
}

/** The at-a-glance Overview: an economics hero with the Design CP composition,
 * and a pre-check analyzer showing cost as a share of the price. */
export function DesignOverview({ pricing, onSeePricing }: DesignOverviewProps): JSX.Element {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <EconomicsCard pricing={pricing} />
      <AnalyzerCard pricing={pricing} onSeePricing={onSeePricing} />
    </div>
  )
}

function Label({ children }: { children: string }): JSX.Element {
  return (
    <p className="text-subtle-foreground text-xs font-medium tracking-wide uppercase">{children}</p>
  )
}

function EconomicsCard({ pricing }: { pricing: DesignPricing }): JSX.Element {
  const segments = buildSegments(pricing.breakdown)

  return (
    <Card className="lg:col-span-2">
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Label>Recommended price</Label>
            <p className="text-foreground mt-1 font-mono text-3xl font-medium tracking-tight tabular-nums">
              {pricing.recommended_sp !== null ? inr(pricing.recommended_sp) : '-'}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusPill status={pricing.verdict} />
              <span className="text-muted-foreground font-mono text-xs tabular-nums">
                Design CP {inr(pricing.design_cp, 2)} · {pct(pricing.cp_pct)} of price
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <MarginCheck ok={pricing.passes_normal} label="Passes at 30% ad spend" />
            <MarginCheck ok={pricing.survives_stress} label="Survives 40% stress test" />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label>What the cost is made of</Label>
            <span className="text-muted-foreground font-mono text-xs tabular-nums">
              Design CP {inr(pricing.design_cp, 2)}
            </span>
          </div>
          <CompositionBar segments={segments} />
          <ul className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            {segments.map(segment => (
              <li key={segment.key} className="flex items-center gap-2 text-xs">
                <span
                  className="size-2.5 shrink-0 rounded-sm"
                  style={{ background: segment.color }}
                  aria-hidden
                />
                <span className="text-muted-foreground flex-1 truncate">{segment.label}</span>
                <span className="text-foreground font-mono tabular-nums">
                  {inr(segment.value, 2)}
                </span>
                <span className="text-subtle-foreground w-12 text-right font-mono tabular-nums">
                  {pct(segment.fraction)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

function CompositionBar({ segments }: { segments: Segment[] }): JSX.Element {
  const shown = segments.filter(segment => segment.fraction > 0)
  return (
    <div
      className="flex h-3 w-full gap-0.5"
      role="img"
      aria-label="Design CP composition by cost component"
    >
      {shown.map(segment => (
        <span
          key={segment.key}
          className="h-full min-w-[3px] rounded-sm"
          style={{ width: `${segment.fraction * 100}%`, background: segment.color }}
        />
      ))}
    </div>
  )
}

interface AnalyzerCardProps {
  pricing: DesignPricing
  onSeePricing: () => void
}

function AnalyzerCard({ pricing, onSeePricing }: AnalyzerCardProps): JSX.Element {
  const cost = Math.min(1, Math.max(0, pricing.cp_pct))
  const headroom = 1 - cost

  return (
    <Card>
      <CardContent className="flex flex-col gap-5">
        <div>
          <Label>CP % of price</Label>
          <p className="text-foreground mt-1 font-mono text-3xl font-medium tracking-tight tabular-nums">
            {pct(pricing.cp_pct)}
          </p>
          <div className="mt-2">
            <StatusPill status={pricing.verdict} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex h-3 w-full gap-0.5" role="img" aria-label="Cost as a share of price">
            <span
              className="h-full min-w-[3px] rounded-sm"
              style={{ width: `${cost * 100}%`, background: VERDICT_FILL[pricing.verdict] }}
            />
            <span className="bg-surface-muted h-full flex-1 rounded-sm" />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <span
                className="size-2 rounded-sm"
                style={{ background: VERDICT_FILL[pricing.verdict] }}
                aria-hidden
              />
              Cost {pct(cost)}
            </span>
            <span className="text-muted-foreground flex items-center gap-1.5">
              <span className="bg-surface-muted size-2 rounded-sm" aria-hidden />
              Headroom {pct(headroom)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {pricing.reasons.length > 0 ? (
            <ul className="text-muted-foreground flex list-disc flex-col gap-1 pl-5 text-sm">
              {pricing.reasons.map(reason => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">
              This design meets the brand&apos;s cost target.
            </p>
          )}
          <button
            type="button"
            onClick={onSeePricing}
            className="text-accent hover:text-accent-hover self-start text-sm font-medium"
          >
            See the full breakdown →
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

interface MarginCheckProps {
  ok: boolean
  label: string
}

/** A pass/fail pill for a margin scenario (normal 30% ad spend, 40% stress). */
function MarginCheck({ ok, label }: MarginCheckProps): JSX.Element {
  const Icon = ok ? Check : X
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium',
        ok ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger',
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {label}
    </span>
  )
}
