'use client'

import { useQuery } from '@tanstack/react-query'
import { Box, FileText, Loader2, ShoppingBag } from 'lucide-react'
import type { JSX } from 'react'

import { fetchDesignDetail } from '@/app/dashboard/[brand]/designs/actions'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  type DesignAttributes,
  type DesignDetail,
  type DesignSpecs,
  DesignSpecsSchema,
} from '@/lib/validators/designs'

import { DesignDetailTabs } from './design-detail-tabs'
import { type ReviewCaps, DesignReviewActions } from './design-review-actions'
import { DesignStatusBadge } from './design-status-badge'
import { EditShopifyListingDialog } from './edit-shopify-dialog'
import { PublishShopifyDialog } from './publish-shopify-dialog'

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

// attributesSummary renders the optional upload metadata as one compact line.
function attributesSummary(a: DesignAttributes): string {
  return [
    a.product_type ? `Type: ${a.product_type}` : '',
    a.personalisation_type ? `Personalisation: ${a.personalisation_type}` : '',
    a.colour_count ? `Colours: ${a.colour_count}` : '',
    a.add_ons?.length ? `Add-ons: ${a.add_ons.join(', ')}` : '',
    a.packaging_type ? `Packaging: ${a.packaging_type}` : '',
  ]
    .filter(Boolean)
    .join('  ·  ')
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
  // Publishing is the last step of the review flow: only an APPROVED design can be
  // pushed to Shopify (the backend enforces this). A priced design must first be
  // submitted and approved via the review actions above.
  const canPublish = design.status === 'approved' || design.status === 'published'
  const publishPrice = design.pricing?.approved_sp ?? design.pricing?.recommended_sp ?? null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-display text-3xl">{design.name}</h1>
          <p className="text-muted-foreground mt-1 font-mono text-xs tabular-nums">
            {design.material} / {design.quality} / {design.units_per_bed} per bed /{' '}
            {design.infill_pct}% infill
          </p>
          <p className="text-muted-foreground mt-1 font-mono text-xs tabular-nums">
            SKU{' '}
            {design.sku ? (
              <span className="text-foreground">{design.sku}</span>
            ) : (
              <span className="italic">not assigned</span>
            )}
          </p>
          {design.attributes ? (
            <p className="text-muted-foreground mt-1 text-xs">
              {attributesSummary(design.attributes)}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Same-origin links: the route handler mints the backend token from
              the session, so no token is exposed to the browser. The model is the
              file to open in a slicer; the G-code is the H2S costing slice. */}
          <a
            href={`/api/designs/${design.id}/model`}
            download
            className={buttonVariants({ variant: 'secondary', size: 'sm' })}
          >
            <Box aria-hidden />
            Model
          </a>
          <a
            href={`/api/designs/${design.id}/report`}
            download
            className={buttonVariants({ variant: 'ghost', size: 'sm' })}
          >
            <FileText aria-hidden />
            Report
          </a>
          {canPublish ? (
            <PublishShopifyDialog
              brand={brand}
              designId={design.id}
              defaultTitle={design.name}
              defaultPrice={publishPrice}
              defaultSku={design.sku ?? undefined}
              defaultDescription={design.attributes?.product_description}
              isApproved={design.status === 'approved'}
              onPublished={() => void refetch()}
            />
          ) : null}
          {design.shopify && canPublish ? (
            <EditShopifyListingDialog
              brand={brand}
              designId={design.id}
              onSaved={() => void refetch()}
            />
          ) : null}
          {design.shopify ? (
            <a
              href={design.shopify.admin_url}
              target="_blank"
              rel="noreferrer"
              title="Open the listing in Shopify"
              className={buttonVariants({ variant: 'secondary', size: 'sm' })}
            >
              <ShoppingBag aria-hidden />
              Shopify
            </a>
          ) : null}
          <DesignStatusBadge status={design.status} />
        </div>
      </div>

      <DesignReviewActions
        brand={brand}
        designId={design.id}
        status={design.status}
        verdict={design.pricing?.verdict ?? null}
        caps={caps}
        onDone={() => void refetch()}
      />

      {design.notes ? (
        <Card>
          <CardContent>
            <p className="text-foreground text-sm font-medium">Designer notes</p>
            <p className="text-muted-foreground mt-1 text-sm whitespace-pre-line">{design.notes}</p>
          </CardContent>
        </Card>
      ) : null}

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

      {!isProcessing ? (
        <DesignDetailTabs
          brand={brand}
          design={design}
          specs={currentSpecs(design)}
          settingsCaps={{ canEdit, canManageSku, canDelete, canWriteContent }}
          onChanged={() => void refetch()}
        />
      ) : null}
    </div>
  )
}
