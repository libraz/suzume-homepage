# Differences from MeCab

Suzume takes a fundamentally different approach to Japanese tokenization than MeCab. This page documents the intentional design differences and known constraints.

## Design Philosophy

::: info Suzume is a Tokenizer, Not a Morphological Analyzer
MeCab is a morphological analyzer — its goal is to decompose text into morphemes with detailed grammatical information. Suzume is a **tokenizer** — its goal is to split text into meaningful units for practical applications like search, display, and text processing. Morphological analysis is not a goal of Suzume. This fundamental difference in purpose explains many of the behavioral differences described below.
:::

| | MeCab | Suzume |
|--|-------|--------|
| **Approach** | Dictionary-driven | Feature-driven |
| **Dictionary** | 50MB+ (required) | Minimal (~400KB total with WASM) |
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

Numbers followed by counters/units are merged into a single token. Includes large number units (万, 億, 兆), decimal numbers, percentages, and alphabetic units.

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

```
Input: 3.14
MeCab:  3 / . / 14      (3 tokens)
Suzume: 3.14             (1 token)
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

Applies to: だらしない, つまらない, しょうがない, もったいない, くだらない, せわしない, やるせない, いたたまれない, あどけない, おぼつかない, はしたない, みっともない, ろくでもない, どうしようもない, ものたりない, こころもとない

**Why:** These words function as indivisible adjectives in modern Japanese. The "stem + ない" split is etymologically correct but not useful for NLP applications.

### 6. Slang/Modern Word Support

Modern colloquial adjectives and verbs are recognized natively.

```
Input: エモい
MeCab:  (unknown or split)
Suzume: エモい  (ADJ)
```

Supported adjectives: エモい, キモい, ウザい, ダサい, イタい, エロい

Supported verbs: バズる, ググる, パクる

**Why:** MeCab's dictionary does not include modern slang. Suzume recognizes common slang adjective and verb patterns, including their conjugated forms (エモかった, バズった, etc.).

### 7. Compound Verb Merging

Verb stems in 連用形 followed by subsidiary verbs are merged into compound verbs.

```
Input: 走り込む
MeCab:  走り / 込む      (2 tokens)
Suzume: 走り込む          (1 token)
```

```
Input: 食べ続ける
MeCab:  食べ / 続ける    (2 tokens)
Suzume: 食べ続ける        (1 token)
```

Supported V2 elements include: 込む, 出す, 続く, 返す, 合う, 直す, 切る, 上がる, 抜く, 続ける, つける, 替える, 合わせる, 上げる, 下げる, 掛ける, 入れる, etc. (40+ patterns)

**Why:** Compound verbs function as single lexical units in Japanese. Splitting them loses the compound meaning.

### 8. タリ活用副詞 Merging

Tari-conjugation adverb stems followed by と are merged into a single adverb.

```
Input: 堂々と
MeCab:  堂々 / と        (2 tokens)
Suzume: 堂々と            (1 token, ADV)
```

Applies to: 泰然, 堂々, 悠々, 淡々, 粛々, 颯爽, 毅然, 漫然, 茫然, 呆然, 唖然, 愕然, 断然, 俄然, 歴然, 整然, 雑然, 騒然, 憮然, 黙然, 昂然, 凛然, 厳然

**Why:** These stem+と combinations are conventionally used as adverbs and are more useful as single tokens.

### 9. お/ご Prefix Handling

Suzume splits お/ご honorific prefixes from nouns but keeps them merged when they form inseparable lexemes.

```
Input: お茶
Suzume: お(PREFIX) / 茶(NOUN)    (split — separable prefix)

Input: お金
Suzume: お金(NOUN)                (kept — inseparable lexeme)

