---
layout: home

hero:
  name: Suzume
  text: Japanese Tokenizer That Actually Works in the Browser
  tagline: No more 50MB dictionary files. Lightweight Japanese tokenization under 400KB — runs entirely in the browser, no server required.
  actions:
    - theme: brand
      text: Try It Now
      link: '#demo'
    - theme: alt
      text: Get Started
      link: /docs/getting-started

features:
  - icon: 🪶
    title: Ultra Lightweight
    details: WASM + minimal built-in dictionary, all under 400KB. No external dictionary files to manage.
  - icon: 🖥️
    title: True Client-Side
    details: Runs 100% in the browser. No Python backend, no API calls, no CORS headaches. Just JavaScript.
  - icon: 🔮
    title: Robust to Unknown Words
    details: No dictionary dependency means no breaking on new words. Brand names, slang, technical terms — stable tokenization every time.
  - icon: ⚡
    title: Production Ready
    details: C++ compiled to WASM. TypeScript support. Works in Node.js, Deno, Bun, and all modern browsers.
---

<TypewriterDemo />

::: warning 🚧 Beta
Suzume is in beta and under active development (since December 25, 2025). If you find any bugs, please [open a GitHub issue](https://github.com/libraz/suzume/issues) with an example sentence that reproduces the problem.
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
//   { surface: 'すもも', pos: 'NOUN', posJa: '名詞', ... },
//   { surface: 'も', pos: 'PARTICLE', posJa: '助詞', ... },
//   { surface: 'もも', pos: 'NOUN', posJa: '名詞', ... },
//   ...
// ]
```
