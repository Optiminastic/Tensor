import type { JSX } from 'react'

import type { CardLogo } from '@/components/landing/info-card'

interface LogoGridProps {
  items: readonly { logo: CardLogo; role: string }[]
}

/** Logos with a name and one line on what each is for. */
export function LogoGrid({ items }: LogoGridProps): JSX.Element {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(item => (
        <li
          key={item.logo.alt}
          className="bg-landing-paper flex flex-col gap-3 rounded-[1.5rem] p-5"
        >
          <img
            src={item.logo.src}
            alt={item.logo.alt}
            className={item.logo.wide ? 'h-7 w-auto max-w-[9rem] object-contain' : 'size-9'}
          />
          <p className="text-sm font-medium">{item.logo.alt}</p>
          <p className="text-landing-ink/70 text-sm">{item.role}</p>
        </li>
      ))}
    </ul>
  )
}
