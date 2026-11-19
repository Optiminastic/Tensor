import type { JSX } from 'react'

import type { CardLogo } from '@/components/landing/info-card'

interface LogoStripProps {
  items: readonly { name: string; logo: CardLogo }[]
}

/** Every mark in one row, so the whole picture reads before the detail. */
export function LogoStrip({ items }: LogoStripProps): JSX.Element {
  return (
    <ul
      aria-label="Integrations"
      className="bg-landing-paper flex flex-wrap items-center justify-center gap-x-10 gap-y-6 rounded-[1.75rem] px-6 py-8"
    >
      {items.map(item => (
        <li key={item.name} className="flex items-center gap-2">
          <img
            src={item.logo.src}
            alt={item.logo.wide ? item.name : ''}
            className={item.logo.wide ? 'h-6 w-auto max-w-[8rem] object-contain' : 'size-7'}
          />
          {item.logo.wide ? null : <span className="text-sm font-medium">{item.name}</span>}
        </li>
      ))}
    </ul>
  )
}
