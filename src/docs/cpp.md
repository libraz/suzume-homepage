# C / C++ Library

Suzume can be linked directly into native C and C++ programs — no WebAssembly, no JavaScript, and no runtime dependencies. The core is the same C++ tokenizer used by the WASM and Python bindings; here you consume it as an ordinary static or shared library, or embed it with the dictionaries baked in.

Two entry points ship in the same package:

| Header | Language | API |
|--------|----------|-----|
| `suzume/suzume.hpp` | C++ | Header-only RAII wrapper (`suzume::Tokenizer`) |
| `suzume/suzume_c.h` | C | Stable C ABI (`suzume_*` functions) |

The C++ wrapper is a thin, exception-free layer over the C ABI, so it stays ABI-compatible across releases.

## Requirements

- C++17 compiler (GCC 8+, Clang 10+, Apple Clang 12+, MSVC 2019+)
- CMake 3.15 or later

The core has no external runtime dependencies — no threads, ICU, or Boost.

## Install

Build and install the library, headers, CMake package config, and pkg-config file from source:

```bash
git clone https://github.com/libraz/suzume.git
cd suzume
make install                 # into /usr/local; override with PREFIX=/opt/suzume
```

This installs both the static (`suzume::suzume`) and shared (`suzume::suzume_shared`) targets. Unless you embed them, the compiled dictionaries are installed to `<prefix>/share/suzume` and found automatically at runtime.

## C++ Usage

Include the header-only wrapper. `suzume::Tokenizer` owns the handle with RAII and returns owning `std::string` / `std::vector` values:

```cpp
#include "suzume/suzume.hpp"
#include <cstdio>

int main() {
  suzume::Tokenizer tokenizer;
  if (!tokenizer) {
    std::fprintf(stderr, "%s\n", suzume::Tokenizer::lastError().c_str());
    return 1;
  }

  for (const suzume::Morpheme& m : tokenizer.analyze("東京都に住んでいます")) {
    std::printf("%s\t%s\t%s\n", m.surface.c_str(), m.pos.c_str(), m.lemma.c_str());
  }

  for (const suzume::Tag& tag : tokenizer.generateTags("東京スカイツリーに行きました")) {
    std::printf("%s\n", tag.text.c_str());
  }
}
```

`analyze()` returns an empty vector on failure; check `Tokenizer::lastError()`. The wrapper is move-only and frees the handle in its destructor.

## C Usage

Include the C ABI directly. You own each result and must free it exactly once:

```c
#include "suzume/suzume_c.h"
#include <stdio.h>

static const char* pos_name(suzume_pos_t pos) {
  static const char* const names[] = {
    "OTHER", "NOUN", "VERB", "ADJ", "ADV", "PARTICLE", "AUX", "CONJ",
    "DET", "PRON", "PREFIX", "SUFFIX", "INTJ", "SYMBOL", "OTHER"
  };
  return pos < sizeof(names) / sizeof(names[0]) ? names[pos] : "OTHER";
}

int main(void) {
  suzume_t handle = suzume_create();
  if (handle == NULL) {
    fprintf(stderr, "%s\n", suzume_last_error());
    return 1;
  }

  suzume_result_t* result = suzume_analyze(handle, "東京都に住んでいます");
  if (result == NULL) {
    fprintf(stderr, "%s\n", suzume_last_error());
    suzume_destroy(handle);
    return 1;
  }

  for (size_t i = 0; i < result->count; i++) {
    const suzume_morpheme_t* m = &result->morphemes[i];
    printf("%s\t%s\t%s\n", m->surface, pos_name(m->pos), m->base_form);
  }

  suzume_result_free(result);
  suzume_destroy(handle);
  return 0;
}
```

::: warning Ownership
Every non-NULL `suzume_result_t*` / `suzume_tags_t*` must be freed exactly once with `suzume_result_free` / `suzume_tags_free`, and every handle with `suzume_destroy`. The C++ wrapper does this for you.
:::

## Linking with CMake

The install ships a `find_package` config. Link the static core (self-contained) or the shared library:

```cmake
find_package(suzume CONFIG REQUIRED)

target_link_libraries(myapp PRIVATE suzume::suzume)          # static, self-contained
# target_link_libraries(myapp PRIVATE suzume::suzume_shared) # shared, when installed
```

A C program that links the static core needs the C++ linker driver so the C++ runtime is pulled in (this is harmless when linking the shared library):

```cmake
set_target_properties(myapp PROPERTIES LINKER_LANGUAGE CXX)
```

## Linking with pkg-config

```bash
cc myapp.c $(pkg-config --cflags --libs suzume) -o myapp
```

