'use client'

import { Bounds, Grid, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState, type JSX } from 'react'
import * as THREE from 'three'

import type { Orientation } from '@/lib/validators/designs'

import { type ClipState, ClipController, buildClipPlane } from './clip-plane'
import { FILAMENT_COLOR_ATTR, parseModelWithColours } from './model-parse'
import { PersonalisationText, type TextTransform } from './personalisation-text'

// How the model is coloured: "model" shows a 3MF's real filament colours (when it
// has them), "analysis" shows the support shading (base grey + amber overhangs).
export type ColourMode = 'model' | 'analysis'

// The live name layer the viewer draws on top of the model, driven by the editor.
export interface PersonalisationView {
  // The extruded-text STL URL, or null when there is no name to show.
  textUrl: string | null
  colour: string
  transform: TextTransform
}

// A face needs support when its normal points downward past the self-support
// limit (~45deg), matching the backend rule so the shaded faces agree.
const OVERHANG_LIMIT = Math.sin((45 * Math.PI) / 180)
const BASE_COLOR = new THREE.Color('#9aa4b2')
const OVERHANG_COLOR = new THREE.Color('#f59e0b')

// A 90-degree turn about a world axis; `steps` are these turns applied in order.
export type RotateAxis = 'x' | 'y' | 'z'

export interface OrientationMeasure {
  overhang: number
  contact: number
}

interface ModelViewerProps {
  modelUrl: string
  orientation: Orientation | null
  base: 'uploaded' | 'recommended'
  steps: RotateAxis[]
  onMeasure: (m: OrientationMeasure) => void
  clip: ClipState | null
  // A filament colour to render the whole model in (hex). null shows either the
  // model's own colours (colourMode "model") or the analysis shading.
  tint?: string | null
  // Whether to show the model's real colours or the support analysis. Defaults to
  // "model"; it degrades to analysis shading when the model carries no colours.
  colourMode?: ColourMode
  // Reports the model's own filament colours once loaded (empty for STL / plain
  // 3MF), so the parent can offer a colours/analysis toggle only when it helps.
  onColours?: (colours: string[]) => void
  // The live name layer drawn on the model's top face (the personalisation editor).
  personalisation?: PersonalisationView
  // Reports how long the model took to fetch and build (parse + decimate).
  onTiming?: (t: LoadTiming) => void
}

interface ModelData {
  geometry: THREE.BufferGeometry
  colours: string[]
  timing: LoadTiming
}

/**
 * Loads and parses the model once per URL, cached in TanStack Query. A remount -
 * React StrictMode's double-mount, a dev Fast-Refresh, or a parent re-render as
 * the user types a name - then returns the already-built mesh from cache instead
 * of re-downloading it and flashing a loading state. The cached geometry is a
 * shared source that ModelMesh clones, so no consumer mutates or disposes it.
 */
function useModelGeometry(modelUrl: string): UseQueryResult<ModelData> {
  return useQuery<ModelData>({
    queryKey: ['design-model-geometry', modelUrl],
    queryFn: async () => {
      const started = performance.now()
      const res = await fetch(modelUrl, { credentials: 'same-origin' })
      if (!res.ok) throw new Error(`status ${res.status}`)
      const buf = await res.arrayBuffer()
      const downloaded = performance.now()
      const { geometry, colours } = parseModelWithColours(buf)
      const built = performance.now()
      return {
        geometry,
        colours,
        timing: {
          bytes: buf.byteLength,
          downloadMs: downloaded - started,
          buildMs: built - downloaded,
        },
      }
    },
    staleTime: Infinity,
    gcTime: 10 * 60_000,
    // A couple of retries so a transient blip (a dev hot-reload aborting the
    // in-flight fetch, a backend still warming up) self-heals instead of leaving
    // the viewer stuck on "unavailable" until the component remounts.
    retry: 2,
    retryDelay: attempt => Math.min(1000 * 2 ** attempt, 4000),
  })
}

export interface LoadTiming {
  bytes: number
  downloadMs: number
  buildMs: number
}

/**
 * Interactive 3D preview of the model on the build plate. The pose is the chosen
 * base (as-uploaded or the recommended orientation) plus the user's 90deg turns.
 * A multi-colour 3MF renders in its real colours; otherwise downward-overhang
 * faces are shaded amber and their area is measured live and reported via
 * onMeasure, so reorienting shows its effect on support immediately.
 */
