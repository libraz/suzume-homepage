# Native Build

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
