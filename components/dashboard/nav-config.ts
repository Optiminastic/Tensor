import {
  Box,
  Coins,
  Factory,
  LayoutDashboard,
  type LucideIcon,
  Plug,
  Settings,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'

// The nav is a double sidebar: an icon rail of top-level areas, and a panel that
// shows the active area's sub-items. Primary areas are scoped to the active
// brand (their `segment` is appended to /dashboard/<brand>); workspace areas use
// absolute hrefs. `description` is the panel text for areas with no sub-items.

export interface NavLeaf {
  label: string
  href: string // brand-relative subpath, e.g. '/designs?view=upload'
}

export interface PrimarySection {
  label: string
  icon: LucideIcon
  segment: string // '' for overview, 'designs', 'costing', ...
  items?: NavLeaf[]
  description?: string
}

export interface WorkspaceSection {
  label: string
  icon: LucideIcon
  href: string // absolute
  description?: string
}

// Static dashboard routes that must never be treated as a brand slug (Next
// resolves these before the dynamic [brand] segment).
export const RESERVED_SEGMENTS = ['users', 'settings', 'brands', 'projects']

export const PRIMARY_SECTIONS: PrimarySection[] = [
  { label: 'Overview', icon: LayoutDashboard, segment: '', description: 'This brand at a glance.' },
  {
    label: 'Designs',
    icon: Box,
    segment: 'designs',
    items: [
      { label: 'All Designs', href: '/designs' },
      { label: 'Upload Design', href: '/designs?view=upload' },
      { label: 'Drafts', href: '/designs?view=drafts' },
      { label: 'Submitted', href: '/designs?view=submitted' },
      { label: 'Approved', href: '/designs?view=approved' },
      { label: 'Archived', href: '/designs?view=archived' },
    ],
  },
  {
    label: 'Costing',
    icon: Coins,
    segment: 'costing',
    items: [
      { label: 'Cost Reports', href: '/costing' },
      { label: 'Price Calculator', href: '/costing?view=calculator' },
      { label: 'Pricing Rules', href: '/costing?view=rules' },
    ],
  },
  {
    label: 'Production',
    icon: Factory,
    segment: 'production',
    items: [
      { label: 'Overview', href: '/production' },
      { label: 'Production Jobs', href: '/production?view=jobs' },
      { label: 'Batch Management', href: '/production?view=batches' },
      { label: 'Machine Management', href: '/production?view=machines' },
      { label: 'Filament Inventory', href: '/production?view=inventory' },
    ],
  },
  {
    label: 'Commerce',
    icon: ShoppingBag,
    segment: 'commerce',
    items: [
      { label: 'Shopify Products', href: '/commerce' },
      { label: 'Orders', href: '/commerce?view=orders' },
      { label: 'Collections', href: '/commerce?view=collections' },
    ],
  },
  {
    label: 'Analytics',
    icon: TrendingUp,
    segment: 'analytics',
    items: [
      { label: 'Profitability', href: '/analytics' },
      { label: 'Machine Utilization', href: '/analytics?view=utilization' },
      { label: 'Design Performance', href: '/analytics?view=performance' },
    ],
  },
  {
    label: 'AI Center',
    icon: Sparkles,
    segment: 'ai-center',
    items: [
      { label: 'Recommendations', href: '/ai-center' },
      { label: 'Design Optimizer', href: '/ai-center?view=optimizer' },
      { label: 'Cost Savings', href: '/ai-center?view=savings' },
    ],
  },
  {
    label: 'Integrations',
    icon: Plug,
    segment: 'integrations',
    description: 'Shopify, Google Ads and Meta Ads for this brand.',
  },
]

export const WORKSPACE_SECTIONS: WorkspaceSection[] = [
  {
    label: 'Team',
    icon: Users,
    href: '/dashboard/users',
    description: 'Invite teammates and manage roles.',
  },
  {
    label: 'Settings',
    icon: Settings,
    href: '/dashboard/settings',
    description: 'Workspace and account settings.',
  },
]

/** Splits a nav href into its path and optional `view` query for active matching. */
export function parseNavHref(href: string): { path: string; view: string | null } {
  const [path, query] = href.split('?')
  const view = query ? new URLSearchParams(query).get('view') : null
  return { path, view }
}

/**
 * Whether a nav leaf is active for the current pathname. Most leaves share one
 * page and switch on a `?view=` query (e.g. `/production?view=jobs`), but a
 * leaf's view can also own real nested routes (e.g. `/production/jobs/<id>`
 * for a job's detail page) - that first path segment past the leaf's base path
 * counts as the view too, so the sidebar stays on "Production Jobs" there.
 */
export function isLeafActive(pathname: string, currentView: string | null, href: string): boolean {
  const { path, view } = parseNavHref(href)
  if (pathname === path) return currentView === view
  if (!pathname.startsWith(`${path}/`)) return false
  const nestedSegment = pathname.slice(path.length + 1).split('/')[0]
  return nestedSegment === view
}

/** The active brand slug from a dashboard pathname, or null on a workspace/root route. */
export function brandFromPathname(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean) // ['dashboard', '<seg>', ...]
  if (segments[0] !== 'dashboard') return null
  const seg = segments[1]
  if (!seg || RESERVED_SEGMENTS.includes(seg)) return null
  return seg
}

/**
 * The brand-relative segment for the primary area in the URL ('' = overview), or
 * null when the route is workspace-level (Team/Settings) or the bare root.
 */
export function primarySegment(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean)
  if (segments[0] !== 'dashboard') return null
  if (!segments[1] || RESERVED_SEGMENTS.includes(segments[1])) return null
  return segments[2] ?? ''
}
