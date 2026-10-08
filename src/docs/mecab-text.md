# Text and Notation

Word boundaries also depend on how text is written. These examples cover everyday kana, expressive spelling, identifiers, and symbols.

All examples use the [comparison baseline](/docs/mecab-comparison#comparison-baseline). For labels on the same tokens, see [POS Classification](/docs/pos-differences).

## Everyday and expressive text

### Everyday Hiragana Words

Common words normally written in hiragana are kept intact through pattern rules and the compact L2 dictionary. Rules cover forms such as おととい, ひこうき, みっつ, and calendar compounds such as 翌営業日. Lexical evidence resolves ambiguous all-hiragana nouns whose characters can also be particles or inflectional endings: みず, てがみ, ひらがな, にわ, いりぐち, はにわ, あけぼの, and くだもの.

### Slang and Modern Words

Modern colloquial adjectives and verbs are recognized natively.

<TokenDiff input="エモい" mecab="エモ(名詞) / い(動詞)" suzume="エモい(ADJ)" />

Recognized examples include エモい, キモい, ウザい, ダサい, イタい, ヤバい, and compound i-adjectives. Hiragana variants can require context: `頭がいたい` gives `頭(NOUN) / が(PARTICLE) / いたい(ADJ)`, while standalone `いたい` gives `い(VERB) / たい(AUX)`.

Recognized verb examples include バズる, ググる, and パクる.

<Why>

The selected IPADIC baseline contains some colloquial words such as ダサい but lacks many newer entries. Suzume recognizes selected slang patterns and their conjugated forms (エモかった, バズった, ググった, etc.).

</Why>

### Nai-Adjectives

Certain adjectives ending in ない are treated as single lexical units rather than being split.

<TokenDiff input="だらしない" mecab="だらし(名詞・ナイ形容詞語幹) / ない(助動詞)" suzume="だらしない(ADJ)" />

Main examples handled as one token: だらしない, つまらない, もったいない, くだらない, いたたまれない, ものたりない, こころもとない

This is a closed word list — productive "stem + ない" combinations still split; see [Productive Negative Splitting](/docs/mecab-grammar#productive-negative-splitting).

<Why>

These words function as indivisible adjectives in modern Japanese. The "stem + ない" split is etymologically correct but not useful for NLP applications.

</Why>

### Prolonged Sound Marks

Prolonged sound marks (ー) are merged with the preceding token. For recognized colloquial i-adjectives, Suzume keeps the marks in the surface while normalizing the lemma to the ordinary dictionary form.

<TokenDiff input="そうー" mecab="そう(副詞) / ー(名詞)" suzume="そうー(ADV)" />

<TokenDiff input="すごーーい" mecab="すご(形容詞) / ーー(名詞) / い(名詞)" suzume="すごーーい(ADJ, lemma: すごい)" />

<Why>

Prolonged sounds are part of the word they modify. The surface retains the written marks, while the lemma removes the colloquial lengthening and uses the adjective's dictionary form.

</Why>

Kanji adjective stems also retain expressive spelling: `高ーい` and clipped `高っ` are each one `ADJ` with lemma `高い`. An emphatic internal っ can remain in the lemma: `すっごい` is one `ADJ` with lemma `すっごい`.

A small vowel extending a particle stays with that particle: `のにぃ` is one `PARTICLE` with lemma `のに`. A clipped greeting such as `ありがとっ` is one `INTJ` with lemma `ありがとう`.

### Emphatic Colloquial Particles

Colloquial emphatic particles are split as single units instead of being fragmented.

**ったら topic particle:**

<TokenDiff input="あなたったら" mecab="あな(名詞) / たっ(動詞) / たら(助動詞)" suzume="あなた(PRON) / ったら(PARTICLE)" />

**ってば emphatic particle:**

<TokenDiff input="もうってば" mecab="も(助詞) / うっ(動詞) / て(助詞) / ば(助詞)" suzume="もう(ADV) / ってば(PARTICLE)" />

### Filler Decomposition

Fixed conversational phrases lexicalized as fillers are decomposed into their grammatical parts.

<TokenDiff input="そうですね" mecab="そうですね(フィラー)" suzume="そう(ADV) / です(AUX) / ね(PARTICLE)" />

<Why>

As one opaque filler the phrase hides its structure. Decomposing it applies the same copula and particle handling as everywhere else.

</Why>

## Technical notation

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

URLs, @mentions, and #hashtags are merged into single tokens. A hashtag scanner accepts Japanese text, including hiragana that would otherwise be particle-like, and stops at whitespace or punctuation.

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
  suzume="#topicについて(NOUN)"
/>

<TokenDiff
  input="#日本語タグ"
  mecab="# / 日本語 / タグ"
  suzume="#日本語タグ(NOUN)"
/>

<Why>

URLs, mentions, and hashtags are treated as atomic identifiers. For a hashtag, the scanner boundary is determined by its character set and the next whitespace or punctuation, so `#topicについて` stays one noun token.

</Why>

## Symbols and punctuation

### Content Symbols and Punctuation

Currency and unit signs, arrows, mathematical or technical marks, and emoji remain in the default output as `OTHER`. They carry text content and keep the token offsets covering that content. Punctuation-like characters are `SYMBOL` tokens and are omitted by default; enable `preserveSymbols` to keep them.

| Options | `価格は€50🎉。` |
|---------|------------------|
| Default | `価格(NOUN) / は(PARTICLE) / €(OTHER) / 50(NOUN) / 🎉(OTHER)` |
| `preserveSymbols: true` | `価格(NOUN) / は(PARTICLE) / €(OTHER) / 50(NOUN) / 🎉(OTHER) / 。(SYMBOL)` |
