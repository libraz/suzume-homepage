# POS Classification vs MeCab

MeCab and Suzume use different POS classification strategies, so the same token can carry a different label in each. Suzume applies its own feature and context rules to assign the public POS taxonomy (`NOUN`, `VERB`, `ADJ`, …). MeCab's granularity mirrors its dictionary, which is coarse for modern and colloquial usage — slang, newer pronouns, and na-adjective stems often land in plain 名詞 — while Suzume folds those into its compact tag set by context.

::: tip Looking for token boundary differences?
This page covers how tokens are labeled. For where token boundaries differ — merging, splitting, and normalization — see [Differences from MeCab](/docs/mecab-comparison).
:::

::: info Reading the comparisons
In each comparison the **MeCab** row uses MeCab's Japanese POS names, and the **Suzume** row uses the public API tags (`NOUN`, `VERB`, `ADJ`, …) with the Japanese POS name shown next to each code. A colored underline marks every token, so where the two tokenizers split or merge is visible at a glance.
:::

## Adjective-Derived よく

MeCab lexicalizes よく as an adverb. Suzume assigns `ADJ` as the continuative form of よい:

<TokenDiff input="よくある質問" mecab="よく(副詞) / ある(動詞) / 質問(名詞)" suzume="よく(ADJ) / ある(DET) / 質問(NOUN)" />

Ordinary adjective continuative forms such as 美しく are omitted because current MeCab also classifies them as adjectives.

## Pronoun Recognition

MeCab classifies many pronouns as plain nouns. Suzume assigns `PRON`:

<TokenDiff input="みんなで行こう" mecab="みんな(名詞・代名詞) / で(助詞) / 行こ(動詞) / う(助動詞)" suzume="みんな(PRON) / で(PARTICLE) / 行こ(VERB) / う(AUX)" />

Applies to: あなた, あんた, みんな, みな, 皆, 某, 拙者, 我輩, 彼女, 彼氏, 奴, 我, わし, いくら (interrogative)

Suzume also assigns `PRON` to the colloquial pronouns どいつ, こいつ, そいつ, and あいつ. If a MeCab dictionary variant splits the surface, the normalization pipeline restores one token.

<TokenDiff input="こいつは" mecab="こいつ(名詞) / は(助詞)" suzume="こいつ(PRON) / は(PARTICLE)" />

## Na-Adjective Recognition

MeCab classifies na-adjective stems as nouns (形容動詞語幹). Suzume recognizes them as adjectives:

<TokenDiff input="きれいな花" mecab="きれい(名詞) / な / 花" suzume="きれい(ADJ) / な / 花" />

Applies to: きれい, しずか, おだやか, げんき, しんちょう, ありきたり, 無限, 滅多

Note: Some 形容動詞語幹 intentionally remain `NOUN`: マジ, 不安, 不要, 乙, 不便, 公式, 可能, 容易, 積極, 健康, 傍若無人

## て-Form Auxiliaries

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

**Contracted progressive てる/でる** — the lemma stays いる:

<TokenDiff input="読んでる" mecab="読ん(動詞) / でる(動詞・非自立)" suzume="読ん(VERB, lemma: 読む) / でる(AUX, lemma: いる)" />

**Humble いただく** in polite requests (the negative ご確認いただけません follows the same pattern):

<TokenDiff input="ご確認いただけます" mecab="ご(接頭詞) / 確認(名詞) / いただけ(動詞・非自立) / ます(助動詞)" suzume="ご(PREFIX) / 確認(NOUN) / いただけ(AUX, lemma: いただける) / ます(AUX)" />

**Resultative てある is the exception** — ある keeps its existential meaning and remains `VERB`:

<TokenDiff input="並べてある" mecab="並べ(動詞) / て(助詞) / ある(動詞・非自立)" suzume="並べ(VERB) / て(PARTICLE) / ある(VERB)" />

## Purpose Expressions and Subsidiary ゆく

A hiragana verb stem before に plus a motion verb is classified as a nominal search unit expressing purpose. In literary "verb stem + ゆく/いく" expressions, the second element is treated as a verb.

<TokenDiff input="およぎに行く" mecab="およぎ(動詞) / に(助詞) / 行く(動詞)" suzume="およぎ(NOUN) / に / 行く" />

<TokenDiff input="散りゆく" mecab="散り(動詞) / ゆく(動詞・非自立)" suzume="散り(VERB) / ゆく(VERB)" />

## Restoring Hiragana Verb Inflections

When MeCab analyzes a short pure-hiragana nasal sound change as a noun, Suzume restores the verb and its lemma from the following だ/で and the inflection pattern. A Godan-wa verb whose final う was split as an auxiliary is also restored to one token.

<TokenDiff input="かんで" mecab="かん(名詞) / で(助詞)" suzume="かん(VERB, lemma: かむ) / で" />

<TokenDiff input="つかう" mecab="つか(動詞・未然形, lemma: つく) / う(助動詞)" suzume="つかう(VERB)" />

## Verb Stems in Honorific Requests

