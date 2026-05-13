import { useCallback, useState } from 'react'
import { PitchUploader, type SlotsMeta } from './components/PitchUploader'
import { PoolVisualization } from './components/PoolVisualization'
import { TurfPartnerBanners } from './components/TurfPartnerBanners'
import type { MetricId, PitchPointId, TurfIndices } from './types'

function App() {
  const [poolReady, setPoolReady] = useState(false)
  const [indicesByPoint, setIndicesByPoint] = useState<Record<
    PitchPointId,
    TurfIndices
  > | null>(null)
  const [poolMetric, setPoolMetric] = useState<MetricId>('gcp')
  const [showPool, setShowPool] = useState(false)
  const [slotsMeta, setSlotsMeta] = useState<SlotsMeta>({
    poolReady: true,
    allSlotsSample: true,
  })

  const onSlotsMetaChange = useCallback((meta: SlotsMeta) => {
    setSlotsMeta(meta)
  }, [])

  const onAllAnalyzedChange = useCallback(
    (complete: boolean, payload: Record<PitchPointId, TurfIndices> | null) => {
      setPoolReady(complete)
      setIndicesByPoint(payload)
      if (!complete) setShowPool(false)
    },
    [],
  )

  return (
    <div className="flex min-h-svh flex-col bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 px-4 py-4 backdrop-blur sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          芝しごと・ターフプール
        </h1>
        <p className="mt-0.5 text-[0.7rem] text-slate-500 sm:text-xs">
          v1.0.0
        </p>
        <p className="mt-1 max-w-2xl text-xs text-slate-400 sm:text-sm">
          サッカーグラウンドの芝の状態を、ピッチ上の5地点（四隅と中央）の写真から把握するためのツールです。各点の画像を解析すると、芝の指標とプール状のビューでフィールド全体の傾向やムラを可視化できます。
        </p>
      </header>

      <TurfPartnerBanners />

      <main className="mx-auto flex w-full max-w-6xl flex-1 min-h-0 flex-col gap-8 px-4 py-6 sm:px-6 xl:max-w-7xl 2xl:max-w-screen-2xl">
        <div
          className="shrink-0 rounded-lg border border-cyan-900/45 bg-cyan-950/30 px-3 py-2.5 text-[0.7rem] leading-snug text-cyan-50/95 shadow-sm sm:text-sm sm:leading-normal"
          role="region"
          aria-label="この画面の流れ"
        >
          <span className="font-semibold text-cyan-200">この画面の流れ</span>
          <span className="mx-2 text-slate-500" aria-hidden>
            —
          </span>
          <span className="inline sm:inline">
            ① ピッチの5地点に写真を置く
          </span>
          <span className="mx-1.5 text-slate-500" aria-hidden>
            →
          </span>
          <span className="inline sm:inline">
            ②「プール状ビュー」で指標のムラや高低を眺める
          </span>
        </div>

        <div className="flex w-full min-w-0 shrink-0 flex-col gap-4">
          <PitchUploader
            onAllAnalyzedChange={onAllAnalyzedChange}
            onSlotsMetaChange={onSlotsMetaChange}
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
            <button
              type="button"
              disabled={!poolReady}
              onClick={() => setShowPool(true)}
              className="rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white shadow transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              プール状ビュー
            </button>
            {!poolReady ? (
              <span className="text-xs text-slate-500 sm:text-sm">
                5点すべての解析が完了すると有効になります
              </span>
            ) : slotsMeta.allSlotsSample ? (
              <span className="text-xs text-amber-200/95 sm:text-sm">
                サンプルで5地点そろっています。写真を差し替えると現場比較に向いたプールが使えます。
              </span>
            ) : (
              <span className="text-xs text-emerald-200/95 sm:text-sm">
                5地点の解析が完了しました。プール状ビューで全体の傾向を確認できます。
              </span>
            )}
          </div>
        </div>

        {showPool && indicesByPoint ? (
          <div className="flex min-h-0 w-full flex-1 flex-col">
            <PoolVisualization
              indicesByPoint={indicesByPoint}
              metric={poolMetric}
              onMetricChange={setPoolMetric}
            />
          </div>
        ) : null}
      </main>

      <footer className="border-t border-slate-800 bg-slate-950/40 px-4 py-4 sm:px-6">
        <div className="mx-auto w-full max-w-6xl text-center text-xs text-slate-400 xl:max-w-7xl 2xl:max-w-screen-2xl">
          <a
            href="https://www.turf-tools.jp/"
            className="underline decoration-slate-600 underline-offset-4 transition hover:text-slate-200 hover:decoration-slate-400"
            target="_blank"
            rel="noopener noreferrer"
          >
            グロウアンドプログレス
          </a>
        </div>
      </footer>
    </div>
  )
}

export default App
