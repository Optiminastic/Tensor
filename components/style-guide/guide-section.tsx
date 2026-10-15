import type { JSX, ReactNode } from 'react'

interface GuideSectionProps {
  title: string
  caption: string
  children: ReactNode
}

/** One section of the design system page: a mono label, one line, the specimens. */
export function GuideSection({ title, caption, children }: GuideSectionProps): JSX.Element {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h2 className="font-mono text-xs tracking-[0.2em] uppercase">
          <span aria-hidden className="mr-2">
            •
          </span>
          {title}
        </h2>
        <p className="text-muted-foreground max-w-2xl text-sm text-pretty">{caption}</p>
      </div>
      {children}
    </section>
  )
}
