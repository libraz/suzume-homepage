---
title: "How It Works: Tokenizing Without a Large Dictionary"
description: "How Suzume tokenizes Japanese with a small built-in dictionary, pattern-based unknown-word candidates and connection scoring, and when to use which tool."
---

# How It Works

## Why So Small?

Suzume's WebAssembly binary, including its built-in dictionaries, is about <WasmSize /> gzipped. Dictionary-based analyzers often need tens of megabytes of dictionaries. How does Suzume keep its binary small?

### The Short Answer

| | MeCab with an IPADIC-style dictionary | Suzume |
|---|---------------------------------------|--------|
| Vocabulary | Loads a broad word list with morphological metadata | Stores selected words and exceptions |
| Connections | Loads a pre-computed connection-cost matrix | Computes connections from compact rules |
| Words not in the dictionary | Unknown-word definitions by character type | Pattern-generated candidates |

The exact MeCab setup used elsewhere in these docs is recorded in the [comparison baseline](/docs/mecab-comparison#comparison-baseline). Which tool fits which job is covered in [When to Use Which](#when-to-use-which).

### The Three Pillars

<DiagramPillars />

::: info What is Tokenization?
Breaking text into meaningful units (tokens) and identifying their parts of speech. For Japanese, this means segmenting continuous text like "東京に行く" into "東京 / に / 行く".
:::

## 1. Minimal Dictionary

Dictionary-based analyzers store exhaustive word lists:

```
# MeCab dictionary entry (simplified)
東京,noun,proper,place,*,*,*,東京,トウキョウ,トーキョー,0/3,C1
```

Suzume stores high-frequency function words, particles, auxiliaries, and selected exceptions. For many content words, it relies on character patterns and grammar rules instead of shipping every possible surface form.

| Category | Dictionary-based analyzer | Suzume |
|----------|---------------------------------|--------|
| Function words | Stored in the dictionary | Compact entries and grammar rules |
| Verbs and adjectives | Many surface/conjugated entries | Conjugation rules plus selected exceptions |
| General and proper nouns | Broad lexical coverage | Character-pattern candidates plus a compact dictionary |
| Domain-specific terms | Dictionary package or customization | Runtime user dictionary |

## 2. Pattern Recognition {#pattern-recognition}

Instead of storing every word, Suzume recognizes patterns:

<DiagramPattern />

::: info Why This Works
Japanese character types and inflectional endings provide useful candidate signals. Suzume combines those signals with dictionary entries and surrounding connection scores; a pattern match alone does not guarantee the final POS or boundary.
:::

Try it with your own text. The playground marks each token's origin, so you can see which tokens came from a dictionary and which were generated from patterns ([unknown words](/docs/glossary#unknown-word)):

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

Suzume decides boundaries and POS from shared rules for character types, conjugation and connections, so the same construction gets the same analysis wherever it appears: `じゃ` is an `AUX` with the lemma `だ` in `本じゃない`, `本じゃなかった` and `本じゃな` alike. This is a property of the rules, not a claim that Suzume's segmentation is the only correct one; see [Copula Negation](/docs/mecab-grammar#copula-negation), [Causative-Passive](/docs/mecab-grammar#causative-passive), and the known limits under [Constraints](/docs/mecab-comparison#constraints).

## Technical Deep Dive

::: info What is a Lattice?
A graph structure representing all possible ways to segment text. Each path through the lattice is a potential tokenization. For "すもも", possible paths include "すもも" (plum) or "す/もも" (vinegar + peach).
:::

::: info What is Viterbi Algorithm?
A dynamic programming algorithm that finds the optimal path through the lattice. Instead of evaluating every possible combination, it efficiently finds the best segmentation by reusing previous calculations.
:::

### Analysis Pipeline

<DiagramPipeline />

The pipeline always runs in this order. An [unknown word](/docs/glossary#unknown-word) such as `スカイツリー` takes the pattern branch: the katakana run yields a noun candidate, which competes with every other candidate in the lattice and survives only if Viterbi scores it best.

Options change what goes into and comes out of the pipeline, not the pipeline itself: [normalization](/docs/analysis-modes#normalization), the [segmentation mode and compound merging](/docs/analysis-modes#modes), dictionary loading, scorer configuration, and (in JavaScript) whether an instance uses an isolated WASM runtime. The full option set is in the [API reference](/docs/api).

### Verb Conjugation

Suzume derives regular inflected forms from shared conjugation rules instead of requiring each form as a hand-authored lexical entry. Selected dictionary entries can still be expanded into materialized forms when dictionaries are compiled or loaded; see the [user dictionary guide](/docs/user-dictionary) for the runtime case.

```
Base: 食べる (to eat)
├── 食べ + ない → negative
├── 食べ + ます → polite
├── 食べ + た → past
├── 食べ + て → te-form
└── 食べれ + ば → conditional
```

## When to Use Which {#when-to-use-which}

Suzume is built for compact tokenization for search and display, with one core running in browsers, edge and server runtimes, Python, Go and C/C++. A dictionary-based analyzer such as MeCab is a different tool, chosen when its dictionary's coverage and detailed taxonomy are requirements. The two outputs are not meant to be interchangeable, so agreement with MeCab is not Suzume's success metric.

| Requirement | Choose | Why |
|-------------|--------|-----|
| Tokenize in the browser or on the client, with no server | Suzume | Compact dictionaries are embedded in the WASM binary (about <WasmSize /> gzipped) |
| Tokenize as the user types | Suzume | No network round trip |
| Search indexing or tag extraction | Suzume | Compounds stay whole, or merge in [`search` mode](/docs/analysis-modes#modes) |
| Words that no dictionary lists | Suzume | Pattern-based candidates cover character sequences without an entry |
| The same tokenizer across browser, server, Python, Go and C/C++ | Suzume | One core behind every binding |
| Compatibility with a particular MeCab dictionary or corpus | MeCab | Keeps that dictionary's boundaries and taxonomy |
| Dictionary-defined boundaries inside compounds (`東京都庁前`) | MeCab | Boundaries come from the selected dictionary; with Suzume, register them in a [user dictionary](/docs/user-dictionary) |
| Readings and a detailed POS hierarchy | MeCab | The dictionary supplies them; Suzume's [POS](/docs/glossary#pos) set is coarser |

For concrete differences on the same input, see [Differences from MeCab](/docs/mecab-comparison).

## See also

- [Modes, Offsets, and Normalization](/docs/analysis-modes)
- [API reference](/docs/api)
- [Differences from MeCab](/docs/mecab-comparison)
- [Getting started](/docs/getting-started)
