# C / C++ ライブラリ

Suzume にはネイティブの静的ライブラリ、任意でビルドする共有ライブラリ、2つの公開ヘッダーがあります。

| ヘッダー | 言語 | API |
|----------|------|-----|
| `suzume/suzume.hpp` | C++17 | ヘッダーオンリーの RAII ラッパー（`suzume::Tokenizer`） |
| `suzume/suzume_c.h` | C | C ABI（`suzume_*` 関数） |

C++ ラッパーは C ハンドルを所有し、結果を `std::string` と `std::vector` にコピーします。ネイティブ側の失敗は例外ではなく `lastError()` と `lastErrorCode()` で通知します。ただし、標準ライブラリによるメモリ確保は `std::bad_alloc` を投げる場合があります。

## 要件

- C++17 コンパイラ（GCC 8+、Clang 10+、Apple Clang 12+、MSVC 2019+）
- CMake 3.15 以降

コアは ICU や Boost などのサードパーティー製ランタイムに依存しません。ネイティブプログラムには C++ ランタイムとヒープが必要です。

## インストール

ライブラリ、ヘッダー、CMake パッケージ設定、pkg-config ファイル、CLI、コンパイル済み辞書をビルドしてインストールします。

```bash
git clone https://github.com/libraz/suzume.git
cd suzume
make install                 # /usr/local へ。PREFIX=/opt/suzume で変更可
```

`make install` は `suzume::suzume`（静的）と `suzume::suzume_shared`（共有）の両方をビルドします。辞書を埋め込まない場合、`core.dic` と `user.dic` は `<prefix>/share/suzume` にインストールされます。

## C++ の使い方

`analyzeWithNormalizedText()` は、オフセットの基準となる正規化済みテキストと形態素をまとめて返します。

```cpp
#include <cstdio>

#include "suzume/suzume.hpp"

int main() {
  suzume::Tokenizer tokenizer;
  if (!tokenizer) {
    std::fprintf(stderr, "%s\n", suzume::Tokenizer::lastError().c_str());
    return 1;
  }

  const auto result = tokenizer.analyzeWithNormalizedText("東京都に住んでいます");
  if (result.morphemes.empty() &&
      suzume::Tokenizer::lastErrorCode() != SUZUME_ERROR_SUCCESS) {
    std::fprintf(stderr, "%s\n", suzume::Tokenizer::lastError().c_str());
    return 1;
  }

  for (const suzume::Morpheme& m : result.morphemes) {
    std::printf("%s\t%s\t%s\n",
                m.surface.c_str(), m.pos.c_str(), m.base_form.c_str());
  }

  for (const suzume::Tag& tag :
       tokenizer.generateTags("東京スカイツリーに行きました")) {
    std::printf("%s\t%s\n", tag.tag.c_str(), tag.pos.c_str());
  }
}
```

`analyze()` は形態素のベクターだけを返します。どちらの解析メソッドも `std::string_view` を受け取るため、部分文字列を NUL 終端の一時コピーにする必要はありません。`Tokenizer` はムーブ専用で、デストラクタから `suzume_destroy()` を呼びます。

新しいコードでは `Morpheme::base_form` を使ってください。`Morpheme::lemma` は同じ値を持つ、非推奨のソース互換エイリアスです。

## C の使い方

範囲指定関数はポインターとバイト数を受け取ります。入力に含まれる U+0000 も保持します。

```c
#include <stdio.h>

#include "suzume/suzume_c.h"

int main(void) {
  if (suzume_abi_version() != SUZUME_ABI_VERSION) {
    fputs("Suzume header/library ABI mismatch\n", stderr);
    return 1;
  }

  suzume_t handle = suzume_create();
  if (handle == NULL) {
    fprintf(stderr, "%s\n", suzume_last_error());
    return 1;
  }

  static const char text[] = "東京都に住んでいます";
  suzume_result_t* result =
      suzume_analyze_n(handle, text, sizeof(text) - 1);
  if (result == NULL) {
    fprintf(stderr, "%s\n", suzume_last_error());
    suzume_destroy(handle);
    return 1;
  }

  for (size_t i = 0; i < result->count; ++i) {
    const suzume_morpheme_t* m = &result->morphemes[i];
    const char* pos = suzume_pos_label(m->pos);
    fwrite(m->surface, 1, m->surface_size, stdout);
    printf("\t%s\t", pos != NULL ? pos : "UNKNOWN");
    fwrite(m->base_form, 1, m->base_form_size, stdout);
    putchar('\n');
  }

  suzume_result_free(result);
  suzume_destroy(handle);
  return 0;
}
```

簡易関数の `suzume_analyze()`、`suzume_generate_tags()`、`suzume_generate_tags_with_options()` は NUL 終端入力を読みます。対応する `_n` 関数は明示したバイト範囲を読みます。

