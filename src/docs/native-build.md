# Native Build & CLI

Suzume can be built as a native C++ library and CLI tool for use outside the browser/Node.js environment.

## Building from Source

### Requirements

- C++17 compatible compiler (GCC 8+, Clang 10+, MSVC 2019+)
- CMake 3.15+

### Build Steps

```bash
git clone https://github.com/libraz/suzume.git
cd suzume

# Configure
cmake -B build -DCMAKE_BUILD_TYPE=Release

# Build
cmake --build build --parallel

# The CLI binary is at build/bin/suzume-cli
```

### Build Options

| Option | Default | Description |
|--------|---------|-------------|
| `BUILD_TESTING` | `ON` | Build test suite |
| `BUILD_WASM` | `OFF` | Build for WebAssembly (requires Emscripten) |
| `ENABLE_DEBUG_INFO` | `ON` (native) | Enable debug origin tracking in candidates |
| `ENABLE_DEBUG_LOG` | `ON` (native) | Enable debug logging |

```bash
# Example: Release build without tests
cmake -B build -DCMAKE_BUILD_TYPE=Release -DBUILD_TESTING=OFF
cmake --build build --parallel
```

## CLI Overview

`suzume-cli` provides three main commands:

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

```bash
# Default: surface TAB pos TAB lemma
suzume-cli "食べている"
# 食べ    VERB    食べる
# て      AUX     てる
# いる    AUX     いる

# JSON
suzume-cli -f json "食べている"

# Tags only
suzume-cli -f tags "東京スカイツリーに行きました"
# 東京
# スカイツリー
# 行く

# TSV with all fields (surface, pos, lemma, start, end)
suzume-cli -f tsv "食べている"

# ChaSen-like format (Japanese POS, conjugation info)
suzume-cli -f chasen "食べている"
```

### Analysis Modes

```bash
# Normal mode (default)
suzume-cli -m normal "東京都新宿区"

# Search mode (keeps noun compounds)
suzume-cli -m search "東京都新宿区"

# Split mode (fine-grained segmentation)
suzume-cli -m split "東京都新宿区"
```

### Options

| Option | Description |
|--------|-------------|
| `-f, --format FMT` | Output format: `morpheme`, `tags`, `json`, `tsv`, `chasen` |
| `-m, --mode MODE` | Analysis mode: `normal`, `search`, `split` |
| `-d, --dict PATH` | Load user dictionary (can specify multiple) |
| `-V, --verbose` | Verbose output |
| `-VV, --very-verbose` | Very verbose (includes lattice dump) |
| `--debug` | Show lattice candidates and scores |
| `--compare` | Compare with/without user dictionary |
| `--normalize-vu` | Normalize ヴ to ビ etc. (default: preserve) |
| `--lowercase` | Convert ASCII to lowercase (default: preserve) |
| `--preserve-symbols` | Keep symbols/emoji in output (default: remove) |
| `--no-user-dict` | Disable user dictionary |
| `--no-core-dict` | Disable core dictionary |

### Examples

```bash
# With user dictionary
suzume-cli -d user.dic "ChatGPTを使う"

# Compare with/without user dictionary
suzume-cli --compare -d user.dic "ChatGPTを使う"

# Normalize ヴ
suzume-cli --normalize-vu "ヴァイオリン"
# バイオリン    NOUN    バイオリン
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

# Decompile binary to TSV
suzume-cli dict decompile user.dic         # → user.tsv

# Validate dictionary
suzume-cli dict validate user.tsv

# Show dictionary info
suzume-cli dict info user.tsv

# Look up a word in all dictionary layers
suzume-cli dict lookup すぎる

# Search entries by pattern
suzume-cli dict search user.tsv "パターン"
```

### Interactive Mode

Launch an interactive REPL for dictionary editing:

```bash
suzume-cli dict -i user.tsv
```

Interactive commands:

| Command | Description |
|---------|-------------|
| `add <surface> <pos> [reading] [cost]` | Add entry |
| `remove <surface> [pos]` | Remove entry |
| `list [--pos=POS] [--limit=N]` | List entries |
| `search <pattern>` | Search entries |
| `find <surface>` | Look up in all layers |
| `analyze <text>` | Analyze text with current dictionary |
| `validate` | Validate dictionary |
| `compile` | Compile to binary |
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
surface	pos	reading	cost	conj_type
東京	NOUN	とうきょう	0.5
食べる	VERB	たべる	0.3	ICHIDAN
```

**POS values:** `NOUN`, `PROPN`, `VERB`, `ADJECTIVE`, `ADVERB`, `PARTICLE`, `AUXILIARY`, `SYMBOL`, `OTHER`

**Conjugation types (for VERB/ADJECTIVE):** `ICHIDAN`, `GODAN_KA`, `GODAN_GA`, `GODAN_SA`, `GODAN_TA`, `GODAN_NA`, `GODAN_BA`, `GODAN_MA`, `GODAN_RA`, `GODAN_WA`, `SURU`, `KURU`, `I_ADJ`, `NA_ADJ`

## test

Run verification tests and benchmarks.

```bash
# Test single input
suzume-cli test "テスト文" --expect "テスト,文"

# Run tests from file
suzume-cli test -f tests.tsv

# Run with user dictionary
suzume-cli test -f tests.tsv -d user.dic

# Benchmark
suzume-cli test benchmark --iterations=1000
```

### Test File Format

TSV with input and expected tags:

```tsv
東京スカイツリーに行きました	東京,スカイツリー,行く
美しい花が咲いている	美しい,花,咲く
```

## Building Dictionaries

To build or rebuild the dictionaries:

```bash
# Build the CLI first
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --parallel

# Build dictionaries (compiles TSV → .dic)
cmake --build build --target build-dict

# Validate dictionaries
cmake --build build --target validate-dict
```

## Building for WASM

To build the WebAssembly version:

```bash
# Requires Emscripten SDK
source /path/to/emsdk/emsdk_env.sh

# Configure for WASM
emcmake cmake -B build-wasm -DBUILD_WASM=ON -DCMAKE_BUILD_TYPE=Release

# Build dictionaries first (using native build)
cmake --build build --target build-dict

# Build WASM
cmake --build build-wasm --parallel

# Output: dist/suzume.js, dist/suzume-wasm.wasm
```
