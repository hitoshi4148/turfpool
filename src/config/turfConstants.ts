/**
 * Central place for analysis thresholds and interpolation.
 * Tune here without touching core algorithms.
 */

function resolveAnalysisMaxEdgePx(): number {
  if (typeof navigator === 'undefined') return 768
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number })
    .deviceMemory
  const lowMem = typeof deviceMemory === 'number' && deviceMemory <= 4
  return mobile || lowMem ? 320 : 768
}

/** Longest edge after client resize (px). Mobile / low-RAM devices use a smaller cap. */
export const ANALYSIS_MAX_EDGE_PX = resolveAnalysisMaxEdgePx()

/** Reject camera files above this size before decode (bytes). */
export const MAX_UPLOAD_BYTES = 24 * 1024 * 1024

/** Thumbnail circle on the pitch map (px, longest edge). */
export const PREVIEW_MAX_EDGE_PX = 96

/**
 * GCP via HSV grass range（H: 0–179, S/V: 0–255、indices.ts の近似変換に合わせる）。
 */
export const GCP_HSV_LOWER = { h: 35, s: 40, v: 40 } as const
export const GCP_HSV_UPPER = { h: 90, s: 255, v: 255 } as const

/** |G + R − B| must exceed this (in 0–1 float space) for VARI pixels. */
export const VARI_DENOM_EPS = 0.02

/**
 * Color uniformity (G の標準偏差、0–255 スケール)。
 * ゴルフグリーンより緩く、サッカーグラウンドの縞・刈り差・光ムラを許容するため分母を大きめに。
 */
export const UNIFORMITY_STD_SCALE = 88

/**
 * Texture Quality: Sobel 平均勾配 `meanMag` に対し score = 100·exp(-meanMag / REF)。
 * 旧リニア式は実写芝でほぼ常に 0 に張り付くため、サッカー芝の典型的な粗さレンジで 0–100 が使えるよう指数で圧縮。
 */
export const TEXTURE_SOBEL_DECAY_REF = 292

/** Grid resolution for pool heightfield (adjust for quality vs GPU). */
export const POOL_PLANE_SEGMENTS_X = 40
export const POOL_PLANE_SEGMENTS_Y = 28

/** World units; aspect matches IFAB 105m×68m pitch used in 2D UI. */
export const POOL_PLANE_W = 3.2
export const POOL_PLANE_H = 2

/**
 * Vertex displacement along plane normal (local +Z → world “up” after mesh tilt)
 * for normalized metric 0…1. Higher value ⇒ water surface rises further above the floor.
 */
export const POOL_METRIC_DEPTH_AMPLITUDE = 0.4

/** White pitch lines sit on pool bottom (local +Z, above floor to avoid z-fighting). */
export const POOL_FLOOR_LINE_Z = 0.004

/** Minimum height of water surface above flat pool bottom. */
export const POOL_WATER_SURFACE_BASE = 0.068
