---
title: "Install Suzume: npm, CDN, Python, Go, or C++"
description: "Install the Suzume Japanese tokenizer: @libraz/suzume from npm or a CDN for browsers, Node.js, Deno and Bun, suzume from PyPI, or Go and C/C++ from source."
---

# Installation

## Pick Your Runtime

| Runtime | Package | Prebuilt | Requirements |
|---------|---------|----------|--------------|
| Browser, Node.js, Deno, Bun | `@libraz/suzume` on npm | Yes: one WASM build for every platform | Node.js 18.0+, Deno 1.31+ (`npm:@libraz/suzume`), Bun 1.0+, or a browser with WebAssembly |
| Python | `suzume` on PyPI | Linux x86_64 (`manylinux2014` / `manylinux_2_17`) and macOS arm64 (macOS 11+) wheels only. Windows, macOS x86_64, Linux arm64, and other platforms are not supported, and there is no source distribution | Python 3.10+ |
| Go | `github.com/libraz/go-suzume` | No: builds the C++ core from source | Go 1.26+, CGO, C++17 compiler, CMake 3.15+ |
| C / C++ | Source checkout of `libraz/suzume` | No | C++17 compiler, CMake 3.15+ |
| Native `suzume-cli` | Source checkout of `libraz/suzume` | No | C++17 compiler, CMake 3.15+ |

## JavaScript

For JavaScript, TypeScript, and browser usage, install the WASM package:

::: code-group

```bash [npm]
npm install @libraz/suzume
```

```bash [yarn]
yarn add @libraz/suzume
```

```bash [pnpm]
pnpm add @libraz/suzume
```

```bash [bun]
bun add @libraz/suzume
```

:::

The package bundles the WASM binary and its dictionaries, so no other files are needed at runtime.

## CDN

For browser usage without a build step:

```html
<script type="module">
  import { Suzume } from 'https://cdn.jsdelivr.net/npm/@libraz/suzume/dist/index.js'

  const suzume = await Suzume.create()
  console.log(suzume.analyze('こんにちは'))
  suzume.destroy() // when finished
</script>
```

## Python

For Python applications and data pipelines, install the wheel from PyPI:

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

`pip install` succeeds only on the platforms listed in [Pick Your Runtime](#pick-your-runtime), because no source distribution exists to fall back on. The wheel contains the native library and dictionaries and also installs the `suzume` command. See the [Python bindings guide](/docs/python) for the API and [Python CLI](/docs/python-cli) for the command.

## Go

The cgo binding builds its C++ core from source, which `go get` cannot do inside the read-only module cache. Clone it, build once, and reference the checkout from your module:

```bash
git clone https://github.com/libraz/go-suzume.git
cd go-suzume && make lib
```

Then, from your own module:

```bash
go mod edit -replace github.com/libraz/go-suzume=/path/to/go-suzume
go get github.com/libraz/go-suzume
```

The resulting application embeds its dictionaries and does not need external dictionary files at runtime. See the [Go bindings guide](/docs/go) for initialization, ownership, options, and API details.

## Command-line Tools

Two commands exist, and only one of them compiles dictionaries:

| Command | Comes from | Analysis and tags | `dict compile`, validation, tests, benchmarks |
|---------|------------|-------------------|-----------------------------------------------|
| `suzume` | The PyPI wheel | Yes | No |
| `suzume-cli` | A source build of `libraz/suzume` | Yes | Yes |

Installing the Python wheel provides `suzume`:

```bash
suzume --format json "東京へ行く"
```

### Native `suzume-cli` {#suzume-cli}

Neither the npm package nor the PyPI wheel contains `suzume-cli`. Build and install it from a source checkout:

```bash
git clone https://github.com/libraz/suzume.git
cd suzume
make install   # installs suzume-cli into /usr/local/bin; override with PREFIX=/opt/suzume
```

`make install` also installs the C / C++ library, headers, and the compiled dictionaries under `$PREFIX/share/suzume`, where `suzume-cli` finds them. To run the CLI from the checkout without installing anything, build it as described in [Native Build](/docs/native-build#default-build) and run `build/bin/suzume-cli`. See the [Native CLI reference](/docs/cli) for its commands.

## C / C++

To link Suzume directly into a native C or C++ program, build and install the library from source:

```bash
git clone https://github.com/libraz/suzume.git
cd suzume
make install                 # into /usr/local; override with PREFIX=/opt/suzume
```

This is the same command that installs [`suzume-cli`](#suzume-cli). See the [C / C++ library guide](/docs/cpp) for usage, CMake `find_package`, pkg-config, and builds with embedded dictionaries.
