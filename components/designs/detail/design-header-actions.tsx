import { Box, FileText, ShoppingBag } from 'lucide-react'
import type { JSX } from 'react'

import { pillClasses } from '@/components/landing/pill-styles'
import type { DesignDetail } from '@/lib/validators/designs'

import { EditShopifyListingDialog } from '../edit-shopify-dialog'
import { PublishShopifyDialog } from '../publish-shopify-dialog'

interface DesignHeaderActionsProps {
  brand: string
  design: DesignDetail
  onChanged: () => void
}

const DOWNLOAD = pillClasses({ tone: 'outline', className: 'h-10 gap-2' })

/**
 * Downloads and the Shopify steps. The downloads are same-origin: the route
 * handler mints the backend token from the session, so none reaches the
 * browser. Only an approved (or already published) design may be published;
 * the backend enforces it.
 */
export function DesignHeaderActions({
  brand,
  design,
  onChanged,
}: DesignHeaderActionsProps): JSX.Element {
  const canPublish = design.status === 'approved' || design.status === 'published'
  return (
    <div className="flex flex-wrap items-center gap-2">
      <a href={`/api/designs/${design.id}/model`} download className={DOWNLOAD}>
        <Box className="size-4" aria-hidden />
        Model
      </a>
      <a href={`/api/designs/${design.id}/report`} download className={DOWNLOAD}>
        <FileText className="size-4" aria-hidden />
        Report
      </a>
      {design.shopify ? (
        <a href={design.shopify.admin_url} target="_blank" rel="noreferrer" className={DOWNLOAD}>
          <ShoppingBag className="size-4" aria-hidden />
          Shopify
        </a>
      ) : null}
      {canPublish ? (
        <PublishShopifyDialog
          brand={brand}
          designId={design.id}
          defaultTitle={design.name}
          defaultPrice={design.pricing?.approved_sp ?? design.pricing?.recommended_sp ?? null}
          defaultSku={design.sku ?? undefined}
          defaultDescription={design.attributes?.product_description}
          isApproved={design.status === 'approved'}
          onPublished={onChanged}
        />
      ) : null}
      {design.shopify && canPublish ? (
        <EditShopifyListingDialog brand={brand} designId={design.id} onSaved={onChanged} />
      ) : null}
    </div>
  )
}
