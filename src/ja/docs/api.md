# API リファレンス

## Suzume クラス

日本語トークン化のメインクラス。

### `Suzume.create(options?)`

新しい Suzume インスタンスを作成します。

```typescript
static async create(options?: SuzumeOptions & { wasmPath?: string }): Promise<Suzume>
```

**`SuzumeOptions`:**

| オプション | 型 | デフォルト | 説明 |
|-----------|------|---------|-------------|
| `wasmPath` | `string` | `undefined` | WASM ファイルのカスタムパス |
| `preserveVu` | `boolean` | `true` | ヴを保持（ビ等に正規化しない） |
| `preserveCase` | `boolean` | `true` | 大文字小文字を保持（ASCII を小文字化しない） |
| `preserveSymbols` | `boolean` | `false` | 記号・絵文字を出力に保持 |

**戻り値:** `Promise<Suzume>`

**例:**
```typescript
// 通常の使用
const suzume = await Suzume.create()

// カスタム WASM パス
const suzume = await Suzume.create({ wasmPath: '/path/to/suzume.wasm' })

// オプション指定
const suzume = await Suzume.create({
  preserveSymbols: true,
  preserveVu: false,
})
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
//   { surface: '東京', pos: 'NOUN', posJa: '名詞', ... },
//   { surface: 'に', pos: 'PARTICLE', posJa: '助詞', ... },
//   { surface: '行き', pos: 'VERB', posJa: '動詞', ... },
//   { surface: 'まし', pos: 'AUX', posJa: '助動詞', ... },
//   { surface: 'た', pos: 'AUX', posJa: '助動詞', ... }
// ]
```

---

### `generateTags(text, options?)`

テキストから意味のあるタグを抽出します。検索インデックス、分類、コンテンツ分析に便利です。デフォルトでは内容語（名詞、動詞、形容詞、副詞）を抽出し、助詞、助動詞、形式名詞、低情報語を除外します。

```typescript
generateTags(text: string, options?: TagOptions): Tag[]
```

**`Tag`:**

| プロパティ | 型 | 説明 |
|----------|------|-------------|
| `tag` | `string` | タグテキスト（`useLemma` 設定に応じて表層形または原形） |
| `pos` | `string` | 品詞（`Noun`, `Verb`, `Adjective`, `Adverb` 等） |

| パラメータ | 型 | 説明 |
|-----------|------|-------------|
| `text` | `string` | タグを抽出する日本語テキスト |
| `options` | `TagOptions` | タグ生成のオプション設定 |

**`TagOptions`:**

| オプション | 型 | デフォルト | 説明 |
|-----------|------|---------|-------------|
| `pos` | `('noun' \| 'verb' \| 'adjective' \| 'adverb')[]` | 全て | 抽出する品詞カテゴリ |
| `excludeBasic` | `boolean` | `false` | ひらがなのみの原形を持つ基本動詞等を除外 |
| `useLemma` | `boolean` | `true` | 表層形の代わりに原形（辞書形）を使用 |
| `minLength` | `number` | `2` | タグの最小文字数 |
| `maxTags` | `number` | `0` | タグの最大数（0 = 無制限） |

**戻り値:** `Tag[]`

**例:**

```typescript
// 基本的な使い方
const tags = suzume.generateTags('東京スカイツリーに行きました')
// [{ tag: '東京', pos: 'Noun' },
//  { tag: 'スカイツリー', pos: 'Noun' },
//  { tag: '行く', pos: 'Verb' }]

// 名詞のみ
const nouns = suzume.generateTags('美しい花が静かに咲いている', {
  pos: ['noun']
})
// [{ tag: '花', pos: 'Noun' }]

// 基本動詞の除外（する、いる、ある、なる等のひらがなのみの原形を持つ語）
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
// 'する' は除外される（原形がひらがなのみ）

// 結果数を制限
const top3 = suzume.generateTags('東京タワーと東京スカイツリーを見学しました', {
  maxTags: 3
})
// [{ tag: '東京タワー', pos: 'Noun' },
//  { tag: '東京スカイツリー', pos: 'Noun' },
//  { tag: '見学', pos: 'Noun' }]
```

::: tip excludeBasic
`excludeBasic: true` は原形（辞書形）がすべてひらがなで書かれた語を除外します。する、いる、ある、なる、いく、くる等の基本動詞が除外される一方、開始、管理、確認等の漢字を含む動詞は保持されます。内容を表すタグのみが必要な場合に有用です。
:::

<details>
<summary>フィルタパイプライン</summary>

タグジェネレーターは以下の順序でフィルタを適用します：

1. **助詞** — 除外（は、が、を、に 等）
2. **助動詞** — 除外（です、ます、た 等）
3. **形式名詞** — 除外（こと、もの、ため 等）
4. **低情報語** — 除外（低情報としてマークされた語）
5. **接続詞** — 常に除外
6. **記号** — 常に除外
7. **品詞フィルタ** — `pos` が設定されている場合、一致するカテゴリのみ通過
8. **基本語** — `excludeBasic: true` の場合、ひらがなのみの原形を持つ語を除外
9. **最小文字数** — `minLength` 文字未満のタグを除外
10. **重複排除** — 重複タグを削除

</details>

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
suzume.loadUserDictionary('ChatGPT,NOUN')

// 複数エントリ
suzume.loadUserDictionary(`
ChatGPT,NOUN
スカイツリー,NOUN
DeepL,NOUN
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
console.log(suzume.version) // "0.1.0"
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
| `pos` | `string` | 品詞（英語） | `"VERB"` |
| `baseForm` | `string` | 辞書形/基本形 | `"食べる"` |
| `reading` | `string` | カタカナ読み | `"タベ"` |
| `posJa` | `string` | 品詞（日本語） | `"動詞"` |
| `conjType` | `string \| null` | 活用型（動詞/形容詞） | `"一段"` |
| `conjForm` | `string \| null` | 活用形 | `"連用形"` |

### 品詞一覧

| `pos` | `posJa` | 説明 |
|-------|---------|-------------|
| `NOUN` | 名詞 | 名詞 |
| `VERB` | 動詞 | 動詞 |
| `ADJ` | 形容詞 | 形容詞 |
| `ADV` | 副詞 | 副詞 |
| `PARTICLE` | 助詞 | 助詞 |
| `AUX` | 助動詞 | 助動詞 |
| `PRON` | 代名詞 | 代名詞 |
| `DET` | 連体詞 | 連体詞 |
| `CONJ` | 接続詞 | 接続詞 |
| `INTJ` | 感動詞 | 感動詞 |
| `PREFIX` | 接頭辞 | 接頭辞 |
| `SUFFIX` | 接尾辞 | 接尾辞 |
| `SYMBOL` | 記号 | 記号 |
| `OTHER` | その他 | その他/不明 |

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
