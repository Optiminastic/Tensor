import { cn } from '@/lib/utils'

export type PillTone = 'success' | 'warning' | 'danger' | 'accent' | 'muted'

/**
 * The one shape every status tag in Tensor uses: a pastel fill with a
 * hairline edge, a glossy top and a soft shadow, the word in a strong shade of
 * the same hue. Colours and depth live in app/globals.css (`.tag`,
 * `.tag-<tone>`), so every tag changes from one place. Render it through
 * <Tag> (components/ui/tag.tsx), which adds the tone's icon.
 *
 * Normal case and `whitespace-nowrap` on purpose: "Design file required" stays
 * one tag in a table cell instead of breaking over three lines.
 */
const BASE =
  'tag inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold whitespace-nowrap'

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
