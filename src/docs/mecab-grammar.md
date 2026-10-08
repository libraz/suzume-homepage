# Verbs and Grammar

Compound verbs, auxiliaries, and particles have different boundary rules. These examples show which expressions stay whole and which retain their grammatical parts, including colloquial and classical forms.

All examples use the [comparison baseline](/docs/mecab-comparison#comparison-baseline). For labels on the same tokens, see [POS Classification](/docs/pos-differences).

## Verbs and auxiliaries

### Compound Verbs

Verb stems in 連用形 followed by subsidiary verbs are merged into compound verbs.

<TokenDiff input="食べ続ける" mecab="食べ / 続ける" suzume="食べ続ける(VERB)" />

Supported V2 elements include: 込む, 出す, 続く, 返す, 合う, 直す, 切る, 上がる, 抜く, こもる, 続ける, つける, 替える, 合わせる, 上げる, 下げる, 掛ける, 入れる, etc. (300+ kanji and kana forms)

Grammaticalized subsidiaries such as 過ぎる and かねる are deliberately **not** merged — see [Subsidiary Auxiliary Splitting](#subsidiary-auxiliary-splitting).

<Why>

Compound verbs function as single lexical units in Japanese. Splitting them loses the compound meaning.

</Why>

### Desiderative たがる

The desiderative-observation auxiliary たがる, including its inflected forms, is kept as a single auxiliary token.

<TokenDiff input="食べたがる" mecab="食べ / た / がる" suzume="食べ(VERB) / たがる(AUX, lemma: たがる)" />

<Why>

In this construction, た and がる do not express past tense plus an independent verb; together they form the auxiliary meaning "show signs of wanting to."

</Why>

### Subsidiary Auxiliary Splitting

Grammaticalized subsidiary verbs — 過ぎる (excess), かねる (inability), そびれる (missed chance), 尽くす (exhaustive) — split off from the main verb. Suzume records their auxiliary role in the extended POS; the public POS remains `VERB` for the `過ぎる` forms and is `AUX` for the other subsidiary forms below. MeCab's own treatment varies with the dictionary: some combinations come out merged (飲み過ぎ), others split with the 非自立 subcategory.

<TokenDiff input="飲み過ぎた" mecab="飲み(動詞) / 過ぎ(動詞・非自立) / た(助動詞)" suzume="飲み(VERB) / 過ぎ(VERB, lemma: 過ぎる) / た(AUX)" />

<TokenDiff input="わかりかねる" mecab="わかり(動詞) / かねる(動詞・非自立)" suzume="わかり(VERB, lemma: わかる) / かねる(AUX)" />

<TokenDiff input="言いそびれた" mecab="言いそびれ(動詞) / た(助動詞)" suzume="言い(VERB, lemma: 言う) / そびれ(AUX, lemma: そびれる) / た(AUX)" />

<TokenDiff input="食べ尽くす" mecab="食べ(動詞) / 尽くす(動詞・非自立)" suzume="食べ(VERB) / 尽くす(AUX)" />

<Why>

These subsidiaries add grammatical meaning (degree, possibility, completion) rather than forming a new lexical verb. Keeping the main verb separate preserves its lemma for search, and one rule covers the whole family consistently.

</Why>

### Pejorative やがる

The pejorative auxiliary やがる stays whole after a verb continuative. The IPA dictionary splits this form into parts of やる and がる; Suzume assigns the auxiliary its own lemma and `AUX_卑罵` subtype.

<TokenDiff input="食べやがった" mecab="食べ(動詞) / や(動詞・非自立, lemma: やる) / がっ(動詞・接尾, lemma: がる) / た(助動詞)" suzume="食べ(VERB, lemma: 食べる) / やがっ(AUX, lemma: やがる) / た(AUX)" />

### Negative ずに

The negative auxiliary ず and the following particle に remain separate, preserving the grammatical boundary.

<TokenDiff input="食べずに" mecab="食べ / ず / に" suzume="食べ(VERB) / ず(AUX, lemma: ぬ) / に(PARTICLE)" />

<Why>

Keeping ず and に separate preserves their distinct auxiliary and particle roles.

</Why>

### Productive Negative Splitting

Unlike the closed [nai-adjective](/docs/mecab-text#nai-adjectives) word list, productive "stem + ない" combinations split, keeping the stem searchable.

<TokenDiff input="揺るぎない" mecab="揺るぎない(形容詞)" suzume="揺るぎ(NOUN) / ない(ADJ)" />

<TokenDiff input="やりきれない" mecab="やりきれない(形容詞)" suzume="やりきれ(VERB, lemma: やりきれる) / ない(AUX)" />

<TokenDiff input="やむを得ない" mecab="やむを得ない(形容詞)" suzume="やむ(VERB) / を(PARTICLE) / 得(VERB, lemma: 得る) / ない(AUX)" />

### Classical and Literary Endings

Classical inflections keep the same grammatical boundaries as their modern
counterparts. The supported families include negative forms, conjectural and
obligation auxiliaries, past and perfect auxiliaries, prohibitives, and
imperatives. A compact sample:

- Classical negative ぬ splits from the 未然形: 知らぬ → 知ら + ぬ (`AUX`)
- Literary volitional ん splits the same way: 乗り越えん → 乗り越え + ん (`AUX`)
- Classical past き keeps its own auxiliary boundary: 行かざりき → 行か + ざり + き

The conjectural らむ follows a terminal verb form. Suzume retains that verb boundary where the IPA dictionary reads a different noun–verb pair:

<TokenDiff input="行くらむ" mecab="行(名詞) / くらむ(動詞)" suzume="行く(VERB) / らむ(AUX)" />

Classical adjective continuatives such as 美しかり keep their inflection together and their modern lemma. The following けり remains a separate past auxiliary:

<TokenDiff input="美しかりけり" mecab="美し(形容詞, lemma: 美しい) / かり(動詞, lemma: かりる) / けり(助動詞)" suzume="美しかり(ADJ, lemma: 美しい) / けり(AUX)" />

### Colloquial Auxiliary Forms

Past conjectural, fused desiderative, and volitional forms retain their auxiliary boundaries:

| Input | Suzume |
|-------|--------|
| 食べたろう | `食べ(VERB) / たろ(AUX, lemma: た) / う(AUX)` |
| 食べてえ | `食べ(VERB) / てえ(AUX, lemma: たい)` |
| いこう | `いこ(VERB, lemma: いく) / う(AUX)` |
| ゆこう | `ゆこ(VERB, lemma: ゆく) / う(AUX)` |

## Function words and grammatical boundaries

### Closed Compound Particles

Closed expressions that function as one particle are kept whole.

<TokenDiff input="や否や" mecab="や(助詞) / 否や(名詞)" suzume="や否や(PARTICLE)" />

The selected IPA dictionary already emits expressions such as と共に and, in
some contexts, につれて as one token, so they are not boundary differences in
this baseline. Other dictionaries may split them.

<Why>

A compound particle is one grammatical word. Splitting it scatters meaningless one-character fragments into search indexes.

</Why>

### Fixed Colloquial Function Words

Fixed function words are kept whole even when a dictionary-driven analysis fragments them.

<TokenDiff input="散歩がてら" mecab="散歩 / が / てら" suzume="散歩(NOUN) / がてら(PARTICLE)" />

<TokenDiff input="そんなら" mecab="そん / なら" suzume="そんなら(CONJ)" />

がてら ("while, on the occasion of") is one particle, and the colloquial そんなら ("in that case") is one conjunction.

### Productive Function-Word Chains

Suzume preserves the internal verb and particle boundaries of productive
constructions instead of treating the whole spelling as a fixed function word.

<TokenDiff input="とすれば" mecab="とすれば(接続詞)" suzume="と(PARTICLE) / すれ(VERB, lemma: する) / ば(PARTICLE)" />

The same rule gives を / もっ / て for をもって. Closed expressions with no
productive verb boundary remain whole, as in [や否や](#closed-compound-particles).

The quotative って also remains a separate particle after a clause-final particle: `行くかって` becomes `行く(VERB) / か(PARTICLE) / って(PARTICLE)`.

### Adverbial Noun + Particle

Some sequences that the selected dictionary lexicalizes as one function word are kept as noun + particle.

<TokenDiff input="次に" mecab="次に(接続詞)" suzume="次(NOUN) / に(PARTICLE)" />

<TokenDiff input="後で行く" mecab="後で(副詞) / 行く" suzume="後(NOUN) / で(PARTICLE) / 行く(VERB)" />

<Why>

Keeping the noun separate makes it usable as a search term and applies the same boundary whether or not a particular adverb happens to be in a dictionary.

</Why>

### Leading Fixed Units

The determiner わが is split from the following noun.

<TokenDiff input="わが国" mecab="わが国(名詞)" suzume="わが(DET) / 国(NOUN)" />

### お/ご Prefixes

Suzume splits お/ご honorific prefixes from nouns but keeps them merged when they form inseparable lexemes.

<TokenDiff input="お茶" mecab="お茶(名詞)" suzume="お(PREFIX) / 茶(NOUN)" note="split — separable prefix" noteJa="分割 — 分離可能な接頭辞" />

Suzume keeps these lexical exceptions whole: お金, お前, おかず, おでん, おもちゃ, おすすめ, おいら, おっさん, お疲れ様, おいで, and family terms (お母さん, お父さん, お兄ちゃん, お姉さん, おじさん, おばさん, おじいさん, おばあさん, etc.). The selected MeCab baseline keeps many of them whole but splits お兄ちゃん and お姉さん after お.

<Why>

In most contexts, お/ご are grammatical prefixes that should be separated. But some words have lexicalized with the prefix and splitting them would be incorrect.

</Why>

### Tari-Adverbs

Tari-conjugation adverb stems followed by と are merged into a single adverb.

<TokenDiff input="堂々と" mecab="堂々 / と" suzume="堂々と(ADV)" />

Applies to: 泰然, 堂々, 悠々, 淡々, 粛々, 颯爽, 毅然, 漫然, 茫然, 呆然, 唖然, 愕然, 断然, 歴然, 整然, 雑然, 騒然, 憮然, 黙然, 昂然, 厳然

<Why>

These stem+と combinations are conventionally used as adverbs and are more useful as single tokens.

</Why>

### Kango + として

For fixed tari-adverb constructions such as 依然として, MeCab treats the expression as one adverb. Suzume splits the adverb form from the する conjugation. Productive expressions such as 名詞として already have grammatical boundaries in both analyzers.

<TokenDiff input="依然として" mecab="依然として(副詞)" suzume="依然と(ADV) / し(VERB) / て(PARTICLE)" />

<Why>

These are taru-adjective adverb forms (漢語 + と) followed by する conjugation. Splitting provides more accurate grammatical structure.

</Why>

## Predicates and pronouns

### Copula Negation

After a nominal predicate, Suzume treats じゃ as the copula and ない as the
adjective. The nominal host is part of the comparison so the copular context is
explicit.

<TokenDiff input="本じゃない" mecab="本(名詞) / じゃ(助詞) / ない(助動詞)" suzume="本(NOUN) / じゃ(AUX, lemma: だ) / ない(ADJ)" />

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

### Formal Noun ふう

ふうに after a demonstrative determiner is split into its grammatical determiner, formal-noun, and particle units.

<TokenDiff input="そんなふうに" mecab="そんなふうに(副詞)" suzume="そんな(DET) / ふう(NOUN) / に(PARTICLE)" />

### Indefinite か

The indefinite particle か is split from an interrogative pronoun. A following existential いる is then treated as a main verb.

<TokenDiff input="なにかいる" mecab="なにか / いる" suzume="なに(PRON) / か(PARTICLE) / いる(VERB)" />

<Why>

Here か is a particle that creates an indefinite expression rather than part of the pronoun, and いる is existential rather than a progressive auxiliary.

</Why>
