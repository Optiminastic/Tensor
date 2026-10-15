import type { JSX } from 'react'

import { rupees } from '@/lib/agent-costs'
import type { CallStats, Funnel } from '@/lib/agent-overview'
import { money } from '@/lib/checkout-format'

interface AgentReturnSummaryProps {
  funnel: Funnel
  calls: CallStats
  currency: string
  /** "Last 7 days", or "Since 12 Oct, 6:09 pm" when go-live is later. */
  periodLabel: string
}

/**
 * The page's one sentence: what the agent cost, and what came back.
 *
 * Written out rather than tiled, because the question is a ratio - "we spent
 * this and got that" - and two tiles side by side leave the reader to do the
 * division. The figures still sit in mono so they can be found at a glance.
 */
export function AgentReturnSummary({
  funnel,
  calls,
  currency,
  periodLabel,
}: AgentReturnSummaryProps): JSX.Element {
  const returned = funnel.recoveredAfterContactValue
  const multiple = calls.totalCost > 0 ? returned / calls.totalCost : null

  return (
    <section className="border-border bg-surface rounded-lg border p-5 shadow-xs">
      <p className="text-subtle-foreground text-xs font-medium tracking-wide uppercase">
        {periodLabel}
      </p>
      <p className="text-foreground mt-2 text-lg leading-relaxed text-pretty">
        <Figure>{calls.placed}</Figure> call{calls.placed === 1 ? '' : 's'} cost{' '}
        <Figure>{rupees(calls.totalCost)}</Figure>. <Figure>{funnel.recoveredAfterContact}</Figure>{' '}
        checkout{funnel.recoveredAfterContact === 1 ? '' : 's'} the agent reached went on to pay,
        worth <Figure tone="success">{money(String(returned), currency)}</Figure>.
      </p>
      <dl className="border-border mt-4 grid gap-4 border-t pt-4 sm:grid-cols-3">
        <Item label="Cost per recovered cart">
          {calls.costPerRecovery === null ? '—' : rupees(calls.costPerRecovery)}
        </Item>
        <Item label="Return on spend">
          {multiple === null
            ? '—'
            : `${multiple.toLocaleString('en-IN', { maximumFractionDigits: 1 })}×`}
        </Item>
        <Item label="Spend breakdown">
          <span className="text-muted-foreground font-sans text-sm">
            Calls {rupees(calls.callCost)} · Number {rupees(calls.numberCost)}
          </span>
        </Item>
      </dl>
    </section>
  )
}

function Figure({ children, tone }: { children: React.ReactNode; tone?: 'success' }): JSX.Element {
  return (
    <span
      className={
        tone === 'success'
          ? 'text-success font-mono font-medium tabular-nums'
          : 'font-mono font-medium tabular-nums'
      }
    >
      {children}
    </span>
  )
}

function Item({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-subtle-foreground text-xs font-medium tracking-wide uppercase">
        {label}
      </dt>
      <dd className="text-foreground font-mono text-xl font-medium tabular-nums">{children}</dd>
    </div>
  )
}
