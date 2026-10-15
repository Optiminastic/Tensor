import type { JSX } from 'react'

import type { Area } from '@/lib/marketing/areas'

interface AreaDetailProps {
  area: Area
  index: number
}

/**
 * One area on the Product page: its name and what it is for on the left, and
 * each page inside it with what that page does on the right. The section id
 * is the area's key, so the homepage cards can link straight to it.
 */
export function AreaDetail({ area, index }: AreaDetailProps): JSX.Element {
  const Icon = area.icon
  return (
    <section
      id={area.key}
      aria-labelledby={`${area.key}-title`}
      className="border-border grid scroll-mt-6 gap-8 border-t py-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16"
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <span className="bg-landing-lime text-landing-ink grid size-11 place-items-center rounded-2xl">
            <Icon className="size-5" aria-hidden />
          </span>
          <span className="text-landing-muted font-mono text-xs tabular-nums">
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>
        <h2 id={`${area.key}-title`} className="text-4xl font-medium tracking-[-0.04em]">
          {area.name}
        </h2>
        <p className="text-muted-foreground text-base text-pretty">{area.detail}</p>
      </div>
      <ul className="grid content-start items-start gap-3 sm:grid-cols-2">
        {area.pages.map(page => (
          <li key={page.name} className="bg-landing-paper flex flex-col gap-1.5 rounded-2xl p-5">
            <h3 className="text-base font-medium">{page.name}</h3>
            <p className="text-muted-foreground text-sm text-pretty">{page.does}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
