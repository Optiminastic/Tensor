import type { LucideIcon } from 'lucide-react'
import type { JSX } from 'react'

import { cn } from '@/lib/utils'

export interface RuledItem {
  title: string
  description: string
  points?: readonly string[]
  icon?: LucideIcon
}

interface RuledListProps {
  items: readonly RuledItem[]
  columns?: 2 | 3
}

/**
 * Items under a rule instead of inside a box: a lighter way to list the parts
 * of something next to a diagram that already carries the picture.
 */
export function RuledList({ items, columns = 3 }: RuledListProps): JSX.Element {
  return (
    <ul className={cn('grid gap-x-10 gap-y-8 sm:grid-cols-2', columns === 3 && 'lg:grid-cols-3')}>
      {items.map(({ icon: Icon, ...item }) => (
        <li key={item.title} className="border-landing-ink flex flex-col gap-2 border-t-2 pt-4">
          {Icon ? (
            <span className="bg-landing-lime text-landing-ink mb-1 flex size-10 items-center justify-center rounded-xl">
              <Icon className="size-5" aria-hidden />
            </span>
          ) : null}
          <h3 className="text-lg font-medium tracking-[-0.02em]">{item.title}</h3>
          <p className="text-landing-ink/70 text-sm text-pretty">{item.description}</p>
          {item.points?.length ? (
            <ul className="text-landing-ink/70 mt-1 flex flex-col gap-1.5 text-sm">
              {item.points.map(p => (
                <li key={p} className="flex gap-2">
                  <span
                    aria-hidden
                    className="bg-landing-sky mt-2 size-1.5 shrink-0 rounded-full"
                  />
                  {p}
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