export function ModelViewer({
  modelUrl,
  orientation,
  base,
  steps,
  onMeasure,
  clip,
  tint,
  colourMode = 'model',
  onColours,
  personalisation,
  onTiming,
}: ModelViewerProps): JSX.Element {
  const { data, isError } = useModelGeometry(modelUrl)
  const geometry = data?.geometry ?? null
  // The centred model's bounding box (reported by ModelMesh), so the name layer can
  // rest on the top face (max.z) and scale to the model's footprint.
  const [box, setBox] = useState<{ min: THREE.Vector3; max: THREE.Vector3 } | null>(null)

  // Report load timing and detected colours once, when the (cached) data first
  // becomes available. Kept in refs so a changing callback identity never re-runs.
  const onTimingRef = useRef(onTiming)
  const onColoursRef = useRef(onColours)
  useEffect(() => {
    onTimingRef.current = onTiming
    onColoursRef.current = onColours
  }, [onTiming, onColours])
  useEffect(() => {
    if (data?.timing) onTimingRef.current?.(data.timing)
    if (data) onColoursRef.current?.(data.colours)
  }, [data])

  const quaternion = useMemo(
    () => poseQuaternion(orientation, base, steps),
    [orientation, base, steps],
  )

  if (isError) {
    return <ViewerMessage text="3D preview unavailable for this model." />
  }
  if (!geometry) {
    return <ViewerMessage text="Fetching model…" />
  }

  return (
    <Canvas
      camera={{ up: [0, 0, 1], position: [90, -90, 70], fov: 45, near: 0.1, far: 8000 }}
      dpr={[1, 2]}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true
      }}
    >
      <color attach="background" args={['#f4f3ef']} />
      <ambientLight intensity={0.75} />
      <directionalLight position={[60, -40, 90]} intensity={1.1} />
      <directionalLight position={[-50, 50, 40]} intensity={0.4} />
      <Bounds fit clip observe margin={1.4}>
        <ModelMesh
          geometry={geometry}
          quaternion={quaternion}
          onMeasure={onMeasure}
          clip={clip}
          tint={tint}
          colourMode={colourMode}
          onBounds={(min, max) => setBox({ min, max })}
        />
        {personalisation?.textUrl && box ? (
          <PersonalisationText
            url={personalisation.textUrl}
            colour={personalisation.colour}
            topZ={box.max.z}
            footprint={Math.max(box.max.x - box.min.x, box.max.y - box.min.y)}
            transform={personalisation.transform}
          />
        ) : null}
      </Bounds>
      <Grid
        args={[600, 600]}
        rotation={[Math.PI / 2, 0, 0]}
        cellSize={10}
        cellThickness={0.6}
        sectionSize={50}
        sectionThickness={1}
        cellColor="#d2ccbc"
        sectionColor="#a89f88"
        fadeDistance={900}
        fadeStrength={1.5}
        infiniteGrid
      />
      <OrbitControls makeDefault enableDamping target={[0, 0, 10]} />
    </Canvas>
  )
}

interface ModelMeshProps {
  geometry: THREE.BufferGeometry
  quaternion: THREE.Quaternion
  onMeasure: (m: OrientationMeasure) => void
  clip: ClipState | null
  tint?: string | null
  colourMode: ColourMode
  // Reports the centred mesh's bounding-box corners, so a sibling (the name layer)
  // can sit on the model's top face.
  onBounds?: (min: THREE.Vector3, max: THREE.Vector3) => void
}

function ModelMesh({
  geometry,
  quaternion,
  onMeasure,
  clip,
  tint,
  colourMode,
  onBounds,
}: ModelMeshProps): JSX.Element {
  const meshRef = useRef<THREE.Mesh>(null)
  const worldPlane = useMemo(() => new THREE.Plane(), [])

  const { prepared, measure, boxMin, boxMax } = useMemo(() => {
    const g = geometry.clone()
    g.applyQuaternion(quaternion)
    g.computeBoundingBox()
    const bb = g.boundingBox
    if (bb) {
      g.translate(-(bb.min.x + bb.max.x) / 2, -(bb.min.y + bb.max.y) / 2, -bb.min.z)
    }
    g.computeBoundingBox()
    const box = g.boundingBox
    return {
      prepared: g,
      measure: colourAndMeasure(g, tint, colourMode),
      boxMin: box ? box.min.clone() : new THREE.Vector3(),
      boxMax: box ? box.max.clone() : new THREE.Vector3(),
    }
  }, [geometry, quaternion, tint, colourMode])

  const localPlane = useMemo(
    () => (clip ? buildClipPlane(clip, boxMin, boxMax) : null),
    [clip, boxMin, boxMax],
  )

  useEffect(() => () => prepared.dispose(), [prepared])
  useEffect(() => onMeasure(measure), [measure, onMeasure])
  useEffect(() => onBounds?.(boxMin, boxMax), [boxMin, boxMax, onBounds])

  return (
    <>
      <mesh ref={meshRef} geometry={prepared}>
        <meshStandardMaterial
          vertexColors={!tint}
          color={tint ?? '#ffffff'}
          flatShading
          roughness={0.72}
          metalness={0}
          side={clip ? THREE.DoubleSide : THREE.FrontSide}
          clippingPlanes={clip && localPlane ? [worldPlane] : null}
        />
      </mesh>
      {clip && localPlane ? (
        <ClipController target={meshRef} worldPlane={worldPlane} localPlane={localPlane} />
      ) : null}
    </>
  )
}

