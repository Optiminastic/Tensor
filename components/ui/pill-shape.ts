import { cn } from '@/lib/utils'

export type PillTone = 'success' | 'warning' | 'danger' | 'accent' | 'muted'

/**
 * The one shape every status pill in Tensor uses: a soft tint, a hairline ring
 * of the same hue, a dot, and the word in normal case on a single line.
 *
 * Normal case and `whitespace-nowrap` on purpose. The old pills were
 * uppercase, tracked and allowed to wrap, so "Design file required" broke over
 * three lines inside a table cell and every status shouted at the same volume.
 */
const BASE =
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ring-1 ring-inset'

const TONES: Record<PillTone, string> = {
  success: 'bg-success-subtle text-success ring-success/20',
  warning: 'bg-warning-subtle text-warning ring-warning/25',
  danger: 'bg-danger-subtle text-danger ring-danger/20',
  accent: 'bg-accent-subtle text-accent ring-accent/20',
  muted: 'bg-surface-muted text-muted-foreground ring-border',
}

export const PILL_DOT: Record<PillTone, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  accent: 'bg-accent',
  muted: 'bg-muted-foreground',
}

export function pillClasses(tone: PillTone, className?: string): string {
  return cn(BASE, TONES[tone], className)
}
