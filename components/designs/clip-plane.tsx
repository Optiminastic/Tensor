'use client'

import { useFrame } from '@react-three/fiber'
import { type RefObject } from 'react'
import * as THREE from 'three'

export type ClipAxis = 'x' | 'y' | 'z'

export interface ClipState {
  axis: ClipAxis
  // 0..1 position across the object's bounding box on the chosen axis.
  value: number
  flip: boolean
}

function axisUnit(axis: ClipAxis): THREE.Vector3 {
  return new THREE.Vector3(axis === 'x' ? 1 : 0, axis === 'y' ? 1 : 0, axis === 'z' ? 1 : 0)
}

// buildClipPlane makes the cut plane in an object's LOCAL space: a slice at
// `value` along the chosen axis of its [min,max] box. Without flip the plane
// removes the far (+axis) side, so the camera looks into the cross-section.
export function buildClipPlane(
  clip: ClipState,
  min: THREE.Vector3,
  max: THREE.Vector3,
): THREE.Plane {
  const unit = axisUnit(clip.axis)
  const lo = unit.dot(min)
  const hi = unit.dot(max)
  const pos = lo + (hi - lo) * clip.value
  const point = unit.clone().multiplyScalar(pos)
  const normal = unit.multiplyScalar(clip.flip ? 1 : -1)
  return new THREE.Plane().setFromNormalAndCoplanarPoint(normal, point)
}

interface ClipControllerProps {
  target: RefObject<THREE.Object3D | null>
  worldPlane: THREE.Plane
  localPlane: THREE.Plane
}

// ClipController keeps the world-space clip plane in step with the target's world
// transform each frame - the mesh viewer scales via <Bounds>, so a static plane
// would drift. Copy-then-transform is cheap (no geometry traversal).
export function ClipController({ target, worldPlane, localPlane }: ClipControllerProps): null {
  useFrame(() => {
    const obj = target.current
    if (!obj) return
    obj.updateMatrixWorld()
    worldPlane.copy(localPlane).applyMatrix4(obj.matrixWorld)
  })
  return null
}
