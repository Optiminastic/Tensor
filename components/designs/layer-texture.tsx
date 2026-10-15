import type { JSX } from 'react'

/**
 * The fine horizontal ridges of printed layers, in the current text colour at
 * a whisper of opacity - the landing sky's texture, in neutral. Decorative.
 */
export function LayerTexture(): JSX.Element {
  return (
    <svg aria-hidden className="text-foreground pointer-events-none absolute inset-0 size-full">
      <defs>
        <pattern id="design-layers" width="8" height="5" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0.5" x2="8" y2="0.5" stroke="currentColor" strokeOpacity="0.06" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#design-layers)" />
    </svg>
  )
}
