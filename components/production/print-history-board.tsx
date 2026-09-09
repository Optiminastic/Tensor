import { Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'
import type { JSX } from 'react'

import { queueStatusConfig } from '@/components/production/status-config'
import { TonePill } from '@/components/production/tone-pill'
import { Card } from '@/components/ui/card'
import { countdown } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Archive } from '@/lib/validators/print-history'

/**
 * What actually came off the beds, from BambuBuddy.
 *
 * The queue board's counterpart, laid out the same way on purpose - an operator
 * reads one and then the other, and two shapes for one idea is how a board gets
 * checked twice.
 *
 * The difference is what each row is for. A queue row asks "when will this
 * run"; a history row answers "what did it cost" - which is why the estimate is
 * shown against the actual rather than instead of it. A plate that consistently
 * runs forty minutes long is invisible until those two numbers sit together.
 */
interface PrintHistoryBoardProps {
  items: Archive[]
  /**
   * Set when the history could not be read. Says so rather than rendering an
   * empty list, which would read as "nothing has ever printed" - the opposite
   * of the truth and the more dangerous of the two mistakes.
   */
  error?: string | null
}

/** The colour chips for a plate - one per material it used. */
function FilamentSwatches({ colours }: { colours: string[] }): JSX.Element | null {
  if (colours.length === 0) return null
  return (
    <span className="flex items-center gap-1">
      {colours.map((colour, i) => (
        <span
          key={`${colour}-${i}`}
          // Inline because the hex is data, not design: there is no token for
          // "whatever colour the operator happened to load".
          style={{ backgroundColor: colour }}
          className="border-border size-3 rounded-full border"
          title={colour}
        />
      ))}
    </span>
  )
}

function PlateThumb({ url, alt }: { url: string | null; alt: string }): JSX.Element {
  if (!url) {
    return (
      <div className="border-border bg-surface-muted text-subtle-foreground flex size-14 shrink-0 items-center justify-center rounded-md border">
        <ImageIcon className="size-5" aria-hidden />
      </div>
    )
  }
  return (
    <Image
      src={url}
      alt={alt}
      width={56}
      height={56}
      unoptimized
      className="border-border bg-surface-muted size-14 shrink-0 rounded-md border object-cover"
    />
  )
}

/** One metadata cell: a quiet label over a mono value. */
function Fact({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="flex flex-col">
      <span className="text-subtle-foreground text-[10px] font-medium tracking-wide uppercase">
        {label}
      </span>
      <span className="font-mono text-xs tabular-nums">{value}</span>
    </div>
  )
}

/**
 * How far the print ran over or under its estimate, or null when there is
 * nothing honest to say.
 *
 * Suppressed under a minute either way: every print misses its estimate by
 * seconds, and a board that remarks on it teaches people to ignore the remark.
 */
function drift(actual: number, estimate: number): string | null {
  if (actual <= 0 || estimate <= 0) return null
  const delta = actual - estimate
  if (Math.abs(delta) < 60) return null
  return delta > 0 ? `${countdown(delta)} over` : `${countdown(-delta)} under`
}

/** Local date and time, or an em dash. Timestamps arrive as ISO-8601 strings. */
function stamp(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString()
}

export function PrintHistoryBoard({ items, error }: PrintHistoryBoardProps): JSX.Element {
  if (error) {
    return (
      <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
        {error}
      </p>
    )
  }
  if (items.length === 0) {
    return (
      <p className="text-muted-foreground rounded-md border border-dashed px-4 py-8 text-center text-sm">
        BambuBuddy has no print history yet.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map(item => {
        const status = queueStatusConfig(item.status)
        const failed = item.status === 'failed'
        const over = drift(item.actual_time_seconds, item.print_time_seconds)
        const grams = item.filament_actual_grams || item.filament_used_grams
        return (
          <Card
            key={item.id}
            className={cn('flex flex-col gap-2 p-3', failed && 'border-l-danger border-l-2')}
          >
            <div className="flex flex-wrap items-start gap-3">
              <PlateThumb url={item.thumbnail_url ?? null} alt={item.name} />

              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-medium">{item.name}</span>
                  <TonePill label={status.label} tone={status.tone} />
                  {/* Only worth saying when it has happened more than once -
                      a plate reprinted three times is a plate with a problem. */}
                  {item.run_count > 1 ? (
                    <span className="text-subtle-foreground text-xs">
                      {item.run_count} runs
                      {item.failed_run_count > 0 ? `, ${item.failed_run_count} failed` : ''}
                    </span>
                  ) : null}
                </div>
                <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span>
                    {item.printer_name ? (
                      <>
                        <span className="text-subtle-foreground">Printer </span>
                        <span className="font-mono">{item.printer_name}</span>
                      </>
                    ) : (
                      'No printer recorded'
                    )}
                  </span>
                  {item.sliced_for_model ? (
                    <span className="bg-surface-muted rounded px-1.5 py-0.5 font-mono">
                      {item.sliced_for_model}
                    </span>
                  ) : null}
                  <span className="flex items-center gap-1.5">
                    {item.filament_type}
                    <FilamentSwatches colours={item.filament_colours ?? []} />
                  </span>
                  {item.created_by ? <span>by {item.created_by}</span> : null}
                  <span>{stamp(item.completed_at || item.started_at || item.created_at)}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-start gap-4">
                <Fact
                  label="Took"
                  value={item.duration_seconds > 0 ? countdown(item.duration_seconds) : '—'}
                />
                {/* The estimate earns its place only when the print missed it. */}
                <Fact label="vs estimate" value={over ?? '—'} />
                <Fact label="Filament" value={grams > 0 ? `${Math.round(grams)} g` : '—'} />
                <Fact
                  label="Cost"
                  value={typeof item.cost === 'number' ? item.cost.toFixed(2) : '—'}
                />
              </div>
            </div>

            {/* BambuBuddy's own words for why it stopped - Tensor did not watch
                the print and has no better explanation to offer. */}
            {item.failure_reason ? (
              <p role="status" className="text-danger text-xs">
                {item.failure_reason}
              </p>
            ) : null}
          </Card>
        )
      })}
    </div>
  )
}
