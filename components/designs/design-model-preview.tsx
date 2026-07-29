'use client'

import dynamic from 'next/dynamic'
import { useCallback, useState, type JSX, type ReactNode } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Orientation } from '@/lib/validators/designs'

import type { OrientationMeasure, RotateAxis } from './model-viewer'

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
}

/**
 * The design's model on the build plate, as an interactive orientation tool:
 * rotate it in 90deg steps and watch the amber overhang faces and the live
 * support/contact readout change. Toggling "Recommended" jumps to the computed
 * least-support pose.
 */
export function DesignModelPreview({
  designId,
  orientation,
}: DesignModelPreviewProps): JSX.Element {
  const canRecommend = Boolean(orientation && !orientation.already_optimal)
  const [base, setBase] = useState<'uploaded' | 'recommended'>('uploaded')
  const [steps, setSteps] = useState<RotateAxis[]>([])
  const [measure, setMeasure] = useState<OrientationMeasure | null>(null)

  const rotate = useCallback((axis: RotateAxis) => setSteps(prev => [...prev, axis]), [])
  const setBaseReset = useCallback((next: 'uploaded' | 'recommended') => {
    setBase(next)
    setSteps([])
  }, [])
  const reset = useCallback(() => setBaseReset('uploaded'), [setBaseReset])
  const handleMeasure = useCallback((m: OrientationMeasure) => setMeasure(m), [])

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle>3D preview</CardTitle>
        {canRecommend ? (
          <div className="border-border flex rounded-md border p-0.5">
            <ToggleButton active={base === 'uploaded'} onClick={() => setBaseReset('uploaded')}>
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
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="bg-surface-muted border-border relative h-[380px] w-full overflow-hidden rounded-md border">
          <ModelViewer
            modelUrl={`/api/designs/${designId}/model`}
            orientation={orientation}
            base={base}
            steps={steps}
            onMeasure={handleMeasure}
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
