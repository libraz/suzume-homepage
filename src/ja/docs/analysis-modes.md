---
title: "解析モード・オフセット・正規化"
description: "normal・search・split の 3 モードの選び方、複合語の結合、各バインディングでトークンのオフセットを元の文字列に対応付ける方法、文字の正規化を説明します。"
---

# 解析モード・オフセット・正規化

このページでは、トークンの区切り方と位置情報を左右する 3 つの設定、つまり解析モード、複合語の結合、文字の正規化を説明します。あわせて、各バインディングでトークンのオフセットを元のテキストへ対応付ける方法も示します。

## モードの選び方 {#modes}

インスタンスは 3 つのモードのいずれかで動きます。モードが決めるのは[複合語](/ja/docs/glossary#compound)のトークンをどこまで長くするかで、辞書や[品詞](/ja/docs/glossary#pos)は変わりません。

<DiagramModes />

| モード | 動作 | 主な用途 |
|--------|------|----------|
| `normal`（既定） | 結合規則（文字種をまたぐ語、接頭辞＋名詞、複合動詞など）を適用し、連続する名詞は別々のトークンのまま残す | 表示、ハイライト、一般的なテキスト処理 |
| `search` | `normal` の処理に加えて、連続する名詞をまとめて 1 トークンにする | 検索インデックスのキー、タグ抽出 |
| `split` | 結合規則と名詞の結合を止め、最も細かい境界を残す | 部分一致、再現率重視のインデックス |

`split` が外すのは、結合規則が加えたはずの結合だけです。根拠のない境界を新たに作ることはできず、`東京都庁前` はどのモードでも 1 トークンのままです。そうした境界は[ユーザー辞書](/ja/docs/user-dictionary)に登録してください。

手元のテキストでモードを切り替えて確かめられます。

<TokenizerPlayground />

## 複合語の結合 {#merge-compounds}

`mergeCompounds` は連続する名詞を結合します。`search` モードが追加する処理と同じもので、既定では無効です。

| モード | `mergeCompounds: false` | `mergeCompounds: true` |
|--------|-------------------------|------------------------|
| `normal` | `取り扱い` / `説明書` / `を` / `読む` | `取り扱い説明書` / `を` / `読む` |
| `search` | `取り扱い説明書` / `を` / `読む` | `取り扱い説明書` / `を` / `読む` |
| `split` | `取り扱い` / `説明書` / `を` / `読む` | `取り扱い` / `説明書` / `を` / `読む`（無視） |

`normal` に `mergeCompounds` を付けた結果と、`search` だけを指定した結果は同じです。`split` モードではこのオプションは効きません。

## モードの指定 {#setting-the-mode}

モードは作成時に指定し、後から辞書を読み直さずに変更できます。`mergeCompounds` は作成時にしか指定できません。

| バインディング | 作成時のモード | 後からの変更 | 複合語の結合 |
|----------------|----------------|--------------|--------------|
| JavaScript | `Suzume.create({ mode })` | `suzume.mode = ...` | `mergeCompounds` |
| Python | `Suzume(mode=...)` | `analyzer.mode = ...` | `merge_compounds` |
| Go | `ExtendedOptions.Mode` | `SetMode()` | `ExtendedOptions.MergeCompounds` |
| C++ | `Options::mode` | `setMode()` | `Options::merge_compounds` |
| CLI | `--mode` | — | `--merge-compounds` |

::: code-group

```ts [JavaScript]
import { Suzume } from '@libraz/suzume'

const suzume = await Suzume.create({ mode: 'search' })
suzume.mode = 'split'

const merged = await Suzume.create({ mergeCompounds: true })
```

```python [Python]
from suzume import Mode, Suzume

with Suzume(mode=Mode.SEARCH) as analyzer:
    analyzer.mode = "split"

with Suzume(merge_compounds=True) as analyzer:
    print(analyzer.analyze("取り扱い説明書を読む"))
```

```go [Go]
opts := suzume.DefaultExtendedOptions()
opts.Mode = suzume.ModeSearch

s, err := suzume.NewWithExtendedOptions(opts)
if err != nil {
	log.Fatal(err)
}
defer s.Close()

if err := s.SetMode(suzume.ModeSplit); err != nil {
	log.Fatal(err)
}
```

```cpp [C++]
suzume::Options options;
options.mode = suzume::Mode::Search;
suzume::Tokenizer tokenizer(options);

tokenizer.setMode(suzume::Mode::Split);
```

```bash [CLI]
# Python package CLI
suzume --mode search "API開発と高層ビル群"
suzume --merge-compounds "取り扱い説明書を読む"

# Native developer CLI
suzume-cli --mode split "API開発と高層ビル群"
```

:::

Go では `DefaultExtendedOptions()` から始めてください。`ExtendedOptions` のゼロ値は、原形補正と大文字・ヴの保持をすべて無効にします。

## オフセット {#offsets}

各トークンは `start` と `end` を持ちます。どのバインディングでも単位は Unicode のコードポイントで、渡した文字列ではなく正規化後のテキスト上の位置を指します。正規化後のテキストは、トークンと一緒に返す呼び出しで取得します。

| バインディング | 正規化後のテキストを返す呼び出し | オフセットの単位 | 切り出し方 |
|----------------|----------------------------------|------------------|------------|
| JavaScript | `analyzeWithNormalizedText()` → `normalizedText` | `start`/`end` はコードポイント、`startUtf16`/`endUtf16` は UTF-16 コード単位 | `normalizedText.slice(startUtf16, endUtf16)` |
| Python | `analyze_with_normalized_text()` → `normalized_text` | コードポイント | `normalized_text[start:end]` |
| Go | `AnalyzeWithNormalizedText()` → `NormalizedText` | コードポイント | `[]rune(NormalizedText)[Start:End]` |
| C++ | `analyzeWithNormalizedText()` → `normalized_text`（UTF-8） | コードポイント | 先にバイト位置へ変換する |
| C | `suzume_analyze_n()` → `normalized_text`、`normalized_text_size` | コードポイント | 先にバイト位置へ変換する |
| CLI | `--format json` → `normalized_text` | コードポイント | — |

<DiagramOffsets />

`𠮷` のように基本多言語面の外にある文字では、コードポイントと UTF-16 の単位がずれます。`start`/`end` を `String.prototype.slice()` に渡すと、そうしたトークンの末尾が欠けます。

::: code-group

```ts [JavaScript]
const text = '𠮷野家で食べた'
const { normalizedText, morphemes } = suzume.analyzeWithNormalizedText(text)

for (const m of morphemes) {
  console.log(normalizedText.slice(m.startUtf16, m.endUtf16))
}

// Offsets also index `text` only if normalization kept every character.
const aligned = [...normalizedText].length === [...text].length
```

```python [Python]
text = "𠮷野家で食べた"
result = analyzer.analyze_with_normalized_text(text)

for m in result.morphemes:
    print(result.normalized_text[m.start:m.end])

# Offsets also index `text` only if normalization kept every character.
aligned = len(result.normalized_text) == len(text)
```

```go [Go]
text := "𠮷野家で食べた"
result := s.AnalyzeWithNormalizedText(text)
runes := []rune(result.NormalizedText)

for _, m := range result.Morphemes {
	fmt.Println(string(runes[m.Start:m.End]))
}

// Offsets also index text only if normalization kept every character.
aligned := len(runes) == utf8.RuneCountInString(text)
```

```cpp [C++]
// Byte position of code point `index` in UTF-8 text.
std::size_t byteOffset(std::string_view text, std::size_t index) {
  std::size_t pos = 0;
  while (pos < text.size() && index > 0) {
    ++pos;
    while (pos < text.size() &&
           (static_cast<unsigned char>(text[pos]) & 0xC0) == 0x80) {
      ++pos;
    }
    --index;
  }
  return pos;
}

const auto result = tokenizer.analyzeWithNormalizedText("𠮷野家で食べた");
for (const suzume::Morpheme& m : result.morphemes) {
  const std::size_t begin = byteOffset(result.normalized_text, m.start);
  const std::size_t end = byteOffset(result.normalized_text, m.end);
  std::printf("%s\n", result.normalized_text.substr(begin, end - begin).c_str());
}
```

:::

### 入力テキストへの対応付け {#mapping-to-input}

正規化は文字を 1 対 1 で書き換えるか、取り除くかのどちらかで、文字を挿入することはありません。そのため、正規化後のテキストと入力のコードポイント数が同じなら、オフセットは入力上の位置としても使えます。全角・半角の変換（`ＡＰＩ` → `API`、`ｶﾀｶﾅ` → `カタカナ`）は文字数を変えません。次の場合はテキストが短くなり、それ以降のオフセットは入力とずれます。

| 入力 | 正規化後 | 理由 |
|------|----------|------|
| `ｶﾞｲﾄﾞを読む` | `ガイドを読む` | 半角の濁点を直前のかなに結合する |
| `カ` ＋ U+3099 | `ガ` | 結合用の濁点を直前のかなに結合する |
| `東京` ＋ U+200B ＋ `タワー` | `東京タワー` | ゼロ幅スペースを取り除く |
| `長いーー音` | `長いー音` | 漢字の直前で連続する `ー` を 1 つにまとめる |
| `preserveVu: false` での `ヴァイオリン` | `バイオリン` | `ヴァ` が 1 文字になる |

文字数が異なるときは、正規化後のテキストを切り出すか、入力位置と正規化後の位置の対応を自前で保持してください。

## 正規化 {#normalization}

Suzume はトークン化の前に、入力を一定の文字表記へ書き換えます。入力方法によって表記が揺れるテキストも、辞書引きとパターン規則からは同じ綴りに見えます。トークンの表層形とオフセットは、この正規化後のテキストに基づきます。

| 処理 | 例 | 適用条件 |
|------|----|----------|
| 全角 ASCII（U+FF01–U+FF5E）を ASCII に | `ＡＰＩ１２３` → `API123` | 常に |
| 半角カタカナを全角に | `ｶﾀｶﾅ` → `カタカナ` | 常に |
| 半角・結合用の濁点と半濁点をかなに結合 | `ｶﾞｲﾄﾞ` → `ガイド` | 常に |
| ゼロ幅スペース（U+200B）を除去 | `東京` ＋ U+200B ＋ `タワー` → `東京タワー` | 常に |
| 漢字の直前で連続する `ー` を 1 つに | `長いーー音` → `長いー音` | 常に |
| ASCII の大文字を小文字に | `ＧｉｔＨｕｂ` → `github` | `preserveCase: false` のときだけ |
| ヴ行をバ行に | `ヴァイオリン` → `バイオリン` | `preserveVu: false` のときだけ |

ひらがなとカタカナは相互に変換せず、全角スペース U+3000 もそのまま残します。

2 つのオプションの意味は、どのバインディングでも同じです。

| バインディング | ASCII を小文字にする | ヴをバ行にする |
|----------------|----------------------|----------------|
| JavaScript | `preserveCase: false` | `preserveVu: false` |
| Python | `preserve_case=False` | `preserve_vu=False` |
| Go | `PreserveCase: false` | `PreserveVu: false` |
| C++ | `preserve_case = false` | `preserve_vu = false` |
| CLI | `--lowercase` | `--normalize-vu` |

`preserveSymbols` は正規化の処理ではありません。句読点などの `SYMBOL` トークンを出力に含めるかどうかを決めるだけで、正規化後のテキストにはどちらの場合も残ります。

### 正規化と原形補正の違い {#normalization-vs-lemma}

どちらもテキストの揺れを減らしますが、対象が異なります。

| | 正規化 | [原形](/ja/docs/glossary#lemma)の付与 |
|---|---|---|
| 対象 | 文字（トークン化の前） | トークン（トークン化の後） |
| 表層形とオフセットを変えるか | 変える | 変えない |
| 例 | `ＧｉｔＨｕｂ` → `GitHub` | `食べ` → 原形 `食べる` |
| 結果の格納先 | `surface`、正規化後のテキスト | `baseForm`（`base_form`、`BaseForm`） |
| 制御するオプション | `preserveCase`、`preserveVu` | `lemmatize`（解析後の原形補正） |

短い定義は[用語集](/ja/docs/glossary#normalization)を、オプションの一覧は [JavaScript API リファレンス](/ja/docs/api) を参照してください。
