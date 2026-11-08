---
layout: home

hero:
  name: Suzume
  text: Japanese tokenization, right in the browser
  tagline: A small Japanese tokenizer for web apps and services. Under __WASM_GZIP_SIZE__ gzipped, with no server and no dictionary download.
  actions:
    - theme: brand
      text: Get started
      link: /docs/getting-started
    - theme: alt
      text: View on GitHub
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

## Scope

Suzume is a tokenizer. It splits text on practical boundaries, keeps compounds and quantities together, and gives each token a POS and a lemma. It does not try to reproduce the segmentation of a dictionary-based analyzer, so code written against MeCab-style tokens needs its expectations restated. See [When to use which](/docs/how-it-works#when-to-use-which).

</div>
<div>

## Open source

Apache-2.0. The C++ core, the JavaScript and Python bindings, the CLI, and the test data live in [libraz/suzume](https://github.com/libraz/suzume); the Go binding is [libraz/go-suzume](https://github.com/libraz/go-suzume). The most useful bug report is an input sentence with the tokens you expected. [CONTRIBUTING.md](https://github.com/libraz/suzume/blob/main/CONTRIBUTING.md) covers the build, the tests, and the design rules CI enforces.

</div>
</div>

</HomeProse>
