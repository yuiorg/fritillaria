# ヨット

サイコロ5個で役を作り得点を競う、ヨットゲーム(Yacht/Yahtzeeライク)のWebアプリ。
React + TypeScript + Viteで実装されている。

## 遊び方

1. タイトル画面からゲームを開始する
2. サイコロを振り、役ごとの得点シートに確定していく
3. 全ての役が埋まったら結果画面でスコアを確認する

最高スコアはブラウザの`localStorage`に保存される。

## セットアップ

```bash
npm install
```

## 開発

```bash
npm run dev
```

## ビルド

```bash
npm run build
```

## テスト

```bash
npm run test
npm run test:coverage
```

## Lint

```bash
npm run lint
```
