# テストガイド

Suzume は C++ コアロジック、WASM バインディング、CLI 機能をカバーする包括的なテストスイートを備えています。このガイドでは、テストの実行方法、新しいテストの追加方法、ベンチマークツールの使い方を説明します。

## テストアーキテクチャ

| レイヤー | フレームワーク | ファイル数 | 説明 |
|---------|-------------|----------|------|
| C++ 単体/結合テスト | Google Test 1.12.1 | 36 | コアライブラリ、辞書、文法、正規化 |
| データ駆動テスト | JSON + Google Test | 86 JSON | トークナイズの正確性（自動検出） |
| WASM | Vitest | 4 | JS/C API、メモリレイアウト、構造体互換性 |
| Python | pytest | `bindings/python/tests/` | analyze/tags API、ABI レイアウト |
| CLI | 組み込み | `test` コマンド | 単体/バッチテスト、ベンチマーク |

## テストの実行

### C++ テスト

```bash
# ビルドして全テストを実行
make test

# 手動で実行する場合:
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --parallel
cmake --build build --target build-dict   # 必須: 先に辞書をビルド
ctest --test-dir build --output-on-failure
```

名前パターンで特定のテストを実行:

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
# 直接実行する場合: (cd bindings/python && uv run --extra dev pytest)
```

pytest スイート（`bindings/python/tests/`）は analyze / tags API と ABI 構造体レイアウトをカバーします。

### CLI テストコマンド

```bash
# 単一入力のテスト
suzume-cli test "東京スカイツリー" --expect "東京,スカイツリー"

# ファイルからテストを実行
suzume-cli test -f tests.tsv

# ユーザー辞書を指定
suzume-cli test -f tests.tsv -d user.dic

# 詳細出力
suzume-cli test -f tests.tsv -v
```

## テストの追加

### データ駆動トークナイズテスト（推奨）

最も簡単な方法です。`tests/data/tokenization/` に置いた JSON ファイルは**自動検出**されるため、コードの変更は不要です。

JSON ファイルを作成:

```json
{
  "version": "1.0",
  "description": "テストカテゴリの説明",
  "cases": [
    {
      "id": "unique_test_id",
      "description": "このテストが検証する内容",
      "input": "テスト入力",
      "tags": ["category", "subcategory"],
      "expected": [
        {
          "surface": "テスト",
          "pos": "Noun",
          "lemma": "テスト"
        },
        {
          "surface": "入力",
          "pos": "Noun",
          "lemma": "入力"
        }
      ]
    }
  ]
}
```

`tests/data/tokenization/` に配置してリビルドするだけで、`universal_tokenization_test.cpp` が自動的に検出します。

::: warning フィクスチャの POS ラベル
これらの JSON フィクスチャの `pos` 値は、先頭大文字のリファレンス用体系（`Noun`、`Particle` など）を使います。これはライブラリが返す実行時の `Morpheme.pos` 値とは別のラベル集合で、実行時の値は英大文字（`NOUN`、`PARTICLE` など）です。両者がそのまま一致するとは考えないでください。
:::

#### オプションフィールド

```json
{
  "id": "test_with_extras",
  "input": "...",
  "expected": [...],
  "suzume_expected": [...],
  "accepted_diff": {
    "category": "lemma-diff",
    "reason": "Suzume uses different lemma normalization"
  }
}
```

- `suzume_expected` — Suzume 固有の期待出力（リファレンスと意図的に異なる場合）
- `accepted_diff` — 既知の差異とその理由を文書化

#### 既存のテストファイル

言語カテゴリ別に整理された 86 個の JSON ファイル。スイートは随時追加されており、代表的なものを挙げます:

| カテゴリ | 説明 |
|---------|------|
| `basic.json` | 基本的なトークナイズ、単語 |
| `adjective*.json` | イ形容詞、ナ形容詞、複合語 |
| `verb*.json` | 一段、五段、サ変、受動、使役 |
| `particle*.json` | 格助詞、係助詞、接続助詞 |
| `usecase_*.json` | 実際のテキスト: ニュース、ビジネス、日常会話 |
| `pattern_*.json` | 言語パターン |

### C++ 単体テスト

内部モジュールを直接テストする場合:

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

WebAssembly バインディングのテスト:

`bindings/wasm/tests/feature.test.ts` を作成:

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

CLI でのバッチテスト用:

```tsv
# コメントは # で開始
東京スカイツリーに行きました	東京,スカイツリー,行く
美しい花が咲いている	美しい,咲く
```

実行:

```bash
suzume-cli test -f tests.tsv
```

各テストの結果と合格/不合格の集計が表示されます。

## ベンチマーク

CLI にベンチマークコマンドが組み込まれています:

```bash
# デフォルト: 組み込みテストテキストで 1000 回反復
suzume-cli test benchmark

# 反復回数を指定
suzume-cli test benchmark --iterations=5000

# カスタムコーパスを使用
suzume-cli test benchmark -f corpus.txt
```

出力されるメトリクス:
- 合計時間（ms）
- スループット（文字/秒）
- テキストあたりの平均レイテンシ

## デバッグビルド

### サニタイザ付き

```bash
# AddressSanitizer
cmake -B build -DCMAKE_BUILD_TYPE=Debug -DENABLE_ASAN=ON
cmake --build build && ctest --test-dir build

# UndefinedBehaviorSanitizer
cmake -B build -DCMAKE_BUILD_TYPE=Debug -DENABLE_UBSAN=ON
cmake --build build && ctest --test-dir build

# ThreadSanitizer
cmake -B build -DCMAKE_BUILD_TYPE=Debug -DENABLE_TSAN=ON
cmake --build build && ctest --test-dir build
```

### カバレッジ付き

```bash
cmake -B build -DCMAKE_BUILD_TYPE=Debug -DENABLE_COVERAGE=ON
cmake --build build
ctest --test-dir build
# カバレッジファイルが build/ に生成されます
```

## CI

GitHub Actions がプッシュごとに実行されます:

1. **Lint** — Biome による JS/TS リント（`bindings/wasm/js/`、`bindings/wasm/tests/`。設定は `bindings/wasm/biome.json`）
2. **ビルド & テスト** — カバレッジ付き C++ テスト、WASM テスト
3. **カバレッジ** — Codecov にアップロード（CLI コードはカバレッジ対象外）

## Makefile ターゲット

| ターゲット | 説明 |
|-----------|------|
| `make test` | 辞書ビルド + 全 C++ テスト実行 |
| `make build` | プロジェクトをビルド |
| `make dict` | 辞書のみビルド |
| `make wasm-test` | WASM ビルド + WASM テスト実行 |
| `make format` | clang-format で C++ コードをフォーマット |
| `make format-check` | C++ コードのフォーマットをチェック |
