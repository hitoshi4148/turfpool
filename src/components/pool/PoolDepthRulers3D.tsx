import { Billboard, Line, Text } from '@react-three/drei'
import * as THREE from 'three'
import { formatMetricValueShort } from '../../lib/format'
import { poolMetricMinMax } from '../../lib/poolMetricRange'
import type { MetricId, PitchPointId, TurfIndices } from '../../types'
import {
  POOL_FLOOR_LINE_Z,
  POOL_METRIC_DEPTH_AMPLITUDE,
  POOL_PLANE_H,
  POOL_PLANE_W,
  POOL_WATER_SURFACE_BASE,
} from '../../config/turfConstants'

const PW = POOL_PLANE_W
const PH = POOL_PLANE_H

/** 水面の「低・中・高」に対応する Z（ローカル、メッシュと同じ水位モデル・テクスチャ凹凸は含めない） */
function waterSurfaceZForNorm(norm: number): number {
  return POOL_WATER_SURFACE_BASE + norm * POOL_METRIC_DEPTH_AMPLITUDE
}

const TICK_HALF = 0.078

const RULER_LINE = {
  color: 'rgba(226,236,245,0.88)' as const,
  lineWidth: 1.35,
  transparent: true,
  depthWrite: false,
  /** 池メッシュより後に描き、デプスで隠さない */
  depthTest: false,
  renderOrder: 12,
}

function cornerBase(sx: number, sy: number): [number, number] {
  return [(sx / 105 - 0.5) * PW, (sy / 68 - 0.5) * PH]
}

/** 3D テキスト（世界単位）。Html は平面内オフセットで透視と目盛りの Z が画面上ずれるため使わない。 */
const RULER_TEXT_SIZE = 0.052

function formatMetricLabel(metric: MetricId, value: number): string {
  return `${formatMetricValueShort(metric, value)}${metric === 'gcp' ? '%' : ''}`
}

export interface DepthRulerMark {
  z: number
  text: string
}

function CornerDepthRuler({
  sx,
  sy,
  marks,
  spineTopZ,
}: {
  sx: number
  sy: number
  marks: DepthRulerMark[]
  spineTopZ: number
}) {
  const [lx, ly] = cornerBase(sx, sy)
  const zFloor = POOL_FLOOR_LINE_Z

  const spine: THREE.Vector3[] = [
    new THREE.Vector3(lx, ly, zFloor),
    new THREE.Vector3(lx, ly, spineTopZ),
  ]

  const tickSegments: THREE.Vector3[][] = []
  for (const m of marks) {
    const zk = m.z
    tickSegments.push([
      new THREE.Vector3(lx - TICK_HALF, ly, zk),
      new THREE.Vector3(lx + TICK_HALF, ly, zk),
    ])
    tickSegments.push([
      new THREE.Vector3(lx, ly - TICK_HALF, zk),
      new THREE.Vector3(lx, ly + TICK_HALF, zk),
    ])
  }

  return (
    <group>
      <Line points={spine} {...RULER_LINE} />
      {tickSegments.map((pts, i) => (
        <Line key={i} points={pts} {...RULER_LINE} lineWidth={1.15} />
      ))}
      {marks.map((m, i) => (
        <Billboard key={`${m.text}-${i}`} position={[lx, ly, m.z]} follow>
          <Text
            fontSize={RULER_TEXT_SIZE}
            color="#e2e8f0"
            anchorX={sx < 52.5 ? 'right' : 'left'}
            anchorY={sy < 34 ? 'bottom' : 'top'}
            outlineWidth={0.012}
            outlineColor="#0f172a"
            material-depthTest={false}
            material-depthWrite={false}
            renderOrder={14}
            characters="0123456789.-%"
          >
            {m.text}
          </Text>
        </Billboard>
      ))}
    </group>
  )
}

interface PoolDepthRulers3DProps {
  indicesByPoint: Record<PitchPointId, TurfIndices>
  metric: MetricId
}

/** Z 方向の目盛り：現在の指標について 5 点の最小・中央・最大に対応する値を表示 */
export function PoolDepthRulers3D({
  indicesByPoint,
  metric,
}: PoolDepthRulers3DProps) {
  const { min, max } = poolMetricMinMax(indicesByPoint, metric)
  const mid = (min + max) / 2

  const marks: DepthRulerMark[] = [
    {
      z: waterSurfaceZForNorm(0),
      text: formatMetricLabel(metric, min),
    },
    {
      z: waterSurfaceZForNorm(0.5),
      text: formatMetricLabel(metric, mid),
    },
    {
      z: waterSurfaceZForNorm(1),
      text: formatMetricLabel(metric, max),
    },
  ]

  const spineTopZ =
    marks[marks.length - 1].z + Math.max(0.02, POOL_METRIC_DEPTH_AMPLITUDE * 0.06)

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <CornerDepthRuler sx={0} sy={0} marks={marks} spineTopZ={spineTopZ} />
      <CornerDepthRuler sx={105} sy={0} marks={marks} spineTopZ={spineTopZ} />
      <CornerDepthRuler sx={105} sy={68} marks={marks} spineTopZ={spineTopZ} />
      <CornerDepthRuler sx={0} sy={68} marks={marks} spineTopZ={spineTopZ} />
    </group>
  )
}
