# API リファレンス

このページは Suzume の JavaScript / WASM バインディングについて解説します。npm では [`@libraz/suzume`](/ja/docs/installation) として公開しています。Python、Go、C/C++、2 種類のコマンドラインインターフェースには別のガイドがあります。

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
| `freshWasmModule` | `boolean` | `false` | 共有キャッシュを使わず、独立した WASM ランタイムを作成 |
| `preserveVu` | `boolean` | `true` | ヴを保持（ビ等に正規化しない） |
| `preserveCase` | `boolean` | `true` | 大文字小文字を保持（ASCII を小文字化しない） |
| `preserveSymbols` | `boolean` | `false` | 句読点などの `SYMBOL` トークンを保持。絵文字や内容を持つ記号は、この設定にかかわらず `OTHER` として保持 |
| `mode` | `'normal' \| 'search' \| 'split'` | `'normal'` | 解析モード。検索向けの分割には `search` または `split` を使用 |
| `lemmatize` | `boolean` | `true` | 補正した辞書形を保持。品詞と活用情報はこの設定にかかわらず計算 |
| `mergeCompounds` | `boolean` | `false` | 連続する名詞複合を可能な範囲で結合 |
| `skipUserDictionary` | `boolean` | `false` | 同梱ユーザー辞書の自動読み込みを省略 |
| `skipCoreDictionary` | `boolean` | `false` | 同梱 L2 コア辞書の自動読み込みを省略 |
| `skipEnvConfig` | `boolean` | `false` | ネイティブのスコアラー設定用環境変数を無視 |
| `reportScorerConfig` | `boolean` | `false` | スコアラー設定の診断情報を `dictionaryWarnings` に追加 |
| `scorerOptions` | `string \| Record<string, unknown>` | `undefined` | 最優先で適用するスコアラー設定。JSON 文字列または JSON 化されるオブジェクト |

通貨・単位記号、矢印、数学・技術記号、絵文字はテキストの内容を持つため、既定の解析でも `OTHER` として残ります。`preserveSymbols: true` は、`。` などの句読点もトークンとして必要な場合に指定します。

**戻り値:** `Promise<Suzume>`

**例:**
```typescript
// 通常の使用
const defaultSuzume = await Suzume.create()
defaultSuzume.destroy()

// カスタム WASM パス
const customWasmSuzume = await Suzume.create({ wasmPath: '/path/to/suzume.wasm' })
customWasmSuzume.destroy()

// オプション指定
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

**解析モード:**

`mode` オプションはテキストの分割方法を制御します。

- **`normal`** — 汎用向けのバランスの取れた分割（デフォルト）。
- **`search`** — 連続する名詞複合語を大きな検索単位として結合する、検索向けの出力。
- **`split`** — 最も細かい分割。複合語を意味を持つ最小単位まで分解します。

`normal` モードでは `mergeCompounds` が名詞複合語の結合を制御します。`search` は結合を有効にし、`split` は無効にします。

`scorerOptions` は作成時に検証されます。不正な JSON を渡すと `Suzume.create()` が失敗します。`reportScorerConfig: true` を指定すると、有効な設定が `dictionaryWarnings` に記録されます。WASM ビルドはネイティブのスコアラー環境変数を読み込まないため、このバインディングでは `skipEnvConfig` を指定しても動作は変わりません。

#### 共有 WASM ランタイム

デフォルトでは、同じ `wasmPath` を使う呼び出しが 1 つの WASM ランタイムを共有します。各 `Suzume` オブジェクトは個別の解析ハンドルと設定を持ちますが、WebAssembly の線形メモリは共有です。`destroy()` が解放するのは 1 つのハンドルだけです。キャッシュ済みランタイムは残り、ほかのハンドルにも影響しません。

ランタイムごと分離する必要がある場合は `freshWasmModule: true` を指定します。単独の `version()` 関数も、`freshWasmModule: true` を指定しない限り同じキャッシュを使います。

---

### `mode`

辞書を読み直さずに解析モードを取得・変更します。

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

### `analyzeWithNormalizedText(text)`

形態素と、そのオフセットが参照する正規化後の文字列を返します。

```typescript
interface AnalysisResult {
  normalizedText: string
  morphemes: Morpheme[]
}

