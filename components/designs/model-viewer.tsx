'use client'

import { Bounds, Grid, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState, type JSX } from 'react'
import * as THREE from 'three'
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader.js'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

import type { Orientation } from '@/lib/validators/designs'

import { type ClipState, ClipController, buildClipPlane } from './clip-plane'
import { type GizmoMode, PersonalisationText, type TextTransform } from './personalisation-text'

// The live name layer the viewer draws on top of the model, driven by the editor.
export interface PersonalisationView {
  // The extruded-text STL URL, or null when there is no name to show.
  textUrl: string | null
  colour: string
  transform: TextTransform
  editable: boolean
  gizmo: GizmoMode
  onTransform: (next: TextTransform) => void
}

// Above this triangle count a model is simplified for the preview so it stays
// interactive (a 24 MB STL is ~480k triangles; parsing/painting that on the main
// thread stalls the tab). The full STL is untouched - only this browser preview
// is decimated; the slicer still uses the original.
const PREVIEW_MAX_TRIANGLES = 150_000
// Grid resolution for the vertex-clustering decimation: vertices sharing a cell
// collapse to the cell's centroid, dropping the fine triangles.
const PREVIEW_DECIMATE_GRID = 90

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
  // A filament colour to render the whole model in (hex). null shows the analysis
  // shading (base grey + amber overhangs) instead.
  tint?: string | null
  // The live name layer drawn on the model's top face (the personalisation editor).
  personalisation?: PersonalisationView
  // Reports how long the model took to fetch and build (parse + decimate).
  onTiming?: (t: LoadTiming) => void
}