- `suzume_analyze_n(handle, text, size)`
- `suzume_generate_tags_n(handle, text, size)`
- `suzume_generate_tags_with_options_n(handle, text, size, options)`

空入力は正常です。`count == 0` の NULL でない結果を返します。不正な UTF-8 は NULL を返し、最終エラーを設定します。

## 解析結果

`Tokenizer::analyzeWithNormalizedText()` は `suzume::AnalysisResult` を返します。C では `suzume_result_t` が対応します。

| C++ | C | 説明 |
|-----|---|------|
| `normalized_text` | `normalized_text`, `normalized_text_size` | 正規化済み UTF-8 とバイト長 |
| `morphemes` | `morphemes`, `count` | 形態素配列と要素数 |

`start` と `end` は正規化済みテキスト上の文字オフセットです。UTF-8 のバイトオフセットではありません。

| C++ `Morpheme` | C `suzume_morpheme_t` | 説明 |
|----------------|-------------------------|------|
| `surface` | `surface`, `surface_size` | 表層形の UTF-8 ビューとバイト長 |
| `base_form` | `base_form`, `base_form_size` | 辞書形／原形とバイト長 |
| `pos` / `pos_ja` | `pos` | C++ では英語／日本語ラベル、C では安定した `SUZUME_POS_*` コード |
| `conj_type` | `conjugation_type` | C++ では日本語ラベル、C では安定した数値コード |
| `conj_form` | `conjugation_form` | C++ では日本語ラベル、C では安定した数値コード |
| `extended_pos` | `extended_pos` | C++ では安定したラベル、C では安定した数値コード |
| `start`, `end` | `start`, `end` | 正規化済みテキスト上の文字範囲 |
| `score` | `score` | 解析スコア |
| bool フィールド | `flags` | C++ では個別の bool、C ではビットフィールド |

C の文字列と配列は、それを含む結果から借用したものです。`normalized_text`、`surface`、`base_form` には U+0000 が含まれ得るため、`strlen()` ではなく明示されたサイズを使ってください。

`flags` のビットは次のとおりです。

| ビット | C++ フィールド／意味 |
|--------|----------------------|
| `SUZUME_MORPHEME_USER_DICT` | `is_user_dict` |
| `SUZUME_MORPHEME_FORMAL_NOUN` | `is_formal_noun` |
| `SUZUME_MORPHEME_LOW_INFO` | `is_low_info` |
| `SUZUME_MORPHEME_UNKNOWN` | `is_unknown` |
| `SUZUME_MORPHEME_FROM_DICTIONARY` | `is_from_dictionary` |
| `SUZUME_MORPHEME_CONJUGATABLE` | 活用フィールドが有効 |

## モードとオプション

C++ のモードは `Mode::Normal`、`Mode::Search`、`Mode::Split` です。C では `SUZUME_MODE_NORMAL`、`SUZUME_MODE_SEARCH`、`SUZUME_MODE_SPLIT` が対応します。

```cpp
suzume::Options options;
options.mode = suzume::Mode::Search;
options.merge_compounds = true;

suzume::Tokenizer tokenizer(options);
tokenizer.setMode(suzume::Mode::Split);
const suzume::Mode current = tokenizer.mode();
```

C のアクセサーは `suzume_set_mode()` と `suzume_mode()` です。無効なハンドルを渡した `suzume_mode()` は `SUZUME_MODE_INVALID` を返します。

| C++ `Options` / C フィールド | 既定値 | 意味 |
|------------------------------|--------|------|
| `preserve_vu` | `true` | 正規化時に ヴ を保持 |
| `preserve_case` | `true` | ASCII の大文字／小文字を保持 |
| `preserve_symbols` | `false` | 句読点などの `SYMBOL` を保持。内容を持つ記号と絵文字は設定にかかわらず `OTHER` として保持 |
| `mode` | Normal | 解析モード |
| `lemmatize` | `true` | 修正済み原形を適用 |
| `merge_compounds` | `false` | 連続する複合名詞を結合 |
| `skip_user_dictionary` | `false` | 同梱ユーザー辞書の自動読み込みを省略 |
| `skip_core_dictionary` | `false` | コア辞書の自動読み込みを省略 |
| `skip_env_config` | `false` | ネイティブのスコアラー環境変数を無視 |
| `report_scorer_config` | `false` | スコアラー設定を辞書警告へ追加 |
| `scorer_options_json` | 空 / NULL | JSON 形式のスコアラー上書き設定 |
| `data_directory` | 空 / NULL | 排他的に使う辞書ディレクトリ。空なら通常の探索先を使用 |

