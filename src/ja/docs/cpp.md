# C / C++ ライブラリ

Suzume はネイティブの C / C++ プログラムへ直接リンクできます。WebAssembly も JavaScript も、実行時依存もありません。コアは WASM・Python・Go の各バインディングが包んでいるものと同じ C++ トークナイザーで、ここではそれを通常の静的／共有ライブラリとして利用したり、辞書を埋め込んで組み込んだりします。

同じパッケージに2つの入口が同梱されています。

| ヘッダー | 言語 | API |
|----------|------|-----|
| `suzume/suzume.hpp` | C++ | ヘッダーオンリーの RAII ラッパー（`suzume::Tokenizer`） |
| `suzume/suzume_c.h` | C | 安定した C ABI（`suzume_*` 関数） |

C++ ラッパーは C ABI 上の薄い例外なしレイヤーなので、リリースをまたいで ABI 互換を保ちます。

## 要件

- C++17 コンパイラ（GCC 8+、Clang 10+、Apple Clang 12+、MSVC 2019+）
- CMake 3.15 以降

コアに外部の実行時依存はありません（スレッド・ICU・Boost いずれも不要）。

## インストール

ライブラリ・ヘッダー・CMake パッケージ設定・pkg-config ファイルをソースからビルドしてインストールします。

```bash
git clone https://github.com/libraz/suzume.git
cd suzume
make install                 # /usr/local へ。PREFIX=/opt/suzume で変更可
```

静的（`suzume::suzume`）と共有（`suzume::suzume_shared`）の両ターゲットがインストールされます。埋め込まない限り、コンパイル済み辞書は `<prefix>/share/suzume` にインストールされ、実行時に自動で読み込まれます。

## C++ の使い方

ヘッダーオンリーのラッパーをインクルードします。`suzume::Tokenizer` はハンドルを RAII で保持し、所有権を持つ `std::string` / `std::vector` を返します。

```cpp
#include "suzume/suzume.hpp"
#include <cstdio>

int main() {
  suzume::Tokenizer tokenizer;
  if (!tokenizer) {
    std::fprintf(stderr, "%s\n", suzume::Tokenizer::lastError().c_str());
    return 1;
  }

  for (const suzume::Morpheme& m : tokenizer.analyze("東京都に住んでいます")) {
    std::printf("%s\t%s\t%s\n", m.surface.c_str(), m.pos.c_str(), m.lemma.c_str());
  }

  for (const suzume::Tag& tag : tokenizer.generateTags("東京スカイツリーに行きました")) {
    std::printf("%s\n", tag.text.c_str());
  }
}
```

`analyze()` は失敗時に空のベクターを返します。`Tokenizer::lastError()` を確認してください。ラッパーはムーブ専用で、デストラクタでハンドルを解放します。

## C の使い方

C ABI を直接インクルードします。各結果は呼び出し側が所有し、ちょうど1回解放する必要があります。

```c
#include "suzume/suzume_c.h"
#include <stdio.h>

int main(void) {
  suzume_t handle = suzume_create();
  if (handle == NULL) {
    fprintf(stderr, "%s\n", suzume_last_error());
    return 1;
  }

  suzume_result_t* result = suzume_analyze(handle, "東京都に住んでいます");
  if (result == NULL) {
    fprintf(stderr, "%s\n", suzume_last_error());
    suzume_destroy(handle);
    return 1;
  }

  for (size_t i = 0; i < result->count; i++) {
    const suzume_morpheme_t* m = &result->morphemes[i];
    printf("%s\t%s\t%s\n", m->surface, m->pos, m->base_form);
  }

  suzume_result_free(result);
  suzume_destroy(handle);
  return 0;
}
```

::: warning 所有権
NULL でない `suzume_result_t*` / `suzume_tags_t*` は必ず `suzume_result_free` / `suzume_tags_free` でちょうど1回解放し、ハンドルは `suzume_destroy` で解放してください。C++ ラッパーはこれを自動で行います。
:::

## CMake でのリンク

インストールには `find_package` 用の設定が同梱されます。静的コア（自己完結）か共有ライブラリをリンクします。

```cmake
find_package(suzume CONFIG REQUIRED)

target_link_libraries(myapp PRIVATE suzume::suzume)          # 静的・自己完結
# target_link_libraries(myapp PRIVATE suzume::suzume_shared) # 共有（インストール時）
```

静的コアをリンクする C プログラムは、C++ ランタイムを取り込むために C++ リンカードライバーを使う必要があります（共有ライブラリをリンクする場合は無害です）。

```cmake
set_target_properties(myapp PROPERTIES LINKER_LANGUAGE CXX)
```

## pkg-config でのリンク

```bash
cc myapp.c $(pkg-config --cflags --libs suzume) -o myapp
```

