import { useCallback, useId, useLayoutEffect, useState } from 'react'
import { analyzeTurfImage } from '../lib/analysis/indices'
import { fileToAnalysisCanvas } from '../lib/analysis/imagePipeline'
import { buildInitialSampleSlots } from '../lib/samplePitchSlots'
import {
  PITCH_POINT_ORDER,
  type PitchPointId,
  type PointSlotState,
  type TurfIndices,
} from '../types'
import { MetricPanel } from './MetricPanel'

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

function SlotMetricsAccordion({
  indices,
  open,
  onOpenChange,
  opensAbove,
}: {
  indices: TurfIndices | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 下側スロットでは true（パネルを上に開き、親の overflow で隠れないようにする） */
  opensAbove: boolean
}) {
  const panelId = useId()

  const panelClass = opensAbove
    ? 'absolute left-0 right-0 bottom-full z-[100] mb-1 max-h-[min(42vh,15rem)] overflow-y-auto rounded-md bg-slate-950/95 px-2 py-2 text-left shadow-xl ring-1 ring-white/15 backdrop-blur-sm'
    : 'absolute left-0 right-0 top-full z-[100] mt-1 max-h-[min(55vh,24rem)] overflow-y-auto rounded-md bg-slate-950/95 px-2 py-2 text-left shadow-xl ring-1 ring-white/15 backdrop-blur-sm'

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-1 rounded-md bg-slate-950/90 px-1.5 py-1 text-left text-[0.65rem] text-slate-200 ring-1 ring-white/10 transition hover:bg-slate-900/90 sm:text-xs"
      >
        <span className="font-medium">{indices ? '測定指標' : '指標'}</span>
        <span className="shrink-0 text-slate-400" aria-hidden>
          {open ? '▲' : '▼'}
        </span>
      </button>
      {open ? (
        <div id={panelId} role="region" className={panelClass}>
          <MetricPanel indices={indices} compact />
          <div className="mt-3 min-h-[2.5rem] border-t border-white/10 pt-2 text-[0.6rem] leading-snug text-slate-400">
            詳しい説明はプール状ビューを開いたときの下部に表示されます。
          </div>
        </div>
      ) : null}
    </div>
  )
}

const SLOT_STYLE: Record<
  PitchPointId,
  { className: string; arrow?: string }
> = {
  tl: { className: 'left-[6%] top-[8%]' },
  tr: { className: 'right-[6%] top-[8%] left-auto' },
  bl: { className: 'left-[6%] bottom-[10%] top-auto' },
  br: { className: 'right-[6%] bottom-[10%] left-auto top-auto' },
  c: {
    className: 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
  },
}

/** 5点すべて同じ横幅（中央も四隅に合わせる） */
const SLOT_WIDTH_CLASS = 'w-[30%] max-w-[9.5rem] sm:w-[28%]'

const SLOT_FRAME: Record<PitchPointId, string> = {
  tl: SLOT_WIDTH_CLASS,
  tr: SLOT_WIDTH_CLASS,
  bl: SLOT_WIDTH_CLASS,
  br: SLOT_WIDTH_CLASS,
  c: SLOT_WIDTH_CLASS,
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
  /** 5地点ともまだサンプル画像のとき true（ユーザーの写真に1枚でも差し替えると false） */
  allSlotsSample: boolean
}

interface PitchUploaderProps {
  onAllAnalyzedChange: (
    complete: boolean,
    indices: Record<PitchPointId, import('../types').TurfIndices> | null,
  ) => void
  /** 完了状態・サンプル一括かどうか（App で案内文に利用） */
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

  const handleFile = useCallback(
    async (pointId: PitchPointId, file: File | undefined) => {
      if (!file) return

      setSlots((s) => {
        const prevUrl = s[pointId].previewUrl
        if (prevUrl?.startsWith('blob:')) URL.revokeObjectURL(prevUrl)
        return {
          ...s,
          [pointId]: { ...s[pointId], busy: true, error: null },
        }
      })

      try {
        const canvas = await fileToAnalysisCanvas(file)
        const indices = analyzeTurfImage(canvas)
        const previewUrl = URL.createObjectURL(file)
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
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
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
      }
    },
    [notifyComplete],
  )

