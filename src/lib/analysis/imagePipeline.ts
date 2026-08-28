import {
  ANALYSIS_MAX_EDGE_PX,
  PREVIEW_MAX_EDGE_PX,
} from '../../config/turfConstants'

/**
 * Decode with resize when supported so phone camera photos do not land in RAM at full resolution.
 */
async function decodeBitmapResized(
  file: File,
  maxEdge: number,
): Promise<ImageBitmap> {
  let bmp = await createImageBitmap(file, {
    resizeWidth: maxEdge,
    resizeQuality: 'medium',
  })
  if (Math.max(bmp.width, bmp.height) > maxEdge) {
    bmp.close()
    bmp = await createImageBitmap(file, {
      resizeHeight: maxEdge,
      resizeQuality: 'medium',
    })
  }
  return bmp
}

/**
 * Decode file → canvas, uniform scale so longest edge ≤ ANALYSIS_MAX_EDGE_PX.
 */
export async function fileToAnalysisCanvas(
  file: File,
): Promise<HTMLCanvasElement> {
  const bmp = await decodeBitmapResized(file, ANALYSIS_MAX_EDGE_PX)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = bmp.width
    canvas.height = bmp.height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D not available')
    ctx.drawImage(bmp, 0, 0)
    return canvas
  } finally {
    bmp.close()
  }
}

/** Small JPEG data URL for the pitch marker thumbnail (not the original file). */
export function canvasToPreviewDataUrl(
  canvas: HTMLCanvasElement,
  maxEdge = PREVIEW_MAX_EDGE_PX,
): string {
  const long = Math.max(canvas.width, canvas.height)
  const scale = long > maxEdge ? maxEdge / long : 1
  const w = Math.max(1, Math.round(canvas.width * scale))
  const h = Math.max(1, Math.round(canvas.height * scale))

  if (w === canvas.width && h === canvas.height) {
    return canvas.toDataURL('image/jpeg', 0.72)
  }

  const preview = document.createElement('canvas')
  preview.width = w
  preview.height = h
  const ctx = preview.getContext('2d')
  if (!ctx) return canvas.toDataURL('image/jpeg', 0.72)
  ctx.drawImage(canvas, 0, 0, w, h)
  return preview.toDataURL('image/jpeg', 0.72)
}
