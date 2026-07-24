import Image from 'next/image'
import type { JSX } from 'react'

import { cn } from '@/lib/utils'

export interface HeroFigureProps {
  className?: string
}

/**
 * The hero's exhibit: an ink butterfly settling on rippled water.
 *
 * It is a single greyscale drawing on white paper. `multiply` dissolves the
 * paper into the surface behind it, so in light mode only the ink survives and
 * the butterfly floats on the panel. In dark mode multiply would erase dark ink
 * on a dark ground, so it inverts instead — the drawing is line art, which
 * inverts to clean white strokes rather than a muddy negative.
 *
 * Decorative: `alt=""` and aria-hidden, so a screen reader gets the hero's
 * heading and the cost panel, not a description of a butterfly.
 */
export function HeroFigure({ className }: HeroFigureProps): JSX.Element {
  return (
    <div className={cn('pointer-events-none select-none', className)} aria-hidden="true">
      <Image
        src="/landing/butterfly.jpg"
        alt=""
        width={736}
        height={1040}
        priority
        sizes="(min-width: 768px) 15rem, 12rem"
        className="h-full w-full object-contain mix-blend-multiply dark:mix-blend-screen dark:invert"
      />
    </div>
  )
}
