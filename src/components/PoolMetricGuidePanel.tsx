import type { ReactNode } from 'react'
import type { MetricId } from '../types'
import { METRIC_IDS, METRIC_LABELS } from '../types'
import {
  GCP_HSV_LOWER,
  GCP_HSV_UPPER,
  TEXTURE_SOBEL_DECAY_REF,
  UNIFORMITY_STD_SCALE,
  VARI_DENOM_EPS,
} from '../config/turfConstants'

type GuideBlock = {
  logic: ReactNode
  meaning: ReactNode
  usage: ReactNode
}

const mono = 'font-mono text-[0.62rem] leading-snug text-slate-300/95'

const GUIDE: Record<MetricId, GuideBlock> = {
  gcp: {
    logic: (
      <>
        <p className="mb-1">
          各画素の RGB を OpenCV 8bit HSV に近い形へ変換し、芝らしい色相・彩度・明度の範囲に入るかを判定します。
        </p>
        <p className={mono}>
          GCP(%) = (芝と判定した画素数 / 全画素数) × 100
        </p>
        <p className={`mt-1 ${mono}`}>
          芝判定（H:0–179, S,V:0–255）: H∈[{GCP_HSV_LOWER.h}, {GCP_HSV_UPPER.h}], S∈[
          {GCP_HSV_LOWER.s}, {GCP_HSV_UPPER.s}], V∈[{GCP_HSV_LOWER.v}, {GCP_HSV_UPPER.v}]
        </p>
      </>
    ),
    meaning: (
      <>
        <p className="mb-1">
          フレーム内で「芝らしい画素」が占める割合です。土・白線・観客席などが多いと下がります。
        </p>
        <p>
          目安: 芝が画面の大半を占めると高め（例: 80%前後以上になりやすい）。土やラインが主役だと
          <strong className="font-medium text-slate-300"> 20%未満</strong>
          などまで下がることもあります（撮影の切り取り方に強く依存します）。
        </p>
      </>
    ),
    usage: (
      <p>
        同じくらいの距離・画角で撮った写真同士を比べると、薄いエリアや境界付近の差がつかみやすくなります。
      </p>
    ),
  },
  exg: {
    logic: (
      <>
        <p className="mb-1">
          Woebbecke らの Excess Green に相当する量を、画素ごとに R,G,B を 0–1 に正規化して計算し、全画素平均を返します。
        </p>
        <p className={mono}>ExG = mean( 2G′ − R′ − B′ )</p>
        <p className="mt-1 text-[0.62rem] text-slate-500">
          （R′,G′,B′ は各画素の R,G,B を 255 で割った値）
        </p>
      </>
    ),
    meaning: (
      <>
        <p className="mb-1">
          平均が<strong className="font-medium text-slate-300"> 正で大きい</strong>
          ほど、緑チャンネルが支配的な画素が多いことを意味します。負に近いと赤・青寄りの画素が目立ちます。
        </p>
        <p>
          絶対値の良し悪しはカメラ・照明・露出に左右されるため、同条件の複数枚の「相対比較」向きです。
        </p>
      </>
    ),
    usage: (
      <p>
        プール状ビューでは 5 地点を同じ色スケールで並べ、生育やメンテナンス差の俯瞰に使えます。
      </p>
    ),
  },
  vari: {
    logic: (
      <>
        <p className="mb-1">
          Gitelson の VARI に近い形で、分母が小さすぎる画素は除外してから全画素平均を取ります。
        </p>
        <p className={mono}>VARI = mean( (G′ − R′) / (G′ + R′ − B′) )</p>
        <p className="mt-1 text-[0.62rem] text-slate-500">
          対象画素: |G′ + R′ − B′| ≥ {VARI_DENOM_EPS} のものだけ（0–1 正規化チャンネル）
        </p>
      </>
    ),
    meaning: (
      <>
        <p className="mb-1">
          ExG が RGB のバランスを見るのに対し、VARI は (G−R)/(G+R−B) 型で、土などの背景の影響を抑えやすい傾向があります。
        </p>
        <p>
          値の大小は撮影条件に敏感なので「絶対の安全・危険ライン」より、同じ日の ExG との
          <strong className="font-medium text-slate-300"> 差分読み</strong>
          が実用的です。
        </p>
      </>
    ),
    usage: (
      <p>
        ExG と並べて見ると、撮り方や背景の違いを切り分けやすくなります。
      </p>
    ),
  },
  colorUniformity: {
    logic: (
      <>
        <p className="mb-1">
          芝と判定された画素（GCP と同じ HSV マスク）について、緑チャンネル G の標準偏差 σ_G を求めます。芝画素が
          1 つも無いときは、全画素の G で同様に計算します。
        </p>
        <p className={mono}>
          Color Uniformity = clip(1 − σ_G / {UNIFORMITY_STD_SCALE}, 0, 1) × 100
        </p>
        <p className="mt-1 text-[0.62rem] text-slate-500">
          clip は 0–1 に丸め、σ_G は 0–255 スケールの G
        </p>
      </>
    ),
    meaning: (
      <>
        <p className="mb-1">
          <strong className="font-medium text-slate-300">100</strong>
          に近いほど緑の濃さのばらつきが小さく、縞・影・土の混入で σ_G が大きくなると下がります。
        </p>
        <p>
          目安: サッカー場の縞や光ムラをある程度許容するよう分母 {UNIFORMITY_STD_SCALE}
          を大きめにしてあり、ゴルフグリーン基準より下がりにくい設計です。
        </p>
      </>
    ),
    usage: (
      <p>
        複数地点のムラの傾向比較や、メンテナンス前後の変化を眺めるのに向きます。
      </p>
    ),
  },
  textureQuality: {
    logic: (
      <>
        <p className="mb-1">
          輝度（ITU-R BT.601 係数のグレースケール）に Sobel フィルタを当て、勾配強度 ‖∇I‖ = √(G_x² + G_y²)
          の画素平均を <span className={mono}>meanMag</span> とします。
        </p>
        <p className={mono}>
          Texture Quality = clip(exp(−meanMag / {TEXTURE_SOBEL_DECAY_REF}), 0, 1) × 100
        </p>
      </>
    ),
    meaning: (
      <>
        <p className="mb-1">
          <strong className="font-medium text-slate-300">高い</strong>
          ほど微細な明暗変化が少なく「滑らか」、
          <strong className="font-medium text-slate-300">低い</strong>
          ほど刈り目・粗さ・細かいパターンが強く出ています。
        </p>
        <p>
          目安: meanMag が参照値 {TEXTURE_SOBEL_DECAY_REF} 付近だと指数項が e⁻¹ 前後になり、スコアは中程度になりやすいチューニングです（解像度・ピントに依存）。
        </p>
      </>
    ),
    usage: (
      <p>
        刈り込み直後の仕上がりや、踏み固めで荒れやすいエリアの比較に。撮影のピント・解像度が違うと数値も変わります。
      </p>
    ),
  },
}

function GuideSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="rounded-md border border-slate-700/55 bg-slate-900/30 px-2 py-1.5 shadow-sm">
      <h5 className="mb-1 border-b border-slate-700/40 pb-0.5 text-[0.62rem] font-semibold tracking-wide text-slate-300">
        {title}
      </h5>
      <div className="space-y-1 text-[0.65rem] leading-snug text-slate-400 sm:text-[0.68rem] sm:leading-relaxed">
        {children}
      </div>
    </section>
  )
}

export function PoolMetricGuidePanel() {
  return (
    <div className="mt-5 border-t border-slate-700/70 pt-5">
      <h3 className="mb-4 text-sm font-semibold tracking-tight text-slate-200">
        指標の見方
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5 xl:gap-3">
        {METRIC_IDS.map((id) => {
          const g = GUIDE[id]
          return (
            <article
              key={id}
              className="flex min-w-0 flex-col gap-1.5 rounded-lg border border-slate-700/80 bg-slate-950/50 p-2.5 text-left shadow-inner sm:p-3"
            >
              <h4 className="border-b border-slate-700/60 pb-1.5 text-[0.7rem] font-semibold leading-snug text-cyan-100/95 sm:text-xs">
                {METRIC_LABELS[id]}
              </h4>
              <div className="flex flex-col gap-1.5">
                <GuideSection title="算出ロジック">{g.logic}</GuideSection>
                <GuideSection title="値の考え方">{g.meaning}</GuideSection>
                <GuideSection title="ヒント">{g.usage}</GuideSection>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
