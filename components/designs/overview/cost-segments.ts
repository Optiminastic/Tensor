import type { CPBreakdown } from '@/lib/validators/designs'

// The seven cost components, in a fixed order. The order is the identity: each
// slot maps to a fixed step of the ramp, so a segment's colour follows the
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

// A single-hue sequential ramp: the accent mixed down into the muted surface,
// lightness-ordered so it stays legible under colour-vision deficiency.
const RAMP_WEIGHTS = [100, 84, 70, 56, 44, 34, 26]
const RAMP_FLOOR = 20

export interface CostSegment {
  key: string
  label: string
  value: number
  fraction: number
  color: string
}

function rampColor(index: number): string {
  const weight = RAMP_WEIGHTS[index] ?? RAMP_FLOOR
  return `color-mix(in oklab, var(--accent) ${weight}%, var(--surface-muted))`
}

/** Each cost component with its share of the total; negatives count as zero. */
export function costSegments(breakdown: CPBreakdown): CostSegment[] {
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