function ViewerMessage({ text }: { text: string }): JSX.Element {
  return (
    <div className="text-muted-foreground flex h-full w-full items-center justify-center text-sm">
      {text}
    </div>
  )
}

// poseQuaternion composes the base orientation with the user's 90deg world-axis
// turns (each turn applied in world space, on top of the current pose).
function poseQuaternion(
  orientation: Orientation | null,
  base: 'uploaded' | 'recommended',
  steps: RotateAxis[],
): THREE.Quaternion {
  const q = base === 'recommended' ? recommendedQuaternion(orientation) : new THREE.Quaternion()
  const axis = new THREE.Vector3()
  const step = new THREE.Quaternion()
  for (const s of steps) {
    axis.set(s === 'x' ? 1 : 0, s === 'y' ? 1 : 0, s === 'z' ? 1 : 0)
    step.setFromAxisAngle(axis, Math.PI / 2)
    q.premultiply(step)
  }
  return q
}

function recommendedQuaternion(orientation: Orientation | null): THREE.Quaternion {
  const q = new THREE.Quaternion()
  if (!orientation || orientation.already_optimal) return q
  const axis = new THREE.Vector3(
    orientation.rotation_axis.x,
    orientation.rotation_axis.y,
    orientation.rotation_axis.z,
  )
  if (axis.lengthSq() === 0) return q
  axis.normalize()
  q.setFromAxisAngle(axis, (orientation.rotation_degrees * Math.PI) / 180)
  return q
}

// colourAndMeasure decides how the mesh is coloured and always returns the support
// measure. A tint renders solid (no vertex colours needed). "model" mode with a
// baked filament-colour attribute shows the real colours. Otherwise the overhang
// analysis paints the "color" attribute grey/amber. The overhang area is measured
// in every case so the readout stays live.
function colourAndMeasure(
  g: THREE.BufferGeometry,
  tint: string | null | undefined,
  colourMode: ColourMode,
): OrientationMeasure {
  const filament = g.getAttribute(FILAMENT_COLOR_ATTR)
  if (!tint && colourMode === 'model' && filament) {
    g.setAttribute('color', filament)
    return measureOverhang(g)
  }
  if (tint) {
    return measureOverhang(g)
  }
  return paintOverhang(g)
}

// measureOverhang returns the shown pose's support measure without touching
// colours: overhang = elevated downward faces (need support); contact = downward
// faces resting on the plate (free).
function measureOverhang(g: THREE.BufferGeometry): OrientationMeasure {
  return analyseOverhang(g, null)
}

// paintOverhang shades the geometry (base grey, amber for lifted overhangs) and
// returns the same measure. The geometry is non-indexed, so each triangle owns its
// three vertices.
function paintOverhang(g: THREE.BufferGeometry): OrientationMeasure {
  const colors = new Float32Array(g.getAttribute('position').count * 3)
  const measure = analyseOverhang(g, colors)
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return measure
}

// analyseOverhang walks the triangles once, measuring the support areas and, when
// a colour buffer is supplied, writing the base/overhang colour per vertex.
function analyseOverhang(g: THREE.BufferGeometry, colors: Float32Array | null): OrientationMeasure {
  const pos = g.getAttribute('position')

  let minZ = Infinity
  let maxZ = -Infinity
  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i)
    if (z < minZ) minZ = z
    if (z > maxZ) maxZ = z
  }
  const eps = 1e-3 * (maxZ - minZ) + 1e-9

  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const c = new THREE.Vector3()
  const ab = new THREE.Vector3()
  const ac = new THREE.Vector3()
  const n = new THREE.Vector3()
  let overhang = 0
  let contact = 0

  for (let i = 0; i < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i)
    b.fromBufferAttribute(pos, i + 1)
    c.fromBufferAttribute(pos, i + 2)
    ab.subVectors(b, a)
    ac.subVectors(c, a)
    n.crossVectors(ab, ac)
    const area = 0.5 * n.length()
    n.normalize()

    let color = BASE_COLOR
    if (n.z < -OVERHANG_LIMIT) {
      const faceMinZ = Math.min(a.z, b.z, c.z)
      if (faceMinZ <= minZ + eps) {
        contact += area
      } else {
        overhang += area
        color = OVERHANG_COLOR
      }
    }
    if (colors) {
      for (let k = 0; k < 3; k++) {
        const o = (i + k) * 3
        colors[o] = color.r
        colors[o + 1] = color.g
        colors[o + 2] = color.b
      }
    }
  }
  return { overhang, contact }
}
