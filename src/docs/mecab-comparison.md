# Differences from MeCab

Suzume takes a fundamentally different approach to Japanese tokenization than MeCab. This page documents the intentional differences in **token boundaries** — where the two tools merge and split — plus known constraints and guidance on choosing between them.

The source of truth for intentional differences is the [Python MeCab normalization pipeline](https://github.com/libraz/suzume/tree/main/scripts/mcp/src/suzume_mcp/core) used to generate test expectations. The rule families below are grouped by their practical purpose.

## Comparison Baseline

Every MeCab boundary and displayed feature on this page was recorded from
**MeCab 0.996 with mecab-ipadic 2.7.0-20070801** (the UTF-8 IPA dictionary).
The labels abbreviate MeCab's comma-separated feature fields for readability;
the comparison does not rewrite its token boundaries. It invokes `mecab` with
the default configuration and no user dictionary. You can inspect the active
setup with:

```bash
mecab --version
mecab -D
```

MeCab's output depends on the selected dictionary, its costs, and user
dictionaries. UniDic, NEologd, or a customized IPA dictionary can produce
different boundaries and labels from the rows shown here. The normalization
pipeline linked above starts from this IPA-dictionary output and applies
Suzume's generalized comparison rules when generating test expectations.

::: tip Looking for POS label differences?
This page covers where tokens begin and end. For how the two tools **label** the same tokens — pronouns, na-adjectives, auxiliaries, and other POS assignments — see [POS Classification](/docs/pos-differences).
:::

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
| **Dictionary** | External dictionary required; size and output depend on the selected dictionary | Compact dictionaries included (~<WasmSize /> gzipped with the WASM package) |
| **Unknown words** | Falls back to character types | Pattern-based candidate generation |
| **Compound handling** | Boundaries follow the selected dictionary | Dictionary and structural rules; unknown runs may merge |
| **Target** | Detailed dictionary-based analysis | Compact search/display tokenization across browser, edge, and native runtimes |

::: tip Core Trade-off
MeCab follows the entries and costs in the selected dictionary, so changing the dictionary can change boundaries and labels. Suzume combines compact dictionaries with shared character, grammar, and connection rules; unknown same-script runs may stay merged when there is no evidence for an internal boundary.
:::

## Merging Rules

These rules keep sequences together as one token where a dictionary-driven analysis splits them — or where fragments would be useless as search units.

### Kanji Compounds

An unregistered kanji run with no dictionary or grammatical evidence for an internal boundary is normally kept as one noun candidate. Structural rules can still split forms such as `神奈川県 / 横浜市` and `会議 / 中`.

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

### Katakana Compounds

An unknown ordinary katakana run is normally kept as one noun candidate. Dictionary and shape rules can assign another POS, as with mimetic `ドキドキ(ADV)`.

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

Without dictionary or structural evidence for a boundary, splitting a katakana run would be unreliable. The noun candidate is a default that still competes with dictionary and mimetic candidates.

</Why>

### Mixed-Script Compounds

An alphabetic term followed by a katakana term is one compound noun.

<TokenDiff input="AIブーム" mecab="AI / ブーム" suzume="AIブーム(NOUN)" />

### Numbers and Units

Cardinal numbers followed by counters or units are normally merged into one quantity token. This includes large number units (万, 億, 兆), decimal numbers, percentages, and alphabetic units. Ordinal and structural suffix rules can split forms such as `第三 / 回`.

<TokenDiff input="3人" mecab="3 / 人" suzume="3人(NOUN)" />

<TokenDiff input="100円" mecab="100 / 円" suzume="100円(NOUN)" />

<TokenDiff input="3.14" mecab="3 / . / 14" suzume="3.14(NOUN)" />

Suzume also preserves search-unit boundaries around quantities.

<TokenDiff input="徒歩五分" mecab="徒歩 / 五 / 分" suzume="徒歩 / 五分(NOUN)" />

<TokenDiff input="三ヶ月間入院" mecab="三 / ヶ月 / 間 / 入院" suzume="三ヶ月間(NOUN) / 入院" />

The same merging applies beyond Arabic numerals.

**Kana-spelled quantities:**

<TokenDiff input="よんにん" mecab="よ(形容詞) / ん(名詞) / に(助詞) / ん(助詞)" suzume="よんにん(NOUN)" />

**Distributive quantities:**

<TokenDiff input="一語一語" mecab="一語(名詞) / 一(名詞) / 語(名詞)" suzume="一語一語(NOUN)" />

**Address and lot numbers:**

<TokenDiff input="1-2-3" mecab="1 / - / 2 / - / 3" suzume="1-2-3(NOUN)" />

**Ordinal 第 versus approximate 約:** the ordinal prefix 第 merges with its number, while the following counter stays a separate `SUFFIX` token. The approximation prefix 約 instead stays a separate `PREFIX`, and the number merges with its counter.

<TokenDiff input="第三回" mecab="第 / 三 / 回" suzume="第三(NOUN) / 回(SUFFIX)" />

<TokenDiff input="約三人" mecab="約 / 三 / 人" suzume="約(PREFIX) / 三人(NOUN)" />

<Why>

In most application contexts (search, tagging, display), units such as "3人" and "三ヶ月間" are more useful when kept whole and separated from adjacent nouns.

</Why>

### Dates

Full date expressions are merged into a single token.

<TokenDiff
  input="2024年12月23日"
  mecab="2024 / 年 / 12 / 月 / 23 / 日"
  suzume="2024年12月23日(NOUN)"
/>

<Why>

Dates are atomic units of meaning. Splitting them provides no practical benefit for tokenization.

</Why>

### Proper Nouns and Place Names

Many place-name components with region suffixes are merged. The structural `県+市` rule is an exception and splits the prefecture from the city.

<TokenDiff input="東京都新宿区" mecab="東京 / 都 / 新宿 / 区" suzume="東京都新宿区(NOUN)" note="place name" noteJa="地名" />

<Why>

Place names consisting of multiple geographic components should be treated as single entities for search and display.

</Why>

### Compound Verbs

Verb stems in 連用形 followed by subsidiary verbs are merged into compound verbs.

<TokenDiff input="食べ続ける" mecab="食べ / 続ける" suzume="食べ続ける(VERB)" />

Supported V2 elements include: 込む, 出す, 続く, 返す, 合う, 直す, 切る, 上がる, 抜く, こもる, 続ける, つける, 替える, 合わせる, 上げる, 下げる, 掛ける, 入れる, etc. (40+ patterns)

Grammaticalized subsidiaries such as 過ぎる and かねる are deliberately **not** merged — see [Subsidiary Auxiliary Splitting](#subsidiary-auxiliary-splitting).

<Why>

Compound verbs function as single lexical units in Japanese. Splitting them loses the compound meaning.

</Why>

### Closed Compound Particles

Closed expressions that function as one particle are kept whole.

<TokenDiff input="や否や" mecab="や(助詞) / 否や(名詞)" suzume="や否や(PARTICLE)" />

The selected IPA dictionary already emits expressions such as と共に and, in
some contexts, につれて as one token, so they are not boundary differences in
this baseline. Other dictionaries may split them.

<Why>

A compound particle is one grammatical word. Splitting it scatters meaningless one-character fragments into search indexes.

</Why>

### Negative ずに

The negative auxiliary ず and the following particle に are merged as one compound grammatical unit.

<TokenDiff input="食べずに" mecab="食べ / ず / に" suzume="食べ / ずに(AUX, lemma: ず)" />

<Why>

ずに functions as a cohesive search unit meaning "without doing."

</Why>

### Desiderative たがる

The desiderative-observation auxiliary たがる, including its inflected forms, is kept as a single auxiliary token.

<TokenDiff input="食べたがる" mecab="食べ / た / がる" suzume="食べ(VERB) / たがる(AUX, lemma: たがる)" />

<Why>

In this construction, た and がる do not express past tense plus an independent verb; together they form the auxiliary meaning "show signs of wanting to."

</Why>

### Fixed Colloquial Function Words

Fixed function words are kept whole even when a dictionary-driven analysis fragments them.

<TokenDiff input="散歩がてら" mecab="散歩 / が / てら" suzume="散歩(NOUN) / がてら(PARTICLE)" />

<TokenDiff input="そんなら" mecab="そん / なら" suzume="そんなら(CONJ)" />

がてら ("while, on the occasion of") is one particle, and the colloquial そんなら ("in that case") is one conjunction.

### Deverbal Compound Nouns

A verb continuative plus 会, and the destination suffix 行き, form single event/route nouns.

<TokenDiff input="飲み会" mecab="飲み / 会" suzume="飲み会(NOUN)" />

<TokenDiff input="東京行き" mecab="東京 / 行き" suzume="東京行き(NOUN)" />

<Why>

飲み会 and 東京行き are the units people actually search for. The verb origin of 飲み or 行き carries no value on its own here.

</Why>

### Nai-Adjectives

Certain adjectives ending in ない are treated as single lexical units rather than being split.

<TokenDiff input="だらしない" mecab="だらし(名詞・ナイ形容詞語幹) / ない(助動詞)" suzume="だらしない(ADJ)" />

Main examples handled as one token: だらしない, つまらない, もったいない, くだらない, いたたまれない, ものたりない, こころもとない

This is a closed word list — productive "stem + ない" combinations still split; see [Productive Negative Splitting](#productive-negative-splitting).

<Why>

These words function as indivisible adjectives in modern Japanese. The "stem + ない" split is etymologically correct but not useful for NLP applications.

</Why>

### Slang and Modern Words

Modern colloquial adjectives and verbs are recognized natively.

<TokenDiff input="エモい" mecab="エモ(名詞) / い(動詞)" suzume="エモい(ADJ)" />

Recognized examples include エモい, キモい, ウザい, ダサい, イタい, ヤバい, their hiragana variants, and compound i-adjectives.

Recognized verb examples include バズる, ググる, and パクる.

<Why>

The selected IPADIC baseline contains some colloquial words such as ダサい but lacks many newer entries. Suzume recognizes selected slang patterns and their conjugated forms (エモかった, バズった, ググった, etc.).

</Why>

### Tari-Adverbs

Tari-conjugation adverb stems followed by と are merged into a single adverb.

<TokenDiff input="堂々と" mecab="堂々 / と" suzume="堂々と(ADV)" />

Applies to: 泰然, 堂々, 悠々, 淡々, 粛々, 颯爽, 毅然, 漫然, 茫然, 呆然, 唖然, 愕然, 断然, 俄然, 歴然, 整然, 雑然, 騒然, 憮然, 黙然, 昂然, 凛然, 厳然

<Why>

These stem+と combinations are conventionally used as adverbs and are more useful as single tokens.

</Why>

### Noun + Single-Character Suffixes

The following closed set of noun + single-character suffix combinations is merged.

<TokenDiff input="報告書" mecab="報告 / 書" suzume="報告書(NOUN)" />

<TokenDiff input="成功率" mecab="成功 / 率" suzume="成功率(NOUN)" />

Applies to suffixes: 書, 誌, 時, 率, 性

<Why>

These noun + suffix combinations function as single lexical units.

</Why>

### Verb Stem + 方

When the formal noun 方 follows a short verb stem, Suzume merges the expression into one search unit denoting a method.

<TokenDiff input="走り方" mecab="走り / 方" suzume="走り方(NOUN)" />

Only short stems merge: the continuative must be at most two characters (走り方, やり方). Longer continuatives keep the boundary — 打ち合わせ方 stays 打ち合わせ / 方.

<Why>

A "verb + 方" expression is a lexical search unit for a method, so keeping it with the verb stem is more useful for search.

</Why>

### Everyday Hiragana Words

Common words normally written in hiragana are recognized as single tokens even without dictionary support, where analysis could otherwise fragment them: おととい, ひこうき, みっつ, and calendar compounds such as 翌営業日.

### Prolonged Sound Marks

Prolonged sound marks (ー) are merged with the preceding token.

<TokenDiff input="そうー" mecab="そう(副詞) / ー(名詞)" suzume="そうー(ADV)" />

<TokenDiff input="すごーーい" mecab="すご(形容詞) / ーー(名詞) / い(名詞)" suzume="すごーーい(ADJ, lemma: すごーーい)" />

<Why>

Prolonged sounds are part of the word they modify. Consecutive marks remain in both the surface and lemma so the analyzer does not invent an unobserved spelling.

</Why>

### Technical Text

Technical identifiers are merged into single tokens.

**Snake_case identifiers:**

<TokenDiff input="user_name" mecab="user / _ / name" suzume="user_name" />

**Version numbers:**

<TokenDiff input="v1.2.3" mecab="v / 1 / . / 2 / . / 3" suzume="v1.2.3" />

**ASCII name + number:**

<TokenDiff input="Model15" mecab="Model / 15" suzume="Model15" />

**ASCII dot notation:**

<TokenDiff input="console.log" mecab="console / . / log" suzume="console.log" />

**ASCII word-internal separators:**

<TokenDiff input="data-driven" mecab="data / - / driven" suzume="data-driven" />

The same rule covers apostrophes, ampersands, and slashes when they occur
between ASCII word characters.

<Why>

These are atomic identifiers in technical text. Splitting them provides no benefit.

</Why>

### URLs, Mentions, and Hashtags

URLs, @mentions, and #hashtags are merged into single tokens. Hashtags containing Japanese text are kept whole as well.

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

<TokenDiff
  input="#日本語タグ"
  mecab="# / 日本語 / タグ"
  suzume="#日本語タグ(NOUN)"
/>

<Why>

These are atomic identifiers in modern text. Splitting them provides no benefit.

</Why>

## Splitting Rules

Suzume also draws boundaries a dictionary-driven analysis may not — and deliberately stops its own merging where a boundary carries meaning.

### お/ご Prefixes

Suzume splits お/ご honorific prefixes from nouns but keeps them merged when they form inseparable lexemes.

<TokenDiff input="お茶" mecab="お茶(名詞)" suzume="お(PREFIX) / 茶(NOUN)" note="split — separable prefix" noteJa="分割 — 分離可能な接頭辞" />

Inseparable exceptions (omitted from the diff examples because both MeCab and Suzume keep them as one token) include: お金, お前, おかず, おでん, おもちゃ, おすすめ, おいら, おっさん, お疲れ様, お出で/おいで, and family terms (お母さん, お父さん, お兄ちゃん, お姉さん, おじさん, おばさん, おじいさん, おばあさん, etc.)

<Why>

In most contexts, お/ご are grammatical prefixes that should be separated. But some words have lexicalized with the prefix and splitting them would be incorrect.

</Why>

### Honorific Suffixes and Hiragana Nicknames

Honorific suffixes are split from names.

Applies to suffixes: さん, ちゃん, 様, 君, 殿, さま

Exceptions: family terms like お兄ちゃん and お母さん, and the collective forms 皆様 / 皆さん, are kept as single tokens.

Short nicknames made from a two- or three-character hiragana stem followed by ちゃん or くん, along with lexicalized family terms, can merge as a search unit. Ordinary さん remains a separate suffix, and names with a kanji stem split from their honorific.

<TokenDiff input="わんちゃん" mecab="わん / ちゃん" suzume="わんちゃん(NOUN)" />

<Why>

Separating an honorific is more useful for ordinary names, while a short hiragana nickname is normally searched as a whole.

</Why>

### Subsidiary Auxiliary Splitting

Grammaticalized subsidiary verbs — 過ぎる (excess), かねる (inability), そびれる (missed chance), 尽くす (exhaustive) — split off from the main verb and are tagged `AUX`, unlike the lexical [compound verbs](#compound-verbs) that merge. MeCab's own treatment varies with the dictionary: some combinations come out merged (飲み過ぎ), others split with the 非自立 subcategory.

<TokenDiff input="飲み過ぎた" mecab="飲み(動詞) / 過ぎ(動詞・非自立) / た(助動詞)" suzume="飲み(VERB) / 過ぎ(AUX, lemma: 過ぎる) / た(AUX)" />

<TokenDiff input="わかりかねる" mecab="わかり(動詞) / かねる(動詞・非自立)" suzume="わかり(VERB, lemma: わかる) / かねる(AUX)" />

<TokenDiff input="言いそびれた" mecab="言いそびれ(動詞) / た(助動詞)" suzume="言い(VERB, lemma: 言う) / そびれ(AUX, lemma: そびれる) / た(AUX)" />

<TokenDiff input="食べ尽くす" mecab="食べ(動詞) / 尽くす(動詞・非自立)" suzume="食べ(VERB) / 尽くす(AUX)" />

<Why>

These subsidiaries add grammatical meaning (degree, possibility, completion) rather than forming a new lexical verb. Keeping the main verb separate preserves its lemma for search, and one rule covers the whole family consistently.

</Why>

### Emphatic Colloquial Particles

Colloquial emphatic particles are split as single units instead of being fragmented.

**ったら topic particle:**

<TokenDiff input="あなたったら" mecab="あな(名詞) / たっ(動詞) / たら(助動詞)" suzume="あなた(PRON) / ったら(PARTICLE)" />

**ってば emphatic particle:**

<TokenDiff input="もうってば" mecab="も(助詞) / うっ(動詞) / て(助詞) / ば(助詞)" suzume="もう(ADV) / ってば(PARTICLE)" />

### Productive Function-Word Chains

Suzume preserves the internal verb and particle boundaries of productive
constructions instead of treating the whole spelling as a fixed function word.

<TokenDiff input="とすれば" mecab="とすれば(接続詞)" suzume="と(PARTICLE) / すれ(VERB, lemma: する) / ば(PARTICLE)" />

The same rule gives を / もっ / て for をもって. Closed expressions with no
productive verb boundary remain whole, as in [や否や](#closed-compound-particles).

### Adverbial Noun + Particle

Some sequences that the selected dictionary lexicalizes as one function word are kept as noun + particle.

<TokenDiff input="次に" mecab="次に(接続詞)" suzume="次(NOUN) / に(PARTICLE)" />

<TokenDiff input="後で行く" mecab="後で(副詞) / 行く" suzume="後(NOUN) / で(PARTICLE) / 行く(VERB)" />

<Why>

Keeping the noun separate makes it usable as a search term and applies the same boundary whether or not a particular adverb happens to be in a dictionary.

</Why>

### Leading Fixed Units

The determiner わが is split from the following noun. Similar fixed units such as 以下 and 程度 also keep their own token next to adjacent nouns.

<TokenDiff input="わが国" mecab="わが国(名詞)" suzume="わが(DET) / 国(NOUN)" />

### Verb Stem + Productive Suffix

Productive suffixes after a verb stem — がち (tendency), たて (freshness), っぱなし (left as-is) — keep their boundary and are tagged `SUFFIX`, so the verb stem stays searchable with its lemma.

<TokenDiff input="忘れがち" mecab="忘れ(動詞) / がち(名詞・接尾)" suzume="忘れ(VERB, lemma: 忘れる) / がち(SUFFIX)" />

<TokenDiff input="できたて" mecab="でき(動詞) / た(助動詞) / て(助詞)" suzume="でき(VERB, lemma: できる) / たて(SUFFIX)" />

<TokenDiff input="開けっぱなし" mecab="開けっぱなし(名詞)" suzume="開け(VERB, lemma: 開ける) / っぱなし(SUFFIX)" />

The negative construction 読みっこない follows the same principle:
読み (`VERB`) / っこ (`SUFFIX`) / ない (`ADJ`).

### Quantity and State Suffixes

Even though Suzume merges kanji compounds aggressively, productive quantity/state suffixes keep their boundary and are tagged `SUFFIX`.

<TokenDiff input="二階建て" mecab="二 / 階 / 建て" suzume="二階(NOUN) / 建て(SUFFIX)" />

<TokenDiff input="砂糖抜き" mecab="砂糖(名詞) / 抜き(名詞)" suzume="砂糖(NOUN) / 抜き(SUFFIX)" />

<TokenDiff input="会議中に" mecab="会議(名詞) / 中(名詞) / に(助詞)" suzume="会議(NOUN) / 中(SUFFIX) / に(PARTICLE)" />

Pure relabeling suffixes with no boundary change, such as the nominalizer さ, are covered in [POS Classification](/docs/pos-differences).

<Why>

二階建て without a boundary would swallow the quantity, and 会議中 merged as one noun would hide 会議 from search. The suffix stays attached in the text span but visible as its own token.

</Why>

### Productive Negative Splitting

Unlike the closed [nai-adjective](#nai-adjectives) word list, productive "stem + ない" combinations split, keeping the stem searchable.

<TokenDiff input="揺るぎない" mecab="揺るぎない(形容詞)" suzume="揺るぎ(NOUN) / ない(ADJ)" />

<TokenDiff input="やりきれない" mecab="やりきれない(形容詞)" suzume="やりきれ(VERB, lemma: やりきれる) / ない(AUX)" />

<TokenDiff input="やむを得ない" mecab="やむを得ない(形容詞)" suzume="やむ(VERB) / を(PARTICLE) / 得(VERB, lemma: 得る) / ない(AUX)" />

### Kango + として

For fixed tari-adverb constructions such as 依然として, MeCab treats the expression as one adverb. Suzume splits the adverb form from the する conjugation. Productive expressions such as 名詞として already have grammatical boundaries in both analyzers.

<TokenDiff input="依然として" mecab="依然として(副詞)" suzume="依然と(ADV) / し(VERB) / て(PARTICLE)" />

<Why>

These are taru-adjective adverb forms (漢語 + と) followed by する conjugation. Splitting provides more accurate grammatical structure.

</Why>

### Prefecture + City

Prefecture-city compound nouns are split at administrative boundaries.

<TokenDiff input="神奈川県横浜市" mecab="神奈川 / 県 / 横浜 / 市" suzume="神奈川県 / 横浜市" note="split at the 県 / 市 boundary" noteJa="県／市の境界で分割" />

Note: This split rule applies only to the `県+市` pattern. Other combinations like `都+区` (東京都新宿区) or `府+市` (大阪府大阪市) are merged into single tokens by the [Proper Nouns and Place Names](#proper-nouns-and-place-names) rule.

<Why>

Prefecture and city are distinct administrative levels, and splitting at their boundary is useful for search and geocoding.

</Why>

### Classical and Literary Endings

Classical inflections keep the same grammatical boundaries as their modern
counterparts. The supported families include negative forms, conjectural and
obligation auxiliaries, past and perfect auxiliaries, prohibitives, and
imperatives. A compact sample:

- Classical negative ぬ splits from the 未然形: 知らぬ → 知ら + ぬ (`AUX`)
- Literary volitional ん splits the same way: 乗り越えん → 乗り越え + ん (`AUX`)
- Classical past き keeps its own auxiliary boundary: 行かざりき → 行か + ざり + き

## Normalization

Suzume normalizes grammatical constructions to one consistent shape, even where dictionary output varies between equivalent forms.

### Copula Negation

After a nominal predicate, Suzume treats じゃ as the copula and ない as the
negative auxiliary. An isolated `じゃない` is ambiguous and may instead be one
adjective token, so the nominal host is part of the comparison.

<TokenDiff input="本じゃない" mecab="本(名詞) / じゃ(助詞) / ない(助動詞)" suzume="本(NOUN) / じゃ(AUX, lemma: だ) / ない(AUX)" />

<Why>

The nominal context licenses the copula reading and keeps the negative boundary
visible.

</Why>

### Causative-Passive

MeCab sometimes merges godan verb 未然形 + causative さ into one token. Suzume normalizes this inconsistency.

<TokenDiff input="飲まされた" mecab="飲まさ(動詞) / れ(動詞・接尾) / た(助動詞)" suzume="飲ま(VERB, lemma: 飲む) / さ(AUX, lemma: す) / れ(AUX) / た(AUX)" />

<Why>

The selected IPADIC analysis splits some causative-passive forms (読ま + さ + れた) but merges others (飲まさ + れた). Suzume applies the same segmentation rule to these constructions.

</Why>

### Filler Decomposition

Fixed conversational phrases lexicalized as fillers are decomposed into their grammatical parts.

<TokenDiff input="そうですね" mecab="そうですね(フィラー)" suzume="そう(ADJ) / です(AUX) / ね(PARTICLE)" />

<Why>

As one opaque filler the phrase hides its structure. Decomposing it applies the same copula and particle handling as everywhere else.

</Why>

### Formal Noun ふう

ふうに after a demonstrative determiner is split into its grammatical determiner, formal-noun, and particle units.

<TokenDiff input="そんなふうに" mecab="そんなふうに(副詞)" suzume="そんな(DET) / ふう(NOUN) / に(PARTICLE)" />

### Indefinite か

The indefinite particle か is split from an interrogative pronoun. A following existential いる is then treated as a main verb.

<TokenDiff input="なにかいる" mecab="なにか / いる" suzume="なに(PRON) / か(PARTICLE) / いる(VERB)" />

<Why>

Here か is a particle that creates an indefinite expression rather than part of the pronoun, and いる is existential rather than a progressive auxiliary.

</Why>

## Constraints

These are known limitations arising from Suzume's feature-based architecture.

### Cannot Split Merged Compounds

Suzume cannot infer arbitrary lexical boundaries inside an otherwise unknown
same-script compound. It can still split boundaries licensed by grammatical
rules or compact-dictionary entries.

<TokenDiff input="東京都庁前" mecab="東京 / 都庁 / 前" suzume="東京都庁前(NOUN)" note="Suzume cannot determine the internal boundaries; MeCab splits them from its dictionary" noteJa="Suzume は内部境界を判定できず、MeCab は辞書に基づいて分割します" />

**Workaround:** Use the [runtime-loading examples in the user-dictionary guide](/docs/user-dictionary#runtime-loading) to register boundaries required by your application. That page covers JavaScript, Python, Go, C++, C, and the native CLI.

## When to Use Which

| Use Case | Recommendation |
|----------|---------------|
| Browser / client-side apps | **Suzume** — no server required |
| Search indexing / tag extraction | **Suzume** — compound merging is often desirable |
| Compatibility with a particular MeCab dictionary/corpus | **MeCab** — preserves that dictionary's boundaries and taxonomy |
| Real-time UI (input-as-you-type) | **Suzume** — fast, no network latency |
| Dictionary-defined compound word splitting | **MeCab** — boundaries come from the selected dictionary |
| Pattern candidates for words absent from the dictionary | **Suzume** — can analyze character sequences without a lexical entry |
