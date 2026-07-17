# ユーザー辞書

ドメイン固有の単語を追加して解析精度を向上させます。

## 実行時の読み込み

実行時に辞書エントリを 1 回の呼び出しで読み込みます。

::: code-group

```typescript [node]
import { Suzume } from '@libraz/suzume'

const suzume = await Suzume.create()

// 単語を1つ追加
suzume.loadUserDictionary('ChatGPT,NOUN')

// 複数の単語を追加
suzume.loadUserDictionary(`
スカイツリー,NOUN
ポケモン,NOUN
DeepL,NOUN
`)
```

```python [python]
from suzume import Suzume

sz = Suzume()

# 単語を1つ追加
sz.load_user_dict("ChatGPT,NOUN")

# 複数の単語を追加
sz.load_user_dict(
    "スカイツリー,NOUN\n"
    "ポケモン,NOUN\n"
    "DeepL,NOUN\n"
)
```

```bash [cli]
# -d / --dict で 1 つ以上の辞書を渡す（繰り返し指定可能）
suzume-cli analyze -d user.csv "スカイツリーとポケモン"
```

:::

### 結果の確認

`loadUserDictionary()` は `boolean` を返します。渡した辞書データを解析・読み込みできなかった場合は `false` になります。読み込み失敗を扱いたいときはこの値を確認してください。

```typescript
if (!suzume.loadUserDictionary(data)) {
  // 辞書を読み込めなかった — フォールバックするかエラーを通知する
}
```

読み込み失敗で処理を中断したい場合は、fail-fast の派生メソッドを使います。こちらは `false` を返す代わりに、内部の C API の詳細を含むエラーを投げます。

```typescript
suzume.loadUserDictionaryOrThrow(data)
```

バイナリ辞書向けのメソッド（`loadBinaryDictionary()` / `loadBinaryDictionaryOrThrow()`）も同じパターンに従います。Python では `load_user_dict()` と `load_binary_dict()` が失敗時に `SuzumeError` を送出します。

::: tip パース動作と起動時の警告
フィールドが 2 個未満の行は警告なしでスキップされます。一方、未知の品詞や不正な CSV クォートなどは読み込み失敗になります。実行時の失敗は戻り値（または `loadUserDictionaryOrThrow()`）と `lastError` で確認してください。`dictionaryWarnings` は `Suzume.create()` が辞書を自動読み込みした際の警告であり、実行時にスキップした行の一覧ではありません（Python では `dictionary_warnings`）。

```typescript
const loaded = suzume.loadUserDictionary('ChatGPT,NOUN\nbroken-line')
console.log(loaded) // true: "broken-line" は警告なしで無視される
```
:::

## フォーマット

### 基本形式

```
表層形,品詞
```

| フィールド | 必須 | 説明 |
|-------|----------|-------------|
| `表層形` | はい | テキスト中に現れる単語 |
| `品詞` | はい | 品詞 |

### 完全形式

```
表層形,品詞,コスト,基本形
```

| フィールド | 必須 | 説明 |
|-------|----------|-------------|
| `表層形` | はい | テキスト中に現れる単語 |
| `品詞` | はい | 品詞 |
| `コスト` | いいえ | 現在パーサーでは無視されます（後述） |
| `基本形` | いいえ | 辞書形/基本形 |

## 品詞の値

| 値 | 説明 | 日本語名 |
|-------|-------------|----------|
| `NOUN` | 名詞、固有名詞 | 名詞 |
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
| `OTHER` | 未分類 | その他 |

::: tip 日本語の品詞名
英語の値の代わりに日本語の品詞名（例：`名詞`、`動詞`、`形容詞`）も使用できます。
:::

## 例

### IT用語

```csv
ChatGPT,NOUN
GitHub,NOUN
TypeScript,NOUN
WebAssembly,NOUN
Kubernetes,NOUN
```

### ブランド名

```csv
スカイツリー,NOUN
ポケモン,NOUN
任天堂,NOUN
ソニー,NOUN
```

### 複合語

```csv
形態素解析,NOUN
機械学習,NOUN
自然言語処理,NOUN
```

### 活用のある動詞

```csv
ググる,VERB,5000,ググる
バズる,VERB,5000,バズる
```

## エントリが反映されたか確認する

各形態素は `isUserDict` を持ち、読み込んだユーザー辞書から一致したトークンの場合に `true` になります。カスタム単語が実際に適用されているかを確認するのに使えます。

