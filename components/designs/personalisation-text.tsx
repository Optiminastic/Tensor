'use client'

import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, type JSX } from 'react'
import * as THREE from 'three'

import { parseModel } from './model-viewer'

// How the name sits on the model: an in-plane XY nudge from the model centre and
// an in-plane rotation. Driven by the editor's sliders / move pad.
export interface TextTransform {
  x: number
  y: number
  rotationDeg: number
}

interface PersonalisationTextProps {
  // /api/designs/:id/personalise-text?... - the extruded name as its own STL.
  url: string
  colour: string
  // The model's top-face Z (in the centred viewer frame): the name rests here.
  topZ: number
  transform: TextTransform
}

/**
 * The customer's name as a real, separate 3D object sitting on the model's top
 * face. It loads the extruded-text STL once per (text, size), then is moved,
 * rotated and recoloured live from the editor controls - no server round-trip. It
 * is a plain mesh (no in-scene gizmo) so the viewer's auto-framing still fits the
 * whole model, not just the tiny text.
 */
export function PersonalisationText({
  url,
  colour,
  topZ,
  transform,
}: PersonalisationTextProps): JSX.Element | null {
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

  return (
    <mesh
      geometry={rendered}
      position={[transform.x, transform.y, topZ]}
      rotation={[0, 0, (transform.rotationDeg * Math.PI) / 180]}
    >
      <meshStandardMaterial color={colour} roughness={0.55} metalness={0} flatShading />
    </mesh>
  )
}
