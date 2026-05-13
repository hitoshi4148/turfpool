const linkClass =
  'inline-block max-w-full overflow-hidden rounded-lg ring-1 ring-slate-700/60 transition hover:ring-cyan-500/50 hover:opacity-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500'

const imgIntrinsic = 'h-auto w-auto max-w-full'

/** bloglink / youtubelink 元 600×200 → 半分表示 */
const SECOND_ROW_IMG =
  'block h-auto w-[300px] max-w-[min(300px,calc(50vw-2rem))] shrink-0'

export function TurfPartnerBanners() {
  return (
    <div className="border-b border-slate-800/80 bg-slate-900/40">
      <div className="mx-auto w-full max-w-6xl space-y-3 px-4 py-4 sm:px-6 xl:max-w-7xl 2xl:max-w-screen-2xl">
        <div className="flex justify-center">
          <a
            href="https://www.turf-tools.jp/services-4"
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            <img
              src="/banner_pr_size1.png"
              alt="芝管理のプロにPRしませんか？農薬・資材・機械メーカー様向けパートナー募集"
              className={imgIntrinsic}
              loading="lazy"
              decoding="async"
            />
          </a>
        </div>
        <div className="flex flex-row flex-wrap items-center justify-center gap-3">
          <a
            href="https://www.turf-tools.jp/blog"
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            <img
              src="/bloglink.png"
              alt="芝管理技術ブログ — データ駆動型の芝草管理を解説"
              className={SECOND_ROW_IMG}
              width={300}
              height={100}
              loading="lazy"
              decoding="async"
            />
          </a>
          <a
            href="https://www.youtube.com/channel/UCSRU0zk4Fj1ETWqMRlJDPJQ"
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            <img
              src="/youtubelink.png"
              alt="YouTube — 現場で役立つ芝管理ノウハウ（Grow and Progress）"
              className={SECOND_ROW_IMG}
              width={300}
              height={100}
              loading="lazy"
              decoding="async"
            />
          </a>
        </div>
      </div>
    </div>
  )
}
