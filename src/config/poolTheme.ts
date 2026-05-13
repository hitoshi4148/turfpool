import type { Color } from 'three'
import { Color as ThreeColor } from 'three'

/**
 * Heatmap stops: low → mid → high (visual tuning only).
 */
export const POOL_HEAT_LOW = '#dc2626'
export const POOL_HEAT_MID = '#facc15'
export const POOL_HEAT_HIGH = '#06b6d4'

export function poolHeatColor(t: number): Color {
  const clamped = Math.min(1, Math.max(0, t))
  const low = new ThreeColor(POOL_HEAT_LOW)
  const mid = new ThreeColor(POOL_HEAT_MID)
  const high = new ThreeColor(POOL_HEAT_HIGH)
  const c = new ThreeColor()
  if (clamped < 0.5) {
    c.lerpColors(low, mid, clamped * 2)
  } else {
    c.lerpColors(mid, high, (clamped - 0.5) * 2)
  }
  return c
}

/** Vertex noise amplitude for Texture Quality “rough” areas (world units). */
export const POOL_TEXTURE_ROUGH_DISPLACE = 0.06
