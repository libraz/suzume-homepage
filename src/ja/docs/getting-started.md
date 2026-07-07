# はじめに

Suzumeは軽量な日本語トークナイザーです。WASMで動作するため、ブラウザでもNode.jsでも使えます。サーバーを立てずに、日本語の分割、原形復元、キーワード抽出をしたい場合に使えます。

<TokenizerPlayground />

## インストール

::: code-group

```bash [npm]
npm install @libraz/suzume
```

```bash [yarn]
yarn add @libraz/suzume
```

```bash [pnpm]
pnpm add @libraz/suzume
```

```bash [bun]
bun add @libraz/suzume
```

:::

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
  extendedPos: string  // 拡張品詞サブカテゴリ（例: "VerbRenyokei"）
  start: number        // 開始文字位置
  end: number          // 終了文字位置
  isUnknown: boolean   // 未知語候補として生成されたか
  isFromDictionary: boolean
}
```

## ブラウザでの使用

CDNから直接読み込むこともできます：

```html
<script type="module">
  import { Suzume } from 'https://esm.sh/@libraz/suzume'

  const suzume = await Suzume.create()
  const result = suzume.analyze('こんにちは')
  console.log(result)
</script>
```

## 次のステップ

- [インストール](/ja/docs/installation) - 詳細なセットアップ手順
- [ユーザー辞書](/ja/docs/user-dictionary) - カスタム単語の追加
- [API リファレンス](/ja/docs/api) - 完全な API ドキュメント
- [仕組み](/ja/docs/how-it-works) - 技術的な詳細
