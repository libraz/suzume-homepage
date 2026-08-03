# Python Bindings

The [`suzume`](https://pypi.org/project/suzume/) package is a ctypes binding to the native Suzume library. Its wheel contains the shared library and bundled dictionaries.

## Requirements and installation

Suzume requires Python 3.10 or later. PyPI publishes binary wheels for:

- Linux x86_64 (`manylinux2014` / `manylinux_2_17`)
- macOS arm64, macOS 11 or later

Windows, macOS x86_64, Linux arm64, and other platforms or architectures are not supported. There is no source distribution, so `pip install` succeeds only when a compatible wheel is available.

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

The wheel also installs a command named `suzume`. See [Python CLI](/docs/python-cli). This is separate from the developer-oriented native command, `suzume-cli`.

## Quick start

Use `Suzume` as a context manager so its native handle is released on exit:

```python
from suzume import Suzume

with Suzume() as analyzer:
    for morpheme in analyzer.analyze("東京都に住んでいます"):
        print(morpheme.surface, morpheme.pos, morpheme.base_form)
```

If a context manager is not practical, call `close()` when finished. `close()` is idempotent.

Calls on the same `Suzume` instance are serialized and safe to make from multiple Python threads. To run native analyses in parallel, create a separate instance for each worker.

## Constructor options

All constructor arguments are keyword-only:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mode` | `Mode \| str` | `Mode.NORMAL` | Segmentation mode: `normal`, `search`, or `split` |
| `preserve_vu` | `bool` | `True` | Preserve ヴ variants |
| `preserve_case` | `bool` | `True` | Preserve ASCII letter case |
| `preserve_symbols` | `bool` | `False` | Keep punctuation-like `SYMBOL` tokens; content symbols and emoji remain `OTHER` either way |
| `lemmatize` | `bool` | `True` | Apply post-analysis lemma correction |
| `merge_compounds` | `bool` | `False` | Merge consecutive noun compounds |
| `skip_user_dictionary` | `bool` | `False` | Skip the bundled user dictionary |
| `skip_core_dictionary` | `bool` | `False` | Skip the bundled core dictionary |
| `skip_env_config` | `bool` | `False` | Ignore scorer configuration environment variables |
| `report_scorer_config` | `bool` | `False` | Add scorer configuration diagnostics to `dictionary_warnings` |
| `scorer_options` | `str \| dict \| None` | `None` | Scorer overrides as a JSON string or mapping |

Content-bearing symbols such as currency, units, arrows, technical marks, and emoji remain `OTHER` by default. `preserve_symbols` controls punctuation-like `SYMBOL` tokens such as `。`.

```python
from suzume import Mode, Suzume

with Suzume(
    mode=Mode.SEARCH,
    merge_compounds=True,
    skip_env_config=True,
    scorer_options={"unary": {"noun_prior": 0.25}},
) as analyzer:
    morphemes = analyzer.analyze("東京スカイツリーの展望台")
```

`mode` is mutable. Changing it does not reload the dictionaries:

```python
with Suzume() as analyzer:
    analyzer.mode = "split"
    assert analyzer.mode is Mode.SPLIT
```

See [Analysis Modes](/docs/api) for the segmentation behavior of each mode.

## Analysis and normalized text

`analyze()` returns `list[Morpheme]`. Each morpheme’s `start` and `end` are character offsets into the normalized text, which may differ from the input.

Use `analyze_with_normalized_text()` when you need the exact string used for those offsets:

```python
with Suzume(preserve_case=False) as analyzer:
    result = analyzer.analyze_with_normalized_text("ABCを検索")
    print(result.normalized_text)
    print(result.morphemes)
```

The return value is a frozen `AnalysisResult` dataclass with `normalized_text: str` and `morphemes: list[Morpheme]`.

## Morpheme fields

`Morpheme` is a frozen dataclass:

| Field | Type | Description |
|-------|------|-------------|
| `surface` | `str` | Surface form in the normalized text |
| `pos` | `str` | Part of speech in English, such as `NOUN` |
| `base_form` | `str` | Dictionary or base form |
| `pos_ja` | `str` | Part of speech in Japanese |
| `conj_type` | `str \| None` | Conjugation type, or `None` for a non-conjugating word |
| `conj_form` | `str \| None` | Conjugation form, or `None` for a non-conjugating word |
| `extended_pos` | `str` | Stable extended POS code |
| `start` | `int` | Start character offset in normalized text |
| `end` | `int` | End character offset in normalized text |
| `is_user_dict` | `bool` | Whether the match came from a user dictionary |
| `is_formal_noun` | `bool` | Whether the word is a formal noun such as こと or もの |
| `is_low_info` | `bool` | Whether the word is marked as low information |
| `is_unknown` | `bool` | Whether the token is an unknown-word candidate |
| `is_from_dictionary` | `bool` | Whether the match came from any dictionary |
| `score` | `float` | Candidate score used by the analyzer |

See the [API Reference](/docs/api) for the `pos` and `extended_pos` values.

## Tag generation

`generate_tags()` returns `list[Tag]`. Each `Tag` has `tag` and `pos` fields.

```python
with Suzume() as analyzer:
    tags = analyzer.generate_tags(
        "東京都の天気予報を確認する",
        pos_filter=["noun", "verb"],
        max_tags=10,
    )
```

`pos_filter` accepts an iterable of names or an integer bitmask:

| Name | Bit |
|------|----:|
| `noun` | `1` |
| `verb` | `2` |
| `adjective` | `4` |
| `adverb` | `8` |
| `particle` | `16` |
| `auxiliary` | `32` |

`0` or an empty iterable selects all parts of speech. Particles and auxiliaries are still excluded by default; set the corresponding exclusion option to `False` to return them:

```python
with Suzume() as analyzer:
    particles = analyzer.generate_tags(
        "本を読む",
        pos_filter=["particle"],
        exclude_particles=False,
        min_length=1,
    )
```

The remaining options are:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `exclude_basic` | `bool` | `False` | Exclude words whose lemma contains only hiragana |
| `use_lemma` | `bool` | `True` | Use the lemma instead of the surface form |
| `min_length` | `int` | `2` | Minimum tag length in characters |
| `max_tags` | `int` | `0` | Maximum result count (`0` means unlimited) |
| `exclude_particles` | `bool` | `True` | Exclude particles |
| `exclude_auxiliaries` | `bool` | `True` | Exclude auxiliaries |
| `exclude_formal_nouns` | `bool` | `True` | Exclude formal nouns |
| `exclude_low_info` | `bool` | `True` | Exclude low-information words |
| `remove_duplicates` | `bool` | `True` | Remove duplicate tags |

## User dictionaries

`load_user_dict()` loads current TSV or legacy CSV text. It returns the number of installed entries after inflection forms have been expanded:

```python
from suzume import Suzume

dictionary = "食べ直す\tVERB\tGODAN_SA\n"

with Suzume() as analyzer:
    expanded_count = analyzer.load_user_dict(dictionary)
    print(expanded_count)
```

Use `load_binary_dict(bytes)` for a compiled `.dic` dictionary. `clear_user_dictionaries()` removes dictionaries loaded by the caller but retains the bundled user dictionary.

```python
from pathlib import Path
from suzume import Suzume

with Suzume() as analyzer:
    analyzer.load_binary_dict(Path("custom.dic").read_bytes())
    analyzer.clear_user_dictionaries()
```

`has_core_dictionary` reports whether the bundled core dictionary is loaded. `dictionary_warnings` returns dictionary-loading, parsing, and scorer-configuration diagnostics.

## Errors

Native failures raise `SuzumeError`, a `RuntimeError` subclass. Its `code` attribute is a stable `ErrorCode` value, so callers do not need to parse the message:

```python
from suzume import ErrorCode, Suzume, SuzumeError

try:
    Suzume(scorer_options="{")
except SuzumeError as error:
    if error.code is ErrorCode.PARSE:
        print("invalid scorer configuration")
```

| `ErrorCode` | Value |
|-------------|------:|
| `SUCCESS` | `0` |
| `INVALID_UTF8` | `1` |
| `DICTIONARY_LOAD_FAILED` | `2` |
| `FILE_NOT_FOUND` | `3` |
| `PARSE` | `4` |
| `OUT_OF_MEMORY` | `5` |
| `INVALID_INPUT` | `6` |
| `INTERNAL` | `7` |

## API summary

| Member | Description |
|--------|-------------|
| `Suzume(*, ...)` | Create an analyzer |
| `analyze(text)` | Return `list[Morpheme]` |
| `analyze_with_normalized_text(text)` | Return an `AnalysisResult` |
| `generate_tags(text, *, ...)` | Return filtered keyword tags |
| `mode` | Read or change the analysis mode |
| `load_user_dict(text)` | Load TSV or CSV text and return the expanded-entry count |
| `load_binary_dict(data)` | Load a compiled dictionary |
| `clear_user_dictionaries()` | Remove caller-loaded dictionaries |
| `dictionary_warnings` | Return dictionary and scorer diagnostics |
| `has_core_dictionary` | Report whether the core dictionary is loaded |
| `close()` | Release the native handle |
| `version()` | Return the native library version |

## See also

- [Python CLI](/docs/python-cli) for the `suzume` command installed by the wheel.
- [Native CLI Reference](/docs/cli) for the separate `suzume-cli` developer tool.
- [Getting Started](/docs/getting-started) for an introduction shared by all bindings.
