# How It Works

## Why So Small?

The biggest question: how can Suzume tokenize Japanese text in about <WasmSize /> gzipped when traditional analyzers often need tens of megabytes of dictionaries?

### The Short Answer

| MeCab with an IPADIC-style dictionary | Suzume |
|---------------------------------------|--------|
| Loads a broad word list with morphological metadata | Stores selected words and exceptions |
| Loads a pre-computed connection-cost matrix | Computes connections from compact rules |
| Uses dictionary entries plus unknown-word definitions | Uses dictionary entries plus pattern-generated candidates |

::: tip Key Insight
The dictionary selected for MeCab supplies its vocabulary, labels, and connection costs. Suzume instead keeps a smaller lexical set and generates additional candidates from character and grammar patterns. The exact MeCab setup used elsewhere in these docs is recorded in the [comparison baseline](/docs/mecab-comparison#comparison-baseline).
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
| `[カタカナ]+` | Generate a noun candidate | noun candidate |
| `[漢字]+` | Generate a compound-noun candidate | noun candidate |
| `[漢字]+する` | Generate a verbal-noun construction | verb candidate |
| `[ひらがな]+い` | Ending in い = adjective candidate | adjective |

::: info Why This Works
Japanese character types and inflectional endings provide useful candidate signals. Suzume combines those signals with dictionary entries and surrounding connection scores; a pattern match alone does not guarantee the final POS or boundary.
:::

Try it with your own text:

<TokenizerPlayground />

## 3. Dynamic Connection Scoring

A MeCab dictionary such as IPADIC includes a pre-computed connection-cost matrix:

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

Suzume decides parts of speech and boundaries from both dictionary entries and shared rules for character types, conjugation, and connections. Applying shared rules across many candidates reduces reliance on individually tuned lexical entries, although context and competing candidates can still change the result.

In a dictionary-and-cost-table design, entries with similar grammatical roles can still carry different labels or costs. Shared construction rules reduce that source of variation, while dictionary candidates and surrounding context continue to affect the selected path.

For example, after a nominal predicate, "じゃ" is analyzed as the auxiliary lemma "だ" in "本じゃない", "本じゃなかった", and "本じゃな". The following "な" in the last example is a particle, and an isolated "じゃない" can instead be analyzed as one adjective. The causative-passive rules likewise aim to normalize equivalent constructions while still resolving them in context (see the relevant sections in the [MeCab comparison](/docs/mecab-comparison)).

This consistency is separate from the question of which segmentation is "correct". It does not claim that Suzume's analysis is the only right one; it refers to the property that whichever rules are adopted are applied uniformly across inputs. The rules also have limits, and within those the classification can still vary (see [Limitations](/docs/mecab-comparison)).

## Different Optimization Targets

::: info Choose by purpose
Suzume is optimized for compact, search-friendly tokenization in browsers, edge runtimes, and native applications. A full dictionary analyzer is a different tool: choose one when its dictionary coverage and detailed morphological taxonomy are requirements. The outputs are not intended to be interchangeable, so a MeCab match rate is not Suzume's success metric. See [When to Use Which](/docs/mecab-comparison) for a full requirement-by-requirement comparison.
:::

The dictionary, pattern-based candidate generation, and Viterbi scoring pipeline described here always runs. `SuzumeOptions` controls normalization and segmentation, dictionary loading, scorer configuration, and whether a JavaScript instance uses an isolated WASM runtime. See the API reference for the complete option set.

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
| Why is the MeCab + IPADIC setup larger? | IPADIC supplies a broad lexicon and pre-computed connection costs |
| Why is Suzume small? | Stores rules + minimal dictionary |
| Are MeCab and Suzume outputs interchangeable? | No. Their goals, boundaries, and POS taxonomies differ |
| When to use MeCab? | When a MeCab dictionary's lexical coverage and analysis conventions are required |
| When to use Suzume? | Compact search/display tokenization across browsers, server runtimes, Python, Go, and C/C++ |

## See also

- [API reference](/docs/api)
- [MeCab comparison](/docs/mecab-comparison)
- [Getting started](/docs/getting-started)
