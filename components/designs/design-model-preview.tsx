'use client'

import { Maximize2, Minimize2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useRef, useState, type JSX, type ReactNode } from 'react'

import { optimizeDesign } from '@/app/dashboard/[brand]/designs/optimization-actions'
import {
  estimateDesignPersonalisation,
  saveDesignPersonalisationForBrand,
} from '@/app/dashboard/[brand]/designs/personalisation-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type {
  DesignOptimization,
  DesignPersonalisation,
  Orientation,
  PersonalisationEstimate,
} from '@/lib/validators/designs'

import { useCut } from './cut-controls'
import { LayerStage } from './design-layer-preview'
import { PreviewControls } from './design-preview-controls'
import type { OrientationMeasure, RotateAxis } from './model-viewer'
import type { TextTransform } from './personalisation-text'

type PreviewMode = 'model' | 'layers'

// How far the name is raised off the surface (mm). Fixed for now; the emboss reads
// clearly and stays cheap to print. A control can expose it later.
const PERSONALISE_DEPTH_MM = 1
// The default text colour before the customer picks one.
const DEFAULT_TEXT_COLOUR = '#1c1c1c'
// The default font family/style; the full lists live in design-preview-controls
// and mirror the backend's allowlist.
const DEFAULT_FONT = 'Liberation Sans'
const DEFAULT_FONT_STYLE = 'Regular'

// Default filament palette for the whole-model colour preview and the text colour
// swatches. An STL has no colour, so a swatch just re-tints the render.
const FILAMENT_COLORS: { name: string; hex: string }[] = [
  { name: 'White', hex: '#f2f2f0' },
  { name: 'Black', hex: '#1c1c1c' },
  { name: 'Gold', hex: '#c9a227' },
  { name: 'Silver', hex: '#b9bcc0' },
  { name: 'Red', hex: '#c0392b' },
  { name: 'Blue', hex: '#2b6cb0' },
  { name: 'Green', hex: '#2f855a' },
  { name: 'Terracotta', hex: '#bf5b3b' },
]

// The viewer is WebGL and must not server-render; loading it lazily also keeps
// three.js out of every other page's bundle.
const ModelViewer = dynamic(() => import('./model-viewer').then(m => m.ModelViewer), {
  ssr: false,
  loading: () => (
    <div className="text-muted-foreground flex h-full w-full items-center justify-center text-sm">
      Loading viewer…
    </div>
  ),
})

interface DesignModelPreviewProps {
  brand: string
  designId: string
  orientation: Orientation | null
  // design.updated_at - changes on re-slice so the layer view refetches.
  refreshKey: string
  // Whether a slice exists, i.e. the Layers mode has G-code to show.
  hasSlice: boolean
  // The saved personalisation, so the editor rehydrates. null = none applied.
  savedPersonalisation: DesignPersonalisation | null
  // Called after a personalisation is saved (and the re-slice queued) so the
  // detail page refetches and the Layers/cost catch up.
  onPersonalised: () => void
}

/**
 * The design's model on the build plate, as an interactive orientation tool:
 * rotate it in 90deg steps and watch the amber overhang faces and the live
 * support/contact readout change. Toggling "Recommended" jumps to the computed
 * least-support pose. In the detailed (full-screen) view a Model / Layers toggle
 * swaps the mesh for the sliced-layers preview.
 */
