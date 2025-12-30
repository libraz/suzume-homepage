# Installation

## Package Manager

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
