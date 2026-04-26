# API Reference

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
| `preserveVu` | `boolean` | `true` | Preserve ヴ (don't normalize to ビ etc.) |
| `preserveCase` | `boolean` | `true` | Preserve case (don't lowercase ASCII) |
| `preserveSymbols` | `boolean` | `false` | Preserve symbols/emoji in output |

**Returns:** `Promise<Suzume>`

**Example:**
```typescript
// Default usage
const suzume = await Suzume.create()

// Custom WASM path
const suzume = await Suzume.create({ wasmPath: '/path/to/suzume.wasm' })

// With options
const suzume = await Suzume.create({
  preserveSymbols: true,
  preserveVu: false,
})
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

### `generateTags(text, options?)`

Extracts meaningful tags from text. Useful for search indexing, classification, and content analysis. By default extracts content words (nouns, verbs, adjectives, adverbs) while filtering out particles, auxiliaries, formal nouns, and low-information words.

```typescript
generateTags(text: string, options?: TagOptions): Tag[]
```

**`Tag`:**

| Property | Type | Description |
|----------|------|-------------|
| `tag` | `string` | Tag text (surface or lemma depending on `useLemma`) |
| `pos` | `string` | Part of speech (`Noun`, `Verb`, `Adjective`, `Adverb`, etc.) |

| Parameter | Type | Description |
|-----------|------|-------------|
| `text` | `string` | Japanese text to extract tags from |
| `options` | `TagOptions` | Optional tag generation settings |

**`TagOptions`:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `pos` | `('noun' \| 'verb' \| 'adjective' \| 'adverb')[]` | all | POS categories to include |
| `excludeBasic` | `boolean` | `false` | Exclude basic verbs/words with hiragana-only lemma |
| `useLemma` | `boolean` | `true` | Use lemma (dictionary form) instead of surface form |
| `minLength` | `number` | `2` | Minimum tag length in characters |
| `maxTags` | `number` | `0` | Maximum number of tags (0 = unlimited) |

**Returns:** `Tag[]`

**Examples:**

```typescript
// Basic usage
const tags = suzume.generateTags('東京スカイツリーに行きました')
// [{ tag: '東京', pos: 'Noun' },
//  { tag: 'スカイツリー', pos: 'Noun' },
//  { tag: '行く', pos: 'Verb' }]

// Nouns only
const nouns = suzume.generateTags('美しい花が静かに咲いている', {
  pos: ['noun']
})
// [{ tag: '花', pos: 'Noun' }]

// Exclude basic verbs (hiragana-only lemma like する, いる, ある, なる...)
const tags2 = suzume.generateTags('新しいプロジェクトを開始して管理する', {
  excludeBasic: false
})
// [{ tag: '新しい', pos: 'Adjective' },
//  { tag: 'プロジェクト', pos: 'Noun' },
//  { tag: '開始', pos: 'Noun' },
//  { tag: '管理', pos: 'Noun' },
//  { tag: 'する', pos: 'Verb' }]

const tags3 = suzume.generateTags('新しいプロジェクトを開始して管理する', {
  excludeBasic: true
})
// [{ tag: '新しい', pos: 'Adjective' },
//  { tag: 'プロジェクト', pos: 'Noun' },
//  { tag: '開始', pos: 'Noun' },
//  { tag: '管理', pos: 'Noun' }]
// 'する' is excluded (lemma is hiragana-only)

// Limit results
const top3 = suzume.generateTags('東京タワーと東京スカイツリーを見学しました', {
  maxTags: 3
})
// [{ tag: '東京タワー', pos: 'Noun' },
//  { tag: '東京スカイツリー', pos: 'Noun' },
//  { tag: '見学', pos: 'Noun' }]
```

::: tip excludeBasic
`excludeBasic: true` filters out words whose lemma (dictionary form) is written entirely in hiragana. This removes common basic verbs like する, いる, ある, なる, いく, くる etc., while keeping kanji-containing verbs like 開始, 管理, 確認. Useful when you want only content-bearing tags.
:::

<details>
<summary>Filter pipeline</summary>

The tag generator applies these filters in order:

1. **Particles** — excluded (は, が, を, に, etc.)
2. **Auxiliaries** — excluded (です, ます, た, etc.)
3. **Formal nouns** — excluded (こと, もの, ため, etc.)
4. **Low-info words** — excluded (words marked as low information)
5. **Conjunctions** — always excluded
6. **Symbols** — always excluded
7. **POS filter** — if `pos` is set, only matching categories pass
8. **Basic words** — if `excludeBasic: true`, words with hiragana-only lemma are excluded
9. **Min length** — tags shorter than `minLength` characters are excluded
10. **Deduplication** — duplicate tags are removed

</details>

---

### `loadUserDictionary(data)`

Loads custom words into the analyzer at runtime.

```typescript
loadUserDictionary(data: string): boolean
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | `string` | Dictionary entries in CSV format |

**Returns:** `boolean` - `true` on success

**Format:** `surface,pos[,cost][,lemma]`

**Example:**
```typescript
// Single entry
suzume.loadUserDictionary('ChatGPT,NOUN')

// Multiple entries
suzume.loadUserDictionary(`
ChatGPT,NOUN
スカイツリー,NOUN
DeepL,NOUN
`)

// With optional fields
suzume.loadUserDictionary('走る,VERB,5000,走る')
```

---

### `version`

Gets the Suzume version string.

```typescript
get version(): string
```

**Example:**
```typescript
console.log(suzume.version) // "0.1.0"
```

---

### `loadBinaryDictionary(data)`

Loads a pre-compiled binary dictionary (.dic format) at runtime.

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
const dictData = new Uint8Array(await response.arrayBuffer())
suzume.loadBinaryDictionary(dictData)
```

::: tip Binary vs CSV dictionaries
Binary dictionaries (.dic) load faster than CSV format. Use the `suzume-cli dict compile` command to compile a TSV dictionary into binary format.
:::

---

### `destroy()`

Frees WASM memory and resources. Call this when done using the instance.

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
  extendedPos: string  // Extended POS subcategory (English)
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
| `extendedPos` | `string` | Extended POS subcategory | `"VerbRenyokei"` |

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
| `VerbShuushikei` | 終止形: dictionary form | 食べる, 書く |
| `VerbRenyokei` | 連用形: continuative form | 食べ, 書き |
| `VerbMizenkei` | 未然形: irrealis form | 食べ-, 書か- |
| `VerbOnbinkei` | 音便形: euphonic change | 書い-, 泳い- |
| `VerbTeForm` | て形 | 食べて, 書いて |
| `VerbKateikei` | 仮定形: conditional | 食べれば, 書けば |
| `VerbMeireikei` | 命令形: imperative | 食べろ, 書け |
| `VerbRentaikei` | 連体形: attributive | (same as shuushi in modern Japanese) |
| `VerbTaForm` | た形: past | 食べた, 書いた |
| `VerbTaraForm` | たら形: conditional past | 食べたら, 書いたら |

**Adjective forms:**

| Value | Description | Example |
|-------|-------------|---------|
| `AdjBasic` | 終止形: basic form | 美しい, 高い |
| `AdjRenyokei` | 連用形(く): adverbial | 美しく, 高く |
| `AdjStem` | 語幹: stem (ガル接続) | 美し-, 高- |
| `AdjKatt` | かっ形: past stem | 美しかっ-, 高かっ- |
| `AdjKeForm` | け形: conditional stem | 美しけれ- |
| `AdjNaAdj` | ナ形容詞: na-adjective stem | 静か, 綺麗 |

**Auxiliaries:**

| Value | Description | Example |
|-------|-------------|---------|
| `AuxTenseTa` | 過去: past tense | た, だ |
| `AuxTenseMasu` | 丁寧: polite | ます, まし, ませ |
| `AuxNegativeNai` | 否定 | ない, なかっ |
| `AuxNegativeNu` | 否定(古語) | ぬ, ん |
| `AuxDesireTai` | 願望 | たい, たかっ |
| `AuxVolitional` | 意志/推量 | う, よう |
| `AuxPassive` | 受身 | れる, られる |
| `AuxCausative` | 使役 | せる, させる |
| `AuxPotential` | 可能 | れる, られる |
| `AuxAspectIru` | 継続 | いる, い, おる |
| `AuxAspectShimau` | 完了 | しまう, ちゃう |
| `AuxAspectOku` | 準備 | おく, とく |
| `AuxAspectMiru` | 試行 | みる |
| `AuxAspectIku` | 進行方向 | いく |
| `AuxAspectKuru` | 接近 | くる |
| `AuxAppearanceSou` | 様態 | そう |
| `AuxConjectureRashii` | 推定 | らしい |
| `AuxConjectureMitai` | 推定 | みたい |
| `AuxCopulaDa` | 断定 | だ, で, な, なら |
| `AuxCopulaDesu` | 丁寧断定 | です, でし |
| `AuxHonorific` | 尊敬 | れる, られる |
| `AuxGozaru` | 丁重 | ござる |
| `AuxExcessive` | 過度 | すぎる |
| `AuxGaru` | ガル接続 | がる |

**Particles:**

| Value | Description | Example |
|-------|-------------|---------|
| `ParticleCase` | 格助詞 | が, を, に, で, へ, と, から, まで, より |
| `ParticleTopic` | 係助詞 | は, も |
| `ParticleFinal` | 終助詞 | ね, よ, わ, な, か |
| `ParticleConj` | 接続助詞 | て, で, ば, ながら, たり, けど |
| `ParticleQuote` | 引用助詞 | と（引用） |
| `ParticleAdverbial` | 副助詞 | ばかり, だけ, ほど, しか, など |
| `ParticleNo` | 準体助詞 | の |
| `ParticleBinding` | 係結び | こそ, さえ, すら |

**Nouns:**

| Value | Description | Example |
|-------|-------------|---------|
| `Noun` | 普通名詞 | 東京, 天気 |
| `NounFormal` | 形式名詞 | こと, もの, ところ, わけ |
| `NounVerbal` | 連用形転成名詞 | 読み, 書き |
| `NounProper` | 固有名詞 | — |
| `NounProperFamily` | 固有名詞(姓) | 田中, 鈴木 |
| `NounProperGiven` | 固有名詞(名) | 太郎 |
| `NounNumber` | 数詞 | 一, 100 |

**Other:**

| Value | Description |
|-------|-------------|
| `Pronoun` | 代名詞 |
| `PronounInterrogative` | 疑問詞 (何, 誰, どこ) |
| `Adverb` | 副詞 |
| `AdverbQuotative` | 引用副詞 (そう, こう) |
| `Conjunction` | 接続詞 |
| `Determiner` | 連体詞 |
| `Prefix` | 接頭辞 |
| `Suffix` | 接尾辞 |
| `Symbol` | 記号 |
| `Interjection` | 感動詞 |
| `Other` | その他 |
| `Unknown` | 不明 |

---

## Error Handling

```typescript
try {
  const suzume = await Suzume.create()
  const result = suzume.analyze('テスト')
} catch (error) {
  if (error.message === 'Failed to create Suzume instance') {
    console.error('WASM initialization failed')
  }
}
```

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
In Node.js, WASM memory is not tracked by V8's heap size. If you create many instances without calling `destroy()`, memory usage will grow even though the GC sees no pressure. Always call `destroy()` explicitly in server-side code.
:::
