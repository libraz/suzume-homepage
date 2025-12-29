---
layout: home

hero:
  name: Suzume
  text: Japanese Tokenizer That Actually Works in the Browser
  tagline: Tired of MeCab's 50MB dictionary? Suzume brings lightweight Japanese tokenization to the frontend — under 200KB, no server required.
  actions:
    - theme: brand
      text: Try It Now
      link: '#demo'
    - theme: alt
      text: Get Started
      link: /docs/getting-started

features:
  - icon: 🚫
    title: No Dictionary Hell
    details: Forget about managing 50MB+ dictionary files. Suzume uses a feature-based model that stays tiny.
  - icon: 🖥️
    title: True Client-Side
    details: Runs 100% in the browser. No Python backend, no API calls, no CORS headaches. Just JavaScript.
  - icon: 🔮
    title: Robust to Unknown Words
    details: Unlike MeCab, Suzume doesn't break on new words. Brand names, slang, technical terms — stable tokenization without dictionaries.
  - icon: ⚡
    title: Production Ready
    details: C++ compiled to WASM. TypeScript support. Works in Node.js, Deno, Bun, and all modern browsers.
---

::: tip What Suzume Is
**Suzume is not a dictionary-based morphological analyzer.**
It is a lightweight, feature-driven tokenizer designed for real-world Japanese text on the web.
:::

<WasmStats />

<ComparisonTable />

<div id="demo"></div>

<UseCaseDemo />

## Installation

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

## Usage

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
