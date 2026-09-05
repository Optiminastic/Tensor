import type { JSX } from 'react'

import { OrderLineProperties } from '@/components/production/order-line-properties'
import type { ProductionJobDetail } from '@/components/production/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Exactly what the customer asked for on this one product.
 *
 * A job is one product from one order, and whoever picks it up has to make that
 * product without opening Shopify. Until now the job showed the two names
 * mashed into a single string and nothing else - not the heart count, not the
 * colour, not whether the light was wanted - so the person building it had to
 * go and find the order, then work out which of its lines was theirs.
 *
 * The attributes are shown verbatim and in the order the customer answered
 * them, through the same component the order page uses. A mapping only knows
 * the keys it was told about, and the operator needs the ones it was not.
 */
interface JobCustomisationCardProps {
  job: ProductionJobDetail
}

/** One labelled fact, or nothing when there is nothing to say. */
function Fact({ label, value }: { label: string; value: string | null }): JSX.Element | null {
  if (!value || !value.trim()) return null
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-subtle-foreground text-[10px] font-medium tracking-wide uppercase">
        {label}
      </span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}

export function JobCustomisationCard({ job }: JobCustomisationCardProps): JSX.Element {
  const properties = job.personalisationProperties
  const nothing = !job.variantTitle && properties.length === 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>What the customer ordered</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          {/* The order this product came from. A job is one line of one order,
              and on a multi-product order the number alone is what ties it
              back. */}
          <Fact label="Shopify order" value={job.shopifyOrderId} />
          <Fact label="SKU" value={job.sku} />
          {/* Colour and light together, as the store sells it. */}
          <Fact label="Variant" value={job.variantTitle} />
        </div>

        {nothing ? (
          <p className="text-muted-foreground rounded-md border border-dashed px-4 py-6 text-center text-sm">
            This order carried no personalisation options. Press Sync from Shopify on the Orders
            page to fetch them.
          </p>
        ) : (
          <OrderLineProperties properties={properties} />
        )}
      </CardContent>
    </Card>
  )
}
