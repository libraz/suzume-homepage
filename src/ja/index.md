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
cd "$(go list -m -f '{{.Dir}}' github.com/libraz/go-suzume)"
make lib
```

```bash [C / C++]
git clone https://github.com/libraz/suzume.git
cd suzume && make install
```

:::

Go 製のサーバー、CLI、バッチ処理で使う場合は [Go バインディングガイド](/ja/docs/go) を参照してください。Python から使う場合は [Python バインディングガイド](/ja/docs/python) を参照してください。ネイティブライブラリを C / C++ プロジェクトへリンクする場合は [C / C++ ライブラリガイド](/ja/docs/cpp) を参照してください。

## 使い方

同じ API を各ランタイムから利用できます。

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
	s, err := suzume.New()
	if err != nil {
		log.Fatal(err)
	}
	defer s.Close()

	for _, m := range s.Analyze("東京都に住んでいます") {
		fmt.Printf("%s\t%s\t%s\n", m.Surface, m.POS, m.BaseForm)
	}
}
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

各トークンは `surface`、`pos`、`baseForm` などのフィールドを持ちます。詳細は [Morpheme リファレンス](/ja/docs/api) を参照してください。

</HomeProse>
