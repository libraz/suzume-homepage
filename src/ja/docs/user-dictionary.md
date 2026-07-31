# ユーザー辞書

ドメイン固有の語を 1 トークンとして扱いたい場合や、品詞を明示したい場合にユーザー辞書を使います。

## ソース形式

ソース形式はタブ区切りのテキストです。

```text
surface<TAB>POS[<TAB>conj_type][<TAB>lemma]
```

| フィールド | 必須 | 説明 |
|-------------|------|------|
| `surface` | はい | 辞書が照合する表層形 |
| `POS` | はい | 品詞 |
| `conj_type` | いいえ | 活用または固有名詞の種別 |
| `lemma` | いいえ | 基本形。`lemma` だけを指定するときは `conj_type` を空欄にする |

次の例には、名詞、活用形を展開する動詞、基本形を明示した動詞の表層形が含まれています。

```tsv
東京公園	NOUN
点検する	VERB	SURU
点検した	VERB		点検する
```

フィールドの間には実際のタブ文字を入れてください。区切り文字は最初のデータ行から決まるため、1 回の読み込みに TSV 行と CSV 行を混在させないでください。空行と、空白を除いた先頭文字が `#` の行は無視されます。

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

活用型や詳しい文法上の分類を示すには `conj_type` を指定します。表層形と活用型が適合する動詞とイ形容詞では、基本形から活用エントリを生成します。

| 値 | 用途 |
|----|------|
| `ICHIDAN` | 一段動詞 |
| `GODAN_KA`, `GODAN_GA`, `GODAN_SA`, `GODAN_TA` | 対応する行の五段動詞 |
| `GODAN_NA`, `GODAN_BA`, `GODAN_MA`, `GODAN_RA`, `GODAN_WA` | 対応する行の五段動詞 |
| `SURU`, `KURU` | 不規則動詞 |
| `I_ADJ`, `NA_ADJ` | イ形容詞またはナ形容詞 |
| `INTJ` | 感動詞マーカー |
| `FAMILY`, `GIVEN` | 姓または名のマーカー |

`conj_type` は大文字と小文字を区別します。動詞またはイ形容詞に適合するマーカーを付けると、実行時辞書へ活用形が展開されます。このため、展開後エントリ数はソース行数より多くなることがあります。

### 従来の CSV との互換性

従来の 3 列 CSV 形式も引き続き受け付けます。

```csv
東京公園,NOUN,5000
```

3 列目は互換性のために残されたコスト列です。Suzume はこの値を無視するため、照合の優先度は変わりません。新しい辞書は TSV で作り、活用形を展開する場合は `conj_type` を指定してください。

## 実行時の読み込み

読み込みに成功するたび、同じ解析器へソース辞書またはバイナリ辞書が追加されます。ネイティブ CLI は、繰り返し指定できる各 `--dict` 引数を、そのコマンドで使う解析器へ適用します。

::: code-group

```typescript [Node]
import { Suzume } from '@libraz/suzume'

const suzume = await Suzume.create()
const source = '東京公園\tNOUN\n点検する\tVERB\tSURU\n'

const expandedCount = suzume.loadUserDictionaryCount(source)
if (expandedCount === 0) {
  throw new Error(suzume.lastError)
}
```

```python [Python]
from suzume import Suzume

source = "東京公園\tNOUN\n点検する\tVERB\tSURU\n"

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

	source := []byte("東京公園\tNOUN\n点検する\tVERB\tSURU\n")
	if err := analyzer.LoadUserDictionary(source); err != nil {
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
      tokenizer.loadUserDictionaryCount("東京公園\tNOUN\n点検する\tVERB\tSURU\n");
  return expanded_count == 0 ? 1 : 0;
}
```

```bash [Native CLI]
# user.tsv には上と同じタブ区切りの行が入っている。
# --dict は繰り返し指定でき、コンパイル済みの .dic も受け付ける。
suzume-cli analyze --dict user.tsv "東京公園を点検する"
```

:::

現在の Go バインディングの `LoadUserDictionary([]byte) error` API は成否を返しますが、展開後エントリ数は返しません。`ClearUserDictionaries` メソッドもありません。C ABI にある操作を Go バインディングでも使えると解釈しないでください。

### 戻り値とエラー

| インターフェース | ソース辞書の結果 | 失敗時の詳細 |
|------------------|------------------|--------------|
| Node | `loadUserDictionary()` は `boolean`、`loadUserDictionaryCount()` は展開後エントリ数を返す | `lastError` / `lastErrorCode` を読むか、`loadUserDictionaryOrThrow()` を使う |
| Python | `load_user_dict()` は展開後エントリ数を返す | `SuzumeError` を送出 |
| Go | `LoadUserDictionary()` は `error` を返す | 取得できる場合はネイティブ側のメッセージを戻り値のエラーに含む |
| C++ | `loadUserDictionary()` は `bool`、`loadUserDictionaryCount()` は展開後エントリ数を返す | `Tokenizer::lastError()` / `lastErrorCode()` を読む |
| C ABI | `suzume_load_user_dict()` は `1` または `0`、`suzume_load_user_dict_count()` は展開後エントリ数を返す | `suzume_last_error()` / `suzume_last_error_code()` を読む |
| ネイティブ CLI | 辞書を読み込めない場合は 0 以外で終了 | 標準エラーへ読み込みエラーを出力 |

