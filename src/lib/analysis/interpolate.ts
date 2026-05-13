import type { MetricId, PitchPointId, TurfIndices } from '../../types'
import { PITCH_POINT_ORDER } from '../../types'

type Vec2 = readonly [number, number]

const TL: Vec2 = [0, 0]
const TR: Vec2 = [1, 0]
const BR: Vec2 = [1, 1]
const BL: Vec2 = [0, 1]
const C: Vec2 = [0.5, 0.5]

const TRIANGLES: readonly (readonly [Vec2, Vec2, Vec2, PitchPointId, PitchPointId, PitchPointId])[] =
  [
    [TL, TR, C, 'tl', 'tr', 'c'],
    [TR, BR, C, 'tr', 'br', 'c'],
    [BR, BL, C, 'br', 'bl', 'c'],
    [BL, TL, C, 'bl', 'tl', 'c'],
  ]

function barycentricWeights(
  p: Vec2,
  a: Vec2,
  b: Vec2,
  c: Vec2,
): [number, number, number] | null {
  const [x, y] = p
  const [x1, y1] = a
  const [x2, y2] = b
  const [x3, y3] = c
  const denom = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3)
  if (Math.abs(denom) < 1e-10) return null
  const w1 = ((y2 - y3) * (x - x3) + (x3 - x2) * (y - y3)) / denom
  const w2 = ((y3 - y1) * (x - x3) + (x1 - x3) * (y - y3)) / denom
  const w3 = 1 - w1 - w2
  if (w1 >= -1e-6 && w2 >= -1e-6 && w3 >= -1e-6) {
    return [w1, w2, w3]
  }
  return null
}

/**
 * Five-point fan from center (fixed MVP topology). u,v in [0,1].
 */
export function interpolateMetricAt(
  u: number,
  v: number,
  byPoint: Record<PitchPointId, number>,
): number {
  const p: Vec2 = [u, v]
  for (const [a, b, c, ia, ib, ic] of TRIANGLES) {
    const w = barycentricWeights(p, a, b, c)
    if (w) {
      const [wa, wb, wc] = w
      return wa * byPoint[ia] + wb * byPoint[ib] + wc * byPoint[ic]
    }
  }
  const vals = PITCH_POINT_ORDER.map((id) => byPoint[id])
  return vals.reduce((s, x) => s + x, 0) / vals.length
}

export function metricValuesRecord(
  indicesByPoint: Record<PitchPointId, TurfIndices>,
  metric: MetricId,
): Record<PitchPointId, number> {
  const out = {} as Record<PitchPointId, number>
  for (const id of PITCH_POINT_ORDER) {
    out[id] = indicesByPoint[id][metric]
  }
  return out
}

export function minMaxNormalize(
  value: number,
  minV: number,
  maxV: number,
): number {
  if (maxV <= minV) return 0.5
  return (value - minV) / (maxV - minV)
}
