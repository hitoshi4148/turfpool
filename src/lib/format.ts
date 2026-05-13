import type { MetricId } from '../types'

/** MVP: 全指標とも小数第2位（表示用）。 */
export function formatMetricValue(_metric: MetricId, value: number): string {
  return value.toFixed(2)
}

/**
 * プール状ビューの目盛りなど：整数部がある（|値|≥1）ときは小数1桁、それ以外は2桁。
 */
export function formatMetricValueShort(_metric: MetricId, value: number): string {
  return Math.abs(value) >= 1 ? value.toFixed(1) : value.toFixed(2)
}
