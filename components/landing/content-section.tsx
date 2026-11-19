import type { JSX, ReactNode } from 'react'

interface ContentSectionProps {
  /** The mono label above the heading. */
  eyebrow: string
  title: string
  intro?: string
  /** The anchor id, so a section can be linked to. */
  id?: string
  children: ReactNode
}

/** One section of a marketing page: mono eyebrow, heading, a line of intro, then its content. */
export function ContentSection({
  eyebrow,
  title,
  intro,
  id,
  children,
}: ContentSectionProps): JSX.Element {
  return (
    <section id={id} className="flex scroll-mt-8 flex-col gap-8">
      <div className="flex max-w-3xl flex-col gap-3">
        <p className="text-landing-ink/60 font-mono text-xs tracking-[0.18em] uppercase">
          <span aria-hidden className="mr-2">
            •
          </span>
          {eyebrow}
        </p>
        <h2 className="text-3xl font-medium tracking-[-0.035em] text-balance sm:text-4xl">
          {title}
        </h2>
        {intro ? <p className="text-landing-ink/70 text-base text-pretty">{intro}</p> : null}
      </div>
      {children}
    </section>
  )
}
