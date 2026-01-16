# User Dictionary

Add custom words to improve analysis for your domain.

## Runtime Loading

Load dictionary entries at runtime using `loadUserDictionary()`:

```typescript
const suzume = await Suzume.create()

// Add a single word
suzume.loadUserDictionary('ChatGPT,noun')

// Add multiple words
suzume.loadUserDictionary(`
スカイツリー,noun
ポケモン,noun
DeepL,noun
`)
```

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
| `cost` | No | Word cost (lower = more likely to be selected) |
| `lemma` | No | Base/dictionary form |

## Part of Speech Values

| Value | Description | Japanese |
|-------|-------------|----------|
| `noun` | Nouns, proper nouns | 名詞 |
| `verb` | Verbs | 動詞 |
| `adj` | Adjectives | 形容詞 |
| `adverb` | Adverbs | 副詞 |
| `prefix` | Prefixes | 接頭辞 |
| `suffix` | Suffixes | 接尾辞 |

## Examples

### Tech Terms

```csv
ChatGPT,noun
GitHub,noun
TypeScript,noun
WebAssembly,noun
Kubernetes,noun
```

### Brand Names

```csv
スカイツリー,noun
ポケモン,noun
任天堂,noun
ソニー,noun
```

### Compound Words

```csv
形態素解析,noun
機械学習,noun
自然言語処理,noun
```

### Verbs with Conjugation

```csv
ググる,verb,5000,ググる
バズる,verb,5000,バズる
```

## Cost Tuning

The `cost` parameter controls word selection priority:

- **Lower cost** = More likely to be selected
- **Default cost** = ~8000
- **Common words** = 5000-7000
- **Rare words** = 9000+

```csv
# Prefer "東京都" over "東京" + "都"
東京都,noun,5000

# Less common compound
超電磁砲,noun,9000
```

## Use Cases

### Search Indexing

```typescript
// Add domain-specific terms for better tokenization
suzume.loadUserDictionary(`
React,noun
Next.js,noun
Tailwind,noun
`)

const tags = suzume.generateTags('Next.jsでReactアプリを作成')
// ['Next.js', 'React', 'アプリ', '作成']
```

### Chat Applications

```typescript
// Add slang and neologisms
suzume.loadUserDictionary(`
草,interjection
ワロタ,interjection
エモい,adj
`)
```

### E-commerce

```typescript
// Add product names and brands
suzume.loadUserDictionary(`
iPhone,noun
MacBook,noun
AirPods,noun
`)
```

## Best Practices

1. **Keep entries minimal** - Only add words that are mis-tokenized
2. **Use lowercase POS** - `noun` not `NOUN`
3. **Test incrementally** - Add a few words and verify results
4. **Consider compounds** - Add `東京都` if you want it as one token

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