export function DesignModelPreview({
  brand,
  designId,
  orientation,
  refreshKey,
  hasSlice,
  savedPersonalisation,
  onPersonalised,
}: DesignModelPreviewProps): JSX.Element {
  const canRecommend = Boolean(orientation && !orientation.already_optimal)
  const [base, setBase] = useState<'uploaded' | 'recommended'>('uploaded')
  const [steps, setSteps] = useState<RotateAxis[]>([])
  const [measure, setMeasure] = useState<OrientationMeasure | null>(null)
  const { clip, controls } = useCut()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [mode, setMode] = useState<PreviewMode>('model')
  // Personalisation: the name is a separate 3D object on the model's top face,
  // rendered live in the viewer. Moving, rotating, recolouring and resizing all
  // happen in the browser (no round-trip); only the extruded-text mesh is fetched,
  // and only when the text or size changes. "Save & re-slice" bakes it into the
  // model server-side and re-slices, so cost and Layers include the name.
  const [nameText, setNameText] = useState(savedPersonalisation?.text ?? '')
  const [nameSize, setNameSize] = useState(savedPersonalisation?.size_mm ?? 10)
  const [transform, setTransform] = useState<TextTransform>({
    x: savedPersonalisation?.offset_x_mm ?? 0,
    y: savedPersonalisation?.offset_y_mm ?? 0,
    rotationDeg: savedPersonalisation?.rotation_deg ?? 0,
  })
  const [textColour, setTextColour] = useState(savedPersonalisation?.colour || DEFAULT_TEXT_COLOUR)
  const [fontFamily, setFontFamily] = useState(savedPersonalisation?.font || DEFAULT_FONT)
  const [fontStyle, setFontStyle] = useState(savedPersonalisation?.font_style || DEFAULT_FONT_STYLE)
  const [estimate, setEstimate] = useState<PersonalisationEstimate | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  // AI optimization advisor (Optimizations tab): the report plus its loading/error.
  const [optimization, setOptimization] = useState<DesignOptimization | null>(null)
  const [optimizeLoading, setOptimizeLoading] = useState(false)
  const [optimizeError, setOptimizeError] = useState<string | null>(null)
  // A filament colour to preview the whole model in (null = analysis shading).
  const [tint, setTint] = useState<string | null>(null)

  // The model URL is always the plain lite base model; the name rides on top as a
  // separate object, so moving it never re-downloads the model.
  const modelUrl = `/api/designs/${designId}/model-lite`

  // The extruded-text STL for the name layer; null when there is no name. Depends
  // only on the text and size, so nudging/rotating/recolouring never refetches.
  const textUrl = useMemo(() => {
    const name = nameText.trim()
    if (name === '') return null
    const q = new URLSearchParams({
      text: name,
      size_mm: String(nameSize),
      depth_mm: String(PERSONALISE_DEPTH_MM),
      font: fontFamily,
      font_style: fontStyle,
    })
    return `/api/designs/${designId}/personalise-text?${q.toString()}`
  }, [designId, nameText, nameSize, fontFamily, fontStyle])

  // A live pre-slice estimate of the name's added grams/time/cost, debounced so it
  // does not fire on every keystroke.
  useEffect(() => {
    const name = nameText.trim()
    if (name === '') {
      setEstimate(null)
      return
    }
    const handle = setTimeout(() => {
      void estimateDesignPersonalisation(designId, { text: name, height_mm: nameSize }).then(res =>
        setEstimate(res.ok && res.data ? res.data : null),
      )
    }, 500)
    return () => clearTimeout(handle)
  }, [designId, nameText, nameSize])

  const savePersonalisation = useCallback(async () => {
    setSaving(true)
    setSaveError(null)
    const res = await saveDesignPersonalisationForBrand(brand, designId, {
      text: nameText.trim(),
      font: fontFamily,
      font_style: fontStyle,
      size_mm: nameSize,
      depth_mm: PERSONALISE_DEPTH_MM,
      offset_x_mm: transform.x,
      offset_y_mm: transform.y,
      rotation_deg: transform.rotationDeg,
      colour: textColour,
    })
    setSaving(false)
    if (!res.ok) {
      setSaveError(res.error ?? 'Could not save the personalisation.')
      return
    }
    onPersonalised()
  }, [
    brand,
    designId,
    nameText,
    nameSize,
    fontFamily,
    fontStyle,
    transform,
    textColour,
    onPersonalised,
  ])

  // The live name layer handed to the viewer (editable only in the detailed view,
  // where the gizmo and tools live).
  const personalisation = useMemo(
    () => ({ textUrl, colour: textColour, transform }),
    [textUrl, textColour, transform],
  )
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
  const nudgeName = useCallback((dx: number, dy: number) => {
    setTransform(t => ({ ...t, x: t.x + dx, y: t.y + dy }))
  }, [])
  const centerName = useCallback(() => {
    setTransform(t => ({ ...t, x: 0, y: 0 }))
  }, [])
  const setRotation = useCallback((deg: number) => {
    setTransform(t => ({ ...t, rotationDeg: deg }))
  }, [])
  const runOptimize = useCallback(() => {
    setOptimizeLoading(true)
    setOptimizeError(null)
    void optimizeDesign(designId).then(res => {
      setOptimizeLoading(false)
      if (res.ok && res.data) {
        setOptimization(res.data)
      } else {
        setOptimizeError(res.error ?? 'Could not run the optimization.')
      }
    })
  }, [designId])

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

  const viewerEl = (
    <ModelViewer
      modelUrl={modelUrl}
      orientation={orientation}
      base={base}
      steps={steps}
      onMeasure={handleMeasure}
      clip={clip}
      tint={tint}
      personalisation={personalisation}
    />
  )

  // Colour swatches overlaid on the viewer: re-tint the whole model, or reset to
  // the analysis shading. STL has no colour, so this is a preview only.
  const swatchStrip = (
    <div className="absolute inset-x-0 bottom-3 flex justify-center px-3">
      <div className="border-border bg-surface flex items-center gap-1.5 rounded-full border px-2 py-1.5 shadow-sm">
        <button
          type="button"
          onClick={() => setTint(null)}
          className={cn(
            'rounded-full px-2 py-0.5 text-xs font-medium transition-colors',
            tint === null
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          Original
        </button>
        {FILAMENT_COLORS.map(colour => (
          <button
            key={colour.hex}
            type="button"
            onClick={() => setTint(colour.hex)}
            title={colour.name}
            aria-label={colour.name}
            style={{ backgroundColor: colour.hex }}
            className={cn(
              'size-5 rounded-full border transition-transform hover:scale-110',
              tint === colour.hex ? 'ring-accent ring-2' : 'border-border',
            )}
          />
        ))}
      </div>
    </div>
  )

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
          ) : isFullscreen ? (
            // Detailed view: the viewer fills the space, with all the tools in a
            // right sidebar (orientation + personalization).
            <div className="flex min-h-0 flex-1 gap-4">
              <div className="bg-surface-muted border-border relative flex-1 overflow-hidden rounded-md border">
                {viewerEl}
                {swatchStrip}
              </div>
              <aside className="w-80 shrink-0 overflow-y-auto pr-1">
                <PreviewControls
                  onRotate={rotate}
                  onReset={reset}
                  cut={controls}
                  measure={measure}
                  nameText={nameText}
                  onNameChange={setNameText}
                  fontFamily={fontFamily}
                  onFontFamilyChange={setFontFamily}
                  fontStyle={fontStyle}
                  onFontStyleChange={setFontStyle}
                  nameSize={nameSize}
                  onSizeChange={setNameSize}
                  rotationDeg={transform.rotationDeg}
                  onRotationChange={setRotation}
                  onNudge={nudgeName}
                  onCenter={centerName}
                  textColour={textColour}
                  onTextColourChange={setTextColour}
                  colours={FILAMENT_COLORS}
                  onSave={savePersonalisation}
                  saving={saving}
                  saveError={saveError}
                  estimate={estimate}
                  onOptimize={runOptimize}
                  optimization={optimization}
                  optimizeLoading={optimizeLoading}
                  optimizeError={optimizeError}
                />
              </aside>
            </div>
          ) : (
            // Inline: just the model. Open the detailed view for the tools.
            <div className="bg-surface-muted border-border relative h-[380px] w-full overflow-hidden rounded-md border">
              {viewerEl}
              {swatchStrip}
            </div>
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
