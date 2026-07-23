# API リファレンス

このページは Suzume の JavaScript / WASM バインディングについて解説します。npm では [`@libraz/suzume`](/ja/docs/installation) として公開しています。Python、C/C++、CLI にはそれぞれ専用のリファレンスがあります。

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
| `mode` | `'normal' \| 'search' \| 'split'` | `'normal'` | 解析モード。検索向けの分割には `search` または `split` を使用 |
| `lemmatize` | `boolean` | `true` | 可能な場合に辞書形へ正規化 |
| `mergeCompounds` | `boolean` | `false` | 連続する名詞複合を可能な範囲で結合 |

**戻り値:** `Promise<Suzume>`

**例:**
```typescript
// 通常の使用
const defaultSuzume = await Suzume.create()

// カスタム WASM パス
const customWasmSuzume = await Suzume.create({ wasmPath: '/path/to/suzume.wasm' })

// オプション指定
const searchSuzume = await Suzume.create({
  preserveSymbols: true,
  preserveVu: false,
  mode: 'search',
  mergeCompounds: true,
})
```

**解析モード:**

`mode` オプションはテキストの分割方法を制御します。

- **`normal`** — 汎用向けのバランスの取れた分割（デフォルト）。
- **`search`** — 連続する名詞複合語を大きな検索単位として結合する、検索向けの出力。
- **`split`** — 最も細かい分割。複合語を意味を持つ最小単位まで分解します。

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
| `pos` | `string` | 品詞（`NOUN`, `VERB`, `ADJ`, `ADV` 等） |

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
| `excludeParticles` | `boolean` | `true` | 助詞を除外 |
| `excludeAuxiliaries` | `boolean` | `true` | 助動詞を除外 |
| `excludeFormalNouns` | `boolean` | `true` | こと、もの等の形式名詞を除外 |
| `excludeLowInfo` | `boolean` | `true` | 低情報語を除外 |
| `removeDuplicates` | `boolean` | `true` | 重複タグを削除 |

**戻り値:** `Tag[]`

**例:**

```typescript
// 基本的な使い方
const tags = suzume.generateTags('東京スカイツリーに行きました')
// [{ tag: '東京', pos: 'NOUN' },
//  { tag: 'スカイツリー', pos: 'NOUN' },
//  { tag: '行く', pos: 'VERB' }]

// 名詞のみ
const nouns = suzume.generateTags('美しい花が静かに咲いている', {
  pos: ['noun'],
  minLength: 1,
})
// [{ tag: '花', pos: 'NOUN' }]

// 基本動詞の除外（する、いる、ある、なる等のひらがなのみの原形を持つ語）
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
// 'する' は除外される（原形がひらがなのみ）

// 結果数を制限
const top3 = suzume.generateTags('東京タワーと東京スカイツリーを見学しました', {
  maxTags: 3
})
// [{ tag: '東京', pos: 'NOUN' },
//  { tag: 'タワー', pos: 'NOUN' },
//  { tag: 'スカイツリー', pos: 'NOUN' }]
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

// オプションフィールド付き
suzume.loadUserDictionary('走る,VERB,5000,走る')
```

---

### `loadUserDictionaryOrThrow(data)`

CSVユーザー辞書を読み込み、失敗時にC API由来の詳細を含むエラーを投げます。

```typescript
loadUserDictionaryOrThrow(data: string): void
```

セットアップ処理やテストで、不正な辞書を即座に失敗させたい場合に使います。

---

### `loadBinaryDictionary(data)`

コンパイル済みバイナリ辞書（.dic形式）を実行時に読み込みます。

```typescript
loadBinaryDictionary(data: Uint8Array): boolean
```

| パラメータ | 型 | 説明 |
|-----------|------|-------------|
| `data` | `Uint8Array` | バイナリ辞書データ（.dic形式） |

**戻り値:** `boolean` - 成功時 `true`

**例:**
```typescript
// ファイルから読み込み（Node.js）
import { readFile } from 'fs/promises'
const dictData = new Uint8Array(await readFile('custom.dic'))
suzume.loadBinaryDictionary(dictData)

// URLから読み込み（ブラウザ）
const response = await fetch('/dictionaries/custom.dic')
const browserDictData = new Uint8Array(await response.arrayBuffer())
suzume.loadBinaryDictionary(browserDictData)
```

::: tip バイナリ辞書 vs CSV辞書
バイナリ辞書（.dic）はCSV形式よりも高速に読み込めます。`suzume-cli dict compile` コマンドでTSV辞書をバイナリ形式にコンパイルできます。
:::

