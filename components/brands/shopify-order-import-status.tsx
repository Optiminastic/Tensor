import type { JSX } from 'react'

interface ShopifyOrderImportStatusProps {
  brandSlug: string
  shopDomain: string
}

/**
 * A discreet nudge shown only when this brand's store hasn't completed the
 * real order-import OAuth grant (shopify_connections) - e.g. a brand created
 * before that flow existed, or connected has since gone stale. Nothing
 * renders once it's connected; there is no permanent card for this anymore
 * (see /api/shopify/orders/connect, which this link re-enters).
 */
export function ShopifyOrderImportStatus({
  brandSlug,
  shopDomain,
}: ShopifyOrderImportStatusProps): JSX.Element {
  const href = `/api/shopify/orders/connect?brand=${encodeURIComponent(brandSlug)}&shop_domain=${encodeURIComponent(shopDomain)}`
  return (
    <p className="text-muted-foreground -mt-2 text-xs">
      Shopify order import isn&apos;t connected - paid/COD orders won&apos;t flow in until it is.{' '}
      <a href={href} className="text-accent hover:underline">
        Reconnect order import
      </a>
    </p>
  )
}
