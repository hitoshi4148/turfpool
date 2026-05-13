import { Line } from '@react-three/drei'
import * as THREE from 'three'
import {
  POOL_FLOOR_LINE_Z,
  POOL_PLANE_H,
  POOL_PLANE_W,
} from '../../config/turfConstants'

const PW = POOL_PLANE_W
const PH = POOL_PLANE_H

/** Pitch markings on pool bottom (below water surface). */
const Z = POOL_FLOOR_LINE_Z

function fl(sx: number, sy: number): THREE.Vector3 {
  return new THREE.Vector3((sx / 105 - 0.5) * PW, (sy / 68 - 0.5) * PH, Z)
}

const LINE = {
  color: 'rgba(255,255,255,0.38)' as const,
  lineWidth: 1.1,
  transparent: true,
  depthWrite: false,
  renderOrder: 2,
}

/**
 * IFAB 105×68 m と同じ比率の白線。プール底面（PoolFloorMesh）上に描画。
 */
export function PoolPitchMarkings3D() {
  const paDepth = 16.5
  const paWidth = 40.32
  const gaDepth = 5.5
  const gaWidth = 18.32
  const paY = (68 - paWidth) / 2
  const gaY = (68 - gaWidth) / 2

  const halfway: THREE.Vector3[] = [fl(52.5, 0), fl(52.5, 68)]

  const circlePts: THREE.Vector3[] = []
  const segs = 72
  for (let i = 0; i <= segs; i++) {
    const t = (i / segs) * Math.PI * 2
    const mx = 9.15 * Math.cos(t)
    const my = 9.15 * Math.sin(t)
    circlePts.push(fl(52.5 + mx, 34 + my))
  }

  const rectLoop = (sx0: number, sy0: number, w: number, h: number) => {
    const a = fl(sx0, sy0)
    const b = fl(sx0 + w, sy0)
    const c = fl(sx0 + w, sy0 + h)
    const d = fl(sx0, sy0 + h)
    return [a, b, c, d, a]
  }

  const leftPa = rectLoop(0, paY, paDepth, paWidth)
  const rightPa = rectLoop(105 - paDepth, paY, paDepth, paWidth)
  const leftGa = rectLoop(0, gaY, gaDepth, gaWidth)
  const rightGa = rectLoop(105 - gaDepth, gaY, gaDepth, gaWidth)

  const outerTouch = rectLoop(0, 0, 105, 68)
  const innerGuide = rectLoop(10.5, 6.8, 84, 54.4)

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <Line points={outerTouch} {...LINE} />
      <Line points={innerGuide} color="rgba(255,255,255,0.32)" lineWidth={0.95} transparent depthWrite={false} renderOrder={2} />
      <Line points={halfway} {...LINE} />
      <Line points={circlePts} {...LINE} />
      <Line points={leftPa} {...LINE} />
      <Line points={rightPa} {...LINE} />
      <Line points={leftGa} {...LINE} />
      <Line points={rightGa} {...LINE} />
    </group>
  )
}
