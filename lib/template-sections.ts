import type { DesignTemplate } from '@/lib/validators/registry'

/**
 * Which heading a design file belongs under.
 *
 * The label somebody filed it as, and failing that the heading its actual use
 * implies. Automatic is right for every correctly wired file and needs nobody
 * to maintain it; the dropdown on the Designs tab is for the rest — a part's
 * mesh, a test piece, a file whose use the screen cannot see.
 *
 * SHARED, not private to the Designs table any more. The per-SKU file pickers
 * offer printing files in one column and preview files in the other, and a
 * second copy of this rule is a second answer to "which list is this file in"
 * that can disagree with the page the lists came from.
 */
export const TEMPLATE_SECTIONS = ['print', 'preview', 'other'] as const
export type TemplateSection = (typeof TEMPLATE_SECTIONS)[number]

/**
 * Whether this file sits under a heading.
 *
 * A FILED file sits under exactly one. An automatic one may sit under two,
 * because the same .scad can print a product and draw its preview — which is
 * true of this shop's lotus holder, and the reason the heading is not a
 * property of the file.
 */
export function sitsInSection(template: DesignTemplate, section: TemplateSection): boolean {
  const filed = (template.section ?? '').trim()
  if (filed !== '') return filed === section
  const roles = (template.used_by ?? []).map(u => u.role)
  if (section === 'print') return roles.includes('body')
  if (section === 'preview') return roles.includes('preview')
  return roles.length === 0
}

/**
 * The files to offer for one role, most useful first.
 *
 * Narrowed to the section rather than offered whole: a list of every .scad in
 * the shop makes choosing the preview file for one colourway a search. The
 * ones that already serve this role come first, because on a product whose
 * SKUs mostly share a file, the right answer is usually one a sibling already
 * uses.
 *
 * NEVER EMPTY WHEN SOMETHING IS ALREADY CHOSEN: a file that has since been
 * filed elsewhere still appears, or the dropdown would silently show "choose
 * a file" for a SKU that has one.
 */
export function templatesForSection(
  templates: DesignTemplate[],
  section: TemplateSection,
  chosen?: string,
): DesignTemplate[] {
  const picked = (chosen ?? '').trim().toLowerCase()
  const inSection = templates.filter(
    t => sitsInSection(t, section) || t.key.toLowerCase() === picked,
  )
  const role = section === 'preview' ? 'preview' : 'body'
  return [
    ...inSection.filter(t => (t.used_by ?? []).some(u => u.role === role)),
    ...inSection.filter(t => !(t.used_by ?? []).some(u => u.role === role)),
  ]
}

/** How a file reads in a picker: its key, and where the renderer reads it from. */
export function templateLabel(template: DesignTemplate): string {
  const source = template.source === 'uploaded' ? `v${template.version}` : 'built in'
  return `${template.key} · ${source}${template.self_coloured ? ' · own colours' : ''}`
}
