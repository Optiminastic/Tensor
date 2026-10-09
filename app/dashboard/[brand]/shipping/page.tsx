import { redirect } from 'next/navigation'

interface ShippingPageProps {
  params: Promise<{ brand: string }>
}

/**
 * The Shipping area has no overview of its own, so its root is its only page.
 *
 * The nav rail links every section to `${base}/${segment}` whether or not that
 * route exists - so clicking Shipping in the rail lands here, and without this
 * file it lands on a 404 while the page it was meant to reach sits one segment
 * further on. The Agent area next door has the same redirect for the same
 * reason; sections with something to show at the root (Production, Costing)
 * put a real page here instead.
 *
 * When a second page joins this area, this becomes a genuine landing page
 * rather than a redirect.
 */
export default async function ShippingPage({ params }: ShippingPageProps): Promise<never> {
  const { brand } = await params
  redirect(`/dashboard/${brand}/shipping/deliveries`)
}
