'use client'

import { Bounds, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useEffect, useMemo, useState, type JSX } from 'react'
import type * as THREE from 'three'

import { FILAMENT_COLOR_ATTR, parseModelWithColours } from '@/components/designs/model-parse'
import {
  BED_DEPTH_MM,
  BED_WIDTH_MM,
  fitScaleFor,
  PrintBedPlate,
} from '@/components/production/print-bed-plate'

interface BatchPlateViewerProps {
  modelUrl: string
}

/**
 * Interactive 3D preview of a batch's merged plate - drag to orbit, scroll to
 * zoom. Deliberately simpler than components/designs/model-viewer.tsx: a merged
 * plate has no single orientation to score/reorient, just geometry to inspect
 * before approving.
 *
 * The plate is a 3MF whenever every model on the bed carries colour, so this
 * cannot use STLLoader directly - it threw outright on a ZIP, and the card said
 * "Plate preview unavailable" for exactly the beds worth looking at. The shared
 * parser sniffs the format and bakes each part's colour, which is what makes a
 * bed of blue planks actually look blue.
 */
export function BatchPlateViewer({ modelUrl }: BatchPlateViewerProps): JSX.Element {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null)
  const [coloured, setColoured] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setGeometry(null)
    setFailed(false)
    void fetch(modelUrl, { credentials: 'same-origin' })
      .then(async res => {
        if (!res.ok) throw new Error(`status ${res.status}`)
        return res.arrayBuffer()
      })
      .then(buf => {
        const { geometry: geo, colours } = parseModelWithColours(buf)
        // NOT centred, unlike the job viewer: bedpack.Pack places every part
        // measured from a bed corner, so re-centring would slide the whole
        // plate off the bed graphic it is being checked against.
        geo.computeVertexNormals()
        if (cancelled) {
          geo.dispose()
          return
        }
        // The parser bakes colour into its own attribute rather than "color",
        // which the overhang analysis uses. Renaming it here is what lets a
        // plain <meshStandardMaterial vertexColors> read it.
        const baked = geo.getAttribute(FILAMENT_COLOR_ATTR)
        if (colours.length > 0 && baked) {
          geo.setAttribute('color', baked)
        }
        setColoured(colours.length > 0 && Boolean(baked))
        setGeometry(geo)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [modelUrl])

  const fitScale = useMemo(() => (geometry ? fitScaleFor(geometry) : 1), [geometry])

  if (failed) {
    return <ViewerMessage text="Plate preview unavailable for this batch." />
  }
  if (!geometry) {
    return <ViewerMessage text="Loading plate preview…" />
  }

  return (
    <Canvas
      camera={{ up: [0, 0, 1], position: [220, -220, 180], fov: 45, near: 0.1, far: 8000 }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#f4f3ef']} />
      <ambientLight intensity={0.75} />
      <directionalLight position={[150, -100, 200]} intensity={1.1} />
      <directionalLight position={[-120, 120, 100]} intensity={0.4} />
      {/* The plate is inside Bounds too, not just the model - so the camera
          always frames the whole plate with the merged parts seated on it,
          instead of auto-zooming to the plate contents alone and leaving the
          fixed-size plate looking mis-scaled or clipped relative to it. */}
      <Bounds fit observe margin={1.2}>
        <mesh geometry={geometry} scale={fitScale}>
          {/* Grey only when the plate carries no colours of its own - a bed
              merged from uploaded STLs, or one whose colours would not
              resolve. */}
          <meshStandardMaterial
            color={coloured ? '#ffffff' : '#9aa4b2'}
            vertexColors={coloured}
            flatShading
            roughness={0.72}
            metalness={0}
          />
        </mesh>
        {/* bedpack.Pack places every part with (0,0) at one bed corner,
            extending to (BED_WIDTH_MM, BED_DEPTH_MM) - but PrintBedPlate's
            own geometry is centred on the origin. Shift it by half the bed
            size so its corner lands at world (0,0) too, matching where the
            merged parts actually are instead of leaving them floating over
            one quadrant of a mis-aligned plate. */}
        <group position={[BED_WIDTH_MM / 2, BED_DEPTH_MM / 2, 0]}>
          <PrintBedPlate />
        </group>
      </Bounds>
      <OrbitControls makeDefault enableDamping target={[0, 0, 10]} />
    </Canvas>
  )
}

function ViewerMessage({ text }: { text: string }): JSX.Element {
  return (
    <div className="text-muted-foreground flex h-full w-full items-center justify-center text-sm">
      {text}
    </div>
  )
}
