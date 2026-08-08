'use client'

import { useState, type Dispatch, type JSX, type SetStateAction } from 'react'

import { cn } from '@/lib/utils'

import type { ClipAxis, ClipState } from './clip-plane'

export interface CutControlsState {
  on: boolean
  setOn: Dispatch<SetStateAction<boolean>>
  axis: ClipAxis
  setAxis: Dispatch<SetStateAction<ClipAxis>>
  value: number
  setValue: Dispatch<SetStateAction<number>>
  flip: boolean
  setFlip: Dispatch<SetStateAction<boolean>>
}

// useCut owns the section-plane state and derives the ClipState the viewers take
// (null when the cut is off). Shared by the mesh and layer previews.
export function useCut(): { clip: ClipState | null; controls: CutControlsState } {
  const [on, setOn] = useState(false)
  const [axis, setAxis] = useState<ClipAxis>('x')
  const [value, setValue] = useState(0.5)
  const [flip, setFlip] = useState(false)
  const clip = on ? { axis, value, flip } : null
  return { clip, controls: { on, setOn, axis, setAxis, value, setValue, flip, setFlip } }
}

const AXES: ClipAxis[] = ['x', 'y', 'z']

/** The section/cut controls: enable, pick an axis, slide the plane, flip which
 * half is kept. Renders inline beside a viewer's other controls. */
export function CutControls({
  on,
  setOn,
  axis,
  setAxis,
  value,
  setValue,
  flip,
  setFlip,
}: CutControlsState): JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => setOn(v => !v)}
        aria-pressed={on}
        className={cn(
          'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
          on
            ? 'border-accent bg-accent text-accent-foreground'
            : 'border-border text-foreground hover:bg-surface-muted',
        )}
      >
        Cut
      </button>
      {on ? (
        <>
          <div className="border-border flex rounded-md border p-0.5">
            {AXES.map(a => (
              <button
                key={a}
                type="button"
                onClick={() => setAxis(a)}
                aria-pressed={axis === a}
                className={cn(
                  'rounded px-2 py-0.5 text-xs font-medium uppercase transition-colors',
                  axis === a
                    ? 'bg-surface-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {a}
              </button>
            ))}
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(value * 100)}
            onChange={event => setValue(Number(event.target.value) / 100)}
            aria-label="Cut position"
            className="accent-accent h-1 w-28"
          />
          <button
            type="button"
            onClick={() => setFlip(v => !v)}
            className="border-border text-foreground hover:bg-surface-muted rounded-md border px-2.5 py-1 text-xs font-medium transition-colors"
          >
            Flip
          </button>
        </>
      ) : null}
    </div>
  )
}