  const showSampleHint = PITCH_POINT_ORDER.every(
    (id) => slots[id].isSample === true,
  )

  return (
    <div className="mx-auto flex w-full max-w-none flex-col gap-4">
      <p className="text-xs text-slate-500">
        解析はすべてお使いのブラウザ内で完結します。画像は端末から外部へ送信されず、サーバーに保存もされません。
      </p>

      <div
        className="relative mx-auto flex w-full max-w-4xl flex-col overflow-hidden rounded-xl border-4 border-white bg-gradient-to-b from-emerald-800 to-emerald-950 shadow-lg select-none xl:max-w-5xl 2xl:max-w-6xl"
        style={{
          boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.35)',
        }}
      >
        {showSampleHint ? (
          <div
            className="shrink-0 border-b border-white/25 bg-black/40 px-2 py-2 text-center text-[0.65rem] leading-snug text-amber-100 backdrop-blur-sm sm:px-3 sm:text-xs"
            role="status"
          >
            各地点の枠をタップ（クリック）して、現場の写真に差し替えてください。サンプルのままでも下のプールはお試しできます。
          </div>
        ) : null}
        <div className="relative aspect-[105/68] w-full overflow-visible">
          <div className="pointer-events-none absolute inset-[10%] rounded-sm border-2 border-dashed border-white/40" />
          <PitchMarkingsSvg />

        {PITCH_POINT_ORDER.map((id) => {
          const slot = slots[id]
          const st = SLOT_STYLE[id]
          const frame = SLOT_FRAME[id]
          const metricsOpen = openMetricsSlot === id
          const zSlot = slotStackZ(id, metricsOpen)
          return (
            <div
              key={id}
              className={`absolute flex flex-col gap-1 ${zSlot} ${frame} ${st.className}`}
            >
              <div className="relative flex w-full flex-col gap-1">
                <span className="rounded bg-black/45 px-1.5 py-0.5 text-center text-[0.65rem] font-medium text-white backdrop-blur-sm sm:text-xs">
                  <span>{slot.label}</span>
                  {slot.isSample ? (
                    <span className="ml-1 inline-block rounded bg-amber-400/95 px-1 py-px text-[0.55rem] font-semibold text-slate-900">
                      サンプル
                    </span>
                  ) : null}
                </span>
                <input
                  id={`turfpool-file-${id}`}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={slot.busy}
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    void handleFile(id, f)
                    e.target.value = ''
                  }}
                />
                <label
                  htmlFor={`turfpool-file-${id}`}
                  className={`flex min-h-[4.5rem] flex-col overflow-hidden rounded-lg border-2 border-white/80 bg-black/35 shadow-md backdrop-blur-sm transition sm:min-h-[5rem] ${
                    slot.busy
                      ? 'cursor-not-allowed opacity-50'
                      : 'cursor-pointer hover:bg-black/45'
                  }`}
                >
                  {slot.previewUrl ? (
                    <img
                      src={slot.previewUrl}
                      alt=""
                      title={slot.isSample ? 'サンプル画像（デモ）' : undefined}
                      className="pointer-events-none h-16 w-full object-cover sm:h-20"
                    />
                  ) : (
                    <span className="flex flex-1 items-center justify-center px-1 text-[0.65rem] text-white/90 sm:text-xs">
                      {slot.busy ? '解析中…' : 'タップで画像'}
                    </span>
                  )}
                </label>
                <SlotMetricsAccordion
                  indices={slot.indices}
                  open={metricsOpen}
                  opensAbove={id === 'bl' || id === 'br'}
                  onOpenChange={(next) => {
                    setOpenMetricsSlot((cur) => {
                      if (next) return id
                      return cur === id ? null : cur
                    })
                  }}
                />
              </div>
              {slot.error ? (
                <p className="text-[0.6rem] leading-tight text-red-300">
                  {slot.error}
                </p>
              ) : null}
            </div>
          )
        })}
        </div>
      </div>
    </div>
  )
}
