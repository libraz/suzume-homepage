---
title: "Getting Started: Tokenize Japanese Text"
description: "Split Japanese text into words with part-of-speech tags and lemmas from JavaScript, Python, Go, C++ or the CLI. Try the live demo, then install and run it."
---

# Getting Started

Suzume is a lightweight Japanese tokenizer for JavaScript/WASM, Python, Go, native C/C++, and the command line. It splits Japanese text into tokens and gives each token a [part of speech](/docs/glossary#pos) and a [lemma](/docs/glossary#lemma). Type a sentence below to see the result, then follow the steps for your runtime.

<TokenizerPlayground />

## Choose a Binding

Each step on this page has one tab per binding:

| Tab | Runtime | Package | Reference |
|-----|---------|---------|-----------|
| JavaScript | Browser, Node.js, Deno, Bun | `@libraz/suzume` on npm | [API Reference](/docs/api) |
| Python | CPython 3.10+ on Linux x86_64 or macOS arm64 | `suzume` on PyPI | [Python guide](/docs/python) |
| Go | Go 1.26+ with cgo | `github.com/libraz/go-suzume` | [Go bindings](/docs/go) |
| C++ | Native C or C++ program | Built from source | [C / C++ library](/docs/cpp) |
| CLI | Shell | `suzume` command from the PyPI wheel | [Python CLI](/docs/python-cli) |

## Install

::: code-group

```bash [JavaScript]
npm install @libraz/suzume
```

```bash [Python]
pip install suzume
```

```bash [Go]
git clone https://github.com/libraz/go-suzume.git
cd go-suzume && make lib

# From your own module:
go mod edit -replace github.com/libraz/go-suzume=/path/to/go-suzume
go get github.com/libraz/go-suzume
```

```bash [C++]
git clone https://github.com/libraz/suzume.git
cd suzume
make install   # into /usr/local; override with PREFIX=/opt/suzume
```

```bash [CLI]
pip install suzume   # the wheel also installs the suzume command
```

:::

[Installation](/docs/installation) covers other package managers, the CDN build, platform requirements, and the native `suzume-cli` developer tool.

## Analyze Text

::: code-group

```typescript [JavaScript]
import { Suzume } from '@libraz/suzume'

const suzume = await Suzume.create()

for (const m of suzume.analyze('東京で美味しいラーメンを食べた')) {
  console.log(`${m.surface}\t${m.pos}\t${m.baseForm}`)
}

suzume.destroy()
```

```python [Python]
from suzume import Suzume

with Suzume() as suzume:
    for m in suzume.analyze("東京で美味しいラーメンを食べた"):
        print(f"{m.surface}\t{m.pos}\t{m.base_form}")
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

	for _, m := range analyzer.Analyze("東京で美味しいラーメンを食べた") {
		fmt.Printf("%s\t%s\t%s\n", m.Surface, m.POS, m.BaseForm)
	}
}
```

```cpp [C++]
#include <iostream>

#include "suzume/suzume.hpp"

int main() {
  suzume::Tokenizer tokenizer;
  if (!tokenizer) return 1;
  for (const auto& m : tokenizer.analyze("東京で美味しいラーメンを食べた")) {
    std::cout << m.surface << '\t' << m.pos << '\t' << m.base_form << '\n';
  }
}
```

```bash [CLI]
suzume "東京で美味しいラーメンを食べた"
```

:::

Each printed line is one token, with its surface, part of speech, and lemma separated by tabs:

<DiagramTokenAnatomy />

The CLI prints the same three columns followed by the start and end offsets. `食べ` is the [continuative form](/docs/glossary#renyokei), the form a verb takes before `た`.

A token carries more than these three fields: [conjugation type and form](/docs/glossary#conjugation-form), offsets, and flags such as `isUserDict` and `isUnknown`. The full field list is in the [Morpheme interface](/docs/api#morpheme-interface). Offsets count Unicode code points in the normalized text; see [Offsets](/docs/analysis-modes#offsets) before slicing the input with them.

Construction options select the analysis mode and whether noun compounds merge; see [Modes, Offsets, and Normalization](/docs/analysis-modes#modes). Every option and its default is listed under [`Suzume.create(options?)`](/docs/api#suzume-create-options).

## Common Tasks

These snippets reuse the instance from [Analyze Text](#analyze-text), so run them before it is destroyed or closed.

### Extract Search Keywords

`generateTags()` drops particles, auxiliaries, formal nouns, and low-information words, and returns the lemma of each remaining token. `excludeBasic` also drops words whose lemma is all hiragana.

::: code-group

```typescript [JavaScript]
const tags = suzume.generateTags('東京スカイツリーで夜景を撮影しました', {
  excludeBasic: true,
  maxTags: 5,
})

for (const t of tags) {
  console.log(`${t.tag}\t${t.pos}`)
}
```

```python [Python]
tags = suzume.generate_tags(
    "東京スカイツリーで夜景を撮影しました",
    exclude_basic=True,
    max_tags=5,
)

for t in tags:
    print(f"{t.tag}\t{t.pos}")
```

```go [Go]
opts := suzume.DefaultTagOptions()
opts.ExcludeBasic = true
opts.MaxTags = 5

for _, t := range analyzer.GenerateTagsWithOptions("東京スカイツリーで夜景を撮影しました", opts) {
	fmt.Printf("%s\t%s\n", t.Tag, t.POS)
}
```

```cpp [C++]
suzume::TagOptions opts;
opts.exclude_basic = true;
opts.max_tags = 5;

for (const auto& t : tokenizer.generateTags("東京スカイツリーで夜景を撮影しました", opts)) {
  std::cout << t.tag << '\t' << t.pos << '\n';
}
```

```bash [CLI]
suzume -f tags --tag-exclude-basic --tag-max-tags 5 "東京スカイツリーで夜景を撮影しました"
```

:::

```text
東京	NOUN
スカイツリー	NOUN
夜景	NOUN
撮影	NOUN
```

All tabs print this output. See [`generateTags(text, options?)`](/docs/api#generatetags-text-options) for the remaining filters.

### Normalize Conjugated Words

Every token in a conjugated chain reports its own lemma, so mapping surfaces to lemmas undoes the inflection.

::: code-group

```typescript [JavaScript]
for (const m of suzume.analyze('食べさせられなかった')) {
  if (m.surface !== m.baseForm) {
    console.log(`${m.surface} -> ${m.baseForm}`)
  }
}
```

```python [Python]
for m in suzume.analyze("食べさせられなかった"):
    if m.surface != m.base_form:
        print(f"{m.surface} -> {m.base_form}")
```

```go [Go]
for _, m := range analyzer.Analyze("食べさせられなかった") {
	if m.Surface != m.BaseForm {
		fmt.Printf("%s -> %s\n", m.Surface, m.BaseForm)
	}
}
```

```cpp [C++]
for (const auto& m : tokenizer.analyze("食べさせられなかった")) {
  if (m.surface != m.base_form) {
    std::cout << m.surface << " -> " << m.base_form << '\n';
  }
}
```

```bash [CLI]
# Prints every token; the third column is the lemma.
suzume "食べさせられなかった"
```

:::

```text
食べ -> 食べる
させ -> させる
られ -> られる
なかっ -> ない
```

The final `た` is already its own lemma, so the filter skips it.

## Next Steps

| Page | Read it for |
|------|-------------|
| [Installation](/docs/installation) | Package managers, CDN, platform requirements, `suzume-cli` |
| [User Dictionary](/docs/user-dictionary) | Adding domain words |
| [Modes, Offsets, and Normalization](/docs/analysis-modes) | Analysis modes, compound merging, offsets |
| [Glossary](/docs/glossary) | Terms used in the output and these docs |
| [How It Works](/docs/how-it-works) | The analysis pipeline |
| [Native CLI](/docs/cli) | Dictionary compilation and test workflows |
