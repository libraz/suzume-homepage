# C / C++ Library

Suzume ships a native static library, an optional shared library, and two public headers:

| Header | Language | API |
|--------|----------|-----|
| `suzume/suzume.hpp` | C++17 | Header-only RAII wrapper (`suzume::Tokenizer`) |
| `suzume/suzume_c.h` | C | C ABI (`suzume_*` functions) |

The C++ wrapper owns the C handle and copies results into `std::string` and `std::vector`. Native failures are reported through `lastError()` and `lastErrorCode()` rather than exceptions. Its own standard-library allocations can still throw `std::bad_alloc`.

## Requirements

- C++17 compiler (GCC 8+, Clang 10+, Apple Clang 12+, MSVC 2019+)
- CMake 3.15 or later

The core has no third-party runtime dependency such as ICU or Boost. Native programs still need a C++ runtime and a heap.

## Install

Build and install the libraries, headers, CMake package config, pkg-config file, CLI, and compiled dictionaries:

```bash
git clone https://github.com/libraz/suzume.git
cd suzume
make install                 # /usr/local; override with PREFIX=/opt/suzume
```

`make install` builds both `suzume::suzume` (static) and `suzume::suzume_shared` (shared). Without dictionary embedding, `core.dic` and `user.dic` are installed under `<prefix>/share/suzume`.

## C++ Usage

`analyzeWithNormalizedText()` returns the normalized text used for offsets together with the morphemes:

```cpp
#include <cstdio>

#include "suzume/suzume.hpp"

int main() {
  suzume::Tokenizer tokenizer;
  if (!tokenizer) {
    std::fprintf(stderr, "%s\n", suzume::Tokenizer::lastError().c_str());
    return 1;
  }

  const auto result = tokenizer.analyzeWithNormalizedText("東京都に住んでいます");
  if (result.morphemes.empty() &&
      suzume::Tokenizer::lastErrorCode() != SUZUME_ERROR_SUCCESS) {
    std::fprintf(stderr, "%s\n", suzume::Tokenizer::lastError().c_str());
    return 1;
  }

  for (const suzume::Morpheme& m : result.morphemes) {
    std::printf("%s\t%s\t%s\n",
                m.surface.c_str(), m.pos.c_str(), m.base_form.c_str());
  }

  for (const suzume::Tag& tag :
       tokenizer.generateTags("東京スカイツリーに行きました")) {
    std::printf("%s\t%s\n", tag.tag.c_str(), tag.pos.c_str());
  }
}
```

`analyze()` returns only the morpheme vector. Both analysis methods accept `std::string_view`, so a substring does not need a temporary NUL-terminated copy. `Tokenizer` is move-only and calls `suzume_destroy()` from its destructor.

Use `Morpheme::base_form` in new code. `Morpheme::lemma` is a deprecated source-compatibility alias containing the same value.

## C Usage

The explicit-range functions accept a pointer and byte count. They preserve an embedded U+0000 in the input:

```c
#include <stdio.h>

#include "suzume/suzume_c.h"

int main(void) {
  if (suzume_abi_version() != SUZUME_ABI_VERSION) {
    fputs("Suzume header/library ABI mismatch\n", stderr);
    return 1;
  }

  suzume_t handle = suzume_create();
  if (handle == NULL) {
    fprintf(stderr, "%s\n", suzume_last_error());
    return 1;
  }

  static const char text[] = "東京都に住んでいます";
  suzume_result_t* result =
      suzume_analyze_n(handle, text, sizeof(text) - 1);
  if (result == NULL) {
    fprintf(stderr, "%s\n", suzume_last_error());
    suzume_destroy(handle);
    return 1;
  }

  for (size_t i = 0; i < result->count; ++i) {
    const suzume_morpheme_t* m = &result->morphemes[i];
    const char* pos = suzume_pos_label(m->pos);
    fwrite(m->surface, 1, m->surface_size, stdout);
    printf("\t%s\t", pos != NULL ? pos : "UNKNOWN");
    fwrite(m->base_form, 1, m->base_form_size, stdout);
    putchar('\n');
  }

  suzume_result_free(result);
  suzume_destroy(handle);
  return 0;
}
```

