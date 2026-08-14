import * as THREE from 'three'
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader.js'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

import { slic3rFilamentColours, slic3rVolumes, unzip3MF, type Slic3rVolume } from './model-colours'

// Above this triangle count a model is simplified for the preview so it stays
// interactive (a 24 MB STL is ~480k triangles; parsing/painting that on the main
// thread stalls the tab). The full model is untouched - only this browser preview
// is decimated; the slicer still uses the original.
const PREVIEW_MAX_TRIANGLES = 150_000
// Grid resolution for the vertex-clustering decimation: vertices sharing a cell
// collapse to the cell's centroid, dropping the fine triangles.
const PREVIEW_DECIMATE_GRID = 90

// The custom attribute the multi-colour bake writes, holding each vertex's real
// 3MF filament colour. Kept separate from "color" (which the overhang analysis
// paints), so the viewer can switch between the two without re-parsing.
export const FILAMENT_COLOR_ATTR = 'filamentColor'

// A 3MF is treated as multi-colour (and its colours baked for rendering) only
// when its parts carry at least this many distinct material colours. One colour
// is just a plain model and keeps the current single-colour/analysis rendering.
const MULTI_COLOUR_MIN = 2

export interface ParsedModel {
  geometry: THREE.BufferGeometry
  // Distinct part colours baked into FILAMENT_COLOR_ATTR (#rrggbb), empty unless
  // this is a genuinely multi-colour 3MF.
  colours: string[]
}

/**
 * Parses an STL or 3MF into a single non-indexed geometry, and for a multi-colour
 * 3MF also bakes each part's colour into a filament-colour vertex attribute and
 * returns the distinct palette. Format is sniffed from the bytes (3MF is a ZIP,
 * "PK.."; otherwise STL).
 */
export function parseModelWithColours(buf: ArrayBuffer): ParsedModel {
  if (!isZip(buf)) {
    return { geometry: finishGeometry(new STLLoader().parse(buf)), colours: [] }
  }
  // PrusaSlicer/Slic3r store colour as per-volume extruder indices, not on the
  // mesh, so ThreeMFLoader cannot see them - handle those directly first.
  const prusa = prusaColouredModel(buf)
  if (prusa) {
    return prusa
  }
  const { geometry, colours } = merge3MF(new ThreeMFLoader().parse(buf))
  if (colours.length < MULTI_COLOUR_MIN) {
    // Plain (single-colour) 3MF: behave exactly as before - decimate if heavy.
    return { geometry: finishGeometry(geometry), colours: [] }
  }
  // A coloured 3MF keeps full resolution: decimation rebuilds positions and would
  // drop the baked colour attribute. Colour fidelity beats the preview perf here.
  geometry.computeVertexNormals()
  return { geometry, colours }
}

/**
 * Geometry-only parse for plain viewers that do not need colour (production job
 * preview, the personalisation text layer). Equivalent to the pre-existing
 * parseModel: sniff, non-index, decimate if heavy, compute normals.
 */
export function parseModel(buf: ArrayBuffer): THREE.BufferGeometry {
  return parseModelWithColours(buf).geometry
}

/**
 * Renders a PrusaSlicer/Slic3r multi-material 3MF in its real colours. Those
 * colours are not on the mesh: the archive lists a filament palette and splits the
 * single object into volumes (triangle ranges), each printed with one extruder. We
 * parse the model geometry and colour each triangle by its volume's extruder.
 * Returns null when the archive is not a coloured Slic3r 3MF.
 */
function prusaColouredModel(buf: ArrayBuffer): ParsedModel | null {
  const files = unzip3MF(buf)
  if (!files) {
    return null
  }
  const volumes = slic3rVolumes(files)
  const filaments = slic3rFilamentColours(files)
  if (volumes.length === 0 || filaments.length === 0) {
    return null
  }
  const name = Object.keys(files).find(n => n.toLowerCase() === '3d/3dmodel.model')
  if (!name) {
    return null
  }
  return buildColouredGeometry(new TextDecoder().decode(files[name]), volumes, filaments)
}

