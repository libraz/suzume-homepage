---
title: "はじめに：日本語テキストをトークン化する"
description: "JavaScript・Python・Go・C++・CLI で日本語テキストを単語に分割し、品詞と原形を取り出す手順です。ライブデモで結果を確かめてから、インストールと最初の解析に進みます。"
---

# はじめに

Suzume は、JavaScript/WASM、Python、Go、ネイティブ C/C++、コマンドラインから使える軽量な日本語トークナイザーです。日本語の文をトークンに分け、各トークンに[品詞](/ja/docs/glossary#pos)と[原形](/ja/docs/glossary#lemma)を付けます。下の入力欄で結果を確かめてから、使う実行環境の手順に進んでください。

<TokenizerPlayground />

## バインディングを選ぶ

このページの各手順には、バインディングごとのタブがあります。

| タブ | 実行環境 | パッケージ | リファレンス |
|------|----------|------------|--------------|
| JavaScript | ブラウザ、Node.js、Deno、Bun | npm の `@libraz/suzume` | [API リファレンス](/ja/docs/api) |
| Python | Linux x86_64 または macOS arm64 上の CPython 3.10 以上 | PyPI の `suzume` | [Python ガイド](/ja/docs/python) |
| Go | cgo を有効にした Go 1.26 以上 | `github.com/libraz/go-suzume` | [Go バインディング](/ja/docs/go) |
| C++ | ネイティブの C / C++ プログラム | ソースからビルド | [C / C++ ライブラリ](/ja/docs/cpp) |
| CLI | シェル | PyPI ホイールに含まれる `suzume` コマンド | [Python CLI](/ja/docs/python-cli) |

## インストール

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

# 利用側のモジュールで実行する
go mod edit -replace github.com/libraz/go-suzume=/path/to/go-suzume
go get github.com/libraz/go-suzume
```

```bash [C++]
git clone https://github.com/libraz/suzume.git
cd suzume
make install   # /usr/local へ。PREFIX=/opt/suzume で変更可
```

```bash [CLI]
pip install suzume   # ホイールが suzume コマンドもインストールする
```

:::

ほかのパッケージマネージャー、CDN 版、動作要件、ネイティブの開発者向けツール `suzume-cli` は [インストール](/ja/docs/installation) を参照してください。

## テキストを解析する

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

出力の 1 行が 1 トークンで、表層形、品詞、原形をタブ区切りで並べます。

<DiagramTokenAnatomy />

CLI は同じ 3 列の後ろに開始位置と終了位置を出力します。`食べ` は、`た` の前で動詞がとる[連用形](/ja/docs/glossary#renyokei)です。

トークンはこの 3 項目のほかに、[活用型と活用形](/ja/docs/glossary#conjugation-form)、位置、`isUserDict` や `isUnknown` などのフラグを持ちます。全項目は [Morpheme インターフェース](/ja/docs/api#morpheme-インターフェース) を参照してください。位置は正規化後テキスト上の Unicode コードポイント単位です。入力を切り出す前に [オフセット](/ja/docs/analysis-modes#offsets) を確認してください。

構築時のオプションで、解析モードと名詞複合語を結合するかどうかを選べます。[解析モード・オフセット・正規化](/ja/docs/analysis-modes#modes) を参照してください。全オプションと既定値は [`Suzume.create(options?)`](/ja/docs/api#suzume-create-options) にまとめています。

## よく使う処理

以下の例は [テキストを解析する](#テキストを解析する) で作ったインスタンスを使います。破棄または終了する前に実行してください。

### 検索キーワードを抽出する

`generateTags()` は助詞、助動詞、形式名詞、情報量の低い語を除き、残ったトークンの原形を返します。`excludeBasic` を指定すると、原形がひらがなだけの語も除きます。

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

どのタブでも出力は同じです。ほかのフィルターは [`generateTags(text, options?)`](/ja/docs/api#generatetags-text-options) を参照してください。

### 活用形を原形に戻す

活用した語の連なりでも、各トークンがそれぞれの原形を持ちます。表層形を原形に置き換えれば活用を戻せます。

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
# すべてのトークンを出力する。3 列目が原形
suzume "食べさせられなかった"
```

:::

```text
食べ -> 食べる
させ -> させる
られ -> られる
なかっ -> ない
```

末尾の `た` は表層形と原形が同じなので、条件に合わず出力されません。

## 次のステップ

| ページ | 内容 |
|--------|------|
| [インストール](/ja/docs/installation) | パッケージマネージャー、CDN、動作要件、`suzume-cli` |
| [ユーザー辞書](/ja/docs/user-dictionary) | ドメイン固有語の追加 |
| [解析モード・オフセット・正規化](/ja/docs/analysis-modes) | 解析モード、複合語の結合、位置 |
| [用語集](/ja/docs/glossary) | 出力とドキュメントで使う用語 |
| [仕組み](/ja/docs/how-it-works) | 解析の流れ |
| [ネイティブ CLI](/ja/docs/cli) | 辞書のコンパイルとテスト |
