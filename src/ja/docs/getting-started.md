# はじめに

Suzumeは軽量な日本語トークナイザーです。WASMで動作するため、ブラウザでもNode.jsでも使えます。

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
  console.log(`${m.surface} [${m.posJa}] - ${m.reading}`)
}

// 使い終わったらリソースを解放
suzume.destroy()
```

## 出力形式

`analyze()` は `Morpheme` オブジェクトの配列を返します：

```typescript
interface Morpheme {
  surface: string      // 表層形
  pos: string          // 品詞（英語）
  baseForm: string     // 基本形
  reading: string      // 読み（カタカナ）
  posJa: string        // 品詞（日本語）
  conjType: string | null  // 活用型
  conjForm: string | null  // 活用形
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
