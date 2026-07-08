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

- **Node.js**: 16.0 or later
- **Browser**: Any modern browser with WASM support (Chrome, Firefox, Safari, Edge)
- **Deno**: 1.0 or later
- **Bun**: 1.0 or later

## Go

For Go services, CLIs, and batch jobs, use the CGO bindings:

```bash
go get github.com/libraz/go-suzume
cd "$(go list -m -f '{{.Dir}}' github.com/libraz/go-suzume)"
make lib
```

See [Go Bindings](/docs/go) for requirements, examples, and API notes.
