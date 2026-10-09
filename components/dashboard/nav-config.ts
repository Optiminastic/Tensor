import {
  Archive,
  Bot,
  Building2,
  Box,
  CircleCheck,
  ClipboardList,
  Coins,
  Factory,
  FileSpreadsheet,
  Gauge,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  Library,
  type LucideIcon,
  PackageCheck,
  PackageSearch,
  PencilLine,
  ScrollText,
  Plug,
  Printer,
  Receipt,
  Send,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Store,
  SlidersHorizontal,
  Truck,
  Upload,
  Users,
  Warehouse,
} from 'lucide-react'

// The nav is a double sidebar: an icon rail of top-level areas, and a panel that
// shows the active area's sub-items. Primary areas are scoped to the active
// brand (their `segment` is appended to /dashboard/<brand>); workspace areas use
// absolute hrefs. `description` is the panel text for areas with no sub-items.

// `permission` gates visibility: a node is shown only when the user holds that
// permission key (a leaf with no permission inherits its section's visibility).
// This is UX only - the backend still enforces every permission - but it stops a
// role being shown areas whose data it cannot load (see the RBAC matrix in the
// project docs).
export interface NavLeaf {
  label: string
  href: string // brand-relative subpath, e.g. '/designs?view=upload'
  permission?: string
  // The row's icon. Required, not optional: a panel where some rows carry one
  // and some do not reads as broken rather than as a deliberate mix, and the
  // labels no longer line up.
  icon: LucideIcon
}

export interface PrimarySection {
  label: string
  icon: LucideIcon
  segment: string // '' for overview, 'designs', 'costing', ...
  items?: NavLeaf[]
  description?: string
  permission?: string
}

export interface WorkspaceSection {
  label: string
  icon: LucideIcon
  href: string // absolute
  description?: string
  permission?: string
  // Sub-pages, with ABSOLUTE hrefs - unlike a PrimarySection's, which are
  // brand-relative. A workspace area has no brand in its path, so there is
  // nothing to prefix them with.
  items?: NavLeaf[]
}

// Static dashboard routes that must never be treated as a brand slug (Next
// resolves these before the dynamic [brand] segment).
export const RESERVED_SEGMENTS = ['users', 'settings', 'brands', 'projects']

// The sentinel brand slug for the global "all brands" view. It flows through the
// same /dashboard/[brand]/... routes as a real brand, but every data fetch reads
// it as "aggregate across every brand the user can access". No real brand may be
// named this (enforced by the backend reserved-slug list and the create-brand
// validator), so it can never collide with a genuine slug.
export const ALL_BRANDS = 'all'

/** Whether a brand route param / active slug is the global sentinel. */
export function isAllBrands(brand: string | null | undefined): boolean {
  return brand === ALL_BRANDS
}

export const PRIMARY_SECTIONS: PrimarySection[] = [
  {
    label: 'Overview',
    icon: LayoutDashboard,
    segment: '',
    description: 'This brand at a glance.',
  },
  {
    label: 'Designs',
    icon: Box,
    segment: 'designs',
    permission: 'design:read',
    items: [
      { label: 'All Designs', href: '/designs', icon: LayoutGrid },
      {
        label: 'Upload Design',
        href: '/designs?view=upload',
        icon: Upload,
        permission: 'design:create',
      },
      { label: 'Drafts', href: '/designs?view=drafts', icon: PencilLine },
      { label: 'Submitted', href: '/designs?view=submitted', icon: Send },
      { label: 'Approved', href: '/designs?view=approved', icon: CircleCheck },
      { label: 'Archived', href: '/designs?view=archived', icon: Archive },
    ],
  },
  {
    label: 'Costing',
    icon: Coins,
    segment: 'costing',
    permission: 'pricing:read',
    items: [
      { label: 'Cost Reports', href: '/costing', icon: Receipt },
      { label: 'Pricing Rules', href: '/costing?view=rules', icon: SlidersHorizontal },
    ],
  },
  {
    label: 'Production',
    icon: Factory,
    segment: 'production',
    permission: 'production:read',
    items: [
      { label: 'Overview', href: '/production', icon: Gauge },
      { label: 'Orders', href: '/production/orders', icon: ShoppingCart, permission: 'order:read' },
      { label: 'Production Jobs', href: '/production/jobs', icon: ClipboardList },
      {
        label: 'Batch Management',
        href: '/production/batches',
        icon: Layers,
        permission: 'batch:read',
      },
      {
        label: 'Machine Management',
        href: '/production/machines',
        icon: Printer,
        permission: 'machine:read',
      },
      // Assembly, finishing, QC and packaging are tabs on one page now, so no
      // single station permission fits - it inherits the section's
      // production:read, which every station role holds. Each tab's actions
      // are still gated by the backend (assembly:submit / finishing:submit /
      // qc:submit / packaging:submit).
      { label: 'Packaging', href: '/production/packaging', icon: PackageCheck },
      {
        label: 'Inventory',
        href: '/production/inventory',
        icon: Warehouse,
        permission: 'filament:read',
      },
      // Directly below Inventory, where the shop asked for it, and ADMIN ONLY.
      // bulk_order:read is granted to no role but ADMIN, which holds every
      // permission by construction - so this leaf is invisible to everyone
      // else even though the Production section around it is not.
      {
        label: 'Bulk Orders',
        href: '/production/bulk-orders',
        icon: FileSpreadsheet,
        permission: 'bulk_order:read',
      },
      // Below Inventory on purpose: the Registry is what Inventory is ABOUT.
      // Inventory says how many LED strips are on the shelf; the Registry says
      // which products need them, and what one costs.
      // registry:read, not config:read. The Registry is a Production page and
      // an Operator needs it - which parts a SKU takes is what assembling one
      // requires - while config:read also opens cost assumptions, which that
      // role never sees. The backend splits the same way, and withholds
      // parts_cost/line_cost from anyone without config:read.
      {
        label: 'Registry',
        href: '/production/registry',
        icon: Library,
        permission: 'registry:read',
      },
    ],
  },
  {
    label: 'Agent',
    icon: Bot,
    segment: 'agent',
    // order:read, not a permission of its own. Everything under here is about
    // real customers and their baskets - the same data the Orders page shows,
    // reached a different way - so the roles that may see orders are exactly
    // the roles that may see this.
    permission: 'order:read',
    items: [
      { label: 'Abandoned Checkout', href: '/agent/abandoned-checkout', icon: ShoppingBag },
      // Directly below it, because it is the other half of the same story:
      // one page says who walked away, the next says what was said to them.
      { label: 'Logs', href: '/agent/call-logs', icon: ScrollText },
    ],
  },
  {
    label: 'Shipping',
    icon: Truck,
    segment: 'shipping',
    // order:read, for the same reason the Orders page uses it: a parcel is an
    // order in a box, and the row carries the customer's name, address and
    // phone number. The roles that may see orders are exactly the roles that
    // would ring somebody about a delivery that failed.
    permission: 'order:read',
    items: [{ label: 'Deliveries', href: '/shipping/deliveries', icon: PackageSearch }],
  },
]

