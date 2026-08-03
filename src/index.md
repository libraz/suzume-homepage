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

```bash [Go]
git clone https://github.com/libraz/go-suzume.git
cd go-suzume && make lib
cd /path/to/your/module
go mod edit -replace github.com/libraz/go-suzume=/path/to/go-suzume
go get github.com/libraz/go-suzume
```

```bash [C / C++]
git clone https://github.com/libraz/suzume.git
cd suzume && make install
```

:::

For Python services and data pipelines, see the [Python bindings guide](/docs/python). Suzume is also available through the [Go binding](/docs/go) and as a [C / C++ library](/docs/cpp).

## Usage

The bindings expose the same analysis model with names adapted to each language:

::: code-group

```typescript [TypeScript]
import { Suzume } from '@libraz/suzume'

const suzume = await Suzume.create()

try {
  for (const m of suzume.analyze('東京都に住んでいます')) {
    console.log(m.surface, m.pos, m.baseForm)
  }
} finally {
  suzume.destroy()
}
```

```python [Python]
from suzume import Suzume

with Suzume() as sz:
    for m in sz.analyze("東京都に住んでいます"):
        print(m.surface, m.pos, m.base_form)
```

```go [Go]
package main

import (
  "fmt"
  "log"

  "github.com/libraz/go-suzume"
)

func main() {
  analyzer, err := suzume.New()
  if err != nil {
    log.Fatal(err)
  }
  defer analyzer.Close()

  for _, m := range analyzer.Analyze("東京都に住んでいます") {
    fmt.Println(m.Surface, m.POS, m.BaseForm)
  }
}
```

```cpp [C++]
#include "suzume/suzume.hpp"
#include <cstdio>

int main() {
  suzume::Tokenizer tokenizer;
  for (const suzume::Morpheme& m : tokenizer.analyze("東京都に住んでいます"))
    std::printf("%s\t%s\t%s\n", m.surface.c_str(), m.pos.c_str(), m.base_form.c_str());
}
```

:::

Each token carries a surface form, POS, base form, offsets, and more. See the [JavaScript/WASM](/docs/api), [Python](/docs/python), [Go](/docs/go), or [C / C++](/docs/cpp) reference for binding-specific names.

</HomeProse>
