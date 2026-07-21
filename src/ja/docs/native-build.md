# ネイティブビルド

Suzumeはネイティブ C++ ライブラリおよび CLI ツールとしてビルドでき、ブラウザ/Node.js 環境外でも使用できます。

::: tip 自分のプロジェクトへのリンク
このページは CLI・辞書・WASM モジュールをソースからビルドする方法を扱います。ライブラリをインストールして C / C++ プログラムへリンクする方法（CMake の `find_package`、pkg-config、組み込みのファイルシステム不要ビルド）は [C / C++ ライブラリガイド](/ja/docs/cpp) を参照してください。
:::

## ソースからのビルド

### 必要環境

- C++17 対応コンパイラ（GCC 8+、Clang 10+、MSVC 2019+）
- CMake 3.15+

### ビルド手順

```bash
git clone https://github.com/libraz/suzume.git
cd suzume

# 設定
cmake -B build -DCMAKE_BUILD_TYPE=Release

# ビルド
cmake --build build --parallel

# CLI バイナリは build/bin/suzume-cli に生成されます
```

### ビルドオプション

| オプション | デフォルト | 説明 |
|--------|---------|-------------|
| `BUILD_TESTING` | `ON` | テストスイートをビルド |
| `BUILD_WASM` | `OFF` | WebAssembly 向けにビルド（Emscripten が必要） |
| `BUILD_SHARED` | `OFF` | ネイティブバインディング用の共有 C ABI ライブラリもビルド |
| `SUZUME_EMBED_DICT` | `OFF` | コンパイル済み辞書を埋め込み、実行時のファイルアクセスをなくす |
| `SUZUME_INSTALL` | `ON` | CMake・pkg-config 用のインストール／エクスポート規則を生成 |
| `SUZUME_BUILD_EXAMPLES` | `OFF` | ネイティブ C / C++ 連携サンプルをビルド |
| `ENABLE_DEBUG_INFO` | `ON`（ネイティブ） | 候補のデバッグ元情報を有効化 |
| `ENABLE_DEBUG_LOG` | `ON`（ネイティブ） | デバッグログを有効化 |
| `ENABLE_COVERAGE` | `OFF` | コンパイラのカバレッジ計測を有効化 |
| `ENABLE_SANITIZER` | `OFF` | サニタイザを有効化（`ENABLE_ASAN`、`ENABLE_UBSAN`、`ENABLE_TSAN`） |

```bash
# 例: テストなしのリリースビルド
cmake -B build -DCMAKE_BUILD_TYPE=Release -DBUILD_TESTING=OFF
cmake --build build --parallel
```

`suzume-cli` コマンドの使い方は [CLI リファレンス](/ja/docs/cli) を参照してください。

## 辞書のビルド

辞書をビルドまたは再ビルドする方法：

```bash
# まず CLI をビルド
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --parallel

# 辞書をビルド（TSV → .dic にコンパイル）
cmake --build build --target build-dict

# 辞書を検証
cmake --build build --target validate-dict
```

## WASM 向けビルド

サポートされている簡易ターゲットは、ネイティブ版・Python 版と同じ完全な辞書を生成し、Emscripten の設定、モジュールのコンパイル、JavaScript ラッパーの出力まで行います。

```bash
# Emscripten SDK が必要
source /path/to/emsdk/emsdk_env.sh

# ネイティブ CLI を一度ビルドしてから、WASM パッケージ全体を生成
make build
make wasm

# Emscripten のネイティブ出力: bindings/wasm/dist/{suzume.wasm,suzume.js}

# 公開 TypeScript ラッパーと型宣言をコンパイル
(cd bindings/wasm && yarn build:js)
# 追加出力: bindings/wasm/dist/{index.js,index.d.ts,abi_labels.js,abi_layout.js}
```

`make wasm-test` はモジュールを再ビルドして Vitest のバインディングテストを実行します。WASM ビルドは `-Oz`、LTO、例外／RTTI なし、ファイルシステムなし、辞書埋め込みで生成されるため、メモリ確保失敗時は回復可能なネイティブ C API エラーではなくモジュールが abort します。