---

### `loadBinaryDictionaryOrThrow(data)`

コンパイル済みバイナリ辞書を読み込み、失敗時にC API由来の詳細を含むエラーを投げます。

```typescript
loadBinaryDictionaryOrThrow(data: Uint8Array): void
```

---

### `version`

Suzume のバージョン文字列を取得します。

```typescript
get version(): string
```

**例:**
```typescript
console.log(suzume.version) // 現在のパッケージバージョン、例: "0.9.x"
```

---

### `lastError`

現在のスレッドにおける最後のC APIエラーを返します。直前のC API呼び出しが成功していれば空文字列です。

```typescript
get lastError(): string
```

---

### `dictionaryWarnings`

インスタンス作成時の辞書読み込みで発生した警告を返します。

```typescript
get dictionaryWarnings(): string[]
```

---

### `destroy()`

WASM メモリとリソースを解放します。インスタンスの使用が終わったら呼び出してください。

```typescript
destroy(): void
```

::: info FinalizationRegistry による自動クリーンアップ
Suzume は `FinalizationRegistry` コールバックを登録しているため、インスタンスがガベージコレクションされるとリソースは自動的に解放されます。ただし、`destroy()` を明示的に呼び出して即座にクリーンアップすることを推奨します。特に Node.js では GC のタイミングが不定で、WASM メモリは GC のヒープ使用量に反映されず、メモリ逼迫と判断されにくいためです。
:::

**例:**
```typescript
const suzume = await Suzume.create()
// ... suzume を使用 ...
suzume.destroy() // 即座にリソースを解放
```

---

## Morpheme インターフェース

単一のトークン（言語単位）を表します。

```typescript
interface Morpheme {
  surface: string      // 表層形（テキスト中の表記）
  pos: string          // 品詞（英語）
  baseForm: string     // 基本形/辞書形
  posJa: string        // 品詞（日本語）
  conjType: string | null  // 活用型
  conjForm: string | null  // 活用形
  extendedPos: string  // 安定した拡張品詞コード（例: "VERB_連用"）
  start: number        // 正規化後テキスト内の開始文字位置
  end: number          // 正規化後テキスト内の終了文字位置
  isUserDict: boolean
  isFormalNoun: boolean
  isLowInfo: boolean
  isUnknown: boolean
  isFromDictionary: boolean
  score: number
}
```

### プロパティ

| プロパティ | 型 | 説明 | 例 |
|----------|------|-------------|---------|
| `surface` | `string` | テキスト中の表層形 | `"食べ"` |
| `pos` | `string` | 品詞（英語） | `"VERB"` |
| `baseForm` | `string` | 辞書形/基本形 | `"食べる"` |
| `posJa` | `string` | 品詞（日本語） | `"動詞"` |
| `conjType` | `string \| null` | 活用型（動詞/形容詞） | `"一段"` |
| `conjForm` | `string \| null` | 活用形 | `"連用形"` |
| `extendedPos` | `string` | 安定した拡張品詞コード | `"VERB_連用"` |
| `start` | `number` | 正規化後テキスト内の開始文字位置 | `0` |
| `end` | `number` | 正規化後テキスト内の終了文字位置 | `2` |
| `isUserDict` | `boolean` | ユーザー辞書に一致した場合 `true` | `false` |
| `isFormalNoun` | `boolean` | こと、もの等の形式名詞なら `true` | `false` |
| `isLowInfo` | `boolean` | タグ生成で低情報語として扱われる場合 `true` | `false` |
| `isUnknown` | `boolean` | 未知語候補として生成された場合 `true` | `false` |
| `isFromDictionary` | `boolean` | いずれかの辞書に一致した場合 `true` | `true` |
| `score` | `number` | 解析器が使う候補スコア/コスト | `12.5` |

### 品詞一覧（pos）

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

### 拡張品詞一覧（extendedPos）

`extendedPos` プロパティは基本の `pos` タグを超えた詳細なサブカテゴリを提供します。活用形の区別、助詞の役割、助動詞の機能、名詞のサブタイプなどを識別する場合に有用です。

**動詞の活用形:**