analyzeWithNormalizedText(text: string): AnalysisResult
```

JavaScript の文字列を切り出す場合は UTF-16 オフセットを使います。

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

`start` と `end` は `normalizedText` 内の Unicode コードポイント単位の位置です。`startUtf16` と `endUtf16` は JavaScript の UTF-16 コードユニット単位で、そのまま `String.prototype.slice()` に渡せます。絵文字や一部の漢字など、基本多言語面の外にある文字より後ろ、またはその文字をまたぐ範囲では両者の値が異なります。オフセットは入力ではなく正規化後の文字列を参照します。内容を持つ記号と絵文字は、`preserveSymbols` が `false` でも `OTHER` として既定の出力に残るため、その範囲も欠けません。

---

### `generateTags(text, options?)`

検索インデックス、分類、コンテンツ分析用のタグを生成します。デフォルトでは内容語（名詞、動詞、形容詞、副詞）を返し、助詞、助動詞、形式名詞、低情報語を除外します。

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
| `posFilter` | `readonly TagPosFilterName[]` | `undefined`（全て） | 抽出する品詞カテゴリ。空配列もフィルタ可能な全カテゴリを含む |
| `pos` | `readonly TagPosFilterName[]` | `undefined` | `posFilter` の非推奨エイリアス。両方を指定した場合は `posFilter` を優先 |
| `excludeBasic` | `boolean` | `false` | ひらがなのみの原形を持つ基本動詞等を除外 |
| `useLemma` | `boolean` | `true` | 表層形の代わりに原形（辞書形）を使用 |
| `minLength` | `number` | `2` | タグの最小文字数 |
| `maxTags` | `number` | `0` | タグの最大数（0 = 無制限） |
| `excludeParticles` | `boolean` | `true` | 助詞を除外 |
| `excludeAuxiliaries` | `boolean` | `true` | 助動詞を除外 |
| `excludeFormalNouns` | `boolean` | `true` | こと、もの等の形式名詞を除外 |
| `excludeLowInfo` | `boolean` | `true` | 低情報語を除外 |
| `removeDuplicates` | `boolean` | `true` | 重複タグを削除 |

`TagPosFilterName` は `'noun' | 'verb' | 'adjective' | 'adverb' | 'particle' | 'auxiliary'` です。未知の名前を渡すと `Error` が発生します。助詞または助動詞を含めるには、対応する除外オプションも無効にします。

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
  posFilter: ['noun'],
  minLength: 1,
})
// [{ tag: '花', pos: 'NOUN' }]

// 助詞と助動詞
const functionWords = suzume.generateTags('花が咲きます', {
  posFilter: ['particle', 'auxiliary'],
  excludeParticles: false,
  excludeAuxiliaries: false,
  minLength: 1,
})
// [{ tag: 'が', pos: 'PARTICLE' },
//  { tag: 'ます', pos: 'AUX' }]

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
`excludeBasic: true` は原形（辞書形）がすべてひらがなで書かれた語を除外します。する、いる、ある、なる、いく、くるなどを除外し、開始、管理、確認など漢字を含む語は残します。
:::

<details>
<summary>フィルタパイプライン</summary>

タグジェネレーターは以下の順序でフィルタを適用します：

1. **助詞** — `excludeParticles` が `true` の場合に除外（デフォルト）
2. **助動詞** — `excludeAuxiliaries` が `true` の場合に除外（デフォルト）
3. **形式名詞** — `excludeFormalNouns` が `true` の場合に除外（デフォルト）
4. **低情報語** — `excludeLowInfo` が `true` の場合に除外（デフォルト）
5. **接続詞** — 常に除外
6. **記号** — 常に除外
7. **品詞フィルタ** — `posFilter` が空でない場合、一致するカテゴリのみ通過
8. **基本語** — `excludeBasic: true` の場合、ひらがなのみの原形を持つ語を除外
9. **タグ文字列** — `useLemma` に従って原形または表層形を選択
10. **最小文字数** — Unicode 文字数が `minLength` 未満のタグを除外
11. **重複排除** — `removeDuplicates` が `true` の場合に重複タグを削除
12. **結果数** — `maxTags` 件で生成を終了。`0` は無制限

</details>

---

### `loadUserDictionary(data)`

解析器にソース辞書のエントリを追加します。`clearUserDictionaries()` を呼ぶまで、読み込み内容は累積します。

```typescript
loadUserDictionary(data: string): boolean
```

| パラメータ | 型 | 説明 |
|-----------|------|-------------|
| `data` | `string` | 現行 TSV 形式の辞書エントリ。従来の CSV も読み込み可能 |

**戻り値:** `boolean` — 展開後のエントリを 1 件以上登録できた場合は `true`。

**現行形式:** `表層形<TAB>品詞[<TAB>活用型][<TAB>原形]`。活用型は省略可能で、活用形を展開させる場合に指定します。第3列が既知の活用型でなければ原形として扱われます。完全な形式は[ユーザー辞書](/ja/docs/user-dictionary)を参照してください。

**例:**
```typescript
// 単一エントリ
suzume.loadUserDictionary('ChatGPT\tNOUN\n')

