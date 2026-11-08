---
title: "Add Custom Words with a User Dictionary"
description: "Keep domain terms as one token or set their part of speech and lemma: write a TSV user dictionary, load it at runtime, and compile it into a binary dictionary."
---

# User Dictionary

Use a [user dictionary](/docs/glossary#user-dictionary) when a domain-specific word should be treated as one token or needs an explicit part of speech or [lemma](/docs/glossary#lemma).

## Quick Start

Without a dictionary, `量子もつれ` (quantum entanglement) splits into two tokens. One TSV row joins it:

```typescript
import { Suzume } from '@libraz/suzume'

const suzume = await Suzume.create()
const show = () => suzume.analyze('量子もつれを観測した').map((m) => m.surface).join(' | ')

console.log(show()) // 量子 | もつれ | を | 観測 | し | た
suzume.loadUserDictionary('量子もつれ\tNOUN\n')
console.log(show()) // 量子もつれ | を | 観測 | し | た
suzume.destroy()
```

Try your own rows here. The demo analyzes the same text with and without the dictionary:

<UserDictDemo />

## Source Format

The source format is tab-separated text:

```text
surface<TAB>POS[<TAB>conj_type][<TAB>lemma]
```

| Field | Required | Description |
|-------|----------|-------------|
| `surface` | Yes | Text matched by the dictionary |
| `POS` | Yes | [Part of speech](/docs/glossary#pos) |
| `conj_type` | No | [Conjugation type](/docs/glossary#conjugation-type) or proper-name marker |
| `lemma` | No | Lemma; leave `conj_type` empty when only a lemma is needed |

This example registers a noun, a verb whose forms are expanded, and a noun with an explicit lemma, one per row:

```tsv
量子もつれ	NOUN
もふる	VERB	GODAN_RA
スマホ	NOUN		スマートフォン
```

Each row changes the analysis of a sentence:

| Row | Sentence | Without the row | With the row |
|-----|----------|-----------------|--------------|
| `量子もつれ` `NOUN` | 量子もつれを観測した | 量子 / もつれ / を / 観測 / し / た | 量子もつれ / を / 観測 / し / た |
| `もふる` `VERB` `GODAN_RA` | 猫をもふった | 猫 / を / も / ふっ / た | 猫 / を / もふっ / た (`もふっ` has lemma `もふる`) |
| `スマホ` `NOUN` (lemma `スマートフォン`) | スマホを買った | `スマホ` has lemma `スマホ` | `スマホ` has lemma `スマートフォン` |

Use actual tab characters between fields. The delimiter is selected from the first data row, so do not mix TSV and CSV rows in one load. Blank lines and lines whose first non-whitespace character is `#` are ignored.

Field lengths are counted in bytes after UTF-8 encoding, so the maximum number of characters depends on the text:

| Field | Loaded from source at runtime | Compiled into a `.dic` file |
|-------|-------------------------------|-----------------------------|
| `surface` | At most 255 bytes | At most 255 bytes |
| `lemma` | No byte limit | At most 255 bytes; `dict compile` rejects a longer lemma |

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

Set `conj_type` to describe conjugation or a more specific grammatical class. Matching verbs and i-adjectives generate inflected entries from the lemma.

| Value | Use |
|-------|-----|
| `ICHIDAN` | Ichidan verb |
| `GODAN_KA`, `GODAN_GA`, `GODAN_SA`, `GODAN_TA` | Godan verb in the corresponding row |
| `GODAN_NA`, `GODAN_BA`, `GODAN_MA`, `GODAN_RA`, `GODAN_WA` | Godan verb in the corresponding row |
| `SURU`, `KURU` | Irregular verb |
| `I_ADJ`, `NA_ADJ` | I-adjective or na-adjective |
| `INTJ` | Interjection marker |
| `FAMILY`, `GIVEN` | Family-name or given-name marker |

`conj_type` is case-sensitive. A verb or i-adjective with a matching marker expands into its inflected forms, and each form becomes its own runtime entry.

<DiagramConjExpansion />

A third field that is neither a marker nor a number is read as the lemma. A misspelled or lowercase marker such as `suru` therefore loads without a warning, as a lemma, and no forms are expanded.

::: tip How to pick conj_type
Find the class from the dictionary form. See [godan and ichidan](/docs/glossary#godan-ichidan) for the verb distinction.

| Entry | `POS` | `conj_type` | Class |
|-------|-------|-------------|-------|
| 食べる | `VERB` | `ICHIDAN` | Ichidan verb: 食べない, 食べます |
| 書く | `VERB` | `GODAN_KA` | Godan verb ending in く: 書かない, 書きます |
| 話す | `VERB` | `GODAN_SA` | Godan verb ending in す: 話さない, 話します |
| 点検する | `VERB` | `SURU` | Noun + する |
| 高い | `ADJ` | `I_ADJ` | I-adjective: 高くない |
| 静か | `ADJ` | `NA_ADJ` | Na-adjective: 静かな |

A wrong pick fails silently: the row loads with no error and no warning, but expands into the wrong forms, as the `ICHIDAN` row in the figure above shows. After loading, analyze a conjugated sentence and check the [user-dictionary flag](#verifying-a-match).
:::

### Legacy CSV Compatibility

The legacy three-column CSV form remains accepted:

```csv
量子もつれ,NOUN,5000
```

Its third field is a compatibility cost column. Suzume ignores the value; it cannot change matching priority. Write new dictionaries in TSV and use `conj_type` when inflection expansion is required.

## Runtime Loading

Each successful call adds another source or binary dictionary to the same instance. The CLIs apply each repeatable `--dict` argument to the instance used by that command.

::: code-group

```typescript [JavaScript]
import { Suzume } from '@libraz/suzume'

const suzume = await Suzume.create()
const source = '量子もつれ\tNOUN\nもふる\tVERB\tGODAN_RA\n'

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

source = "量子もつれ\tNOUN\nもふる\tVERB\tGODAN_RA\n"

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

	source := []byte("量子もつれ\tNOUN\nもふる\tVERB\tGODAN_RA\n")
	if _, err := analyzer.LoadUserDictionaryCount(source); err != nil {
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
      tokenizer.loadUserDictionaryCount("量子もつれ\tNOUN\nもふる\tVERB\tGODAN_RA\n");
  return expanded_count == 0 ? 1 : 0;
}
```

```c [C]
#include "suzume/suzume_c.h"
#include <string.h>

int main(void) {
  suzume_t tokenizer = suzume_create();
  if (!tokenizer) return 1;
  const char* source = "量子もつれ\tNOUN\nもふる\tVERB\tGODAN_RA\n";
  const size_t expanded_count =
      suzume_load_user_dict_count(tokenizer, source, strlen(source));
  suzume_destroy(tokenizer);
  return expanded_count == 0 ? 1 : 0;
}
```

```bash [CLI]
# user.tsv contains the same tab-separated rows.
# --dict is repeatable and also accepts compiled .dic files.
suzume --dict user.tsv "量子もつれを観測した"                 # Python wheel
suzume-cli analyze --dict user.tsv "量子もつれを観測した"     # native CLI
```

:::

### Return Values and Errors

| Binding | Source dictionary result | Failure details |
|---------|--------------------------|-----------------|
| JavaScript | `loadUserDictionary()` returns `boolean`; `loadUserDictionaryCount()` returns the expanded-entry count | Read `lastError` / `lastErrorCode`, or use `loadUserDictionaryOrThrow()` |
| Python | `load_user_dict()` returns the expanded-entry count | Raises `SuzumeError` |
| Go | `LoadUserDictionary()` returns `error`; `LoadUserDictionaryCount()` returns `(int, error)` | The returned error includes the native message when available |
| C++ | `loadUserDictionary()` returns `bool`; `loadUserDictionaryCount()` returns the expanded-entry count | Read `Tokenizer::lastError()` / `lastErrorCode()` |
| C ABI | `suzume_load_user_dict()` returns `1` or `0`; `suzume_load_user_dict_count()` returns the expanded-entry count | Read `suzume_last_error()` / `suzume_last_error_code()` |
| CLI | Exits nonzero when a dictionary cannot be loaded | Prints the load error to standard error |

The count APIs return `0` on failure. A successful source load always installs at least one entry. The count is measured after conjugation expansion and duplicate removal, not by counting source rows.

A failed source or binary load does not remove or replace dictionaries already installed on the instance. It also does not install the valid prefix of a source file. Successful loads remain additive until they are cleared or the instance is destroyed.

### Warnings and Partially Valid Input

Runtime source loading skips a record with fewer than two fields. If another row is valid, the valid rows are installed and the skipped row is recorded as a warning:

```text
missing-pos
量子もつれ	NOUN
```

An entry can also be parsed successfully and then rejected during installation, for example when its surface exceeds the 255-byte limit. Such expanded entries are skipped with a warning when at least one other entry installs. If every expanded entry is rejected, the load fails. Invalid UTF-8 is a parse error and rejects the whole load instead.

Warnings from runtime loads are appended to the instance's dictionary-warning list:

| Binding | Read warnings |
|---------|---------------|
| JavaScript | `dictionaryWarnings` |
| Python | `dictionary_warnings` |
| Go | `DictionaryWarnings()` |
| C++ | `Tokenizer::dictionaryWarnings()` |
| C ABI | `suzume_dictionary_warning_count()` and `suzume_dictionary_warning()` |
| Native CLI | Not printed for a `--dict` source file |

`clearUserDictionaries()` and its equivalents clear runtime-load warnings but retain construction-time warnings.

If every data row is skipped, the load fails because there are no loadable entries. Unknown POS values, empty required fields, invalid UTF-8, and malformed legacy CSV quoting also fail the whole load. Unexpected non-empty TSV columns reject the whole load; legacy CSV ignores columns after the fourth field.

## Dictionary Layers {#dictionary-layers}

<DiagramDictionaryLayers />

All four layers are consulted at every position, and no layer hides another layer's entries. The built-in layer is always present, `core.dic` and `user.dic` load automatically when the instance is created, and caller-loaded dictionaries come from the [runtime loading](#runtime-loading) calls and stay until they are cleared or the instance is destroyed. Entries from the bundled and caller-loaded user dictionaries receive a score bonus, which is why a user-dictionary row usually wins over the split it replaces.

Tokens from both user-dictionary layers report the [user-dictionary flag](#verifying-a-match). The npm package, the PyPI wheel, and the Go binding embed or ship `core.dic` and `user.dic`, so no setup is needed.

The skip options apply only when an instance is created. Clearing removes every source and binary dictionary loaded on that instance and leaves the other three layers in place:

| Binding | Skip `core.dic` | Skip bundled `user.dic` | Clear caller-loaded dictionaries |
|---------|-----------------|-------------------------|----------------------------------|
| JavaScript | `skipCoreDictionary: true` | `skipUserDictionary: true` | `clearUserDictionaries()` |
| Python | `skip_core_dictionary=True` | `skip_user_dictionary=True` | `clear_user_dictionaries()` |
| Go | `ExtendedOptions.SkipCoreDictionary` | `ExtendedOptions.SkipUserDictionary` | `ClearUserDictionaries()`, which returns `error` |
| C++ | `Options::skip_core_dictionary` | `Options::skip_user_dictionary` | `clearUserDictionaries()` |
| C ABI | `skip_core_dictionary` in `suzume_extended_options_t` | `skip_user_dictionary` in `suzume_extended_options_t` | `suzume_clear_user_dictionaries(handle)` |
| CLI | `--no-core-dict` | `--no-user-dict` | Not needed; dictionaries last for one invocation |

`--no-user-dict` skips only the bundled `user.dic`; files passed with `--dict` still load.

## Verifying a Match

A token reports whether it came from a user dictionary, including the bundled one:

| Binding | Flag |
|---------|------|
| JavaScript | `isUserDict` |
| Python | `is_user_dict` |
| Go | `IsUserDict` |
| C++ | `is_user_dict` |
| C ABI | `SUZUME_MORPHEME_USER_DICT` flag |

## Binary Dictionaries

Compile source TSV when startup time matters or when the same dictionary will be loaded repeatedly. Compiling needs the native [`suzume-cli`](/docs/installation#suzume-cli), which the npm package and the PyPI wheel do not include.

```bash
suzume-cli dict compile user.tsv   # writes user.dic
```

<DiagramBinaryDictFlow />

The C ABI loads the same bytes with `suzume_load_binary_dict()`. See [`dict` in the Native CLI reference](/docs/cli#dict) for the compiler and the file layout.

## Persistence

Caller-loaded dictionaries live in the instance and disappear when it is destroyed. Store the TSV source or compiled `.dic` in your application, then load it into each new instance.

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
