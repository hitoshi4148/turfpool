import imageCompression from 'browser-image-compression'
import {
  ANALYSIS_MAX_EDGE_PX,
  MAX_UPLOAD_BYTES,
  PREVIEW_MAX_EDGE_PX,
} from '../../config/turfConstants'

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('画像の読み込みに失敗しました'))
    img.src = url
  })
}

function drawToCanvas(
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  maxEdge: number,
): HTMLCanvasElement {
  const long = Math.max(srcW, srcH, 1)
  const scale = Math.min(1, maxEdge / long)
  const w = Math.max(1, Math.round(srcW * scale))
  const h = Math.max(1, Math.round(srcH * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D not available')
  ctx.drawImage(source, 0, 0, w, h)
  return canvas
}

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

async function fileToAnalysisCanvasViaCompression(
  file: File,
  maxEdge: number,
  useWebWorker: boolean,
): Promise<HTMLCanvasElement> {
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.28,
    maxWidthOrHeight: maxEdge,
    useWebWorker,
    fileType: 'image/jpeg',
    initialQuality: 0.7,
    alwaysKeepResolution: false,
  })
  const url = URL.createObjectURL(compressed)
  try {
    const img = await loadImage(url)
    const canvas = drawToCanvas(img, img.width, img.height, maxEdge)
    img.src = ''
    return canvas
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function fileToAnalysisCanvasViaBitmap(
  file: File,
  maxEdge: number,
): Promise<HTMLCanvasElement> {
  const bmp = await decodeBitmapResized(file, maxEdge)
  try {
    return drawToCanvas(bmp, bmp.width, bmp.height, maxEdge)
  } finally {
    bmp.close()
  }
}

/**
 * Decode file → canvas, uniform scale so longest edge ≤ ANALYSIS_MAX_EDGE_PX.
 */
export async function fileToAnalysisCanvas(
  file: File,
): Promise<HTMLCanvasElement> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `写真ファイルが大きすぎます（${Math.round(file.size / 1024 / 1024)}MB）。カメラの解像度を下げるか、別の写真を選んでください。`,
    )
  }

  const maxEdge = ANALYSIS_MAX_EDGE_PX
  const canUseWorker = typeof Worker !== 'undefined'

  if (canUseWorker) {
    try {
      return await fileToAnalysisCanvasViaCompression(file, maxEdge, true)
    } catch {
      // Worker path failed — retry on main thread at the same cap.
    }
  }

  try {
    return await fileToAnalysisCanvasViaCompression(file, maxEdge, false)
  } catch {
    // Last resort: createImageBitmap resize (Safari / older browsers).
  }

  return fileToAnalysisCanvasViaBitmap(file, maxEdge)
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

export function isLikelyMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}