The convenience functions `suzume_analyze()`, `suzume_generate_tags()`, and `suzume_generate_tags_with_options()` read NUL-terminated input. Their `_n` variants take an explicit byte range:

- `suzume_analyze_n(handle, text, size)`
- `suzume_generate_tags_n(handle, text, size)`
- `suzume_generate_tags_with_options_n(handle, text, size, options)`

Empty input is valid and returns a non-NULL result with `count == 0`. Invalid UTF-8 returns NULL and sets the last error.

## Analysis Results

`Tokenizer::analyzeWithNormalizedText()` returns `suzume::AnalysisResult`. The C counterpart is `suzume_result_t`:

| C++ | C | Description |
|-----|---|-------------|
| `normalized_text` | `normalized_text`, `normalized_text_size` | Normalized UTF-8 and its byte length |
| `morphemes` | `morphemes`, `count` | Morpheme array and element count |

`start` and `end` are character offsets into the normalized text, not UTF-8 byte offsets.

| C++ `Morpheme` | C `suzume_morpheme_t` | Description |
|----------------|-------------------------|-------------|
| `surface` | `surface`, `surface_size` | Surface UTF-8 view and byte length |
| `base_form` | `base_form`, `base_form_size` | Dictionary/base form and byte length |
| `pos` / `pos_ja` | `pos` | English/Japanese labels in C++; stable `SUZUME_POS_*` code in C |
| `conj_type` | `conjugation_type` | Japanese label in C++; stable numeric code in C |
| `conj_form` | `conjugation_form` | Japanese label in C++; stable numeric code in C |
| `extended_pos` | `extended_pos` | Stable label in C++; stable numeric code in C |
| `start`, `end` | `start`, `end` | Character range in normalized text |
| `score` | `score` | Analysis score |
| Boolean fields | `flags` | Decoded in C++; bit field in C |

The C strings and arrays are borrowed from the containing result. Use the explicit sizes rather than `strlen()` for `normalized_text`, `surface`, and `base_form`; each may contain U+0000.

The `flags` bits are:

| Bit | C++ field / meaning |
|-----|---------------------|
| `SUZUME_MORPHEME_USER_DICT` | `is_user_dict` |
| `SUZUME_MORPHEME_FORMAL_NOUN` | `is_formal_noun` |
| `SUZUME_MORPHEME_LOW_INFO` | `is_low_info` |
| `SUZUME_MORPHEME_UNKNOWN` | `is_unknown` |
| `SUZUME_MORPHEME_FROM_DICTIONARY` | `is_from_dictionary` |
| `SUZUME_MORPHEME_CONJUGATABLE` | Conjugation fields are meaningful |

## Modes and Options

The modes are `Mode::Normal`, `Mode::Search`, and `Mode::Split` in C++, with matching `SUZUME_MODE_NORMAL`, `SUZUME_MODE_SEARCH`, and `SUZUME_MODE_SPLIT` codes in C.

```cpp
suzume::Options options;
options.mode = suzume::Mode::Search;
options.merge_compounds = true;

suzume::Tokenizer tokenizer(options);
tokenizer.setMode(suzume::Mode::Split);
const suzume::Mode current = tokenizer.mode();
```

The C accessors are `suzume_set_mode()` and `suzume_mode()`. An invalid handle makes `suzume_mode()` return `SUZUME_MODE_INVALID`.

| C++ `Options` / C field | Default | Meaning |
|-------------------------|---------|---------|
| `preserve_vu` | `true` | Preserve ヴ during normalization |
| `preserve_case` | `true` | Preserve ASCII case |
| `preserve_symbols` | `false` | Keep punctuation-like `SYMBOL` tokens; content symbols and emoji remain `OTHER` either way |
| `mode` | Normal | Analysis mode |
| `lemmatize` | `true` | Apply corrected source lemmas |
| `merge_compounds` | `false` | Merge consecutive noun compounds |
| `skip_user_dictionary` | `false` | Skip automatic bundled user-dictionary loading |
| `skip_core_dictionary` | `false` | Skip automatic core-dictionary loading |
| `skip_env_config` | `false` | Ignore native scorer environment variables |
| `report_scorer_config` | `false` | Add scorer configuration to dictionary warnings |
| `scorer_options_json` | empty / NULL | JSON scorer overrides |
| `data_directory` | empty / NULL | Exclusive dictionary directory; empty uses normal search paths |

