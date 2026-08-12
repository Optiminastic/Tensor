import type { Design, DesignLifecycle } from '@/lib/validators/designs'

/** The lifecycle views the Designs nav offers (mirrors the sub-nav items). */
export type DesignView = 'all' | 'drafts' | 'submitted' | 'approved' | 'archived'

// Drafts are everything before submission: uploaded, slicing, priced, failed, or
// sent back for changes. Approved folds in published (an approved design that has
// been pushed to Shopify is still "approved" to the reviewer).
const DRAFT_STATUSES: DesignLifecycle[] = [
  'queued',
  'slicing',
  'priced',
  'failed',
  'changes_requested',
]
const APPROVED_STATUSES: DesignLifecycle[] = ['approved', 'published']

/**
 * Normalises the `?view=` search param to a known view. `upload` and anything
 * unrecognised fall through to `all` (everything except archived).
 */
export function resolveDesignView(view: string | undefined): DesignView {
  if (view === 'drafts' || view === 'submitted' || view === 'approved' || view === 'archived') {
    return view
  }
  return 'all'
}

/**
 * Filters designs to a lifecycle view. `all` hides archived designs; only the
 * `archived` view surfaces them, so a soft-deleted design leaves every other list.
 */
export function filterDesignsByView(designs: Design[], view: DesignView): Design[] {
  switch (view) {
    case 'drafts':
      return designs.filter(design => DRAFT_STATUSES.includes(design.status))
    case 'submitted':
      return designs.filter(design => design.status === 'submitted')
    case 'approved':
      return designs.filter(design => APPROVED_STATUSES.includes(design.status))
    case 'archived':
      return designs.filter(design => design.status === 'archived')
    case 'all':
    default:
      return designs.filter(design => design.status !== 'archived')
  }
}

/** The empty-state copy for each view. */
export function emptyDesignsMessage(view: DesignView): string {
  switch (view) {
    case 'drafts':
      return 'No drafts. Uploaded designs waiting to be submitted show here.'
    case 'submitted':
      return 'Nothing submitted for review yet.'
    case 'approved':
      return 'No approved designs yet.'
    case 'archived':
      return 'Nothing archived.'
    case 'all':
    default:
      return 'No designs yet. Upload one to run the pre-check.'
  }
}
