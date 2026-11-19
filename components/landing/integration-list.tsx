import { Check } from 'lucide-react'
import type { JSX } from 'react'

import type { CardLogo } from '@/components/landing/info-card'

interface IntegrationListProps {
  items: readonly {
    name: string
    summary: string
    built: readonly string[]
    logo: CardLogo
    tag?: string
  }[]
}

/**
 * Each integration as a row, not a card: its logo large on the left, and on
 * the right what it is and every piece Tensor built for it.
 */
export function IntegrationList({ items }: IntegrationListProps): JSX.Element {
  return (
    <ul className="border-landing-ink/10 flex flex-col border-t">
      {items.map(item => (
        <li
          key={item.name}
          className="border-landing-ink/10 grid gap-6 border-b py-8 md:grid-cols-[12rem_1fr] md:gap-10"
        >
          <div className="flex items-start gap-4 md:flex-col">
            <span className="bg-landing-paper flex h-20 w-28 items-center justify-center rounded-2xl">
              <img
                src={item.logo.src}
                alt={item.logo.alt}
                className={item.logo.wide ? 'h-6 w-auto' : 'size-10'}
              />
            </span>
            {item.tag ? (
              <span className="text-landing-ink/60 text-xs font-medium">{item.tag}</span>
            ) : null}
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-2xl font-medium tracking-[-0.03em]">{item.name}</h3>
              <p className="text-landing-ink/70 text-base text-pretty">{item.summary}</p>
            </div>
            <ul className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
              {item.built.map(point => (
                <li key={point} className="text-landing-ink/80 flex gap-2">
                  <Check className="text-landing-chart-olive mt-0.5 size-4 shrink-0" aria-hidden />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </li>
      ))}
    </ul>
  )
}