Content-bearing symbols such as currency, units, arrows, technical marks, and emoji remain `OTHER` with the default options. `preserve_symbols` controls punctuation-like `SYMBOL` tokens such as `。`.

In C, initialize the struct before changing fields:

```c
suzume_extended_options_t options;
suzume_init_extended_options(&options);
options.mode = SUZUME_MODE_SEARCH;
options.merge_compounds = 1;
suzume_t handle = suzume_create_with_extended_options(&options);
```

The initializer matters because several defaults are true. String pointers in `suzume_extended_options_t` are borrowed only for `suzume_create_with_extended_options()`.

## Tag Generation

`Tag` contains `tag` and its English `pos` label. C returns parallel `tags` and numeric `pos` arrays in `suzume_tags_t`.

```cpp
suzume::TagOptions options;
options.pos_filter =
    SUZUME_TAG_POS_NOUN | SUZUME_TAG_POS_PARTICLE;
options.exclude_particles = false;
options.max_tags = 10;

const auto tags =
    tokenizer.generateTags("東京都の天気予報を確認する", options);
```

| `TagOptions` / C field | Default | Meaning |
|------------------------|---------|---------|
| `pos_filter` | `0` | `SUZUME_TAG_POS_*` bitmask; 0 includes every filterable POS |
| `exclude_basic` | `false` | Exclude hiragana-only base forms |
| `use_lemma` | `true` | Generate from the base form instead of the surface |
| `min_length` | `2` | Minimum characters |
| `max_tags` | `0` | Maximum tags; 0 is unlimited |
| `exclude_particles` | `true` | Exclude particles |
| `exclude_auxiliaries` | `true` | Exclude auxiliary verbs |
| `exclude_formal_nouns` | `true` | Exclude formal nouns |
| `exclude_low_info` | `true` | Exclude low-information words |
| `remove_duplicates` | `true` | Remove duplicate tags |

The filter bits are `SUZUME_TAG_POS_NOUN`, `SUZUME_TAG_POS_VERB`, `SUZUME_TAG_POS_ADJECTIVE`, `SUZUME_TAG_POS_ADVERB`, `SUZUME_TAG_POS_PARTICLE`, and `SUZUME_TAG_POS_AUXILIARY`. A filter bit does not override an `exclude_*` option, so set `exclude_particles` or `exclude_auxiliaries` to false when including those parts of speech.

C callers must run `suzume_init_tag_options()` before overriding fields, then call `suzume_generate_tags_with_options()` or its `_n` variant.

## Labels, Errors, and Dictionaries

The C ABI uses stable numeric codes. These helpers return static labels; do not free them:

- `suzume_pos_label()`
- `suzume_extended_pos_label()`
- `suzume_conjugation_type_label()`
- `suzume_conjugation_form_label()`

Failures return NULL, 0, or a false-like code. Read `suzume_last_error()` and `suzume_last_error_code()` immediately. The message is thread-local, borrowed, and invalidated when a later C API call clears or replaces it. Stable codes range from `SUZUME_ERROR_SUCCESS` through invalid UTF-8, dictionary, file, parse, out-of-memory, invalid-input, and internal errors. C++ exposes the same values as `Tokenizer::lastError()` and `Tokenizer::lastErrorCode()`.

User-dictionary APIs are additive:

| C++ | C | Purpose |
|-----|---|---------|
| `loadUserDictionary()` | `suzume_load_user_dict()` | Load UTF-8 TSV or legacy 3-column CSV bytes |
| `loadUserDictionaryCount()` | `suzume_load_user_dict_count()` | Load source entries and return the installed count |
| `loadBinaryDictionary()` | `suzume_load_binary_dict()` | Load a compiled `.dic` from memory |
| `clearUserDictionaries()` | `suzume_clear_user_dictionaries()` | Remove caller-loaded dictionaries; keep the bundled user dictionary |
| `hasCoreDictionary()` | `suzume_has_core_dictionary()` | Test whether the L2 core dictionary is loaded |
| `dictionaryWarnings()` | `suzume_dictionary_warning_count()`, `suzume_dictionary_warning()` | Read loading, parsing, and scorer diagnostics |