// 複数エントリ
suzume.loadUserDictionary(`
ChatGPT	NOUN
スカイツリー	NOUN
DeepL	NOUN
`)

// 活用するエントリ
suzume.loadUserDictionary('検査する\tVERB\tSURU\n')
```

---

### `loadUserDictionaryCount(data)`

ソース辞書を読み込み、登録した展開後エントリの件数を返します。

```typescript
loadUserDictionaryCount(data: string): number
```

活用形を展開するため、1 行から複数のエントリが登録されることがあります。`0` は読み込み失敗です。`lastError` と `lastErrorCode` を確認するか、`loadUserDictionaryOrThrow()` を使ってください。読み飛ばした行や展開処理の致命的でない診断は `dictionaryWarnings` に追加されます。

---

### `loadUserDictionaryOrThrow(data)`

ソース形式のユーザー辞書を読み込み、エントリを 1 件も登録できなければ C API の詳細を持つ `SuzumeError` を投げます。

```typescript
loadUserDictionaryOrThrow(data: string): void
```

セットアップ処理やテストで、不正な辞書を即座に失敗させたい場合に使います。

---

### `loadBinaryDictionary(data)`

コンパイル済みバイナリ辞書（`.dic`）を実行時に追加します。バイナリ辞書とソース辞書の読み込み内容は累積します。

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

::: tip バイナリ辞書とソース辞書
バイナリ辞書（`.dic`）はソース TSV よりも高速に読み込めます。`suzume-cli dict compile` で TSV 辞書をコンパイルできます。
:::

---

### `loadBinaryDictionaryOrThrow(data)`

コンパイル済みバイナリ辞書を読み込み、失敗時に C API 由来の詳細を含むエラーを投げます。

```typescript
loadBinaryDictionaryOrThrow(data: Uint8Array): void
```

---

### `clearUserDictionaries()`

呼び出し元が読み込んだ辞書と、その読み込み時に記録された警告を削除します。自動読み込みされた同梱ユーザー辞書があれば、その辞書は残ります。

```typescript
clearUserDictionaries(): void
```

---

### `hasCoreDictionary`

同梱 L2 コア辞書が読み込まれているかを返します。

```typescript
get hasCoreDictionary(): boolean
```

`skipCoreDictionary: true` で作成した場合や、コア辞書の自動読み込みに失敗した場合は `false` です。

---

### `version`

Suzume のバージョン文字列を取得します。

```typescript
get version(): string
```

**例:**
```typescript
console.log(suzume.version) // "0.9.9"
```

このゲッターは解析ハンドルを必要とせず、`destroy()` 後も利用できます。

---

### `version(options?)`

解析ハンドルを作成せずにバージョンを返します。

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

WASM ランタイムを作成または取得するため、この関数は非同期です。

---

### `lastError`

現在のスレッドにおける最後のC APIエラーを返します。直前のC API呼び出しが成功していれば空文字列です。

```typescript
get lastError(): string
```

`false` または `0` を返したメソッドの直後に読み取ってください。後続の C API 呼び出しで内容が置き換わる場合があります。

---

### `lastErrorCode`

最後に失敗した C ABI 呼び出しの安定したエラーカテゴリを返します。

```typescript
get lastErrorCode(): ErrorCode
```

---

### `dictionaryWarnings`

この解析器に記録された、処理を中断しない診断情報を返します。

```typescript
get dictionaryWarnings(): string[]
```

配列には、作成時の辞書読み込み診断、任意のスコアラー設定診断、読み飛ばした行や展開後の重複など、読み込みに成功したソース辞書の警告が入ります。`clearUserDictionaries()` は呼び出し元が読み込んだソース辞書の警告を削除しますが、作成時の診断は残します。致命的な読み込み失敗は、メソッドの戻り値または例外と、`lastError` / `lastErrorCode` で確認します。

---

### `wasmMemoryBytes()`

このランタイムが現在確保している WebAssembly 線形メモリのサイズをバイト単位で返します。

```typescript
wasmMemoryBytes(): number
```

共有ランタイム上のインスタンスは、同じ線形メモリのサイズを返します。

---

### `destroy()`

この解析ハンドルと関連するメモリを解放します。共有 WASM ランタイムは、ほかのインスタンスや今後作成するインスタンスのためにキャッシュへ残ります。

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
  start: number        // 正規化後テキスト内の開始位置（Unicode コードポイント単位）
  end: number          // 正規化後テキスト内の終了位置（Unicode コードポイント単位）
  startUtf16: number   // JavaScript UTF-16 単位の開始位置
  endUtf16: number     // JavaScript UTF-16 単位の終了位置
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
| `start` | `number` | 正規化後テキスト内の開始位置（Unicode コードポイント単位） | `0` |
| `end` | `number` | 正規化後テキスト内の終了位置（Unicode コードポイント単位） | `2` |
| `startUtf16` | `number` | 正規化後テキスト内の開始位置（JavaScript UTF-16 単位） | `0` |
| `endUtf16` | `number` | 正規化後テキスト内の終了位置（JavaScript UTF-16 単位） | `2` |
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
| `VERB_仮定縮約` | ばが融合した口語の仮定形縮約 | 行きゃ, 食べりゃ, すりゃ |
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
| `AUX_文語過去キ` | 文語の過去「き」とその活用形 | き, し, しか |
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

ネイティブ側の失敗は `Error` を継承した `SuzumeError` で表され、安定した `ErrorCode` を持ちます。

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
  suzume.analyze('\uD800') // 対になっていない UTF-16 サロゲート
} catch (error) {
  if (error instanceof SuzumeError) {
    console.error(ErrorCode[error.code], error.message)
  }
} finally {
  suzume?.destroy()
}
```

`Suzume.create()`、`analyze()`、`analyzeWithNormalizedText()`、`generateTags()`、辞書読み込みの `OrThrow` メソッド、モード変更、`clearUserDictionaries()` は、ネイティブ側で失敗すると例外を投げます。例外を投げない辞書メソッドは `false` または `0` を返します。詳細は `lastError` と `lastErrorCode` で確認できます。

::: danger WebAssembly のメモリ不足
メモリ確保に失敗すると、通常の `OutOfMemory` を返さず WASM ランタイムが停止します。回復可能な `SuzumeError` の経路には入らず、停止したランタイムは再利用できません。デフォルトでは複数のインスタンスがランタイムを共有するため、同じランタイム上のほかのハンドルも使えなくなります。長い文書は分割して処理してください。障害をランタイム単位で分離する必要がある場合は `freshWasmModule: true` を使います。
:::

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
Node.js では WASM メモリは V8 のヒープサイズに追跡されません。`destroy()` を呼ばずに多くのハンドルを作成すると、GC からは圧力が見えず、メモリ使用量が増える場合があります。サーバーサイドコードでは `destroy()` を明示的に呼び出してください。
:::
