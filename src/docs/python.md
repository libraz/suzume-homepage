# Python Bindings

The [`suzume`](https://pypi.org/project/suzume/) package on PyPI provides Python bindings for Suzume. Use it when you want the same Japanese morphological analyzer from Python scripts, data pipelines, or web services without going through the JavaScript/WASM package.

The bindings are a thin [ctypes](https://docs.python.org/3/library/ctypes.html) layer over the native C++ core. The compiled library and the dictionaries are bundled in the wheel, so there is nothing else to install and no external dictionary files to ship.

## Requirements

- Python 3.10 or later

The wheel already contains the native library and dictionaries for the supported platforms, so no C++ compiler or build step is needed.

## Installation

::: code-group

```bash [pip]
pip install suzume
```

```bash [poetry]
poetry add suzume
```

```bash [uv]
uv add suzume
```

:::

## Quick start

Create an analyzer with `Suzume()`, use it as a context manager so the native handle is released automatically, and iterate over the analyzed morphemes:

```python
from suzume import Suzume

with Suzume() as sz:
    for m in sz.analyze("東京都に住んでいます"):
        print(m.surface, m.pos, m.base_form)
```

Each `analyze()` call returns a `list[Morpheme]`. The analyzer holds a native handle and is not thread-safe, so use one instance per thread. If you cannot use a `with` block, call `close()` explicitly when you are done:

```python
sz = Suzume()
try:
    morphemes = sz.analyze("東京都に住んでいます")
finally:
    sz.close()
```

## Analysis modes

Pass `mode` to the constructor to control how text is segmented. It accepts a `Mode` enum member or the equivalent string:

```python
from suzume import Suzume, Mode

with Suzume(mode=Mode.SEARCH, merge_compounds=True) as sz:
    morphemes = sz.analyze("東京スカイツリーの展望台")

# Strings work too:
with Suzume(mode="split") as sz:
    ...
```

The available modes are `Mode.NORMAL` (`"normal"`), `Mode.SEARCH` (`"search"`), and `Mode.SPLIT` (`"split"`). See [Analysis Modes](/docs/api) for what each mode does to segmentation.

The constructor is keyword-only. Alongside `mode`, it accepts the normalization and analysis flags `preserve_vu` (default `True`), `preserve_case` (default `True`), `preserve_symbols` (default `False`), `lemmatize` (default `True`), and `merge_compounds` (default `False`).

## Morpheme fields

`analyze()` returns a list of `Morpheme`, a frozen dataclass with snake_case fields:

| Field | Type | Description |
|-------|------|-------------|
| `surface` | `str` | Surface form as it appears in text |
| `pos` | `str` | Part of speech in English (UPPERCASE, e.g. `NOUN`) |
| `base_form` | `str` | Dictionary/base form |
| `pos_ja` | `str` | Part of speech in Japanese (e.g. 名詞) |
| `conj_type` | `str \| None` | Conjugation type, or `None` for non-conjugating words |
| `conj_form` | `str \| None` | Conjugation form, or `None` for non-conjugating words |
| `extended_pos` | `str` | Stable extended POS code (e.g. `VERB_連用`) |
| `start` | `int` | Start character offset in normalized text |
| `end` | `int` | End character offset in normalized text |
| `is_user_dict` | `bool` | True when matched from a user dictionary |
| `is_formal_noun` | `bool` | True for formal nouns such as こと and もの |
| `is_low_info` | `bool` | True when marked as low information for tag generation |
| `is_unknown` | `bool` | True when generated as an unknown-word candidate |
| `is_from_dictionary` | `bool` | True when matched from any dictionary |
| `score` | `float` | Candidate score/cost used by the analyzer |

See the [API Reference](/docs/api) for the full list of `pos` and `extended_pos` values.

## Tag generation

`generate_tags()` extracts keyword tags from text. By default it keeps content words (nouns, verbs, adjectives, adverbs) and filters out particles, auxiliaries, formal nouns, and low-information words:

```python
from suzume import Suzume

with Suzume() as sz:
    for tag in sz.generate_tags("東京都の天気予報を確認する"):
        print(tag.tag, tag.pos)
```

Each result is a `Tag` dataclass with two fields: `tag` (the keyword text) and `pos` (its part of speech).

`generate_tags()` takes keyword-only options. The `pos_filter` option restricts the result to selected parts of speech and accepts two forms — an iterable of POS names, or a raw bitmask int where `1=noun`, `2=verb`, `4=adjective`, `8=adverb`, and `0` means all:

```python
with Suzume() as sz:
    # By name:
    nouns = sz.generate_tags("美味しいラーメンを食べた", pos_filter=["noun"])

    # Equivalent bitmask (nouns and verbs):
    tags = sz.generate_tags("美味しいラーメンを食べた", pos_filter=1 | 2)

    # Keep only the top 10 tags:
    top = sz.generate_tags("東京都の天気予報を確認する", max_tags=10)
```

The remaining options and their defaults are:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `pos_filter` | `int \| Iterable[str]` | `0` | POS categories to include (`0`/empty = all) |
| `exclude_basic` | `bool` | `False` | Exclude words whose lemma is hiragana-only |
| `use_lemma` | `bool` | `True` | Use the lemma (dictionary form) instead of the surface form |
| `min_length` | `int` | `2` | Minimum tag length in characters |
| `max_tags` | `int` | `0` | Maximum number of tags (`0` = unlimited) |
| `exclude_particles` | `bool` | `True` | Exclude particles |
| `exclude_auxiliaries` | `bool` | `True` | Exclude auxiliaries |
| `exclude_formal_nouns` | `bool` | `True` | Exclude formal nouns such as こと and もの |
| `exclude_low_info` | `bool` | `True` | Exclude low-information words |
| `remove_duplicates` | `bool` | `True` | Remove duplicate tags |

## User dictionaries

Add custom words at runtime from CSV text with `load_user_dict()`:

```python
from suzume import Suzume, SuzumeError

with Suzume() as sz:
    try:
        sz.load_user_dict("ChatGPT,NOUN\n東京スカイツリー,NOUN")
    except SuzumeError as e:
        print("failed to load user dictionary:", e)

    for m in sz.analyze("ChatGPTを使う"):
        print(m.surface, m.pos, m.is_user_dict)
```

Pre-compiled binary `.dic` dictionaries can be loaded from memory with `load_binary_dict()`:

```python
from pathlib import Path
from suzume import Suzume, SuzumeError

data = Path("custom.dic").read_bytes()

with Suzume() as sz:
    try:
        sz.load_binary_dict(data)
    except SuzumeError as e:
        print("failed to load binary dictionary:", e)
```

Both methods raise `SuzumeError` (a subclass of `RuntimeError`) when loading fails. The `dictionary_warnings` property returns any warnings emitted while dictionaries were auto-loaded during construction:

```python
with Suzume() as sz:
    for warning in sz.dictionary_warnings:
        print("warning:", warning)
```

## API summary

Instance methods and properties on `Suzume`:

| Member | Description |
|--------|-------------|
| `Suzume(*, mode=..., preserve_vu=..., ...)` | Create an analyzer (keyword-only options) |
| `analyze(text)` | Return `list[Morpheme]` (see [Morpheme fields](#morpheme-fields)) |
| `generate_tags(text, *, pos_filter=..., ...)` | Extract keyword `Tag`s with filters and limits |
| `load_user_dict(csv)` | Load a CSV user dictionary; raises `SuzumeError` on failure |
| `load_binary_dict(data)` | Load a binary `.dic` dictionary; raises `SuzumeError` on failure |
| `dictionary_warnings` | Warnings from automatic dictionary loading |
| `close()` | Release the native handle (idempotent) |

The class also implements the context-manager protocol, so `with Suzume() as sz:` calls `close()` automatically on exit.

Module-level function:

| Function | Description |
|----------|-------------|
| `suzume.version()` | Return the native Suzume library version string |

## See also

- [API Reference](/docs/api) for the POS and `extended_pos` value tables and the shared Morpheme concept.
- [Getting Started](/docs/getting-started) for an introduction to Suzume across all bindings.
- [Installation](/docs/installation) for the JavaScript/WASM package.
