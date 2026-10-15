import type { JSX, ReactNode } from 'react'

interface FloorHeaderProps {
  brandLabel: string
  /** The period control and the next places to go. */
  actions?: ReactNode
}

/** The production page's heading, in the dashboard's landing style. */
export function FloorHeader({ brandLabel, actions }: FloorHeaderProps): JSX.Element {
  return (
    <header className="flex flex-wrap items-end justify-between gap-6">
      <div className="flex max-w-2xl flex-col gap-3">
        <p className="text-muted-foreground font-mono text-xs tracking-[0.18em] uppercase">
          <span aria-hidden className="mr-2">
            •
          </span>
          Production · {brandLabel}
        </p>
        <h1 className="text-4xl font-medium tracking-[-0.04em] sm:text-5xl">Production floor</h1>
        <p className="text-muted-foreground text-sm text-pretty">
          Where every job is, from the order to the parcel, and what the printers are doing.
        </p>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </header>
  )
}
