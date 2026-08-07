import { redirect } from 'next/navigation'
import type { JSX } from 'react'

import { requirePermission } from '@/lib/authz'

interface CommercePageProps {
  params: Promise<{ brand: string }>
}

// Commerce has no distinct overview yet - Shopify Products is the primary
// view, so the segment root sends the rail-icon click straight there.
export default async function CommercePage({ params }: CommercePageProps): Promise<JSX.Element> {
  const { brand } = await params
  await requirePermission('shopify:publish', `/dashboard/${brand}`)
  redirect(`/dashboard/${brand}/commerce/products`)
}
