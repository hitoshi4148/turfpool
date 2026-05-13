export type PitchPointId = 'tl' | 'tr' | 'bl' | 'br' | 'c'

export type MetricId =
  | 'gcp'
  | 'exg'
  | 'vari'
  | 'colorUniformity'
  | 'textureQuality'

export interface TurfIndices {
  gcp: number
  exg: number
  vari: number
  colorUniformity: number
  textureQuality: number
}

export interface PointSlotState {
  pointId: PitchPointId
  label: string
  previewUrl: string | null
  indices: TurfIndices | null
  error: string | null
  busy: boolean
  /** 初期のデモ画像のとき true。ユーザーが画像を選ぶと false */
  isSample?: boolean
}

export const PITCH_POINT_ORDER: PitchPointId[] = ['tl', 'tr', 'bl', 'br', 'c']

export const METRIC_LABELS: Record<MetricId, string> = {
  gcp: 'GCP(%) 緑の被覆率',
  exg: 'ExG 芝緑度',
  vari: 'VARI 芝活力度',
  colorUniformity: 'Color Uniformity 色均一性',
  textureQuality: 'Texture Quality 刈込芝面品質',
}

/** UI・プール状ビューでの指標並び順（固定）。 */
export const METRIC_IDS: MetricId[] = [
  'gcp',
  'exg',
  'vari',
  'colorUniformity',
  'textureQuality',
]
