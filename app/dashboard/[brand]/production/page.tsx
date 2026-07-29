import type { Metadata } from 'next'
import type { JSX } from 'react'

import { LiveProducts, type LiveProduct } from '@/components/production/live-products'
import { resolveBackendToken } from '@/lib/backend-token'
import type { DesignDetail } from '@/lib/validators/designs'
import { DesignServiceError, getDesign, listDesigns } from '@/services/designs.service'

export const metadata: Metadata = { title: 'Live' }

export const dynamic = 'force-dynamic'

interface ProductionPageProps {
  params: Promise<{ brand: string }>
}

/**
 * Production - Live: the brand's designs that have been published to Shopify.
 * Published designs carry a Shopify product reference, so each row links out to
 * the store as well as back to the design's pre-check.
 */
export default async function ProductionPage({
  params,
}: ProductionPageProps): Promise<JSX.Element> {
  const { brand } = await params

  let products: LiveProduct[] = []
  let error: string | null = null
  const { token, error: tokenError } = await resolveBackendToken()
  if (!token) {
    error = tokenError ?? 'Your session has expired. Sign in again.'
  } else {
    try {
      products = await loadLiveProducts(token, brand)
    } catch (err) {
      error = err instanceof DesignServiceError ? err.message : 'Could not load live products.'
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-display text-3xl">Live</h1>
        <p className="text-muted-foreground text-sm">
          Products published to Shopify for this brand.
        </p>
      </div>

      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      ) : null}
      <LiveProducts brand={brand} products={products} />
    </main>
  )
}

// loadLiveProducts lists the brand's designs, keeps the published ones, and
// enriches each with its Shopify link + price from the design detail. Published
// products are few, so the per-design fetch is acceptable; a failed detail is
// skipped rather than failing the whole page.
async function loadLiveProducts(token: string, brand: string): Promise<LiveProduct[]> {
  const designs = await listDesigns(token, brand)
  const published = designs.filter(design => design.status === 'published')
  const details = await Promise.all(
    published.map(design => getDesign(token, design.id).catch(() => null)),
  )
  return details.filter((detail): detail is DesignDetail => detail !== null).map(toLiveProduct)
}

function toLiveProduct(detail: DesignDetail): LiveProduct {
  return {
    id: detail.id,
    name: detail.name,
    material: detail.material,
    quality: detail.quality,
    price: detail.pricing?.approved_sp ?? detail.pricing?.recommended_sp ?? null,
    shopifyUrl: detail.shopify?.admin_url ?? null,
  }
}
