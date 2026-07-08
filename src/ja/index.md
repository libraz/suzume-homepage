---
layout: home

hero:
  name: Suzume
  text: ブラウザで動く軽量日本語トークナイザー
  tagline: 50MBの辞書ファイルはもう不要。gzipで450KB以下、フロントエンド完結でサーバー構築不要。
  actions:
    - theme: brand
      text: 今すぐ試す
      link: '#demo'
    - theme: alt
      text: はじめる
      link: /ja/docs/getting-started

features:
  - icon: 🪶
    title: 超軽量
    details: WASM＋最小限の内蔵辞書で合計450KB以下（gzip）。外部辞書ファイルの管理は不要。
  - icon: 🖥️
    title: 真のクライアントサイド
    details: 100%ブラウザで完結。Pythonバックエンド不要、APIコール不要、CORS問題なし。
  - icon: 🔮
    title: 未知語に強い
    details: 辞書に依存しないから新語でも崩れない。ブランド名、スラング、専門用語も安定してトークン化。
  - icon: ⚡
    title: 本番投入可能
    details: C++からWASMにコンパイル。TypeScript対応。Node.js、Deno、Bun、全ブラウザに加えて、CGOバインディング経由でGoからも利用可能。
---

<TypewriterDemo />

<div class="beta-notice">
  <span class="beta-badge">Beta</span>
  <span>Suzumeは2025年12月25日より開発中のベータ版です。不具合を見つけた場合は、再現できる例文を添えて<a href="https://github.com/libraz/suzume/issues" target="_blank" rel="noopener">GitHub Issue</a>を起票してください。</span>
</div>

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

```bash [Go]
go get github.com/libraz/go-suzume
cd "$(go list -m -f '{{.Dir}}' github.com/libraz/go-suzume)"
make lib
```

:::

Go 製のサーバー、CLI、バッチ処理で使う場合は [Go バインディングガイド](/ja/docs/go) を参照してください。

## 使い方

```typescript
import { Suzume } from '@libraz/suzume'

const suzume = await Suzume.create()
const result = suzume.analyze('すもももももももものうち')

console.log(result)
// [
//   { surface: 'すもも', pos: 'NOUN', posJa: '名詞', ... },
//   { surface: 'も', pos: 'PARTICLE', posJa: '助詞', ... },
//   { surface: 'もも', pos: 'NOUN', posJa: '名詞', ... },
//   ...
// ]
```
