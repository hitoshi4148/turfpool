import { APP_VERSION, SHIBA_SHIGOTO_APPS } from '../config/app'

const linkClass =
  'text-slate-400 underline decoration-slate-600 underline-offset-4 transition hover:text-slate-200 hover:decoration-slate-400'

export function AppFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950/40 px-4 py-5 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 text-center text-xs xl:max-w-7xl 2xl:max-w-screen-2xl">
        <nav aria-label="芝しごとアプリ">
          <ul className="flex max-w-3xl flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[0.7rem] sm:text-xs">
            {SHIBA_SHIGOTO_APPS.map((app) => (
              <li key={app.href}>
                <a
                  href={app.href}
                  className={linkClass}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {app.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <a
          href="https://www.turf-tools.jp/"
          className="flex flex-col items-center gap-2 text-slate-400 transition hover:text-slate-200"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="/grow-and-progress-logo.png"
            alt=""
            width={80}
            height={80}
            className="h-20 w-20 object-contain"
          />
          <span className="underline decoration-slate-600 underline-offset-4 hover:decoration-slate-400">
            グロウアンドプログレス
          </span>
        </a>
        <p className="text-[0.7rem] text-slate-500 sm:text-xs">{APP_VERSION}</p>
      </div>
    </footer>
  )
}