件数を返す API は失敗時に `0` を返します。ソースの読み込みに成功した場合は、必ず 1 件以上のエントリが追加されます。件数はソース行数ではなく、活用形の展開と重複除去を終えた後に数えます。

ソース辞書またはバイナリ辞書の読み込みに失敗しても、解析器へ追加済みの辞書は削除も置換もされません。ソースファイルの先頭にある妥当な行だけが追加されることもありません。成功した読み込みは、明示的に消去するか解析器を破棄するまで加算されます。

### 警告と一部だけ妥当な入力

実行時のソース読み込みでは、フィールドが 2 個未満のレコードをスキップします。別の行が妥当なら、その行は追加され、スキップした行は警告として記録されます。

```text
missing-pos
東京公園	NOUN
```

実行時読み込みの警告は解析器の辞書警告一覧へ追加されます。Node では `dictionaryWarnings`、Python では `dictionary_warnings`、Go では `DictionaryWarnings()`、C++ では `Tokenizer::dictionaryWarnings()`、C では `suzume_dictionary_warning_*` 関数で取得できます。`clearUserDictionaries()` と各言語の対応 API は実行時読み込みの警告を消去しますが、構築時の警告は残します。ネイティブ CLI は現在、`--dict` のソースファイルを処理するときに追加された警告を表示しません。

すべてのデータ行がスキップされた場合は、読み込めるエントリがないため失敗します。未知の品詞、必須フィールドの空欄、不正な UTF-8、従来 CSV の不正なクォート、想定外の空でない列がある場合も、読み込み全体が失敗します。

## 呼び出し元が読み込んだ辞書の消去

消去すると、その解析器へ明示的に読み込んだソース辞書とバイナリ辞書がすべて削除されます。

| インターフェース | 消去操作 |
|------------------|----------|
| Node | `suzume.clearUserDictionaries()` |
| Python | `suzume.clear_user_dictionaries()` |
| Go | 現在のバインディングでは公開されていない |
| C++ | `tokenizer.clearUserDictionaries()` |
| C ABI | `suzume_clear_user_dictionaries(handle)` |
| ネイティブ CLI | 永続する解析器がないため消去操作もない。辞書は 1 回の実行中だけ有効 |

自動読み込みされたバンドル済みユーザー辞書は残ります。組み込み辞書とコア辞書にも影響しません。

## 辞書との一致を確認する

解析結果の各形態素は、Node では `isUserDict`、Python と C++ では `is_user_dict`、Go では `IsUserDict`、C では `SUZUME_MORPHEME_USER_DICT` フラグを持ちます。選択されたトークンがユーザー辞書に由来する場合は真になります。バンドル済みユーザー辞書との一致も含まれます。

## バイナリ辞書

起動時間を短くしたい場合や、同じ辞書を繰り返し読み込む場合は、ソース TSV をコンパイルします。

```bash
suzume-cli dict compile user.tsv   # user.dic を書き出す
```

Node と C++ では `loadBinaryDictionary()`、Python では `load_binary_dict()`、Go では `LoadBinaryDictionary()`、C では `suzume_load_binary_dict()` に `.dic` のバイト列を渡します。ネイティブ CLI は `--dict` で `.dic` のパスを受け付けます。

バイナリ辞書も追加で読み込まれ、失敗時は追加済みの辞書を維持します。現在の `.dic` 形式はバージョン 4 です。Suzume は別のバイナリ形式版を拒否するため、TSV ソースを保管し、必要になったときに現在の CLI で再コンパイルしてください。

ファイルは 16 バイトの `SZMD` ヘッダー、前方差分で圧縮した表層形テーブル、文法パレット、可変長のエントリ配列、省略可能な重複除去済み基本形テーブルで構成されます。同じ表層形に異なる文法エントリを保持できます。

## 永続化

呼び出し元が読み込んだ辞書は解析器のインスタンス内にあり、解析器を破棄すると失われます。アプリケーション側で TSV ソースまたはコンパイル済み `.dic` を保存し、新しい解析器ごとに読み込んでください。

## 推奨事項

1. 実際のタブ文字を使った現行 TSV で作成する。
2. 現在の分割または品詞を修正したい語だけを追加する。
3. 活用形が必要な動詞と形容詞には `conj_type` を指定する。
4. 読み込みごとに展開後エントリ数または各バインディングのエラーを確認する。
5. 代表的な文を解析し、ユーザー辞書フラグを確認する。

## 関連ページ

- [API リファレンス](/ja/docs/api) — 辞書メソッド、エラー、警告、形態素のフィールド。
- [C / C++ ライブラリ](/ja/docs/cpp) — C++ ラッパーと安定した C ABI。
- [Python API](/ja/docs/python) — Python の戻り値と例外。
- [Go バインディング](/ja/docs/go) — cgo API。
- [ネイティブ CLI](/ja/docs/cli) — 辞書ファイルのコンパイル、確認、読み込み。
