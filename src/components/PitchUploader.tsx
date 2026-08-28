import { useCallback, useId, useLayoutEffect, useRef, useState } from 'react'
import { analyzeTurfImage } from '../lib/analysis/indices'
import {
  canvasToPreviewDataUrl,
  fileToAnalysisCanvas,
  isLikelyMobileDevice,
} from '../lib/analysis/imagePipeline'
import { buildInitialSampleSlots } from '../lib/samplePitchSlots'
import {
  PITCH_POINT_ORDER,
  type PitchPointId,
  type PointSlotState,
  type TurfIndices,
} from '../types'
import { MetricPanel } from './MetricPanel'
import { MobileCameraCapture } from './MobileCameraCapture'

/** IFAB 国際試合用の最大寸法（m）に合わせたピッチ白線。viewBox 105×68 = 長手が左右ゴール。 */
function PitchMarkingsSvg() {
  const L = 105
  const W = 68
  const midX = L / 2
  const paDepth = 16.5
  const paWidth = 40.32
  const gaDepth = 5.5
  const gaWidth = 18.32
  const centerCircleR = 9.15
  const paY = (W - paWidth) / 2
  const gaY = (W - gaWidth) / 2
  const stroke = 'rgba(255,255,255,0.48)'

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-[1] h-full w-full"
      viewBox={`0 0 ${L} ${W}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <g
        fill="none"
        stroke={stroke}
        strokeWidth={0.32}
        strokeLinejoin="miter"
        strokeLinecap="square"
      >
        <line x1={midX} y1={0} x2={midX} y2={W} />
        <circle cx={midX} cy={W / 2} r={centerCircleR} />
        <rect x={0} y={paY} width={paDepth} height={paWidth} />
        <rect x={L - paDepth} y={paY} width={paDepth} height={paWidth} />
        <rect x={0} y={gaY} width={gaDepth} height={gaWidth} />
        <rect x={L - gaDepth} y={gaY} width={gaDepth} height={gaWidth} />
      </g>
    </svg>
  )
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 7h3l2-2h6l2 2h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  )
}

type PanelAlign = 'start' | 'center' | 'end'

function SlotMetricsAccordion({
  indices,
  open,
  onOpenChange,
  opensAbove,
  align,
}: {
  indices: TurfIndices | null
  open: boolean
  onOpenChange: (open: boolean) => void
  opensAbove: boolean
  align: PanelAlign
}) {
  const panelId = useId()

  const alignClass =
    align === 'start'
      ? 'left-0'
      : align === 'end'
        ? 'right-0'
        : 'left-1/2 -translate-x-1/2'

  const panelBase =
    'absolute z-[100] w-[min(14rem,calc(100vw-2rem))] max-h-[min(55vh,24rem)] overflow-y-auto rounded-md bg-slate-950/95 px-2 py-2 text-left shadow-xl ring-1 ring-white/15 backdrop-blur-sm'

  const panelClass = opensAbove
    ? `${panelBase} ${alignClass} mb-1 max-h-[min(42vh,15rem)] bottom-full`
    : `${panelBase} ${alignClass} mt-1 top-full`

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        aria-controls={panelId}
        className="rounded-full bg-slate-950/85 px-2 py-0.5 text-[0.6rem] font-medium text-slate-200 ring-1 ring-white/15 transition hover:bg-slate-900/90 sm:text-[0.65rem]"
      >
        {open ? '指標▲' : '指標▼'}
      </button>
      {open ? (
        <div id={panelId} role="region" className={panelClass}>
          <MetricPanel indices={indices} compact />
        </div>
      ) : null}
    </div>
  )
}

/** 指標パネルの水平位置（ピッチ端では見切れないよう寄せる） */
const PANEL_ALIGN: Record<PitchPointId, PanelAlign> = {
  tl: 'start',
  tr: 'end',
  bl: 'start',
  br: 'end',
  c: 'center',
}

/** ピッチ上のカメラマーク位置（中心基準） */
const MARKER_POS: Record<PitchPointId, string> = {
  tl: 'left-[6%] top-[8%]',
  tr: 'left-[94%] top-[8%]',
  bl: 'left-[6%] top-[90%]',
  br: 'left-[94%] top-[90%]',
  c: 'left-1/2 top-1/2',
}

function slotStackZ(
  id: PitchPointId,
  metricsOpen: boolean,
): 'z-[80]' | 'z-20' | 'z-[15]' | 'z-10' {
  if (metricsOpen) return 'z-[80]'
  if (id === 'tl' || id === 'tr') return 'z-20'
  if (id === 'c') return 'z-[15]'
  return 'z-10'
}

export interface SlotsMeta {
  poolReady: boolean
  allSlotsSample: boolean
}

interface PitchUploaderProps {
  onAllAnalyzedChange: (
    complete: boolean,
    indices: Record<PitchPointId, import('../types').TurfIndices> | null,
  ) => void
  onSlotsMetaChange?: (meta: SlotsMeta) => void
}

export function PitchUploader({
  onAllAnalyzedChange,
  onSlotsMetaChange,
}: PitchUploaderProps) {
  const [slots, setSlots] = useState(buildInitialSampleSlots)
  const [openMetricsSlot, setOpenMetricsSlot] = useState<PitchPointId | null>(
    null,
  )
  const [processing, setProcessing] = useState(false)
  const processingRef = useRef(false)
  const [cameraSlot, setCameraSlot] = useState<PitchPointId | null>(null)
  const mobileCapture = isLikelyMobileDevice()

  const notifyComplete = useCallback(
    (next: Record<PitchPointId, PointSlotState>) => {
      const allDone = PITCH_POINT_ORDER.every((id) => next[id].indices !== null)
      const allSlotsSample = PITCH_POINT_ORDER.every(
        (id) => next[id].isSample === true,
      )
      const payload = allDone
        ? PITCH_POINT_ORDER.reduce(
            (acc, id) => {
              acc[id] = next[id].indices!
              return acc
            },
            {} as Record<PitchPointId, import('../types').TurfIndices>,
          )
        : null
      onAllAnalyzedChange(allDone, payload)
      onSlotsMetaChange?.({ poolReady: allDone, allSlotsSample })
    },
    [onAllAnalyzedChange, onSlotsMetaChange],
  )

  useLayoutEffect(() => {
    notifyComplete(slots)
  }, [notifyComplete, slots])

  const applyAnalysisCanvas = useCallback(
    (pointId: PitchPointId, canvas: HTMLCanvasElement) => {
      const indices = analyzeTurfImage(canvas)
      const previewUrl = canvasToPreviewDataUrl(canvas)
      setSlots((s) => {
        const next = {
          ...s,
          [pointId]: {
            ...s[pointId],
            busy: false,
            indices,
            previewUrl,
            error: null,
            isSample: false,
          },
        }
        notifyComplete(next)
        return next
      })
    },
    [notifyComplete],
  )

  const beginProcessing = useCallback((pointId: PitchPointId) => {
    setSlots((s) => {
      const prevUrl = s[pointId].previewUrl
      if (prevUrl?.startsWith('blob:')) URL.revokeObjectURL(prevUrl)
      return {
        ...s,
        [pointId]: { ...s[pointId], busy: true, error: null },
      }
    })
  }, [])

  const failProcessing = useCallback(
    (pointId: PitchPointId, e: unknown) => {
      let msg = e instanceof Error ? e.message : String(e)
      if (/memory|allocation|ImageBitmap|OutOfMemory|canvas/i.test(msg)) {
        msg =
          '端末のメモリが不足しています。他のアプリとタブを閉じてから、1地点ずつ撮影してください。'
      }
      setSlots((s) => {
        const next = {
          ...s,
          [pointId]: {
            ...s[pointId],
            busy: false,
            indices: null,
            previewUrl: null,
            error: msg,
          },
        }
        notifyComplete(next)
        return next
      })
    },
    [notifyComplete],
  )

  const handleCanvas = useCallback(
    async (pointId: PitchPointId, canvas: HTMLCanvasElement) => {
      if (processingRef.current) return

      processingRef.current = true
      setProcessing(true)
      beginProcessing(pointId)

      try {
        applyAnalysisCanvas(pointId, canvas)
      } catch (e) {
        failProcessing(pointId, e)
      } finally {
        processingRef.current = false
        setProcessing(false)
      }
    },
    [applyAnalysisCanvas, beginProcessing, failProcessing],
  )

  const handleFile = useCallback(
    async (pointId: PitchPointId, file: File | undefined) => {
      if (!file || processingRef.current) return

      processingRef.current = true
      setProcessing(true)
      beginProcessing(pointId)

      try {
        const canvas = await fileToAnalysisCanvas(file)
        applyAnalysisCanvas(pointId, canvas)
      } catch (e) {
        failProcessing(pointId, e)
      } finally {
        processingRef.current = false
        setProcessing(false)
      }
    },
    [applyAnalysisCanvas, beginProcessing, failProcessing],
  )

  const showSampleHint = PITCH_POINT_ORDER.every(
    (id) => slots[id].isSample === true,
  )

  return (
    <div className="mx-auto flex w-full max-w-none flex-col gap-4">
      <p className="text-xs text-slate-500">
        解析はすべてお使いのブラウザ内で完結します。画像は端末から外部へ送信されず、サーバーに保存もされません。
        {mobileCapture ? (
          <span className="mt-1 block text-slate-400">
            スマホではアプリ内カメラで低解像度撮影します（端末カメラアプリは使いません）。1地点ずつ撮影してください。
          </span>
        ) : null}
      </p>

      <div
        className="relative mx-auto flex w-full max-w-4xl flex-col overflow-visible rounded-xl border-4 border-white bg-gradient-to-b from-emerald-800 to-emerald-950 shadow-lg select-none xl:max-w-5xl 2xl:max-w-6xl"
        style={{
          boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.35)',
        }}
      >
        {showSampleHint ? (
          <div
            className="shrink-0 border-b border-white/25 bg-black/40 px-2 py-2 text-center text-[0.65rem] leading-snug text-amber-100 backdrop-blur-sm sm:px-3 sm:text-xs"
            role="status"
          >
            ピッチ上のカメラをタップして撮影してください。サンプルのままでも下のプールはお試しできます。
          </div>
        ) : null}
        <div className="relative aspect-[105/68] w-full overflow-visible">
          <div className="pointer-events-none absolute inset-[10%] rounded-sm border-2 border-dashed border-white/40" />
          <PitchMarkingsSvg />

          {PITCH_POINT_ORDER.map((id) => {
            const slot = slots[id]
            const metricsOpen = openMetricsSlot === id
            const zSlot = slotStackZ(id, metricsOpen)
            const hasUserPhoto = slot.previewUrl && !slot.isSample
            const inputId = `turfpool-file-${id}`

            return (
              <div
                key={id}
                className={`absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 ${zSlot} ${MARKER_POS[id]}`}
              >
                <span className="whitespace-nowrap rounded bg-black/50 px-1.5 py-0.5 text-[0.6rem] font-medium text-white backdrop-blur-sm sm:text-[0.65rem]">
                  {slot.label}
                  {slot.isSample ? (
                    <span className="ml-1 rounded bg-amber-400/95 px-1 py-px text-[0.55rem] font-semibold text-slate-900">
                      サンプル
                    </span>
                  ) : null}
                </span>

                <div className="relative flex flex-col items-center gap-0.5">
                  <input
                    id={inputId}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={slot.busy || processing}
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      void handleFile(id, f)
                      e.target.value = ''
                    }}
                  />
                  {mobileCapture ? (
                    <button
                      type="button"
                      disabled={slot.busy || processing}
                      onClick={() => setCameraSlot(id)}
                      title={
                        slot.busy
                          ? '解析中'
                          : hasUserPhoto
                            ? '再撮影'
                            : '撮影'
                      }
                      className={`relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 bg-slate-950/75 text-white shadow-lg backdrop-blur-sm transition sm:h-14 sm:w-14 ${
                        slot.busy || processing
                          ? 'cursor-not-allowed border-white/40 opacity-60'
                          : hasUserPhoto
                            ? 'border-emerald-300 ring-2 ring-emerald-400/50 hover:bg-slate-900/85'
                            : 'border-white/90 hover:border-cyan-200 hover:bg-slate-900/85'
                      }`}
                    >
                      {slot.previewUrl ? (
                        <img
                          src={slot.previewUrl}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover opacity-90"
                        />
                      ) : null}
                      <CameraIcon
                        className={`relative z-[1] h-6 w-6 sm:h-7 sm:w-7 ${
                          slot.previewUrl
                            ? 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]'
                            : ''
                        }`}
                      />
                      {hasUserPhoto ? (
                        <span
                          className="absolute -right-0.5 -top-0.5 z-[2] flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[0.55rem] font-bold text-white ring-2 ring-emerald-950"
                          aria-hidden
                        >
                          ✓
                        </span>
                      ) : null}
                      {slot.busy ? (
                        <span className="absolute inset-0 z-[3] flex items-center justify-center bg-black/45 text-[0.55rem] font-medium">
                          …
                        </span>
                      ) : null}
                    </button>
                  ) : (
                    <label
                      htmlFor={inputId}
                      title={
                        slot.busy
                          ? '解析中'
                          : hasUserPhoto
                            ? '再撮影'
                            : '撮影または画像を選ぶ'
                      }
                      className={`relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 bg-slate-950/75 text-white shadow-lg backdrop-blur-sm transition sm:h-14 sm:w-14 ${
                        slot.busy
                          ? 'cursor-not-allowed border-white/40 opacity-60'
                          : hasUserPhoto
                            ? 'cursor-pointer border-emerald-300 ring-2 ring-emerald-400/50 hover:bg-slate-900/85'
                            : 'cursor-pointer border-white/90 hover:border-cyan-200 hover:bg-slate-900/85'
                      }`}
                    >
                      {slot.previewUrl ? (
                        <img
                          src={slot.previewUrl}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover opacity-90"
                        />
                      ) : null}
                      <CameraIcon
                        className={`relative z-[1] h-6 w-6 sm:h-7 sm:w-7 ${
                          slot.previewUrl
                            ? 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]'
                            : ''
                        }`}
                      />
                      {hasUserPhoto ? (
                        <span
                          className="absolute -right-0.5 -top-0.5 z-[2] flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[0.55rem] font-bold text-white ring-2 ring-emerald-950"
                          aria-hidden
                        >
                          ✓
                        </span>
                      ) : null}
                      {slot.busy ? (
                        <span className="absolute inset-0 z-[3] flex items-center justify-center bg-black/45 text-[0.55rem] font-medium">
                          …
                        </span>
                      ) : null}
                    </label>
                  )}
                  {mobileCapture ? (
                    <button
                      type="button"
                      disabled={slot.busy || processing}
                      onClick={() => document.getElementById(inputId)?.click()}
                      className="text-[0.55rem] text-cyan-300 underline decoration-cyan-500/50 underline-offset-2 disabled:opacity-40"
                    >
                      画像
                    </button>
                  ) : null}
                </div>

                <SlotMetricsAccordion
                  indices={slot.indices}
                  open={metricsOpen}
                  opensAbove={id === 'bl' || id === 'br'}
                  align={PANEL_ALIGN[id]}
                  onOpenChange={(next) => {
                    setOpenMetricsSlot((cur) => {
                      if (next) return id
                      return cur === id ? null : cur
                    })
                  }}
                />

                {slot.error ? (
                  <p className="max-w-[7rem] text-center text-[0.55rem] leading-tight text-red-300">
                    {slot.error}
                  </p>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>

      <MobileCameraCapture
        open={cameraSlot !== null}
        slotLabel={cameraSlot ? slots[cameraSlot].label : ''}
        onClose={() => setCameraSlot(null)}
        onCapture={(canvas) => {
          if (cameraSlot) void handleCanvas(cameraSlot, canvas)
        }}
      />
    </div>
  )
}
