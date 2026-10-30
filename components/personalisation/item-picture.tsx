'use client'

import { RotateCw } from 'lucide-react'
import { type JSX, useState } from 'react'

import { cn } from '@/lib/utils'

/** Front first, then round each side - the order the button steps through. */
const VIEWS = ['front', 'left', 'right'] as const
type View = (typeof VIEWS)[number]

const ALT: Record<View, string> = {
  front: 'as it will be made',
  left: 'from the left',
  right: 'from the right',
}

interface ItemPictureProps {
  token: string
  jobId: string
  jobNumber: string
  productName: string
  /** Changes whenever the model is rebuilt, which is what busts the cache. */
  modelVersion: string
}

/**
 * What the customer is getting, as a picture.
 *
 * DRAWN BY THE SERVER, not in the browser. The 3D viewer that used to sit
 * here needs three.js - about 700KB before @react-three/fiber and drei, five
 * times the weight of the model it was drawing - and on a phone it routinely
 * never finished loading at all: the card sat on "Loading preview…". The
 * picture is 12KB and arrives with the rest of the page.
 *
 * THE FRONT FIRST, then each side. Somebody opening this page is asking "is
 * this the thing I bought", and the answer to that is the front of it; the
 * three-quarters answer the second question, which is whether the lettering
 * is right. A Dual Name Plank carries one name read from each END, so those
 * two views are not a nicety there - they are the difference between checking
 * your order and checking half of it.
 *
 * All three are fetched eagerly: they are 12KB each, and a view hidden behind
 * a network round trip is the one nobody waits for.
 */
export function ItemPicture({
  token,
  jobId,
  jobNumber,
  productName,
  modelVersion,
}: ItemPictureProps): JSX.Element {
  const [view, setView] = useState<View>('front')
  const [failed, setFailed] = useState(false)

  const src = (side: View): string =>
    `/api/p/${encodeURIComponent(token)}/items/${encodeURIComponent(jobId)}/picture` +
    `?view=${side}&v=${encodeURIComponent(modelVersion)}`

  if (failed) {
    return (
      <div className="text-muted-foreground flex h-full w-full items-center justify-center px-6 text-center text-sm">
        We could not draw a picture of this one. The names below are what will be made.
      </div>
    )
  }

  return (
    <>
      {/* Both sides are in the DOM and one is hidden, so turning it over is
          instant rather than a second load with a flash of nothing. */}
      {VIEWS.map(side => (
        <img
          key={side}
          src={src(side)}
          alt={`${productName}, ${ALT[side]}`}
          onError={() => setFailed(true)}
          className={cn(
            'absolute inset-0 h-full w-full object-contain',
            side === view ? 'opacity-100' : 'opacity-0',
          )}
          // The first picture is the point of the page; the others are one
          // tap away, so none of them waits for the browser to decide.
          loading="eager"
          draggable={false}
        />
      ))}

      <button
        type="button"
        onClick={() => setView(v => VIEWS[(VIEWS.indexOf(v) + 1) % VIEWS.length])}
        className="bg-surface/90 text-muted-foreground hover:text-foreground absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs backdrop-blur"
      >
        <RotateCw className="size-3.5" aria-hidden />
        Other side
      </button>

      <a
        href={src(view)}
        download={`${jobNumber}-${view}.png`}
        className="bg-surface/90 text-muted-foreground hover:text-foreground absolute right-3 bottom-3 rounded-full px-3 py-1.5 text-xs backdrop-blur"
      >
        Save picture
      </a>
    </>
  )
}
