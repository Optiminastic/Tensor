import type { JSX } from 'react'

import type { DamageFile } from '@/lib/validators/whatsapp-damage'

/**
 * What a browser will actually draw in an <img>.
 *
 * NOT "image/*". An iPhone saves photos as HEIC, and it reaches Tensor as
 * image/heic - which uploads fine, stores fine, and renders as a broken tile
 * in every browser except Safari. A damage report whose evidence is a broken
 * image is worse than one that admits it cannot show it, because the first
 * looks like the photo was lost.
 */
const DISPLAYABLE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']

function isDisplayable(contentType: string): boolean {
  return DISPLAYABLE.includes(contentType.split(';')[0].trim().toLowerCase())
}

/** A short name for a format a browser will not draw, e.g. "HEIC photo". */
function formatName(contentType: string): string {
  const subtype = contentType.split('/')[1]?.split(';')[0]?.trim().toUpperCase() ?? 'file'
  return contentType.startsWith('video/') ? 'video' : `${subtype} photo`
}

interface DamageFileGridProps {
  brand: string
  reportId: string
  files: DamageFile[]
}

/**
 * What the customer uploaded with their report.
 *
 * Images are shown; video is a link that opens in a new tab rather than
 * fifteen players loading at once on a shop-floor machine. Nothing here says
 * "downloading" or "unavailable" any more: the files were uploaded straight
 * to Tensor, so a file on the report is a file we hold.
 */
export function DamageFileGrid({ brand, reportId, files }: DamageFileGridProps): JSX.Element {
  if (files.length === 0) {
    return (
      <p className="text-muted-foreground text-sm text-pretty">
        Nothing was attached to this report.
      </p>
    )
  }

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-subtle-foreground text-[11px] font-medium tracking-wide uppercase">
        What the customer sent
      </h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {files.map(file => (
          <Attachment key={file.id} brand={brand} reportId={reportId} file={file} />
        ))}
      </div>
    </section>
  )
}

function Attachment({
  brand,
  reportId,
  file,
}: {
  brand: string
  reportId: string
  file: DamageFile
}): JSX.Element {
  const href =
    `/api/damage/${encodeURIComponent(brand)}/${encodeURIComponent(reportId)}` +
    `/files/${encodeURIComponent(file.id)}`

  if (!isDisplayable(file.content_type)) {
    return (
      <div className="bg-surface-muted flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-lg px-2 text-center">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent text-xs underline-offset-4 hover:underline"
        >
          Open {formatName(file.content_type)}
        </a>
        <span className="text-subtle-foreground font-mono text-[11px] tabular-nums">
          {megabytes(file.size_bytes)}
        </span>
        {/* Said rather than left as a mystery: the file is here and intact,
            the browser simply will not draw it. */}
        {!file.content_type.startsWith('video/') ? (
          <span className="text-subtle-foreground text-[11px] text-pretty">
            Your browser cannot show this format
          </span>
        ) : null}
      </div>
    )
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="block">
      {/* Plain <img>: customer uploads of unknown dimensions behind an
          authenticated route, which next/image can neither size ahead of
          time nor fetch through its optimiser. */}
      <img
        src={href}
        alt="Damage photo from the customer"
        loading="lazy"
        className="border-border aspect-square w-full rounded-lg border object-cover"
      />
    </a>
  )
}

function megabytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
