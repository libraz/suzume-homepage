# User Dictionary

Add custom words to improve analysis for your domain.

## Runtime Loading

Load dictionary entries at runtime using `loadUserDictionary()`:

```typescript
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

## Cost Tuning

The `cost` parameter controls word selection priority:

- **Lower cost** = More likely to be selected
- **Default cost** = ~8000
- **Common words** = 5000-7000
- **Rare words** = 9000+

```csv
# Prefer "東京都" over "東京" + "都"
東京都,NOUN,5000

# Less common compound
超電磁砲,NOUN,9000
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
// ['Next.js', 'React', 'アプリ', '作成']
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
