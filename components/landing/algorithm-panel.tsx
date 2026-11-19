import type { JSX } from 'react'

import type { Algorithm } from '@/components/landing/content/architecture'

interface AlgorithmPanelProps {
  items: readonly Algorithm[]
}

/**
 * The algorithms on an ink panel, so the page's most technical section reads
 * as a different register from the rest: name, how it works, where it runs.
 */
export function AlgorithmPanel({ items }: AlgorithmPanelProps): JSX.Element {
  return (
    <div className="bg-landing-ink grid gap-px overflow-hidden rounded-[2rem] text-white md:grid-cols-2">
      {items.map(a => (
        <div
          key={a.name}
          className="bg-landing-ink flex flex-col gap-3 p-7 outline outline-1 outline-white/10"
        >
          <span className="text-landing-lime text-xs font-medium">{a.where}</span>
          <h3 className="text-xl font-medium tracking-[-0.02em]">{a.name}</h3>
          <p className="text-sm text-pretty text-white/75">{a.how}</p>
        </div>
      ))}
    </div>
  )
}
