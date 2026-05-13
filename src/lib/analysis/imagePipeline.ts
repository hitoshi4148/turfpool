import { ANALYSIS_MAX_EDGE_PX } from '../../config/turfConstants'

/**
 * Decode file → canvas, uniform scale so longest edge ≤ ANALYSIS_MAX_EDGE_PX.
 */
export async function fileToAnalysisCanvas(file: File): Promise<HTMLCanvasElement> {
  const bmp = await createImageBitmap(file)
  try {
    const maxEdge = Math.max(bmp.width, bmp.height)
    const scale = maxEdge > ANALYSIS_MAX_EDGE_PX ? ANALYSIS_MAX_EDGE_PX / maxEdge : 1
    const w = Math.max(1, Math.round(bmp.width * scale))
    const h = Math.max(1, Math.round(bmp.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D not available')
    ctx.drawImage(bmp, 0, 0, w, h)
    return canvas
  } finally {
    bmp.close()
  }
}
