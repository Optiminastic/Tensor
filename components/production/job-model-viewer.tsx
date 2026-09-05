'use client'

import { Bounds, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useEffect, useMemo, useState, type JSX } from 'react'
import type * as THREE from 'three'

import { FILAMENT_COLOR_ATTR, parseModelWithColours } from '@/components/designs/model-parse'
import { centerOnPlate, fitScaleFor, PrintBedPlate } from '@/components/production/print-bed-plate'

interface JobModelViewerProps {
  modelUrl: string
}

/**
 * Interactive 3D preview of a single production job's print file (STL or
 * 3MF) - drag to orbit, scroll to zoom. Plain geometry only, no
 * orientation/overhang scoring (see components/designs/model-viewer.tsx for
 * that); this is just "what does this product look like," matching
 * components/production/batch-plate-viewer.tsx's simpler treatment.
 */
export function JobModelViewer({ modelUrl }: JobModelViewerProps): JSX.Element {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null)
  // A Dual Name Plank is two objects in one 3MF - a white plate and lettering
  // in the customer's colour. Showing it in flat grey would hide the one
  // choice the customer made that cannot be corrected after printing.
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
        centerOnPlate(geo)
        geo.computeVertexNormals()
        if (cancelled) {
          geo.dispose()
          return
        }
        // The parser bakes each part's colour into its own attribute rather
        // than "color", which the overhang analysis uses. Renaming it here is
        // what lets a plain <meshStandardMaterial vertexColors> read it.
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
    return <ViewerMessage text="Model preview unavailable for this job." />
  }
  if (!geometry) {
    return <ViewerMessage text="Loading model preview…" />
  }

  return (
    <Canvas
      camera={{ up: [0, 0, 1], position: [90, -90, 70], fov: 45, near: 0.1, far: 8000 }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#f4f3ef']} />
      <ambientLight intensity={0.75} />
      <directionalLight position={[60, -40, 90]} intensity={1.1} />
      <directionalLight position={[-50, 50, 40]} intensity={0.4} />
      {/* The plate is inside Bounds too, not just the model - so the camera
          always frames the whole plate with the product seated on it,
          instead of auto-zooming to the product alone and leaving the fixed-
          size plate looking mis-scaled or clipped relative to it. */}
      <Bounds fit observe margin={1.2}>
        <mesh geometry={geometry} scale={fitScale}>
          {/* Grey only when the model carries no colours of its own - an
              uploaded STL, or a plank whose colour could not be resolved. */}
          <meshStandardMaterial
            color={coloured ? '#ffffff' : '#9aa4b2'}
            vertexColors={coloured}
            flatShading
            roughness={0.72}
            metalness={0}
          />
        </mesh>
        <PrintBedPlate />
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
