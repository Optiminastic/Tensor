// A tiny G-code reader for the layer preview. It turns Bambu Studio's plate
// G-code into extrusion segments grouped by layer (Z), classified by feature so
// the viewer can colour walls / infill / support distinctly. Travel moves are
// dropped - the preview shows deposited material, like a slicer's preview tab.
//
// This is display-only geometry; the backend slicer remains the source of truth
// for time, filament and cost.

export type GcodeFeature =
  | 'outer-wall'
  | 'inner-wall'
  | 'infill'
  | 'solid'
  | 'skin'
  | 'support'
  | 'other'

export interface GcodeSegment {
  x0: number
  y0: number
  x1: number
  y1: number
  z: number
  feature: GcodeFeature
}

export interface GcodeLayer {
  z: number
  segments: GcodeSegment[]
}

export interface ParsedGcode {
  layers: GcodeLayer[]
  min: [number, number, number]
  max: [number, number, number]
  segmentCount: number
}

interface ParseState {
  x: number
  y: number
  z: number
  lastE: number
  relativeE: boolean
  absolute: boolean
  feature: GcodeFeature
}

interface Accum {
  byZ: Map<number, GcodeSegment[]>
  min: [number, number, number]
  max: [number, number, number]
  count: number
}

// Maps a slicer feature/type comment to one of our display buckets. Bambu uses
// "; FEATURE: Outer wall"; other slicers use ";TYPE:...". Both land here.
function normalizeFeature(raw: string): GcodeFeature {
  const f = raw.toLowerCase()
  if (f.includes('outer')) return 'outer-wall'
  if (f.includes('inner') || f.includes('perimeter')) return 'inner-wall'
  if (f.includes('support')) return 'support'
  if (f.includes('bridge') || f.includes('top') || f.includes('bottom') || f.includes('surface')) {
    return 'skin'
  }
  if (f.includes('solid')) return 'solid'
  if (f.includes('infill') || f.includes('fill')) return 'infill'
  return 'other'
}

function readFeatureComment(comment: string): GcodeFeature | null {
  const match = /^(?:FEATURE|TYPE)\s*:?\s*(.+)$/i.exec(comment)
  return match ? normalizeFeature(match[1]) : null
}

// Applies X/Y/Z/E words on a G0/G1 to the running position and returns whether
// this move extrudes material (positive filament advance).
function applyAxes(
  state: ParseState,
  parts: string[],
): { nx: number; ny: number; nz: number; extruding: boolean } {
  let nx = state.x
  let ny = state.y
  let nz = state.z
  let e: number | null = null
  for (let i = 1; i < parts.length; i++) {
    const axis = parts[i][0]?.toUpperCase()
    const val = Number(parts[i].slice(1))
    if (Number.isNaN(val)) continue
    if (axis === 'X') nx = state.absolute ? val : state.x + val
    else if (axis === 'Y') ny = state.absolute ? val : state.y + val
    else if (axis === 'Z') nz = state.absolute ? val : state.z + val
    else if (axis === 'E') e = val
  }
  let extruding = false
  if (e !== null) {
    extruding = state.relativeE ? e > 0 : e > state.lastE + 1e-6
    if (!state.relativeE) state.lastE = e
  }
  return { nx, ny, nz, extruding }
}

function record(accum: Accum, seg: GcodeSegment): void {
  const key = Math.round(seg.z * 1000) / 1000
  let arr = accum.byZ.get(key)
  if (!arr) {
    arr = []
    accum.byZ.set(key, arr)
  }
  arr.push(seg)
  accum.count += 1
  accum.min = [
    Math.min(accum.min[0], seg.x0, seg.x1),
    Math.min(accum.min[1], seg.y0, seg.y1),
    Math.min(accum.min[2], seg.z),
  ]
  accum.max = [
    Math.max(accum.max[0], seg.x0, seg.x1),
    Math.max(accum.max[1], seg.y0, seg.y1),
    Math.max(accum.max[2], seg.z),
  ]
}

function step(state: ParseState, accum: Accum, code: string): void {
  const parts = code.split(/\s+/)
  const cmd = parts[0]?.toUpperCase()
  if (cmd === 'M82' || cmd === 'M83') {
    state.relativeE = cmd === 'M83'
    return
  }
  if (cmd === 'G90' || cmd === 'G91') {
    state.absolute = cmd === 'G90'
    return
  }
  if (cmd === 'G92') {
    const { nx, ny, nz } = applyAxes(state, parts)
    state.x = nx
    state.y = ny
    state.z = nz
    const eWord = parts.find(p => p[0]?.toUpperCase() === 'E')
    if (eWord) state.lastE = Number(eWord.slice(1)) || 0
    return
  }
  if (cmd !== 'G0' && cmd !== 'G1') return

  const { nx, ny, nz, extruding } = applyAxes(state, parts)
  if (extruding && (nx !== state.x || ny !== state.y)) {
    record(accum, { x0: state.x, y0: state.y, x1: nx, y1: ny, z: nz, feature: state.feature })
  }
  state.x = nx
  state.y = ny
  state.z = nz
}

/** Parses plate G-code text into extrusion layers for the preview. */
export function parseGcode(text: string): ParsedGcode {
  const state: ParseState = {
    x: 0,
    y: 0,
    z: 0,
    lastE: 0,
    relativeE: true,
    absolute: true,
    feature: 'other',
  }
  const accum: Accum = {
    byZ: new Map(),
    min: [Infinity, Infinity, Infinity],
    max: [-Infinity, -Infinity, -Infinity],
    count: 0,
  }

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    if (line.length === 0) continue
    if (line.startsWith(';')) {
      const feature = readFeatureComment(line.slice(1).trim())
      if (feature) state.feature = feature
      continue
    }
    const semicolon = line.indexOf(';')
    const code = (semicolon >= 0 ? line.slice(0, semicolon) : line).trim()
    if (code.length > 0) step(state, accum, code)
  }

  const layers: GcodeLayer[] = [...accum.byZ.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([z, segments]) => ({ z, segments }))

  const empty = !Number.isFinite(accum.min[0])
  return {
    layers,
    min: empty ? [0, 0, 0] : accum.min,
    max: empty ? [0, 0, 0] : accum.max,
    segmentCount: accum.count,
  }
}