Runnable C and C++ programs, including a standalone `find_package` consumer project, are in [`examples/`](https://github.com/libraz/suzume/tree/main/examples).

## Embedded / No-Filesystem

Configure with `-DSUZUME_EMBED_DICT=ON` (or `make embedded`) to bake the dictionaries into the binary. The library then touches neither the filesystem nor environment variables and links as a self-contained static archive:

```bash
make embedded          # -DSUZUME_EMBED_DICT=ON, static, no CLI/tests
```

The core is `Expected<T, Error>` based — no exceptions in normal operation — and compiles under `-fno-exceptions -fno-rtti`. Targets need a C++ runtime and a heap (hosted-embedded / RTOS), not bare-metal freestanding.

## Morpheme Fields

`analyze()` returns a `std::vector<suzume::Morpheme>` (C++) or a `suzume_result_t` holding an array of `suzume_morpheme_t` (C). The compact C ABI uses stable numeric codes and a bit field; the C++ wrapper decodes them into owning strings and booleans.

| C++ (`Morpheme`) | C (`suzume_morpheme_t`) | Description |
|------------------|-------------------------|-------------|
| `surface` | `surface` | Surface form as it appears in the text |
| `pos` | `pos` | English POS label in C++; stable `SUZUME_POS_*` numeric code in C |
| `lemma` | `base_form` | Dictionary base form (lemma) |
| `pos_ja` | derived from `pos` | Part-of-speech name in Japanese |
| `conj_type` | `conjugation_type` | Decoded label in C++; stable numeric code in C (`0` means none) |
| `conj_form` | `conjugation_form` | Decoded label in C++; stable numeric code in C |
| `extended_pos` | `extended_pos` | Label in C++ (e.g. `VERB_連用`); stable numeric code in C |
| `start` | `start` | Start character offset in the normalized text |
| `end` | `end` | End character offset in the normalized text |
| `is_user_dict` | `flags & SUZUME_MORPHEME_USER_DICT` | Entry came from a loaded user dictionary |
| `is_formal_noun` | `flags & SUZUME_MORPHEME_FORMAL_NOUN` | Entry is a formal (dependent) noun |
| `is_low_info` | `flags & SUZUME_MORPHEME_LOW_INFO` | Entry carries low information content |
| `is_unknown` | `flags & SUZUME_MORPHEME_UNKNOWN` | Entry is an unknown word |
| `is_from_dictionary` | `flags & SUZUME_MORPHEME_FROM_DICTIONARY` | Entry was matched from a dictionary |
| `score` | `score` | Analysis score for the morpheme |

The C header intentionally carries no duplicated English/Japanese label strings. Use the `SUZUME_POS_*` constants directly or map them at the application boundary, as in the C example above. The JavaScript, Python, and C++ wrappers ship their own stable label tables.

See [API Reference](/docs/api) for the full POS and `extendedPos` value tables.

## Options

Construct a `suzume::Options` to control normalization and segmentation. The defaults match the recommended settings (`preserve_vu` and `preserve_case` on, `preserve_symbols` off, `Mode::Normal`, `lemmatize` on, `merge_compounds` off):

```cpp
suzume::Options opts;
opts.mode = suzume::Mode::Search;
opts.merge_compounds = true;

suzume::Tokenizer tokenizer(opts);
```

Available modes are `Mode::Normal`, `Mode::Search`, and `Mode::Split`.

In C, call `suzume_init_extended_options()` first so the true-by-default fields are preserved, then override individual fields and pass the struct to `suzume_create_with_extended_options()`.

## Tag Options

Both languages expose the same tag filters. In C++, start from a default-constructed `suzume::TagOptions` and override only what you need:

```cpp
suzume::TagOptions opts;
opts.pos_filter = 1;   // 1=noun, 2=verb, 4=adjective, 8=adverb (0=all)
opts.max_tags = 10;

auto tags = tokenizer.generateTags("東京都の天気予報を確認する", opts);
```

In C, call `suzume_init_tag_options()` before overriding fields, then pass the struct to `suzume_generate_tags_with_options()`.

## User Dictionaries

Load CSV-format user-dictionary entries, or a compiled binary `.dic`, from memory:

```cpp
tokenizer.loadUserDictionary("ChatGPT,NOUN\n東京スカイツリー,NOUN");

std::vector<std::uint8_t> dic = /* read user.dic */;
tokenizer.loadBinaryDictionary(dic.data(), dic.size());
```

The C ABI equivalents are `suzume_load_user_dict()` and `suzume_load_binary_dict()`.

## Thread Safety

A handle keeps per-instance mutable state and is not safe for concurrent analysis. Use one `Tokenizer` (or `suzume_t`) per thread, or serialize calls that share one. Distinct handles may be used concurrently, and creating a handle is inexpensive.

## See also

- [API Reference](/docs/api) for the POS and `extendedPos` value tables and the shared Morpheme concept.
- [Native Build & CLI](/docs/native-build) to build the `suzume-cli` command and the WASM module from source.
- [Getting Started](/docs/getting-started) for an introduction to Suzume across all bindings.