Input: お母さん
Suzume: お母さん(NOUN)            (kept — family term)
```

Inseparable exceptions include: お金, お前, おかず, おでん, おもちゃ, and family terms (お母さん, お父さん, お兄ちゃん, お姉さん, etc.)

**Why:** In most contexts, お/ご are grammatical prefixes that should be separated. But some words have lexicalized with the prefix and splitting them would be incorrect.

### 10. Honorific Suffix Splitting

Honorific suffixes are split from names.

```
Input: 田中さん
MeCab:  田中さん          (1 token)
Suzume: 田中 / さん       (2 tokens)
```

Applies to suffixes: さん, ちゃん, 様, 君, 殿, さま

Exceptions: Family terms like お兄ちゃん, お母さん are kept as single tokens.

**Why:** For search and display, separating names from honorifics is more useful.

### 11. URL / Mention / Hashtag Handling

URLs, @mentions, and #hashtags are merged into single tokens.

```
Input: https://example.com にアクセス
Suzume: https://example.com / に / アクセス

Input: @user_name に送信
Suzume: @user_name / に / 送信

Input: #推し活 について
Suzume: #推し活 / について
```

**Why:** These are atomic identifiers in modern text. Splitting them provides no benefit.

### 12. Prolonged Sound Mark Handling

Prolonged sound marks (ー) are merged with the preceding token, and consecutive marks are normalized to one.

```
Input: あのー
MeCab:  あの / ー          (2 tokens)
Suzume: あのー              (1 token)

