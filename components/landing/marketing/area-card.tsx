import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import type { JSX } from 'react'

import type { Area } from '@/lib/marketing/areas'

interface AreaCardProps {
  area: Area
  index: number
}

/** One area of the dashboard on the homepage: what it is for, and its pages. */
export function AreaCard({ area, index }: AreaCardProps): JSX.Element {
  const Icon = area.icon
  return (
    <Link
      href={`/product#${area.key}`}
      className="group bg-landing-paper hover:bg-landing-sky-haze/40 flex h-full flex-col gap-5 rounded-3xl p-6 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="bg-landing-ink grid size-11 place-items-center rounded-2xl text-white">
          <Icon className="size-5" aria-hidden />
        </span>
        <span className="text-landing-muted font-mono text-xs tabular-nums">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-2xl font-medium tracking-[-0.03em]">{area.name}</h3>
        <p className="text-landing-ink/75 text-sm text-pretty">{area.summary}</p>
      </div>
      <ul className="mt-auto flex flex-wrap gap-1.5" aria-label={`Pages in ${area.name}`}>
        {area.pages.map(page => (
          <li key={page.name} className="rounded-full bg-white px-2.5 py-1 text-xs">
            {page.name}
          </li>
        ))}
      </ul>
      <span className="inline-flex items-center gap-1.5 text-sm font-medium">
        How it works
        <ArrowUpRight
          className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          aria-hidden
        />
      </span>
    </Link>
  )
}
