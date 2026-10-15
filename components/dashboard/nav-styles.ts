import { cn } from '@/lib/utils'

/**
 * The dashboard's navigation in the landing page's language, shared by the
 * desktop panel and the phone drawer so the two cannot drift apart.
 *
 * The selected item is a lime pill with ink text and an ink dot. Lime on the
 * light surface is a soft fill, not a contrast signal, so the weight change and
 * the dot carry "this is where you are" for anyone who cannot see the colour;
 * links also set aria-current. Lime on the dark surface reads strongly.
 */
export function navItemClass(active: boolean): string {
  return cn(
    'flex min-h-10 items-center gap-3 rounded-full px-4 text-sm transition-colors',
    active
      ? 'bg-landing-lime text-landing-ink font-medium'
      : 'text-muted-foreground hover:bg-surface-muted hover:text-foreground',
  )
}

/** The icon rail's area tile: lime when selected, quiet otherwise. */
export function railTileClass(active: boolean): string {
  return cn(
    'relative flex size-11 items-center justify-center rounded-2xl transition-colors',
    active
      ? 'bg-landing-lime text-landing-ink'
      : 'text-muted-foreground hover:bg-surface-muted hover:text-foreground',
  )
}

/** The mono, widely tracked label above a group of links. */
export const NAV_GROUP_LABEL =
  'text-muted-foreground px-4 font-mono text-[0.6875rem] tracking-[0.18em] uppercase'
