import { Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'
import type { JSX } from 'react'

import { queueStatusConfig } from '@/components/production/status-config'
import { TonePill } from '@/components/production/tone-pill'
import { Card } from '@/components/ui/card'
import { countdown } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { QueueItem } from '@/lib/validators/print-queue'

/**
 * BambuBuddy's print queue, laid out the way BambuBuddy lays it out: one row
 * per plate, thumbnail first, then what it is, which printer it is bound to,
 * and what it will cost in time and filament.
 *
 * Matching the arrangement is the point. An operator works with Tensor and
 * BambuBuddy open together, and a queue they have to re-read in a different
 * shape is a queue they will keep checking twice.
 */
interface PrintQueueBoardProps {
  items: QueueItem[]
  /**
   * Set when the queue could not be read. The board says so rather than
   * rendering an empty list, which would read as "nothing is queued" - the
   * opposite of the truth and the more dangerous of the two mistakes.
   */
  error?: string | null
}

/** The colour chips for a plate - one per material it uses. */
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

export function PrintQueueBoard({ items, error }: PrintQueueBoardProps): JSX.Element {
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
        Nothing is queued in BambuBuddy.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map(item => {
        const status = queueStatusConfig(item.status)
        const failed = item.status === 'failed' || Boolean(item.error_message)
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
                </div>
                <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span>
                    {item.printer_name ? (
                      <>
                        <span className="text-subtle-foreground">Printer </span>
                        <span className="font-mono">{item.printer_name}</span>
                      </>
                    ) : (
                      'Unassigned'
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
                  {item.batch_name ? <span>Batch {item.batch_name}</span> : null}
                  {item.created_by ? <span>by {item.created_by}</span> : null}
                </div>
              </div>

              <div className="flex flex-wrap items-start gap-4">
                <Fact label="Position" value={`#${item.position}`} />
                <Fact
                  label="Print time"
                  value={item.print_time_seconds > 0 ? countdown(item.print_time_seconds) : '—'}
                />
                <Fact
                  label="Filament"
                  value={
                    item.filament_used_grams > 0 ? `${Math.round(item.filament_used_grams)} g` : '—'
                  }
                />
                <Fact label="Layer" value={item.layer_height ? `${item.layer_height} mm` : '—'} />
              </div>
            </div>

            {/* BambuBuddy's own words for why this is stuck or how it failed -
                Tensor has no better explanation to offer. */}
            {item.waiting_reason ? (
              <p className="text-muted-foreground text-xs">{item.waiting_reason}</p>
            ) : null}
            {item.error_message ? (
              <p role="status" className="text-danger text-xs">
                {item.error_message}
              </p>
            ) : null}
          </Card>
        )
      })}
    </div>
  )
}