```typescript
suzume.loadUserDictionary('スカイツリー,NOUN')

const result = suzume.analyze('スカイツリーへ行く')
const skytree = result.find((m) => m.surface === 'スカイツリー')

console.log(skytree?.isUserDict) // true — ユーザー辞書から一致
```

## コスト列について

`コスト` 列は現在パーサーで**使用されていません**。値が読み取られることはなく、そこに何を書いてもエントリは同じように一致します。可読性のために列を残しても構いませんが、単語選択を制御する目的で値を調整することは当てにしないでください。現状では `5000` と `9000` はまったく同じ挙動になります。

```csv
# 末尾のコスト値は受け付けられますが無視されます
東京都,NOUN,5000
超電磁砲,NOUN,9000

# 同じ意味 — コストを書かなくても同様に一致します
東京都,NOUN
超電磁砲,NOUN
```

## ユースケース

### 検索インデックス

```typescript
// ドメイン固有の用語を追加してトークン化を改善
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

### チャットアプリケーション

```typescript
// スラングや新語を追加
suzume.loadUserDictionary(`
草,INTJ
ワロタ,INTJ
エモい,ADJ
`)
```

### EC サイト

```typescript
// 製品名やブランドを追加
suzume.loadUserDictionary(`
iPhone,NOUN
MacBook,NOUN
AirPods,NOUN
`)
```

## ベストプラクティス

1. **エントリは最小限に** - 誤ってトークン化される単語のみ追加
2. **大文字の品詞を使用** - `noun` ではなく `NOUN`（日本語名の `名詞` も可）
3. **段階的にテスト** - 数語追加して結果を確認
4. **複合語を考慮** - 1トークンにしたい場合は `東京都` を追加

## バイナリ辞書

より高速な読み込みのため、辞書を `suzume-cli` ツールでバイナリ形式（.dic）にプリコンパイルできます：

```bash
# TSVをバイナリにコンパイル
suzume-cli dict compile user.tsv   # → user.dic
```

バイナリ辞書を実行時に読み込み：

```typescript
// Node.js
import { readFile } from 'fs/promises'
const dictData = new Uint8Array(await readFile('user.dic'))
suzume.loadBinaryDictionary(dictData)

// ブラウザ
const response = await fetch('/dictionaries/user.dic')
const browserDictData = new Uint8Array(await response.arrayBuffer())
suzume.loadBinaryDictionary(browserDictData)
```

::: tip パフォーマンス
バイナリ辞書はCSV形式よりも大幅に高速に読み込めます。大規模なカスタム語彙を使用する本番環境に最適です。
:::

### .dic フォーマット概要

バイナリ辞書は以下の構造を持つコンパクトな形式です：

```
[ヘッダー (16 bytes, マジック: "SZMD")]
[フロントコーディングされた表層形テーブル]
[可変サイズのエントリ配列 (各 1、2、または 3 bytes)]
[省略可能な原形プール (UTF-8)]
```

- **表層形テーブル** — ソート済み表層形の共通接頭辞を共有してコンパクトに格納
- **可変サイズのエントリ配列** — 辞書を表現できる最小のエントリ形式を使用
- **原形プール** — 表層形と異なる原形だけを格納

コンパイル時に動詞・形容詞は活用形に展開され、全エントリがソートされます。読み込み時に、コンパクトな表層形テーブルから実行時用のダブル配列トライを再構築します。

## 永続化

辞書エントリはメモリに保存され、インスタンスが破棄されると失われます。永続化するには：

```typescript
// 初期化時にストレージから読み込み
const savedDict = localStorage.getItem('myDictionary')
if (savedDict) {
  suzume.loadUserDictionary(savedDict)
}

// 新しい単語を追加時に保存
function addWord(word: string, pos: string) {
  const entry = `${word},${pos}`
  suzume.loadUserDictionary(entry)

  // ストレージに追記
  const current = localStorage.getItem('myDictionary') || ''
  localStorage.setItem('myDictionary', current + '\n' + entry)
}
```

## 関連情報

- [API リファレンス](/ja/docs/api) — 辞書読み込みメソッド（`loadUserDictionary` / `loadUserDictionaryOrThrow` / `loadBinaryDictionary` / `loadBinaryDictionaryOrThrow`、`dictionaryWarnings`）と Morpheme のフィールド（`isUserDict`、`isFromDictionary`）。
