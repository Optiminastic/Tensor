import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import type { JSX, ReactNode } from 'react'

import { auth } from '@/lib/auth'
import { listBrands } from '@/services/brands.service'

export const dynamic = 'force-dynamic'

interface BrandLayoutProps {
  children: ReactNode
  params: Promise<{ brand: string }>
}

/**
 * Guards the brand workspace: a 404 for a slug that is not a real brand. The
 * outer dashboard layout already checks the session and renders the sidebar.
 */
export default async function BrandLayout({
  children,
  params,
}: BrandLayoutProps): Promise<JSX.Element> {
  const { brand } = await params
  const token = await auth.api.getToken({ headers: await headers() })
  if (token?.token) {
    const brands = await listBrands(token.token).catch(() => null)
    if (brands !== null && !brands.some(item => item.slug === brand)) notFound()
  }
  return <>{children}</>
}
