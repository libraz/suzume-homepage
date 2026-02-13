# インストール

## パッケージマネージャー

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

ビルドステップなしでブラウザで使用する場合：

```html
<script type="module">
  import { Suzume } from 'https://esm.sh/@libraz/suzume'

  const suzume = await Suzume.create()
  // ...
</script>
```

## 動作要件

- **Node.js**: 16.0以上
- **ブラウザ**: WASM対応のモダンブラウザ（Chrome、Firefox、Safari、Edge）
- **Deno**: 1.0以上
- **Bun**: 1.0以上
