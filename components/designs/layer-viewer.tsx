'use client'

import { Grid, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type JSX } from 'react'
import * as THREE from 'three'

import { type ClipState, ClipController, buildClipPlane } from './clip-plane'
import type { GcodeFeature, ParsedGcode } from './gcode-parser'

// Feature colours for the toolpaths. three.js can't read CSS tokens, so - like
// the mesh viewer's hard-coded scene colours - these are fixed hexes, kept
// restrained and CVD-distinguishable (azure walls, grey/slate fills, teal skin,
// amber support to match the overhang colour used in the mesh viewer).
export const FEATURE_HEX: Record<GcodeFeature, string> = {
  'outer-wall': '#0f56a1',
  'inner-wall': '#5b8fc7',
  infill: '#9aa4b2',
  solid: '#4b5563',
  skin: '#0e7490',
  support: '#f59e0b',
  other: '#9aa4b2',
}

interface Built {
  positions: Float32Array
  colors: Float32Array
  cumulative: number[]
  radius: number
  height: number
  localMin: THREE.Vector3
  localMax: THREE.Vector3
}

// Turns the parsed layers into one interleaved line-segment buffer (2 vertices
// per segment) with per-vertex colours, plus the cumulative vertex count at each
// layer so the viewer can reveal layers by growing the geometry's draw range.
function build(parsed: ParsedGcode): Built {
  const { layers, min, max, segmentCount } = parsed
  const cx = (min[0] + max[0]) / 2
  const cy = (min[1] + max[1]) / 2
  const z0 = min[2]
  const positions = new Float32Array(segmentCount * 2 * 3)
  const colors = new Float32Array(segmentCount * 2 * 3)
  const cumulative: number[] = []
  const rgb = new THREE.Color()
  let v = 0

  for (const layer of layers) {
    for (const s of layer.segments) {
      rgb.set(FEATURE_HEX[s.feature])
      // Map G-code (x, y, z-up) into three's y-up space: y = height, z = -depth.
      positions.set([s.x0 - cx, s.z - z0, -(s.y0 - cy)], v * 3)
      colors.set([rgb.r, rgb.g, rgb.b], v * 3)
      v += 1
      positions.set([s.x1 - cx, s.z - z0, -(s.y1 - cy)], v * 3)
      colors.set([rgb.r, rgb.g, rgb.b], v * 3)
      v += 1
    }
    cumulative.push(v)
  }

  const radius = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2], 1)
  // The local extents in three's frame (see the mapping above), for the cut plane.
  const localMin = new THREE.Vector3(min[0] - cx, 0, -(max[1] - cy))
  const localMax = new THREE.Vector3(max[0] - cx, max[2] - z0, -(min[1] - cy))
  return { positions, colors, cumulative, radius, height: max[2] - min[2], localMin, localMax }
}

interface ToolpathsProps {
  built: Built
  visibleLayers: number
  clip: ClipState | null
}

function Toolpaths({ built, visibleLayers, clip }: ToolpathsProps): JSX.Element {
  const geometry = useRef<THREE.BufferGeometry>(null)
  const lines = useRef<THREE.LineSegments>(null)
  const worldPlane = useMemo(() => new THREE.Plane(), [])
  const localPlane = useMemo(
    () => (clip ? buildClipPlane(clip, built.localMin, built.localMax) : null),
    [clip, built],
  )

  useEffect(() => {
    const geo = geometry.current
    if (!geo) return
    const last = built.cumulative.length - 1
    const index = Math.min(Math.max(visibleLayers, 1), built.cumulative.length) - 1
    geo.setDrawRange(0, built.cumulative[index] ?? built.cumulative[last] ?? 0)
  }, [built, visibleLayers])

  return (
    <>
      <lineSegments ref={lines}>
        <bufferGeometry ref={geometry}>
          <bufferAttribute attach="attributes-position" args={[built.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[built.colors, 3]} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors clippingPlanes={clip && localPlane ? [worldPlane] : null} />
      </lineSegments>
      {clip && localPlane ? (
        <ClipController target={lines} worldPlane={worldPlane} localPlane={localPlane} />
      ) : null}
    </>
  )
}

interface LayerViewerProps {
  parsed: ParsedGcode
  visibleLayers: number
  clip: ClipState | null
}

/** Renders the sliced toolpaths as coloured layers on the build plate. Controlled
 * by visibleLayers - the caller's slider decides how many layers are shown. */
export function LayerViewer({ parsed, visibleLayers, clip }: LayerViewerProps): JSX.Element {
  const built = useMemo(() => build(parsed), [parsed])
  const distance = built.radius * 1.6

  return (
    <Canvas
      key={parsed.segmentCount}
      camera={{
        position: [distance, distance * 0.8, distance],
        fov: 40,
        near: 0.1,
        far: distance * 20,
      }}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true
      }}
    >
      <Toolpaths built={built} visibleLayers={visibleLayers} clip={clip} />
      <Grid
        infiniteGrid
        cellSize={10}
        sectionSize={50}
        fadeDistance={built.radius * 10}
        cellColor="#c9c9c4"
        sectionColor="#9aa4b2"
      />
      <OrbitControls target={[0, built.height / 2, 0]} enablePan makeDefault />
    </Canvas>
  )
}
