# Native Build

Suzume can be built as a native C++ library and CLI tool for use outside the browser/Node.js environment.

::: tip Linking into your own project
This page covers building the CLI, dictionaries, and WASM module from source. To install the library and link it into a C or C++ program (CMake `find_package`, pkg-config, or an embedded no-filesystem build), see the [C / C++ library guide](/docs/cpp).
:::

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
| `BUILD_SHARED` | `OFF` | Also build the shared C ABI library used by native bindings |
| `SUZUME_LIB_SOVERSION` | `ON` | Attach VERSION/SOVERSION to the shared library (off for the flat wheel build) |
| `SUZUME_EMBED_DICT` | `OFF` | Embed compiled dictionaries and avoid runtime filesystem access |
| `SUZUME_INSTALL` | `ON` | Generate install/export rules for CMake and pkg-config |
| `SUZUME_BUILD_EXAMPLES` | `OFF` | Build the native C and C++ integration examples |
| `ENABLE_DEBUG_INFO` | `ON` (native) | Enable debug origin tracking in candidates |
| `ENABLE_DEBUG_LOG` | `ON` (native) | Enable debug logging |
| `ENABLE_COVERAGE` | `OFF` | Enable compiler coverage instrumentation |
| `ENABLE_SANITIZER` | `OFF` | Enable sanitizers (`ENABLE_ASAN`, `ENABLE_UBSAN`, `ENABLE_TSAN`) |

```bash
# Example: Release build without tests
cmake -B build -DCMAKE_BUILD_TYPE=Release -DBUILD_TESTING=OFF
cmake --build build --parallel
```

For using the `suzume-cli` command, see the [CLI reference](/docs/cli).

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

The supported convenience target builds the same full dictionaries used by native and Python distributions, configures Emscripten, compiles the module, and emits the JavaScript wrapper:

```bash
# Requires Emscripten SDK
source /path/to/emsdk/emsdk_env.sh

# Build the native CLI once, then the complete WASM package
make build
make wasm

# Native Emscripten output: bindings/wasm/dist/{suzume.wasm,suzume.js}

# Compile the public TypeScript wrapper and declarations
(cd bindings/wasm && yarn build:js)
# Adds: bindings/wasm/dist/{index.js,index.d.ts,abi_labels.js,abi_layout.js}
```

`make wasm-test` rebuilds the module and runs the Vitest binding suite. The WASM build uses `-Oz`, LTO, no exceptions/RTTI, no filesystem, and an embedded dictionary; allocation failure therefore aborts the module instead of returning a recoverable native C API error.
