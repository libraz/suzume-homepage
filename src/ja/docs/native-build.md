# ネイティブビルド

Suzume は C++17 の静的ライブラリとネイティブ開発者向け CLI としてビルドできます。共有 C ABI ライブラリ、辞書埋め込み、連携サンプル、WASM は任意です。

::: tip 自分のプロジェクトへのリンク
このページではソースビルドの構成を説明します。インストール済みの C / C++ API、CMake ターゲット、pkg-config、所有権、ABI チェックは [C / C++ ライブラリガイド](/ja/docs/cpp) を参照してください。
:::

## ソースからのビルド

### 必要環境

- C++17 対応コンパイラ（GCC 8+、Clang 10+、MSVC 2019+）
- CMake 3.15 以降

### 既定のビルド

`BUILD_CLI` と `BUILD_TESTING` は既定で ON です。

```bash
git clone https://github.com/libraz/suzume.git
cd suzume

cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --parallel

# ネイティブ CLI
build/bin/suzume-cli --help
```

静的ライブラリは常にビルドされます。共有 C ABI ライブラリも必要なら `-DBUILD_SHARED=ON` を追加します。

### ビルドオプション

| オプション | 既定値 | 説明 |
|------------|--------|------|
| `BUILD_TESTING` | `ON` | ネイティブテストスイートをビルド |
| `BUILD_WASM` | `OFF` | Emscripten でビルド |
| `BUILD_SHARED` | `OFF` | 共有 C ABI ライブラリもビルド |
| `BUILD_CLI` | `ON` | ネイティブ開発者向け CLI をビルドしてインストール |
| `SUZUME_EMBED_DICT` | `OFF` | コンパイル済み辞書を埋め込み、辞書ファイル探索を無効化 |
| `SUZUME_LIB_SOVERSION` | `ON` | 共有ライブラリに VERSION/SOVERSION を付与 |
| `SUZUME_INSTALL` | `ON` | インストール規則と CMake/pkg-config パッケージメタデータを生成 |
| `SUZUME_BUILD_EXAMPLES` | `OFF` | ネイティブ C / C++ 連携サンプルをビルド |
| `ENABLE_DEBUG_INFO` | ネイティブ `ON`、WASM `OFF` | 候補の生成元を追跡 |
| `ENABLE_DEBUG_LOG` | ネイティブ `ON`、WASM `OFF` | `SUZUME_DEBUG` ログをコンパイル |
| `ENABLE_COVERAGE` | `OFF` | コンパイラのカバレッジ計測を追加 |
| `ENABLE_SANITIZER` | `OFF` | サニタイザフラグを有効化 |
| `ENABLE_ASAN` | `OFF` | AddressSanitizer を選択 |
| `ENABLE_UBSAN` | `OFF` | UndefinedBehaviorSanitizer を選択 |
| `ENABLE_TSAN` | `OFF` | ThreadSanitizer を選択 |

`ENABLE_SANITIZER=ON` で個別のサニタイザを選ばなかった場合は、AddressSanitizer と UndefinedBehaviorSanitizer が有効になります。

```bash
cmake -S . -B build \
  -DCMAKE_BUILD_TYPE=Release \
  -DBUILD_TESTING=OFF \
  -DBUILD_SHARED=ON
cmake --build build --parallel
```

CLI コマンドは [CLI リファレンス](/ja/docs/cli) を参照してください。

## ライブラリのみのビルド

ビルド環境でライブラリとパッケージメタデータだけを生成する場合は、`BUILD_CLI` を OFF にします。

```bash
cmake -S . -B build-lib \
  -DCMAKE_BUILD_TYPE=Release \
  -DBUILD_CLI=OFF \
  -DBUILD_TESTING=OFF \
  -DCMAKE_INSTALL_PREFIX=/opt/suzume
cmake --build build-lib --parallel
cmake --install build-lib
```

この構成では `suzume-cli`、`build-dict`、`validate-dict` を生成しません。CLI が生成する `core.dic` と `user.dic` もインストール対象外です。`SUZUME_EMBED_DICT=OFF` なら、コンパイル済み辞書を別にインストールするか、それを置いたディレクトリを実行時に指定してください。`Options::data_directory`、対応する C オプション、または `SUZUME_DATA_DIR` を使えます。

辞書を含む1つの静的アーカイブを作る場合:

```bash
make embedded
```

このターゲットは `SUZUME_EMBED_DICT=ON` で `suzume` をビルドし、CLI とテストはビルドしません。

## 辞書のビルド

辞書ビルドターゲットにはネイティブ CLI が必要です。

```bash
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --parallel

# data/{core,user}/*.tsv を data/{core,user}.dic にコンパイル
cmake --build build --target build-dict

# コア TSV ファイルを検証
cmake --build build --target validate-dict
```

`BUILD_CLI=OFF` の場合、どちらのターゲットも生成されません。

## C / C++ サンプルのビルド

```bash
cmake -S . -B build \
  -DCMAKE_BUILD_TYPE=Release \
  -DSUZUME_BUILD_EXAMPLES=ON
cmake --build build --parallel
ctest --test-dir build --output-on-failure -R '^suzume_example_'
```

`make examples-test` でも同じツリー内サンプルを実行できます。`examples/consumer` の単独プロジェクトは、インストール済みパッケージを `find_package(suzume CONFIG REQUIRED)` でテストします。

## WASM 向けビルド

サポート対象の Make ターゲットは、ネイティブ CLI で全辞書をコンパイルし、Emscripten を設定してモジュールをビルドします。

```bash
source /path/to/emsdk/emsdk_env.sh

make build
make wasm

# Emscripten 出力:
# bindings/wasm/dist/{suzume.wasm,suzume.js}

(cd bindings/wasm && yarn build:js)
# 追加出力:
# bindings/wasm/dist/{index.js,index.d.ts,decode.js,decode.d.ts}
# bindings/wasm/dist/{abi_labels.js,abi_labels.d.ts,abi_layout.js,abi_layout.d.ts}
```

`make wasm-test` はモジュールを再ビルドし、Vitest のバインディングテストを実行します。WASM ビルドは `-Oz`、LTO、例外／RTTI なし、ファイルシステムなし、辞書埋め込みです。そのため、メモリ確保失敗時は回復可能な C API エラーを返さず、モジュールを abort します。
