import { Plus } from 'lucide-react'
import type { JSX } from 'react'

import type { Feature } from '@/components/landing/content/features'

interface FeatureListProps {
  items: readonly Feature[]
}

/**
 * Features as a list rather than a grid of cards: each one reads in a line,
 * and opens to show exactly what it does.
 */
export function FeatureList({ items }: FeatureListProps): JSX.Element {
  return (
    <ul className="border-landing-ink/10 flex flex-col border-t">
      {items.map(item => {
        const Icon = item.icon
        return (
          <li key={item.title} className="border-landing-ink/10 border-b">
            <details className="group">
              <summary className="focus-visible:outline-landing-sky flex cursor-pointer list-none items-start gap-4 rounded-lg py-5 focus-visible:outline-2 [&::-webkit-details-marker]:hidden">
                <span className="bg-landing-paper text-landing-ink flex size-10 shrink-0 items-center justify-center rounded-xl">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="flex flex-1 flex-col gap-1">
                  <span className="text-lg font-medium tracking-[-0.02em]">{item.title}</span>
                  <span className="text-landing-ink/70 text-sm text-pretty">
                    {item.description}
                  </span>
                </span>
                <Plus
                  className="text-landing-ink/60 mt-2 size-5 shrink-0 transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none"
                  aria-hidden
                />
              </summary>
              <ul className="text-landing-ink/80 flex flex-col gap-2 pb-5 pl-14 text-sm">
                {item.points.map(point => (
                  <li key={point} className="flex gap-2">
                    <span
                      aria-hidden
                      className="bg-landing-sky mt-2 size-1.5 shrink-0 rounded-full"
                    />
                    {point}
                  </li>
                ))}
              </ul>
            </details>
          </li>
        )
      })}
    </ul>
  )
}
