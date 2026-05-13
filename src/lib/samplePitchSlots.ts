import { analyzeTurfImage } from './analysis/indices'
import type { PitchPointId, PointSlotState, TurfIndices } from '../types'
import { PITCH_POINT_ORDER } from '../types'

const SLOT_LABEL: Record<PitchPointId, string> = {
  tl: '左上',
  tr: '右上',
  bl: '左下',
  br: '右下',
  c: '中央',
}

/** 解析・プレビュー用の最小サイズ（メモリ節約） */
const SW = 56
const SH = 42

function drawWatermark(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save()
  ctx.translate(w / 2, h / 2)
  ctx.rotate(-0.32)
  ctx.font = 'bold 10px system-ui,sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'
  ctx.lineWidth = 2.5
  ctx.strokeText('サンプル', 0, 0)
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.fillText('サンプル', 0, 0)
  ctx.restore()
}

function fillGrassNoise(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  baseR: number,
  baseG: number,
  baseB: number,
  amp: number,
  seed: number,
) {
  const img = ctx.createImageData(w, h)
  const d = img.data
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const n =
        Math.sin(x * 0.35 + seed) * Math.cos(y * 0.28 + seed * 0.7) * amp
      d[i] = Math.min(255, Math.max(0, baseR + n))
      d[i + 1] = Math.min(255, Math.max(0, baseG + n))
      d[i + 2] = Math.min(255, Math.max(0, baseB + n))
      d[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
}

function drawStripeBands(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  a: [number, number, number],
  b: [number, number, number],
) {
  const band = 4
  for (let y = 0; y < h; y++) {
    const t = Math.floor(y / band) % 2
    const [r, g, bl] = t === 0 ? a : b
    ctx.fillStyle = `rgb(${r},${g},${bl})`
    ctx.fillRect(0, y, w, 1)
  }
}

/**
 * プール状ビューで差が出るよう、5地点で色相・ムラ・土混入を変えたミニ芝画像を生成する。
 */
function createSampleCanvas(id: PitchPointId): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = SW
  canvas.height = SH
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Canvas 2D が使えません')

  switch (id) {
    case 'tl': {
      // 均一めの良芝
      fillGrassNoise(ctx, SW, SH, 42, 128, 52, 14, 1.2)
      break
    }
    case 'tr': {
      // 縞状ムラ（色均一性を下げやすい）
      drawStripeBands(ctx, SW, SH, [48, 132, 54], [38, 108, 46])
      break
    }
    case 'bl': {
      // 中間＋粗いノイズ（テクスチャ寄り）
      fillGrassNoise(ctx, SW, SH, 46, 118, 48, 22, 2.3)
      break
    }
    case 'br': {
      // 土・枯れが混じる（GCP 低下）
      ctx.fillStyle = 'rgb(48,120,50)'
      ctx.fillRect(0, 0, SW, SH)
      ctx.fillStyle = 'rgb(108,78,42)'
      ctx.fillRect(0, 0, SW * 0.35, SH)
      ctx.fillRect(SW * 0.62, SH * 0.48, SW * 0.4, SH * 0.52)
      break
    }
    case 'c': {
      // 中央：明るく滑らか
      fillGrassNoise(ctx, SW, SH, 50, 138, 58, 5, 2.8)
      break
    }
  }

  drawWatermark(ctx, SW, SH)
  return canvas
}

function slotFromCanvas(
  id: PitchPointId,
  canvas: HTMLCanvasElement,
): PointSlotState {
  const indices: TurfIndices = analyzeTurfImage(canvas)
  const previewUrl = canvas.toDataURL('image/jpeg', 0.42)
  return {
    pointId: id,
    label: SLOT_LABEL[id],
    previewUrl,
    indices,
    error: null,
    busy: false,
    isSample: true,
  }
}

/** アプリ起動時：5地点とも解析済みのサンプル画像で埋める */
export function buildInitialSampleSlots(): Record<PitchPointId, PointSlotState> {
  return PITCH_POINT_ORDER.reduce(
    (acc, id) => {
      const canvas = createSampleCanvas(id)
      acc[id] = slotFromCanvas(id, canvas)
      return acc
    },
    {} as Record<PitchPointId, PointSlotState>,
  )
}
