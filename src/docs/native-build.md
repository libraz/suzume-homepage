# Native Build

Suzume builds as a C++17 static library and native developer CLI. A shared C ABI library, dictionary embedding, integration examples, and WASM are optional.

::: tip Linking into your own project
This page covers source-build configurations. For the installed C and C++ APIs, CMake targets, pkg-config, ownership, and ABI checks, see the [C / C++ library guide](/docs/cpp).
:::

## Building from Source

### Requirements

- C++17-compatible compiler (GCC 8+, Clang 10+, MSVC 2019+)
- CMake 3.15 or later

### Default Build

`BUILD_CLI` and `BUILD_TESTING` are ON by default:

```bash
git clone https://github.com/libraz/suzume.git
cd suzume

cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --parallel

# Native CLI
build/bin/suzume-cli --help
```

The static library is always built. Add `-DBUILD_SHARED=ON` when a shared C ABI library is also needed.

### Build Options

| Option | Default | Description |
|--------|---------|-------------|
| `BUILD_TESTING` | `ON` | Build the native test suite |
| `BUILD_WASM` | `OFF` | Build with Emscripten |
| `BUILD_SHARED` | `OFF` | Also build the shared C ABI library |
| `BUILD_CLI` | `ON` | Build and install the native developer CLI |
| `SUZUME_EMBED_DICT` | `OFF` | Embed compiled dictionaries and disable dictionary-file discovery |
| `SUZUME_LIB_SOVERSION` | `ON` | Attach VERSION/SOVERSION to the shared library |
| `SUZUME_INSTALL` | `ON` | Generate install rules and CMake/pkg-config package metadata |
| `SUZUME_BUILD_EXAMPLES` | `OFF` | Build the native C and C++ integration examples |
| `ENABLE_DEBUG_INFO` | native `ON`, WASM `OFF` | Track candidate origins |
| `ENABLE_DEBUG_LOG` | native `ON`, WASM `OFF` | Compile `SUZUME_DEBUG` logging |
| `ENABLE_COVERAGE` | `OFF` | Add compiler coverage instrumentation |
| `ENABLE_SANITIZER` | `OFF` | Enable sanitizer flags |
| `ENABLE_ASAN` | `OFF` | Select AddressSanitizer |
| `ENABLE_UBSAN` | `OFF` | Select UndefinedBehaviorSanitizer |
| `ENABLE_TSAN` | `OFF` | Select ThreadSanitizer |

If `ENABLE_SANITIZER=ON` and no individual sanitizer is selected, AddressSanitizer and UndefinedBehaviorSanitizer are enabled.

```bash
cmake -S . -B build \
  -DCMAKE_BUILD_TYPE=Release \
  -DBUILD_TESTING=OFF \
  -DBUILD_SHARED=ON
cmake --build build --parallel
```

For CLI commands, see the [CLI reference](/docs/cli).

## Library-Only Build

Turn `BUILD_CLI` off when the build machine should produce only libraries and package metadata:

```bash
cmake -S . -B build-lib \
  -DCMAKE_BUILD_TYPE=Release \
  -DBUILD_CLI=OFF \
  -DBUILD_TESTING=OFF \
  -DCMAKE_INSTALL_PREFIX=/opt/suzume
cmake --build build-lib --parallel
cmake --install build-lib
```

This configuration does not create `suzume-cli`, `build-dict`, or `validate-dict`. It also omits `core.dic` and `user.dic` from the install because those generated files require the CLI. With `SUZUME_EMBED_DICT=OFF`, install the compiled dictionaries separately or point the runtime at a directory containing them. Use `Options::data_directory`, the matching C option, or `SUZUME_DATA_DIR`.

For one static archive with dictionaries included:

```bash
make embedded
```

The target builds `suzume` with `SUZUME_EMBED_DICT=ON` and does not build the CLI or tests.

## Building Dictionaries

Dictionary build targets require the native CLI:

```bash
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --parallel

# Compile data/{core,user}/*.tsv to data/{core,user}.dic
cmake --build build --target build-dict

# Validate the core TSV files
cmake --build build --target validate-dict
```

`BUILD_CLI=OFF` intentionally removes both targets.

## Building the C / C++ Examples

```bash
cmake -S . -B build \
  -DCMAKE_BUILD_TYPE=Release \
  -DSUZUME_BUILD_EXAMPLES=ON
cmake --build build --parallel
ctest --test-dir build --output-on-failure -R '^suzume_example_'
```

`make examples-test` runs the same in-tree examples. The standalone project under `examples/consumer` tests an installed package through `find_package(suzume CONFIG REQUIRED)`.

## Building for WASM

The supported Make target compiles the full dictionaries with the native CLI, configures Emscripten, and builds the module:

```bash
source /path/to/emsdk/emsdk_env.sh

make build
make wasm

# Emscripten output:
# bindings/wasm/dist/{suzume.wasm,suzume.js}

(cd bindings/wasm && yarn build:js)
# Adds:
# bindings/wasm/dist/{index.js,index.d.ts,decode.js,decode.d.ts}
# bindings/wasm/dist/{abi_labels.js,abi_labels.d.ts,abi_layout.js,abi_layout.d.ts}
```

`make wasm-test` rebuilds the module and runs the Vitest binding suite. The WASM build uses `-Oz`, LTO, no exceptions or RTTI, no filesystem, and embedded dictionaries. Allocation failure therefore aborts the module instead of returning a recoverable C API error.
