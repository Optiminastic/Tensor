import Link from 'next/link'
import type { JSX } from 'react'

import { FLEET_MACHINE_STATUS_CONFIG } from '@/components/production/status-config'
import { TonePill } from '@/components/production/tone-pill'
import type { FleetRow } from '@/lib/production/floor-model'

const SECONDS_PER_MINUTE = 60
const MINUTES_PER_HOUR = 60

/** Seconds as "1h 20m left", or null when the printer has not said. */
function timeLeft(seconds: number | null): string | null {
  if (!seconds || seconds <= 0) return null
  const minutes = Math.round(seconds / SECONDS_PER_MINUTE)
  const hours = Math.floor(minutes / MINUTES_PER_HOUR)
  const rest = minutes % MINUTES_PER_HOUR
  return hours > 0 ? `${hours}h ${rest}m left` : `${rest}m left`
}

interface PrinterCardProps {
  printer: FleetRow
  href: string
}

/** One printer: its state, how far through the plate, and what waits for it. */
export function PrinterCard({ printer, href }: PrinterCardProps): JSX.Element {
  const status = FLEET_MACHINE_STATUS_CONFIG[printer.status]
  const left = timeLeft(printer.remainingSeconds)
  return (
    <Link
      href={href}
      className="bg-surface-muted hover:ring-border-strong flex flex-col gap-4 rounded-2xl p-4 ring-1 ring-transparent transition-shadow"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium">{printer.name}</span>
          <span className="text-muted-foreground truncate font-mono text-xs">
            {printer.model ?? 'Model unknown'}
          </span>
        </div>
        <TonePill label={status.label} tone={status.tone} />
      </div>
      {printer.progress !== null ? (
        <div className="flex flex-col gap-1.5">
          <div className="bg-border h-2 overflow-hidden rounded-full">
            {/* Width is the live share of layers printed: data, so not a class. */}
            <div
              className="bg-foreground h-full rounded-full"
              style={{ width: `${printer.progress * 100}%` }}
            />
          </div>
          <div className="text-muted-foreground flex justify-between gap-2 text-xs tabular-nums">
            <span>{printer.layers}</span>
            {left ? <span>{left}</span> : null}
          </div>
        </div>
      ) : printer.status === 'error' && printer.statusReason ? (
        <p className="text-danger font-mono text-xs">HMS {printer.statusReason}</p>
      ) : null}
      <p className="text-muted-foreground mt-auto text-xs tabular-nums">
        {printer.jobsDone} printed · {printer.queuedBatches}{' '}
        {printer.queuedBatches === 1 ? 'bed' : 'beds'} waiting
      </p>
    </Link>
  )
}
