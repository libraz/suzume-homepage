# インストール

## パッケージマネージャー

JavaScript、TypeScript、ブラウザで使う場合は WASM パッケージをインストールします：

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

## CDN

ビルドステップなしでブラウザで使用する場合：

```html
<script type="module">
  import { Suzume } from 'https://esm.sh/@libraz/suzume'

  const suzume = await Suzume.create()
  // ...
</script>
```

## 動作要件

- **Node.js**: 16.0以上
- **ブラウザ**: WASM対応のモダンブラウザ（Chrome、Firefox、Safari、Edge）
- **Deno**: 1.0以上
- **Bun**: 1.0以上

## Go

Go 製のサーバー、CLI、バッチ処理では CGO バインディングを使えます：

```bash
go get github.com/libraz/go-suzume
cd "$(go list -m -f '{{.Dir}}' github.com/libraz/go-suzume)"
make lib
```

必要環境、使用例、API の概要は [Go バインディング](/ja/docs/go) を参照してください。
