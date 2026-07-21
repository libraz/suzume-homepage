---
layout: home

hero:
  name: Suzume
  text: Japanese tokenization, right in the browser
  tagline: A lightweight tokenizer compiled to WebAssembly. Under __WASM_GZIP_SIZE__ gzipped, it runs entirely client-side — no server, no multi-megabyte dictionary.
  actions:
    - theme: brand
      text: Try the live demo
      link: '#demo'
    - theme: alt
      text: Get started
      link: /docs/getting-started
---

<HomeHero />

<TypewriterDemo />

<HomeFeatures />

<div id="demo"></div>

<UseCaseDemo />

<ComparisonTable />

<HomeProse>

## Installation

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

```bash [python (pip)]
pip install suzume
```

```bash [C / C++]
git clone https://github.com/libraz/suzume.git
cd suzume && make install
```

:::

For Python services and data pipelines, see the [Python bindings guide](/docs/python). To link the native library into a C or C++ project, see the [C / C++ library guide](/docs/cpp).

## Usage

The same API is available from every runtime:

::: code-group

```typescript [TypeScript]
import { Suzume } from '@libraz/suzume'

const suzume = await Suzume.create()

for (const m of suzume.analyze('東京都に住んでいます')) {
  console.log(m.surface, m.pos, m.baseForm)
}
```

```python [Python]
from suzume import Suzume

with Suzume() as sz:
    for m in sz.analyze("東京都に住んでいます"):
        print(m.surface, m.pos, m.base_form)
```

```cpp [C++]
#include "suzume/suzume.hpp"
#include <cstdio>

int main() {
  suzume::Tokenizer tokenizer;
  for (const suzume::Morpheme& m : tokenizer.analyze("東京都に住んでいます"))
    std::printf("%s\t%s\t%s\n", m.surface.c_str(), m.pos.c_str(), m.lemma.c_str());
}
```

:::

Each token carries `surface`, `pos`, `baseForm`, and more — see the full [Morpheme reference](/docs/api).

</HomeProse>
