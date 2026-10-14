import { cn } from '@/lib/utils'

export type PillTone = 'lime' | 'glass' | 'ink' | 'solid' | 'outline'

const TONES: Record<PillTone, string> = {
  lime: 'bg-landing-lime text-landing-ink hover:bg-landing-lime-deep',
  glass:
    'bg-landing-ink/25 text-white ring-1 ring-white/25 backdrop-blur-sm hover:bg-landing-ink/40',
  ink: 'bg-landing-ink text-white hover:bg-landing-ink/85',
  // In-app tones: built on the theme tokens, so they flip with dark mode where
  // the landing tones (fixed sky, lime and ink) do not need to.
  solid: 'bg-foreground text-background hover:bg-foreground/85',
  outline: 'bg-surface text-foreground ring-1 ring-border-strong hover:bg-surface-muted',
}

interface PillStyle {
  tone: PillTone
  withArrow?: boolean
  className?: string
}

/**
 * The inspiration's pill: mono, uppercase, widely tracked. Shared by the link
 * and the button forms so the landing page and the auth pages cannot drift.
 */
export function pillClasses({ tone, withArrow, className }: PillStyle): string {
  return cn(
    'inline-flex h-11 items-center gap-3 rounded-full font-mono text-xs tracking-[0.18em] uppercase transition-colors',
    'focus-visible:ring-landing-lime focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
    'disabled:cursor-not-allowed disabled:opacity-60',
    withArrow ? 'pr-1.5 pl-5' : 'px-5',
    TONES[tone],
    className,
  )
}
