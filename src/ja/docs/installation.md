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

- **Node.js**: 18.0以上
- **ブラウザ**: WASM対応のモダンブラウザ（Chrome、Firefox、Safari、Edge）
- **Deno**: 1.0以上
- **Bun**: 1.0以上

## Python

Python アプリケーションやデータ処理では、PyPI からホイールをインストールします：

::: code-group

```bash [pip]
pip install suzume
```

```bash [poetry]
poetry add suzume
```

```bash [uv]
uv add suzume
```

:::

Python 3.10 以上が必要です。ネイティブライブラリと辞書はホイールに同梱されているため、ほかにインストールするものはありません。

使い方は [Python バインディング](/ja/docs/python) を参照してください。

## CLI

`suzume-cli` は、シェルからテキストをトークン化するネイティブのコマンドラインツールです。

ビルド方法は [ネイティブビルドと CLI](/ja/docs/native-build)、使い方は [CLI リファレンス](/ja/docs/cli) を参照してください。

## Go

Go 製のサーバー、CLI、バッチ処理では CGO バインディングを使えます：

```bash
go get github.com/libraz/go-suzume
cd "$(go list -m -f '{{.Dir}}' github.com/libraz/go-suzume)"
make lib
```

必要環境、使用例、API の概要は [Go バインディング](/ja/docs/go) を参照してください。
