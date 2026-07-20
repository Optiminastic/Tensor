import Image from 'next/image'
import type { JSX } from 'react'

interface AuthPlateProps {
  src: string
  /** Intrinsic size, so next/image reserves the space and nothing shifts on load. */
  width: number
  height: number
  className?: string
}

/**
 * A decorative artwork flanking the auth form.
 *
 * Both plates are greyscale artwork printed on white paper, and `multiply` is
 * what dissolves that paper: multiplying by white is a no-op, so the paper
 * takes the colour of whatever sits behind it and only the ink survives.
 *
 * `--plate-paper` supplies that ground. In light it is transparent, because the
 * ivory page already is the paper. In dark the page is a charcoal wall, so the
 * plate brings its own paper and reads as a mounted print.
 *
 * Inverting in dark would be the obvious trick and is wrong here: it flatters
 * line art but turns a photograph into a negative, and these two plates are one
 * of each.
 *
 * `alt=""` and `aria-hidden` are deliberate. This is decoration; announcing it
 * would only put noise between a screen-reader user and the form.
 */
export function AuthPlate({ src, width, height, className }: AuthPlateProps): JSX.Element {
  return (
    <div
      className={`bg-plate-paper pointer-events-none flex items-center justify-center rounded-lg select-none dark:p-6 ${className ?? ''}`}
      aria-hidden="true"
    >
      <Image
        src={src}
        alt=""
        width={width}
        height={height}
        priority={false}
        sizes="(min-width: 1024px) 24rem, 0px"
        className="h-full w-full object-contain mix-blend-multiply"
      />
    </div>
  )
}
