import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { JSX } from 'react'

import { QuotationDocument } from '@/components/production/quotation-document'
import { requirePermission } from '@/lib/authz'
import { resolveBackendToken } from '@/lib/backend-token'
import { listBrands } from '@/services/brands.service'
import { getBulkOrder } from '@/services/bulk-orders.service'

export const metadata: Metadata = { title: 'Quotation' }

export const dynamic = 'force-dynamic'

interface QuotationPageProps {
  params: Promise<{ brand: string; id: string }>
}

/**
 * The quotation itself — the document a customer is sent.
 *
 * Its own route rather than a dialog, for three reasons that all point the same
 * way: it has a URL somebody can send to a colleague, the browser can print it
 * to PDF from here, and printing a dialog prints the page behind it.
 *
 * It renders entirely from what was SAVED - the snapshotted unit prices and the
 * stored totals - never from today's Shopify prices. That is what makes the
 * document stable: it says what it said when it was issued, and changes only
 * when somebody edits the order and saves, which re-prices it deliberately.
 */
export default async function QuotationPage({ params }: QuotationPageProps): Promise<JSX.Element> {
  const { brand, id } = await params
  await requirePermission('pricing:read', `/dashboard/${brand}`)

  const { token, error } = await resolveBackendToken()
  if (!token) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-12">
        <p role="alert" className="bg-danger-subtle text-danger rounded-md px-4 py-3 text-sm">
          {error ?? 'Your session has expired. Sign in again.'}
        </p>
      </main>
    )
  }

  const order = await getBulkOrder(token, brand, id).catch(() => null)
  if (!order) notFound()

  // The brand's own name and logo head the document. Best-effort: a quotation
  // that cannot read the brand still has to print, so it falls back to the slug
  // rather than failing the page.
  const brands = await listBrands(token).catch(() => [])
  const profile = brands.find(b => b.slug === brand)

  return (
    <QuotationDocument
      order={order}
      brandName={profile?.name ?? brand}
      brandLogoUrl={profile?.logo_url ?? null}
      backHref={`/dashboard/${brand}/production/bulk-orders`}
    />
  )
}
