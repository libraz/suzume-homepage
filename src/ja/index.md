---
layout: home

hero:
  name: Suzume
  text: ブラウザで動く軽量日本語トークナイザー
  tagline: WebAssembly にコンパイルした軽量トークナイザー。gzip __WASM_GZIP_SIZE__ 以下で、サーバーも巨大な辞書もなしにクライアント側だけで動作します。
  actions:
    - theme: brand
      text: ライブデモを試す
      link: '#demo'
    - theme: alt
      text: はじめる
      link: /ja/docs/getting-started
---

<HomeHero />

<TypewriterDemo />

<HomeFeatures />

<div id="demo"></div>

<UseCaseDemo />

<ComparisonTable />

<HomeProse>

## インストール

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
go get github.com/libraz/go-suzume
```

```bash [C / C++]
git clone https://github.com/libraz/suzume.git
cd suzume && make install
```

:::

Python 製のサービスやデータパイプラインでは [Python バインディング](/ja/docs/python)、Go では [Go バインディング](/ja/docs/go)、ネイティブ組み込みでは [C / C++ ライブラリ](/ja/docs/cpp)を参照してください。

## 使い方

各バインディングは、言語ごとの命名に合わせて同じ解析モデルを公開します。

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

各トークンは表層形、品詞、原形、オフセットなどを持ちます。バインディングごとの名前は [JavaScript/WASM](/ja/docs/api)、[Python](/ja/docs/python)、[Go](/ja/docs/go)、[C / C++](/ja/docs/cpp) の各リファレンスを参照してください。

</HomeProse>
