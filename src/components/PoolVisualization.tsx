import type { MetricId, PitchPointId, TurfIndices } from '../types'
import { METRIC_IDS, METRIC_LABELS } from '../types'
import { PoolHeatLegend } from './pool/PoolHeatLegend'
import { PoolScene } from './pool/PoolScene'
import { PoolMetricGuidePanel } from './PoolMetricGuidePanel'

interface PoolVisualizationProps {
  indicesByPoint: Record<PitchPointId, TurfIndices>
  metric: MetricId
  onMetricChange: (m: MetricId) => void
}

export function PoolVisualization({
  indicesByPoint,
  metric,
  onMetricChange,
}: PoolVisualizationProps) {
  return (
    <section className="flex h-full min-h-[min(58vh,560px)] w-full flex-1 flex-col gap-3 rounded-xl border border-slate-700/80 bg-slate-900/40 p-3 shadow-inner sm:p-4 xl:min-h-[min(62vh,620px)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold text-slate-100 sm:text-lg">
          プール状ビュー
        </h2>
        <label className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
          <span className="shrink-0">指標</span>
          <select
            className="min-w-[10rem] flex-1 rounded-lg border border-slate-600 bg-slate-950 px-2 py-1.5 text-slate-100 sm:flex-none"
            value={metric}
            onChange={(e) => onMetricChange(e.target.value as MetricId)}
          >
            {METRIC_IDS.map((m) => (
              <option key={m} value={m}>
                {METRIC_LABELS[m]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-xs text-slate-400 sm:text-sm">
        5点の写真をもとにピッチのイメージを表示します。指標を変えると色や形が変わります。各指標の説明はこの下にあります。
      </p>
      <div className="relative isolate w-full min-h-[min(48vh,440px)] flex-1 basis-0 overflow-hidden rounded-lg border border-slate-700 bg-slate-950 sm:min-h-[min(50vh,500px)] xl:min-h-[min(52vh,600px)] 2xl:min-h-[min(54vh,680px)]">
        <PoolScene indicesByPoint={indicesByPoint} metric={metric} />
        <PoolHeatLegend
          indicesByPoint={indicesByPoint}
          metric={metric}
          className="absolute right-2 top-2 z-10 sm:right-3 sm:top-3"
        />
      </div>
      <PoolMetricGuidePanel />
    </section>
  )
}