export const WORKSPACE_SECTIONS: WorkspaceSection[] = [
  {
    label: 'Team',
    icon: Users,
    href: '/dashboard/users',
    permission: 'user:read',
    description: 'Invite teammates and manage roles.',
  },
  {
    label: 'Settings',
    icon: Settings,
    href: '/dashboard/settings',
    // brand:manage, because that is what this page does: it deletes brands,
    // edits a brand's ladder and CP thresholds, and connects its store. It was
    // ungated, so every role saw a Settings area offering to delete a brand -
    // the backend refused the delete, but only after somebody pressed it.
    //
    // Not brand:read: every role holds that now (it is how they list the brands
    // they may work in), so it would gate nothing.
    permission: 'brand:manage',
    description: 'Workspace, brand and integrations.',
    // Pages, not tabs. Three tabs inside one route meant the left panel showed
    // a sentence where every other area shows its pages, so Settings was the
    // one place the sidebar could not tell you what was in it - and no tab had
    // a URL you could send anybody.
    items: [
      { label: 'Workspace', href: '/dashboard/settings', icon: Building2 },
      { label: 'Brand', href: '/dashboard/settings/brand', icon: Store },
      { label: 'Integrations', href: '/dashboard/settings/integrations', icon: Plug },
    ],
  },
]

/** Whether a nav node is visible: no permission means always, else held. */
export function navVisible(permissions: string[], permission?: string): boolean {
  return !permission || permissions.includes(permission)
}

/** The primary sections the given permissions may see. */
export function visiblePrimarySections(permissions: string[]): PrimarySection[] {
  return PRIMARY_SECTIONS.filter(section => navVisible(permissions, section.permission))
}

/** The workspace sections the given permissions may see. */
export function visibleWorkspaceSections(permissions: string[]): WorkspaceSection[] {
  return WORKSPACE_SECTIONS.filter(section => navVisible(permissions, section.permission))
}

/** The visible sub-items of a section for the given permissions. */
export function visibleItems(permissions: string[], items?: NavLeaf[]): NavLeaf[] {
  return (items ?? []).filter(item => navVisible(permissions, item.permission))
}

/** Splits a nav href into its path and optional `view` query for active matching. */
export function parseNavHref(href: string): { path: string; view: string | null } {
  const [path, query] = href.split('?')
  const view = query ? new URLSearchParams(query).get('view') : null
  return { path, view }
}

/**
 * The nav leaf href that should read as active for the current pathname, or
 * null if none match. Two leaf shapes coexist:
 * - query-based (e.g. `/designs?view=upload`): active only on an exact path +
 *   matching `?view=` query.
 * - path-based (e.g. `/production/jobs`): active on that path OR anything
 *   nested under it (e.g. `/production/jobs/<id>`, a job's detail page).
 *
 * Path-based leaves can nest inside one another (`/production` is a prefix of
 * `/production/jobs`), so among every leaf that matches, the one with the
 * longest path wins - the most specific route stays highlighted instead of
 * its parent.
 */
export function resolveActiveHref(
  pathname: string,
  currentView: string | null,
  hrefs: string[],
): string | null {
  let best: string | null = null
  let bestPathLength = -1
  for (const href of hrefs) {
    const { path, view } = parseNavHref(href)
    const matches =
      view !== null
        ? pathname === path && currentView === view
        : pathname === path || pathname.startsWith(`${path}/`)
    if (matches && path.length > bestPathLength) {
      best = href
      bestPathLength = path.length
    }
  }
  return best
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
