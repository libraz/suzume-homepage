---
title: "テストガイド：コア・バインディング・CI"
description: "Suzume コアリポジトリのテスト構成です。C++ コア、WASM と Python のバインディング、ネイティブ CLI、バインディング間の一致の検証と、テストの追加、ベンチマーク、CI を説明します。"
---

# テストガイド

コアリポジトリでは、C++ コア、WASM・Python バインディング、ネイティブ CLI、MCP の基準テスト、サンプル、バインディング間整合性をテストします。Go バインディングは別リポジトリで管理・テストしています。

## テストアーキテクチャ

| レイヤー | フレームワーク | 場所 | 説明 |
|---------|-------------|------|------|
| C++ 単体/結合テスト | Google Test | `tests/**/*.cpp` | コアライブラリ、辞書、文法、正規化 |
| データ駆動テスト | JSON + Google Test | `tests/data/tokenization/*.json` | トークン化の正確性（自動検出） |
| WASM | Vitest | `bindings/wasm/tests/` | JS/C API、メモリレイアウト、生成 ABI の互換性 |
| Python | pytest | `bindings/python/tests/` | analyze/tags API、エラー、ABI レイアウト |
| CLI | 組み込み | `test` / `test benchmark` | 単体/バッチテストとベンチマーク |
| Go | Go test | [`go-suzume`](https://github.com/libraz/go-suzume) | cgo API、所有権、辞書、並行実行 |

## テストの実行

### C++ テスト

```bash
# 辞書をビルドしてネイティブテストを実行
make native-test

# 手動で実行する場合
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --parallel
cmake --build build --target build-dict   # 必須: 先に辞書をビルド
build/bin/suzume_test
ctest --test-dir build --output-on-failure -R native_cli_contract
```

名前パターンで特定のテストを実行します。

```bash
ctest --test-dir build -R "ConjugationTest" --output-on-failure
ctest --test-dir build -R "UserDict" --verbose
```

### WASM テスト

```bash
# WASM をビルドしてテストを実行
make wasm-test

# テストのみ実行（WASM ビルド済みの場合）
(cd bindings/wasm && yarn test)
(cd bindings/wasm && yarn test:watch)      # ウォッチモード
(cd bindings/wasm && yarn test:coverage)   # カバレッジレポート付き
```

### Python テスト

```bash
make python-test
# Rye 環境を準備済みで pytest だけ実行する場合:
(cd bindings/python && rye run pytest -q)
```

`make python-test` はバインディングと辞書をビルドし、Ruff と mypy も実行します。

### Go テスト

別リポジトリ `go-suzume` でバインディングテストを実行します。

```bash
make test
make test-race
```

前者はネイティブライブラリをビルドして `go test ./... -count=1` を実行し、後者は race detector 付きテストを実行します。

### CLI テストコマンド

```bash
# 単一入力のテスト
suzume-cli test "東京スカイツリー" --expect "東京,スカイツリー"

# ファイルからテストを実行
suzume-cli test -f tests.tsv

# ユーザー辞書を指定
suzume-cli test -f tests.tsv -d user.dic

```

`test` コマンドが比較するのは `analyze` が返す順序付きのトークン列ではなく、生成されたタグの集合です。既定のタグ生成は原形を使い、助詞・助動詞・形式名詞・低情報語を除外します。タグの順序と重複は比較せず、既定の最小タグ長は 2 文字です。トークン境界や品詞を確認する場合は `analyze` を使ってください。

## テストの追加

### データ駆動トークン化テスト（推奨）

`tests/data/tokenization/*.json` の期待値は、基準となる辞書ベースの解析器の正規化パイプラインから生成され、`universal_tokenization_test.cpp` によって自動検出されます。

::: danger 生成フィクスチャを直接編集しない
`tests/data/tokenization/*.json` と `data/**/*.tsv` はツール管理下にあり、リポジトリのフックが直接書き込みをブロックします。Suzume の現在の出力に合わせるためだけに期待トークンを変更してはいけません。トークナイザーまたは正規化規則を修正し、ツール経由で再生成してください。
:::

リポジトリの MCP サーバーを設定している場合、不一致は 2 通りの修正のどちらかを経てから登録します。

<DiagramFixtureLoop />

```text
test_show(input_text="問題文")
# トークナイザーの規則を直してリビルドするか、正規化規則を直す
test_show(input_text="問題文")
test_add(input_text="問題文", file="verb_example.json")
```

正規化規則は `scripts/mcp/src/suzume_mcp/core/` 以下にあります。最新のフローとツール一覧はリポジトリの `CONTRIBUTING.md` と `AGENTS.md` を参照してください。

::: warning フィクスチャの品詞ラベル
これらの JSON フィクスチャの `pos` 値は、先頭大文字のリファレンス用体系（`Noun`、`Particle` など）を使います。これはライブラリが返す実行時の `Morpheme.pos` 値とは別のラベル集合で、実行時の値は英大文字（`NOUN`、`PARTICLE` など）です。両者がそのまま一致するとは考えないでください。
:::

#### 既存のテストファイル

スイートは随時追加し、言語カテゴリ別に整理しています。代表例を次に示します。

| カテゴリ | 説明 |
|---------|------|
| `basic.json` | 基本的なトークン化、単語 |
| `adjective*.json` | イ形容詞、ナ形容詞、複合語 |
| `verb*.json` | 一段、五段、サ変、受動、使役 |
| `particle*.json` | 格助詞、係助詞、接続助詞 |
| `usecase_*.json` | 実際のテキスト: ニュース、ビジネス、日常会話 |
| `pattern_*.json` | 言語パターン |

### C++ 単体テスト

内部モジュールを直接テストする場合は、次の手順を取ります。

1. `tests/category/new_test.cpp` を作成
2. `tests/CMakeLists.txt` の `TEST_SOURCES` に追加

```cpp
#include <gtest/gtest.h>
#include "module_header.h"

TEST(ModuleTest, SpecificBehavior) {
    // 準備
    auto input = ...;

    // 実行
    auto result = module.process(input);

    // 検証
    EXPECT_EQ(result.field, expected_value);
}
```

### WASM テスト

WebAssembly バインディングのテストを追加します。

`bindings/wasm/tests/feature.test.ts` を作成します。

```typescript
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Suzume } from '../dist/index.js'

describe('Feature', () => {
  let suzume: Suzume

  beforeAll(async () => {
    suzume = await Suzume.create()
  })

  afterAll(() => {
    suzume.destroy()
  })

  it('should behave correctly', () => {
    const morphemes = suzume.analyze('テスト')
    expect(morphemes[0].surface).toBe('テスト')
  })
})
```

### CLI テストファイル（TSV）

CLI でバッチテストを実行する場合の入力形式です。

```tsv
# コメントは # で開始
東京スカイツリーに行きました	東京,スカイツリー,行く
美しい花が咲いている	美しい,咲く
```

次のコマンドで実行します。

```bash
suzume-cli test -f tests.tsv
```

各テストの結果と合格/不合格の集計が表示されます。

## ベンチマーク

CLI にはベンチマークコマンドが組み込まれています。

```bash
# 組み込みテストテキストを既定の計測条件で実行
suzume-cli test benchmark

# 定常反復、統計サンプル、ウォームアップを指定
suzume-cli test benchmark --iterations=5 --samples=3 --warmup=2

# カスタムコーパスを使用
suzume-cli test benchmark -f corpus.txt
```

初期化時間、初回解析レイテンシ、定常状態の中央値、バイトスループット、テキストあたりのレイテンシ、ピーク RSS などが出力されます。複数サンプルを使うことで、一時的な揺れの影響を抑えた中央値を確認できます。

## デバッグビルド

### サニタイザー付き

```bash
# AddressSanitizer
cmake -B build-asan -DCMAKE_BUILD_TYPE=Debug -DENABLE_SANITIZER=ON -DENABLE_ASAN=ON
cmake --build build-asan --parallel
cmake --build build-asan --target build-dict
ctest --test-dir build-asan --output-on-failure

# UndefinedBehaviorSanitizer
cmake -B build-ubsan -DCMAKE_BUILD_TYPE=Debug -DENABLE_SANITIZER=ON -DENABLE_UBSAN=ON
cmake --build build-ubsan --parallel
cmake --build build-ubsan --target build-dict
ctest --test-dir build-ubsan --output-on-failure

# ThreadSanitizer
cmake -B build-tsan -DCMAKE_BUILD_TYPE=Debug -DENABLE_SANITIZER=ON -DENABLE_TSAN=ON
cmake --build build-tsan --parallel
cmake --build build-tsan --target build-dict
ctest --test-dir build-tsan --output-on-failure
```

`make asan` は AddressSanitizer、LeakSanitizer、UndefinedBehaviorSanitizer の標準一括ターゲットです。

### カバレッジ付き

```bash
cmake -B build -DCMAKE_BUILD_TYPE=Debug -DENABLE_COVERAGE=ON
cmake --build build --parallel
cmake --build build --target build-dict
ctest --test-dir build --output-on-failure
# カバレッジファイルが build/ に生成されます
```

## CI

ドキュメントだけの変更を除き、GitHub Actions は `main` と `develop` への push、および `main` 向け pull request で動きます。ワークフローには 7 つのジョブがあり、`python-binding` だけは `develop` への直接 push ではスキップされます。

| ジョブ | 内容 |
|--------|------|
| `lint` | WASM の lint、MCP サーバーとリポジトリ内 Python スクリプトの Ruff 検査 |
| `guardrails` | 生成ファイル、列挙値ミラー、基準テスト、複合語、バージョン整合性の検査 |
| `mcp-tests` | MeCab + IPADIC を使う MCP／基準テストと期待値同期 |
| `sanitizers` | ネイティブの ASan・LSan・UBSan 検査 |
| `manylinux-toolchain` | サポート対象で最古の manylinux ツールチェーンによる共有コアのコンパイル |
| `build-and-test` | カバレッジ付きネイティブテストとサンプル、WASM ビルド・サイズ・テスト、バインディング間整合性 |
| `python-binding` | Python バインディングの `ruff check` / `ruff format --check`、`mypy`、`pytest` |

`make consumer-smoke` は `build-and-test` で実行されます。`make format-check`（C++ の clang-format を含む）はローカル検証用で、CI には組み込まれていません。

## Makefile ターゲット

| ターゲット | 説明 |
|-----------|------|
| `make test` | ネイティブ、MCP、Python、WASM、サンプル、利用側スモークテスト、バインディング整合性、ガードレールを検査 |
| `make build` | プロジェクトをビルド |
| `make dict` | プロジェクトをビルド後、辞書をコンパイル |
| `make wasm-test` | WASM ビルド + WASM テスト実行 |
| `make python-test` | Python バインディングをビルドし、lint・型検査を含めてテスト |
| `make examples` | リポジトリ内の C/C++ サンプルをビルド |
| `make consumer-smoke` | `find_package` 経由でインストール済みパッケージを検査 |
| `make version-check` | バインディングマニフェスト間のバージョンを検証 |
| `make format` | C++、MCP、WASM、Python を整形・lint |
| `make format-check` | 全言語の整形状態を検査 |
