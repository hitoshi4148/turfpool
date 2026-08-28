# 芝しごと・ターフプール（TurfPool）

**バージョン: v1.2.0**

サッカーグラウンドの芝を、**ピッチ上の 5 地点（四隅＋中央）の写真**から把握するための Web アプリです。スマホのカメラで各地点を撮影（またはファイル選択）し、ブラウザ内で画像を解析して数値指標と **3D のプール状ビュー** でフィールド全体の傾向を可視化します。

- **クライアント完結**: 画像は端末外へ送信されず、サーバーに保存もされません。
- **静的フロントのみ**: API サーバー不要。`tool-portal` リポジトリへビルド成果物を配置して Cloudflare Pages で公開します。

詳しい仕様・指標の数式・3D の考え方は、リポジトリ内の **`docs/APP_REFERENCE_JA.txt`** を参照してください（ブログ記事・解説動画の素案としても使えます）。

---

## 必要環境

- **Node.js** 20 以上推奨（18 でも動作確認しやすい構成です）
- モダンブラウザ（WebGL・Canvas 2D・File API が使えること）

---

## ローカル開発

```bash
npm install
npm run dev
```

開発サーバー起動後、表示された URL（通常 `http://localhost:5173`）を開きます。

---

## 本番ビルド

```bash
npm run build
```

成果物は **`dist/`** に出力されます。

```bash
npm run preview
```

ビルド結果をローカルで確認できます。

---

## 本番公開（Cloudflare Pages / tool-portal）

本番 URL: **https://www.turf-tools.jp/portal/turfpool/**

Vite の `base` は `/portal/turfpool/` です。更新時は次の手順で `tool-portal` に反映します。

```bash
npm run build
```

ビルド後、`dist/` の内容を `tool-portal/public/portal/turfpool/` にコピーし、`tool-portal` リポジトリを push します。Cloudflare Pages が自動デプロイします。

> HTTPS 上で動作するため、スマホのカメラ撮影（`capture="environment"`）が利用できます。

---

## Render での公開（参考・旧構成）

以前は Render Static Site（`turfpool.onrender.com`）で公開していました。現在は上記の tool-portal 配下が本番です。

1. Render で **New +** → **Static Site** を選択し、GitHub リポジトリを接続します。
2. 次のように設定します（例）。

   | 項目 | 値 |
   |------|-----|
   | **Build Command** | `npm install && npm run build` |
   | **Publish Directory** | `dist` |

3. デプロイ完了後、割り当てられた URL でアクセスできることを確認します。

> サブパス配信（`/portal/turfpool/`）の場合は `vite.config.ts` の `base` を合わせてください。

---

## Lint

```bash
npm run lint
```

---

## ディレクトリの目安

| パス | 内容 |
|------|------|
| `src/App.tsx` | 画面全体のレイアウト・プール表示の切り替え |
| `src/components/AppFooter.tsx` | フッター（芝しごとアプリリンク・ロゴ・バージョン） |
| `src/config/app.ts` | アプリバージョンと芝しごとシリーズのリンク一覧 |
| `src/components/PitchUploader.tsx` | 5 地点カメラ撮影・アップロード・サンプル初期状態 |
| `src/config/assets.ts` | アプリ内・ポータル共有アセットの URL 解決 |
| `src/lib/analysis/indices.ts` | 指標の算出ロジック |
| `src/config/turfConstants.ts` | 閾値・プール用定数 |
| `src/components/pool/` | Three.js プールシーン・メッシュ・目盛り |
| `public/` | ファビコン・グロウアンドプログレスロゴ・パートナー用バナー画像 |

---

## クレジット・リンク

- ブラウザタブのファビコン: グロウアンドプログレスのロゴ（ポータル共有 `/portal/grow-and-progress-logo.png`）
- フッター: 芝しごとシリーズ各アプリへのリンク、[グロウアンドプログレス](https://www.turf-tools.jp/) のロゴとサイトリンク、アプリバージョン（v1.2.0）
- 芝しごとシリーズ（フッター掲載）:
  - [ポータル](https://www.turf-tools.jp/portal/)
  - [楽RAC農薬ローテ](https://www.turf-tools.jp/portal/rac/)
  - [施肥設計ナビ](https://fertilization-design.onrender.com/)
  - [病害リスク予報](https://www.turf-tools.jp/portal/risk/)
  - [ターフプール](https://www.turf-tools.jp/portal/turfpool/)
  - [AI質問箱](https://www.turf-tools.jp/portal/#ai-advisor-section)
  - [病害画像診断AI](https://www.turf-tools.jp/portal/diagnosis/)
  - [ピンポイント天気で芝しごと](https://www.turf-tools.jp/portal/spray/)
  - [積算温度追跡マップ](https://turfmap.onrender.com/)
  - [温量指数気候区分マップ](https://climate-map-x30t.onrender.com/)
  - [クレームサバイバル](https://claim-survival.onrender.com/)
- パートナー・ブログ等のバナー: `TurfPartnerBanners` コンポーネントおよび `public/` 配下の画像

---

## ライセンス

リポジトリに `LICENSE` が無い場合は、公開前にライセンスを追加してください。