実行可能な C / C++ のサンプル（`find_package` を使うスタンドアロンのコンシューマープロジェクトを含む）は [`examples/`](https://github.com/libraz/suzume/tree/main/examples) にあります。

## 組み込み／ファイルシステム不要

`-DSUZUME_EMBED_DICT=ON`（または `make embedded`）を指定すると、辞書をバイナリに埋め込みます。ライブラリはファイルシステムにも環境変数にも触れず、自己完結した静的アーカイブとしてリンクされます。

```bash
make embedded          # -DSUZUME_EMBED_DICT=ON、静的、CLI・テストなし
```

コアは `Expected<T, Error>` ベースで（通常動作では例外を投げません）、`-fno-exceptions -fno-rtti` でコンパイルできます。対象は C++ ランタイムとヒープを持つ環境（ホスト型組み込み／RTOS）であり、ベアメタルの freestanding ではありません。

## Morpheme のフィールド

`analyze()` は `std::vector<suzume::Morpheme>`（C++）、または `suzume_morpheme_t` の配列を保持する `suzume_result_t`（C）を返します。各形態素は次のフィールドを持ちます。

| C++（`Morpheme`） | C（`suzume_morpheme_t`） | 説明 |
|-------------------|--------------------------|------|
| `surface` | `surface` | テキスト中に現れる表層形 |
| `pos` | `pos` | 品詞タグ（大文字。例: `NOUN`、`VERB`） |
| `lemma` | `base_form` | 辞書の原形（レンマ） |
| `pos_ja` | `pos_ja` | 品詞の日本語名 |
| `conj_type` | `conj_type` | 活用型（該当する場合） |
| `conj_form` | `conj_form` | 活用形（該当する場合） |
| `extended_pos` | `extended_pos` | 安定した細分化品詞コード（例: `VERB_連用`） |
| `start` | `start` | 正規化後テキストでの開始文字オフセット |
| `end` | `end` | 正規化後テキストでの終了文字オフセット |
| `is_user_dict` | `is_user_dict` | 読み込んだユーザー辞書由来のエントリ |
| `is_formal_noun` | `is_formal_noun` | 形式名詞のエントリ |
| `is_low_info` | `is_low_info` | 情報量の低い語 |
| `is_unknown` | `is_unknown` | 未知語 |
| `is_from_dictionary` | `is_from_dictionary` | 辞書からマッチしたエントリ |
| `score` | `score` | 形態素の解析スコア |

品詞と `extendedPos` の値一覧は [API リファレンス](/ja/docs/api) を参照してください。

## オプション

`suzume::Options` を構築して正規化と分割を制御します。既定値は推奨設定に一致します（`preserve_vu`・`preserve_case` は有効、`preserve_symbols` は無効、`Mode::Normal`、`lemmatize` は有効、`merge_compounds` は無効）。

```cpp
suzume::Options opts;
opts.mode = suzume::Mode::Search;
opts.merge_compounds = true;

suzume::Tokenizer tokenizer(opts);
```

利用できるモードは `Mode::Normal`・`Mode::Search`・`Mode::Split` です。

C では、まず `suzume_init_extended_options()` を呼んで既定で `true` のフィールドを保ったうえで、個別のフィールドを上書きし、その構造体を `suzume_create_with_extended_options()` に渡します。

## タグオプション

どちらの言語でも同じタグフィルターを利用できます。C++ では既定構築した `suzume::TagOptions` を起点に、必要なフィールドだけ上書きします。

```cpp
suzume::TagOptions opts;
opts.pos_filter = 1;   // 1=名詞, 2=動詞, 4=形容詞, 8=副詞（0=すべて）
opts.max_tags = 10;

auto tags = tokenizer.generateTags("東京都の天気予報を確認する", opts);
```

C では、まず `suzume_init_tag_options()` を呼んでからフィールドを上書きし、`suzume_generate_tags_with_options()` に渡します。

## ユーザー辞書

CSV 形式のユーザー辞書エントリ、またはコンパイル済みバイナリ `.dic` をメモリから読み込みます。

```cpp
tokenizer.loadUserDictionary("ChatGPT,NOUN\n東京スカイツリー,NOUN");

std::vector<std::uint8_t> dic = /* user.dic を読み込む */;
tokenizer.loadBinaryDictionary(dic.data(), dic.size());
```

C ABI では `suzume_load_user_dict()` と `suzume_load_binary_dict()` が対応します。

## スレッド安全性

ハンドルはインスタンスごとの可変状態を持ち、並行解析には対応しません。スレッドごとに `Tokenizer`（または `suzume_t`）を1つ使うか、共有するハンドルへの呼び出しを直列化してください。異なるハンドルは並行利用でき、ハンドルの生成は軽量です。

## 関連ページ

- [API リファレンス](/ja/docs/api) — 品詞と `extendedPos` の値一覧、共通の Morpheme 概念。
- [ネイティブビルド](/ja/docs/native-build) — `suzume-cli` コマンドと WASM モジュールをソースからビルドする方法。
- [はじめに](/ja/docs/getting-started) — 全バインディング共通の入門。
