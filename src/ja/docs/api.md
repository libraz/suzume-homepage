# API リファレンス

## Suzume クラス

日本語トークン化のメインクラス。

### `Suzume.create(wasmPath?)`

新しい Suzume インスタンスを作成します。

```typescript
static async create(wasmPath?: string): Promise<Suzume>
```

| パラメータ | 型 | 説明 |
|-----------|------|-------------|
| `wasmPath` | `string` (省略可) | WASM ファイルのカスタムパス |

**戻り値:** `Promise<Suzume>`

**例:**
```typescript
// 通常の使用
const suzume = await Suzume.create()

// カスタム WASM パス
const suzume = await Suzume.create('/path/to/suzume.wasm')
```

---

### `analyze(text)`

日本語テキストを解析し、トークンの配列を返します。

```typescript
analyze(text: string): Morpheme[]
```

| パラメータ | 型 | 説明 |
|-----------|------|-------------|
| `text` | `string` | 解析する日本語テキスト |

**戻り値:** `Morpheme[]`

**例:**
```typescript
const result = suzume.analyze('東京に行きました')

// 結果:
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

テキストから意味のあるタグ（名詞、固有名詞）を抽出します。検索インデックスや分類に便利です。

```typescript
generateTags(text: string): string[]
```

| パラメータ | 型 | 説明 |
|-----------|------|-------------|
| `text` | `string` | タグを抽出する日本語テキスト |

**戻り値:** `string[]`

**例:**
```typescript
const tags = suzume.generateTags('東京スカイツリーに行きました')
console.log(tags)
// ['東京', 'スカイツリー']
```

---

### `loadUserDictionary(data)`

実行時にカスタム単語を読み込みます。

```typescript
loadUserDictionary(data: string): boolean
```

| パラメータ | 型 | 説明 |
|-----------|------|-------------|
| `data` | `string` | CSV 形式の辞書エントリ |

**戻り値:** `boolean` - 成功時 `true`

**形式:** `表層形,品詞[,コスト][,基本形]`

**例:**
```typescript
// 単一エントリ
suzume.loadUserDictionary('ChatGPT,noun')

// 複数エントリ
suzume.loadUserDictionary(`
ChatGPT,noun
スカイツリー,noun
DeepL,noun
`)
```

---

### `version`

Suzume のバージョン文字列を取得します。

```typescript
get version(): string
```

**例:**
```typescript
console.log(suzume.version) // "1.0.0"
```

---

### `destroy()`

WASM メモリとリソースを解放します。インスタンスの使用が終わったら必ず呼び出してください。

```typescript
destroy(): void
```

**例:**
```typescript
const suzume = await Suzume.create()
// ... suzume を使用 ...
suzume.destroy() // リソースを解放
```

---

## Morpheme インターフェース

単一のトークン（言語単位）を表します。

```typescript
interface Morpheme {
  surface: string      // 表層形（テキスト中の表記）
  pos: string          // 品詞（英語）
  baseForm: string     // 基本形/辞書形
  reading: string      // 読み（カタカナ）
  posJa: string        // 品詞（日本語）
  conjType: string | null  // 活用型
  conjForm: string | null  // 活用形
}
```

### プロパティ

| プロパティ | 型 | 説明 | 例 |
|----------|------|-------------|---------|
| `surface` | `string` | テキスト中の表層形 | `"食べ"` |
| `pos` | `string` | 品詞（英語） | `"verb"` |
| `baseForm` | `string` | 辞書形/基本形 | `"食べる"` |
| `reading` | `string` | カタカナ読み | `"タベ"` |
| `posJa` | `string` | 品詞（日本語） | `"動詞"` |
| `conjType` | `string \| null` | 活用型（動詞/形容詞） | `"一段"` |
| `conjForm` | `string \| null` | 活用形 | `"連用形"` |

### 品詞一覧

| `pos` | `posJa` | 説明 |
|-------|---------|-------------|
| `noun` | 名詞 | 名詞 |
| `verb` | 動詞 | 動詞 |
| `adj` | 形容詞 | 形容詞 |
| `adverb` | 副詞 | 副詞 |
| `particle` | 助詞 | 助詞 |
| `aux` | 助動詞 | 助動詞 |
| `pron` | 代名詞 | 代名詞 |
| `det` | 連体詞 | 連体詞 |
| `conj` | 接続詞 | 接続詞 |
| `interjection` | 感動詞 | 感動詞 |
| `prefix` | 接頭辞 | 接頭辞 |
| `suffix` | 接尾辞 | 接尾辞 |
| `symbol` | 記号 | 記号 |
| `punct` | 句読点 | 句読点 |

---

## エラーハンドリング

```typescript
try {
  const suzume = await Suzume.create()
  const result = suzume.analyze('テスト')
} catch (error) {
  if (error.message === 'Failed to create Suzume instance') {
    console.error('WASM の初期化に失敗しました')
  }
}
```

---

## メモリ管理

Suzume は手動メモリ管理が必要な WebAssembly を使用します。使用後は必ず `destroy()` を呼び出してください：

```typescript
// 良い例：使用後にクリーンアップ
const suzume = await Suzume.create()
try {
  const result = suzume.analyze(text)
  // 結果を処理...
} finally {
  suzume.destroy()
}

// 長時間実行アプリ：インスタンスを再利用
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
