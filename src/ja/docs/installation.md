---
title: "インストール：npm・CDN・Python・Go・C++"
description: "Suzume のインストール方法です。ブラウザ・Node.js・Deno・Bun は npm か CDN の @libraz/suzume、Python は PyPI の suzume、Go と C/C++ はソースからビルドします。"
---

# インストール

## 実行環境を選ぶ {#pick-your-runtime}

| 実行環境 | パッケージ | ビルド済み | 動作要件 |
|----------|------------|------------|----------|
| ブラウザ、Node.js、Deno、Bun | npm の `@libraz/suzume` | あり。全プラットフォーム共通の WASM ビルド | Node.js 18.0 以上、Deno 1.31 以上（`npm:@libraz/suzume`）、Bun 1.0 以上、または WebAssembly 対応ブラウザ |
| Python | PyPI の `suzume` | Linux x86_64（`manylinux2014` / `manylinux_2_17`）と macOS arm64（macOS 11 以降）のホイールのみ。Windows、macOS x86_64、Linux arm64、その他のプラットフォームには対応せず、ソースディストリビューションもない | Python 3.10 以上 |
| Go | `github.com/libraz/go-suzume` | なし。C++ コアをソースからビルド | Go 1.26 以上、CGO、C++17 コンパイラ、CMake 3.15 以上 |
| C / C++ | `libraz/suzume` のソースチェックアウト | なし | C++17 コンパイラ、CMake 3.15 以上 |
| ネイティブ `suzume-cli` | `libraz/suzume` のソースチェックアウト | なし | C++17 コンパイラ、CMake 3.15 以上 |

## JavaScript

JavaScript、TypeScript、ブラウザで使う場合は WASM パッケージをインストールします。

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

パッケージには WASM バイナリと辞書が含まれているため、実行時にほかのファイルは要りません。

## CDN

ビルドステップなしでブラウザから使う場合は、CDN から読み込みます。

```html
<script type="module">
  import { Suzume } from 'https://cdn.jsdelivr.net/npm/@libraz/suzume/dist/index.js'

  const suzume = await Suzume.create()
  console.log(suzume.analyze('こんにちは'))
  suzume.destroy() // 使い終わったら解放
</script>
```

## Python

Python アプリケーションやデータ処理では、PyPI からホイールをインストールします。

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

ソースディストリビューションがないため、`pip install` は [実行環境を選ぶ](#pick-your-runtime) に挙げたプラットフォームでだけ成功します。ホイールにはネイティブライブラリと辞書が含まれ、`suzume` コマンドもインストールされます。API は [Python バインディング](/ja/docs/python)、コマンドは [Python CLI](/ja/docs/python-cli) を参照してください。

## Go

cgo バインディングは C++ コアをソースからビルドしますが、読み取り専用の Go モジュールキャッシュ内では `go get` だけでビルドできません。クローンして一度ビルドし、利用側のモジュールからそのチェックアウトを参照します。

```bash
git clone https://github.com/libraz/go-suzume.git
cd go-suzume && make lib
```

利用側のモジュールでは次のコマンドを実行します。

```bash
go mod edit -replace github.com/libraz/go-suzume=/path/to/go-suzume
go get github.com/libraz/go-suzume
```

ビルドしたアプリケーションには辞書が埋め込まれるため、実行時に外部辞書ファイルは不要です。初期化、所有権、オプション、API の詳細は [Go バインディング](/ja/docs/go) を参照してください。

## コマンドラインツール

コマンドは 2 つあり、辞書をコンパイルできるのは片方だけです。

| コマンド | 入手元 | 解析とタグ抽出 | `dict compile`、検証、テスト、ベンチマーク |
|----------|--------|----------------|--------------------------------------------|
| `suzume` | PyPI ホイール | 可 | 不可 |
| `suzume-cli` | `libraz/suzume` のソースビルド | 可 | 可 |

Python ホイールをインストールすると `suzume` コマンドが使えます。

```bash
suzume --format json "東京へ行く"
```

### ネイティブ `suzume-cli` {#suzume-cli}

`suzume-cli` は npm パッケージにも PyPI ホイールにも含まれていません。ソースチェックアウトからビルドしてインストールします。

```bash
git clone https://github.com/libraz/suzume.git
cd suzume
make install   # suzume-cli を /usr/local/bin へ。PREFIX=/opt/suzume で変更可
```

`make install` は C / C++ ライブラリとヘッダーに加え、コンパイル済み辞書を `$PREFIX/share/suzume` へインストールします。`suzume-cli` はこの辞書を自動で見つけます。インストールせずにチェックアウト内で使う場合は、[ネイティブビルド](/ja/docs/native-build#default-build) の手順でビルドし、`build/bin/suzume-cli` を実行してください。コマンドの一覧は [ネイティブ CLI リファレンス](/ja/docs/cli) を参照してください。

## C / C++

ネイティブの C / C++ プログラムに Suzume を直接リンクするには、ライブラリをソースからビルドしてインストールします。

```bash
git clone https://github.com/libraz/suzume.git
cd suzume
make install                 # /usr/local へ。PREFIX=/opt/suzume で変更可
```

[`suzume-cli`](#suzume-cli) をインストールするコマンドと同じです。使い方、CMake の `find_package`、pkg-config、辞書組み込みビルドは [C / C++ ライブラリガイド](/ja/docs/cpp) を参照してください。
