import type { JSX } from 'react'

import type { DamageFile } from '@/lib/validators/whatsapp-damage'

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

  if (!file.content_type.startsWith('image/')) {
    return (
      <div className="bg-surface-muted flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-lg">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent text-xs underline-offset-4 hover:underline"
        >
          Open video
        </a>
        <span className="text-subtle-foreground font-mono text-[11px] tabular-nums">
          {megabytes(file.size_bytes)}
        </span>
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
