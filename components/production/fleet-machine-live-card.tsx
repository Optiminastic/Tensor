import type { JSX } from 'react'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { FleetMachineLive, FleetMachineLiveTemperature } from '@/lib/validators/machine-fleet'

interface FleetMachineLiveCardProps {
  live: FleetMachineLive | null
}

/** A dash, so an unreachable printer reads as "not known" rather than zero. */
const UNKNOWN = '—'

interface MetricProps {
  label: string
  value: string
  hint?: string
}

function Metric({ label, value, hint }: MetricProps): JSX.Element {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
        {label}
      </p>
      <p className="text-foreground font-mono text-sm tabular-nums">{value}</p>
      {hint ? <p className="text-subtle-foreground text-[10px]">{hint}</p> : null}
    </div>
  )
}

/**
 * Temperature with its target.
 *
 * A target of 0 means nothing is being held at temperature - that is how an
 * idle printer is distinguished from one holding heat - so the target is shown
 * only when there actually is one.
 */
function temperatureText(t: FleetMachineLiveTemperature | null): string {
  if (!t) return UNKNOWN
  const current = `${t.current.toFixed(0)}°`
  return t.target > 0 ? `${current} / ${t.target.toFixed(0)}°` : current
}

/** Minutes as "10h 51m", matching BambuBuddy's own drying countdown. */
function minutesText(total: number): string {
  if (total <= 0) return UNKNOWN
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

/**
 * The printer's own live readings, straight from BambuBuddy: connection,
 * thermals, nozzles, fans and AMS.
 *
 * Separate from FleetMachineSummaryCard because the two answer different
 * questions and have different lifetimes. That card shows what Tensor has
 * SCHEDULED - current batch, queue position. This shows what the machine is
 * physically doing right now, and none of it is stored anywhere.
 */
export function FleetMachineLiveCard({ live }: FleetMachineLiveCardProps): JSX.Element {
  if (!live) {
    return (
      <Card className="p-4">
        <p className="text-muted-foreground text-sm">
          Live printer data is unavailable — BambuBuddy could not be reached, or this machine is not
          connected to it. Scheduling below is unaffected.
        </p>
      </Card>
    )
  }

  const printing = live.state === 'RUNNING'
  const nozzleTemps = live.nozzle_right
    ? `${temperatureText(live.nozzle_left)} · ${temperatureText(live.nozzle_right)}`
    : temperatureText(live.nozzle_left)
  const nozzleSizes = live.nozzles.map(n => n.diameter_mm.toFixed(1)).join(' / ')

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
            live.connected ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger',
          )}
        >
          <span className="size-1.5 rounded-full bg-current" aria-hidden />
          {live.connected ? 'Connected' : 'Disconnected'}
        </span>
        <span className="text-muted-foreground font-mono text-xs tabular-nums">
          {live.wifi_dbm} dBm
        </span>
        <span className="text-muted-foreground font-mono text-xs">v{live.firmware_version}</span>
        {live.door_open ? (
          <span className="bg-warning-subtle text-warning rounded-full px-2 py-0.5 text-xs">
            Door open
          </span>
        ) : null}
        {/* Bambu raises routine notices here too, so a bare count would read as
            a fault. Severity 1 is the lowest and not worth alarming over. */}
        {live.health_messages > 0 ? (
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs',
              live.worst_severity > 1
                ? 'bg-danger-subtle text-danger'
                : 'text-muted-foreground bg-surface-muted',
            )}
          >
            {live.health_messages} health notice{live.health_messages === 1 ? '' : 's'}
          </span>
        ) : null}
      </div>

      <div className="border-border flex flex-col gap-1 border-t pt-3">
        <p className="text-foreground text-sm font-medium">{live.state_label}</p>
        <p className="text-muted-foreground text-xs">
          {live.current_print === '' ? 'No active job' : live.current_print}
        </p>
        {printing ? (
          <p className="text-muted-foreground font-mono text-xs tabular-nums">
            {live.progress_percent.toFixed(0)}% · layer {live.layer_num}/{live.total_layers} ·{' '}
            {minutesText(live.remaining_minutes)} left
          </p>
        ) : null}
      </div>

      <div className="border-border grid grid-cols-2 gap-3 border-t pt-3 sm:grid-cols-4">
        <Metric label="Nozzle L / R" value={nozzleTemps} />
        <Metric label="Bed" value={temperatureText(live.bed)} />
        <Metric label="Chamber" value={temperatureText(live.chamber)} />
        <Metric
          label="Nozzle size"
          value={nozzleSizes === '' ? UNKNOWN : `${nozzleSizes} mm`}
          hint={live.nozzles.some(n => n.high_flow) ? 'high flow' : undefined}
        />
      </div>

      <div className="border-border grid grid-cols-2 gap-3 border-t pt-3 sm:grid-cols-4">
        <Metric label="Part fan" value={`${live.fan_cooling_pct}%`} />
        <Metric label="Aux fan" value={`${live.fan_aux1_pct}%`} />
        <Metric label="Chamber fan" value={`${live.fan_aux2_pct}%`} />
        <Metric label="Heatbreak fan" value={`${live.fan_heatbreak_pct}%`} />
      </div>

      {live.ams.map(unit => (
        <div key={unit.id} className="border-border flex flex-col gap-2 border-t pt-3">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-foreground text-xs font-semibold tracking-wide uppercase">
              AMS {unit.id + 1}
            </p>
            <span className="text-muted-foreground font-mono text-xs tabular-nums">
              {unit.humidity_pct}% RH · {unit.temperature_c.toFixed(0)}°
            </span>
            {unit.drying ? (
              <span className="bg-warning-subtle text-warning rounded-full px-2 py-0.5 text-xs">
                Drying {unit.dry_filament} · {minutesText(unit.dry_minutes_left)} left
              </span>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {unit.trays.map(tray => (
              <div
                key={tray.slot}
                className={cn(
                  'border-border flex items-center gap-2 rounded-md border px-2 py-1.5',
                  !tray.loaded && 'opacity-50',
                )}
              >
                <span
                  className="border-border size-3 shrink-0 rounded-full border"
                  style={tray.loaded && tray.colour ? { backgroundColor: tray.colour } : undefined}
                  aria-hidden
                />
                <span className="text-foreground truncate text-xs">
                  {tray.loaded ? tray.type : 'Empty'}
                </span>
                {/* remain is -1 when the spool carries no RFID tag: the printer
                    genuinely does not know, which is not the same as empty. */}
                {tray.loaded && tray.remain_pct >= 0 ? (
                  <span className="text-muted-foreground ml-auto font-mono text-[10px] tabular-nums">
                    {tray.remain_pct}%
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ))}
    </Card>
  )
}
