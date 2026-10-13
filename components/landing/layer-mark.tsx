import type { JSX } from 'react'

/** Five lime "layers" under the proof line, where the inspiration had stars. */
export function LayerMark(): JSX.Element {
  return (
    <span aria-hidden className="flex gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className="bg-landing-lime h-1.5 w-3 rounded-full" />
      ))}
    </span>
  )
}
