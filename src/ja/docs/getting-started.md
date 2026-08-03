# はじめに

Suzume は、JavaScript/WASM、Python、Go、ネイティブ C/C++、コマンドラインから使える軽量な日本語トークナイザーです。アプリケーションに合う実行環境で、日本語の分割、原形復元、キーワード抽出を行えます。

<TokenizerPlayground />

## バインディングを選ぶ

| 環境 | 入口 |
|------|------|
| ブラウザ、Node.js、Deno、Bun | 下の JavaScript/WASM チュートリアル |
| Python アプリケーションまたは `suzume` コマンド | [Python ガイド](/ja/docs/python)と[Python CLI](/ja/docs/python-cli) |
| Go サービスまたはコマンド | [Go バインディング](/ja/docs/go) |
| ネイティブ C / C++ アプリケーション | [C / C++ ライブラリ](/ja/docs/cpp) |
| 辞書開発とネイティブ診断 | [ネイティブ CLI](/ja/docs/cli) |

## JavaScript/WASM チュートリアル

## インストール

```bash
npm install @libraz/suzume
```

各パッケージマネージャー・CDN・他のバインディングは [インストール](/ja/docs/installation) を参照してください。

## 基本的な使い方

```typescript
import { Suzume } from '@libraz/suzume'

// インスタンスを作成
const suzume = await Suzume.create()

// テキストを解析
const morphemes = suzume.analyze('今日は良い天気ですね')

for (const m of morphemes) {
  console.log(`${m.surface} [${m.posJa}] - ${m.baseForm}`)
}

// 使い終わったらリソースを解放
suzume.destroy()
```

`Suzume.create()` はトークン化の挙動を調整するオプションも受け取れます。

```typescript
const suzume = await Suzume.create({ mode: 'search', mergeCompounds: true })
```

そのほか、同梱辞書の読み込み、スコアラー設定、独立した WASM ランタイムも指定できます。既定値と使い分けは [API リファレンス](/ja/docs/api) を参照してください。

作成後に `mode` プロパティを変更しても辞書は再読み込みされません。既定ではインスタンス間で WASM ランタイムを共有します。線形メモリも分離する必要がある場合だけ `freshWasmModule: true` を指定してください。

`destroy()` のほか、テキスト・バイナリ辞書の読み込み、展開後エントリ数、呼び出し側辞書の消去、辞書状態、安定したエラーコード、警告を取得できます。詳細は [API リファレンス](/ja/docs/api) を参照してください。

## よく使う実例

### 検索キーワードを抽出する

```typescript
const tags = suzume.generateTags('東京スカイツリーで夜景を撮影しました', {
  excludeBasic: true,
  maxTags: 5,
})

console.log(tags)
// [
//   { tag: '東京', pos: 'NOUN' },
//   { tag: 'スカイツリー', pos: 'NOUN' },
//   { tag: '夜景', pos: 'NOUN' },
//   { tag: '撮影', pos: 'NOUN' }
// ]
```

### 活用形を原形に戻す

```typescript
const morphemes = suzume.analyze('食べさせられなかった')

for (const m of morphemes) {
  if (m.surface !== m.baseForm) {
    console.log(`${m.surface} -> ${m.baseForm}`)
  }
}
```

## 出力形式

`analyze()` は `Morpheme` オブジェクトの配列を返します：

```typescript
interface Morpheme {
  surface: string      // 表層形
  pos: string          // 品詞（英語）
  baseForm: string     // 基本形
  posJa: string        // 品詞（日本語）
  conjType: string | null  // 活用型
  conjForm: string | null  // 活用形
  extendedPos: string  // 拡張品詞サブカテゴリ（例: "VERB_連用"）
  start: number        // 正規化後テキスト上の Unicode コードポイント開始位置
  end: number          // 正規化後テキスト上の Unicode コードポイント終了位置
  startUtf16: number   // JavaScript の String.slice() 用開始位置
  endUtf16: number     // JavaScript の String.slice() 用終了位置
  isUserDict: boolean       // 読み込んだユーザー辞書に由来するか
  isFormalNoun: boolean     // 形式名詞か（例: こと、もの）
  isLowInfo: boolean        // 情報量の低い語か（機能語的な語）
  isUnknown: boolean        // 未知語候補として生成されたか
  isFromDictionary: boolean // コア辞書またはユーザー辞書から一致したか
  score: number             // 解析器が使う候補スコア・コスト
}
```

`start` と `end` は正規化後テキスト上の Unicode コードポイント位置です。参照先の文字列も必要なら `analyzeWithNormalizedText()` を使い、JavaScript で切り出すときは `startUtf16` と `endUtf16` を使います。

```typescript
const { normalizedText, morphemes } =
  suzume.analyzeWithNormalizedText('ＡＢＣを検索')

for (const m of morphemes) {
  console.log(normalizedText.slice(m.startUtf16, m.endUtf16))
}
```

## ブラウザでの使用

CDNから直接読み込むこともできます：

```html
<script type="module">
  import { Suzume } from 'https://cdn.jsdelivr.net/npm/@libraz/suzume/dist/index.js'

  const suzume = await Suzume.create()
  const result = suzume.analyze('こんにちは')
  console.log(result)
  suzume.destroy()
</script>
```

## 次のステップ

- [インストール](/ja/docs/installation) - 詳細なセットアップ手順
- [ユーザー辞書](/ja/docs/user-dictionary) - カスタム単語の追加
- [API リファレンス](/ja/docs/api) - 完全な API ドキュメント
- [Python ガイド](/ja/docs/python) - Python から Suzume を使う
- [Python CLI](/ja/docs/python-cli) - Python ホイールから解析
- [Go バインディング](/ja/docs/go) - Go から Suzume を使う
- [C / C++ ライブラリ](/ja/docs/cpp) - ネイティブ C++ ラッパーと C ABI
- [ネイティブ開発 CLI](/ja/docs/cli) - 辞書・テスト用コマンド
- [仕組み](/ja/docs/how-it-works) - 技術的な詳細
