# Differences from MeCab

Suzume takes a fundamentally different approach to Japanese tokenization than MeCab. This page documents the intentional design differences and known constraints.

The source of truth for intentional differences is the [Python MeCab normalization pipeline](https://github.com/libraz/suzume/tree/main/scripts/mcp/src/suzume_mcp/core) used to generate test expectations. The rule families below are grouped by their practical purpose.

::: info Reading the comparisons
In each comparison the **MeCab** row uses MeCab's Japanese POS names, and the **Suzume** row uses the public API tags (`NOUN`, `VERB`, `ADJ`, …) with the Japanese POS name shown next to each code. A colored underline marks every token, so where the two tokenizers split or merge is visible at a glance.
:::

## Design Philosophy

::: info Suzume is a Tokenizer, Not a Morphological Analyzer
MeCab is a morphological analyzer — its goal is to decompose text into morphemes with detailed grammatical information. Suzume is a **tokenizer** — its goal is to split text into meaningful units for practical applications like search, display, and text processing. Morphological analysis is not a goal of Suzume. This fundamental difference in purpose explains many of the behavioral differences described below.
:::

| | MeCab | Suzume |
|--|-------|--------|
| **Approach** | Dictionary-driven | Feature-driven |
| **Dictionary** | 50MB+ (required) | Minimal (~<WasmSize /> gzipped, WASM included) |
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

<TokenDiff
  input="経済成長"
  mecab="経済(名詞) / 成長(名詞)"
  suzume="経済成長(NOUN)"
/>

<TokenDiff
  input="開始予定"
  mecab="開始(名詞) / 予定(名詞)"
  suzume="開始予定(NOUN)"
/>

<Why>

Without a full dictionary, Suzume cannot determine where to split kanji compounds. Merging is the safer choice — an over-merged token still captures the correct text span. User dictionaries can be used to define specific split points.

</Why>

### 2. Katakana Compound Merging

Consecutive katakana sequences are merged into a single noun token.

<TokenDiff
  input="サンプルデータ"
  mecab="サンプル(名詞) / データ(名詞)"
  suzume="サンプルデータ(NOUN)"
/>

<TokenDiff
  input="セットリスト"
  mecab="セット(名詞) / リスト(名詞)"
  suzume="セットリスト(NOUN)"
/>

<Why>

Same reason as kanji — without dictionary entries for each loanword, splitting would be unreliable. Katakana words are almost always loanword nouns, so merging as a single noun is correct.

</Why>

### 3. Number + Unit Merging

Numbers followed by counters/units are merged into a single token. Includes large number units (万, 億, 兆), decimal numbers, percentages, and alphabetic units.

<TokenDiff input="3人" mecab="3 / 人" suzume="3人(NOUN)" />

<TokenDiff input="100円" mecab="100 / 円" suzume="100円(NOUN)" />

<TokenDiff input="3.14" mecab="3 / . / 14" suzume="3.14(NOUN)" />

Suzume also preserves search-unit boundaries around quantities.

<TokenDiff input="徒歩五分" mecab="徒歩 / 五 / 分" suzume="徒歩 / 五分(NOUN)" />

<TokenDiff input="三ヶ月間入院" mecab="三 / ヶ月 / 間 / 入院" suzume="三ヶ月間(NOUN) / 入院" />

<Why>

In most application contexts (search, tagging, display), units such as "3人" and "三ヶ月間" are more useful when kept whole and separated from adjacent nouns.

</Why>

### 4. Date Merging

Full date expressions are merged into a single token.

<TokenDiff
  input="2024年12月23日"
  mecab="2024 / 年 / 12 / 月 / 23 / 日"
  suzume="2024年12月23日(NOUN)"
/>

<Why>

Dates are atomic units of meaning. Splitting them provides no practical benefit for tokenization.

</Why>

### 5. Nai-Adjective Handling

Certain adjectives ending in ない are treated as single lexical units rather than being split.

<TokenDiff input="だらしない" mecab="だらし(名詞) / ない(形容詞)" suzume="だらしない(ADJ)" />

Main examples handled as one token: だらしない, つまらない, もったいない, くだらない, いたたまれない, ものたりない, こころもとない

<Why>

These words function as indivisible adjectives in modern Japanese. The "stem + ない" split is etymologically correct but not useful for NLP applications.

</Why>

### 6. Slang/Modern Word Support

Modern colloquial adjectives and verbs are recognized natively.

<TokenDiff input="エモい" mecab="エモ(名詞) / い(動詞)" suzume="エモい(ADJ)" />

Supported adjectives: エモい, キモい, ウザい, ダサい, イタい

Supported verbs: バズる, パクる

<Why>

MeCab's dictionary does not include modern slang. Suzume recognizes common slang adjective and verb patterns, including their conjugated forms (エモかった, バズった, etc.).

</Why>

### 7. Compound Verb Merging

Verb stems in 連用形 followed by subsidiary verbs are merged into compound verbs.

<TokenDiff input="食べ続ける" mecab="食べ / 続ける" suzume="食べ続ける(VERB)" />

Supported V2 elements include: 込む, 出す, 続く, 返す, 合う, 直す, 切る, 上がる, 抜く, こもる, 続ける, つける, 替える, 合わせる, 上げる, 下げる, 掛ける, 入れる, etc. (40+ patterns)

<Why>

Compound verbs function as single lexical units in Japanese. Splitting them loses the compound meaning.

</Why>

### 8. タリ活用副詞 Merging

Tari-conjugation adverb stems followed by と are merged into a single adverb.

<TokenDiff input="堂々と" mecab="堂々 / と" suzume="堂々と(ADV)" />

Applies to: 泰然, 堂々, 悠々, 淡々, 粛々, 颯爽, 毅然, 漫然, 茫然, 呆然, 唖然, 愕然, 断然, 俄然, 歴然, 整然, 雑然, 騒然, 憮然, 黙然, 昂然, 凛然, 厳然

<Why>

These stem+と combinations are conventionally used as adverbs and are more useful as single tokens.

</Why>

### 9. お/ご Prefix Handling

Suzume splits お/ご honorific prefixes from nouns but keeps them merged when they form inseparable lexemes.

<TokenDiff input="お茶" mecab="お茶(名詞)" suzume="お(PREFIX) / 茶(NOUN)" note="split — separable prefix" noteJa="分割 — 分離可能な接頭辞" />

Inseparable exceptions (omitted from the diff examples because both MeCab and Suzume keep them as one token) include: お金, お前, おかず, おでん, おもちゃ, おすすめ, おいら, おっさん, お疲れ様, お出で/おいで, and family terms (お母さん, お父さん, お兄ちゃん, お姉さん, おじさん, おばさん, おじいさん, おばあさん, etc.)

<Why>

In most contexts, お/ご are grammatical prefixes that should be separated. But some words have lexicalized with the prefix and splitting them would be incorrect.

</Why>

### 10. Honorific Suffix Splitting and Hiragana Nicknames

Honorific suffixes are split from names.

Applies to suffixes: さん, ちゃん, 様, 君, 殿, さま

Exceptions: Family terms like お兄ちゃん, お母さん are kept as single tokens.

Short nicknames made from a two- or three-character hiragana stem followed by ちゃん, くん, or さん are also merged as a search unit. Names written in kanji or katakana still split from their honorific.

<TokenDiff input="わんちゃん" mecab="わん / ちゃん" suzume="わんちゃん(NOUN)" />

<Why>

Separating an honorific is more useful for ordinary names, while a short hiragana nickname is normally searched as a whole.

</Why>

### 11. URL / Mention / ASCII Hashtag Handling

URLs, @mentions, and ASCII #hashtags are merged into single tokens. A hashtag containing Japanese text is not currently guaranteed to remain atomic.

<TokenDiff
  input="https://example.com にアクセス"
  mecab="https / :// / example / . / com / に / アクセス"
  suzume="https://example.com / に / アクセス"
/>

<TokenDiff
  input="@user_name に送信"
  mecab="@ / user / _ / name / に / 送信"
  suzume="@user_name / に / 送信"
/>

<TokenDiff
  input="#topicについて"
  mecab="# / topic / について"
  suzume="#topic / について"
/>

<Why>

These are atomic identifiers in modern text. Splitting them provides no benefit.

</Why>

### 12. Prolonged Sound Mark Handling

Prolonged sound marks (ー) are merged with the preceding token, and consecutive marks are normalized to one.

<TokenDiff input="そうー" mecab="そう(副詞) / ー(名詞)" suzume="そうー(ADJ)" />

<TokenDiff input="すごーーい" mecab="すご(形容詞) / ーー(名詞) / い(名詞)" suzume="すごーーい(ADJ, lemma: すごい)" />

<Why>

Prolonged sounds are part of the word they modify. Consecutive marks remain in the surface, while the lemma is normalized to the ordinary form.

</Why>

### 13. Split Rules

Suzume splits certain MeCab tokens that should be separate units.

**ったら topic particle:**

<TokenDiff input="あなたったら" mecab="あな(名詞) / たっ(動詞) / たら(助動詞)" suzume="あなた(PRON) / ったら(PARTICLE)" />

**ってば emphatic particle:**

<TokenDiff input="もうってば" mecab="も(助詞) / うっ(動詞) / て(助詞) / ば(助詞)" suzume="もう(ADV) / ってば(PARTICLE)" />

**Plural suffix ら:**

<TokenDiff input="彼ら" mecab="彼ら(名詞・代名詞)" suzume="彼(PRON) / ら(SUFFIX)" />

**Kanji adverb + に:**

<TokenDiff input="次に" mecab="次に(副詞)" suzume="次(NOUN) / に(PARTICLE)" />

### 14. Causative-Passive Split

MeCab sometimes merges godan verb 未然形 + causative さ into one token. Suzume normalizes this inconsistency.

<TokenDiff input="飲まされた" mecab="飲まさ(動詞) / れ(動詞・接尾) / た(助動詞)" suzume="飲ま(VERB) / さ(VERB) / れ(AUX) / た(AUX)" />

<Why>

MeCab is inconsistent — it splits some causative-passive forms (読ま + さ + れた) but merges others (飲まさ + れた). Suzume normalizes all cases.

</Why>

### 15. Kango + として Adverb Split

MeCab treats kango + として as a single adverb. Suzume splits it into the adverb form + する conjugation.

<TokenDiff input="依然として" mecab="依然として(副詞)" suzume="依然と(ADV) / し(VERB) / て(PARTICLE)" />

<Why>

These are taru-adjective adverb forms (漢語 + と) followed by する conjugation. Splitting provides more accurate grammatical structure.

</Why>

### 16. Prefecture + City Split

Prefecture-city compound nouns are split at administrative boundaries.

<TokenDiff input="神奈川県横浜市" mecab="神奈川 / 県 / 横浜 / 市" suzume="神奈川県 / 横浜市" note="split at the 県 / 市 boundary" noteJa="県／市の境界で分割" />

Note: This split rule applies only to the `県+市` pattern. Other combinations like `都+区` (東京都新宿区) or `府+市` (大阪府大阪市) are merged into single tokens by the proper noun merging rule in §21.

<Why>

Prefecture and city are distinct administrative levels, and splitting at their boundary is useful for search and geocoding.

</Why>

### 17. Copula Negation Normalization

MeCab analyzes じゃ as a conjunction and ない as an adjective. Suzume consistently treats the copula and negative as auxiliaries. Dictionary variants that emit じゃない as one token are normalized to the same boundary, and the following forms なく, なかっ, and な are handled the same way.

<TokenDiff input="じゃない" mecab="じゃ(接続詞) / ない(形容詞)" suzume="じゃ(AUX, lemma: だ) / ない(AUX)" />

<Why>

Splitting copula and negation allows for more granular grammatical analysis.

</Why>

### 18. Technical Text Merging

Technical identifiers are merged into single tokens.

**Snake_case identifiers:**

<TokenDiff input="user_name" mecab="user / _ / name" suzume="user_name" />

**Version numbers:**

<TokenDiff input="v1.2.3" mecab="v / 1 / . / 2 / . / 3" suzume="v1.2.3" />

**ASCII name + number:**

<TokenDiff input="Model15" mecab="Model / 15" suzume="Model15" />

**ASCII dot notation:**

<TokenDiff input="console.log" mecab="console / . / log" suzume="console.log" />

<Why>

These are atomic identifiers in technical text. Splitting them provides no benefit.

</Why>

### 19. Noun + Suffix Merging

Nouns followed by single-character suffixes are merged.

<TokenDiff input="報告書" mecab="報告 / 書" suzume="報告書(NOUN)" />

<TokenDiff input="成功率" mecab="成功 / 率" suzume="成功率(NOUN)" />

Applies to suffixes: 書, 誌, 時, 率, 性

<Why>

These noun + suffix combinations function as single lexical units.

</Why>

### 20. ずに Merging

The negative auxiliary ず and the following particle に are merged as one compound grammatical unit.

<TokenDiff input="食べずに" mecab="食べ / ず / に" suzume="食べ / ずに" />

<Why>

ずに functions as a cohesive search unit meaning "without doing." かも and のに are omitted as differences because current MeCab already emits each as one token.

</Why>

### 21. Proper Noun + Region Merging

Consecutive proper nouns with region suffixes are merged.

<TokenDiff input="東京都新宿区" mecab="東京 / 都 / 新宿 / 区" suzume="東京都新宿区(NOUN)" note="place name" noteJa="地名" />

<Why>

Place names consisting of multiple geographic components should be treated as single entities for search and display.

</Why>

### 22. Verb Stem + 方 Merging

When the formal noun 方 follows a verb stem, Suzume merges the expression into one search unit denoting a method.

<TokenDiff input="走り方" mecab="走り / 方" suzume="走り方(NOUN)" />

<Why>

A "verb + 方" expression is a lexical search unit for a method, so keeping it with the verb stem is more useful for search.

</Why>

### 23. Unified たがる Handling

The desiderative-observation auxiliary たがる, including its inflected forms, is kept as a single auxiliary token.

<TokenDiff input="食べたがる" mecab="食べ / た / がる" suzume="食べ(VERB) / たがる(AUX, lemma: たがる)" />

<Why>

In this construction, た and がる do not express past tense plus an independent verb; together they form the auxiliary meaning "show signs of wanting to."

</Why>

### 24. Formal Noun ふう Normalization

ふうに after a demonstrative determiner is split into its grammatical determiner, formal-noun, and particle units.

<TokenDiff input="そんなふうに" mecab="そんなふうに(副詞)" suzume="そんな(DET) / ふう(NOUN) / に(PARTICLE)" />

### 25. Indefinite か Splitting

The indefinite particle か is split from an interrogative pronoun. A following existential いる is then treated as a main verb.

<TokenDiff input="なにかいる" mecab="なにか / いる" suzume="なに(PRON) / か(PARTICLE) / いる(VERB)" />

<Why>

Here か is a particle that creates an indefinite expression rather than part of the pronoun, and いる is existential rather than a progressive auxiliary.

</Why>

## POS Classification Differences

MeCab and Suzume use different POS classification strategies, resulting in different labels for the same words. Suzume applies 150+ rules for its own POS classification system.

### Adjective-Derived よく

MeCab lexicalizes よく as an adverb. Suzume assigns `ADJ` as the continuative form of よい:

<TokenDiff input="よくある質問" mecab="よく(副詞) / ある(動詞) / 質問(名詞)" suzume="よく(ADJ) / ある(DET) / 質問(NOUN)" />

Ordinary adjective continuative forms such as 美しく are omitted because current MeCab also classifies them as adjectives.

### Pronoun Recognition

MeCab classifies many pronouns as plain nouns. Suzume assigns `PRON`:

<TokenDiff input="みんなで行こう" mecab="みんな(名詞・代名詞) / で(助詞) / 行こ(動詞) / う(助動詞)" suzume="みんな(PRON) / で(PARTICLE) / 行こ(VERB) / う(AUX)" />

Applies to: あなた, あんた, みんな, みな, 皆, 某, 拙者, 我輩, 彼女, 彼氏, 奴, 我, わし, いくら (interrogative)

Suzume also assigns `PRON` to the colloquial pronouns どいつ, こいつ, そいつ, and あいつ. If a MeCab dictionary variant splits the surface, the normalization pipeline restores one token.

<TokenDiff input="こいつは" mecab="こいつ(名詞) / は(助詞)" suzume="こいつ(PRON) / は(PARTICLE)" />

### Na-Adjective Recognition

MeCab classifies na-adjective stems as nouns (形容動詞語幹). Suzume recognizes them as adjectives:

<TokenDiff input="きれいな花" mecab="きれい(名詞) / な / 花" suzume="きれい(ADJ) / な / 花" />

Applies to: きれい, しずか, おだやか, げんき, しんちょう, ありきたり, 無限, 滅多

Note: Some 形容動詞語幹 intentionally remain `NOUN`: マジ, 不安, 不要, 乙, 不便, 公式, 可能, 容易, 積極, 健康, 傍若無人

### て-Form Auxiliary Classification

Auxiliary いる and trial みる after て/で receive `AUX`. The independent verb 見る remains `VERB`:

<TokenDiff input="食べている" mecab="食べ / て / いる(動詞)" suzume="食べ / て(PARTICLE) / いる(AUX)" />

<TokenDiff input="食べてみる" mecab="食べ / て / みる(動詞)" suzume="食べ / て(PARTICLE) / みる(AUX)" />

### Purpose Expressions and Subsidiary ゆく

A hiragana verb stem before に plus a motion verb is classified as a nominal search unit expressing purpose. In literary "verb stem + ゆく/いく" expressions, the second element is treated as a verb.

<TokenDiff input="およぎに行く" mecab="およぎ(動詞) / に(助詞) / 行く(動詞)" suzume="およぎ(NOUN) / に / 行く" />

<TokenDiff input="散りゆく" mecab="散り(動詞) / ゆく(動詞・非自立)" suzume="散り(VERB) / ゆく(VERB)" />

### Restoring Hiragana Verb Inflections

When MeCab analyzes a short pure-hiragana nasal sound change as a noun, Suzume restores the verb and its lemma from the following だ/で and the inflection pattern. A Godan-wa verb whose final う was split as an auxiliary is also restored to one token.

<TokenDiff input="かんで" mecab="かん(名詞) / で(助詞)" suzume="かん(VERB, lemma: かむ) / で" />

<TokenDiff input="つかう" mecab="つか(動詞・未然形, lemma: つく) / う(助動詞)" suzume="つかう(VERB)" />

### Verb Stems in Honorific Requests

In "お/ご + verb stem + くださる/いたす/いただく" constructions, a stem that is homographic with a noun is restored to a verb from the grammatical structure.

<TokenDiff input="お立ちください" mecab="お立ち(名詞) / ください(動詞)" suzume="お(PREFIX) / 立ち(VERB, lemma: 立つ) / ください(VERB)" />

### Context-Dependent POS

Suzume applies context-aware POS classification for several ambiguous words:

**そう:** `ADJ` before a copula (そうだ = hearsay), `AUX` after an auxiliary (しまいそう = appearance), and `ADV` otherwise.

**でも:** `PARTICLE` after interrogatives (何でも) and `CONJ` at sentence or clause boundaries (でも、...).

**いかが:** `ADV` when not before a copula and `PRON` before a copula (いかがですか).

**大変:** `ADJ` before な (大変な) and `ADV` otherwise (大変良い).

### Particle Classification

MeCab classifies certain particles as nouns in some contexts. Suzume applies context-aware classification for 30+ particles:

<TokenDiff input="行くのは大変" mecab="行く / の(名詞・非自立) / は / 大変" suzume="行く / の(PARTICLE) / は / 大変" />

The nominalizer の functions as a particle here, not a noun. Suzume classifies such cases as particles.

### Katakana Onomatopoeia

MeCab classifies katakana onomatopoeia (reduplication patterns) as nouns. Suzume recognizes them as adverbs:

<TokenDiff input="ドキドキする" mecab="ドキドキ(名詞・サ変接続) / する(動詞)" suzume="ドキドキ(ADV) / する(VERB)" />

Onomatopoeia + っと patterns are also merged:

<TokenDiff input="どきっとする" mecab="どき / っと / する" suzume="どきっと(ADV) / する" />

### で+ある Copula Handling

Suzume applies context-aware classification for the copula である pattern:

<TokenDiff input="重要である" mecab="重要(名詞・形容動詞語幹) / で(助動詞) / ある(助動詞)" suzume="重要(ADJ) / で(AUX, lemma: だ) / ある(VERB)" />

<TokenDiff input="問題であった" mecab="問題(名詞・ナイ形容詞語幹) / で(助動詞) / あっ(助動詞) / た(助動詞)" suzume="問題(NOUN) / で(PARTICLE) / あっ(VERB, lemma: ある) / た(AUX)" />

### ない Context-Dependent Classification

Suzume assigns `ADJ` rather than `AUX` to ない/なく/なかっ when they function as an existence adjective:

<TokenDiff input="時間がない" mecab="時間(名詞) / が(助詞) / ない(形容詞)" suzume="時間(NOUN) / が(PARTICLE) / ない(ADJ)" note="existence negation" noteJa="存在の否定" />

<TokenDiff input="食べない" mecab="食べ(動詞) / ない(助動詞)" suzume="食べ(VERB) / ない(AUX)" note="negation auxiliary" noteJa="否定の助動詞" />

<TokenDiff input="仕方ない" mecab="仕方(名詞・ナイ形容詞語幹) / ない(助動詞)" suzume="仕方(NOUN) / ない(ADJ)" note="lexical adjective" noteJa="語彙的形容詞" />

### Per-Word POS Differences

The following words are classified differently between MeCab and Suzume:

| Word | MeCab | Suzume | Reason |
|------|-------|--------|--------|
| なら | 接続詞 | VERB (動詞) | Parsed as the irrealis form of なる |
| 違い | 名詞・ナイ形容詞語幹 | VERB (動詞) | Continuative form of 違う |
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
| よう | 感動詞 | AUX (助動詞) | Volitional auxiliary |
| 時々 | 副詞 | NOUN (名詞) | Noun usage |
| 遥か | 副詞 | ADJ (形容詞) | Na-adjective |
| どう | 副詞 | ADJ (形容詞) | Na-adjective |
| まじ | 助動詞 | ADJ (形容詞) | Adjective (katakana マジ stays NOUN) |
| っていう | 助詞 | DET (連体詞) | Determiner |
| という | 助詞 | DET (連体詞) | Determiner |
| まして | 副詞 | CONJ (接続詞) | Conjunction |
| いわば | 副詞 | CONJ (接続詞) | Conjunction (言わば) |
| 寒し | 形容詞 | NOUN (名詞) | Archaic noun form |
| 付け | 名詞 | VERB (動詞) | Continuative form of 付ける |
| むしろ | 副詞 | OTHER (その他) | Other |
| その後 | 名詞・副詞可能 | ADV (副詞) | Adverb usage |
| しどろもどろ | 名詞・形容動詞語幹 | ADV (副詞) | Adverb usage |

## Constraints

These are known limitations arising from Suzume's feature-based architecture.

### Cannot Split Merged Compounds

Since Suzume uses character-type features rather than a dictionary for compound word boundaries, **it cannot split kanji or katakana sequences that should be separate words**.

<TokenDiff input="東京都庁前" mecab="東京 / 都庁 / 前" suzume="東京都庁前(NOUN)" note="Suzume cannot determine the internal boundaries; MeCab splits them from its dictionary" noteJa="Suzume は内部境界を判定できず、MeCab は辞書に基づいて分割します" />

**Workaround:** Use the [user dictionary](/docs/user-dictionary) to register specific words that need to be recognized as separate tokens.

```typescript
suzume.loadUserDictionary('東京都庁,NOUN')
```

### Context-Dependent POS Classification

Suzume's feature-based model sometimes cannot distinguish POS that requires dictionary knowledge or deep context. The major patterns:

**Auxiliary vs Main Verb**

When subsidiary verbs follow て-form, Suzume may classify them as main verbs:

<TokenDiff input="確認してあります" mecab="確認(名詞) / し(動詞) / て(助詞) / あり(動詞・非自立) / ます(助動詞)" suzume="確認(NOUN) / し(VERB) / て(PARTICLE) / あり(VERB) / ます(AUX)" />

Affects: ある, おく, いく, くる after て-form. Trial みる is recognized, but Suzume cannot always determine whether the remaining forms function as subsidiary (auxiliary) or main verbs.

**Verb Renyokei vs Noun**

Verb stems used as nouns (nominalization) can be ambiguous:

<TokenDiff input="東京行きは何番線ですか" mecab="東京(名詞) / 行き(名詞・接尾) / は(助詞) / …" suzume="東京(NOUN) / 行き(VERB) / は(PARTICLE) / …" />

### POS Granularity

Suzume's basic POS (`pos`) uses a simpler tag set than MeCab's detailed subcategories.

| MeCab | Suzume `pos` |
|-------|--------|
| 名詞,一般 | NOUN |
| 名詞,固有名詞,地域 | NOUN |
| 名詞,サ変接続 | NOUN |
| 名詞,副詞可能 | NOUN |
| 動詞,自立 | VERB |
| 動詞,非自立 | VERB |

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

## When to Use Which

| Use Case | Recommendation |
|----------|---------------|
| Browser / client-side apps | **Suzume** — no server required |
| Search indexing / tag extraction | **Suzume** — compound merging is often desirable |
| Academic research / corpus analysis | **MeCab** — maximum accuracy and POS detail |
| Real-time UI (input-as-you-type) | **Suzume** — fast, no network latency |
| Precise compound word splitting | **MeCab** — dictionary-driven boundaries |
| Handling unknown / modern words | **Suzume** — robust to unseen vocabulary |
