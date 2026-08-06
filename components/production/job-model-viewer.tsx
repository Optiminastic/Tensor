'use client'

import { Bounds, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useEffect, useMemo, useState, type JSX } from 'react'
import type * as THREE from 'three'

import { parseModel } from '@/components/designs/model-viewer'
import { fitScaleFor, PrintBedPlate } from '@/components/production/print-bed-plate'

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
        const geo = parseModel(buf)
        geo.computeVertexNormals()
        if (cancelled) {
          geo.dispose()
          return
        }
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
          <meshStandardMaterial color="#9aa4b2" flatShading roughness={0.72} metalness={0} />
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
