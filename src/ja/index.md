---
layout: home

hero:
  name: Suzume
  text: ブラウザで動く軽量日本語トークナイザー
  tagline: 50MBの辞書ファイルはもう不要。300KB以下でフロントエンド完結、サーバー構築不要。
  actions:
    - theme: brand
      text: 今すぐ試す
      link: '#demo'
    - theme: alt
      text: はじめる
      link: /ja/docs/getting-started

features:
  - icon: 🚫
    title: 辞書地獄からの解放
    details: 50MB超の辞書ファイル管理は不要。特徴量ベースモデルで驚異的なコンパクトさ。
  - icon: 🖥️
    title: 真のクライアントサイド
    details: 100%ブラウザで完結。Pythonバックエンド不要、APIコール不要、CORS問題なし。
  - icon: 🔮
    title: 未知語に強い
    details: 辞書に依存しないから新語でも崩れない。ブランド名、スラング、専門用語も安定してトークン化。
  - icon: ⚡
    title: 本番投入可能
    details: C++からWASMにコンパイル。TypeScript対応。Node.js、Deno、Bun、全ブラウザで動作。
---

<TypewriterDemo />

::: danger 🚧 アルファ版
Suzumeは2025年12月25日より開発中のアルファ版です。npmパッケージは未公開です。
:::

<WasmStats />

<ComparisonTable />

<div id="demo"></div>

<UseCaseDemo />

## インストール

::: code-group

```bash [npm]
npm install @libraz/suzume
```

```bash [yarn]
yarn add @libraz/suzume
```

```bash [pnpm]
pnpm add @libraz/suzume
```

```bash [bun]
bun add @libraz/suzume
```

:::

## 使い方

```typescript
import { Suzume } from '@libraz/suzume'

const suzume = await Suzume.create()
const result = suzume.analyze('すもももももももものうち')

console.log(result)
// [
//   { surface: 'すもも', pos: 'noun', posJa: '名詞', ... },
//   { surface: 'も', pos: 'particle', posJa: '助詞', ... },
//   ...
// ]
```
