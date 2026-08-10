'use client'

import { useQuery } from '@tanstack/react-query'
import { ExternalLink } from 'lucide-react'
import type { JSX } from 'react'

import { fetchDesignPerformance } from '@/app/dashboard/[brand]/designs/performance-actions'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Stat } from '@/components/ui/stat'

interface DesignPerformancePanelProps {
  designId: string
  sku: string | null
  shopifyAdminUrl: string | null
}

const inr = (n: number): string => `₹${Math.round(n).toLocaleString('en-IN')}`

/** Per-product Performance tab: the unit economics from the pricing engine and the
 * real units/revenue/profit for this design's SKU across the production pipeline. */
export function DesignPerformancePanel({
  designId,
  sku,
  shopifyAdminUrl,
}: DesignPerformancePanelProps): JSX.Element {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['design-performance', designId],
    queryFn: async () => {
      const res = await fetchDesignPerformance(designId)
      if (!res.ok || !res.data) throw new Error(res.error ?? 'Could not load performance.')
      return res.data
    },
  })

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Unit economics</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : isError || !data ? (
            <p className="text-muted-foreground text-sm">Could not load the economics.</p>
          ) : !data.has_pricing ? (
            <p className="text-muted-foreground text-sm">
              Not costed yet - price this design to see its margins.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="Design CP" value={inr(data.design_cp)} />
              <Stat label="Selling price" value={inr(data.selling_price)} />
              <Stat label="Margin / unit" value={inr(data.margin_per_unit)} />
              <Stat label="Margin %" value={`${Math.round(data.margin_pct * 100)}%`} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <div className="flex flex-col gap-1">
            <CardTitle>Sales &amp; production</CardTitle>
            {sku ? (
              <p className="text-subtle-foreground font-mono text-xs tabular-nums">SKU {sku}</p>
            ) : null}
          </div>
          {shopifyAdminUrl ? (
            <a
              href={shopifyAdminUrl}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: 'secondary', size: 'sm' })}
            >
              <ExternalLink aria-hidden />
              Shopify
            </a>
          ) : null}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : isError || !data ? (
            <p className="text-muted-foreground text-sm">Could not load sales.</p>
          ) : data.units_ordered === 0 ? (
            <p className="text-muted-foreground text-sm text-pretty">
              No sales yet - units, revenue and profit appear here once orders come in for this
              product{sku ? '' : ' (assign a SKU and publish it to Shopify first)'}.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <Stat label="Units ordered" value={data.units_ordered} />
              <Stat label="Completed" value={data.units_completed} />
              <Stat label="Failed" value={data.units_failed} />
              <Stat label="Revenue" value={inr(data.revenue)} />
              <Stat label="Profit" value={inr(data.profit)} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