Current TSV rows use `surface<TAB>POS[<TAB>conj_type][<TAB>lemma]`:

```cpp
const std::size_t loaded =
    tokenizer.loadUserDictionaryCount("東京スカイツリー\tNOUN\n");
if (loaded == 0 &&
    suzume::Tokenizer::lastErrorCode() != SUZUME_ERROR_SUCCESS) {
  // Load failed.
}
```

A count of zero is not enough to identify failure; check the error code. A failed binary load preserves the dictionaries already attached to the handle. `suzume_dictionary_warning()` returns a borrowed pointer that lasts until the next warning lookup on that thread or until the handle is destroyed, whichever comes first.

The linked library version is available as `suzume::Tokenizer::version()` in C++ and `suzume_version()` in C. Both return the library's semantic-version string.

## Ownership and Allocation Failure

Every non-NULL `suzume_result_t*` must be freed exactly once with `suzume_result_free()`. Its arrays and strings become invalid together. The same rule applies to `suzume_tags_t*` and `suzume_tags_free()`. Destroy each handle with `suzume_destroy()`. All three free/destroy functions accept NULL.

No C++ exception crosses the C ABI. In a native build with exceptions enabled, allocation failure becomes the documented failure return plus `SUZUME_ERROR_OUT_OF_MEMORY`. Builds made with `-fno-exceptions`, including the WASM package, cannot recover from allocation failure and terminate instead. The C++ wrapper copies successful C results into owning standard-library containers, whose allocations may throw `std::bad_alloc`.

## ABI Compatibility

The current C ABI revision is 1:

```c
if (suzume_abi_version() != SUZUME_ABI_VERSION) {
  /* Recompile or deploy a matching header and library before continuing. */
  return 1;
}
```

Run this check before using any struct returned by the library whenever headers and the linked or dynamically loaded library are obtained separately. A mismatch means sizes or field offsets may differ. Recompile the consumer against the deployed library's header, or deploy the matching library. Removing or changing a symbol also fails at link/load time.

The `suzume_sizeof_*()` and `suzume_offsetof_*()` functions are layout oracles for binding generators and ABI tests. They report the library's struct layout; they do not replace the ABI-version comparison.

The installed CMake package and pkg-config metadata normally keep headers and the library under one prefix:

```cmake
find_package(suzume CONFIG REQUIRED)

target_link_libraries(myapp PRIVATE suzume::suzume)          # static
# target_link_libraries(myapp PRIVATE suzume::suzume_shared) # shared, if built
```

A C executable linked to the static archive needs the C++ linker driver:

```cmake
set_target_properties(myapp PROPERTIES LINKER_LANGUAGE CXX)
```

For pkg-config:

```bash
cc -c myapp.c $(pkg-config --cflags suzume) -o myapp.o
c++ myapp.o $(pkg-config --libs suzume) -o myapp
```

Runnable C and C++ programs and a standalone `find_package` consumer are in [`examples/`](https://github.com/libraz/suzume/tree/main/examples).

## Embedded Dictionaries

Configure with `-DSUZUME_EMBED_DICT=ON`, or use the convenience target:

```bash
make embedded
```

This bakes `core.dic` and `user.dic` into the static library and disables dictionary-file discovery. Scorer configuration can still read `SUZUME_SCORER_CONFIG`; set `Options::skip_env_config = true` (or the C option field with the same name) when the process must not consult environment-based files. The library supports hosted embedded or RTOS targets with a C++ runtime and heap, not a freestanding bare-metal target.

## Thread Safety

A handle contains mutable analyzer state. Do not run analysis or tag generation concurrently on one handle. Use one `Tokenizer` or `suzume_t` per thread, or serialize access. Distinct handles can be used concurrently.

## See Also

- [API Reference](/docs/api) for POS and `extendedPos` values.
- [Native Build & CLI](/docs/native-build) for source-build options.
- [Getting Started](/docs/getting-started) for the other bindings.
