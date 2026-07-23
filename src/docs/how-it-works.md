# How It Works

## Why So Small?

The biggest question: how can Suzume tokenize Japanese text in about <WasmSize /> gzipped when traditional analyzers often need tens of megabytes of dictionaries?

### The Short Answer

| Traditional (MeCab) | Suzume |
|---------------------|--------|
| Stores every word with all metadata | Stores only essential words |
| Pre-computed connection costs for all word pairs | Computes connections on the fly |
| Requires full dictionary to handle any input | Uses pattern rules for unknown words |

::: tip Key Insight
MeCab's dictionary is like a phone book with every person's name. Suzume is like knowing the rules of how Japanese names are formed — you can recognize new names without listing them all.
:::

### The Three Pillars

<DiagramPillars />

::: info What is Tokenization?
Breaking text into meaningful units (tokens) and identifying their parts of speech. For Japanese, this means segmenting continuous text like "東京に行く" into "東京 / に / 行く".
:::

## 1. Minimal Dictionary

Traditional analyzers store exhaustive word lists:

```
# MeCab dictionary entry (simplified)
東京,noun,proper,place,*,*,*,東京,トウキョウ,トーキョー,0/3,C1
```

Suzume stores high-frequency function words, particles, auxiliaries, and selected exceptions. For many content words, it relies on character patterns and grammar rules instead of shipping every possible surface form.

| Category | Traditional dictionary analyzer | Suzume |
|----------|---------------------------------|--------|
| Function words | Stored in the dictionary | Compact entries and grammar rules |
| Verbs and adjectives | Many surface/conjugated entries | Conjugation rules plus selected exceptions |
| General and proper nouns | Broad lexical coverage | Character-pattern candidates plus a compact dictionary |
| Domain-specific terms | Dictionary package or customization | Runtime user dictionary |

## 2. Pattern Recognition

Instead of storing every word, Suzume recognizes patterns:

<DiagramPattern />

| Pattern | Rule | Result |
|---------|------|--------|
| `[カタカナ]+` | Foreign loanwords are nouns | noun |
| `[漢字]+` | Kanji compounds are usually nouns | noun |
| `[漢字]+する` | Kanji + する = verbal noun | verb |
| `[ひらがな]+い` | Ending in い = adjective candidate | adjective |

::: info Why This Works
Japanese has regular patterns. Katakana words are almost always nouns (loanwords). Kanji compounds are usually nouns. This regularity lets us infer POS without storing each word.
:::

Try it with your own text:

<TokenizerPlayground />

## 3. Dynamic Connection Scoring

MeCab pre-computes a huge connection cost matrix:

```
# Which word can follow which? (simplified)
noun → particle: cost 100
noun → verb: cost 500
particle → noun: cost 50
...millions of combinations
```

Suzume computes connection scores dynamically using compact rules:

<DiagramScoring />

## Consistency of Analysis

Suzume decides parts of speech and boundaries from rules (character type, conjugation, connection rules) rather than from per-word dictionary entries. This has a property distinct from size: the same construction is always handled by the same rule, so grammatically similar inputs are decided the same way.

When analysis depends on a dictionary and a cost table, each decision is governed by values recorded per entry. Entries are added over a long period by many hands, so grammatically similar words can end up treated differently. A rule-based approach keeps the decision criteria in one place, which makes that kind of variation less likely.

For example, the colloquial copula "じゃ" is classified as an auxiliary consistently, whether it is followed by "ない", "なかっ", or "な". The causative-passive rules likewise aim to normalize equivalent constructions instead of depending on per-word entries (see the relevant sections in the [MeCab comparison](/docs/mecab-comparison)).

This consistency is separate from the question of which segmentation is "correct". It does not claim that Suzume's analysis is the only right one; it refers to the property that whichever rules are adopted are applied uniformly across inputs. The rules also have limits, and within those the classification can still vary (see [Limitations](/docs/mecab-comparison)).

## Different Optimization Targets

::: info Choose by purpose
Suzume is optimized for compact, search-friendly tokenization in browsers, edge runtimes, and native applications. A full dictionary analyzer is a different tool: choose one when its dictionary coverage and detailed morphological taxonomy are requirements. The outputs are not intended to be interchangeable, so a MeCab match rate is not Suzume's success metric. See [When to Use Which](/docs/mecab-comparison) for a full requirement-by-requirement comparison.
:::

The dictionary, pattern-based candidate generation, and Viterbi scoring pipeline described here always runs. Only surface normalization (`preserveVu`, `preserveCase`, `preserveSymbols`) and output shaping (`mode`, `lemmatize`, `mergeCompounds`) are tunable via `SuzumeOptions`.

::: tip Tuning tokenization
`mode: 'search' | 'split'` and `mergeCompounds` let you adjust how aggressively compounds are segmented or merged for your use case. See the [API reference](/docs/api) for details.
:::

## Technical Deep Dive

::: info What is a Lattice?
A graph structure representing all possible ways to segment text. Each path through the lattice is a potential tokenization. For "すもも", possible paths include "すもも" (plum) or "す/もも" (vinegar + peach).
:::

::: info What is Viterbi Algorithm?
A dynamic programming algorithm that finds the optimal path through the lattice. Instead of evaluating every possible combination, it efficiently finds the best segmentation by reusing previous calculations.
:::

### Analysis Pipeline

<DiagramPipeline />

### Unknown Word Handling

When Suzume encounters an unknown word like "スカイツリー":

1. **Not in dictionary** — no stored entry
2. **Pattern match** — recognized as katakana sequence
3. **Generate candidate** — create noun hypothesis
4. **Compete in lattice** — scored against other possibilities
5. **Select best** — Viterbi finds optimal segmentation

### Verb Conjugation

Suzume recognizes hundreds of conjugation patterns without storing each form:

```
Base: 食べる (to eat)
├── 食べ + ない → negative
├── 食べ + ます → polite
├── 食べ + た → past
├── 食べ + て → te-form
└── 食べ + れば → conditional
```

The rules are stored, not every conjugated form.

## Summary

| Question | Answer |
|----------|--------|
| Why is MeCab big? | Stores every word + pre-computed costs |
| Why is Suzume small? | Stores rules + minimal dictionary |
| Are MeCab and Suzume outputs interchangeable? | No. Their goals, boundaries, and POS taxonomies differ |
| When to use MeCab? | When a MeCab dictionary's lexical coverage and analysis conventions are required |
| When to use Suzume? | Compact search/display tokenization across browser, edge, Python, and C/C++ |

## See also

- [API reference](/docs/api)
- [MeCab comparison](/docs/mecab-comparison)
- [Getting started](/docs/getting-started)
