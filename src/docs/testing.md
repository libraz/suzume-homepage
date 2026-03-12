# Testing Guide

Suzume has a comprehensive test suite covering C++ core logic, WASM bindings, and CLI functionality. This guide explains how to run tests, add new ones, and use the built-in benchmark tools.

## Test Architecture

| Layer | Framework | Files | Description |
|-------|-----------|-------|-------------|
| C++ Unit/Integration | Google Test 1.12.1 | 31 files | Core library, dictionary, grammar, normalization |
| Data-Driven | JSON + Google Test | 77 JSON files | Tokenization correctness (auto-discovered) |
| WASM | Vitest | 3 files | JS/C API, memory layout, struct compatibility |
| CLI | Built-in | `test` command | Single/batch test, benchmarks |

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
yarn test
yarn test:watch      # Watch mode
yarn test:coverage   # With coverage report
```

### CLI Test Command

```bash
# Test single input
suzume-cli test "東京スカイツリー" --expect "東京,スカイツリー"

# Run tests from file
suzume-cli test -f tests.tsv

# With user dictionary
suzume-cli test -f tests.tsv -d user.dic

# Verbose output
suzume-cli test -f tests.tsv -v
```

## Adding Tests

### Data-Driven Tokenization Tests (Recommended)

The easiest way to add tests. JSON files in `tests/data/tokenization/` are **auto-discovered** — no code changes needed.

Create a JSON file:

```json
{
  "version": "1.0",
  "description": "Description of test category",
  "cases": [
    {
      "id": "unique_test_id",
      "description": "What this test verifies",
      "input": "テスト入力",
      "tags": ["category", "subcategory"],
      "expected": [
        {
          "surface": "テスト",
          "pos": "Noun",
          "lemma": "テスト"
        },
        {
          "surface": "入力",
          "pos": "Noun",
          "lemma": "入力"
        }
      ]
    }
  ]
}
```

Place it in `tests/data/tokenization/` and rebuild — the test runner picks it up automatically via `universal_tokenization_test.cpp`.

#### Optional Fields

```json
{
  "id": "test_with_extras",
  "input": "...",
  "expected": [...],
  "suzume_expected": [...],
  "accepted_diff": {
    "category": "lemma-diff",
    "reason": "Suzume uses different lemma normalization"
  }
}
```

- `suzume_expected` — Suzume-specific expected output (when it intentionally differs from a reference)
- `accepted_diff` — Documents known/accepted differences with a reason

#### Existing Test Files

77 JSON files organized by linguistic category:

| Category | Files | Description |
|----------|-------|-------------|
| `basic.json` | 1 | Basic tokenization, single words |
| `adjective*.json` | 5 | i-adjectives, na-adjectives, compounds |
| `verb*.json` | 10 | Ichidan, godan, suru, passive, causative |
| `particle*.json` | 7 | Case, topic, binding particles |
| `usecase_*.json` | 9 | Real-world texts: news, business, casual |
| `pattern_*.json` | 4 | Linguistic patterns |

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

Create `tests/wasm/feature.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { getModule, allocString, parseMorphemes } from './helpers'

describe('Feature', () => {
  let module: any

  beforeAll(async () => {
    module = await getModule()
  })

  it('should behave correctly', () => {
    const input = allocString(module, 'テスト')
    const result = module._Suzume_analyze(instance, input, options)
    const morphemes = parseMorphemes(module, result)

    expect(morphemes[0].surface).toBe('テスト')
  })
})
```

### CLI Test Files (TSV)

For batch testing via the CLI:

```tsv
# Comments start with #
東京スカイツリーに行きました	東京,スカイツリー,行く
美しい花が咲いている	美しい,花,咲く
```

Run with:

```bash
suzume-cli test -f tests.tsv
```

Output shows per-test results and a summary with pass/fail counts.

## Benchmarks

The CLI includes a built-in benchmark command:

```bash
# Default: 1000 iterations with built-in test texts
suzume-cli test benchmark

# Custom iterations
suzume-cli test benchmark --iterations=5000

# With custom corpus
suzume-cli test benchmark -f corpus.txt
```

Metrics reported:
- Total time (ms)
- Throughput (chars/sec)
- Per-text average latency

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

GitHub Actions runs on every push:

1. **Lint** — Biome for JS/TS (`js/`, `tests/wasm/`)
2. **Build & Test** — C++ tests with coverage, WASM tests
3. **Coverage** — Uploaded to Codecov (CLI code excluded from coverage metrics)

## Makefile Targets

| Target | Description |
|--------|-------------|
| `make test` | Build dictionaries + run all C++ tests |
| `make build` | Build the project |
| `make dict` | Build dictionaries only |
| `make wasm-test` | Build WASM + run WASM tests |
| `make format` | Format C++ code with clang-format |
| `make format-check` | Check C++ code formatting |
