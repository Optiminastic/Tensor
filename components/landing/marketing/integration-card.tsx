import type { JSX } from 'react'

import type { Integration } from '@/lib/marketing/integrations'

interface IntegrationCardProps {
  integration: Integration
}

/** One system Tensor works with: its name as text, what it is, what Tensor does with it. */
export function IntegrationCard({ integration }: IntegrationCardProps): JSX.Element {
  const Icon = integration.icon
  return (
    <li className="bg-landing-paper flex flex-col gap-4 rounded-3xl p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="bg-landing-ink grid size-11 place-items-center rounded-2xl text-white">
          <Icon className="size-5" aria-hidden />
        </span>
        <span className="text-landing-muted font-mono text-xs tracking-[0.16em] uppercase">
          {integration.kind}
        </span>
      </div>
      <h2 className="text-2xl font-medium tracking-[-0.03em]">{integration.name}</h2>
      <p className="text-landing-ink/75 text-sm text-pretty">{integration.does}</p>
    </li>
  )
}
