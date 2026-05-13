import {
  GCP_HSV_LOWER,
  GCP_HSV_UPPER,
  TEXTURE_SOBEL_DECAY_REF,
  UNIFORMITY_STD_SCALE,
  VARI_DENOM_EPS,
} from '../../config/turfConstants'
import type { TurfIndices } from '../../types'

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x))
}

/**
 * RGB(0–255) → OpenCV 8-bit HSV に近い値（H:0–179, S,V:0–255）
 */
function rgbToHsvApprox(r: number, g: number, b: number) {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const d = max - min
  const v = max
  const s = max === 0 ? 0 : d / max
  let hNorm = 0
  if (d !== 0) {
    if (max === rn) {
      hNorm = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6
    } else if (max === gn) {
      hNorm = ((bn - rn) / d + 2) / 6
    } else {
      hNorm = ((rn - gn) / d + 4) / 6
    }
  }
  return {
    h: Math.min(179, Math.round(hNorm * 180)),
    s: Math.round(s * 255),
    v: Math.round(v * 255),
  }
}

function grayByte(r: number, g: number, b: number): number {
  return Math.round(0.299 * r + 0.587 * g + 0.114 * b)
}

function sobelMeanMagnitude(gray: Uint8Array, w: number, h: number): number {
  let sum = 0
  let n = 0
  for (let y = 1; y < h - 1; y++) {
    const row = y * w
    for (let x = 1; x < w - 1; x++) {
      const i = row + x
      const gx =
        -gray[i - w - 1] +
        gray[i - w + 1] -
        2 * gray[i - 1] +
        2 * gray[i + 1] -
        gray[i + w - 1] +
        gray[i + w + 1]
      const gy =
        -gray[i - w - 1] -
        2 * gray[i - w] -
        gray[i - w + 1] +
        gray[i + w - 1] +
        2 * gray[i + w] +
        gray[i + w + 1]
      sum += Math.hypot(gx, gy)
      n++
    }
  }
  return n > 0 ? sum / n : 0
}

/**
 * ブラウザ標準のみ（OpenCV.js なし）。メインスレッド負荷は 768px 程度で数 ms〜数十 ms 程度。
 */
export function analyzeTurfImage(canvas: HTMLCanvasElement): TurfIndices {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Canvas 2D が使えません')
  const { width: w, height: h } = canvas
  if (w < 2 || h < 2) throw new Error('画像が小さすぎます')

  const im = ctx.getImageData(0, 0, w, h)
  const d = im.data
  const nPx = w * h

  const gray = new Uint8Array(nPx)
  let gcpCount = 0
  let exgSum = 0
  let variSum = 0
  let variN = 0
  let maskSumG = 0
  let maskSumG2 = 0
  let maskN = 0

  for (let i = 0; i < nPx; i++) {
    const p = i * 4
    const r = d[p]
    const g = d[p + 1]
    const b = d[p + 2]
    gray[i] = grayByte(r, g, b)

    const { h: hh, s, v } = rgbToHsvApprox(r, g, b)
    const grass =
      hh >= GCP_HSV_LOWER.h &&
      hh <= GCP_HSV_UPPER.h &&
      s >= GCP_HSV_LOWER.s &&
      s <= GCP_HSV_UPPER.s &&
      v >= GCP_HSV_LOWER.v &&
      v <= GCP_HSV_UPPER.v
    if (grass) {
      gcpCount++
      maskSumG += g
      maskSumG2 += g * g
      maskN++
    }

    const rf = r / 255
    const gf = g / 255
    const bf = b / 255
    exgSum += 2 * gf - rf - bf

    const denom = gf + rf - bf
    if (Math.abs(denom) >= VARI_DENOM_EPS) {
      variSum += (gf - rf) / denom
      variN++
    }
  }

  const gcp = (100 * gcpCount) / nPx
  const exg = exgSum / nPx
  const vari = variN > 0 ? variSum / variN : 0

  let colorUniformity = 0
  if (maskN > 0) {
    const meanG = maskSumG / maskN
    const varG = Math.max(0, maskSumG2 / maskN - meanG * meanG)
    const stdG = Math.sqrt(varG)
    colorUniformity = clamp01(1 - stdG / UNIFORMITY_STD_SCALE) * 100
  } else {
    let sumG = 0
    let sumG2 = 0
    for (let i = 0; i < nPx; i++) {
      const g = d[i * 4 + 1]
      sumG += g
      sumG2 += g * g
    }
    const meanG = sumG / nPx
    const varG = Math.max(0, sumG2 / nPx - meanG * meanG)
    const stdG = Math.sqrt(varG)
    colorUniformity = clamp01(1 - stdG / UNIFORMITY_STD_SCALE) * 100
  }

  const meanMag = sobelMeanMagnitude(gray, w, h)
  const textureQuality =
    clamp01(Math.exp(-meanMag / TEXTURE_SOBEL_DECAY_REF)) * 100

  return {
    gcp,
    exg,
    vari,
    colorUniformity,
    textureQuality,
  }
}
