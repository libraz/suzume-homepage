# ユーザー辞書

ドメイン固有の単語を追加して解析精度を向上させます。

## 実行時の読み込み

`loadUserDictionary()` を使用して実行時に辞書エントリを読み込みます：

```typescript
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
| `コスト` | いいえ | 単語コスト（低いほど選択されやすい） |
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

## コストの調整

`コスト` パラメータは単語選択の優先度を制御します：

- **低いコスト** = 選択されやすい
- **デフォルトコスト** = 約8000
- **一般的な単語** = 5000-7000
- **まれな単語** = 9000+

```csv
# "東京" + "都" より "東京都" を優先
東京都,NOUN,5000

# あまり一般的でない複合語
超電磁砲,NOUN,9000
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
// ['Next.js', 'React', 'アプリ', '作成']
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
const dictData = new Uint8Array(await response.arrayBuffer())
suzume.loadBinaryDictionary(dictData)
```

::: tip パフォーマンス
バイナリ辞書はCSV形式よりも大幅に高速に読み込めます。大規模なカスタム語彙を使用する本番環境に最適です。
:::

### .dic フォーマット概要

バイナリ辞書は以下の構造を持つコンパクトな形式です：

```
[ヘッダー (40 bytes, マジック: "SZMD")]
[ダブル配列トライ]
[エントリ配列 (各 12 bytes)]
[文字列プール (UTF-8)]
```

- **ダブル配列トライ** — 表層形の高速な共通接頭辞検索に使用（O(m) ルックアップ）
- **エントリ配列** — 各エントリに表層形・原形の文字列プールオフセット、品詞、フラグを格納
- **文字列プール** — 重複排除された UTF-8 文字列の連結

コンパイル時に動詞・形容詞は活用形に展開され、全エントリがソートされた上でトライに格納されます。

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