Input: すごーーい
Suzume: すごーい            (normalized)
```

**Why:** Prolonged sounds are part of the word they modify.

### 13. Colloquial Pronoun Merging

Colloquial pronouns that MeCab splits are merged.

```
Input: こいつは
MeCab:  こ / いつ / は    (3 tokens)
Suzume: こいつ / は        (2 tokens)
```

Applies to: どいつ, こいつ, そいつ, あいつ

### 14. Split Rules

Suzume splits certain MeCab tokens that should be separate units.

**ったら topic particle:**
```
Input: あなたったら
MeCab:  あなたったら      (1 token)
Suzume: あなた / ったら    (pronoun + particle)
```

**ってば emphatic particle:**
```
Input: もうってば
MeCab:  もうってば        (1 token)
Suzume: もう / ってば      (adverb + particle)
```

**Plural suffix ら:**
```
Input: 彼ら
MeCab:  彼ら              (1 token)
Suzume: 彼 / ら            (pronoun + suffix)
```

**Kanji adverb + に:**
```
Input: 次に
MeCab:  次に(副詞)        (1 token)
Suzume: 次(NOUN) / に(PARTICLE)  (2 tokens)
```

**Kanji + katakana compound nouns:**
```
Input: 二次エロ (without user dictionary)
Suzume: 二次 / エロ        (2 tokens)
```

## Where Suzume Improves on MeCab

In some cases, Suzume produces better results than MeCab due to MeCab dictionary bugs or grammatical inconsistencies. Suzume applies 100+ rule-based corrections.

### Adjective Continuative Form (連用形)

MeCab often misclassifies adjective 連用形 (〜く form) as adverbs. Suzume corrects all such cases:

```
Input: よくある質問
MeCab:  よく(副詞) / ある / 質問
Suzume: よく(ADJ) / ある / 質問
```

```
Input: 美しく咲く花
MeCab:  美しく(副詞) / 咲く / 花
Suzume: 美しく(ADJ) / 咲く / 花
```

Any word ending in く whose lemma ends in い, or a kanji-containing surface, is recognized as an adjective continuative form, not an adverb.

### Pronoun Recognition

MeCab classifies many pronouns as plain nouns. Suzume corrects these to Pronoun:

```
Input: みんなで行こう
MeCab:  みんな(名詞) / で / 行こう
Suzume: みんな(PRONOUN) / で / 行こう
```

Corrected words include: あなた, あんた, みんな, みな, 皆, 某, 拙者, 我輩, 彼女, 彼氏, 奴, 我, わし, いくら (interrogative)

### Na-Adjective Recognition

MeCab classifies na-adjective stems as nouns (形容動詞語幹). Suzume recognizes them as adjectives:

```
Input: きれいな花
MeCab:  きれい(名詞) / な / 花
Suzume: きれい(ADJ) / な / 花
```

Corrected words include: きれい, しずか, おだやか, げんき, しんちょう, ありきたり, 無限, 滅多

Note: Some 形容動詞語幹 are intentionally kept as Noun: マジ, 不安, 不要, 乙, 不便, 公式, 可能, 容易, 積極, 健康

### じゃ Conjugation Fixes

MeCab inconsistently classifies じゃ (colloquial copula). Suzume consistently treats it as auxiliary (助動詞) and corrects the following ない/なかっ/な accordingly:

```
Input: そうじゃない
MeCab:  そう / じゃ(助詞) / ない(形容詞)
Suzume: そう / じゃ(AUX) / ない(AUX)
```

### て-Form Auxiliary Corrections

After て/で, subsidiary verbs like いる are corrected to Auxiliary:

```
Input: 食べている
MeCab:  食べ / て / いる(動詞)
Suzume: 食べ / て(AUX) / いる(AUX)
```

Additionally, て/で after verbs and adjectives are reclassified from Particle to Auxiliary.

### Context-Dependent POS

Suzume applies context-aware corrections for several ambiguous words:

**そう:** Classified as Adjective before copula (そうだ = hearsay), Auxiliary after Auxiliary (しまいそう = appearance), Adverb otherwise.

**でも:** Classified as Particle after interrogatives (何でも), Conjunction at sentence/clause boundaries (でも、...).

**いかが:** Classified as Adverb when not before copula, Pronoun before copula (いかがですか).

**大変:** Classified as Adjective before な (大変な), Adverb otherwise (大変良い).

### Slang and Modern Words

MeCab's dictionary does not include modern slang, often producing incorrect tokenization:

```
Input: エモい曲
MeCab:  エモ(noun) / い(unknown) / 曲
Suzume: エモい(ADJ) / 曲(NOUN)
```

Suzume recognizes modern adjective patterns (エモい, キモい, ウザい, ダサい, イタい, エロい) and handles their conjugated forms correctly (エモかった, エモくない, etc.). Modern verb patterns (バズる, ググる, パクる) are also supported.

### Particle Misclassification

MeCab occasionally misclassifies particles as nouns in certain contexts. Suzume applies context-aware corrections for 30+ particles:

```
Input: 行くのは大変
MeCab:  行く / の(名詞,非自立) / は / 大変
Suzume: 行く / の(PARTICLE) / は / 大変
```

The nominalizer の functions as a particle here, not a noun. Suzume corrects such systematic MeCab issues.

### Katakana Onomatopoeia

MeCab classifies katakana onomatopoeia (reduplication patterns) as nouns. Suzume recognizes them as adverbs:

```
Input: ワクワクする
MeCab:  ワクワク(名詞) / する
Suzume: ワクワク(ADV) / する
```

Onomatopoeia + っと patterns are also merged:

```
Input: どきっとする
MeCab:  どき / っと / する
Suzume: どきっと(ADV) / する
```

### Specific Word Corrections

Suzume fixes various individual MeCab misclassifications:

| Word | MeCab | Suzume | Reason |
|------|-------|--------|--------|
| なら | 助動詞 | PARTICLE | Conditional particle |
| 違い | 名詞 | VERB | Noun form of 違う |
| 推し | 動詞 | NOUN | Modern noun usage |
| 嫌い | 動詞 | ADJ | Na-adjective |
| 大変 | 名詞 | ADV | Adverb usage |
| 超 | 接頭詞 | NOUN | Modern usage |
| びっくり | 名詞 | ADV | Adverb |
| なるほど | — | ADV | Adverb override |
| たくさん | — | ADV | Adverb override |
| いずれ | — | ADV | Adverb override |
| お疲れ様 | — | INTJ | Interjection |
| よろしく | — | ADV | Adverb |
| おめでとう | 感動詞 | ADV | Adverb |
| じゃん | 助動詞 | PARTICLE | Sentence-final particle |
| や | 助動詞 | PARTICLE | Kansai copula → particle |
| よう | 助動詞 | NOUN | Formal noun |
| 時々 | 副詞 | NOUN | Noun usage |

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