| 値 | 説明 | 例 |
|----|------|-----|
| `VERB_終止` | 終止形 | 食べる, 書く |
| `VERB_連用` | 連用形 | 食べ, 書き |
| `VERB_未然` | 未然形 | 食べ-, 書か- |
| `VERB_音便` | 音便形 | 書い-, 泳い- |
| `VERB_て形` | て形 | 食べて, 書いて |
| `VERB_仮定` | 仮定形 | 食べれば, 書けば |
| `VERB_命令` | 命令形 | 食べろ, 書け |
| `VERB_連体` | 連体形 | （現代語では終止形と同形） |
| `VERB_た形` | た形 | 食べた, 書いた |
| `VERB_たら形` | たら形 | 食べたら, 書いたら |

**形容詞の活用形:**

| 値 | 説明 | 例 |
|----|------|-----|
| `ADJ_終止` | 終止形 | 美しい, 高い |
| `ADJ_連用` | 連用形（く） | 美しく, 高く |
| `ADJ_語幹` | 語幹（ガル接続） | 美し-, 高- |
| `ADJ_かっ` | かっ形 | 美しかっ-, 高かっ- |
| `ADJ_け形` | け形（仮定） | 美しけれ- |
| `ADJ_未然` | 未然形 | 美しくな- |
| `ADJ_NA` | ナ形容詞語幹 | 静か, 綺麗 |

**助動詞:**

| 値 | 説明 | 例 |
|----|------|-----|
| `AUX_過去` | 過去 | た, だ |
| `AUX_丁寧` | 丁寧 | ます, まし, ませ |
| `AUX_否定` | 否定 | ない, なかっ |
| `AUX_否定古` | 否定（古語） | ぬ, ん |
| `AUX_打消推量` | 打消推量 | まい |
| `AUX_文語断定` | 文語の断定 | なり |
| `AUX_文語過去` | 文語の過去 | けり |
| `AUX_文語断定連体` | 文語の断定・連体 | たる |
| `AUX_文語完了` | 文語の完了 | つ, ぬ |
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

**助詞:**

| 値 | 説明 | 例 |
|----|------|-----|
| `PART_格` | 格助詞 | が, を, に, で, へ, と, から, まで, より |
| `PART_係` | 係助詞 | は, も |
| `PART_終` | 終助詞 | ね, よ, わ, な, か |
| `PART_接続` | 接続助詞 | て, で, ば, ながら, たり, けど |
| `PART_引用` | 引用助詞 | と（引用） |
| `PART_副` | 副助詞 | ばかり, だけ, ほど, しか, など |
| `PART_準体` | 準体助詞 | の |
| `PART_係結` | 係結び | こそ, さえ, すら |

**名詞:**

| 値 | 説明 | 例 |
|----|------|-----|
| `NOUN` | 普通名詞 | 東京, 天気 |
| `NOUN_形式` | 形式名詞 | こと, もの, ところ, わけ |
| `NOUN_転成` | 連用形転成名詞 | 読み, 書き |
| `NOUN_固有` | 固有名詞 | — |
| `NOUN_姓` | 固有名詞（姓） | 田中, 鈴木 |
| `NOUN_名` | 固有名詞（名） | 太郎 |
| `NOUN_数` | 数詞 | 一, 100 |

**その他:**

| 値 | 説明 |
|----|------|
| `PRON` | 代名詞 |
| `PRON_疑問` | 疑問詞（何, 誰, どこ） |
| `ADV` | 副詞 |
| `ADV_引用` | 引用副詞（そう, こう） |
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

## エラーハンドリング

```typescript
try {
  const suzume = await Suzume.create()
  const result = suzume.analyze('テスト')
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error('WASM の初期化に失敗しました:', message)
}
```

`Suzume.create()` は WASM インスタンスの初期化に失敗すると例外を投げます。`analyze()` と `generateTags()` も、ネイティブ側の解析呼び出しが失敗した場合に `Error` を投げます（ネイティブのエラー内容は `lastError` から取得できます）。

---

## メモリ管理

Suzume は JavaScript ヒープ外にメモリを確保する WebAssembly を使用します。`FinalizationRegistry` により GC 時にクリーンアップされますが、明示的な `destroy()` を強く推奨します。特に Node.js では GC のタイミングが不定で、WASM メモリは GC のヒープ使用量に反映されず、メモリ逼迫と判断されにくいためです。

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

::: warning Node.js での注意
Node.js では WASM メモリは V8 のヒープサイズに追跡されません。`destroy()` を呼ばずに多くのインスタンスを作成すると、GC からは圧力が見えないためメモリ使用量が増加し続けます。サーバーサイドコードでは必ず明示的に `destroy()` を呼び出してください。
:::
