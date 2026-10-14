import type { JSX, ReactNode } from 'react'

interface PageHeadingProps {
  /** The mono label above the title, e.g. "Designs · 7 active". */
  eyebrow: string
  title: string
  description?: ReactNode
  /** The page's primary actions, right-aligned on wide screens. */
  actions?: ReactNode
}

/** A dashboard page's heading in the landing UI: mono eyebrow, title, line, actions. */
export function PageHeading({
  eyebrow,
  title,
  description,
  actions,
}: PageHeadingProps): JSX.Element {
  return (
    <header className="flex flex-wrap items-end justify-between gap-6">
      <div className="flex max-w-2xl flex-col gap-3">
        <p className="text-muted-foreground font-mono text-xs tracking-[0.18em] uppercase">
          <span aria-hidden className="mr-2">
            •
          </span>
          {eyebrow}
        </p>
        <h1 className="text-4xl font-medium tracking-[-0.04em] sm:text-5xl">{title}</h1>
        {description ? (
          <p className="text-muted-foreground text-sm text-pretty">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </header>
  )
}
