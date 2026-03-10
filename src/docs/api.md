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

### `destroy()`

Frees WASM memory and resources. Call this when done using the instance.

```typescript
destroy(): void
```

**Example:**
```typescript
const suzume = await Suzume.create()
// ... use suzume ...
suzume.destroy() // Free resources
```

---

## Morpheme Interface

Represents a single linguistic token.

```typescript
interface Morpheme {
  surface: string      // Surface form (as appears in text)
  pos: string          // Part of speech (English)
  baseForm: string     // Base/dictionary form
  reading: string      // Reading in katakana
  posJa: string        // Part of speech (Japanese)
  conjType: string | null  // Conjugation type
  conjForm: string | null  // Conjugation form
}
```

### Properties

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `surface` | `string` | Surface form as it appears in text | `"食べ"` |
| `pos` | `string` | Part of speech in English | `"VERB"` |
| `baseForm` | `string` | Dictionary/base form | `"食べる"` |
| `reading` | `string` | Reading in katakana | `"タベ"` |
| `posJa` | `string` | Part of speech in Japanese | `"動詞"` |
| `conjType` | `string \| null` | Conjugation type (for verbs/adjectives) | `"一段"` |
| `conjForm` | `string \| null` | Conjugation form | `"連用形"` |

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

Suzume uses WebAssembly which requires manual memory management. Always call `destroy()` when done:

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
