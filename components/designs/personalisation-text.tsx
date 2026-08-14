'use client'

import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, type JSX } from 'react'
import * as THREE from 'three'

import { parseModel } from './model-parse'

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
  // The model's larger horizontal extent, used to scale the name to a readable
  // fraction of the model rather than leaving it at a fixed (often tiny) size.
  footprint: number
  transform: TextTransform
}

// The name's width targets this fraction of the model's larger horizontal extent,
// so it reads sensibly on a keychain or a car body alike.
const TEXT_FOOTPRINT_FRACTION = 0.4

const clamp = (v: number, lo: number, hi: number): number => Math.min(Math.max(v, lo), hi)

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
  footprint,
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

  // Center the name on its own footprint and rest its base at z=0, so the mesh
  // position places the name's centre (not the raw STL's corner) and it sits on
  // the model's top face. Then scale it to a readable fraction of the model.
  const { rendered, scale } = useMemo(() => {
    const g = geometry?.clone() ?? null
    if (!g) return { rendered: null, scale: 1 }
    g.computeBoundingBox()
    const bb = g.boundingBox
    if (bb) {
      g.translate(-(bb.min.x + bb.max.x) / 2, -(bb.min.y + bb.max.y) / 2, -bb.min.z)
    }
    g.computeBoundingBox()
    const nb = g.boundingBox
    const textWidth = nb ? Math.max(nb.max.x - nb.min.x, nb.max.y - nb.min.y) : 0
    const target = TEXT_FOOTPRINT_FRACTION * footprint
    const s = textWidth > 0 && target > 0 ? clamp(target / textWidth, 0.1, 40) : 1
    return { rendered: g, scale: s }
  }, [geometry, footprint])
  useEffect(() => () => rendered?.dispose(), [rendered])

  if (!rendered) return null

  return (
    <mesh
      geometry={rendered}
      position={[transform.x, transform.y, topZ]}
      rotation={[0, 0, (transform.rotationDeg * Math.PI) / 180]}
      scale={scale}
    >
      <meshStandardMaterial color={colour} roughness={0.55} metalness={0} flatShading />
    </mesh>
  )
}
