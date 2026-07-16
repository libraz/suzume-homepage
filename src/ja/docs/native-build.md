# ネイティブビルド

Suzumeはネイティブ C++ ライブラリおよび CLI ツールとしてビルドでき、ブラウザ/Node.js 環境外でも使用できます。

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
| `ENABLE_DEBUG_INFO` | `ON`（ネイティブ） | 候補のデバッグ元情報を有効化 |
| `ENABLE_DEBUG_LOG` | `ON`（ネイティブ） | デバッグログを有効化 |

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

WebAssembly バージョンのビルド方法：

```bash
# Emscripten SDK が必要
source /path/to/emsdk/emsdk_env.sh

# WASM 向けに設定
emcmake cmake -B build-wasm -DBUILD_WASM=ON -DCMAKE_BUILD_TYPE=Release

# 先にネイティブビルドで辞書をビルド
cmake --build build --target build-dict

# WASM をビルド
cmake --build build-wasm --parallel

# 出力: dist/suzume.js, dist/suzume-wasm.wasm
```
