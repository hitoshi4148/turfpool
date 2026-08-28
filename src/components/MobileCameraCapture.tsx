import { useCallback, useEffect, useRef, useState } from 'react'
import { ANALYSIS_MAX_EDGE_PX } from '../config/turfConstants'
import { captureVideoFrameToCanvas } from '../lib/analysis/imagePipeline'

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop())
}

interface MobileCameraCaptureProps {
  slotLabel: string
  open: boolean
  onClose: () => void
  onCapture: (canvas: HTMLCanvasElement) => void
}

export function MobileCameraCapture({
  slotLabel,
  open,
  onClose,
  onCapture,
}: MobileCameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!open) {
      stopStream(streamRef.current)
      streamRef.current = null
      setReady(false)
      setError(null)
      return
    }

    let cancelled = false

    async function startCamera() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error(
            'このブラウザはアプリ内カメラに対応していません。「画像」から選んでください。',
          )
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 640, max: 960 },
            height: { ideal: 480, max: 720 },
          },
          audio: false,
        })

        if (cancelled) {
          stopStream(stream)
          return
        }

        streamRef.current = stream
        const video = videoRef.current
        if (!video) {
          stopStream(stream)
          return
        }

        video.srcObject = stream
        await video.play()
        setReady(true)
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : 'カメラを起動できませんでした'
        setError(
          /NotAllowed|Permission/i.test(msg)
            ? 'カメラの使用が許可されていません。ブラウザ設定でカメラを許可してください。'
            : msg,
        )
      }
    }

    void startCamera()

    return () => {
      cancelled = true
      stopStream(streamRef.current)
      streamRef.current = null
    }
  }, [open])

  const handleCapture = useCallback(() => {
    const video = videoRef.current
    if (!video || !ready) return
    const canvas = captureVideoFrameToCanvas(video, ANALYSIS_MAX_EDGE_PX)
    stopStream(streamRef.current)
    streamRef.current = null
    onCapture(canvas)
    onClose()
  }, [onCapture, onClose, ready])

  const handleClose = useCallback(() => {
    stopStream(streamRef.current)
    streamRef.current = null
    onClose()
  }, [onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-black"
      role="dialog"
      aria-modal="true"
      aria-label={`${slotLabel}の撮影`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
        <p className="text-sm font-medium text-white">{slotLabel}を撮影</p>
        <button
          type="button"
          onClick={handleClose}
          className="rounded-lg px-3 py-1.5 text-sm text-slate-300 hover:bg-white/10"
        >
          キャンセル
        </button>
      </div>

      <div className="relative min-h-0 flex-1 bg-black">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="h-full w-full object-cover"
        />
        {!ready && !error ? (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-slate-300">
            カメラを起動中…
          </p>
        ) : null}
        {error ? (
          <p className="absolute inset-x-4 top-1/2 -translate-y-1/2 rounded-lg bg-red-950/90 p-3 text-center text-sm text-red-100">
            {error}
          </p>
        ) : null}
      </div>

      <div className="border-t border-white/10 px-4 py-4">
        <p className="mb-3 text-center text-xs text-slate-400">
          低解像度で撮影し、端末内で解析します（外部送信なし）
        </p>
        <button
          type="button"
          disabled={!ready}
          onClick={handleCapture}
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-cyan-600 text-sm font-semibold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="シャッター"
        >
          ●
        </button>
      </div>
    </div>
  )
}
