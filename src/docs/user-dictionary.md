# User Dictionary

Add custom words to improve analysis for your domain.

## Runtime Loading

Load dictionary entries at runtime with a single call:

::: code-group

```typescript [node]
import { Suzume } from '@libraz/suzume'

const suzume = await Suzume.create()

// Add a single word
suzume.loadUserDictionary('ChatGPT,NOUN')

// Add multiple words
suzume.loadUserDictionary(`
スカイツリー,NOUN
ポケモン,NOUN
DeepL,NOUN
`)
```

```python [python]
from suzume import Suzume

sz = Suzume()

# Add a single word
sz.load_user_dict("ChatGPT,NOUN")

# Add multiple words
sz.load_user_dict(
    "スカイツリー,NOUN\n"
    "ポケモン,NOUN\n"
    "DeepL,NOUN\n"
)
```

```bash [cli]
# Pass one or more dictionaries with -d / --dict (repeatable)
suzume-cli analyze -d user.csv "スカイツリーとポケモン"
```

:::

### Checking the result

`loadUserDictionary()` returns a `boolean` — `false` when the supplied dictionary data cannot be parsed or loaded. Check it if a load failure should be handled:

```typescript
if (!suzume.loadUserDictionary(data)) {
  // dictionary could not be loaded — fall back or surface an error
}
```

Prefer the fail-fast variant when a failed load should abort. It throws an error carrying the underlying C API details instead of returning `false`:

```typescript
suzume.loadUserDictionaryOrThrow(data)
```

The binary-dictionary methods (`loadBinaryDictionary()` / `loadBinaryDictionaryOrThrow()`) follow the same pattern. In Python, `load_user_dict()` and `load_binary_dict()` raise `SuzumeError` on failure.

::: tip Parse behavior and startup warnings
Lines with fewer than two fields are silently skipped. Other errors, such as an unknown POS or invalid CSV quoting, fail the load. Check the return value (or use `loadUserDictionaryOrThrow()`) and `lastError` for runtime failures. `dictionaryWarnings` contains warnings produced while automatically loading dictionaries during `Suzume.create()`; it is not a per-call list of skipped runtime lines (`dictionary_warnings` in Python):

```typescript
const loaded = suzume.loadUserDictionary('ChatGPT,NOUN\nbroken-line')
console.log(loaded) // true: "broken-line" is silently ignored
```
:::

## Format

### Basic Format

```
surface,pos
```

| Field | Required | Description |
|-------|----------|-------------|
| `surface` | Yes | The word as it appears in text |
| `pos` | Yes | Part of speech |

### Full Format

```
surface,pos,cost,lemma
```

| Field | Required | Description |
|-------|----------|-------------|
| `surface` | Yes | The word as it appears in text |
| `pos` | Yes | Part of speech |
| `cost` | No | Currently ignored by the parser (see below) |
| `lemma` | No | Base/dictionary form |

## Part of Speech Values

| Value | Description | Japanese |
|-------|-------------|----------|
| `NOUN` | Nouns, proper nouns | 名詞 |
| `VERB` | Verbs | 動詞 |
| `ADJ` | Adjectives | 形容詞 |
| `ADV` | Adverbs | 副詞 |
| `PARTICLE` | Particles | 助詞 |
| `AUX` | Auxiliary verbs | 助動詞 |
| `PRON` | Pronouns | 代名詞 |
| `DET` | Adnominal adjectives | 連体詞 |
| `CONJ` | Conjunctions | 接続詞 |
| `INTJ` | Interjections | 感動詞 |
| `PREFIX` | Prefixes | 接頭辞 |
| `SUFFIX` | Suffixes | 接尾辞 |
| `SYMBOL` | Symbols | 記号 |
| `OTHER` | Uncategorized | その他 |

::: tip Japanese POS names
You can also use Japanese POS names (e.g., `名詞`, `動詞`, `形容詞`) instead of English values.
:::

## Examples

### Tech Terms

```csv
ChatGPT,NOUN
GitHub,NOUN
TypeScript,NOUN
WebAssembly,NOUN
Kubernetes,NOUN
```

### Brand Names

```csv
スカイツリー,NOUN
ポケモン,NOUN
任天堂,NOUN
ソニー,NOUN
```

### Compound Words

```csv
形態素解析,NOUN
機械学習,NOUN
自然言語処理,NOUN
```

### Verbs with Conjugation

```csv
ググる,VERB,5000,ググる
バズる,VERB,5000,バズる
```

## Verifying an Entry Took Effect

Each morpheme exposes `isUserDict`, which is `true` when the token was matched from a loaded user dictionary. Use it to confirm a custom word is actually being applied:

