'use client'

import { Bounds, Grid, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState, type JSX } from 'react'
import * as THREE from 'three'
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader.js'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

import type { Orientation } from '@/lib/validators/designs'

import { type ClipState, ClipController, buildClipPlane } from './clip-plane'

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
}: ModelViewerProps): JSX.Element {
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

  const quaternion = useMemo(
    () => poseQuaternion(orientation, base, steps),
    [orientation, base, steps],
  )

  if (failed) {
    return <ViewerMessage text="3D preview unavailable for this model." />
  }
  if (!geometry) {
    return <ViewerMessage text="Loading 3D preview…" />
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
        <ModelMesh geometry={geometry} quaternion={quaternion} onMeasure={onMeasure} clip={clip} />
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
}

function ModelMesh({ geometry, quaternion, onMeasure, clip }: ModelMeshProps): JSX.Element {
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

  return (
    <>
      <mesh ref={meshRef} geometry={prepared}>
        <meshStandardMaterial
          vertexColors
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
// a single non-indexed geometry so overhang colouring can work per triangle.
function parseModel(buf: ArrayBuffer): THREE.BufferGeometry {
  const head = new Uint8Array(buf, 0, Math.min(2, buf.byteLength))
  const isZip = head[0] === 0x50 && head[1] === 0x4b // "PK" => 3MF
  let geo = isZip ? merge3MF(new ThreeMFLoader().parse(buf)) : new STLLoader().parse(buf)
  if (geo.index) {
    geo = geo.toNonIndexed()
  }
  geo.computeVertexNormals()
  return geo
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
