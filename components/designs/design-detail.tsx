'use client'

import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import type { JSX } from 'react'

import { fetchDesignDetail } from '@/app/dashboard/[brand]/designs/actions'
import { OverviewTile } from '@/components/dashboard/overview/overview-tile'
import { TileLabel } from '@/components/dashboard/overview/tile-label'
import { type DesignDetail, type DesignSpecs, DesignSpecsSchema } from '@/lib/validators/designs'

import { DesignDetailTabs } from './design-detail-tabs'
import { DesignHero } from './detail/design-hero'
import { DesignReviewPanel } from './review/design-review-panel'
import type { ReviewCaps } from './review/review-caps'

const POLL_MS = 2500

interface DesignDetailViewProps {
  brand: string
  initial: DesignDetail
  caps: ReviewCaps
  canManageSku: boolean
  canEdit: boolean
  canDelete: boolean
  canWriteContent: boolean
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
    : {
        material: 'PLA Basics',
        finish: 'none',
        units_per_bed: 1,
        quality: '0.20-standard',
        infill_pct: 15,
      }
}

/** Polls the design through the slice -> price loop, then shows metrics, the
 * verdict, and the re-slice form. */
export function DesignDetailView({
  brand,
  initial,
  caps,
  canManageSku,
  canEdit,
  canDelete,
  canWriteContent,
}: DesignDetailViewProps): JSX.Element {
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
  const refresh = (): void => void refetch()

  return (
    <div className="flex flex-col gap-6">
      <DesignHero brand={brand} design={design} onChanged={refresh} />

      <DesignReviewPanel brand={brand} design={design} caps={caps} onDone={refresh} />

      {design.notes ? (
        <OverviewTile tone="paper" label="Designer notes">
          <TileLabel>Designer notes</TileLabel>
          <p className="text-sm whitespace-pre-line">{design.notes}</p>
        </OverviewTile>
      ) : null}

      {isProcessing ? (
        <OverviewTile label="Slicing">
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Slicing and costing this design. This updates on its own.
          </p>
        </OverviewTile>
      ) : null}

      {design.status === 'failed' ? (
        <OverviewTile label="Slice failed">
          <p role="alert" className="bg-danger-subtle text-danger rounded-2xl px-4 py-3 text-sm">
            {design.job?.error ?? 'The slice failed. Adjust the settings and try again.'}
          </p>
        </OverviewTile>
      ) : null}

      {!isProcessing ? (
        <DesignDetailTabs
          brand={brand}
          design={design}
          specs={currentSpecs(design)}
          settingsCaps={{ canEdit, canManageSku, canDelete, canWriteContent }}
          onChanged={refresh}
        />
      ) : null}
    </div>
  )
}
