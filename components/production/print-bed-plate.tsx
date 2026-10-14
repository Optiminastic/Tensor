'use client'

import { Grid } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type JSX } from 'react'
import * as THREE from 'three'

interface PrintBedPlateProps {
  widthMm?: number
  depthMm?: number
}

// The H2C's build volume footprint - see internal/bedpack.BedXMM/YMM
// (Tensor-Core) - and a plausible physical plate thickness/corner radius; not
// measured off a real bed, just enough to read as "a plate," not a floor.
// Exported so the viewers can scale an oversized model down to fit the plate
// instead of letting it visually spill off the edge.
export const BED_WIDTH_MM = 330
export const BED_DEPTH_MM = 320
const THICKNESS_MM = 4
const CORNER_RADIUS_MM = 12

/**
 * A physical print-bed plate - a rounded rectangle with slight thickness -
 * that every model/batch preview sits on top of, so a preview reads as
 * "this is what's on the printer" instead of a model floating over a bare
 * grid floor. Shared by job-model-viewer.tsx (one product) and
 * batch-plate-viewer.tsx (a merged batch), both Z-up scenes with parts
 * resting at z=0, so the plate's top face sits at z=0 too.
 */
export function PrintBedPlate({
  widthMm = BED_WIDTH_MM,
  depthMm = BED_DEPTH_MM,
}: PrintBedPlateProps): JSX.Element {
  const geometry = useMemo(() => buildPlateGeometry(widthMm, depthMm), [widthMm, depthMm])
  const plate = useRef<THREE.MeshStandardMaterial>(null)
  const grid = useRef<THREE.Group>(null)

  // THE PLATE FADES WHEN YOU GO UNDER IT.
  //
  // A solid bed is what makes a preview read as "this is on the printer", and
  // it is also an opaque floor: orbit below it to check the underside of a
  // plank - the side that meets the bed, where a first layer or an engraved
  // back is judged - and the bed is all you can see. The model is right there
  // and the viewer hides it.
  //
  // So the bed's opacity follows the camera. Faded rather than hidden, so the
  // plate's outline still says where the bed is and the model does not appear
  // to float in nothing. Eased over roughly a quarter-second instead of
  // switching at the crossing, which would flash as you orbit along it.
  //
  // Z-UP SCENE: the camera's z is its height, and the plate's top face sits at
  // z = 0 (see the note on this component), so "below the bed" is z < 0.
  useFrame((state, delta) => {
    const material = plate.current
    if (!material) return
    const under = state.camera.position.z < 0
    const target = under ? UNDER_OPACITY : 1
    // Framerate-independent easing: the same feel on 60Hz and 120Hz.
    const eased = material.opacity + (target - material.opacity) * Math.min(1, delta * 9)
    material.opacity = Math.abs(eased - target) < 0.002 ? target : eased
    // Depth must stop being written once it is see-through, or the bed keeps
    // occluding the model it is being made transparent to reveal.
    material.depthWrite = material.opacity > 0.99
    if (grid.current) grid.current.visible = material.opacity > 0.6
  })

  return (
    <group>
      <mesh geometry={geometry} receiveShadow>
        {/* transparent is always on: toggling it recompiles the material, and
            at opacity 1 it renders the same. */}
        <meshStandardMaterial
          ref={plate}
          color="#28282d"
          roughness={0.9}
          metalness={0.1}
          transparent
          opacity={1}
        />
      </mesh>
      {/* Hidden along with the plate - a grid floating over the model is the
          same obstruction in thinner lines. */}
      <group ref={grid}>
        <Grid
          position={[0, 0, 0.05]}
          rotation={[Math.PI / 2, 0, 0]}
          args={[widthMm, depthMm]}
          cellSize={10}
          cellThickness={0.5}
          sectionSize={50}
          sectionThickness={1}
          cellColor="#48484f"
          sectionColor="#63636c"
          infiniteGrid={false}
          followCamera={false}
        />
      </group>
    </group>
  )
}

// UNDER_OPACITY is how much of the bed is left when you are beneath it: enough
// to keep the plate's edges and the sense of a surface, little enough to read
// the model through it.
const UNDER_OPACITY = 0.12

// MARGIN keeps a model just inside the plate's edge rather than exactly
// touching it, so a fitted model doesn't look like it's teetering off.
const MARGIN = 0.92

// fitScaleFor returns a uniform scale (<=1, never scales up) that keeps a
// geometry's XY footprint within the given plate size - so a product larger
// than the physical bed still previews seated on it instead of visibly
// spilling off the edge. Real oversize is still caught for real by the
// backend planner (see internal/production/planner.go's "exceeds the print
// bed's capacity" check); this is a display-only safeguard.
export function fitScaleFor(
  geometry: THREE.BufferGeometry,
  bedWidthMm: number = BED_WIDTH_MM,
  bedDepthMm: number = BED_DEPTH_MM,
): number {
  geometry.computeBoundingBox()
  const box = geometry.boundingBox
  if (!box) return 1
  const width = box.max.x - box.min.x
  const depth = box.max.y - box.min.y
  if (width <= 0 || depth <= 0) return 1
  return Math.min((bedWidthMm * MARGIN) / width, (bedDepthMm * MARGIN) / depth, 1)
}

// centerOnPlate mutates a geometry in place so its XY footprint is centred
// on the origin (matching PrintBedPlate's own centred convention) and its
// bottom face sits at z=0 - correcting for STL files whose own local
// coordinate origin has nothing to do with where the part should sit on the
// bed (e.g. exported from arbitrary CAD/studio space, not bed-placed).
// Only meaningful for a single standalone part - a batch's merged plate
// already carries deliberate bedpack placements between parts that must
// never be individually recentred (see batch-plate-viewer.tsx's separate
// corner-alignment fix instead).
export function centerOnPlate(geometry: THREE.BufferGeometry): void {
  geometry.computeBoundingBox()
  const box = geometry.boundingBox
  if (!box) return
  const centerX = (box.min.x + box.max.x) / 2
  const centerY = (box.min.y + box.max.y) / 2
  geometry.translate(-centerX, -centerY, -box.min.z)
}

// buildPlateGeometry draws a rounded rectangle in the XY plane (this scene's
// bed plane), then extrudes it downward so the top face sits exactly at
// z=0 - the same plane every model's bottom already rests on.
function buildPlateGeometry(widthMm: number, depthMm: number): THREE.ExtrudeGeometry {
  const w = widthMm / 2
  const d = depthMm / 2
  const r = CORNER_RADIUS_MM

  const shape = new THREE.Shape()
  shape.moveTo(-w + r, -d)
  shape.lineTo(w - r, -d)
  shape.quadraticCurveTo(w, -d, w, -d + r)
  shape.lineTo(w, d - r)
  shape.quadraticCurveTo(w, d, w - r, d)
  shape.lineTo(-w + r, d)
  shape.quadraticCurveTo(-w, d, -w, d - r)
  shape.lineTo(-w, -d + r)
  shape.quadraticCurveTo(-w, -d, -w + r, -d)

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: THICKNESS_MM,
    bevelEnabled: false,
    curveSegments: 16,
  })
  geometry.translate(0, 0, -THICKNESS_MM)
  geometry.computeVertexNormals()
  return geometry
}
