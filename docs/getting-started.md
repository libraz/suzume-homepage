# Getting Started

Suzume is a lightweight Japanese tokenizer. It runs on WASM, so it works in browsers and Node.js alike.

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

## Basic Usage

```typescript
import { Suzume } from '@libraz/suzume'

// Create an instance
const suzume = await Suzume.create()

// Analyze text
const morphemes = suzume.analyze('今日は良い天気ですね')

for (const m of morphemes) {
  console.log(`${m.surface} [${m.posJa}] - ${m.reading}`)
}

// Free resources when done
suzume.destroy()
```

## Output Format

`analyze()` returns an array of `Morpheme` objects:

```typescript
interface Morpheme {
  surface: string      // Surface form
  pos: string          // Part of speech (English)
  baseForm: string     // Base/dictionary form
  reading: string      // Reading in katakana
  posJa: string        // Part of speech (Japanese)
  conjType: string | null  // Conjugation type
  conjForm: string | null  // Conjugation form
}
```

## Browser Usage

You can also load directly from a CDN:

```html
<script type="module">
  import { Suzume } from 'https://esm.sh/@libraz/suzume'

  const suzume = await Suzume.create()
  const result = suzume.analyze('こんにちは')
  console.log(result)
</script>
```

## Next Steps

- [Installation](/docs/installation) - Detailed setup instructions
- [User Dictionary](/docs/user-dictionary) - Add custom words
- [API Reference](/docs/api) - Full API documentation
- [How It Works](/docs/how-it-works) - Technical deep-dive
