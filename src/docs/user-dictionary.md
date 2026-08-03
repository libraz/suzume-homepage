# User Dictionary

Use a user dictionary when a domain-specific word should be treated as one token or needs an explicit part of speech.

## Source Format

The source format is tab-separated text:

```text
surface<TAB>POS[<TAB>conj_type][<TAB>lemma]
```

| Field | Required | Description |
|-------|----------|-------------|
| `surface` | Yes | Text matched by the dictionary |
| `POS` | Yes | Part of speech |
| `conj_type` | No | Conjugation or proper-name marker |
| `lemma` | No | Base form; leave `conj_type` empty when only a lemma is needed |

This example contains a noun, a verb whose forms will be expanded, and a literal verb form with an explicit lemma:

```tsv
東京公園	NOUN
点検する	VERB	SURU
点検した	VERB		点検する
```

Use actual tab characters between fields. The delimiter is selected from the first data row, so do not mix TSV and CSV rows in one load. Blank lines and lines whose first non-whitespace character is `#` are ignored.

### Part-of-speech Values

| Value | Description | Japanese alias |
|-------|-------------|----------------|
| `NOUN` | Noun | `名詞` |
| `VERB` | Verb | `動詞` |
| `ADJ` | Adjective | `形容詞` |
| `ADV` | Adverb | `副詞` |
| `PARTICLE` | Particle | `助詞` |
| `AUX` | Auxiliary | `助動詞` |
| `CONJ` | Conjunction | `接続詞` |
| `DET` | Adnominal adjective | `連体詞` |
| `PRON` | Pronoun | `代名詞` |
| `PREFIX` | Prefix | `接頭辞` |
| `SUFFIX` | Suffix | `接尾辞` |
| `INTJ` | Interjection | `感動詞` |
| `SYMBOL` | Symbol | `記号` |
| `OTHER` | Other or phrase | `その他` |

The long English aliases accepted by the parser include `ADJECTIVE`, `ADVERB`, `AUXILIARY`, `CONJUNCTION`, `DETERMINER`, `PRONOUN`, `INTERJECTION`, and `SYM`. `PROPN` and `PROPER_NOUN` create a noun with the proper-noun classification.

::: tip Closed-class entries
`PARTICLE` and `AUX` are accepted, but each row produces a warning. Grammatical particles and auxiliaries normally belong in Suzume's built-in L1 rules rather than a user dictionary.
:::

### Conjugation Types

Set `conj_type` to describe conjugation or a more specific grammatical class. Matching verbs and i-adjectives generate inflected entries from the base form.

| Value | Use |
|-------|-----|
| `ICHIDAN` | Ichidan verb |
| `GODAN_KA`, `GODAN_GA`, `GODAN_SA`, `GODAN_TA` | Godan verb in the corresponding row |
| `GODAN_NA`, `GODAN_BA`, `GODAN_MA`, `GODAN_RA`, `GODAN_WA` | Godan verb in the corresponding row |
| `SURU`, `KURU` | Irregular verb |
| `I_ADJ`, `NA_ADJ` | I-adjective or na-adjective |
| `INTJ` | Interjection marker |
| `FAMILY`, `GIVEN` | Family-name or given-name marker |

`conj_type` is case-sensitive. A verb or i-adjective with a matching marker expands into the forms installed in the runtime dictionary. This is why an expanded-entry count can be larger than the number of source rows.

### Legacy CSV Compatibility

The legacy three-column CSV form remains accepted:

```csv
東京公園,NOUN,5000
```

Its third field is a compatibility cost column. Suzume ignores the value; it cannot change matching priority. Write new dictionaries in TSV and use `conj_type` when inflection expansion is required.

## Runtime Loading

Each successful call adds another source or binary dictionary to the same analyzer. The native CLI applies each repeatable `--dict` argument to the analyzer used by that command.

::: code-group

```typescript [Node]
import { Suzume } from '@libraz/suzume'

const suzume = await Suzume.create()
const source = '東京公園\tNOUN\n点検する\tVERB\tSURU\n'

try {
  const expandedCount = suzume.loadUserDictionaryCount(source)
  if (expandedCount === 0) {
    throw new Error(suzume.lastError)
  }
} finally {
  suzume.destroy()
}
```

```python [Python]
from suzume import Suzume

source = "東京公園\tNOUN\n点検する\tVERB\tSURU\n"

with Suzume() as suzume:
    expanded_count = suzume.load_user_dict(source)
```

```go [Go]
package main

import (
	"log"

	"github.com/libraz/go-suzume"
)

func main() {
	analyzer, err := suzume.New()
	if err != nil {
		log.Fatal(err)
	}
	defer analyzer.Close()

	source := []byte("東京公園\tNOUN\n点検する\tVERB\tSURU\n")
	if err := analyzer.LoadUserDictionary(source); err != nil {
		log.Fatal(err)
	}
}
```

```cpp [C++]
#include "suzume/suzume.hpp"

#include <cstddef>

int main() {
  suzume::Tokenizer tokenizer;
  const std::size_t expanded_count =
      tokenizer.loadUserDictionaryCount("東京公園\tNOUN\n点検する\tVERB\tSURU\n");
  return expanded_count == 0 ? 1 : 0;
}
```

