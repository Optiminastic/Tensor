import type { JSX } from 'react'

import type { DamagePhoto } from '@/lib/validators/whatsapp-damage'

interface DamagePhotoGridProps {
  brand: string
  photos: DamagePhoto[]
  /** How many the customer sent, which is not always how many we hold. */
  sent: number
}

/**
 * The customer's photographs of the damage.
 *
 * Each one says where its download got to rather than silently disappearing:
 * a report whose evidence never arrived is still a report somebody has to deal
 * with, and the missing photograph is the thing they need to know about.
 */
export function DamagePhotoGrid({ brand, photos, sent }: DamagePhotoGridProps): JSX.Element {
  if (photos.length === 0) {
    return (
      <p className="text-muted-foreground text-sm text-pretty">
        {sent > 0
          ? `The customer sent ${sent} attachment(s), but none of them is linked to this report.`
          : 'No photographs were sent with this report.'}
      </p>
    )
  }

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-subtle-foreground text-[11px] font-medium tracking-wide uppercase">
        What the customer sent
      </h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map(photo => (
          <Photo key={photo.message_id} brand={brand} photo={photo} />
        ))}
      </div>
    </section>
  )
}

function Photo({ brand, photo }: { brand: string; photo: DamagePhoto }): JSX.Element {
  const href = `/api/whatsapp/${encodeURIComponent(brand)}/media/${encodeURIComponent(photo.message_id)}`

  if (photo.media_status === 'pending') {
    return (
      <Frame>
        <span className="text-muted-foreground animate-pulse text-xs">Downloading…</span>
      </Frame>
    )
  }
  if (photo.media_status !== 'stored') {
    return (
      <Frame dashed>
        <span className="text-muted-foreground px-2 text-center text-xs text-pretty">
          Unavailable
        </span>
      </Frame>
    )
  }

  if (!photo.mime_type.startsWith('image/')) {
    return (
      <Frame>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent text-xs underline-offset-4 hover:underline"
        >
          Open {photo.kind}
        </a>
      </Frame>
    )
  }

  return (
    <figure className="flex flex-col gap-1">
      <a href={href} target="_blank" rel="noopener noreferrer" className="block">
        {/* Plain <img>: customer uploads of unknown dimensions behind an
            authenticated route, which next/image can neither size ahead of
            time nor fetch through its optimiser. */}
        <img
          src={href}
          alt={photo.caption || 'Damage photo from the customer'}
          loading="lazy"
          className="border-border aspect-square w-full rounded-lg border object-cover"
        />
      </a>
      {photo.caption ? (
        <figcaption className="text-muted-foreground text-xs text-pretty">
          {photo.caption}
        </figcaption>
      ) : null}
    </figure>
  )
}

function Frame({
  children,
  dashed = false,
}: {
  children: JSX.Element
  dashed?: boolean
}): JSX.Element {
  return (
    <div
      className={
        dashed
          ? 'border-border flex aspect-square w-full items-center justify-center rounded-lg border border-dashed'
          : 'bg-surface-muted flex aspect-square w-full items-center justify-center rounded-lg'
      }
    >
      {children}
    </div>
  )
}
