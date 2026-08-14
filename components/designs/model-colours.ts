import { unzipSync } from 'three/examples/jsm/libs/fflate.module.js'

// The model formats a design may be uploaded/imported as. "unknown" means the
// bytes did not match any known signature and the extension was unhelpful.
export type ModelFormat = 'stl' | '3mf' | 'step' | 'unknown'

export interface ModelInspection {
  format: ModelFormat
  // Distinct filament/part colours found in a 3MF, as #rrggbb, in encounter
  // order. Always empty for STL/STEP (they carry no colour).
  colours: string[]
}

// A 3MF can declare a large palette; cap the swatch list so the notice stays a
// single tidy row and a crafted file cannot balloon the UI.
const MAX_COLOURS = 16

// A 3MF is a ZIP: the local-file-header magic is "PK\x03\x04".
const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04]

/**
 * Detects the model format from the file's own bytes, falling back to the
 * extension only when the content is inconclusive. Content-sniffing is what lets
 * a mislabelled ".stl" that is really a 3MF be handled correctly on import.
 */
export function detectModelFormat(buf: ArrayBuffer, filename: string): ModelFormat {
  const bytes = new Uint8Array(buf, 0, Math.min(512, buf.byteLength))
  if (ZIP_MAGIC.every((b, i) => bytes[i] === b)) {
    return '3mf'
  }
  const head = new TextDecoder().decode(bytes).trimStart().toLowerCase()
  if (head.startsWith('solid ')) {
    return 'stl'
  }
  if (head.startsWith('iso-10303')) {
    return 'step'
  }
  if (isBinarySTL(buf)) {
    return 'stl'
  }
  return formatFromExtension(filename)
}

// A binary STL is exactly 80-byte header + a uint32 triangle count + 50 bytes per
// triangle. The exact size match is a reliable signature (mirrors the backend's
// orientation.LoadSTL heuristic).
function isBinarySTL(buf: ArrayBuffer): boolean {
  if (buf.byteLength < 84) {
    return false
  }
  const count = new DataView(buf).getUint32(80, true)
  return buf.byteLength === 84 + 50 * count
}

function formatFromExtension(filename: string): ModelFormat {
  const dot = filename.lastIndexOf('.')
  const ext = dot >= 0 ? filename.slice(dot + 1).toLowerCase() : ''
  if (ext === 'stl') return 'stl'
  if (ext === '3mf') return '3mf'
  if (ext === 'step' || ext === 'stp') return 'step'
  return 'unknown'
}

// The files inside a 3MF archive, keyed by their in-archive path.
export type ArchiveFiles = Record<string, Uint8Array>

// A Slic3r/PrusaSlicer volume: a contiguous triangle range of the single object,
// printed with one extruder (1-based). The render path colours these ranges.
export interface Slic3rVolume {
  firstid: number
  lastid: number
  extruder: number
}

/** Unzips a 3MF archive, or null when the bytes are not a readable ZIP. */
export function unzip3MF(buf: ArrayBuffer): ArchiveFiles | null {
  try {
    return unzipSync(new Uint8Array(buf))
  } catch {
    return null
  }
}

/**
 * Reads the colours a 3MF carries. It unzips the archive and unions three
 * sources: the standard model part (basematerials "displaycolor" and colour-group
 * "color"), the Bambu-style JSON configs ("filament_colour" array), and the
 * PrusaSlicer/Slic3r INI configs ("filament_colour = #..;#.."). Returns distinct
 * #rrggbb values; an unreadable archive yields none.
 */
export function extract3MFColours(buf: ArrayBuffer): string[] {
  const files = unzip3MF(buf)
  if (!files) {
    return []
  }
  const found: string[] = []
  const decoder = new TextDecoder()
  for (const name of Object.keys(files)) {
    const lower = name.toLowerCase()
    if (lower === '3d/3dmodel.model') {
      found.push(...coloursFromModelXml(decoder.decode(files[name])))
    } else if (lower.startsWith('metadata/') && lower.endsWith('.config')) {
      const text = decoder.decode(files[name])
      found.push(...coloursFromConfig(text), ...coloursFromSlic3rConfig(text))
    }
  }
  return dedupeHex(found).slice(0, MAX_COLOURS)
}

/**
 * The ordered filament palette (extruder 1 first) from a Slic3r/PrusaSlicer 3MF,
 * read from any Metadata *.config INI line "filament_colour = #..;#..". Empty when
 * none is present. Not deduped: the index is the 1-based extruder number.
 */