通貨・単位記号、矢印、技術記号、絵文字は、既定のオプションでも `OTHER` として残ります。`preserve_symbols` が制御するのは、`。` など句読点系の `SYMBOL` トークンです。

C では構造体を初期化してからフィールドを変更します。

```c
suzume_extended_options_t options;
suzume_init_extended_options(&options);
options.mode = SUZUME_MODE_SEARCH;
options.merge_compounds = 1;
suzume_t handle = suzume_create_with_extended_options(&options);
```

いくつかの既定値が真なので、初期化を省略しないでください。`suzume_extended_options_t` の文字列ポインターは、`suzume_create_with_extended_options()` の呼び出し中だけ借用されます。

## タグ生成

`Tag` は `tag` と英語の `pos` ラベルを持ちます。C の `suzume_tags_t` は、並行する `tags` 配列と数値 `pos` 配列を返します。

```cpp
suzume::TagOptions options;
options.pos_filter =
    SUZUME_TAG_POS_NOUN | SUZUME_TAG_POS_PARTICLE;
options.exclude_particles = false;
options.max_tags = 10;

const auto tags =
    tokenizer.generateTags("東京都の天気予報を確認する", options);
```

| `TagOptions` / C フィールド | 既定値 | 意味 |
|-----------------------------|--------|------|
| `pos_filter` | `0` | `SUZUME_TAG_POS_*` ビットマスク。0 はフィルター可能な全品詞 |
| `exclude_basic` | `false` | 原形がひらがなのみの基本語を除外 |
| `use_lemma` | `true` | 表層形ではなく原形からタグを生成 |
| `min_length` | `2` | 最小文字数 |
| `max_tags` | `0` | 最大タグ数。0 は無制限 |
| `exclude_particles` | `true` | 助詞を除外 |
| `exclude_auxiliaries` | `true` | 助動詞を除外 |
| `exclude_formal_nouns` | `true` | 形式名詞を除外 |
| `exclude_low_info` | `true` | 情報量の低い語を除外 |
| `remove_duplicates` | `true` | 重複タグを除去 |

フィルタービットは `SUZUME_TAG_POS_NOUN`、`SUZUME_TAG_POS_VERB`、`SUZUME_TAG_POS_ADJECTIVE`、`SUZUME_TAG_POS_ADVERB`、`SUZUME_TAG_POS_PARTICLE`、`SUZUME_TAG_POS_AUXILIARY` です。フィルタービットは `exclude_*` を上書きしません。助詞や助動詞を含める場合は `exclude_particles` または `exclude_auxiliaries` も false にしてください。

C では `suzume_init_tag_options()` を呼んでからフィールドを変更し、`suzume_generate_tags_with_options()` または対応する `_n` 関数へ渡します。

## ラベル、エラー、辞書

C ABI は安定した数値コードを使います。次の関数は静的ラベルを返します。解放しないでください。

- `suzume_pos_label()`
- `suzume_extended_pos_label()`
- `suzume_conjugation_type_label()`
- `suzume_conjugation_form_label()`

失敗は NULL、0、または偽相当のコードで通知されます。直後に `suzume_last_error()` と `suzume_last_error_code()` を読んでください。メッセージはスレッドローカルの借用文字列で、後続の C API 呼び出しが消去または置換すると無効になります。安定したコードには `SUZUME_ERROR_SUCCESS` のほか、不正 UTF-8、辞書、ファイル、解析、メモリ不足、不正入力、内部エラーがあります。C++ では `Tokenizer::lastError()` と `Tokenizer::lastErrorCode()` が同じ情報を返します。

ユーザー辞書 API は追加式です。

| C++ | C | 用途 |
|-----|---|------|
| `loadUserDictionary()` | `suzume_load_user_dict()` | UTF-8 TSV または旧3列 CSV のバイト列を読み込み |
| `loadUserDictionaryCount()` | `suzume_load_user_dict_count()` | ソース辞書を読み込み、登録件数を返す |
| `loadBinaryDictionary()` | `suzume_load_binary_dict()` | コンパイル済み `.dic` をメモリから読み込み |
| `clearUserDictionaries()` | `suzume_clear_user_dictionaries()` | 呼び出し側が追加した辞書を削除。同梱ユーザー辞書は保持 |
| `hasCoreDictionary()` | `suzume_has_core_dictionary()` | L2 コア辞書が読み込まれているか確認 |
| `dictionaryWarnings()` | `suzume_dictionary_warning_count()`, `suzume_dictionary_warning()` | 読み込み、解析、スコアラーの診断を取得 |

現在の TSV 行は `surface<TAB>POS[<TAB>conj_type][<TAB>lemma]` 形式です。

