---
title: "Glossary of Japanese Tokenization Terms"
description: "Plain-language definitions of POS, lemma, conjugation forms, copula, formal nouns, unknown words and other Japanese tokenization terms, with real output."
---

# Glossary

Short definitions of the terms these docs use, written for readers who work with text but not with Japanese grammar. Each entry links to the page that covers the topic in depth. Examples show the bundled tokenizer's actual output.

## POS {#pos}

Part of speech: the grammatical category of a token. The `pos` field holds an uppercase English tag (`NOUN`, `VERB`, `PARTICLE`, …) and `posJa` holds the Japanese name.

| `東京に行く` | `東京` | `に` | `行く` |
|---|---|---|---|
| `pos` | `NOUN` | `PARTICLE` | `VERB` |
| `posJa` | 名詞 | 助詞 | 動詞 |

The tag set is listed in the [JavaScript API reference](/docs/api). Where Suzume's tags differ from MeCab's, see [POS Classification](/docs/pos-differences).

## Extended POS {#extended-pos}

A finer label in `extendedPos` that adds the inflected form, the particle role, or the noun subtype to the POS: `VERB_未然`, `AUX_否定`, `NOUN_形式`. In `書かない`, `書か` is `VERB_未然` and `ない` is `AUX_否定`. The values are listed in the [JavaScript API reference](/docs/api).

## Lemma {#lemma}

The dictionary form of a token, also called the base form. JavaScript exposes it as `baseForm`, Python as `base_form`, and Go as `BaseForm`. In `食べた`, the token `食べ` has the lemma `食べる`. Lemmas let you match every inflected form of a word with one key. They are separate from [normalization](#normalization); see [Normalization Is Not Lemmatization](/docs/analysis-modes#normalization-vs-lemma).

## Surface {#surface}

The token's text as it appears in the normalized input. In `飲んだ`, the surface `飲ん` has the lemma `飲む`. Characters left out of the output, such as whitespace and (by default) punctuation, show up as gaps between one token's `end` and the next token's `start`. See [Offsets](/docs/analysis-modes#offsets).

## Conjugation Type {#conjugation-type}

The inflection class of a verb or adjective, in `conjType`: which pattern its endings follow. `書い` (from `書く`) is `五段・カ行` and `食べ` (from `食べる`) is `一段`. It is `null` for words that do not inflect. See [Godan and Ichidan](#godan-ichidan) and the [conjugation types a user dictionary accepts](/docs/user-dictionary#conjugation-types).

## Conjugation Form {#conjugation-form}

Which inflected form a token is, in `conjForm`: `未然形`, `連用形`, `終止形` and so on. Japanese verbs change their ending depending on what follows, so the form tells you the token's role in the phrase.

| Text | Token | `conjForm` |
|---|---|---|
| `書かない` | `書か` | `未然形` |
| `書いた` | `書い` | `連用形` |
| `東京に行く` | `行く` | `終止形` |

## 連用形 (Continuative Form) {#renyokei}

The form a verb takes before `ます`, `た`, `て` or a second verb. In `飲み始めた`, both `飲み` and `始め` are 連用形. The same spelling often doubles as a noun (`飲み` can mean "a drink"), so whether it is a verb or a noun depends on context. See [Deverbal Compound Nouns](/docs/mecab-compounds#deverbal-compound-nouns).

## 未然形 (Irrealis Form) {#mizenkei}

The form a verb takes before negation `ない` and before passive or causative endings. In `書かない`, `書か` is 未然形. See [Causative-Passive](/docs/mecab-grammar#causative-passive) for how Suzume splits these chains.

## Godan and Ichidan {#godan-ichidan}

The two main verb classes. A godan (五段) verb cycles its final kana through the five vowels of one kana row: `書か`, `書き`, `書く`, `書け`, `書こ`. An ichidan (一段) verb keeps its stem and swaps only the ending: `食べ` + `ない`, `食べ` + `た`. `conjType` reports godan verbs together with their row, such as `五段・カ行`. The irregular verbs `する` and `来る` form a third, small group.

## 音便 (Euphonic Change) {#onbin}

A sound change in the 連用形 of godan verbs before `た` and `て`. The token gets `extendedPos` `VERB_音便` and `conjForm` `連用形`.

| Text | Token | Lemma | Kind |
|---|---|---|---|
| `書いた` | `書い` | `書く` | イ音便 (い) |
| `飲んだ` | `飲ん` | `飲む` | 撥音便 (ん) |
| `行った` | `行っ` | `行く` | 促音便 (っ) |

## Copula {#copula}

The "to be" element after a noun: `だ`, `です`, and contractions such as `じゃ`. Suzume tags it `AUX` with the lemma `だ`. In `本じゃない`, the tokens are `本` (`NOUN`), `じゃ` (`AUX`, lemma `だ`) and `ない` (`ADJ`). See [Copula Negation](/docs/mecab-grammar#copula-negation).

## Formal Noun {#formal-noun}

A noun with little meaning of its own that turns a clause into a noun phrase, such as `こと` or `もの`. In `読むことが好き`, `こと` has `isFormalNoun` set and `extendedPos` `NOUN_形式`.

## Low-Information Token {#low-info}

A token with little value as a search keyword: formal nouns and pronouns. It has `isLowInfo` set, and tag generation drops it by default. In `これはとても良いものです`, `これ` and `もの` are low-information. See `generateTags` in the [JavaScript API reference](/docs/api).

## Unknown Word {#unknown-word}

A token that no dictionary supplied; Suzume generated it from character and grammar patterns. It has `isUnknown` set and `isFromDictionary` cleared. Because Suzume ships a compact dictionary, many ordinary words take this path: in `東京に行く`, `東京` is generated from patterns while `に` and `行く` come from the dictionary. Unknown does not mean wrong. See [Pattern Recognition](/docs/how-it-works#pattern-recognition).

## Normalization {#normalization}

Rewriting the input's characters into one canonical form before tokenizing, such as full-width `ＡＰＩ` to `API` or half-width `ｶﾀｶﾅ` to `カタカナ`. It changes surfaces and offsets. It is not lemmatization, which assigns each token its dictionary form. See [Normalization](/docs/analysis-modes#normalization).

## Compound {#compound}

Several words that work as one unit, such as `高層ビル群` ("high-rise cluster"). Suzume keeps some compounds whole by default (`自然言語処理` is one token) and can merge consecutive nouns with `search` mode or `mergeCompounds`. See [Compound Merging](/docs/analysis-modes#merge-compounds) and [Compounds, Quantities, and Names](/docs/mecab-compounds).

## User Dictionary {#user-dictionary}

Your own word list, loaded at runtime as TSV or as a compiled binary, to add product names, jargon or boundaries the built-in dictionaries lack. Tokens from it have `isUserDict` set. See [User Dictionary](/docs/user-dictionary).

## Dictionary Layers {#dictionary-layers}

How the built-in core dictionary, the bundled user dictionary and the dictionaries you load are stacked. See [Dictionary Layers](/docs/user-dictionary#dictionary-layers).
