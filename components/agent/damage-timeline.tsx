import { AlertTriangle, Check, Circle, Minus } from 'lucide-react'
import type { JSX } from 'react'

import type { DamageStage } from '@/lib/validators/whatsapp-damage'

interface DamageTimelineProps {
  stages: DamageStage[]
}

/** How each state is drawn. Saturated colour marks state, never decoration. */
const MARK = {
  done: { icon: Check, tone: 'bg-success-subtle text-success', line: 'bg-success/30' },
  failed: { icon: AlertTriangle, tone: 'bg-danger-subtle text-danger', line: 'bg-border' },
  skipped: { icon: Minus, tone: 'bg-surface-muted text-subtle-foreground', line: 'bg-border' },
  pending: { icon: Circle, tone: 'bg-surface-muted text-subtle-foreground', line: 'bg-border' },
} as const

/**
 * What has happened to a damaged order, and what has not.
 *
 * THE UNREACHED STEPS ARE THE POINT. A reprint is four acts against three
 * systems, and a list of only the completed ones reads as healthy right up
 * until somebody notices it has been healthy for four days. Every step of the
 * plan is drawn; the ones with no row yet are greyed.
 *
 * A FAILED step keeps its place rather than ending the list, because the steps
 * after it are still owed — the customer still has not been told, and that is
 * the thing to act on.
 */
export function DamageTimeline({ stages }: DamageTimelineProps): JSX.Element | null {
  if (stages.length === 0) return null

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-subtle-foreground text-[11px] font-medium tracking-wide uppercase">
        Progress
      </h3>
      <ol className="flex flex-col">
        {stages.map((stage, index) => {
          const mark = MARK[stage.state]
          const Icon = mark.icon
          const last = index === stages.length - 1
          return (
            <li key={stage.stage} className="flex gap-3">
              {/* The rail: a mark and the line down to the next step. The
                  line takes the colour of the step ABOVE it, so a completed
                  run reads as one continuous thread. */}
              <div className="flex flex-col items-center">
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full ${mark.tone}`}
                >
                  <Icon className="size-3.5" aria-hidden />
                </span>
                {last ? null : <span className={`w-px flex-1 ${mark.line}`} />}
              </div>

              <div className={`flex-1 ${last ? 'pb-0' : 'pb-4'}`}>
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span
                    className={`text-sm ${
                      stage.state === 'pending' ? 'text-muted-foreground' : 'font-medium'
                    }`}
                  >
                    {stage.label}
                  </span>
                  {stage.at ? (
                    <time
                      dateTime={stage.at}
                      className="text-subtle-foreground font-mono text-xs tabular-nums"
                    >
                      {when(stage.at)}
                    </time>
                  ) : null}
                </div>
                {/* The detail carries the thing somebody acts on: a waybill to
                    quote, or the courier's own words for why it refused. */}
                {stage.detail ? (
                  <p
                    className={`mt-0.5 text-sm text-pretty ${
                      stage.state === 'failed' ? 'text-danger' : 'text-muted-foreground'
                    }`}
                  >
                    {stage.detail}
                  </p>
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

/** Short and local: the drawer is read beside a clock, not parsed. */
function when(iso: string): string {
  const at = new Date(iso)
  if (Number.isNaN(at.getTime())) return ''
  return at.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}
