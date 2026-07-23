# Testing Guide

Suzume has a comprehensive test suite covering C++ core logic, WASM bindings, and CLI functionality. This guide explains how to run tests, add new ones, and use the built-in benchmark tools.

## Test Architecture

| Layer | Framework | Location | Description |
|-------|-----------|----------|-------------|
| C++ Unit/Integration | Google Test | `tests/**/*.cpp` | Core library, dictionary, grammar, normalization |
| Data-Driven | JSON + Google Test | `tests/data/tokenization/*.json` | Tokenization correctness (auto-discovered) |
| WASM | Vitest | `bindings/wasm/tests/` | JS/C API, memory layout, generated ABI compatibility |
| Python | pytest | `bindings/python/tests/` | Analyze/tags API, errors, ABI layout |
| CLI | Built-in | `test` / `test benchmark` | Single/batch tests and benchmarks |

## Running Tests

### C++ Tests

```bash
# Build and run all tests
make test

# Or manually:
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --parallel
cmake --build build --target build-dict   # Required: build dictionaries first
ctest --test-dir build --output-on-failure
```

Run specific tests by name pattern:

```bash
ctest --test-dir build -R "ConjugationTest" --output-on-failure
ctest --test-dir build -R "UserDict" --verbose
```

### WASM Tests

```bash
# Build WASM and run tests
make wasm-test

# Or run tests only (if WASM is already built)
(cd bindings/wasm && yarn test)
(cd bindings/wasm && yarn test:watch)      # Watch mode
(cd bindings/wasm && yarn test:coverage)   # With coverage report
```

### Python Tests

```bash
make python-test
# Direct equivalent: (cd bindings/python && uv run --extra dev pytest)
```

The pytest suite (`bindings/python/tests/`) covers the analyze and tags APIs and the ABI struct layout.

### CLI Test Command

```bash
# Test single input
suzume-cli test "東京スカイツリー" --expect "東京,スカイツリー"

# Run tests from file
suzume-cli test -f tests.tsv

# With user dictionary
suzume-cli test -f tests.tsv -d user.dic

```

## Adding Tests

### Data-Driven Tokenization Tests (Recommended)

Expectations in `tests/data/tokenization/*.json` are generated from the reference-analyzer normalization pipeline and auto-discovered by `universal_tokenization_test.cpp`.

::: danger Do not edit generated fixtures directly
Both `tests/data/tokenization/*.json` and `data/**/*.tsv` are tooling-managed; repository hooks block direct writes. Do not change an expected token merely to match current Suzume output. Fix the analyzer or the normalization rule, then regenerate through the tooling.
:::

With the repository MCP server configured, the standard workflow is:

```text
test_show(input_text="問題文")
# Fix and rebuild the analyzer or normalization rule.
test_show(input_text="問題文")
test_add(input_text="問題文", file="verb_example.json")
```

After changing normalization rules under `scripts/mcp/src/suzume_mcp/core/`, synchronize affected expectations with `test_needs_suzume_update(apply=True)`. See the repository `CONTRIBUTING.md` and `AGENTS.md` for the current workflow and tool reference.

::: warning POS labels in fixtures
The `pos` values in these JSON fixtures use a Title-case reference taxonomy (`Noun`, `Particle`, …). This is a separate label set from the runtime `Morpheme.pos` values returned by the library, which are UPPERCASE English (`NOUN`, `PARTICLE`, …). Don't assume the two match verbatim.
:::

#### Existing Test Files

The suite grows over time and is organized by linguistic category. A representative selection:

| Category | Description |
|----------|-------------|
| `basic.json` | Basic tokenization, single words |
| `adjective*.json` | i-adjectives, na-adjectives, compounds |
| `verb*.json` | Ichidan, godan, suru, passive, causative |
| `particle*.json` | Case, topic, binding particles |
| `usecase_*.json` | Real-world texts: news, business, casual |
| `pattern_*.json` | Linguistic patterns |

### C++ Unit Tests

For testing internal modules directly:

