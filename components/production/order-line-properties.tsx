import { Code2 } from 'lucide-react'
import type { JSX } from 'react'

import type { LineProp } from '@/components/production/types'

/**
 * What the customer filled in, shown under the line it belongs to.
 *
 * This is the whole reason the order is in Tensor: somebody has to engrave
 * "VASU & PADMANABH" onto a plank, and these attributes were once fetched from
 * Shopify and thrown away because their names did not match a hardcoded list.
 * Showing them verbatim means an unrecognised question still reaches the person
 * doing the work.
 *
 * Everything is shown, underscore-prefixed store fields included, in the order
 * Shopify sent them - which is the order the customer answered. They used to be
 * folded behind a disclosure; Shopify's own admin lists them inline, and the
 * point of this page is that an operator never has to open Shopify to check
 * what an order actually says.
 */
interface OrderLinePropertiesProps {
  properties: LineProp[]
}

export function OrderLineProperties({ properties }: OrderLinePropertiesProps): JSX.Element | null {
  if (properties.length === 0) return null

  return (
    <div className="mt-2 flex gap-2">
      <Code2 className="text-subtle-foreground mt-0.5 size-3.5 shrink-0" aria-hidden />
      <dl className="flex min-w-0 flex-col gap-1">
        {properties.map((p, i) => (
          // Indexed because a store may legitimately repeat a key across the
          // numbered steps, and dropping the duplicate would drop an answer.
          <div key={`${p.name}-${i}`} className="flex flex-wrap gap-x-1.5 text-xs">
            <dt className="text-muted-foreground">{p.name.replace(/[-:\s]+$/, '')}:</dt>
            <dd className="font-medium break-all">{p.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
