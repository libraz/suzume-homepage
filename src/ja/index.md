---
layout: home

hero:
  name: Suzume
  text: ブラウザで動く軽量日本語トークナイザー
  tagline: Web アプリやサービスのための小さな日本語トークナイザーです。gzip 後 __WASM_GZIP_SIZE__ 以下で、サーバーも辞書のダウンロードも要りません。
  actions:
    - theme: brand
      text: はじめる
      link: /ja/docs/getting-started
    - theme: alt
      text: GitHub で見る
      link: https://github.com/libraz/suzume
---

<HomeHero />

<div id="demo"></div>

<UseCaseDemo />

<HomeFeatures />

<ComparisonTable />

<HomeProse>

<div class="home-split">
<div>

## 対象範囲

Suzume はトークナイザーです。実用的な境界でテキストを分け、複合語や数量表現はまとめたまま、各トークンに品詞と原形を付けます。辞書ベースの解析器と同じ分割を再現することは目指していないため、MeCab 形式のトークンを前提にしたコードでは期待値の見直しが必要です。[使い分けの指針](/ja/docs/how-it-works#when-to-use-which) を参照してください。

</div>
<div>

## オープンソース

Apache-2.0 ライセンスです。C++ のコア、JavaScript と Python のバインディング、CLI、テストデータは [libraz/suzume](https://github.com/libraz/suzume) に、Go バインディングは [libraz/go-suzume](https://github.com/libraz/go-suzume) にあります。不具合の報告には、入力文と期待したトークンを添えてもらえると最も助かります。ビルド、テスト、CI が検査する設計上の規則は [CONTRIBUTING.md](https://github.com/libraz/suzume/blob/main/CONTRIBUTING.md) にまとめています。

</div>
</div>

</HomeProse>
