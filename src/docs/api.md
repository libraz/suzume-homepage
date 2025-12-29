# API Reference

## Suzume Class

The main class for Japanese tokenization.

### `Suzume.create(wasmPath?)`

Creates a new Suzume instance.

```typescript
static async create(wasmPath?: string): Promise<Suzume>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `wasmPath` | `string` (optional) | Custom path to WASM file |

**Returns:** `Promise<Suzume>`

**Example:**
```typescript
// Default usage
const suzume = await Suzume.create()

// Custom WASM path
const suzume = await Suzume.create('/path/to/suzume.wasm')
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
//   { surface: '東京', pos: 'noun', posJa: '名詞', ... },
//   { surface: 'に', pos: 'particle', posJa: '助詞', ... },
//   { surface: '行き', pos: 'verb', posJa: '動詞', ... },
//   { surface: 'まし', pos: 'aux', posJa: '助動詞', ... },
//   { surface: 'た', pos: 'aux', posJa: '助動詞', ... }
// ]
```

---

### `generateTags(text)`

Extracts meaningful tags (nouns, proper nouns) from text. Useful for search indexing and classification.

```typescript
generateTags(text: string): string[]
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `text` | `string` | Japanese text to extract tags from |

**Returns:** `string[]`

**Example:**
```typescript
const tags = suzume.generateTags('東京スカイツリーに行きました')
console.log(tags)
// ['東京', 'スカイツリー']
```

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
suzume.loadUserDictionary('ChatGPT,noun')

// Multiple entries
suzume.loadUserDictionary(`
ChatGPT,noun
スカイツリー,noun
DeepL,noun
`)

// With optional fields
suzume.loadUserDictionary('走る,verb,5000,走る')
```

---

### `version`

Gets the Suzume version string.

```typescript
get version(): string
```

**Example:**
```typescript
console.log(suzume.version) // "1.0.0"
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
| `pos` | `string` | Part of speech in English | `"verb"` |
| `baseForm` | `string` | Dictionary/base form | `"食べる"` |
| `reading` | `string` | Reading in katakana | `"タベ"` |
| `posJa` | `string` | Part of speech in Japanese | `"動詞"` |
| `conjType` | `string \| null` | Conjugation type (for verbs/adjectives) | `"一段"` |
| `conjForm` | `string \| null` | Conjugation form | `"連用形"` |

### Part of Speech Values

| `pos` | `posJa` | Description |
|-------|---------|-------------|
| `noun` | 名詞 | Nouns |
| `verb` | 動詞 | Verbs |
| `adj` | 形容詞 | Adjectives |
| `adverb` | 副詞 | Adverbs |
| `particle` | 助詞 | Particles |
| `aux` | 助動詞 | Auxiliary verbs |
| `pron` | 代名詞 | Pronouns |
| `det` | 連体詞 | Adnominal adjectives |
| `conj` | 接続詞 | Conjunctions |
| `interjection` | 感動詞 | Interjections |
| `prefix` | 接頭辞 | Prefixes |
| `suffix` | 接尾辞 | Suffixes |
| `symbol` | 記号 | Symbols |
| `punct` | 句読点 | Punctuation |

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
