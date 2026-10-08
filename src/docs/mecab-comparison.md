# Differences from MeCab

MeCab and Suzume can assign different word boundaries and POS labels to the same text. Choose a topic below to see concrete comparisons.

The source of truth for intentional differences is the [Python MeCab normalization pipeline](https://github.com/libraz/suzume/tree/main/scripts/mcp/src/suzume_mcp/core) used to generate test expectations.

## Find a topic

| What you want to compare | Details |
|---|---|
| Compounds, numbers and units, place names, suffix boundaries | [Compounds, Quantities, and Names](/docs/mecab-compounds) |
| Compound verbs and auxiliaries, particles, negatives, classical endings | [Verbs and Grammar](/docs/mecab-grammar) |
| Colloquial spelling, prolonged sounds, identifiers, URLs, symbols | [Text and Notation](/docs/mecab-text) |
| POS labels, lemmas, and extended POS on the same tokens | [POS Classification](/docs/pos-differences) |

## Comparison Baseline

Every MeCab boundary and displayed feature in this comparison guide was recorded from
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
different boundaries and labels from these examples. The normalization
pipeline linked above starts from this IPA-dictionary output and applies
Suzume's generalized comparison rules when generating test expectations.

::: info Reading the comparisons
In each comparison the **MeCab** row uses MeCab's Japanese POS names, and the **Suzume** row uses the public API tags (`NOUN`, `VERB`, `ADJ`, …) with the Japanese POS name shown next to each code. A colored underline marks every token, so where the two tokenizers split or merge is visible at a glance.
:::

## Design Philosophy

MeCab analyzes morphemes using the vocabulary, taxonomy, and connection costs of the selected dictionary. Suzume uses compact dictionaries and character, grammar, and connection rules to produce tokens for search and display.

| | MeCab | Suzume |
|--|-------|--------|
| **Approach** | Dictionary-driven | Feature-driven |
| **Dictionary** | External dictionary required; size and output depend on the selected dictionary | Compact dictionaries embedded in the WASM binary (~<WasmSize /> gzipped) |
| **Unknown words** | Falls back to character types | Pattern-based candidate generation |
| **Compound handling** | Boundaries follow the selected dictionary | Dictionary and structural rules; unknown runs may merge |
| **Target** | Detailed dictionary-based analysis | Compact search/display tokenization across browser, edge, and native runtimes |

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
