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
  import { Suzume } from 'https://cdn.jsdelivr.net/npm/@libraz/suzume@0.9.8/dist/index.js'

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

Python 3.10 以上が必要です。PyPI では Linux x86_64（`manylinux2014` / `manylinux_2_17`）と、macOS 11 以降の macOS arm64 向けにバイナリホイールを公開しています。Windows とその他のアーキテクチャには対応していません。ソースディストリビューションも公開・サポートしていません。

ホイールにはネイティブライブラリと辞書が含まれ、`suzume` コマンドもインストールされます。API は [Python バインディング](/ja/docs/python)、コマンドは [Python CLI](/ja/docs/python-cli) を参照してください。

## Go

cgo バインディングを Go モジュールへ追加し、同梱される C++ コアを一度ビルドします：

```bash
go get github.com/libraz/go-suzume
cd $(go env GOPATH)/pkg/mod/github.com/libraz/go-suzume@latest
make lib
```

Go 1.26 以降、CGO、C++17 コンパイラ、CMake 3.15 以降が必要です。ビルドしたアプリケーションには辞書が埋め込まれるため、実行時に外部辞書ファイルは不要です。初期化、所有権、オプション、API の詳細は [Go バインディング](/ja/docs/go) を参照してください。

## コマンドラインツール

Python ホイールをインストールすると、解析とタグ抽出を行う `suzume` コマンドが使えるようになります。

```bash
suzume --format json "東京へ行く"
```

別配布のネイティブコマンド `suzume-cli` は、辞書のコンパイルや検証、テスト、ベンチマークも備えた開発者向けツールです。ビルド方法は [ネイティブビルドと CLI](/ja/docs/native-build)、使い方は [ネイティブ CLI リファレンス](/ja/docs/cli) を参照してください。

## C / C++

ネイティブの C / C++ プログラムに Suzume を直接リンクするには、ライブラリをソースからビルドしてインストールします：

```bash
git clone https://github.com/libraz/suzume.git
cd suzume
make install                 # /usr/local へ。PREFIX=/opt/suzume で変更可
```

C++17 コンパイラと CMake 3.15 以降が必要です。使い方、CMake の `find_package`、pkg-config、辞書組み込みビルドは [C / C++ ライブラリガイド](/ja/docs/cpp) を参照してください。
