import type { Metadata } from 'next'
import type { JSX } from 'react'

import { PageHeading } from '@/components/dashboard/page-heading'
import { ProductCreationForm } from '@/components/production/product-creation-form'
import { requirePermission } from '@/lib/authz'

export const metadata: Metadata = { title: 'Product Creation' }

interface ProductCreationPageProps {
  params: Promise<{ brand: string }>
}

/**
 * Print artwork made from one order. Choose the product, give the order
 * number, and Tensor builds the file from what the customer uploaded.
 */
export default async function ProductCreationPage({
  params,
}: ProductCreationPageProps): Promise<JSX.Element> {
  const { brand } = await params
  await requirePermission('production:read', `/dashboard/${brand}`)

  return (
    <main className="flex w-full flex-col gap-8 px-4 py-10 sm:px-6 md:px-8">
      <PageHeading
        eyebrow="Production"
        title="Product Creation"
        description={<>Make a product&rsquo;s print file from an order.</>}
      />
      <ProductCreationForm brand={brand} />
    </main>
  )
}