export function slic3rFilamentColours(files: ArchiveFiles): string[] {
  const decoder = new TextDecoder()
  for (const name of Object.keys(files)) {
    const lower = name.toLowerCase()
    if (lower.startsWith('metadata/') && lower.endsWith('.config')) {
      const colours = coloursFromSlic3rConfig(decoder.decode(files[name]))
      if (colours.length > 0) {
        return colours
      }
    }
  }
  return []
}

/**
 * The Slic3r/PrusaSlicer volumes (triangle range + extruder) from
 * Metadata/Slic3r_PE_model.config, in document order. Empty when the file is
 * absent, so callers can fall back to the standard 3MF render path.
 */
export function slic3rVolumes(files: ArchiveFiles): Slic3rVolume[] {
  const name = Object.keys(files).find(n => n.toLowerCase() === 'metadata/slic3r_pe_model.config')
  if (!name) {
    return []
  }
  return parseSlic3rVolumes(new TextDecoder().decode(files[name]))
}

// The standard 3MF model XML holds colours in two attributes: basematerials use
// "displaycolor", the materials extension colour-groups use "color". Both are
// #RRGGBB or #RRGGBBAA. A regex is enough - we only need the values, not the graph.
function coloursFromModelXml(xml: string): string[] {
  const out: string[] = []
  const re = /(?:displaycolor|color)\s*=\s*"(#[0-9a-fA-F]{6,8})"/g
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) {
    const hex = normaliseHex(m[1])
    if (hex) out.push(hex)
  }
  return out
}

// Bambu/Prusa write the per-filament colours into a JSON slicer config as
// "filament_colour" (a list of #RRGGBB). Non-JSON configs (e.g. model_settings)
// reference extruders, not colours, so they parse to nothing and are skipped.
function coloursFromConfig(text: string): string[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return []
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return []
  }
  const rec = parsed as Record<string, unknown>
  const raw = rec.filament_colour ?? rec.filament_colors
  if (!Array.isArray(raw)) {
    return []
  }
  return raw
    .filter((c): c is string => typeof c === 'string')
    .map(normaliseHex)
    .filter((c): c is string => c !== '')
}

// PrusaSlicer/Slic3r write the filament colours into an INI-style Metadata config
// as one line "filament_colour = #RRGGBB;#RRGGBB" (often comment-prefixed with
// "; "). Semicolon-separated, one per extruder, in extruder order.
function coloursFromSlic3rConfig(text: string): string[] {
  const line = /^[;\s]*filament_colour\s*=\s*(.+)$/im.exec(text)
  if (!line) {
    return []
  }
  return line[1]
    .split(';')
    .map(normaliseHex)
    .filter((c): c is string => c !== '')
}

// parseSlic3rVolumes reads each volume's triangle range and its extruder from the
// Slic3r model config. A volume with no explicit extruder defaults to the first.
function parseSlic3rVolumes(xml: string): Slic3rVolume[] {
  const out: Slic3rVolume[] = []
  const re = /<volume\s+firstid="(\d+)"\s+lastid="(\d+)"[\s\S]*?<\/volume>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) {
    const extruder = /key="extruder"\s+value="(\d+)"/.exec(m[0])
    out.push({
      firstid: Number(m[1]),
      lastid: Number(m[2]),
      extruder: extruder ? Number(extruder[1]) : 1,
    })
  }
  return out
}

// Lower-cases, drops any alpha byte, and validates. Returns '' for anything that
// is not a #RRGGBB(AA) value, so callers can filter it out.
function normaliseHex(value: string): string {
  const v = value.trim().toLowerCase()
  if (!/^#[0-9a-f]{6}([0-9a-f]{2})?$/.test(v)) {
    return ''
  }
  return v.slice(0, 7)
}

function dedupeHex(list: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const hex of list) {
    if (hex && !seen.has(hex)) {
      seen.add(hex)
      out.push(hex)
    }
  }
  return out
}

/**
 * Inspects a picked model file: detects its format and, for a 3MF, the colours it
 * carries. Used by the upload form to auto-detect the format and pre-fill the
 * colour fields on import.
 */
export async function inspectModelFile(file: File): Promise<ModelInspection> {
  const buf = await file.arrayBuffer()
  const format = detectModelFormat(buf, file.name)
  const colours = format === '3mf' ? extract3MFColours(buf) : []
  return { format, colours }
}