// buildColouredGeometry parses the model's vertices and triangles in document
// order and paints each triangle with its volume's filament colour, baking the
// result into a filament-colour attribute. Returns null unless at least two
// distinct colours are actually used (otherwise it is not a multi-colour model).
function buildColouredGeometry(
  xml: string,
  volumes: Slic3rVolume[],
  filaments: string[],
): ParsedModel | null {
  const vertices = parseVertices(xml)
  if (vertices.length === 0) {
    return null
  }
  const sorted = [...volumes].sort((a, b) => a.firstid - b.firstid)
  const positions: number[] = []
  const colours: number[] = []
  const used = new Set<string>()
  const colour = new THREE.Color()
  const emit = (index: number): void => {
    const o = index * 3
    positions.push(vertices[o], vertices[o + 1], vertices[o + 2])
    colours.push(colour.r, colour.g, colour.b)
  }

  const triangles = /<triangle\s+v1="(\d+)"\s+v2="(\d+)"\s+v3="(\d+)"/g
  let vi = 0
  let i = 0
  let m: RegExpExecArray | null
  while ((m = triangles.exec(xml)) !== null) {
    while (vi < sorted.length && i > sorted[vi].lastid) vi++
    const extruder = vi < sorted.length && i >= sorted[vi].firstid ? sorted[vi].extruder : 1
    const hex = filaments[extruder - 1] ?? filaments[0]
    used.add(hex)
    colour.set(hex)
    emit(Number(m[1]))
    emit(Number(m[2]))
    emit(Number(m[3]))
    i++
  }
  if (used.size < MULTI_COLOUR_MIN) {
    return null
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute(FILAMENT_COLOR_ATTR, new THREE.Float32BufferAttribute(colours, 3))
  geometry.computeVertexNormals()
  return { geometry, colours: dedupe([...used]) }
}

// parseVertices reads every <vertex x y z> into a flat [x0,y0,z0, x1,...] array,
// indexable by the triangle vertex ids.
function parseVertices(xml: string): Float32Array {
  const re = /<vertex\s+x="([^"]+)"\s+y="([^"]+)"\s+z="([^"]+)"/g
  const xs: number[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) {
    xs.push(Number(m[1]), Number(m[2]), Number(m[3]))
  }
  return new Float32Array(xs)
}

function isZip(buf: ArrayBuffer): boolean {
  const head = new Uint8Array(buf, 0, Math.min(2, buf.byteLength))
  return head[0] === 0x50 && head[1] === 0x4b // "PK" => 3MF
}

// finishGeometry normalises a freshly-loaded geometry for the preview: make it
// non-indexed (so overhang colouring can work per triangle), decimate it if it is
// very heavy, and compute smooth normals.
function finishGeometry(input: THREE.BufferGeometry): THREE.BufferGeometry {
  let geo = input
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

interface MergePart {
  geometry: THREE.BufferGeometry
  count: number
  colour: string | null
}

// merge3MF flattens the loaded 3MF object into one non-indexed geometry. When its
// parts carry distinct material colours it also bakes a per-vertex filament-colour
// attribute so the viewer can render the real colours; a single-colour 3MF returns
// position only (colours empty), matching the previous behaviour.
function merge3MF(object: THREE.Object3D): ParsedModel {
  const parts = collectParts(object)
  if (parts.length === 0) {
    throw new Error('3MF contained no mesh')
  }
  const palette = dedupe(parts.map(p => p.colour).filter((c): c is string => c !== null))
  const multiColour = palette.length >= MULTI_COLOUR_MIN
  if (multiColour) {
    for (const part of parts) {
      const hex = part.colour ?? palette[0]
      part.geometry.setAttribute(FILAMENT_COLOR_ATTR, colourAttribute(part.count, hex))
    }
  }
  const merged = mergeGeometries(
    parts.map(p => p.geometry),
    false,
  )
  if (!merged) {
    throw new Error('3MF parts could not be merged')
  }
  return { geometry: merged, colours: multiColour ? palette : [] }
}

// collectParts walks the loaded 3MF, returning one position-only geometry per mesh
// (baked to world space) together with its material colour, if any.
function collectParts(object: THREE.Object3D): MergePart[] {
  const parts: MergePart[] = []
  object.updateMatrixWorld(true)
  object.traverse(child => {
    const mesh = child as THREE.Mesh
    if (!mesh.isMesh || !mesh.geometry) {
      return
    }
    const src = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone()
    src.applyMatrix4(mesh.matrixWorld)
    const position = src.getAttribute('position')
    const only = new THREE.BufferGeometry()
    only.setAttribute('position', position)
    parts.push({ geometry: only, count: position.count, colour: materialColour(mesh.material) })
    if (src !== mesh.geometry) {
      src.dispose()
    }
  })
  return parts
}

// materialColour reads a mesh's material colour as #rrggbb (the first material of
// a multi-material mesh), or null when the material carries no colour.
function materialColour(material: THREE.Material | THREE.Material[]): string | null {
  const first = Array.isArray(material) ? material[0] : material
  const colour = (first as THREE.MeshStandardMaterial | undefined)?.color
  return colour ? `#${colour.getHexString()}` : null
}

// colourAttribute builds a per-vertex colour buffer filled with one hex, matching
// how the overhang painter writes colours (raw THREE.Color channels) so both
// render consistently under the renderer's colour management.
function colourAttribute(vertexCount: number, hex: string): THREE.BufferAttribute {
  const colour = new THREE.Color(hex)
  const data = new Float32Array(vertexCount * 3)
  for (let i = 0; i < vertexCount; i++) {
    data[i * 3] = colour.r
    data[i * 3 + 1] = colour.g
    data[i * 3 + 2] = colour.b
  }
  return new THREE.BufferAttribute(data, 3)
}

function dedupe(list: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const hex of list) {
    if (!seen.has(hex)) {
      seen.add(hex)
      out.push(hex)
    }
  }
  return out
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