In "お/ご + verb stem + くださる/いたす/いただく" constructions, a stem that is homographic with a noun is restored to a verb from the grammatical structure.

<TokenDiff input="お立ちください" mecab="お立ち(名詞) / ください(動詞)" suzume="お(PREFIX) / 立ち(VERB, lemma: 立つ) / ください(VERB)" />

## Suffix Recognition

Productive derivational suffixes receive the dedicated `SUFFIX` tag, and the stem keeps its own class and lemma.

**Nominalizer さ** turns an adjective into a noun; Suzume keeps the adjective stem visible:

<TokenDiff input="暖かさ" mecab="暖か(名詞・形容動詞語幹) / さ(名詞・接尾)" suzume="暖か(ADJ, lemma: 暖かい) / さ(SUFFIX)" />

**X的 + な** is treated as one na-adjective:

<TokenDiff input="積極的な性格" mecab="積極(名詞) / 的(名詞・接尾) / な(助動詞) / 性格(名詞)" suzume="積極的(ADJ) / な(AUX, lemma: だ) / 性格(NOUN)" />

Suffixes that change token boundaries — 中, 抜き, 建て, and friends — are covered in [Differences from MeCab](/docs/mecab-comparison) instead.

## Deverbal Nouns

A verb continuative used as a noun keeps `NOUN`, even where a MeCab dictionary labels it a verb form:

<TokenDiff input="動きが速い" mecab="動き(動詞・連用形) / が(助詞) / 速い(形容詞)" suzume="動き(NOUN) / が(PARTICLE) / 速い(ADJ)" />

<TokenDiff input="付けの支払い" mecab="付け(動詞・連用形) / の(助詞) / 支払い(名詞)" suzume="付け(NOUN) / の(PARTICLE) / 支払い(NOUN)" />