1. Create `tests/category/new_test.cpp`
2. Add to `TEST_SOURCES` in `tests/CMakeLists.txt`

```cpp
#include <gtest/gtest.h>
#include "module_header.h"

TEST(ModuleTest, SpecificBehavior) {
    // Arrange
    auto input = ...;

    // Act
    auto result = module.process(input);

    // Assert
    EXPECT_EQ(result.field, expected_value);
}
```

### WASM Tests

For testing the WebAssembly bindings:

Create `bindings/wasm/tests/feature.test.ts`:

```typescript
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Suzume } from '../dist/index.js'

describe('Feature', () => {
  let suzume: Suzume

  beforeAll(async () => {
    suzume = await Suzume.create()
  })

  afterAll(() => {
    suzume.destroy()
  })

  it('should behave correctly', () => {
    const morphemes = suzume.analyze('テスト')
    expect(morphemes[0].surface).toBe('テスト')
  })
})
```

### CLI Test Files (TSV)

For batch testing via the CLI:

```tsv
# Comments start with #
東京スカイツリーに行きました	東京,スカイツリー,行く
美しい花が咲いている	美しい,咲く
```

Run with:

```bash
suzume-cli test -f tests.tsv
```

Output shows per-test results and a summary with pass/fail counts.

## Benchmarks

The CLI includes a built-in benchmark command:

```bash
# Built-in test texts with the default measurement settings
suzume-cli test benchmark

# Control steady iterations, statistical samples, and warmup
suzume-cli test benchmark --iterations=5 --samples=3 --warmup=2

# With custom corpus
suzume-cli test benchmark -f corpus.txt
```

Metrics reported include initialization time, first-analysis latency, median steady-state latency, byte throughput, per-text latency, and peak RSS. Multiple samples make the steady-state median less sensitive to one-off noise.

## Debug Builds

### With Sanitizers

```bash
# AddressSanitizer
cmake -B build -DCMAKE_BUILD_TYPE=Debug -DENABLE_ASAN=ON
cmake --build build && ctest --test-dir build

# UndefinedBehaviorSanitizer
cmake -B build -DCMAKE_BUILD_TYPE=Debug -DENABLE_UBSAN=ON
cmake --build build && ctest --test-dir build

# ThreadSanitizer
cmake -B build -DCMAKE_BUILD_TYPE=Debug -DENABLE_TSAN=ON
cmake --build build && ctest --test-dir build
```

### With Coverage

```bash
cmake -B build -DCMAKE_BUILD_TYPE=Debug -DENABLE_COVERAGE=ON
cmake --build build
ctest --test-dir build
# Coverage files generated in build/
```

## CI

GitHub Actions runs four jobs on every push and pull request:

| Job | What it checks |
|-----|-----------------|
| `lint` | WASM binding lint (`yarn lint`) |
| `guardrails` | Generated-file and code guardrails (`check_code_guardrails.sh`, `check_oracle_overrides.py`), version consistency across binding manifests (`check_version_mirror.sh`) |
| `build-and-test` | C++ build and `ctest` with coverage, uploaded to Codecov; WASM build, size-check, and test |
| `python-binding` | `ruff check` / `ruff format --check`, `mypy`, and `pytest` for the Python binding |

`make consumer-smoke` and `make format-check` (which includes clang-format for C++) are local Makefile targets for manual verification — they are not wired into CI.

## Makefile Targets

| Target | Description |
|--------|-------------|
| `make test` | Build dictionaries + run all C++ tests |
| `make build` | Build the project |
| `make dict` | Build dictionaries only |
| `make wasm-test` | Build WASM + run WASM tests |
| `make python-test` | Build and test the Python binding, including lint/type checks |
| `make examples` | Build the in-tree C and C++ examples |
| `make consumer-smoke` | Test an installed package through `find_package` |
| `make version-check` | Verify versions across binding manifests |
| `make format` | Format/lint C++, MCP, WASM, and Python sources |
| `make format-check` | Check formatting across all languages |