interface ModelData {
  geometry: THREE.BufferGeometry
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
      const geometry = parseModel(buf)
      const built = performance.now()
      return {
        geometry,
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
 * Downward-overhang faces are shaded amber and their area is measured live and
 * reported via onMeasure, so reorienting shows its effect on support immediately.
 */
export function ModelViewer({
  modelUrl,
  orientation,
  base,
  steps,
  onMeasure,
  clip,
  tint,
  personalisation,
  onTiming,
}: ModelViewerProps): JSX.Element {
  const { data, isError } = useModelGeometry(modelUrl)
  const geometry = data?.geometry ?? null
  // The model's top-face Z in the centred viewer frame, reported by ModelMesh, so
  // the name layer can rest on top of the model.
  const [topZ, setTopZ] = useState<number | null>(null)

  // Report load timing once, when the (cached) data first becomes available. Kept
  // in a ref so a changing onTiming identity never re-runs the effect.
  const onTimingRef = useRef(onTiming)
  useEffect(() => {
    onTimingRef.current = onTiming
  }, [onTiming])
  useEffect(() => {
    if (data?.timing) onTimingRef.current?.(data.timing)
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
          onBounds={(_, max) => setTopZ(max.z)}
        />
        {personalisation?.textUrl && topZ !== null ? (
          <PersonalisationText
            url={personalisation.textUrl}
            colour={personalisation.colour}
            topZ={topZ}
            transform={personalisation.transform}
            editable={personalisation.editable}
            gizmo={personalisation.gizmo}
            onTransform={personalisation.onTransform}
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
      measure: paintAndMeasure(g),
      boxMin: box ? box.min.clone() : new THREE.Vector3(),
      boxMax: box ? box.max.clone() : new THREE.Vector3(),
    }
  }, [geometry, quaternion])

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

// paintAndMeasure colours the geometry and measures the shown pose: overhang =
// elevated downward faces (amber, need support); contact = downward faces resting
// on the plate (free). The geometry is non-indexed, so each triangle owns its
// three vertices.
function paintAndMeasure(g: THREE.BufferGeometry): OrientationMeasure {
  const pos = g.getAttribute('position')
  const colors = new Float32Array(pos.count * 3)

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
    for (let k = 0; k < 3; k++) {
      const o = (i + k) * 3
      colors[o] = color.r
      colors[o + 1] = color.g
      colors[o + 2] = color.b
    }
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return { overhang, contact }
}

// parseModel sniffs the format (3MF is a zip, "PK.."; otherwise STL) and returns
// a single non-indexed geometry so overhang colouring can work per triangle. A
// very heavy mesh is decimated first so the preview stays interactive. Exported
// for reuse by any other plain-model viewer (see
// components/production/job-model-viewer.tsx).
export function parseModel(buf: ArrayBuffer): THREE.BufferGeometry {
  const head = new Uint8Array(buf, 0, Math.min(2, buf.byteLength))
  const isZip = head[0] === 0x50 && head[1] === 0x4b // "PK" => 3MF
  let geo = isZip ? merge3MF(new ThreeMFLoader().parse(buf)) : new STLLoader().parse(buf)
  if (geo.index) {
    geo = geo.toNonIndexed()
  }
  if (geo.getAttribute('position').count / 3 > PREVIEW_MAX_TRIANGLES) {
    const lite = decimateGeometry(geo, PREVIEW_DECIMATE_GRID)
    // Keep the simplified mesh only if it survived with a usable number of
    // triangles; otherwise fall back to the original (never show a blank model).
    if (lite !== geo && lite.getAttribute('position').count >= 3 * 100) {
      geo.dispose()
      geo = lite
    } else if (lite !== geo) {
      lite.dispose()
    }
  }
  geo.computeVertexNormals()
  return geo
}

// decimateGeometry reduces a non-indexed geometry by grid vertex-clustering: the
// bounding box is split into a gridN^3 lattice, every vertex snaps to its cell's
// centroid, and triangles whose corners collapse into one cell are dropped. Cheap
// (two linear passes) and good enough for an orbit preview; it is not a
// quality-preserving simplification and slightly changes the overhang readout.
function decimateGeometry(geo: THREE.BufferGeometry, gridN: number): THREE.BufferGeometry {
  const pos = geo.getAttribute('position')
  geo.computeBoundingBox()
  const bb = geo.boundingBox
  if (!bb) return geo
  const maxDim = Math.max(bb.max.x - bb.min.x, bb.max.y - bb.min.y, bb.max.z - bb.min.z)
  if (maxDim <= 0) return geo

  const arr = pos.array as ArrayLike<number>
  const cell = maxDim / gridN
  const stride = gridN + 2 // +2 so the max corner never overflows the lattice
  const keyOf = (x: number, y: number, z: number): number =>
    Math.floor((x - bb.min.x) / cell) +
    Math.floor((y - bb.min.y) / cell) * stride +
    Math.floor((z - bb.min.z) / cell) * stride * stride

  // First pass: accumulate each cell's centroid.
  const cells = new Map<number, { x: number; y: number; z: number; n: number }>()
  for (let i = 0; i < pos.count; i++) {
    const x = arr[i * 3]
    const y = arr[i * 3 + 1]
    const z = arr[i * 3 + 2]
    const k = keyOf(x, y, z)
    let acc = cells.get(k)
    if (!acc) {
      acc = { x: 0, y: 0, z: 0, n: 0 }
      cells.set(k, acc)
    }
    acc.x += x
    acc.y += y
    acc.z += z
    acc.n += 1
  }

  // Second pass: rebuild triangles from cell centroids, dropping collapsed ones.
  const out: number[] = []
  const push = (k: number): void => {
    const c = cells.get(k)
    if (c) out.push(c.x / c.n, c.y / c.n, c.z / c.n)
  }
  for (let i = 0; i < pos.count; i += 3) {
    const kA = keyOf(arr[i * 3], arr[i * 3 + 1], arr[i * 3 + 2])
    const kB = keyOf(arr[i * 3 + 3], arr[i * 3 + 4], arr[i * 3 + 5])
    const kC = keyOf(arr[i * 3 + 6], arr[i * 3 + 7], arr[i * 3 + 8])
    if (kA === kB || kB === kC || kA === kC) continue
    push(kA)
    push(kB)
    push(kC)
  }

  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(out, 3))
  return g
}

function merge3MF(object: THREE.Object3D): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = []
  object.updateMatrixWorld(true)
  object.traverse(child => {
    const mesh = child as THREE.Mesh
    if (!mesh.isMesh || !mesh.geometry) {
      return
    }
    const src = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone()
    src.applyMatrix4(mesh.matrixWorld)
    const only = new THREE.BufferGeometry()
    only.setAttribute('position', src.getAttribute('position'))
    parts.push(only)
    if (src !== mesh.geometry) {
      src.dispose()
    }
  })
  const merged = parts.length > 0 ? mergeGeometries(parts, false) : null
  if (!merged) {
    throw new Error('3MF contained no mesh')
  }
  return merged
}