The same applies to 違い and 推し in the [per-word table](#per-word-pos-differences) below.

## Context-Dependent POS

Suzume applies context-aware POS classification for several ambiguous words:

**そう:** `ADJ` before a copula (そうだ = hearsay), `AUX` after an auxiliary (しまいそう = appearance), and `ADV` otherwise.

**でも:** normalized to `PARTICLE` in all uses:

<TokenDiff input="何でも良い" mecab="何(名詞) / でも(助詞) / 良い(形容詞)" suzume="何(PRON) / でも(PARTICLE) / 良い(ADJ)" />

**いかが:** `ADV` when not before a copula; before a copula (いかがですか) it keeps MeCab's noun classification.

**大変:** `ADJ` before な (大変な) and `ADV` otherwise (大変良い).

**どう:** `ADJ` generally, but `ADV` inside か…どうか / どうか:

<TokenDiff input="かどうか" mecab="か(助詞) / どう(副詞) / か(助詞)" suzume="か(OTHER) / どう(ADV) / か(PARTICLE)" />

**よう:** the volitional う after a 未然形 is `AUX`, while the formal noun よう in ように/ような is `NOUN`:

<TokenDiff input="見よう" mecab="見(動詞) / よう(助動詞)" suzume="見よ(VERB, lemma: 見る) / う(AUX)" />

<TokenDiff input="ような" mecab="よう(名詞・非自立) / な(助動詞)" suzume="よう(NOUN) / な(AUX, lemma: だ)" />

**なら:** the conditional stays a particle, but before a negative (ならない) and standalone it parses as the verb なる.

## Particle Classification

MeCab classifies certain particles as nouns in some contexts. Suzume applies context-aware classification for 30+ particles:

<TokenDiff input="行くのは大変" mecab="行く / の(名詞・非自立) / は / 大変" suzume="行く / の(PARTICLE) / は / 大変" />

The nominalizer の functions as a particle here, not a noun. Suzume classifies such cases as particles.

## Colloquial Copulas and Particles

Colloquial copulas and particles that dictionary taxonomies handle unevenly are normalized to consistent tags:

| Example | Word | Suzume | Role |
|---------|------|--------|------|
| いいっすね | っす | `AUX` (lemma: です) | Casual copula |
| いいじゃん | じゃん | `PARTICLE` | Colloquial sentence-final particle |
| 夢みたい | みたい | `AUX` | Similative auxiliary |
| 私なんか | なんか | `PARTICLE` | Deprecatory/exemplifying particle |
| 英語はおろか | おろか | `PARTICLE` | "Let alone" particle |
| そうや | や | `PARTICLE` | Kansai sentence-final particle |

## Katakana Onomatopoeia

MeCab classifies katakana onomatopoeia (reduplication patterns) as nouns. Suzume recognizes them as adverbs:

<TokenDiff input="ドキドキする" mecab="ドキドキ(名詞・サ変接続) / する(動詞)" suzume="ドキドキ(ADV) / する(VERB)" />

Mimetics ending in っと are also kept whole as adverbs:

<TokenDiff input="ぴかぴかっと光る" mecab="ぴかぴかっ(副詞) / と(助詞) / 光る(動詞)" suzume="ぴかぴかっと(ADV) / 光る(VERB)" />

<TokenDiff input="ぷるんっとした" mecab="ぷるんっ(副詞) / と(助詞) / し(動詞) / た(助動詞)" suzume="ぷるんっと(ADV) / し(VERB, lemma: する) / た(AUX)" />

## で+ある Copula Handling

Suzume applies context-aware classification for the copula である pattern:

<TokenDiff input="重要である" mecab="重要(名詞・形容動詞語幹) / で(助動詞) / ある(助動詞)" suzume="重要(ADJ) / で(AUX, lemma: だ) / ある(VERB)" />

<TokenDiff input="問題であった" mecab="問題(名詞・ナイ形容詞語幹) / で(助動詞) / あっ(助動詞) / た(助動詞)" suzume="問題(NOUN) / で(PARTICLE) / あっ(VERB, lemma: ある) / た(AUX)" />

## ない Context-Dependent Classification

Suzume assigns `ADJ` rather than `AUX` to ない/なく/なかっ when they function as an existence adjective:

<TokenDiff input="時間がない" mecab="時間(名詞) / が(助詞) / ない(形容詞)" suzume="時間(NOUN) / が(PARTICLE) / ない(ADJ)" note="existence negation" noteJa="存在の否定" />

<TokenDiff input="食べない" mecab="食べ(動詞) / ない(助動詞)" suzume="食べ(VERB) / ない(AUX)" note="negation auxiliary" noteJa="否定の助動詞" />

<TokenDiff input="仕方ない" mecab="仕方(名詞・ナイ形容詞語幹) / ない(助動詞)" suzume="仕方(NOUN) / ない(ADJ)" note="lexical adjective" noteJa="語彙的形容詞" />

## Per-Word POS Differences

The following words are classified differently between MeCab and Suzume:

| Word | MeCab | Suzume | Reason |
|------|-------|--------|--------|
| なら | 接続詞 | PARTICLE / VERB (文脈依存) | Conditional particle by default; parsed as the verb なる before negatives or standalone |
| 違い | 名詞・ナイ形容詞語幹 | NOUN (名詞) | Deverbal noun (違いない → 違い + ない) |
| 推し | 動詞 | NOUN (名詞) | Modern noun usage |
| 嫌い | 動詞 | ADJ (形容詞) | Na-adjective |
| 大変 | 名詞・形容動詞語幹 | ADV (副詞) | Adverb usage |
| 超 | 接頭詞 | NOUN (名詞) | Modern usage |
| びっくり | 名詞・サ変接続 | ADV (副詞) | Adverb usage |
| なるほど | 感動詞 | ADV (副詞) | Adverb usage |
| たくさん | 名詞・副詞可能 | ADV (副詞) | Adverb usage |
| いずれ | 名詞・代名詞 | ADV (副詞) | Adverb usage |
| おめでとう | 感動詞 | ADV (副詞) | Adverb usage |
| じゃ / ん | 接続詞 + 終助詞 | AUX + AUX (助動詞) | Parsed as copula plus sentence-final form |
| よう | 感動詞 | AUX / NOUN (文脈依存) | Volitional う after 未然形 (見よ + う); formal noun in ように / ような |
| 時々 | 副詞 | NOUN (名詞) | Noun usage |
| 遥か | 副詞 | ADJ (形容詞) | Na-adjective |
| どう | 副詞 | ADJ (形容詞) | ADJ generally; ADV inside か…どうか |
| まじ | 助動詞 | ADJ (形容詞) | Adjective (katakana マジ stays NOUN) |
| っていう | 助詞 | DET (連体詞) | Determiner |
| という | 助詞 | DET (連体詞) | Determiner |
| まして | 副詞 | CONJ (接続詞) | Conjunction |
| いわば | 副詞 | CONJ (接続詞) | Conjunction (言わば) |
| 寒し | 形容詞 | NOUN (名詞) | Archaic noun form |
| むしろ | 副詞 | ADV (副詞) | Adverb usage (むしろ嬉しい → むしろ + 嬉しい) |
| その後 | 名詞・副詞可能 | ADV (副詞) | Adverb usage |
| しどろもどろ | 名詞・形容動詞語幹 | ADV (副詞) | Adverb usage |

## POS Granularity

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

However, the `extendedPos` field provides finer-grained subcategories:

| MeCab subcategory | Suzume `extendedPos` |
|-------------------|---------------------|
| 名詞,固有名詞 | `NOUN_固有` |
| 名詞,固有名詞,人名 | `NOUN_名` / `NOUN_姓` |
| 名詞,数 | `NOUN_数` |
| 名詞,サ変接続 | `NOUN_転成` |
| 名詞,形式名詞 | `NOUN_形式` |
| 動詞,連用形 | `VERB_連用` |
| 動詞,未然形 | `VERB_未然` |
| 形容詞,連用形 | `ADJ_連用` |
| 形容動詞語幹 | `ADJ_NA` |
| 助詞,格助詞 | `PART_格` |
| 助詞,係助詞 | `PART_係` |

When MeCab-level subcategories are needed, `extendedPos` covers many of these cases. See the [API Reference](/docs/api) ExtendedPOS section for the full list.
