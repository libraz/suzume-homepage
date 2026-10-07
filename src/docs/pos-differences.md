# POS Classification vs MeCab

The same token can carry different POS labels in MeCab and Suzume. The examples below group those differences by lexical category, predicate structure, and context; the final section explains how the two taxonomies relate.

::: tip Looking for token boundary differences?
This page covers how tokens are labeled. For where token boundaries differ — merging, splitting, and normalization — see [Differences from MeCab](/docs/mecab-comparison).
:::

::: info Reading the comparisons
The **MeCab** row uses Japanese POS names; the **Suzume** row uses public API tags with Japanese labels. All examples use the shared [comparison baseline](/docs/mecab-comparison#comparison-baseline).
:::

## Lexical categories

### Adjective-Derived よく

MeCab lexicalizes よく as an adverb. Suzume assigns `ADJ` as the continuative form of よい:

<TokenDiff input="よくある質問" mecab="よく(副詞) / ある(動詞) / 質問(名詞)" suzume="よく(ADJ) / ある(DET) / 質問(NOUN)" />

Ordinary adjective continuative forms such as 美しく are omitted because current MeCab also classifies them as adjectives.

### Pronoun Recognition

MeCab classifies many pronouns as plain nouns. Suzume assigns `PRON`:

<TokenDiff input="みんなで行こう" mecab="みんな(名詞・代名詞) / で(助詞) / 行こ(動詞) / う(助動詞)" suzume="みんな(PRON) / で(PARTICLE) / 行こ(VERB) / う(AUX)" />

Applies to: あなた, みんな, 皆, 某, 拙者, 我輩, 彼女, 奴, 我, わし, いくら (interrogative)

Suzume also assigns `PRON` to the colloquial pronouns どいつ, こいつ, そいつ, and あいつ. If a MeCab dictionary variant splits the surface, the normalization pipeline restores one token.

<TokenDiff input="こいつは" mecab="こいつ(名詞) / は(助詞)" suzume="こいつ(PRON) / は(PARTICLE)" />

### Greeting Interjections

Suzume keeps greeting expressions under `INTJ` and marks them `INTJ_挨拶`. This includes ありがとう, ごめん, and すみません, even when a phrase comes before the greeting:

- `ありがとう` → `ありがとう(INTJ, extendedPos: INTJ_挨拶)`
- `心からありがとう` → `心(NOUN) / から(PARTICLE) / ありがとう(INTJ, extendedPos: INTJ_挨拶)`

おつかれさま uses the same subtype. Ordinary exclamations such as ああ and おい remain `INTJ` without the greeting subtype.

### Na-Adjective Recognition

MeCab classifies na-adjective stems as nouns (形容動詞語幹). Suzume recognizes them as adjectives:

<TokenDiff input="きれいな花" mecab="きれい(名詞) / な / 花" suzume="きれい(ADJ) / な / 花" />

In attributive contexts, examples include きれい, しずか, 穏やか, 元気, しんちょう, ありきたり, 無限, and 滅多. Ambiguous nominal readings are resolved from context.

Some stems remain `NOUN` in isolation: マジ, 乙, 公式, 積極, 傍若無人. Context can change the classification; for example, マジで uses `ADJ` for マジ.

### Suffix Recognition

Some productive derivational suffixes receive the dedicated `SUFFIX` tag, and the stem keeps its own class and lemma. Others form a single nominal or adjectival search unit.

**Nominalizer さ** turns an adjective into a noun; Suzume keeps the adjective stem visible:

<TokenDiff input="暖かさ" mecab="暖か(形容詞・自立, lemma: 暖かい) / さ(名詞・接尾)" suzume="暖か(ADJ, lemma: 暖かい) / さ(SUFFIX)" />

The same nominalizer follows the stem of らしい. In 本らしさ, Suzume assigns らし the auxiliary subtype `AUX_推定語幹` and treats さ as a suffix; the IPA dictionary labels this さ as a sentence-final particle.

<TokenDiff input="本らしさ" mecab="本(名詞) / らし(助動詞, lemma: らしい) / さ(助詞・終助詞)" suzume="本(NOUN) / らし(AUX, lemma: らしい) / さ(SUFFIX)" />

**Trace suffix っけ** is distinct from the sentence-final particle with the same spelling. After a nominal host in 飾りっけ, Suzume uses `SUFFIX_気配`:

<TokenDiff input="飾りっけ" mecab="飾り(名詞) / っけ(助詞・終助詞)" suzume="飾り(NOUN) / っけ(SUFFIX)" />

The property nominalizer み stays with its adjective stem as one noun: `眠み(NOUN)` and `無理み(NOUN)`.

**X的 + な** is treated as one na-adjective:

<TokenDiff input="積極的な性格" mecab="積極(名詞) / 的(名詞・接尾) / な(助動詞) / 性格(名詞)" suzume="積極的(ADJ) / な(AUX, lemma: だ) / 性格(NOUN)" />

For suffixes that change token boundaries, such as 中, 抜き, and 建て, see [Compounds, Quantities, and Names](/docs/mecab-compounds#quantity-and-state-suffixes).

### Deverbal Nouns

A verb continuative used as a noun keeps `NOUN`, even where a MeCab dictionary labels it a verb form:

<TokenDiff input="推しが尊い" mecab="推し(動詞・連用形, lemma: 推す) / が(助詞) / 尊い(形容詞)" suzume="推し(NOUN) / が(PARTICLE) / 尊い(ADJ)" />

<TokenDiff input="終わりが近い" mecab="終わり(動詞・連用形, lemma: 終わる) / が(助詞) / 近い(形容詞)" suzume="終わり(NOUN) / が(PARTICLE) / 近い(ADJ)" />

Other deverbal forms are context-dependent; see 違い and 推し in the [per-word table](#per-word-pos-differences) below.

### Katakana Onomatopoeia

MeCab classifies katakana onomatopoeia (reduplication patterns) as nouns. Suzume recognizes them as adverbs:

<TokenDiff input="ドキドキする" mecab="ドキドキ(名詞・サ変接続) / する(動詞)" suzume="ドキドキ(ADV) / する(VERB)" />

Mimetics ending in っと are also kept whole as adverbs:

<TokenDiff input="ぴかぴかっと光る" mecab="ぴかぴか(副詞) / っと(助詞) / 光る(動詞)" suzume="ぴかぴかっと(ADV) / 光る(VERB)" />

<TokenDiff input="ぷるんっとした" mecab="ぷるんっとした(名詞)" suzume="ぷるんっと(ADV) / し(VERB, lemma: する) / た(AUX)" />

## Predicates and auxiliaries

### て-Form Auxiliaries

After the connective て/で, subsidiary verbs lose their independent meaning and receive `AUX`. Suzume applies this consistently across the whole construction family, where MeCab labels them 動詞 (usually with the 非自立 subcategory).

**Progressive いる and trial みる** — the independent verbs いる and 見る remain `VERB` elsewhere:

<TokenDiff input="食べている" mecab="食べ / て / いる(動詞)" suzume="食べ / て(PARTICLE) / いる(AUX)" />

<TokenDiff input="食べてみる" mecab="食べ / て / みる(動詞)" suzume="食べ / て(PARTICLE) / みる(AUX)" />

**Giving and receiving auxiliaries** くれる, あげる, もらう:

<TokenDiff input="教えてくれる" mecab="教え(動詞) / て(助詞) / くれる(動詞・非自立)" suzume="教え(VERB) / て(PARTICLE) / くれる(AUX)" />

<TokenDiff input="食べてあげる" mecab="食べ(動詞) / て(助詞) / あげる(動詞・非自立)" suzume="食べ(VERB) / て(PARTICLE) / あげる(AUX)" />

<TokenDiff input="貸してもらう" mecab="貸し(動詞) / て(助詞) / もらう(動詞・非自立)" suzume="貸し(VERB) / て(PARTICLE) / もらう(AUX)" />

**Completive しまう and its contraction ちゃう:**

<TokenDiff input="食べてしまう" mecab="食べ(動詞) / て(助詞) / しまう(動詞・非自立)" suzume="食べ(VERB) / て(PARTICLE) / しまう(AUX)" />

<TokenDiff input="食べちゃった" mecab="食べ(動詞) / ちゃっ(動詞・非自立) / た(助動詞)" suzume="食べ(VERB) / ちゃっ(AUX, lemma: ちゃう) / た(AUX)" />

**Contracted progressive てる/でる** — each contraction keeps its surface form as the auxiliary lemma:

<TokenDiff input="読んでる" mecab="読ん(動詞) / でる(動詞・非自立)" suzume="読ん(VERB, lemma: 読む) / でる(AUX, lemma: でる)" />

For てる, `食べてる` yields `食べ(VERB, lemma: 食べる) / てる(AUX, lemma: てる)`.

**Humble いただける** in polite requests stays `VERB`; the following polite or negative forms are auxiliaries:

<TokenDiff input="ご確認いただけます" mecab="ご(接頭詞) / 確認(名詞) / いただけ(動詞・自立) / ます(助動詞)" suzume="ご(PREFIX) / 確認(NOUN) / いただけ(VERB, lemma: いただける) / ます(AUX)" />

**Resultative てある is the exception** — ある keeps its existential meaning and remains `VERB`:

<TokenDiff input="並べてある" mecab="並べて(副詞) / ある(動詞)" suzume="並べ(VERB) / て(PARTICLE) / ある(VERB)" />

### Purpose Expressions and Subsidiary ゆく

A hiragana verb stem before に plus a motion verb remains `VERB` in a purpose expression. In literary "verb stem + ゆく/いく" expressions, the second element is treated as a verb.

<TokenDiff input="およぎに行く" mecab="およぎ(動詞) / に(助詞) / 行く(動詞)" suzume="およぎ(VERB, lemma: およぐ) / に(PARTICLE) / 行く(VERB)" />

<TokenDiff input="散りゆく" mecab="散り(動詞) / ゆく(動詞・非自立)" suzume="散り(VERB) / ゆく(VERB)" />

### Restoring Hiragana Verb Inflections

When MeCab analyzes a short pure-hiragana nasal sound change as a noun, Suzume restores the verb and its lemma from the following だ/で and the inflection pattern. A Godan-wa verb whose final う was split as an auxiliary is also restored to one token.

<TokenDiff input="かんで" mecab="かん(名詞) / で(助詞)" suzume="かん(VERB, lemma: かむ) / で" />

<TokenDiff input="つかう" mecab="つか(動詞・未然形, lemma: つく) / う(助動詞)" suzume="つかう(VERB)" />

### Verb Stems in Honorific Requests

In "お/ご + verb stem + くださる/いたす/いただく" constructions, a stem that is homographic with a noun is restored to a verb from the grammatical structure.

<TokenDiff input="お立ちください" mecab="お立ち(名詞) / ください(動詞)" suzume="お(PREFIX) / 立ち(VERB, lemma: 立つ) / ください(VERB)" />

### で+ある Copula Handling

Suzume applies context-aware classification for the copula である pattern:

<TokenDiff input="重要である" mecab="重要(名詞・形容動詞語幹) / で(助動詞) / ある(助動詞)" suzume="重要(ADJ) / で(AUX, lemma: だ) / ある(VERB)" />

<TokenDiff input="問題であった" mecab="問題(名詞・ナイ形容詞語幹) / で(助動詞) / あっ(助動詞) / た(助動詞)" suzume="問題(NOUN) / で(AUX, lemma: だ) / あっ(VERB, lemma: ある) / た(AUX)" />

### ない Context-Dependent Classification

Suzume assigns `ADJ` rather than `AUX` to ない/なく/なかっ when they function as an existence adjective:

<TokenDiff input="時間がない" mecab="時間(名詞) / が(助詞) / ない(形容詞)" suzume="時間(NOUN) / が(PARTICLE) / ない(ADJ)" note="existence negation" noteJa="存在の否定" />

<TokenDiff input="食べない" mecab="食べ(動詞) / ない(助動詞)" suzume="食べ(VERB) / ない(AUX)" note="negation auxiliary" noteJa="否定の助動詞" />

<TokenDiff input="仕方ない" mecab="仕方(名詞・ナイ形容詞語幹) / ない(助動詞)" suzume="仕方(NOUN) / ない(ADJ)" note="lexical adjective" noteJa="語彙的形容詞" />

The continuative `なく` follows the same distinction. It is `AUX` after a verb or passive/causative stem, but `ADJ` after an adjective continuative or in an independent absence expression:

<TokenDiff input="食べなくて" mecab="食べ(動詞) / なく(助動詞) / て(助詞)" suzume="食べ(VERB) / なく(AUX) / て(PARTICLE)" />

<TokenDiff input="寒くなくて" mecab="寒く(形容詞) / なく(助動詞) / て(助詞)" suzume="寒く(ADJ) / なく(ADJ) / て(PARTICLE)" />

### Contracted Hypotheticals

Suzume recognizes colloquial contracted hypothetical forms as one inflected predicate while preserving the lemma:

<TokenDiff input="行きゃ" mecab="行きゃ(動詞, lemma: 行く)" suzume="行きゃ(VERB, lemma: 行く)" />

<TokenDiff input="読めりゃ" mecab="読めりゃ(動詞, lemma: 読める)" suzume="読めりゃ(VERB, lemma: 読める)" />

<TokenDiff input="早けりゃ" mecab="早けりゃ(形容詞, lemma: 早い)" suzume="早けりゃ(ADJ, lemma: 早い)" />

Verb forms report `VERB_仮定縮約` in `extendedPos`; adjective forms keep their adjective inflection category.

## Particles and function words

### Particle Classification

MeCab classifies certain particles as nouns in some contexts. Suzume applies context-aware classification for 30+ particles:

<TokenDiff input="行くのは大変" mecab="行く / の(名詞・非自立) / は / 大変" suzume="行く / の(PARTICLE) / は / 大変" />

The nominalizer の functions as a particle here, not a noun. Suzume classifies such cases as particles.

### Colloquial Copulas and Particles

Colloquial copulas and particles that dictionary taxonomies handle unevenly are normalized to consistent tags:

| Example | Word | Suzume | Role |
|---------|------|--------|------|
| いいっすね | っす | `AUX` (lemma: です) | Casual copula |
| いいじゃん | じゃん | `PARTICLE` | Colloquial sentence-final particle |
| 夢みたい | みたい | `AUX` | Similative auxiliary |
| 私なんか | なんか | `PARTICLE` | Deprecatory/exemplifying particle |
| 英語はおろか | おろか | `PARTICLE` | "Let alone" particle |
| そうや | や | `AUX` (lemma: だ) | Regional copula |

Suzume recognizes some regional predicate tails and particles in context. Examples include `あかん` and `へん` as `AUX`, `ねん` and `さかい` as `PARTICLE`, and the polite copula `どす` as `AUX`. These are grammatical labels, not a claim that every dialectal expression is covered.

## Context and taxonomy

### Context-Dependent POS

Suzume applies context-aware POS classification for several ambiguous words:

**そう:** `AUX` after a predicate in an appearance expression (しまいそう, 降りそう), and `ADV` when standalone or before a copula (そうだ).

**でも:** `PARTICLE` after a host, but `CONJ` at the start of a clause:

<TokenDiff input="何でも良い" mecab="何(名詞) / で(助詞) / も(助詞) / 良い(形容詞)" suzume="何(PRON) / でも(PARTICLE) / 良い(ADJ)" />

<TokenDiff input="でも大丈夫" mecab="でも(接続詞) / 大丈夫(名詞・形容動詞語幹)" suzume="でも(CONJ) / 大丈夫(ADJ)" />

**いかが:** `ADJ` before a copula (いかがですか) and `ADV` otherwise.

**大変:** `ADJ` before the attributive copula な and before だ/です; it is `ADV` in adverbial use (大変良い) and in isolation.

**どう:** `ADV` before a copula (どうだ) and in other adverbial uses, including どうする and かどうか:

<TokenDiff input="行くかどうか" mecab="行く(動詞) / か(助詞) / どう(副詞) / か(助詞)" suzume="行く(VERB) / か(PARTICLE) / どう(ADV) / か(PARTICLE)" />

Without a preceding predicate, the fragment かどうか can be misread as a verb. Supply the complete clause when analyzing this construction.

**よう:** the volitional う after a 未然形 is `AUX`. A bare ような is analyzed as `AUX` / `PARTICLE`; in a contextual construction such as このような方法 or 夢のような話だ, よう is the formal noun `NOUN` and な is copular `AUX` with lemma だ:

<TokenDiff input="見よう" mecab="見よ(動詞) / う(助動詞)" suzume="見よ(VERB, lemma: 見る) / う(AUX)" />

<TokenDiff input="ような" mecab="よう(名詞・非自立) / な(助動詞)" suzume="よう(AUX) / な(PARTICLE)" />

**なら:** the standalone conditional stays a particle; before a negative (ならない, ならなかった), it parses as the verb なる.

### Per-Word POS Differences

The following words are classified differently between MeCab and Suzume:

| Word | MeCab | Suzume | Reason |
|------|-------|--------|--------|
| なら | 接続詞 | PARTICLE / VERB (文脈依存) | Conditional particle when standalone; parsed as the verb なる before negatives |
| 違い | 名詞・ナイ形容詞語幹 | VERB / NOUN (文脈依存) | Standalone is `VERB` (lemma: 違う); 違いない, 違いがある, and modified nominal uses are `NOUN` |
| 推し | 動詞 | NOUN (名詞) | Modern noun usage |
| 嫌い | 動詞 | ADJ (形容詞) | Na-adjective |
| 大変 | 名詞・形容動詞語幹 | ADJ / ADV (文脈依存) | `ADJ` before な/だ/です; `ADV` in adverbial or isolated use |
| 超 | 接頭詞 | NOUN (名詞) | Modern usage |
| びっくり | 名詞・サ変接続 | ADV (副詞) | Adverb usage |
| なるほど | 感動詞 | ADV (副詞) | Adverb usage |
| たくさん | 名詞・副詞可能 | ADV (副詞) | Adverb usage |
| いずれ | 名詞・代名詞 | ADV (副詞) | Adverb usage |
| おめでとう | 感動詞 | ADV (副詞) | Adverb usage |
| じゃん | 接続詞 + 終助詞 | PARTICLE (助詞) | Colloquial sentence-final particle |
| よう | 感動詞 | AUX / NOUN (文脈依存) | Volitional う after 未然形 (見よ + う); formal noun in contextual ように / ような constructions |
| 時々 | 副詞 | NOUN (名詞) | Noun usage |
| 遥か | 副詞 | ADJ (形容詞) | Na-adjective |
| どう | 副詞 | ADV (副詞) | Adverb before a copula and elsewhere |
| まじ | 助動詞 | ADJ (形容詞) | `まじ` is an adjective; katakana マジ is `NOUN` alone but `ADJ` in contexts such as マジで |
| っていう | 助詞 | DET (連体詞) | Determiner |
| という | 助詞 | DET (連体詞) | Determiner |
| といった | 助詞 | DET (連体詞) | Quotative determiner (`DET_引用`) |
| まして | 副詞 | CONJ (接続詞) | Conjunction |
| いわば | 副詞 | CONJ (接続詞) | Conjunction (言わば) |
| その後 | 名詞・副詞可能 | ADV (副詞) | Adverb usage |
| しどろもどろ | 名詞・形容動詞語幹 | ADV (副詞) | Adverb usage |

`寒し` is not a broad-POS difference: both analyzers label it as an adjective, and Suzume returns the lemma 寒い.

### POS Granularity

Suzume's basic POS (`pos`) uses a simpler tag set than MeCab's detailed subcategories.

| MeCab | Suzume `pos` |
|-------|--------|
| 名詞,一般 | NOUN |
| 名詞,固有名詞,地域 | NOUN |
| 名詞,サ変接続 | NOUN |
| 名詞,副詞可能 | NOUN |
| 動詞,自立 | VERB |
| 動詞,非自立 | AUX (default) |

The 動詞,非自立 subcategory maps to `AUX` by default. A small set of subsidiary verbs (すぎる, くださる, あげる, くれる, もらう, いく, いる, …) is not blanket-mapped: they stay `VERB` in independent use, and context rules such as the [て-form classification](#て-form-auxiliaries) above assign `AUX` where they act as auxiliaries.

The `extendedPos` field provides Suzume's own finer-grained taxonomy. The following rows show rough MeCab feature analogues, but a MeCab label does not by itself cause the corresponding Suzume value; dictionary flags, structure, and context determine it.

| Rough MeCab feature analogue | Suzume `extendedPos` |
|-------------------------------|---------------------|
| 名詞,固有名詞 | `NOUN_固有` |
| 名詞,固有名詞,人名 | `NOUN_名` / `NOUN_姓` |
| 名詞,数 | `NOUN_数` |
| 名詞,サ変接続 | `NOUN_転成` |
| 名詞,形式名詞 | `NOUN_形式` |
| 動詞,連用形 | `VERB_連用` |
| 動詞,未然形 | `VERB_未然` |
| 動詞, 活用形=仮定縮約1 | `VERB_仮定縮約` |
| 形容詞,連用形 | `ADJ_連用` |
| 形容動詞語幹 | `ADJ_NA` |
| 助動詞, 活用型=文語・キ | `AUX_文語過去キ` |
| 助詞,格助詞 | `PART_格` |
| 助詞,係助詞 | `PART_係` |

`extendedPos` is not a drop-in replacement for MeCab dictionary features. For example, a proper noun or number can remain plain `NOUN` when Suzume has no dictionary or structural evidence for a narrower class. See the [API Reference](/docs/api) ExtendedPOS section for the full list.