```cpp
const std::size_t loaded =
    tokenizer.loadUserDictionaryCount("東京スカイツリー\tNOUN\n");
if (loaded == 0 &&
    suzume::Tokenizer::lastErrorCode() != SUZUME_ERROR_SUCCESS) {
  // 読み込み失敗。
}
```

件数が0というだけでは失敗と判定できません。エラーコードも確認してください。バイナリ辞書の読み込みに失敗しても、そのハンドルに読み込み済みの辞書は保持されます。`suzume_dictionary_warning()` の返す借用ポインターは、同じスレッドで次の警告を取得するか、ハンドルを破棄するまで有効です。

リンク中のライブラリのバージョンは、C++ では `suzume::Tokenizer::version()`、C では `suzume_version()` から取得できます。どちらもライブラリの SemVer 文字列を返します。

## 所有権とメモリ確保失敗

NULL でない `suzume_result_t*` は、必ず `suzume_result_free()` でちょうど1回解放してください。配列と文字列も同時に無効になります。`suzume_tags_t*` と `suzume_tags_free()` にも同じ規則が適用されます。各ハンドルは `suzume_destroy()` で破棄します。3つの解放／破棄関数は NULL を受け取れます。

C++ 例外が C ABI を越えることはありません。例外を有効にしたネイティブビルドでは、メモリ確保失敗を所定の失敗戻り値と `SUZUME_ERROR_OUT_OF_MEMORY` に変換します。WASM パッケージを含む `-fno-exceptions` ビルドはメモリ確保失敗から回復できず、処理を終了します。C++ ラッパーは成功した C の結果を標準ライブラリの所有コンテナーへコピーするため、そのメモリ確保が `std::bad_alloc` を投げる場合があります。

## ABI 互換性

現在の C ABI リビジョンは1です。

```c
if (suzume_abi_version() != SUZUME_ABI_VERSION) {
  /* 続行前に、ヘッダーとライブラリを揃えて再コンパイルまたは再配置する。 */
  return 1;
}
```

ヘッダーと、リンクまたは動的読み込みするライブラリを別々に取得する場合は、ライブラリが返した構造体を使う前にこの比較を行ってください。不一致ならサイズやフィールドオフセットを信用できません。配置済みライブラリのヘッダーでコンシューマーを再コンパイルするか、ヘッダーに合うライブラリを配置してください。シンボルの削除やシグネチャ変更はリンク時またはロード時にも失敗します。

`suzume_sizeof_*()` と `suzume_offsetof_*()` は、バインディング生成と ABI テストがライブラリ側の構造体レイアウトを調べるためのオラクルです。ABI リビジョン比較の代わりにはなりません。

インストール済みの CMake パッケージと pkg-config メタデータを使うと、通常は同じプレフィックスのヘッダーとライブラリを参照できます。

```cmake
find_package(suzume CONFIG REQUIRED)

target_link_libraries(myapp PRIVATE suzume::suzume)          # 静的
# target_link_libraries(myapp PRIVATE suzume::suzume_shared) # ビルド済みなら共有
```

静的アーカイブへリンクする C 実行ファイルは C++ リンカードライバーを使います。

```cmake
set_target_properties(myapp PROPERTIES LINKER_LANGUAGE CXX)
```

pkg-config の例:

```bash
cc -c myapp.c $(pkg-config --cflags suzume) -o myapp.o
c++ myapp.o $(pkg-config --libs suzume) -o myapp
```

実行可能な C / C++ プログラムと、単独の `find_package` コンシューマーは [`examples/`](https://github.com/libraz/suzume/tree/main/examples) にあります。

## 辞書の組み込み

`-DSUZUME_EMBED_DICT=ON` で設定するか、簡易ターゲットを使います。

```bash
make embedded
```

`core.dic` と `user.dic` が静的ライブラリへ埋め込まれ、辞書ファイルの探索を行わなくなります。スコアラー設定は `SUZUME_SCORER_CONFIG` を読み得るため、環境変数で指定されたファイルも参照させない場合は `Options::skip_env_config = true`（または同名の C オプションフィールド）を指定します。C++ ランタイムとヒープを持つホスト型組み込み／RTOS で利用できます。freestanding のベアメタルは対象外です。

## スレッド安全性

ハンドルは可変な解析状態を持ちます。1つのハンドルで解析やタグ生成を並行実行しないでください。スレッドごとに `Tokenizer` または `suzume_t` を1つ使うか、アクセスを直列化します。異なるハンドルは並行して使えます。

## 関連ページ

- [API リファレンス](/ja/docs/api) — 品詞と `extendedPos` の値。
- [ネイティブビルド](/ja/docs/native-build) — ソースビルドのオプション。
- [はじめに](/ja/docs/getting-started) — その他のバインディング。
