import { formatMetricValue } from '../lib/format'
import { METRIC_IDS, METRIC_LABELS, type TurfIndices } from '../types'
interface MetricPanelProps {
  indices: TurfIndices | null
  compact?: boolean
}

export function MetricPanel({ indices, compact }: MetricPanelProps) {
  if (!indices) {
    return (
      <p className="text-xs text-slate-500">
        {compact ? '—' : '画像を選ぶと解析します'}
      </p>
    )
  }
  return (
    <dl
      className={
        compact
          ? 'grid grid-cols-1 gap-0.5 text-[0.65rem] leading-tight'
          : 'grid grid-cols-2 gap-x-2 gap-y-1 text-xs'
      }
    >
      {METRIC_IDS.map((m) => (
        <div key={m} className="contents">
          <dt className="text-slate-500">{METRIC_LABELS[m]}</dt>
          <dd className="font-mono text-slate-100">
            {formatMetricValue(m, indices[m])}
            {m === 'gcp' ? '%' : ''}
          </dd>
        </div>
      ))}
    </dl>
  )
}
