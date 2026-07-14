# 芝しごと・ターフプール（TurfPool）

**バージョン: v1.1.0**

サッカーグラウンドの芝を、**ピッチ上の 5 地点（四隅＋中央）の写真**から把握するための Web アプリです。ブラウザ内で画像を解析し、数値指標と **3D のプール状ビュー** でフィールド全体の傾向を可視化します。

- **クライアント完結**: 画像は端末外へ送信されず、サーバーに保存もされません。
- **静的フロントのみ**: API サーバー不要。GitHub 連携の **Render Static Site** などにそのまま載せやすい構成です。

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

## Render での公開（Static Site）

1. Render で **New +** → **Static Site** を選択し、GitHub リポジトリを接続します。
2. 次のように設定します（例）。

   | 項目 | 値 |
   |------|-----|
   | **Build Command** | `npm install && npm run build` |
   | **Publish Directory** | `dist` |

3. デプロイ完了後、割り当てられた URL でアクセスできることを確認します。

> このリポジトリは Vite の **SPA 既定構成**（ルーティングは `/` のみ）のため、追加のリライトルールは通常不要です。将来クライアントルートを増やす場合は、ホスティング側の SPA 用フォールバック設定を確認してください。

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
| `src/components/PitchUploader.tsx` | 5 地点アップロード・サンプル初期状態 |
| `src/lib/analysis/indices.ts` | 指標の算出ロジック |
| `src/config/turfConstants.ts` | 閾値・プール用定数 |
| `src/components/pool/` | Three.js プールシーン・メッシュ・目盛り |
| `public/` | ファビコン・パートナー用バナー画像 |

---

## クレジット・リンク

- フッターのリンク先: [グロウアンドプログレス](https://www.turf-tools.jp/)（芝しごと）
- パートナー・ブログ等のバナー: `TurfPartnerBanners` コンポーネントおよび `public/` 配下の画像

---

## ライセンス

リポジトリに `LICENSE` が無い場合は、公開前にライセンスを追加してください。
