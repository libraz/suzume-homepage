---
title: "ユーザー辞書で独自の単語を追加する"
description: "専門用語を 1 トークンのまま扱う、品詞や原形を指定する、といった調整をユーザー辞書で行います。TSV の書き方、実行時の読み込み、バイナリ辞書へのコンパイルを説明します。"
---

# ユーザー辞書

ドメイン固有の語を 1 トークンとして扱いたい場合や、品詞や[原形](/ja/docs/glossary#lemma)を明示したい場合に[ユーザー辞書](/ja/docs/glossary#user-dictionary)を使います。

## クイックスタート

辞書がない状態では、`量子もつれ` は 2 つのトークンに分かれます。TSV を 1 行登録すると 1 トークンになります。

```typescript
import { Suzume } from '@libraz/suzume'

const suzume = await Suzume.create()
const show = () => suzume.analyze('量子もつれを観測した').map((m) => m.surface).join(' | ')

console.log(show()) // 量子 | もつれ | を | 観測 | し | た
suzume.loadUserDictionary('量子もつれ\tNOUN\n')
console.log(show()) // 量子もつれ | を | 観測 | し | た
suzume.destroy()
```

下のデモで自分の行を試せます。同じテキストを、辞書なしと辞書ありで解析して並べます。

<UserDictDemo />

## ソース形式

ソース形式はタブ区切りのテキストです。

```text
surface<TAB>POS[<TAB>conj_type][<TAB>lemma]
```

| フィールド | 必須 | 説明 |
|-------------|------|------|
| `surface` | はい | 辞書が照合する表層形 |
| `POS` | はい | [品詞](/ja/docs/glossary#pos) |
| `conj_type` | いいえ | [活用型](/ja/docs/glossary#conjugation-type)または固有名詞の種別 |
| `lemma` | いいえ | 原形。`lemma` だけを指定するときは `conj_type` を空欄にする |

次の例は、名詞、活用形を展開する動詞、原形を明示した名詞を 1 行ずつ登録します。

```tsv
量子もつれ	NOUN
もふる	VERB	GODAN_RA
スマホ	NOUN		スマートフォン
```

各行を登録すると、文の解析結果が次のように変わります。

| 行 | 文 | 行なし | 行あり |
|----|----|--------|--------|
| `量子もつれ` `NOUN` | 量子もつれを観測した | 量子 / もつれ / を / 観測 / し / た | 量子もつれ / を / 観測 / し / た |
| `もふる` `VERB` `GODAN_RA` | 猫をもふった | 猫 / を / も / ふっ / た | 猫 / を / もふっ / た（`もふっ` の原形は `もふる`） |
| `スマホ` `NOUN`（原形 `スマートフォン`） | スマホを買った | `スマホ` の原形は `スマホ` | `スマホ` の原形は `スマートフォン` |

フィールドの間には実際のタブ文字を入れてください。区切り文字は最初のデータ行から決まるため、1 回の読み込みに TSV 行と CSV 行を混在させないでください。空行と、空白を除いた先頭文字が `#` の行は無視されます。

フィールドの長さは UTF-8 エンコード後のバイト数で数えます。指定できる文字数はテキストによって異なります。

| フィールド | 実行時にソースから読み込む場合 | `.dic` ファイルにコンパイルする場合 |
|------------|--------------------------------|-------------------------------------|
| `surface` | 最大 255 バイト | 最大 255 バイト |
| `lemma` | バイト数の制限なし | 最大 255 バイト。超える原形は `dict compile` が拒否する |

### 品詞の値

| 値 | 説明 | 日本語の別名 |
|----|------|--------------|
| `NOUN` | 名詞 | `名詞` |
| `VERB` | 動詞 | `動詞` |
| `ADJ` | 形容詞 | `形容詞` |
| `ADV` | 副詞 | `副詞` |
| `PARTICLE` | 助詞 | `助詞` |
| `AUX` | 助動詞 | `助動詞` |
| `CONJ` | 接続詞 | `接続詞` |
| `DET` | 連体詞 | `連体詞` |
| `PRON` | 代名詞 | `代名詞` |
| `PREFIX` | 接頭辞 | `接頭辞` |
| `SUFFIX` | 接尾辞 | `接尾辞` |
| `INTJ` | 感動詞 | `感動詞` |
| `SYMBOL` | 記号 | `記号` |
| `OTHER` | その他または句 | `その他` |

パーサーは英語の長い別名として `ADJECTIVE`、`ADVERB`、`AUXILIARY`、`CONJUNCTION`、`DETERMINER`、`PRONOUN`、`INTERJECTION`、`SYM` も受け付けます。`PROPN` と `PROPER_NOUN` は、固有名詞に分類された名詞を作ります。

::: tip 閉じたクラスのエントリ
`PARTICLE` と `AUX` は受け付けますが、各行について警告が追加されます。文法的な助詞と助動詞は通常、ユーザー辞書ではなく Suzume の組み込み L1 規則に属します。
:::

### 活用型

活用型や詳しい文法上の分類を示すには `conj_type` を指定します。表層形と活用型が適合する動詞とイ形容詞では、原形から活用エントリを生成します。

| 値 | 用途 |
|----|------|
| `ICHIDAN` | 一段動詞 |
| `GODAN_KA`, `GODAN_GA`, `GODAN_SA`, `GODAN_TA` | 対応する行の五段動詞 |
| `GODAN_NA`, `GODAN_BA`, `GODAN_MA`, `GODAN_RA`, `GODAN_WA` | 対応する行の五段動詞 |
| `SURU`, `KURU` | 不規則動詞 |
| `I_ADJ`, `NA_ADJ` | イ形容詞またはナ形容詞 |
| `INTJ` | 感動詞マーカー |
| `FAMILY`, `GIVEN` | 姓または名のマーカー |

`conj_type` は大文字と小文字を区別します。動詞またはイ形容詞に適合するマーカーを付けると活用形に展開され、活用形ごとに実行時のエントリが 1 つずつ追加されます。

<DiagramConjExpansion />

3 列目がマーカーでも数値でもない場合、その値は原形として読み込まれます。`suru` のように小文字で書いたり綴りを誤ったりしたマーカーは、警告なしに原形として扱われ、活用形は展開されません。

::: tip conj_type の選び方
辞書形から種類を判断します。動詞の区別は [五段と一段](/ja/docs/glossary#godan-ichidan) を参照してください。

| エントリ | `POS` | `conj_type` | 種類 |
|----------|-------|-------------|------|
| 食べる | `VERB` | `ICHIDAN` | 一段動詞（食べない、食べます） |
| 書く | `VERB` | `GODAN_KA` | く で終わる五段動詞（書かない、書きます） |
| 話す | `VERB` | `GODAN_SA` | す で終わる五段動詞（話さない、話します） |
| 点検する | `VERB` | `SURU` | 名詞＋する |
| 高い | `ADJ` | `I_ADJ` | イ形容詞（高くない） |
| 静か | `ADJ` | `NA_ADJ` | ナ形容詞（静かな） |

選択を誤っても、エラーも警告も出ません。行は読み込まれますが、誤った活用形に展開されます。上の図の `ICHIDAN` の行がその例です。読み込んだ後は活用した文を解析し、[ユーザー辞書フラグ](#辞書との一致を確認する)を確認してください。
:::

### 従来の CSV との互換性

従来の 3 列 CSV 形式も引き続き受け付けます。

```csv
量子もつれ,NOUN,5000
```

3 列目は互換性のために残されたコスト列です。Suzume はこの値を無視するため、照合の優先度は変わりません。新しい辞書は TSV で作り、活用形を展開する場合は `conj_type` を指定してください。

## 実行時の読み込み

読み込みに成功するたび、同じインスタンスへソース辞書またはバイナリ辞書が追加されます。CLI は、繰り返し指定できる各 `--dict` 引数を、そのコマンドで使うインスタンスへ適用します。

::: code-group

```typescript [JavaScript]
import { Suzume } from '@libraz/suzume'

const suzume = await Suzume.create()
const source = '量子もつれ\tNOUN\nもふる\tVERB\tGODAN_RA\n'

try {
  const expandedCount = suzume.loadUserDictionaryCount(source)
  if (expandedCount === 0) {
    throw new Error(suzume.lastError)
  }
} finally {
  suzume.destroy()
}
```

```python [Python]
from suzume import Suzume

source = "量子もつれ\tNOUN\nもふる\tVERB\tGODAN_RA\n"

with Suzume() as suzume:
    expanded_count = suzume.load_user_dict(source)
```

```go [Go]
package main

import (
	"log"

	"github.com/libraz/go-suzume"
)

func main() {
	analyzer, err := suzume.New()
	if err != nil {
		log.Fatal(err)
	}
	defer analyzer.Close()

	source := []byte("量子もつれ\tNOUN\nもふる\tVERB\tGODAN_RA\n")
	if _, err := analyzer.LoadUserDictionaryCount(source); err != nil {
		log.Fatal(err)
	}
}
```

```cpp [C++]
#include "suzume/suzume.hpp"

#include <cstddef>

int main() {
  suzume::Tokenizer tokenizer;
  const std::size_t expanded_count =
      tokenizer.loadUserDictionaryCount("量子もつれ\tNOUN\nもふる\tVERB\tGODAN_RA\n");
  return expanded_count == 0 ? 1 : 0;
}
```

```c [C]
#include "suzume/suzume_c.h"
#include <string.h>

int main(void) {
  suzume_t tokenizer = suzume_create();
  if (!tokenizer) return 1;
  const char* source = "量子もつれ\tNOUN\nもふる\tVERB\tGODAN_RA\n";
  const size_t expanded_count =
      suzume_load_user_dict_count(tokenizer, source, strlen(source));
  suzume_destroy(tokenizer);
  return expanded_count == 0 ? 1 : 0;
}
```

```bash [CLI]
# user.tsv には上と同じタブ区切りの行が入っている。
# --dict は繰り返し指定でき、コンパイル済みの .dic も受け付ける。
suzume --dict user.tsv "量子もつれを観測した"                 # Python ホイール
suzume-cli analyze --dict user.tsv "量子もつれを観測した"     # ネイティブ CLI
```

:::

### 戻り値とエラー

| バインディング | ソース辞書の結果 | 失敗時の詳細 |
|----------------|------------------|--------------|
| JavaScript | `loadUserDictionary()` は `boolean`、`loadUserDictionaryCount()` は展開後エントリ数を返す | `lastError` / `lastErrorCode` を読むか、`loadUserDictionaryOrThrow()` を使う |
| Python | `load_user_dict()` は展開後エントリ数を返す | `SuzumeError` を送出 |
| Go | `LoadUserDictionary()` は `error`、`LoadUserDictionaryCount()` は `(int, error)` を返す | 取得できる場合はネイティブ側のメッセージを戻り値のエラーに含む |
| C++ | `loadUserDictionary()` は `bool`、`loadUserDictionaryCount()` は展開後エントリ数を返す | `Tokenizer::lastError()` / `lastErrorCode()` を読む |
| C ABI | `suzume_load_user_dict()` は `1` または `0`、`suzume_load_user_dict_count()` は展開後エントリ数を返す | `suzume_last_error()` / `suzume_last_error_code()` を読む |
| CLI | 辞書を読み込めない場合は 0 以外で終了 | 標準エラーへ読み込みエラーを出力 |

件数を返す API は失敗時に `0` を返します。ソースの読み込みに成功した場合は、必ず 1 件以上のエントリが追加されます。件数はソース行数ではなく、活用形の展開と重複除去を終えた後に数えます。

ソース辞書またはバイナリ辞書の読み込みに失敗しても、インスタンスへ追加済みの辞書は削除も置換もされません。ソースファイルの先頭にある妥当な行だけが追加されることもありません。成功した読み込みは、明示的に消去するかインスタンスを破棄するまで加算されます。

### 警告と一部だけ妥当な入力

実行時のソース読み込みでは、フィールドが 2 個未満のレコードをスキップします。別の行が妥当なら、その行は追加され、スキップした行は警告として記録されます。

```text
missing-pos
量子もつれ	NOUN
```

レコードは解析できても、登録時に拒否される場合があります。たとえば表層形が 255 バイトを超える場合です。別の展開エントリを 1 件以上登録できれば、該当エントリを警告付きでスキップして読み込みを続けます。展開エントリがすべて拒否されると読み込みは失敗します。不正な UTF-8 は解析エラーなので、読み込み全体が失敗します。

実行時読み込みの警告は、インスタンスの辞書警告一覧へ追加されます。

| バインディング | 警告の取得 |
|----------------|------------|
| JavaScript | `dictionaryWarnings` |
| Python | `dictionary_warnings` |
| Go | `DictionaryWarnings()` |
| C++ | `Tokenizer::dictionaryWarnings()` |
| C ABI | `suzume_dictionary_warning_count()` と `suzume_dictionary_warning()` |
| ネイティブ CLI | `--dict` のソースファイルで追加された警告は表示しない |

`clearUserDictionaries()` と各言語の対応 API は実行時読み込みの警告を消去しますが、構築時の警告は残します。

すべてのデータ行がスキップされた場合は、読み込めるエントリがないため失敗します。未知の品詞、必須フィールドの空欄、不正な UTF-8、従来 CSV の不正なクォートがある場合も、読み込み全体が失敗します。TSV に想定外の空でない列がある場合も全体を拒否しますが、従来 CSV では 5 列目以降を無視します。

## 辞書レイヤー {#dictionary-layers}

<DiagramDictionaryLayers />

どの位置でも 4 つのレイヤーすべてを参照し、あるレイヤーが別のレイヤーのエントリを隠すことはありません。組み込み辞書は常にあり、`core.dic` と `user.dic` はインスタンスの生成時に自動で読み込みます。呼び出し側の辞書は [実行時の読み込み](#実行時の読み込み) の各 API で加わり、消去するかインスタンスを破棄するまで残ります。バンドル済みユーザー辞書と呼び出し側で読み込んだ辞書のエントリにはスコアの優遇があるため、ユーザー辞書の行は置き換え前の分割より選ばれやすくなります。

2 つのユーザー辞書レイヤーに由来するトークンは、どちらも[ユーザー辞書フラグ](#辞書との一致を確認する)を持ちます。npm パッケージ、PyPI ホイール、Go バインディングは `core.dic` と `user.dic` を埋め込むか同梱しているため、準備は要りません。

スキップオプションが効くのはインスタンスの作成時だけです。消去すると、そのインスタンスで読み込んだソース辞書とバイナリ辞書がすべて削除され、ほかの 3 つのレイヤーは残ります。

| バインディング | `core.dic` をスキップ | バンドル済み `user.dic` をスキップ | 呼び出し側で読み込んだ辞書を消去 |
|----------------|-----------------------|------------------------------------|----------------------------------|
| JavaScript | `skipCoreDictionary: true` | `skipUserDictionary: true` | `clearUserDictionaries()` |
| Python | `skip_core_dictionary=True` | `skip_user_dictionary=True` | `clear_user_dictionaries()` |
| Go | `ExtendedOptions.SkipCoreDictionary` | `ExtendedOptions.SkipUserDictionary` | `ClearUserDictionaries()`（`error` を返す） |
| C++ | `Options::skip_core_dictionary` | `Options::skip_user_dictionary` | `clearUserDictionaries()` |
| C ABI | `suzume_extended_options_t` の `skip_core_dictionary` | `suzume_extended_options_t` の `skip_user_dictionary` | `suzume_clear_user_dictionaries(handle)` |
| CLI | `--no-core-dict` | `--no-user-dict` | 不要。辞書は 1 回の実行中だけ有効 |

`--no-user-dict` がスキップするのはバンドル済みの `user.dic` だけです。`--dict` で渡したファイルは読み込まれます。

## 辞書との一致を確認する

各トークンは、ユーザー辞書に由来するかどうかを示すフラグを持ちます。バンドル済みユーザー辞書との一致も含みます。

| バインディング | フラグ |
|----------------|--------|
| JavaScript | `isUserDict` |
| Python | `is_user_dict` |
| Go | `IsUserDict` |
| C++ | `is_user_dict` |
| C ABI | `SUZUME_MORPHEME_USER_DICT` フラグ |

## バイナリ辞書 {#binary-dictionaries}

起動時間を短くしたい場合や、同じ辞書を繰り返し読み込む場合は、ソース TSV をコンパイルします。コンパイルにはネイティブの [`suzume-cli`](/ja/docs/installation#suzume-cli) が必要です。npm パッケージと PyPI ホイールには含まれていません。

```bash
suzume-cli dict compile user.tsv   # user.dic を書き出す
```

<DiagramBinaryDictFlow />

C ABI では `suzume_load_binary_dict()` で同じバイト列を読み込みます。コンパイラとファイル構造は [ネイティブ CLI リファレンスの `dict`](/ja/docs/cli#dict) を参照してください。

## 永続化

呼び出し側で読み込んだ辞書はインスタンス内にあり、インスタンスを破棄すると失われます。アプリケーション側で TSV ソースまたはコンパイル済み `.dic` を保存し、新しいインスタンスごとに読み込んでください。

## 推奨事項

1. 実際のタブ文字を使った現行の TSV で作成します。
2. 現在の分割または品詞を修正したい語だけを追加します。
3. 活用形が必要な動詞と形容詞には `conj_type` を指定します。
4. 読み込みごとに、展開後エントリ数または各バインディングのエラーを確認します。
5. 代表的な文を解析し、ユーザー辞書フラグを確認します。

## 関連ページ

- [API リファレンス](/ja/docs/api) — 辞書メソッド、エラー、警告、トークンのフィールド。
- [C / C++ ライブラリ](/ja/docs/cpp) — C++ ラッパーと安定した C ABI。
- [Python API](/ja/docs/python) — Python の戻り値と例外。
- [Go バインディング](/ja/docs/go) — cgo API。
- [ネイティブ CLI](/ja/docs/cli) — 辞書ファイルのコンパイル、確認、読み込み。