```typescript
suzume.loadUserDictionary('スカイツリー,NOUN')

const result = suzume.analyze('スカイツリーへ行く')
const skytree = result.find((m) => m.surface === 'スカイツリー')

console.log(skytree?.isUserDict) // true — matched from the user dictionary
```

## The Cost Column

The `cost` column is currently **not used** by the parser — its value is never read, and entries are matched regardless of what you put there. You can keep the column for readability, but don't rely on tuning it to influence word selection; a `cost` of `5000` and `9000` behave identically today.

```csv
# The trailing cost value is accepted but ignored
東京都,NOUN,5000
超電磁砲,NOUN,9000

# Equivalent — the entries match the same way without a cost
東京都,NOUN
超電磁砲,NOUN
```

## Use Cases

### Search Indexing

```typescript
// Add domain-specific terms for better tokenization
suzume.loadUserDictionary(`
React,NOUN
Next.js,NOUN
Tailwind,NOUN
`)

const tags = suzume.generateTags('Next.jsでReactアプリを作成')
// [{ tag: 'Next.js', pos: 'NOUN' },
//  { tag: 'Reactアプリ', pos: 'NOUN' },
//  { tag: '作成', pos: 'NOUN' }]
```

### Chat Applications

```typescript
// Add slang and neologisms
suzume.loadUserDictionary(`
草,INTJ
ワロタ,INTJ
エモい,ADJ
`)
```

### E-commerce

```typescript
// Add product names and brands
suzume.loadUserDictionary(`
iPhone,NOUN
MacBook,NOUN
AirPods,NOUN
`)
```

## Best Practices

1. **Keep entries minimal** - Only add words that are mis-tokenized
2. **Use uppercase POS** - `NOUN` not `noun`
3. **Test incrementally** - Add a few words and verify results
4. **Consider compounds** - Add `東京都` if you want it as one token

## Binary Dictionary

For faster loading, dictionaries can be pre-compiled to binary format (.dic) using the `suzume-cli` tool:

```bash
# Compile TSV to binary
suzume-cli dict compile user.tsv   # → user.dic
```

Then load the binary dictionary at runtime:

```typescript
// Node.js
import { readFile } from 'fs/promises'
const dictData = new Uint8Array(await readFile('user.dic'))
suzume.loadBinaryDictionary(dictData)

// Browser
const response = await fetch('/dictionaries/user.dic')
const browserDictData = new Uint8Array(await response.arrayBuffer())
suzume.loadBinaryDictionary(browserDictData)
```

::: tip Performance
Binary dictionaries load significantly faster than CSV format, making them ideal for production deployments with large custom vocabularies.
:::

### .dic Format Overview

The binary dictionary is a compact format with the following layout:

```
[Header (16 bytes, magic: "SZMD")]
[Front-coded surface table]
[POS / ExtendedPOS grammar palette]
[Optional packed-record palette]
[Adaptive entry array (1, 2, or 3 bytes per entry)]
[Optional length-prefixed, deduplicated lemma table (UTF-8)]
```

- **Front-coded surface table** — Stores sorted surface forms compactly by sharing prefixes
- **Grammar palette** — Deduplicates the POS/ExtendedPOS pairs referenced by entries
- **Record palette** — Replaces frequently repeated packed records with one-byte indexes when that is smaller
- **Adaptive entry array** — Selects grammar-only, packed, wide, or record-palette encoding for the dictionary
- **Lemma representation** — Stores only differing lemmas; when every lemma is a nearby surface, entries use relative surface indexes and omit the lemma table entirely

The current pre-1.0 format is version 3 and intentionally does not decode older format versions. During compilation, verbs and adjectives are expanded into their conjugated forms and all entries are sorted. On load, Suzume rebuilds its runtime double-array trie from the compact surface table.

## Persistence

Dictionary entries are stored in memory and lost when the instance is destroyed. To persist:

```typescript
// Load from your storage on init
const savedDict = localStorage.getItem('myDictionary')
if (savedDict) {
  suzume.loadUserDictionary(savedDict)
}

// Save when adding new words
function addWord(word: string, pos: string) {
  const entry = `${word},${pos}`
  suzume.loadUserDictionary(entry)

  // Append to storage
  const current = localStorage.getItem('myDictionary') || ''
  localStorage.setItem('myDictionary', current + '\n' + entry)
}
```

## See also

- [API Reference](/docs/api) — dictionary-loading methods (`loadUserDictionary` / `loadUserDictionaryOrThrow` / `loadBinaryDictionary` / `loadBinaryDictionaryOrThrow`, `dictionaryWarnings`) and the Morpheme fields (`isUserDict`, `isFromDictionary`).
