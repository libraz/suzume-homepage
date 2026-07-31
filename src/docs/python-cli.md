# Python CLI

The Python wheel installs `suzume`, a command for analysis and tag extraction. It uses the same bundled native library and dictionaries as the Python API.

## Installation

```bash
pip install suzume
```

The command is available on the same platforms as the Python package: Linux x86_64 (`manylinux2014` / `manylinux_2_17`) and macOS arm64 on macOS 11 or later. See [Python Bindings](/docs/python) for the full compatibility list.

## Input

Pass text as arguments or pipe UTF-8 text to standard input:

```bash
suzume "東京へ行く"
printf 'りんごを食べる\n' | suzume
```

`analyze` is an optional alias. These commands are equivalent:

```bash
suzume --mode search "東京の公園"
suzume analyze --mode search "東京の公園"
```

Use `--` before input that begins with a hyphen.

## Output formats

Select the format with `-f` or `--format`:

| Format | Output |
|--------|--------|
| `morpheme` | Default. `surface` TAB `POS` TAB `lemma` TAB `start` TAB `end` |
| `tsv` | Same fields as `morpheme` |
| `tags` | `tag` TAB `POS`, one tag per line |
| `json` | An object containing `input`, `normalized_text`, and `morphemes` |
| `chasen` | ChaSen-like fields followed by `EOS` |

```bash
suzume --format json "ＡＢＣを検索"
suzume --format chasen "食べている"
suzume --format tags "東京の公園に行く"
```

Backslashes, tabs, and line breaks inside one-line TAB output are escaped.

## Analysis options

| Option | Description |
|--------|-------------|
| `-m, --mode MODE` | Use `normal`, `search`, or `split` segmentation |
| `--normalize-vu` | Normalize ヴ variants instead of preserving them |
| `--lowercase` | Normalize ASCII letters to lowercase |
| `--preserve-symbols` | Keep symbols and emoji |
| `--no-lemmatize` | Disable post-analysis lemma correction |
| `--merge-compounds` | Merge consecutive noun compounds |
| `--skip-env-config` | Ignore scorer configuration environment variables |

```bash
suzume --mode split --lowercase "ABCと東京都"
suzume --normalize-vu --preserve-symbols "ヴァイオリン🎻"
```

Run `suzume --help` for the current option summary and `suzume --version` for the installed native library version.

## Dictionaries

Use `-d` or `--dict` to load a UTF-8 text dictionary or compiled `.dic` file. The option is repeatable:

```bash
suzume --dict terms.tsv --dict names.dic "東京スカイツリーへ行く"
```

| Option | Description |
|--------|-------------|
| `-d, --dict PATH` | Load a text or compiled `.dic` dictionary; repeat to load more |
| `--no-core-dict` | Do not load the bundled core dictionary |
| `--no-user-dict` | Do not load the bundled user dictionary |

Warnings produced while the analyzer is being created are written to standard error. Warnings produced by a dictionary passed with `--dict` are not currently printed by the CLI.

## Tag output

Choose `--format tags` to generate keyword tags:

```bash
suzume --format tags --tag-max-tags 5 "東京都の天気予報を確認する"
```

| Option | Default | Description |
|--------|---------|-------------|
| `--tag-pos POS` | all | Keep one POS; repeat for more |
| `--tag-exclude-basic` | off | Exclude tags whose lemma contains only hiragana |
| `--tag-use-surface` | off | Use surface forms instead of lemmas |
| `--tag-min-length N` | `2` | Set the minimum tag length |
| `--tag-max-tags N` | `0` | Limit the number of tags (`0` means unlimited) |
| `--include-particles` | off | Include particles |
| `--include-auxiliaries` | off | Include auxiliaries |
| `--include-formal-nouns` | off | Include formal nouns |
| `--include-low-info` | off | Include low-information words |
| `--tag-keep-duplicates` | off | Keep duplicate tags |

`--tag-pos` accepts only `noun`, `verb`, `adjective`, and `adverb`. To include particles or auxiliaries, omit `--tag-pos` and use `--include-particles` or `--include-auxiliaries`.

```bash
suzume --format tags \
  --tag-pos noun \
  --tag-pos verb \
  --tag-min-length 1 \
  "本を読む"
```

## JSON and offsets

Morpheme `start` and `end` values are character offsets into the normalized text, not necessarily the original input. JSON output includes that exact string as `normalized_text`:

```bash
suzume --lowercase --format json "ABCを検索"
```

Use JSON when normalization can change the input and downstream code needs to slice text by the reported offsets.

## Scope

The Python `suzume` command covers analysis and tag extraction. It does not compile or validate dictionaries and does not run the native test or benchmark commands.

Use the separately built `suzume-cli` for those developer workflows. See [Native CLI Reference](/docs/cli) and [Native Build](/docs/native-build).

## See also

- [Python Bindings](/docs/python) for the Python API and distribution details.
- [Installation](/docs/installation) for all available packages and native builds.
