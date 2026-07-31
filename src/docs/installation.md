# Installation

## Package Manager

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

## CDN

For browser usage without a build step:

```html
<script type="module">
  import { Suzume } from 'https://cdn.jsdelivr.net/npm/@libraz/suzume@0.9.8/dist/index.js'

  const suzume = await Suzume.create()
  // ...
</script>
```

## Requirements

- **Node.js**: 18.0 or later
- **Browser**: Any modern browser with WASM support (Chrome, Firefox, Safari, Edge)
- **Deno**: 1.0 or later
- **Bun**: 1.0 or later

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

Python 3.10 or later is required. PyPI publishes binary wheels for Linux x86_64 (`manylinux2014` / `manylinux_2_17`) and macOS arm64 on macOS 11 or later. Windows and other architectures are not supported. Suzume does not publish or support a source distribution.

The wheel contains the native library and dictionaries and also installs the `suzume` command. See the [Python bindings guide](/docs/python) for the API and [Python CLI](/docs/python-cli) for the command.

## Go

Add the cgo binding to a Go module, then build its bundled C++ core once:

```bash
go get github.com/libraz/go-suzume
cd $(go env GOPATH)/pkg/mod/github.com/libraz/go-suzume@latest
make lib
```

Go 1.26 or later, CGO, a C++17 compiler, and CMake 3.15 or later are required. The resulting application embeds its dictionaries and does not need external dictionary files at runtime. See the [Go bindings guide](/docs/go) for initialization, ownership, options, and API details.

## Command-line tools

Installing the Python wheel provides `suzume` for analysis and tag extraction:

```bash
suzume --format json "東京へ行く"
```

The separate native command, `suzume-cli`, is a developer tool with dictionary compilation, validation, testing, and benchmarking commands. See [Native Build & CLI](/docs/native-build) to build it and the [Native CLI reference](/docs/cli) for usage.

## C / C++

To link Suzume directly into a native C or C++ program, build and install the library from source:

```bash
git clone https://github.com/libraz/suzume.git
cd suzume
make install                 # into /usr/local; override with PREFIX=/opt/suzume
```

Requires a C++17 compiler and CMake 3.15+. See the [C / C++ library guide](/docs/cpp) for usage, CMake `find_package`, pkg-config, and builds with embedded dictionaries.
