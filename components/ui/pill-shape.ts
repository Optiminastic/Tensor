import { cn } from '@/lib/utils'

export type PillTone = 'success' | 'warning' | 'danger' | 'accent' | 'muted'

/**
 * The one shape every status tag in Tensor uses: a solid, saturated tile with
 * its word in a deep shade of the same hue, a slight bevel and a soft glow of
 * its own colour. The colours, bevel and glow live in app/globals.css (`.tag`,
 * `.tag-<tone>`), so every tag changes from one place.
 *
 * Normal case and `whitespace-nowrap` on purpose: "Design file required" stays
 * one tile in a table cell instead of breaking over three lines. No dot - the
 * fill is the colour and the word is the meaning.
 */
const BASE =
  'tag inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap'

const TONES: Record<PillTone, string> = {
  success: 'tag-success',
  warning: 'tag-warning',
  danger: 'tag-danger',
  accent: 'tag-accent',
  muted: 'tag-muted',
}

export function pillClasses(tone: PillTone, className?: string): string {
  return cn(BASE, TONES[tone], className)
}
