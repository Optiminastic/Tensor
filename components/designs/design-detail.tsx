'use client'

import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import type { JSX } from 'react'

import { fetchDesignDetail } from '@/app/dashboard/[brand]/designs/actions'
import { Card, CardContent } from '@/components/ui/card'
import { type DesignDetail, type DesignSpecs, DesignSpecsSchema } from '@/lib/validators/designs'

import { DesignMetricsPanel } from './design-metrics'
import { DesignResubmitForm } from './design-resubmit-form'
import { DesignStatusBadge } from './design-status-badge'
import { DesignVerdict } from './design-verdict'

const POLL_MS = 2500

interface DesignDetailViewProps {
  brand: string
  initial: DesignDetail
}

function currentSpecs(design: DesignDetail): DesignSpecs {
  const parsed = DesignSpecsSchema.safeParse({
    material: design.material,
    colour: design.colour ?? undefined,
    finish: design.finish,
    units_per_bed: design.units_per_bed,
    quality: design.quality,
    infill_pct: design.infill_pct,
  })
  return parsed.success
    ? parsed.data
    : { material: 'PLA', finish: 'none', units_per_bed: 1, quality: 'standard', infill_pct: 15 }
}

/** Polls the design through the slice -> price loop, then shows metrics, the
 * verdict, and the re-slice form. */
export function DesignDetailView({ brand, initial }: DesignDetailViewProps): JSX.Element {
  const { data: design, refetch } = useQuery({
    queryKey: ['design', initial.id],
    initialData: initial,
    queryFn: async (): Promise<DesignDetail> => {
      const outcome = await fetchDesignDetail(initial.id)
      if (!outcome.ok || !outcome.data) {
        throw new Error(outcome.error ?? 'Could not load the design.')
      }
      return outcome.data
    },
    refetchInterval: query => {
      const status = query.state.data?.status
      return status === 'queued' || status === 'slicing' ? POLL_MS : false
    },
  })

  const isProcessing = design.status === 'queued' || design.status === 'slicing'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-display text-3xl">{design.name}</h1>
          <p className="text-muted-foreground mt-1 font-mono text-xs tabular-nums">
            {design.material} / {design.quality} / {design.units_per_bed} per bed /{' '}
            {design.infill_pct}% infill
          </p>
        </div>
        <DesignStatusBadge status={design.status} />
      </div>

      {isProcessing ? (
        <Card>
          <CardContent>
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Slicing and costing this design. This updates on its own.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {design.status === 'failed' ? (
        <Card>
          <CardContent>
            <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
              {design.job?.error ?? 'The slice failed. Adjust the settings and try again.'}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {design.metrics ? <DesignMetricsPanel metrics={design.metrics} /> : null}
      {design.pricing ? <DesignVerdict pricing={design.pricing} /> : null}

      {!isProcessing ? (
        <DesignResubmitForm
          brand={brand}
          designId={design.id}
          current={currentSpecs(design)}
          onResubmitted={() => void refetch()}
        />
      ) : null}
    </div>
  )
}
