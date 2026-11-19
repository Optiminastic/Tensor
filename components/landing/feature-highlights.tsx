import type { LucideIcon } from 'lucide-react'
import type { JSX } from 'react'

interface FeatureHighlightsProps {
  items: readonly { label: string; icon: LucideIcon }[]
}

/** The headline promises as ink pills with a lime mark, one line each. */
export function FeatureHighlights({ items }: FeatureHighlightsProps): JSX.Element {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(item => (
        <li
          key={item.label}
          className="bg-landing-ink flex items-center gap-3 rounded-full px-5 py-3 text-sm text-white"
        >
          <span className="bg-landing-lime text-landing-ink flex size-7 shrink-0 items-center justify-center rounded-full">
            <item.icon className="size-3.5" aria-hidden />
          </span>
          {item.label}
        </li>
      ))}
    </ul>
  )
}
