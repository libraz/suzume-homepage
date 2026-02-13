# Differences from MeCab

Suzume takes a fundamentally different approach to Japanese tokenization than MeCab. This page documents the intentional design differences and known constraints.

## Design Philosophy

| | MeCab | Suzume |
|--|-------|--------|
| **Approach** | Dictionary-driven | Feature-driven |
| **Dictionary** | 50MB+ (required) | Minimal (~300KB total with WASM) |
| **Unknown words** | Falls back to character types | Pattern-based candidate generation |
| **Compound handling** | Splits per dictionary | Merges by character type heuristics |
| **Target** | Server-side, academic | Browser, real-time, client-side |

::: tip Core Trade-off
MeCab knows every word in its dictionary and can split them precisely. Suzume uses character-type patterns instead of an exhaustive dictionary, so it merges sequences it cannot reliably split.
:::

## Intentional Differences

These behaviors are **by design** — Suzume deliberately differs from MeCab in these cases.

### 1. Kanji Compound Merging

Consecutive kanji sequences are merged into a single noun token.

```
Input: 経済成長
MeCab:  経済 / 成長     (2 tokens)
Suzume: 経済成長         (1 token)
```

```
Input: 開始予定
MeCab:  開始 / 予定     (2 tokens)
Suzume: 開始予定         (1 token)
```

**Why:** Without a full dictionary, Suzume cannot determine where to split kanji compounds. Merging is the safer choice — an over-merged token still captures the correct text span. User dictionaries can be used to define specific split points.

### 2. Katakana Compound Merging

Consecutive katakana sequences are merged into a single noun token.

```
Input: データベース
MeCab:  データ / ベース  (2 tokens)
Suzume: データベース      (1 token)
```

```
Input: セットリスト
MeCab:  セット / リスト  (2 tokens)
Suzume: セットリスト      (1 token)
```

**Why:** Same reason as kanji — without dictionary entries for each loanword, splitting would be unreliable. Katakana words are almost always loanword nouns, so merging as a single noun is correct.

### 3. Number + Unit Merging

Numbers followed by counters/units are merged into a single token.

```
Input: 3人
MeCab:  3 / 人          (2 tokens)
Suzume: 3人              (1 token)
```

```
Input: 100円
MeCab:  100 / 円        (2 tokens)
Suzume: 100円            (1 token)
```

**Why:** In most application contexts (search, tagging, display), "3人" as a unit is more useful than splitting into number and counter.

### 4. Date Merging

Full date expressions are merged into a single token.

```
Input: 2024年12月23日
MeCab:  2024 / 年 / 12 / 月 / 23 / 日  (6 tokens)
Suzume: 2024年12月23日                    (1 token)
```

**Why:** Dates are atomic units of meaning. Splitting them provides no practical benefit for tokenization.

### 5. Nai-Adjective Handling

Certain adjectives ending in ない are treated as single lexical units rather than being split.

```
Input: だらしない
MeCab:  だらし / ない    (noun + adjective)
Suzume: だらしない        (single adjective)
```

```
Input: もったいない
MeCab:  もったい / ない  (noun + adjective)
Suzume: もったいない      (single adjective)
```

Applies to: だらしない, つまらない, しょうがない, もったいない, くだらない, せわしない, やるせない, みっともない, etc.

**Why:** These words function as indivisible adjectives in modern Japanese. The "stem + ない" split is etymologically correct but not useful for NLP applications.

### 6. Slang/Modern Adjective Support

Modern colloquial adjectives are recognized natively.

```
Input: エモい
MeCab:  (unknown or split)
Suzume: エモい  (ADJ)
```

Supported: エモい, キモい, ウザい, ダサい, etc.

**Why:** MeCab's dictionary does not include modern slang. Suzume recognizes common slang adjective patterns.

## Where Suzume Improves on MeCab

In some cases, Suzume produces better results than MeCab due to MeCab dictionary bugs or grammatical inconsistencies.

### POS Correction

MeCab sometimes misclassifies parts of speech due to dictionary limitations. Suzume applies rule-based corrections:

```
Input: よくある質問
MeCab:  よく(副詞) / ある / 質問
Suzume: よく(ADJ) / ある / 質問
```

`よく` is the 連用形 (continuative form) of the adjective `良い`, not an adverb. Suzume corrects this.

### Slang and Modern Words

