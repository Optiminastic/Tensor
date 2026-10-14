import type { JSX, ReactNode } from 'react'

interface ProductionPageHeaderProps {
  title: string
  description: string
  /** The mono label above the title: the area this page belongs to. */
  eyebrow?: string
  /** The page's actions, aligned to the bottom of the title on wide screens. */
  actions?: ReactNode
}

/**
 * A working page's heading in the landing UI: mono eyebrow, large title, one
 * line on what the page is for, and its actions. Shared by every production,
 * agent and shipping list, so they read as one product.
 */
export function ProductionPageHeader({
  title,
  description,
  eyebrow = 'Production',
  actions,
}: ProductionPageHeaderProps): JSX.Element {
  return (
    <header className="flex w-full flex-wrap items-end justify-between gap-6">
      <div className="flex max-w-2xl flex-col gap-3">
        <p className="text-muted-foreground font-mono text-xs tracking-[0.18em] uppercase">
          <span aria-hidden className="mr-2">
            •
          </span>
          {eyebrow}
        </p>
        <h1 className="text-4xl font-medium tracking-[-0.04em] sm:text-5xl">{title}</h1>
        <p className="text-muted-foreground text-sm text-pretty">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  )
}
