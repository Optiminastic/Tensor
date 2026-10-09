import { redirect } from 'next/navigation'

interface AgentPageProps {
  params: Promise<{ brand: string }>
}

/**
 * The Agent area has no overview of its own, so its root is its only page.
 *
 * The nav rail links every section to `${base}/${segment}` whether or not that
 * route exists - which is why this file has to: without it, clicking Agent in
 * the rail landed on a 404 while the page it was meant to reach sat one segment
 * further on. Sections that DO have something to show at the root (Production,
 * Costing) put a real page here instead.
 *
 * When a second page joins this area, this becomes a genuine landing page
 * rather than a redirect.
 */
export default async function AgentPage({ params }: AgentPageProps): Promise<never> {
  const { brand } = await params
  redirect(`/dashboard/${brand}/agent/abandoned-checkout`)
}
