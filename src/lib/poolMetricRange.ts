import type { MetricId, PitchPointId, TurfIndices } from '../types'
import { PITCH_POINT_ORDER } from '../types'

export function poolMetricMinMax(
  indicesByPoint: Record<PitchPointId, TurfIndices>,
  metric: MetricId,
): { min: number; max: number } {
  const vals = PITCH_POINT_ORDER.map((id) => indicesByPoint[id][metric])
  return { min: Math.min(...vals), max: Math.max(...vals) }
}
