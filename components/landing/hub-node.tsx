import type { JSX } from 'react'

import type { CardLogo } from '@/components/landing/info-card'

interface HubNodeProps {
  name: string
  logo: CardLogo
  x: number
  y: number
}

/** One system on the integration hub: its real logo in a white disc, named underneath. */
export function HubNode({ name, logo, x, y }: HubNodeProps): JSX.Element {
  const w = logo.wide ? 50 : 32
  const h = logo.wide ? 22 : 32
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="36" className="stroke-landing-ink/15 fill-white" strokeWidth="1.5" />
      <image href={logo.src} x={-w / 2} y={-h / 2} width={w} height={h} />
      <text y="56" textAnchor="middle" className="fill-landing-ink text-[13px] font-medium">
        {name}
      </text>
    </g>
  )
}
