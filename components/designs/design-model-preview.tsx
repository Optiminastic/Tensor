'use client'

import { Maximize2, Minimize2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState, type JSX, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Orientation } from '@/lib/validators/designs'

import { CutControls, useCut } from './cut-controls'
import { LayerStage } from './design-layer-preview'
import type { OrientationMeasure, RotateAxis } from './model-viewer'

type PreviewMode = 'model' | 'layers'

// The viewer is WebGL and must not server-render; loading it lazily also keeps
// three.js out of every other page's bundle.
const ModelViewer = dynamic(() => import('./model-viewer').then(m => m.ModelViewer), {
  ssr: false,
  loading: () => (
    <div className="text-muted-foreground flex h-full w-full items-center justify-center text-sm">
      Loading 3D preview…
    </div>
  ),
})

interface DesignModelPreviewProps {
  designId: string
  orientation: Orientation | null
  // design.updated_at - changes on re-slice so the layer view refetches.
  refreshKey: string
  // Whether a slice exists, i.e. the Layers mode has G-code to show.
  hasSlice: boolean
}

/**
 * The design's model on the build plate, as an interactive orientation tool:
 * rotate it in 90deg steps and watch the amber overhang faces and the live
 * support/contact readout change. Toggling "Recommended" jumps to the computed
 * least-support pose. In the detailed (full-screen) view a Model / Layers toggle
 * swaps the mesh for the sliced-layers preview.
 */
export function DesignModelPreview({
  designId,
  orientation,
  refreshKey,
  hasSlice,
}: DesignModelPreviewProps): JSX.Element {
  const canRecommend = Boolean(orientation && !orientation.already_optimal)
  const [base, setBase] = useState<'uploaded' | 'recommended'>('uploaded')
  const [steps, setSteps] = useState<RotateAxis[]>([])
  const [measure, setMeasure] = useState<OrientationMeasure | null>(null)
  const { clip, controls } = useCut()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [mode, setMode] = useState<PreviewMode>('model')
  // Layers mode is offered whenever a slice exists, inline and in the detailed view.
  const showLayers = hasSlice && mode === 'layers'
  // The element promoted to full screen: the whole stage (controls + viewer), so
  // the orientation tools stay usable in the detailed view.
  const stageRef = useRef<HTMLDivElement>(null)

  const rotate = useCallback((axis: RotateAxis) => setSteps(prev => [...prev, axis]), [])
  const setBaseReset = useCallback((next: 'uploaded' | 'recommended') => {
    setBase(next)
    setSteps([])
  }, [])
  const reset = useCallback(() => setBaseReset('uploaded'), [setBaseReset])
  const handleMeasure = useCallback((m: OrientationMeasure) => setMeasure(m), [])

  useEffect(() => {
    function onChange(): void {
      setIsFullscreen(document.fullscreenElement === stageRef.current)
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleFullscreen = useCallback((): void => {
    if (document.fullscreenElement) {
      void document.exitFullscreen()
      return
    }
    void stageRef.current?.requestFullscreen().catch(() => undefined)
  }, [])

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle>3D preview</CardTitle>
        <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
          <Maximize2 aria-hidden />
          Detailed view
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div
          ref={stageRef}
          className={cn(
            'flex flex-col gap-3',
            isFullscreen ? 'bg-background h-screen w-screen p-4' : 'px-5 py-4',
          )}
        >
          {hasSlice || canRecommend || isFullscreen ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {hasSlice ? (
                  <div className="border-border flex rounded-md border p-0.5">
                    <ToggleButton active={mode === 'model'} onClick={() => setMode('model')}>
                      Model
                    </ToggleButton>
                    <ToggleButton active={mode === 'layers'} onClick={() => setMode('layers')}>
                      Layers
                    </ToggleButton>
                  </div>
                ) : null}
                {canRecommend && !showLayers ? (
                  <div className="border-border flex rounded-md border p-0.5">
                    <ToggleButton
                      active={base === 'uploaded'}
                      onClick={() => setBaseReset('uploaded')}
                    >
                      As uploaded
                    </ToggleButton>
                    <ToggleButton
                      active={base === 'recommended'}
                      onClick={() => setBaseReset('recommended')}
                    >
                      Recommended
                    </ToggleButton>
                  </div>
                ) : null}
              </div>
              {isFullscreen ? (
                <Button variant="secondary" size="sm" onClick={toggleFullscreen}>
                  <Minimize2 aria-hidden />
                  Exit full screen
                </Button>
              ) : null}
            </div>
          ) : null}

          {showLayers ? (
            <LayerStage designId={designId} refreshKey={refreshKey} fill={isFullscreen} />
          ) : (
            <>
              <div
                className={cn(
                  'bg-surface-muted border-border relative w-full overflow-hidden rounded-md border',
                  isFullscreen ? 'flex-1' : 'h-[380px]',
                )}
              >
                <ModelViewer
                  modelUrl={`/api/designs/${designId}/model`}
                  orientation={orientation}
                  base={base}
                  steps={steps}
                  onMeasure={handleMeasure}
                  clip={clip}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">Rotate 90°:</span>
                  <RotateButton onClick={() => rotate('x')}>X</RotateButton>
                  <RotateButton onClick={() => rotate('y')}>Y</RotateButton>
                  <RotateButton onClick={() => rotate('z')}>Z</RotateButton>
                  <RotateButton onClick={reset}>Reset</RotateButton>
                </div>
                <CutControls {...controls} />
                {measure ? (
                  <div className="flex items-center gap-4 font-mono text-xs tabular-nums">
                    <span className="text-foreground flex items-center gap-1.5">
                      <span className="bg-warning inline-block size-2.5 rounded-sm" aria-hidden />
                      Overhang {Math.round(measure.overhang)} mm²
                    </span>
                    <span className="text-muted-foreground">
                      Bed contact {Math.round(measure.contact)} mm²
                    </span>
                  </div>
                ) : null}
              </div>

              <p className="text-subtle-foreground text-xs">
                Amber faces need support in the shown orientation. Rotate to explore; drag to orbit,
                scroll to zoom.
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface ToggleButtonProps {
  active: boolean
  onClick: () => void
  children: ReactNode
}

function ToggleButton({ active, onClick, children }: ToggleButtonProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded px-3 py-1 text-xs font-medium transition-colors',
        active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

interface RotateButtonProps {
  onClick: () => void
  children: ReactNode
}

function RotateButton({ onClick, children }: RotateButtonProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border-border text-foreground hover:bg-surface-muted rounded-md border px-2.5 py-1 text-xs font-medium transition-colors"
    >
      {children}
    </button>
  )
}
