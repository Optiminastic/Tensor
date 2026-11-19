import type { JSX, ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface SplitSectionProps {
  id?: string
  eyebrow: string
  title: string
  intro?: string
  /** An illustration in public/illustrations, drawn beside the text. */
  illustration: string
  /** What the illustration shows, for screen readers. */
  illustrationAlt: string
  /** Puts the illustration on the right, so consecutive sections alternate. */
  flip?: boolean
  children?: ReactNode
}

/**
 * A section told as a picture and its words: an animated illustration of the
 * idea on one side, the heading, intro and detail on the other.
 */
export function SplitSection({
  id,
  eyebrow,
  title,
  intro,
  illustration,
  illustrationAlt,
  flip = false,
  children,
}: SplitSectionProps): JSX.Element {
  return (
    <section id={id} className="grid scroll-mt-8 items-start gap-10 lg:grid-cols-2 lg:gap-16">
      <div
        className={cn(
          'bg-landing-paper rounded-[2rem] p-4 sm:p-8 lg:sticky lg:top-8',
          flip && 'lg:order-2',
        )}
      >
        <img src={illustration} alt={illustrationAlt} className="h-auto w-full" loading="lazy" />
      </div>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <p className="text-landing-ink/60 text-sm font-medium">{eyebrow}</p>
          <h2 className="text-3xl font-medium tracking-[-0.035em] text-balance sm:text-4xl">
            {title}
          </h2>
          {intro ? <p className="text-landing-ink/70 text-base text-pretty">{intro}</p> : null}
        </div>
        {children}
      </div>
    </section>
  )
}
