# Getting Started

Suzume is a lightweight Japanese tokenizer. It runs on WASM, so it works in browsers and Node.js alike. Use it when you want Japanese tokenization, base forms, or keyword extraction without running a server.

<TokenizerPlayground />

## Installation

```bash
npm install @libraz/suzume
```

See [Installation](/docs/installation) for all package managers, CDN, and other bindings.

## Basic Usage

```typescript
import { Suzume } from '@libraz/suzume'

// Create an instance
const suzume = await Suzume.create()

// Analyze text
const morphemes = suzume.analyze('今日は良い天気ですね')

for (const m of morphemes) {
  console.log(`${m.surface} [${m.posJa}] - ${m.baseForm}`)
}

// Free resources when done
suzume.destroy()
```

`Suzume.create()` also accepts options that tune tokenization:

```typescript
const suzume = await Suzume.create({ mode: 'search', mergeCompounds: true })
```

Available options include `preserveVu`, `preserveCase`, `preserveSymbols`, `mode` (`'normal'` | `'search'` | `'split'`), `lemmatize`, and `mergeCompounds`. See the [API Reference](/docs/api) for details.

Beyond `destroy()`, the instance also exposes `loadUserDictionary` / `loadUserDictionaryOrThrow`, `loadBinaryDictionary`, and the `dictionaryWarnings` and `lastError` getters — see the [API Reference](/docs/api).

## Common Tasks

### Extract Search Keywords

```typescript
const tags = suzume.generateTags('東京スカイツリーで夜景を撮影しました', {
  excludeBasic: true,
  maxTags: 5,
})

console.log(tags)
// [
//   { tag: '東京', pos: 'NOUN' },
//   { tag: 'スカイツリー', pos: 'NOUN' },
//   { tag: '夜景', pos: 'NOUN' },
//   { tag: '撮影', pos: 'NOUN' }
// ]
```

### Normalize Conjugated Words

```typescript
const morphemes = suzume.analyze('食べさせられなかった')

for (const m of morphemes) {
  if (m.surface !== m.baseForm) {
    console.log(`${m.surface} -> ${m.baseForm}`)
  }
}
```

## Output Format

`analyze()` returns an array of `Morpheme` objects:

```typescript
interface Morpheme {
  surface: string      // Surface form
  pos: string          // Part of speech (English)
  baseForm: string     // Base/dictionary form
  posJa: string        // Part of speech (Japanese)
  conjType: string | null  // Conjugation type
  conjForm: string | null  // Conjugation form
  extendedPos: string  // Extended POS subcategory (e.g. "VerbRenyokei")
  start: number        // Start character offset
  end: number          // End character offset
  isUserDict: boolean       // Came from a loaded user dictionary
  isFormalNoun: boolean     // Formal/dependent noun (e.g. こと, もの)
  isLowInfo: boolean        // Low-information token (function-word-like)
  isUnknown: boolean        // Generated as an unknown word candidate
  isFromDictionary: boolean // Present in the bundled dictionary
  score: number             // Cost/confidence score
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
- [Python Guide](/docs/python) - Using Suzume from Python
- [CLI](/docs/cli) - Command-line usage
- [How It Works](/docs/how-it-works) - Technical deep-dive
