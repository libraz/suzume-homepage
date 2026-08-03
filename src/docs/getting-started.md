# Getting Started

Suzume is a lightweight Japanese tokenizer available through JavaScript/WASM, Python, Go, native C/C++, and command-line interfaces. Use it for Japanese tokenization, base forms, or keyword extraction in the runtime that fits your application.

<TokenizerPlayground />

## Choose a Binding

| Environment | Start here |
|-------------|------------|
| Browser, Node.js, Deno, Bun | Continue with the JavaScript/WASM walkthrough below |
| Python application or `suzume` command | [Python guide](/docs/python) and [Python CLI](/docs/python-cli) |
| Go service or command | [Go bindings](/docs/go) |
| Native C or C++ application | [C / C++ library](/docs/cpp) |
| Dictionary development and native diagnostics | [Native CLI](/docs/cli) |

## JavaScript/WASM Walkthrough

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

Available options also cover bundled-dictionary loading, scorer configuration, and isolated WASM runtimes. See the [API Reference](/docs/api) for all defaults and trade-offs.

The `mode` property can be changed after creation without reloading dictionaries. Instances share a cached WASM runtime by default; pass `freshWasmModule: true` only when separate linear memory is required.

Beyond `destroy()`, the instance exposes text and binary dictionary loading, installed-entry counts, caller-dictionary clearing, dictionary status, stable error codes, and warnings. See the [API Reference](/docs/api).

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
  extendedPos: string  // Extended POS subcategory (e.g. "VERB_連用")
  start: number        // Start Unicode code-point offset in normalized text
  end: number          // End Unicode code-point offset in normalized text
  startUtf16: number   // Start offset for JavaScript String.slice()
  endUtf16: number     // End offset for JavaScript String.slice()
  isUserDict: boolean       // Came from a loaded user dictionary
  isFormalNoun: boolean     // Formal/dependent noun (e.g. こと, もの)
  isLowInfo: boolean        // Low-information token (function-word-like)
  isUnknown: boolean        // Generated as an unknown word candidate
  isFromDictionary: boolean // Matched from a core or user dictionary
  score: number             // Candidate score/cost used by the analyzer
}
```

`start` and `end` are Unicode code-point offsets into the normalized text. Use `analyzeWithNormalizedText()` when you need that exact text; use `startUtf16` and `endUtf16` to slice it with JavaScript:

```typescript
const { normalizedText, morphemes } =
  suzume.analyzeWithNormalizedText('ＡＢＣを検索')

for (const m of morphemes) {
  console.log(normalizedText.slice(m.startUtf16, m.endUtf16))
}
```

## Browser Usage

You can also load directly from a CDN:

```html
<script type="module">
  import { Suzume } from 'https://cdn.jsdelivr.net/npm/@libraz/suzume/dist/index.js'

  const suzume = await Suzume.create()
  const result = suzume.analyze('こんにちは')
  console.log(result)
  suzume.destroy()
</script>
```

## Next Steps

- [Installation](/docs/installation) - Detailed setup instructions
- [User Dictionary](/docs/user-dictionary) - Add custom words
- [API Reference](/docs/api) - Full API documentation
- [Python Guide](/docs/python) - Using Suzume from Python
- [Python CLI](/docs/python-cli) - Analysis from the Python wheel
- [Go Bindings](/docs/go) - Using Suzume from Go
- [C / C++ Library](/docs/cpp) - Native C++ wrapper and C ABI
- [Native Developer CLI](/docs/cli) - Dictionary and test workflows
- [How It Works](/docs/how-it-works) - Technical deep-dive
