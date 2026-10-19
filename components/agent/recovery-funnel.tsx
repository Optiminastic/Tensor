import type { JSX } from 'react'

import type { Funnel } from '@/lib/agent-overview'
import { money } from '@/lib/checkout-format'

interface RecoveryFunnelProps {
  funnel: Funnel
  currency: string
  /**
   * True when the message ledger could not be read.
   *
   * "Reached by the agent" counts a cart contacted by CALL OR BY MESSAGE,
   * so a missing ledger silently lowers it - and every percentage under it.
   * The bars would still be drawn, confidently, at the wrong length.
   */
  messagesUnavailable?: boolean
}

interface Step {
  label: string
  count: number
  detail?: string
  tone: 'accent' | 'success'
}

/**
 * Abandoned → reached → paid, as bars measured against the abandoned count.
 *
 * One hue for the volume steps and success for the last, because the last is
 * an outcome rather than a quantity: it is the step the whole agent exists for.
 * Every bar carries its count and share as text, so the colour is never the
 * only thing saying what it is.
 */
export function RecoveryFunnel({
  funnel,
  currency,
  messagesUnavailable = false,
}: RecoveryFunnelProps): JSX.Element {
  const steps: Step[] = [
    { label: 'Abandoned', count: funnel.abandoned, tone: 'accent' },
    { label: 'Reached by the agent', count: funnel.contacted, tone: 'accent' },
    {
      label: 'Paid after being reached',
      count: funnel.recoveredAfterContact,
      detail: money(String(funnel.recoveredAfterContactValue), currency),
      tone: 'success',
    },
  ]

  return (
    <section className="border-border bg-surface flex flex-col gap-4 rounded-lg border p-5 shadow-xs">
      <h2 className="text-foreground text-sm font-medium">Recovery funnel</h2>
      {messagesUnavailable ? (
        <p className="text-warning text-xs text-pretty">
          The message ledger could not be read, so “reached by the agent” counts calls only — the
          real figure is this one or higher.
        </p>
      ) : null}
      <ol className="flex flex-col gap-3">
        {steps.map(step => (
          <FunnelStep key={step.label} step={step} total={funnel.abandoned} />
        ))}
      </ol>
      {/* Said, not hidden: Shopify counts a customer who came back on their
          own as recovered too, and those are not the agent's to claim. */}
      <p className="text-muted-foreground text-xs text-pretty">
        <span className="font-mono tabular-nums">{funnel.recovered}</span> recovered in all, worth{' '}
        <span className="font-mono tabular-nums">
          {money(String(funnel.recoveredValue), currency)}
        </span>
        . Only those that paid after the agent&apos;s first call or message count above.
      </p>
    </section>
  )
}

function FunnelStep({ step, total }: { step: Step; total: number }): JSX.Element {
  const share = total > 0 ? step.count / total : 0
  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{step.label}</span>
        <span className="text-foreground font-mono tabular-nums">
          {step.count}
          <span className="text-subtle-foreground"> · {Math.round(share * 100)}%</span>
          {step.detail ? <span className="text-subtle-foreground"> · {step.detail}</span> : null}
        </span>
      </div>
      <div className="bg-surface-muted h-2 overflow-hidden rounded-full" aria-hidden>
        <div
          className={
            step.tone === 'success'
              ? 'bg-success h-full rounded-full'
              : 'bg-accent h-full rounded-full'
          }
          // Width is the data; a class cannot carry it.
          style={{ width: `${Math.max(share * 100, step.count > 0 ? 2 : 0)}%` }}
        />
      </div>
    </li>
  )
}
