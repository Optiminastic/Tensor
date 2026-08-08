'use client'

import { useQuery } from '@tanstack/react-query'
import { Layers, Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useEffect, useState, type JSX } from 'react'

import { cn } from '@/lib/utils'

import { CutControls, useCut } from './cut-controls'
import { type GcodeFeature, type ParsedGcode, parseGcode } from './gcode-parser'
import { FEATURE_HEX } from './layer-viewer'

// The WebGL scene is client-only and heavy (three.js); load it lazily so it
// stays out of every other page's bundle, exactly like the mesh viewer.
const LayerViewer = dynamic(() => import('./layer-viewer').then(m => m.LayerViewer), {
  ssr: false,
  loading: () => (
    <div className="text-muted-foreground flex h-full w-full items-center justify-center text-sm">
      Loading layers…
    </div>
  ),
})

// The feature buckets shown in the legend, in reading order.
const LEGEND: { feature: GcodeFeature; label: string }[] = [
  { feature: 'outer-wall', label: 'Outer wall' },
  { feature: 'inner-wall', label: 'Inner wall' },
  { feature: 'skin', label: 'Top / bottom' },
  { feature: 'solid', label: 'Solid infill' },
  { feature: 'infill', label: 'Infill' },
  { feature: 'support', label: 'Support' },
]

async function loadPlate(designId: string): Promise<ParsedGcode> {
  const res = await fetch(`/api/designs/${designId}/plate`, { credentials: 'same-origin' })
  if (!res.ok) throw new Error('Could not load the sliced layers.')
  return parseGcode(await res.text())
}

interface LayerStageProps {
  designId: string
  // Changes when the design is re-sliced, so the layers refetch.
  refreshKey: string
  // Stretch the viewer to fill its container (detailed / full-screen view)
  // instead of the fixed inline height.
  fill?: boolean
}

/** The sliced-layers viewer itself: fetches the plate G-code, renders it layer by
 * layer, and owns the scrub slider, cut controls, feature legend and readout. Used
 * both by the inline "Sliced layers" card and the model preview's detailed view. */
export function LayerStage({ designId, refreshKey, fill = false }: LayerStageProps): JSX.Element {
  const { data, isPending, isError } = useQuery({
    queryKey: ['design-plate', designId, refreshKey],
    queryFn: () => loadPlate(designId),
    staleTime: 5 * 60 * 1000,
  })

  const layerCount = data?.layers.length ?? 0
  const { clip, controls } = useCut()
  const [visible, setVisible] = useState(1)
  useEffect(() => {
    if (layerCount > 0) setVisible(layerCount)
  }, [layerCount])

  const topZ = data && visible > 0 ? (data.layers[visible - 1]?.z ?? 0) : 0

  return (
    <div className={cn('flex flex-col gap-3', fill && 'h-full')}>
      {layerCount > 0 ? (
        <div className="flex justify-end">
          <span className="text-muted-foreground font-mono text-xs tabular-nums">
            Layer {visible} / {layerCount} · {topZ.toFixed(2)} mm
          </span>
        </div>
      ) : null}

      <div
        className={cn(
          'bg-surface-muted border-border relative w-full overflow-hidden rounded-md border',
          fill ? 'flex-1' : 'h-[380px]',
        )}
      >
        {isPending ? (
          <div className="text-muted-foreground flex h-full items-center justify-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Reading the sliced G-code…
          </div>
        ) : isError || !data ? (
          <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
            The sliced layers could not be loaded.
          </div>
        ) : layerCount === 0 ? (
          <div className="text-muted-foreground flex h-full items-center justify-center gap-2 text-sm">
            <Layers className="size-4" aria-hidden />
            No printable layers in this slice.
          </div>
        ) : (
          <LayerViewer parsed={data} visibleLayers={visible} clip={clip} />
        )}
      </div>

      {layerCount > 0 ? (
        <>
          <input
            type="range"
            min={1}
            max={layerCount}
            value={visible}
            onChange={event => setVisible(Number(event.target.value))}
            aria-label="Reveal layers"
            className="accent-accent w-full"
          />
          <CutControls {...controls} />
        </>
      ) : null}

      <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
        {LEGEND.map(item => (
          <li
            key={item.feature}
            className="text-muted-foreground flex items-center gap-1.5 text-xs"
          >
            <span
              className="size-2.5 rounded-sm"
              style={{ background: FEATURE_HEX[item.feature] }}
              aria-hidden
            />
            {item.label}
          </li>
        ))}
      </ul>

      <p className="text-subtle-foreground text-xs">
        Rendered from the slicer&apos;s G-code. Drag to orbit, scroll to zoom, scrub to reveal
        layers. Travel moves are hidden.
      </p>
    </div>
  )
}
