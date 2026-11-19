import type { JSX } from 'react'

import { HubNode } from '@/components/landing/hub-node'
import type { CardLogo } from '@/components/landing/info-card'

interface IntegrationHubProps {
  items: readonly { name: string; logo: CardLogo }[]
}

const CX = 400
const CY = 236
const RX = 320
const RY = 170

/** Where the i-th of n systems sits on the ellipse around Tensor, starting at the top. */
function place(i: number, n: number): { x: number; y: number } {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / n
  return { x: Math.round(CX + RX * Math.cos(a)), y: Math.round(CY + RY * Math.sin(a)) }
}

/**
 * Tensor in the middle of every system it talks to, with data moving along
 * each connection - the whole page's subject in one picture.
 */
export function IntegrationHub({ items }: IntegrationHubProps): JSX.Element {
  const nodes = items.map((item, i) => ({ ...item, ...place(i, items.length) }))
  return (
    <div className="bg-landing-paper overflow-hidden rounded-[2rem] p-4 sm:p-8">
      <svg
        viewBox="0 0 800 480"
        className="h-auto w-full"
        role="img"
        aria-label={`Tensor connected to ${items.map(i => i.name).join(', ')}`}
      >
        {nodes.map((n, i) => (
          <path
            key={`wire-${n.name}`}
            d={`M${CX} ${CY} L${n.x} ${n.y}`}
            className={`stroke-landing-sky animate-landing-flow ${i % 2 ? '[animation-direction:reverse]' : ''}`}
            strokeWidth="2"
            strokeDasharray="4 8"
            strokeLinecap="round"
          />
        ))}
        <circle
          cx={CX}
          cy={CY}
          r="58"
          className="fill-landing-sky/20 animate-landing-ping origin-center [transform-box:fill-box]"
        />
        <circle cx={CX} cy={CY} r="58" className="fill-landing-ink" />
        <text
          x={CX}
          y={CY + 6}
          textAnchor="middle"
          className="fill-landing-lime text-[20px] font-semibold tracking-[-0.02em]"
        >
          Tensor
        </text>
        {nodes.map(n => (
          <HubNode key={n.name} {...n} />
        ))}
      </svg>
    </div>
  )
}
