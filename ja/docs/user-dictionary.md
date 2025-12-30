# ユーザー辞書

ドメイン固有の単語を追加して解析精度を向上させます。

## 実行時の読み込み

`loadUserDictionary()` を使用して実行時に辞書エントリを読み込みます：

```typescript
const suzume = await Suzume.create()

// 単語を1つ追加
suzume.loadUserDictionary('ChatGPT,noun')

// 複数の単語を追加
suzume.loadUserDictionary(`
スカイツリー,noun
ポケモン,noun
DeepL,noun
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

| 値 | 説明 | 日本語 |
|-------|-------------|----------|
| `noun` | 名詞、固有名詞 | 名詞 |
| `verb` | 動詞 | 動詞 |
| `adj` | 形容詞 | 形容詞 |
| `adverb` | 副詞 | 副詞 |
| `prefix` | 接頭辞 | 接頭辞 |
| `suffix` | 接尾辞 | 接尾辞 |

## 例

### IT用語

```csv
ChatGPT,noun
GitHub,noun
TypeScript,noun
WebAssembly,noun
Kubernetes,noun
```

### ブランド名

```csv
スカイツリー,noun
ポケモン,noun
任天堂,noun
ソニー,noun
```

### 複合語

```csv
形態素解析,noun
機械学習,noun
自然言語処理,noun
```

### 活用のある動詞

```csv
ググる,verb,5000,ググる
バズる,verb,5000,バズる
```

## コストの調整

`コスト` パラメータは単語選択の優先度を制御します：

- **低いコスト** = 選択されやすい
- **デフォルトコスト** = 約8000
- **一般的な単語** = 5000-7000
- **まれな単語** = 9000+

```csv
# "東京" + "都" より "東京都" を優先
東京都,noun,5000

# あまり一般的でない複合語
超電磁砲,noun,9000
```

## ユースケース

### 検索インデックス

```typescript
// ドメイン固有の用語を追加してトークン化を改善
suzume.loadUserDictionary(`
React,noun
Next.js,noun
Tailwind,noun
`)

const tags = suzume.generateTags('Next.jsでReactアプリを作成')
// ['Next.js', 'React', 'アプリ', '作成']
```

### チャットアプリケーション

```typescript
// スラングや新語を追加
suzume.loadUserDictionary(`
草,interjection
ワロタ,interjection
エモい,adj
`)
```

### EC サイト

```typescript
// 製品名やブランドを追加
suzume.loadUserDictionary(`
iPhone,noun
MacBook,noun
AirPods,noun
`)
```

## ベストプラクティス

1. **エントリは最小限に** - 誤ってトークン化される単語のみ追加
2. **小文字の品詞を使用** - `NOUN` ではなく `noun`
3. **段階的にテスト** - 数語追加して結果を確認
4. **複合語を考慮** - 1トークンにしたい場合は `東京都` を追加

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
