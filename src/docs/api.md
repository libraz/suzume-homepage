# API Reference

This page documents the JavaScript / WASM binding of Suzume, published to npm as [`@libraz/suzume`](/docs/installation). Python, Go, C/C++, and the two command-line interfaces have separate guides.

## Suzume Class

The main class for Japanese tokenization.

### `Suzume.create(options?)`

Creates a new Suzume instance.

```typescript
static async create(options?: SuzumeOptions & { wasmPath?: string }): Promise<Suzume>
```

**`SuzumeOptions`:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `wasmPath` | `string` | `undefined` | Custom path to WASM file |
| `freshWasmModule` | `boolean` | `false` | Instantiate an isolated WASM runtime instead of using the shared cached runtime |
| `preserveVu` | `boolean` | `true` | Preserve ヴ (don't normalize to ビ etc.) |
| `preserveCase` | `boolean` | `true` | Preserve case (don't lowercase ASCII) |
| `preserveSymbols` | `boolean` | `false` | Preserve punctuation-like `SYMBOL` tokens; emoji and content-bearing symbols remain `OTHER` regardless of this option |
| `mode` | `'normal' \| 'search' \| 'split'` | `'normal'` | Analysis mode. Use `search` or `split` for search-oriented segmentation |
| `lemmatize` | `boolean` | `true` | Keep corrected dictionary forms; POS and conjugation annotations are computed either way |
| `mergeCompounds` | `boolean` | `false` | Merge consecutive noun compounds where possible |
| `skipUserDictionary` | `boolean` | `false` | Skip automatic loading of the bundled user dictionary |
| `skipCoreDictionary` | `boolean` | `false` | Skip automatic loading of the bundled L2 core dictionary |
| `skipEnvConfig` | `boolean` | `false` | Ignore native scorer configuration environment variables |
| `reportScorerConfig` | `boolean` | `false` | Add scorer configuration diagnostics to `dictionaryWarnings` |
| `scorerOptions` | `string \| Record<string, unknown>` | `undefined` | Final-priority scorer overrides, supplied as JSON text or an object serialized to JSON |

Currency and unit signs, arrows, mathematical or technical marks, and emoji carry text content, so the default analysis keeps them as `OTHER`. Set `preserveSymbols: true` only when punctuation-like tokens such as `。` must also appear in the result.

**Returns:** `Promise<Suzume>`

**Example:**
```typescript
// Default usage
const defaultSuzume = await Suzume.create()
defaultSuzume.destroy()

// Custom WASM path
const customWasmSuzume = await Suzume.create({ wasmPath: '/path/to/suzume.wasm' })
customWasmSuzume.destroy()

// With options
const searchSuzume = await Suzume.create({
  preserveSymbols: true,
  preserveVu: false,
  mode: 'search',
  mergeCompounds: true,
  scorerOptions: {
    unary: { noun_prior: 0.25 },
  },
})
searchSuzume.destroy()
```

**Analysis modes:**

The `mode` option controls how text is segmented:

- **`normal`** — balanced segmentation for general use (default).
- **`search`** — search-oriented output that merges consecutive noun compounds into larger searchable units.
- **`split`** — the most aggressive segmentation, breaking compounds into their smallest meaningful units.

In `normal` mode, `mergeCompounds` controls noun-compound merging. `search` enables merging, while `split` disables it.

`scorerOptions` is validated during construction, and malformed JSON makes `Suzume.create()` reject. `reportScorerConfig: true` records the active configuration in `dictionaryWarnings`. The WASM build does not read the native scorer environment layer, so `skipEnvConfig` has no additional effect in this binding.

#### Shared WASM runtime

By default, calls with the same `wasmPath` share one cached WASM runtime. Each `Suzume` object has its own analyzer handle and options, but the handles use the same WebAssembly linear memory. `destroy()` releases one handle; it does not unload the cached runtime or affect other handles.

Set `freshWasmModule: true` when an instance must have an isolated runtime. The standalone `version()` function uses the same cache unless it also receives `freshWasmModule: true`.

---

### `mode`

Reads or changes the analysis mode without reloading dictionaries.

```typescript
get mode(): 'normal' | 'search' | 'split'
set mode(value: 'normal' | 'search' | 'split')
```

```typescript
console.log(suzume.mode) // "normal"
suzume.mode = 'split'
```

---

### `analyze(text)`

Analyzes Japanese text and returns an array of tokens.

```typescript
analyze(text: string): Morpheme[]
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `text` | `string` | Japanese text to analyze |

**Returns:** `Morpheme[]`

**Example:**
```typescript
const result = suzume.analyze('東京に行きました')

// Result:
// [
//   { surface: '東京', pos: 'NOUN', posJa: '名詞', ... },
//   { surface: 'に', pos: 'PARTICLE', posJa: '助詞', ... },
//   { surface: '行き', pos: 'VERB', posJa: '動詞', ... },
//   { surface: 'まし', pos: 'AUX', posJa: '助動詞', ... },
//   { surface: 'た', pos: 'AUX', posJa: '助動詞', ... }
// ]
```

---

### `analyzeWithNormalizedText(text)`

Analyzes text and returns both the morphemes and the exact normalized string their offsets refer to.

```typescript
interface AnalysisResult {
  normalizedText: string
  morphemes: Morpheme[]
}

analyzeWithNormalizedText(text: string): AnalysisResult
```

Use the UTF-16 offsets when slicing a JavaScript string:

```typescript
const { normalizedText, morphemes } =
  suzume.analyzeWithNormalizedText('🎉𠮷字を読む')

for (const morpheme of morphemes) {
  const surface = normalizedText.slice(
    morpheme.startUtf16,
    morpheme.endUtf16,
  )
  console.log(surface)
}
```

`start` and `end` are Unicode code-point offsets into `normalizedText`. `startUtf16` and `endUtf16` are JavaScript UTF-16 code-unit offsets and can be passed directly to `String.prototype.slice()`. The two sets differ before or across characters outside the Basic Multilingual Plane, including many emoji and rare kanji. Offsets refer to normalized text, which may differ from the input. Content-bearing symbols and emoji stay in the default output as `OTHER`, so their ranges remain represented even when `preserveSymbols` is `false`.

---

### `generateTags(text, options?)`

Generates tags for search indexing, classification, and content analysis. By default it returns content words (nouns, verbs, adjectives, and adverbs) while filtering out particles, auxiliaries, formal nouns, and low-information words.

```typescript
generateTags(text: string, options?: TagOptions): Tag[]
```

**`Tag`:**

| Property | Type | Description |
|----------|------|-------------|
| `tag` | `string` | Tag text (surface or lemma depending on `useLemma`) |
| `pos` | `string` | Part of speech (`NOUN`, `VERB`, `ADJ`, `ADV`, etc.) |

| Parameter | Type | Description |
|-----------|------|-------------|
| `text` | `string` | Japanese text to extract tags from |
| `options` | `TagOptions` | Optional tag generation settings |

**`TagOptions`:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `posFilter` | `readonly TagPosFilterName[]` | `undefined` (all) | POS categories to include; an empty array also includes every filterable category |
| `pos` | `readonly TagPosFilterName[]` | `undefined` | Deprecated alias for `posFilter`; `posFilter` wins when both are present |
| `excludeBasic` | `boolean` | `false` | Exclude basic verbs/words with hiragana-only lemma |
| `useLemma` | `boolean` | `true` | Use lemma (dictionary form) instead of surface form |
| `minLength` | `number` | `2` | Minimum tag length in characters |
| `maxTags` | `number` | `0` | Maximum number of tags (0 = unlimited) |
| `excludeParticles` | `boolean` | `true` | Exclude particles |
| `excludeAuxiliaries` | `boolean` | `true` | Exclude auxiliaries |
| `excludeFormalNouns` | `boolean` | `true` | Exclude formal nouns such as こと and もの |
| `excludeLowInfo` | `boolean` | `true` | Exclude low-information words |
| `removeDuplicates` | `boolean` | `true` | Remove duplicate tags |

`TagPosFilterName` is `'noun' | 'verb' | 'adjective' | 'adverb' | 'particle' | 'auxiliary'`. Unknown names throw an `Error`. Particles and auxiliaries also require their exclusion option to be disabled.

**Returns:** `Tag[]`

**Examples:**

```typescript
// Basic usage
const tags = suzume.generateTags('東京スカイツリーに行きました')
// [{ tag: '東京', pos: 'NOUN' },
//  { tag: 'スカイツリー', pos: 'NOUN' },
//  { tag: '行く', pos: 'VERB' }]

// Nouns only
const nouns = suzume.generateTags('美しい花が静かに咲いている', {
  posFilter: ['noun'],
  minLength: 1,
})
// [{ tag: '花', pos: 'NOUN' }]

// Particles and auxiliaries
const functionWords = suzume.generateTags('花が咲きます', {
  posFilter: ['particle', 'auxiliary'],
  excludeParticles: false,
  excludeAuxiliaries: false,
  minLength: 1,
})
// [{ tag: 'が', pos: 'PARTICLE' },
//  { tag: 'ます', pos: 'AUX' }]

// Exclude basic verbs (hiragana-only lemma like する, いる, ある, なる...)
const tags2 = suzume.generateTags('新しいプロジェクトを開始して管理する', {
  excludeBasic: false
})
// [{ tag: '新しい', pos: 'ADJ' },
//  { tag: 'プロジェクト', pos: 'NOUN' },
//  { tag: '開始', pos: 'NOUN' },
//  { tag: 'する', pos: 'VERB' },
//  { tag: '管理', pos: 'NOUN' }]

const tags3 = suzume.generateTags('新しいプロジェクトを開始して管理する', {
  excludeBasic: true
})
// [{ tag: '新しい', pos: 'ADJ' },
//  { tag: 'プロジェクト', pos: 'NOUN' },
//  { tag: '開始', pos: 'NOUN' },
//  { tag: '管理', pos: 'NOUN' }]
// 'する' is excluded (lemma is hiragana-only)

// Limit results
const top3 = suzume.generateTags('東京タワーと東京スカイツリーを見学しました', {
  maxTags: 3
})
// [{ tag: '東京', pos: 'NOUN' },
//  { tag: 'タワー', pos: 'NOUN' },
//  { tag: 'スカイツリー', pos: 'NOUN' }]
```

::: tip excludeBasic
`excludeBasic: true` filters out words whose lemma (dictionary form) is written entirely in hiragana. It removes entries such as する, いる, ある, なる, いく, and くる while keeping kanji-containing entries such as 開始, 管理, and 確認.
:::

<details>
<summary>Filter pipeline</summary>

The tag generator applies these filters in order:

1. **Particles** — excluded when `excludeParticles` is `true` (default)
2. **Auxiliaries** — excluded when `excludeAuxiliaries` is `true` (default)
3. **Formal nouns** — excluded when `excludeFormalNouns` is `true` (default)
4. **Low-info words** — excluded when `excludeLowInfo` is `true` (default)
5. **Conjunctions** — always excluded
6. **Symbols** — always excluded
7. **POS filter** — if `posFilter` is non-empty, only matching categories pass
8. **Basic words** — if `excludeBasic: true`, words with hiragana-only lemma are excluded
9. **Tag text** — the lemma or surface is selected according to `useLemma`
10. **Min length** — tags shorter than `minLength` Unicode characters are excluded
11. **Deduplication** — duplicate tags are removed when `removeDuplicates` is `true`
12. **Result limit** — generation stops at `maxTags`; `0` is unlimited

</details>

---

### `loadUserDictionary(data)`

Adds source dictionary entries to the analyzer. Loads are cumulative until `clearUserDictionaries()` is called.

```typescript
loadUserDictionary(data: string): boolean
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | `string` | Dictionary entries in the current TSV format; legacy CSV is also accepted |

**Returns:** `boolean` — `true` when at least one expanded entry was installed.

**Current format:** `surface<TAB>POS[<TAB>conj_type][<TAB>lemma]`. The conjugation type is optional; specify it when inflected forms should be expanded. A third field that is not a recognized conjugation type is treated as the lemma. See [User Dictionaries](/docs/user-dictionary) for the complete format.

**Example:**
```typescript
// Single entry
suzume.loadUserDictionary('ChatGPT\tNOUN\n')

// Multiple entries
suzume.loadUserDictionary(`
ChatGPT	NOUN
スカイツリー	NOUN
DeepL	NOUN
`)

// Conjugating entry
suzume.loadUserDictionary('検査する\tVERB\tSURU\n')
```

---

### `loadUserDictionaryCount(data)`

Loads a source dictionary and returns the number of expanded entries installed.

```typescript
loadUserDictionaryCount(data: string): number
```

One source row can install multiple entries when Suzume expands conjugated forms, so the result can exceed the number of rows. A return value of `0` means the load failed; inspect `lastError` and `lastErrorCode`, or use `loadUserDictionaryOrThrow()`. Nonfatal skipped-row and expansion diagnostics are appended to `dictionaryWarnings`.

---

### `loadUserDictionaryOrThrow(data)`

Loads a source user dictionary and throws a `SuzumeError` with C API details when no entry can be installed.

```typescript
loadUserDictionaryOrThrow(data: string): void
```

Use this form during setup or tests when a malformed dictionary should fail fast.

---

### `loadBinaryDictionary(data)`

Adds a compiled binary dictionary (`.dic`) at runtime. Binary and source dictionary loads are cumulative.

```typescript
loadBinaryDictionary(data: Uint8Array): boolean
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | `Uint8Array` | Binary dictionary data (.dic format) |

**Returns:** `boolean` - `true` on success

**Example:**
```typescript
// Load from file (Node.js)
import { readFile } from 'fs/promises'
const dictData = new Uint8Array(await readFile('custom.dic'))
suzume.loadBinaryDictionary(dictData)

// Load from URL (Browser)
const response = await fetch('/dictionaries/custom.dic')
const browserDictData = new Uint8Array(await response.arrayBuffer())
suzume.loadBinaryDictionary(browserDictData)
```

::: tip Binary vs source dictionaries
Binary dictionaries (`.dic`) load faster than source TSV. Use `suzume-cli dict compile` to compile a TSV dictionary.
:::

---

### `loadBinaryDictionaryOrThrow(data)`

Loads a compiled binary dictionary and throws an error with C API details when loading fails.

```typescript
loadBinaryDictionaryOrThrow(data: Uint8Array): void
```

---

### `clearUserDictionaries()`

Removes dictionaries loaded by the caller and clears their runtime warnings. The automatically loaded bundled user dictionary, if present, remains installed.

```typescript
clearUserDictionaries(): void
```

---

### `hasCoreDictionary`

Reports whether the bundled L2 core dictionary is loaded.

```typescript
get hasCoreDictionary(): boolean
```

This is `false` when the analyzer was created with `skipCoreDictionary: true` or when automatic core-dictionary loading failed.

---

### `version`

Gets the Suzume version string.

```typescript
get version(): string
```

**Example:**
```typescript
console.log(suzume.version) // "0.9.9"
```

This getter does not require a live analyzer handle and remains available after `destroy()`.

---

### `version(options?)`

Returns the version without creating an analyzer handle.

```typescript
import { version } from '@libraz/suzume'

const current = await version()
console.log(current) // "0.9.9"
```

```typescript
function version(options?: {
  wasmPath?: string
  freshWasmModule?: boolean
}): Promise<string>
```

The function is asynchronous because it must instantiate or retrieve the WASM runtime.

---

### `lastError`

Returns the last C API error for the current thread, or an empty string if the last C API call succeeded.

```typescript
get lastError(): string
```

Read it immediately after a method returns `false` or `0`; a later C API call can replace it.

---

### `lastErrorCode`

Returns the stable native error category for the last failed C ABI call.

```typescript
get lastErrorCode(): ErrorCode
```

---

### `dictionaryWarnings`

Returns nonfatal diagnostics recorded for this analyzer.

```typescript
get dictionaryWarnings(): string[]
```

The array contains constructor-time dictionary-loading diagnostics, optional scorer-configuration diagnostics, and warnings from successful source dictionary loads, such as skipped records or duplicate expanded entries. `clearUserDictionaries()` removes warnings from caller-loaded source dictionaries while retaining construction diagnostics. A fatal load failure is reported through the method's return value or exception and through `lastError` / `lastErrorCode`.

---

### `wasmMemoryBytes()`

Returns the current size of this runtime's WebAssembly linear memory in bytes.

```typescript
wasmMemoryBytes(): number
```

Instances on the shared runtime report the same underlying memory size.

---

### `destroy()`

Releases this analyzer handle and its allocations. The shared WASM runtime remains cached for other and future instances.

```typescript
destroy(): void
```

::: info Automatic cleanup via FinalizationRegistry
Suzume registers a `FinalizationRegistry` callback, so resources will be freed automatically when the instance is garbage collected. However, calling `destroy()` explicitly is recommended for immediate cleanup — especially in Node.js where GC timing is unpredictable and WASM memory is not visible to the GC's heap pressure heuristics.
:::

**Example:**
```typescript
const suzume = await Suzume.create()
// ... use suzume ...
suzume.destroy() // Free resources immediately
```

---

## Morpheme Interface

Represents a single linguistic token.

```typescript
interface Morpheme {
  surface: string      // Surface form (as appears in text)
  pos: string          // Part of speech (English)
  baseForm: string     // Base/dictionary form
  posJa: string        // Part of speech (Japanese)
  conjType: string | null  // Conjugation type
  conjForm: string | null  // Conjugation form
  extendedPos: string  // Stable extended POS code (e.g. "VERB_連用")
  start: number        // Start Unicode code-point offset in normalized text
  end: number          // End Unicode code-point offset in normalized text
  startUtf16: number   // Start JavaScript UTF-16 offset
  endUtf16: number     // End JavaScript UTF-16 offset
  isUserDict: boolean
  isFormalNoun: boolean
  isLowInfo: boolean
  isUnknown: boolean
  isFromDictionary: boolean
  score: number
}
```

### Properties

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `surface` | `string` | Surface form as it appears in text | `"食べ"` |
| `pos` | `string` | Part of speech in English | `"VERB"` |
| `baseForm` | `string` | Dictionary/base form | `"食べる"` |
| `posJa` | `string` | Part of speech in Japanese | `"動詞"` |
| `conjType` | `string \| null` | Conjugation type (for verbs/adjectives) | `"一段"` |
| `conjForm` | `string \| null` | Conjugation form | `"連用形"` |
| `extendedPos` | `string` | Stable extended POS code | `"VERB_連用"` |
| `start` | `number` | Start Unicode code-point offset in normalized text | `0` |
| `end` | `number` | End Unicode code-point offset in normalized text | `2` |
| `startUtf16` | `number` | Start JavaScript UTF-16 offset in normalized text | `0` |
| `endUtf16` | `number` | End JavaScript UTF-16 offset in normalized text | `2` |
| `isUserDict` | `boolean` | True when matched from a user dictionary | `false` |
| `isFormalNoun` | `boolean` | True for formal nouns such as こと and もの | `false` |
| `isLowInfo` | `boolean` | True when marked as low information for tag generation | `false` |
| `isUnknown` | `boolean` | True when generated as an unknown-word candidate | `false` |
| `isFromDictionary` | `boolean` | True when matched from any dictionary | `true` |
| `score` | `number` | Candidate score/cost used by the analyzer | `12.5` |

### Part of Speech Values

| `pos` | `posJa` | Description |
|-------|---------|-------------|
| `NOUN` | 名詞 | Nouns |
| `VERB` | 動詞 | Verbs |
| `ADJ` | 形容詞 | Adjectives |
| `ADV` | 副詞 | Adverbs |
| `PARTICLE` | 助詞 | Particles |
| `AUX` | 助動詞 | Auxiliary verbs |
| `PRON` | 代名詞 | Pronouns |
| `DET` | 連体詞 | Adnominal adjectives |
| `CONJ` | 接続詞 | Conjunctions |
| `INTJ` | 感動詞 | Interjections |
| `PREFIX` | 接頭辞 | Prefixes |
| `SUFFIX` | 接尾辞 | Suffixes |
| `SYMBOL` | 記号 | Symbols |
| `OTHER` | その他 | Other/Unknown |

### Extended POS Values

The `extendedPos` property provides fine-grained subcategories beyond the basic `pos` tag. This is useful when you need to distinguish conjugation forms, particle roles, auxiliary functions, or noun subtypes.

**Verb forms:**

| Value | Description | Example |
|-------|-------------|---------|
| `VERB_終止` | 終止形: dictionary form | 食べる, 書く |
| `VERB_連用` | 連用形: continuative form | 食べ, 書き |
| `VERB_未然` | 未然形: irrealis form | 食べ-, 書か- |
| `VERB_音便` | 音便形: euphonic change | 書い-, 泳い- |
| `VERB_て形` | て形 | 食べて, 書いて |
| `VERB_仮定` | 仮定形: conditional | 食べれば, 書けば |
| `VERB_仮定縮約` | Colloquial conditional with fused ば | 行きゃ, 食べりゃ, すりゃ |
| `VERB_命令` | 命令形: imperative | 食べろ, 書け |
| `VERB_連体` | 連体形: attributive | (same as shuushi in modern Japanese) |
| `VERB_た形` | た形: past | 食べた, 書いた |
| `VERB_たら形` | たら形: conditional past | 食べたら, 書いたら |

**Adjective forms:**

| Value | Description | Example |
|-------|-------------|---------|
| `ADJ_終止` | 終止形: basic form | 美しい, 高い |
| `ADJ_連用` | 連用形(く): adverbial | 美しく, 高く |
| `ADJ_語幹` | 語幹: stem (ガル接続) | 美し-, 高- |
| `ADJ_かっ` | かっ形: past stem | 美しかっ-, 高かっ- |
| `ADJ_け形` | け形: conditional stem | 美しけれ- |
| `ADJ_未然` | 未然形 | 美しくな- |
| `ADJ_NA` | ナ形容詞: na-adjective stem | 静か, 綺麗 |

**Auxiliaries:**

| Value | Description | Example |
|-------|-------------|---------|
| `AUX_過去` | 過去: past tense | た, だ |
| `AUX_丁寧` | 丁寧: polite | ます, まし, ませ |
| `AUX_否定` | 否定 | ない, なかっ |
| `AUX_否定古` | 否定(古語) | ぬ, ん |
| `AUX_打消推量` | 打消推量 | まい |
| `AUX_文語断定` | 文語の断定 | なり |
| `AUX_文語過去` | 文語の過去 | けり |
| `AUX_文語断定連体` | 文語の断定・連体 | たる |
| `AUX_文語完了` | 文語の完了 | つ, ぬ |
| `AUX_文語過去キ` | Classical past auxiliary き and its inflections | き, し, しか |
| `AUX_文語当為` | 文語の当為 | べし |
| `AUX_不可能` | 不可能 | かねる |
| `AUX_授受` | 授受 | あげる, くれる, もらう |
| `AUX_願望` | 願望 | たい, たかっ |
| `AUX_意志` | 意志/推量 | う, よう |
| `AUX_受身` | 受身 | れる, られる |
| `AUX_使役` | 使役 | せる, させる |
| `AUX_可能` | 可能 | れる, られる |
| `AUX_継続` | 継続 | いる, い, おる |
| `AUX_完了` | 完了 | しまう, ちゃう |
| `AUX_準備` | 準備 | おく, とく |
| `AUX_試行` | 試行 | みる |
| `AUX_進行` | 進行方向 | いく |
| `AUX_接近` | 接近 | くる |
| `AUX_開始` | 開始 | はじめる |
| `AUX_様態` | 様態 | そう |
| `AUX_推定` | 推定 | らしい |
| `AUX_みたい` | 推定 | みたい |
| `AUX_断定` | 断定 | だ, で, な, なら |
| `AUX_丁寧断定` | 丁寧断定 | です, でし |
| `AUX_尊敬` | 尊敬 | れる, られる |
| `AUX_丁重` | 丁重 | ござる |
| `AUX_過度` | 過度 | すぎる |
| `AUX_ガル` | ガル接続 | がる |
| `AUX_よう` | 様態・比況 | よう |
| `AUX_KURUWA_POLITE` | 丁寧な補助表現 | くるわ |

**Particles:**

| Value | Description | Example |
|-------|-------------|---------|
| `PART_格` | 格助詞 | が, を, に, で, へ, と, から, まで, より |
| `PART_係` | 係助詞 | は, も |
| `PART_終` | 終助詞 | ね, よ, わ, な, か |
| `PART_接続` | 接続助詞 | て, で, ば, ながら, たり, けど |
| `PART_引用` | 引用助詞 | と（引用） |
| `PART_副` | 副助詞 | ばかり, だけ, ほど, しか, など |
| `PART_準体` | 準体助詞 | の |
| `PART_係結` | 係結び | こそ, さえ, すら |

**Nouns:**

| Value | Description | Example |
|-------|-------------|---------|
| `NOUN` | 普通名詞 | 東京, 天気 |
| `NOUN_形式` | 形式名詞 | こと, もの, ところ, わけ |
| `NOUN_転成` | 連用形転成名詞 | 読み, 書き |
| `NOUN_固有` | 固有名詞 | — |
| `NOUN_姓` | 固有名詞(姓) | 田中, 鈴木 |
| `NOUN_名` | 固有名詞(名) | 太郎 |
| `NOUN_数` | 数詞 | 一, 100 |

**Other:**

| Value | Description |
|-------|-------------|
| `PRON` | 代名詞 |
| `PRON_疑問` | 疑問詞 (何, 誰, どこ) |
| `ADV` | 副詞 |
| `ADV_引用` | 引用副詞 (そう, こう) |
| `CONJ` | 接続詞 |
| `DET` | 連体詞 |
| `PREFIX` | 接頭辞 |
| `SUFFIX` | 接尾辞 |
| `SUFFIX_直後` | 直後を表す接尾辞 |
| `SUFFIX_傾向` | 傾向を表す接尾辞 |
| `DET_引用` | 引用を伴う連体詞 |
| `SYMBOL` | 記号 |
| `INTJ` | 感動詞 |
| `OTHER` | その他 |
| `UNKNOWN` | 不明 |

---

## Error Handling

Native failures are represented by `SuzumeError`, which extends `Error` and carries a stable `ErrorCode`.

```typescript
enum ErrorCode {
  Success = 0,
  InvalidUtf8 = 1,
  DictionaryLoadFailed = 2,
  FileNotFound = 3,
  Parse = 4,
  OutOfMemory = 5,
  InvalidInput = 6,
  Internal = 7,
}

class SuzumeError extends Error {
  readonly code: ErrorCode
  constructor(message: string, code?: ErrorCode)
}
```

```typescript
import { ErrorCode, Suzume, SuzumeError } from '@libraz/suzume'

let suzume: Suzume | undefined
try {
  suzume = await Suzume.create()
  suzume.analyze('\uD800') // unpaired UTF-16 surrogate
} catch (error) {
  if (error instanceof SuzumeError) {
    console.error(ErrorCode[error.code], error.message)
  }
} finally {
  suzume?.destroy()
}
```

`Suzume.create()`, `analyze()`, `analyzeWithNormalizedText()`, `generateTags()`, the `OrThrow` dictionary methods, mode changes, and `clearUserDictionaries()` throw on native failure. The non-throwing dictionary methods return `false` or `0`; use `lastError` and `lastErrorCode` for details.

::: danger WebAssembly out-of-memory behavior
An allocation failure aborts the WASM runtime instead of returning a normal `OutOfMemory` result. It does not follow the catchable `SuzumeError` path, and the affected runtime cannot be reused. Because instances share a runtime by default, an abort also invalidates the other handles on that runtime. Process long documents in chunks, and use `freshWasmModule: true` when failure isolation is required.
:::

---

## Memory Management

Suzume uses WebAssembly which allocates memory outside the JavaScript heap. A `FinalizationRegistry` ensures cleanup on GC, but explicit `destroy()` is strongly recommended — especially in Node.js where GC timing is unpredictable and WASM memory is invisible to the GC's heap pressure heuristics.

```typescript
// Good: Clean up when done
const suzume = await Suzume.create()
try {
  const result = suzume.analyze(text)
  // process result...
} finally {
  suzume.destroy()
}

// For long-running apps: reuse the instance
class MyApp {
  private suzume: Suzume | null = null

  async init() {
    this.suzume = await Suzume.create()
  }

  analyze(text: string) {
    return this.suzume?.analyze(text) ?? []
  }

  dispose() {
    this.suzume?.destroy()
    this.suzume = null
  }
}
```

::: warning Node.js
In Node.js, WASM memory is not tracked by V8's heap size. If you create many handles without calling `destroy()`, memory usage can grow even though the GC sees no pressure. Call `destroy()` explicitly in server-side code.
:::
