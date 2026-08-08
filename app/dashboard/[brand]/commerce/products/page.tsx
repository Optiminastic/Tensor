import type { Metadata } from 'next'
import type { JSX } from 'react'

import { ShopifyProductGrid } from '@/components/commerce/shopify-product-grid'
import { Card, CardContent } from '@/components/ui/card'
import { resolveBackendToken } from '@/lib/backend-token'
import type { ShopifyProduct } from '@/lib/validators/shopify-products'
import {
  listShopifyProducts,
  ShopifyProductsServiceError,
} from '@/services/shopify-products.service'

export const metadata: Metadata = { title: 'Shopify Products' }

interface CommerceProductsPageProps {
  params: Promise<{ brand: string }>
}

/** A brand's connected store's live product catalog, fetched from Shopify on every load. */
export default async function CommerceProductsPage({
  params,
}: CommerceProductsPageProps): Promise<JSX.Element> {
  const { brand } = await params

  let products: ShopifyProduct[] = []
  let error: string | null = null
  const { token, error: tokenError } = await resolveBackendToken()
  if (!token) {
    error = tokenError ?? 'Your session has expired. Sign in again.'
  } else {
    try {
      products = await listShopifyProducts(token, brand)
    } catch (err) {
      error = err instanceof ShopifyProductsServiceError ? err.message : 'Could not load products.'
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-display text-3xl">Shopify Products</h1>
        <p className="text-muted-foreground text-sm">
          This brand&apos;s live product catalog, straight from Shopify.
        </p>
      </div>

      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      ) : products.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              No products in this store yet. Add one in Shopify and it will show up here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ShopifyProductGrid products={products} />
      )}
    </main>
  )
}
