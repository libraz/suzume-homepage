# Compounds, Quantities, and Names

Suzume can keep a compound or quantity together while leaving a productive suffix or administrative boundary visible. The examples below group those decisions by the kind of word being analyzed.

All examples use the [comparison baseline](/docs/mecab-comparison#comparison-baseline). For labels on the same tokens, see [POS Classification](/docs/pos-differences).

## Compound words

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

### Deverbal Compound Nouns

A verb continuative plus 会, and the destination suffix 行き, form single event/route nouns.

<TokenDiff input="飲み会" mecab="飲み / 会" suzume="飲み会(NOUN)" />

<TokenDiff input="東京行き" mecab="東京 / 行き" suzume="東京行き(NOUN)" />

A compound verb's continuative used as a noun can remain separate from a following noun: `取り扱い方法` becomes `取り扱い(NOUN) / 方法(NOUN)`.

<Why>

飲み会 and 東京行き are the units people actually search for. The verb origin of 飲み or 行き carries no value on its own here.

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

Only short stems merge: the continuative must be at most two characters (走り方, やり方). Longer continuatives keep the boundary — 打ち合わせ方 stays 打ち合わせ / 方. The same boundary applies to the deverbal noun in `取り扱い方`, which becomes `取り扱い(NOUN) / 方(SUFFIX)`.

<Why>

A "verb + 方" expression is a lexical search unit for a method, so keeping it with the verb stem is more useful for search.

</Why>

## Quantities and dates

### Numbers and Units

Cardinal numbers followed by counters or units are normally merged into one quantity token. This includes large number units (万, 億, 兆), decimal numbers, percentages, and alphabetic units. Ordinal and structural suffix rules can split forms such as `第三 / 回`.

<TokenDiff input="3人" mecab="3 / 人" suzume="3人(NOUN)" />

<TokenDiff input="100円" mecab="100 / 円" suzume="100円(NOUN)" />

<TokenDiff input="3.14" mecab="3 / . / 14" suzume="3.14(NOUN)" />

Suzume also preserves search-unit boundaries around quantities.

<TokenDiff input="徒歩五分" mecab="徒歩 / 五 / 分" suzume="徒歩 / 五分(NOUN)" />

<TokenDiff input="三ヶ月間入院" mecab="三 / ヶ月 / 間 / 入院" suzume="三ヶ月間(NOUN) / 入院" />

Quantity phrases such as `3種類`, `3人分`, and `3ページ目` stay whole as `NOUN` tokens. A counter does not cut through a following word, and quantity suffixes such as 分 and the ordinal 目 remain part of the quantity.

Comma-grouped numerals stay whole. A following counter remains a separate `SUFFIX`, while a currency amount stays one search unit.

<TokenDiff input="1,000人" mecab="1 / , / 000 / 人" suzume="1,000(NOUN) / 人(SUFFIX)" />

<TokenDiff input="1,000円" mecab="1 / , / 000 / 円" suzume="1,000円(NOUN)" />

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

## Names and suffixes

### Proper Nouns and Place Names

Many place-name components with region suffixes are merged. The structural `県+市` rule is an exception and splits the prefecture from the city.

<TokenDiff input="東京都新宿区" mecab="東京 / 都 / 新宿 / 区" suzume="東京都新宿区(NOUN)" note="place name" noteJa="地名" />

<Why>

Place names consisting of multiple geographic components should be treated as single entities for search and display.

</Why>

### Prefecture + City

Prefecture-city compound nouns are split at administrative boundaries.

<TokenDiff input="神奈川県横浜市" mecab="神奈川 / 県 / 横浜 / 市" suzume="神奈川県 / 横浜市" note="split at the 県 / 市 boundary" noteJa="県／市の境界で分割" />

Note: This split rule applies only to the `県+市` pattern. Other combinations like `都+区` (東京都新宿区) or `府+市` (大阪府大阪市) are merged into single tokens by the [Proper Nouns and Place Names](#proper-nouns-and-place-names) rule.

<Why>

Prefecture and city are distinct administrative levels, and splitting at their boundary is useful for search and geocoding.

</Why>

### Honorific Suffixes and Hiragana Nicknames

Honorific suffixes are split from names.

Applies to suffixes: さん, ちゃん, くん, 様, さま. The kanji forms 君 and 殿 split after a host of at least two kanji, as in `佐藤 / 君` and `先生 / 殿`.

The runtime POS can vary among these written titles: `佐藤様` becomes `佐藤(NOUN) / 様(NOUN)`.

<TokenDiff input="佐藤君" mecab="佐藤(名詞・固有名詞) / 君(名詞・接尾)" suzume="佐藤(NOUN) / 君(SUFFIX)" />

After a single kanji, Suzume cannot distinguish a name from an ordinary compound such as 主君. `林君` therefore stays whole; this is a lexical limitation.

<TokenDiff input="林君" mecab="林(名詞・固有名詞) / 君(名詞・接尾)" suzume="林君(NOUN)" />

Exceptions: family terms like お兄ちゃん and お母さん, and the collective forms 皆様 / 皆さん, are kept as single tokens.

Short nicknames made from a two- or three-character hiragana stem followed by ちゃん or くん, along with lexicalized family terms, can merge as a search unit. Ordinary さん remains a separate suffix, including after names written in kanji.

<TokenDiff input="わんちゃん" mecab="わん / ちゃん" suzume="わんちゃん(NOUN)" />

<Why>

Separating an honorific is more useful for ordinary names, while a short hiragana nickname is normally searched as a whole.

</Why>

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

`例年並み` splits as `例年(NOUN) / 並み(SUFFIX)`, and `汗まじり` as `汗(NOUN) / まじり(SUFFIX)`. 中 depends on its host: after an attributive adjective, `忙しい中` gives `忙しい(ADJ) / 中(NOUN)`, with 中 as a formal noun rather than a suffix.

Pure relabeling suffixes with no boundary change, such as the nominalizer さ, are covered in [POS Classification](/docs/pos-differences).

<Why>

二階建て without a boundary would swallow the quantity, and 会議中 merged as one noun would hide 会議 from search. The suffix stays attached in the text span but visible as its own token.

</Why>
