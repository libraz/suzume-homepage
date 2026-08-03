# Native Developer CLI Reference

`suzume-cli` is the native developer command for Suzume. It provides analysis as well as dictionary compilation, validation, tests, and benchmarks.

Installing the Python wheel provides a separate, analysis-focused command named `suzume`. See [Python CLI](/docs/python-cli) for that command.

This page covers how to *use* the command. To build the binary from source, see the [Native Build](/docs/native-build) guide.

## CLI Overview

`suzume-cli` has three subcommands — `analyze`, `dict`, and `test` — plus the `version` and `help` utility commands.

```
suzume-cli [command] [options] [arguments]

Commands:
  analyze     Morphological analysis (default)
  dict        Dictionary management
  test        Verification and testing
  version     Show version information
  help        Show help
```

## analyze

Tokenize Japanese text. This is the default command — you can omit `analyze`.

```bash
# Basic usage
suzume-cli "東京スカイツリーに行きました"

# Explicit command
suzume-cli analyze "東京スカイツリーに行きました"

# Read from stdin
echo "東京スカイツリーに行きました" | suzume-cli
```

### Output Formats

The `-f, --format` flag selects the output shape:

| Format | Description |
|--------|-------------|
| `morpheme` | Default. `surface` TAB `POS` TAB `lemma` TAB `start` TAB `end` |
| `tags` | Content-word `tag` TAB `POS` pairs (see [Tag Extraction](#tag-extraction)) |
| `json` | Structured JSON with analysis and debugging fields |
| `tsv` | `surface` TAB `POS` TAB `lemma` TAB `start` TAB `end` |
| `chasen` | ChaSen-like format (Japanese POS names + conjugation info) |

```bash
# Default: surface TAB pos TAB lemma TAB start TAB end
suzume-cli "食べている"
# 食べ    VERB        食べる    0    2
# て      PARTICLE    て        2    3
# いる    AUX         いる      3    5

# JSON
suzume-cli -f json "食べている"

# Tags only
suzume-cli -f tags "東京スカイツリーに行きました"
# 東京            NOUN
# スカイツリー    NOUN
# 行く            VERB

# TSV with all fields (surface, pos, lemma, start, end)
suzume-cli -f tsv "食べている"

# ChaSen-like format (Japanese POS, conjugation info)
suzume-cli -f chasen "食べている"
```

### Analysis Modes

```bash
# Normal mode (default)
suzume-cli -m normal "API開発と高層ビル群"
# API開発 / と / 高層 / ビル / 群

# Search mode (keeps noun compounds)
suzume-cli -m search "API開発と高層ビル群"
# API開発 / と / 高層ビル群

# Split mode (fine-grained segmentation)
suzume-cli -m split "API開発と高層ビル群"
# API / 開発 / と / 高層 / ビル / 群
```

### Options

| Option | Description |
|--------|-------------|
| `-f, --format FMT` | Output format: `morpheme`, `tags`, `json`, `tsv`, `chasen` |
| `-m, --mode MODE` | Analysis mode: `normal`, `search`, `split` |
| `-d, --dict PATH` | Load user dictionary (can specify multiple) |
| `--no-lemmatize` | Disable lemmatization (lemmatization is on by default) |
| `--merge-compounds` | Merge consecutive noun compounds (off by default) |
| `--normalize-vu` | Normalize ヴ to ビ etc. (default: preserve) |
| `--lowercase` | Convert ASCII to lowercase (default: preserve) |
| `--preserve-symbols` | Keep punctuation-like `SYMBOL` tokens (default: remove); content symbols and emoji remain `OTHER` either way |
| `--no-user-dict` | Disable user dictionary |
| `--no-core-dict` | Disable core dictionary |
| `--skip-env-config` | Ignore scorer configuration environment variables |
| `--compare` | Compare with/without user dictionary |
| `--debug` | Show lattice candidates and scores |
| `-V, --verbose` | Verbose output |
| `-VV, --very-verbose` | Very verbose (includes lattice dump) |

The global `-v, --version` and `-h, --help` flags are also available.

### Tag Extraction

With `-f tags`, Suzume extracts content-word tags and drops low-information tokens by default. The following flags tune what the tag set keeps:

| Option | Default | Description |
|--------|---------|-------------|
| `--include-particles` | off | Keep particles in the tag set |
| `--include-auxiliaries` | off | Keep auxiliary verbs in the tag set |
| `--include-formal-nouns` | off | Keep formal nouns (こと, もの, etc.) |
| `--include-low-info` | off | Keep low-information tokens |
| `--tag-keep-duplicates` | off | Keep duplicate tags instead of deduplicating |
| `--tag-use-surface` | off | Use surface forms instead of lemmas |
| `--tag-pos POS` | all | Keep one POS; repeat to keep more. Particle/auxiliary filters also require the matching `--include-*` flag |
| `--tag-exclude-basic` | off | Exclude tags whose lemma contains only hiragana |
| `--tag-min-length LENGTH` | `2` | Minimum tag length in characters |
| `--tag-max-tags MAX` | `0` | Maximum number of tags (`0` = unlimited) |

```bash
# Keep particles and auxiliaries, allow single-character tags
suzume-cli -f tags --include-particles --include-auxiliaries --tag-min-length 1 "本を読む"

# Keep the first 5 tags and use surface forms
suzume-cli -f tags --tag-use-surface --tag-max-tags 5 "東京スカイツリーに行きました"
```

### Examples

```bash
# With user dictionary
suzume-cli -d user.dic "ChatGPTを使う"

# Compare with/without user dictionary
suzume-cli --compare -d user.dic "ChatGPTを使う"

# Merge noun compounds
suzume-cli --merge-compounds "東京都新宿区"

# Analyze without lemmatization
suzume-cli --no-lemmatize "食べている"

# Normalize ヴ
suzume-cli --normalize-vu "ヴァイオリン"
# バイオリン    NOUN    バイオリン    0    5
```

## dict

Dictionary management: create, edit, compile, and validate dictionaries.

### Subcommands

```bash
# Create new dictionary file
suzume-cli dict new user.tsv

# Compile TSV to binary (.dic)
suzume-cli dict compile user.tsv           # → user.dic
suzume-cli dict compile user.tsv out.dic   # custom output

# Decompile binary to TSV (refuses to overwrite without --force)
suzume-cli dict decompile user.dic         # → user.dump.tsv

# Validate dictionary
suzume-cli dict validate user.tsv

# Show dictionary info
suzume-cli dict info user.tsv

# Look up a word in built-in L1 and source L2 dictionaries
suzume-cli dict lookup すぎる

# Search entries by pattern
suzume-cli dict search user.tsv "パターン"

# List entries (non-interactive)
suzume-cli dict list user.tsv --pos=NOUN --pattern="東京*" --limit=20
```

### Interactive Mode

Launch an interactive REPL for dictionary editing:

```bash
suzume-cli dict -i user.tsv
```

`suzume-cli dict interactive user.tsv` and `suzume-cli dict edit user.tsv` are equivalent long-form aliases.

Interactive commands:

| Command | Description |
|---------|-------------|
| `add <surface> <pos> [conj_type]` | Add entry; verbs and adjectives require a conjugation type |
| `remove <surface> [pos]` | Remove entry |
| `update <surface> <pos> [conj_type]` | Update an existing entry |
| `list [--pos=POS] [--pattern=PATTERN] [--limit=N]` | List entries |
| `search <pattern>` | Search entries |
| `find <surface>` | Look up in all layers |
| `layer [N]` | Show or set the working layer (2 = `core.dic`, 3 = `user.dic`) |
| `import <file.tsv> [--skip-duplicates]` | Import entries from a TSV file |
| `analyze <text>` | Analyze text with current dictionary |
| `validate` | Validate dictionary |
| `compile <output.dic>` | Compile to binary |
| `save` | Save changes |
| `stats` | Show statistics |
| `quit` | Exit |

### Dictionary Layers

Suzume uses a layered dictionary system:

| Layer | Source | Description |
|-------|--------|-------------|
| Layer 1 | Hardcoded | Particles, auxiliaries (built into binary) |
| Layer 2 | `core.dic` | Core vocabulary |
| Layer 3 | `user.dic` | User/domain-specific words |

### TSV Format

Dictionary source files use TSV format:

```tsv
東京	NOUN
食べる	VERB	ICHIDAN
読み直し	NOUN	読み直す
```

Rows use `surface<TAB>POS[<TAB>conj_type][<TAB>lemma]`. The conjugation type is optional; provide it when the loader should expand inflected forms. A third field that is not a recognized conjugation type is treated as the lemma. See [User Dictionaries](/docs/user-dictionary) for the complete format.

**POS values:** `NOUN`, `PROPN`, `VERB`, `ADJ`/`ADJECTIVE`, `ADV`/`ADVERB`, `PARTICLE`, `AUX`/`AUXILIARY`, `CONJUNCTION`, `DETERMINER`, `PRONOUN`, `PREFIX`, `SUFFIX`, `INTERJECTION`, `SYMBOL`/`SYM`, `OTHER`

This dictionary-file POS vocabulary is deliberately more explicit than the abbreviated runtime `Morpheme.pos` values (`NOUN`, `VERB`, `ADJ`, `ADV`, ...) returned by the analysis APIs.

**Conjugation types (for VERB/ADJECTIVE):** `ICHIDAN`, `GODAN_KA`, `GODAN_GA`, `GODAN_SA`, `GODAN_TA`, `GODAN_NA`, `GODAN_BA`, `GODAN_MA`, `GODAN_RA`, `GODAN_WA`, `SURU`, `KURU`, `I_ADJ`, `NA_ADJ`

## test

Run verification tests and benchmarks.

```bash
# Test single input
suzume-cli test "テスト文" --expect "テスト"

# Run tests from file
suzume-cli test -f tests.tsv

# Run with user dictionary
suzume-cli test -f tests.tsv -d user.dic

# Reproducible benchmark (median of five samples after one warmup pass)
suzume-cli test benchmark --iterations=1000 --samples=5 --warmup=1
```

The benchmark reports median initialization, first-analysis, and steady-state timing, steady throughput and per-text latency, and peak RSS. Use `-f corpus.txt` to replace the built-in corpus.

### Test File Format

TSV with input and expected tags:

```tsv
東京スカイツリーに行きました	東京,スカイツリー,行く
美しい花が咲いている	美しい,咲く
```

## See also

- [Native Build](/docs/native-build) — how to build the `suzume-cli` binary and dictionaries from source
- [API Reference](/docs/api) — the JavaScript / WASM API surface that these flags mirror
