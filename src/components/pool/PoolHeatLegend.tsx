import { formatMetricValue } from '../../lib/format'
import { poolMetricMinMax } from '../../lib/poolMetricRange'
import {
  POOL_HEAT_HIGH,
  POOL_HEAT_LOW,
  POOL_HEAT_MID,
} from '../../config/poolTheme'
import { METRIC_LABELS, type MetricId, type PitchPointId, type TurfIndices } from '../../types'

interface PoolHeatLegendProps {
  indicesByPoint: Record<PitchPointId, TurfIndices>
  metric: MetricId
  className?: string
}

export function PoolHeatLegend({
  indicesByPoint,
  metric,
  className = '',
}: PoolHeatLegendProps) {
  const { min, max } = poolMetricMinMax(indicesByPoint, metric)
  const grad = `linear-gradient(to top, ${POOL_HEAT_LOW}, ${POOL_HEAT_MID} 50%, ${POOL_HEAT_HIGH})`

  return (
    <div
      className={`pointer-events-none flex select-none flex-col items-stretch gap-1 rounded-md border border-white/15 bg-slate-950/80 px-2 py-2 text-[0.65rem] text-slate-200 shadow-lg backdrop-blur-sm ${className}`}
    >
      <span className="text-center text-[0.6rem] font-medium text-slate-300">
        {METRIC_LABELS[metric]}
      </span>
      <span className="text-center font-mono text-[0.6rem] text-cyan-200/90">
        {formatMetricValue(metric, max)}
        {metric === 'gcp' ? '%' : ''}
      </span>
      <div
        className="mx-auto h-28 w-4 shrink-0 rounded-sm ring-1 ring-white/10"
        style={{ background: grad }}
        aria-hidden
      />
      <span className="text-center font-mono text-[0.6rem] text-red-200/90">
        {formatMetricValue(metric, min)}
        {metric === 'gcp' ? '%' : ''}
      </span>
      <p className="text-center text-[0.55rem] leading-tight text-slate-500">
        低←正規化→高
      </p>
    </div>
  )
}
