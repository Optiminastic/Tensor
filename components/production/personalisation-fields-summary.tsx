import type { JSX } from 'react'

import type { ProductionJobDetail } from '@/components/production/types'

interface PersonalisationFieldsSummaryProps {
  job: ProductionJobDetail
}

/** The raw personalisation fields Shopify captured for this job (name, font,
 * colour, variant), for the operator to check against the confirm switches. */
export function PersonalisationFieldsSummary({
  job,
}: PersonalisationFieldsSummaryProps): JSX.Element | null {
  const fields = job.personalisationFields
  const entries = [
    ['Name', fields.name],
    ['Font', fields.font],
    ['Colour', fields.colour],
    ['Variant', fields.variant],
  ] as const satisfies readonly (readonly [string, string | null])[]
  const present = entries.filter(([, value]) => value !== null)
  if (present.length === 0) return null

  return (
    <dl className="bg-surface-muted grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-md px-3 py-2.5 text-sm">
      {present.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="text-foreground truncate">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
