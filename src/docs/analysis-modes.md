---
title: "Token Modes, Character Offsets, and Normalization"
description: "Choose normal, search or split mode, merge compounds, map token offsets back to the original string in each binding, and control character normalization."
---

# Modes, Offsets, and Normalization

This page covers three settings that change what a token is and where it points: the segmentation mode, compound merging, and character normalization. It also explains how to map token offsets back to text in each binding.

## Choosing a Mode {#modes}

Every instance runs in one of three modes. The mode decides how long [compound](/docs/glossary#compound) tokens get; it does not change the dictionaries or the [POS](/docs/glossary#pos) tags.

<DiagramModes />

| Mode | What it does | Typical use |
|------|--------------|-------------|
| `normal` (default) | Applies the join rules (mixed-script words, prefix + noun, compound verbs and similar) and leaves consecutive nouns as separate tokens | Display, highlighting, general text processing |
| `search` | Everything `normal` does, then merges each run of consecutive nouns into one token | Search-index keys, tag extraction |
| `split` | Turns off the join rules and noun merging and keeps the finest boundaries | Partial matching, recall-oriented indexing |

`split` only removes boundaries the join rules would have added. It cannot invent boundaries the tokenizer has no evidence for: `東京都庁前` stays one token in all three modes. Register such boundaries in a [user dictionary](/docs/user-dictionary) instead.

Try the modes on your own text:

<TokenizerPlayground />

## Compound Merging {#merge-compounds}

`mergeCompounds` merges runs of consecutive nouns, the same step `search` mode adds. It is off by default.

| Mode | `mergeCompounds: false` | `mergeCompounds: true` |
|------|-------------------------|------------------------|
| `normal` | `取り扱い` / `説明書` / `を` / `読む` | `取り扱い説明書` / `を` / `読む` |
| `search` | `取り扱い説明書` / `を` / `読む` | `取り扱い説明書` / `を` / `読む` |
| `split` | `取り扱い` / `説明書` / `を` / `読む` | `取り扱い` / `説明書` / `を` / `読む` (ignored) |

`normal` with `mergeCompounds` and plain `search` give the same result. In `split` mode the option has no effect.

## Setting the Mode {#setting-the-mode}

The mode is set at creation and can be changed later without reloading the dictionaries. `mergeCompounds` can only be set at creation.

| Binding | Mode at creation | Change later | Compound merging |
|---------|------------------|--------------|------------------|
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

In Go, start from `DefaultExtendedOptions()`: the zero value of `ExtendedOptions` turns off lemma correction and case/ヴ preservation.

## Offsets {#offsets}

Every token carries `start` and `end`. In all bindings they count Unicode code points, and they index the normalized text, not the string you passed in. Each binding has a call that returns the normalized text together with the tokens.

| Binding | Call that returns the normalized text | Offset unit | How to slice |
|---------|---------------------------------------|-------------|--------------|
| JavaScript | `analyzeWithNormalizedText()` → `normalizedText` | `start`/`end`: code points; `startUtf16`/`endUtf16`: UTF-16 code units | `normalizedText.slice(startUtf16, endUtf16)` |
| Python | `analyze_with_normalized_text()` → `normalized_text` | Code points | `normalized_text[start:end]` |
| Go | `AnalyzeWithNormalizedText()` → `NormalizedText` | Code points | `[]rune(NormalizedText)[Start:End]` |
| C++ | `analyzeWithNormalizedText()` → `normalized_text` (UTF-8) | Code points | Convert to byte offsets first |
| C | `suzume_analyze_n()` → `normalized_text`, `normalized_text_size` | Code points | Convert to byte offsets first |
| CLI | `--format json` → `normalized_text` | Code points | — |

<DiagramOffsets />

Code points and UTF-16 units differ for characters outside the Basic Multilingual Plane, such as `𠮷`. Passing `start`/`end` to `String.prototype.slice()` cuts such a token short.

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

### Mapping Offsets Back to Your Input {#mapping-to-input}

Normalization either rewrites a character one-for-one or removes it; it never inserts characters. So if the normalized text has as many code points as your input, the offsets index your input as well. Width folding (`ＡＰＩ` → `API`, `ｶﾀｶﾅ` → `カタカナ`) keeps the count. The cases below shorten the text, and after them the offsets no longer line up with the input.

| Input | Normalized | Why |
|-------|------------|-----|
| `ｶﾞｲﾄﾞを読む` | `ガイドを読む` | A half-width voicing mark is merged into the preceding kana |
| `カ` + U+3099 | `ガ` | A combining voicing mark is merged into the preceding kana |
| `東京` + U+200B + `タワー` | `東京タワー` | Zero-width spaces are removed |
| `長いーー音` | `長いー音` | Repeated `ー` before a kanji collapses to one |
| `ヴァイオリン` with `preserveVu: false` | `バイオリン` | `ヴァ` becomes one character |

When the counts differ, slice the normalized text, or keep your own mapping from input positions to normalized positions.

## Normalization {#normalization}

Before tokenizing, Suzume rewrites the input into one canonical character form, so dictionary lookups and pattern rules see a single spelling for text that can be typed several ways. Token surfaces and offsets come from this normalized text.

| Step | Example | When |
|------|---------|------|
| Full-width ASCII (U+FF01–U+FF5E) to ASCII | `ＡＰＩ１２３` → `API123` | Always |
| Half-width katakana to full-width | `ｶﾀｶﾅ` → `カタカナ` | Always |
| Half-width and combining voicing marks merged into the kana | `ｶﾞｲﾄﾞ` → `ガイド` | Always |
| Zero-width space (U+200B) removed | `東京` + U+200B + `タワー` → `東京タワー` | Always |
| Repeated `ー` before a kanji collapsed | `長いーー音` → `長いー音` | Always |
| ASCII uppercase to lowercase | `ＧｉｔＨｕｂ` → `github` | Only with `preserveCase: false` |
| ヴ-series to the バ row | `ヴァイオリン` → `バイオリン` | Only with `preserveVu: false` |

Hiragana and katakana are not folded into each other, and the ideographic space U+3000 is kept as is.

The two options mean the same thing in every binding:

| Binding | Lowercase ASCII | Fold ヴ |
|---------|-----------------|---------|
| JavaScript | `preserveCase: false` | `preserveVu: false` |
| Python | `preserve_case=False` | `preserve_vu=False` |
| Go | `PreserveCase: false` | `PreserveVu: false` |
| C++ | `preserve_case = false` | `preserve_vu = false` |
| CLI | `--lowercase` | `--normalize-vu` |

`preserveSymbols` is not a normalization step. It decides whether punctuation-like `SYMBOL` tokens appear in the output; the normalized text keeps them either way.

### Normalization Is Not Lemmatization {#normalization-vs-lemma}

Both make text more uniform, but they act on different things.

| | Normalization | [Lemmatization](/docs/glossary#lemma) |
|---|---|---|
| Works on | Characters, before tokenizing | Tokens, after tokenizing |
| Changes the surface and offsets | Yes | No |
| Example | `ＧｉｔＨｕｂ` → `GitHub` | `食べ` → lemma `食べる` |
| Result appears in | `surface`, normalized text | `baseForm` (`base_form`, `BaseForm`) |
| Controlled by | `preserveCase`, `preserveVu` | `lemmatize` (post-analysis lemma correction) |

See the [glossary](/docs/glossary#normalization) for a one-line definition and the [JavaScript API reference](/docs/api) for the full option list.