MeCab's dictionary does not include modern slang, often producing incorrect tokenization:

```
Input: エモい曲
MeCab:  エモ(noun) / い(unknown) / 曲
Suzume: エモい(ADJ) / 曲(NOUN)
```

Suzume recognizes modern adjective patterns (エモい, キモい, ウザい, ダサい) and handles their conjugated forms correctly (エモかった, エモくない, etc.).

### Particle Misclassification

MeCab occasionally misclassifies particles as nouns in certain contexts. Suzume applies context-aware corrections:

```
Input: 行くのは大変
MeCab:  行く / の(名詞,非自立) / は / 大変
Suzume: 行く / の(PARTICLE) / は / 大変
```

The nominalizer `の` functions as a particle here, not a noun. Suzume corrects such systematic MeCab issues.

## Constraints

These are known limitations arising from Suzume's feature-based architecture.

### Cannot Split Merged Compounds

Since Suzume uses character-type features rather than a dictionary for compound word boundaries, **it cannot split kanji or katakana sequences that should be separate words**.

```
Input: 東京都庁前
Suzume: 東京都庁前  (1 token — cannot determine internal boundaries)
MeCab:  東京 / 都庁 / 前  (3 tokens — dictionary-driven)
```

**Workaround:** Use the [user dictionary](/docs/user-dictionary) to register specific words that need to be recognized as separate tokens.

```typescript
suzume.loadUserDictionary('東京都庁,NOUN')
```

### Context-Dependent POS Classification

Suzume's feature-based model sometimes cannot distinguish POS that requires dictionary knowledge or deep context. The major patterns:

**Auxiliary vs Main Verb**

When subsidiary verbs follow て-form, Suzume may classify them as main verbs:

```
Input: 確認してあります
MeCab:  確認 / し / て / あり(AUX) / ます
Suzume: 確認 / し / て / あり(VERB) / ます
```

Affects: ある, おく, みる, いく, くる after て-form. Suzume cannot always determine whether these function as subsidiary (auxiliary) or main verbs.

**で: Copula vs Particle**

The particle で has multiple grammatical roles that Suzume cannot always distinguish:

```
Input: マジで驚いた
MeCab:  マジ / で(AUX=copula) / 驚い / た
Suzume: マジ / で(PARTICLE) / 驚い / た
```

After na-adjective stems like マジ, で is the copula (断定の助動詞). Suzume may misclassify it as a particle since this requires dictionary-level knowledge of na-adjective stems.

**ない: Adjective vs Auxiliary**

ない can be a standalone adjective or a negation auxiliary:

```
Input: 仕方ない
MeCab:  仕方 / ない(ADJ)     ← lexical adjective
Suzume: 仕方 / ない(AUX)     ← misclassified as negation
```

**Verb Renyokei vs Noun**

Verb stems used as nouns (nominalization) can be ambiguous:

```
Input: 東京行きは何番線ですか
MeCab:  東京 / 行き(NOUN) / は / ...
Suzume: 東京 / 行き(VERB) / は / ...
```

**なければ Conditional**

The conditional form なければ is classified differently:

```
Input: 行かなければ
MeCab:  行か / なけれ(AUX) / ば
Suzume: 行か / なけれ(VERB) / ば
```

### POS Granularity

Suzume uses a simpler POS tag set than MeCab's detailed subcategories.

| MeCab | Suzume |
|-------|--------|
| 名詞,一般 | NOUN |
| 名詞,固有名詞,地域 | NOUN |
| 名詞,サ変接続 | NOUN |
| 名詞,副詞可能 | NOUN |
| 動詞,自立 | VERB |
| 動詞,非自立 | VERB |

MeCab provides fine-grained subcategories (固有名詞, サ変接続, etc.) that Suzume does not distinguish. If your application requires subcategory-level POS, MeCab may be more suitable.

## When to Use Which

| Use Case | Recommendation |
|----------|---------------|
| Browser / client-side apps | **Suzume** — no server required |
| Search indexing / tag extraction | **Suzume** — compound merging is often desirable |
| Academic research / corpus analysis | **MeCab** — maximum accuracy and POS detail |
| Real-time UI (input-as-you-type) | **Suzume** — fast, no network latency |
| Precise compound word splitting | **MeCab** — dictionary-driven boundaries |
| Handling unknown / modern words | **Suzume** — robust to unseen vocabulary |
