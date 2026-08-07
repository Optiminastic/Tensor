'use client'

import { TransformControls } from '@react-three/drei'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, type JSX } from 'react'
import * as THREE from 'three'

import { parseModel } from './model-viewer'

// How the name sits on the model: an in-plane XY nudge from the model centre and
// an in-plane rotation. Shared with the editor so the gizmo and the sliders drive
// exactly the same values.
export interface TextTransform {
  x: number
  y: number
  rotationDeg: number
}

export type GizmoMode = 'move' | 'rotate'

interface PersonalisationTextProps {
  // /api/designs/:id/personalise-text?... - the extruded name as its own STL.
  url: string
  colour: string
  // The model's top-face Z (in the centred viewer frame): the name rests here.
  topZ: number
  transform: TextTransform
  editable: boolean
  gizmo: GizmoMode
  onTransform: (next: TextTransform) => void
}

/**
 * The customer's name as a real, separate 3D object sitting on the model's top
 * face. It loads the extruded-text STL once per (text, size), then is moved,
 * rotated and coloured live - no server round-trip. In edit mode a drag gizmo
 * (translate on the surface plane, or spin about the vertical) writes the same
 * transform the sliders do, so the two stay in lock-step.
 */
export function PersonalisationText({
  url,
  colour,
  topZ,
  transform,
  editable,
  gizmo,
  onTransform,
}: PersonalisationTextProps): JSX.Element | null {
  const meshRef = useRef<THREE.Mesh>(null)
  const { data: geometry } = useQuery({
    queryKey: ['personalise-text-geometry', url],
    queryFn: async () => {
      const res = await fetch(url, { credentials: 'same-origin' })
      if (!res.ok) throw new Error(`status ${res.status}`)
      return parseModel(await res.arrayBuffer())
    },
    staleTime: Infinity,
    gcTime: 10 * 60_000,
    retry: 1,
  })

  const rendered = useMemo(() => geometry?.clone() ?? null, [geometry])
  useEffect(() => () => rendered?.dispose(), [rendered])

  if (!rendered) return null

  const rotation: [number, number, number] = [0, 0, (transform.rotationDeg * Math.PI) / 180]
  const position: [number, number, number] = [transform.x, transform.y, topZ]

  const mesh = (
    <mesh ref={meshRef} geometry={rendered} position={position} rotation={rotation}>
      <meshStandardMaterial color={colour} roughness={0.55} metalness={0} flatShading />
    </mesh>
  )

  if (!editable) return mesh

  function syncFromGizmo(): void {
    const o = meshRef.current
    if (!o) return
    onTransform({
      x: o.position.x,
      y: o.position.y,
      rotationDeg: THREE.MathUtils.radToDeg(o.rotation.z),
    })
  }

  return (
    <TransformControls
      mode={gizmo === 'move' ? 'translate' : 'rotate'}
      showX={gizmo === 'move'}
      showY={gizmo === 'move'}
      showZ={gizmo === 'rotate'}
      onObjectChange={syncFromGizmo}
    >
      {mesh}
    </TransformControls>
  )
}
