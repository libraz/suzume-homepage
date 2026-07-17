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
  import { Suzume } from 'https://esm.sh/@libraz/suzume'

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

Python 3.10 or later is required. The native library and dictionaries ship inside the wheel, so there is nothing else to install.

See the [Python bindings guide](/docs/python) for usage.

## CLI

`suzume-cli` is the native command-line tool for tokenizing text from the shell.

See [Native Build & CLI](/docs/native-build) to build it and the [CLI reference](/docs/cli) for usage.

## Go

For Go services, CLIs, and batch jobs, use the CGO bindings:

```bash
go get github.com/libraz/go-suzume
cd "$(go list -m -f '{{.Dir}}' github.com/libraz/go-suzume)"
make lib
```

See [Go Bindings](/docs/go) for requirements, examples, and API notes.

## C / C++

To link Suzume directly into a native C or C++ program, build and install the library from source:

```bash
git clone https://github.com/libraz/suzume.git
cd suzume
make install                 # into /usr/local; override with PREFIX=/opt/suzume
```

Requires a C++17 compiler and CMake 3.15+. See the [C / C++ library guide](/docs/cpp) for usage, CMake `find_package`, pkg-config, and embedded (no-filesystem) builds.
