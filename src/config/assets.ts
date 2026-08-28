/** Vite `base` 配下のアセット（例: /portal/turfpool/） */
export function appAsset(path: string): string {
  const base = import.meta.env.BASE_URL
  return `${base}${path.replace(/^\//, '')}`
}

/** tool-portal 共通静的ファイル（例: /portal/banner_pr_size1.png） */
export function portalSharedAsset(path: string): string {
  return `/portal/${path.replace(/^\//, '')}`
}
