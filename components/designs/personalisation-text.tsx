'use client'

import { Text } from '@react-three/drei'
import type { JSX } from 'react'
import type { Vector3 } from 'three'

// Self-hosted Mona Sans (OFL), copied to public/fonts. troika (drei <Text>) reads
// woff2 directly, so no typeface.json generation is needed for the live preview.
const FONT_URL = '/fonts/mona-sans.woff2'

// Just above the top face, so the name reads as applied to the surface.
const SURFACE_LIFT_MM = 0.4

// The preview parameters a customer controls. Millimetre units match the model
// geometry (STL / 3MF are loaded in mm).
export interface PersonalisationPreview {
  text: string
  sizeMM: number
  colour: string
  offsetXMM: number
  offsetYMM: number
}

interface PersonalisationTextProps {
  config: PersonalisationPreview
  boxMin: Vector3
  boxMax: Vector3
}

/**
 * Live 3D preview of a customer's name laid on the top of the model. Visual only:
 * the printable geometry is generated separately at production time, so this never
 * affects cost or the slice - it just shows the customer how their name will look.
 */
export function PersonalisationText({
  config,
  boxMin,
  boxMax,
}: PersonalisationTextProps): JSX.Element | null {
  const label = config.text.trim()
  if (label === '') {
    return null
  }
  const cx = (boxMin.x + boxMax.x) / 2 + config.offsetXMM
  const cy = (boxMin.y + boxMax.y) / 2 + config.offsetYMM
  const z = boxMax.z + SURFACE_LIFT_MM
  return (
    <Text
      font={FONT_URL}
      fontSize={config.sizeMM}
      color={config.colour}
      anchorX="center"
      anchorY="middle"
      position={[cx, cy, z]}
    >
      {label}
    </Text>
  )
}
