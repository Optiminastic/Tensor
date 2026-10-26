import { Download } from 'lucide-react'
import type { JSX } from 'react'

import { buttonVariants } from '@/components/ui/button'

interface TemplateDownloadButtonProps {
  templateKey: string
}

/**
 * Downloads the .scad a design template renders from.
 *
 * An anchor rather than a button with a click handler: a download is a
 * navigation, so the browser streams it straight to disk instead of the page
 * buffering it into memory first.
 *
 * It goes through /api/registry/templates/[key]/file because the Tensor-Core
 * bearer token is minted server-side and must never reach the browser.
 *
 * `download` is BARE, with no value - the same rule JobModelPreview documents.
 * Given a value the browser prefers it over the server's Content-Disposition,
 * and the value available here is a route segment with no extension, so the
 * file would save as something OpenSCAD will not open. Bare, it forces the
 * download and lets Tensor-Core's own `filename="dnp_heart_joinery.scad"` win.
 *
 * Icon only, by the shop's request. The name it would have carried moves to
 * aria-label and title: an icon alone says nothing to a screen reader, and
 * nothing on hover either.
 */
export function TemplateDownloadButton({ templateKey }: TemplateDownloadButtonProps): JSX.Element {
  const label = `Download ${templateKey}.scad`
  return (
    <a
      href={`/api/registry/templates/${encodeURIComponent(templateKey)}/file`}
      download
      aria-label={label}
      title={label}
      className={buttonVariants({ variant: 'ghost', size: 'sm' })}
    >
      <Download className="size-3.5" aria-hidden />
    </a>
  )
}