```bash [Native CLI]
# user.tsv contains the same tab-separated rows.
# --dict is repeatable and also accepts compiled .dic files.
suzume-cli analyze --dict user.tsv "東京公園を点検する"
```

:::

The Go binding's current `LoadUserDictionary([]byte) error` API reports success or failure but does not return the expanded-entry count. It also has no `ClearUserDictionaries` method. Do not infer those operations from the C ABI.

### Return Values and Errors

| Surface | Source dictionary result | Failure details |
|---------|--------------------------|-----------------|
| Node | `loadUserDictionary()` returns `boolean`; `loadUserDictionaryCount()` returns the expanded-entry count | Read `lastError` / `lastErrorCode`, or use `loadUserDictionaryOrThrow()` |
| Python | `load_user_dict()` returns the expanded-entry count | Raises `SuzumeError` |
| Go | `LoadUserDictionary()` returns `error` | The returned error includes the native message when available |
| C++ | `loadUserDictionary()` returns `bool`; `loadUserDictionaryCount()` returns the expanded-entry count | Read `Tokenizer::lastError()` / `lastErrorCode()` |
| C ABI | `suzume_load_user_dict()` returns `1` or `0`; `suzume_load_user_dict_count()` returns the expanded-entry count | Read `suzume_last_error()` / `suzume_last_error_code()` |
| Native CLI | Exits nonzero when a dictionary cannot be loaded | Prints the load error to standard error |

The count APIs return `0` on failure. A successful source load always installs at least one entry. The count is measured after conjugation expansion and duplicate removal, not by counting source rows.

A failed source or binary load does not remove or replace dictionaries already installed on the analyzer. It also does not install the valid prefix of a source file. Successful loads remain additive until they are cleared or the analyzer is destroyed.

### Warnings and Partially Valid Input

Runtime source loading skips a record with fewer than two fields. If another row is valid, the valid rows are installed and the skipped row is recorded as a warning:

```text
missing-pos
東京公園	NOUN
```

Warnings from runtime loads are appended to the analyzer's dictionary-warning list. Read them through `dictionaryWarnings` in Node, `dictionary_warnings` in Python, `DictionaryWarnings()` in Go, `Tokenizer::dictionaryWarnings()` in C++, or the `suzume_dictionary_warning_*` C functions. `clearUserDictionaries()` and its equivalents clear runtime-load warnings but retain construction-time warnings. The native CLI does not currently print warnings added while processing a `--dict` source file.

If every data row is skipped, the load fails because there are no loadable entries. Unknown POS values, empty required fields, invalid UTF-8, malformed legacy CSV quoting, and unexpected non-empty columns also fail the whole load.

## Clearing Caller-loaded Dictionaries

Clearing removes every source and binary user dictionary explicitly loaded on that analyzer:

| Surface | Clear operation |
|---------|-----------------|
| Node | `suzume.clearUserDictionaries()` |
| Python | `suzume.clear_user_dictionaries()` |
| Go | Not exposed by the current binding |
| C++ | `tokenizer.clearUserDictionaries()` |
| C ABI | `suzume_clear_user_dictionaries(handle)` |
| Native CLI | No persistent analyzer to clear; dictionaries last for one invocation |

The automatically loaded bundled user dictionary remains installed. Built-in and core dictionaries are also unaffected.

## Verifying a Match

An analyzed morpheme has `isUserDict` in Node, `is_user_dict` in Python and C++, `IsUserDict` in Go, or the `SUZUME_MORPHEME_USER_DICT` flag in C. The value is true when the selected token came from a user dictionary, including the bundled user dictionary.

## Binary Dictionaries

Compile source TSV when startup time matters or when the same dictionary will be loaded repeatedly:

```bash
suzume-cli dict compile user.tsv   # writes user.dic
```

Load `.dic` bytes with `loadBinaryDictionary()` in Node and C++, `load_binary_dict()` in Python, `LoadBinaryDictionary()` in Go, or `suzume_load_binary_dict()` in C. The native CLI accepts a `.dic` path through `--dict`.

Binary loads are additive and preserve existing dictionaries on failure. The current `.dic` format is version 4. Suzume rejects other binary format versions, so keep the TSV source and recompile it with the current CLI when needed.

The file has a 16-byte `SZMD` header, a front-coded surface table, a grammar palette, an adaptive entry array, and an optional deduplicated lemma table. Repeated surfaces can retain distinct grammatical entries.

## Persistence

Caller-loaded dictionaries live in the analyzer instance and disappear when it is destroyed. Store the TSV source or compiled `.dic` in your application, then load it into each new analyzer.

## Recommended Practice

1. Use canonical TSV with literal tab characters.
2. Add only words whose current tokenization or part of speech needs an override.
3. Supply `conj_type` for verbs and adjectives that need inflected forms.
4. Check the expanded-entry count or binding-specific error after each load.
5. Analyze a representative sentence and inspect the user-dictionary flag.

## See Also

- [API Reference](/docs/api) for dictionary methods, errors, warnings, and morpheme fields.
- [C / C++ Library](/docs/cpp) for the C++ wrapper and stable C ABI.
- [Python API](/docs/python) for Python return types and exceptions.
- [Go Bindings](/docs/go) for the cgo API.
- [Native CLI](/docs/cli) for compiling, inspecting, and loading dictionary files.
