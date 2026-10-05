# Speed and Accuracy

This page reports a reproducible Node/WASM speed run and an in-sample boundary-agreement measurement. Each figure states what it covers so you can compare it with your own workload.

## WASM speed under Node

The script measures the public JavaScript API, including result decoding. It first creates shared-runtime handles, so the creation row is measured after the WASM module cache is warm; it does not measure a cold download or module startup.

| | Median |
|---|---|
| Create an analyzer in a loaded/shared WASM runtime | 2.324 ms |
| First analysis after creation | 0.483 ms |
| Steady-state analysis, per text | 0.284286 ms |
| Steady-state throughput | 14,070 tokens/sec |

```bash
make build
make wasm
(cd bindings/wasm && yarn install --immutable && yarn build:js)
node scripts/measure_wasm_metrics.mjs --instances=3 --iterations=500 --samples=5 --warmup=1
```

This run was measured on October 5, 2026, using an Apple M5 Max (arm64) with Node v24.21.0 and the script's three built-in short texts. Pass `--corpus=/path/to/corpus.txt` to measure another input set. These are Node measurements; they do not predict browser or phone timings.

The playground on [Getting Started](/docs/getting-started) and [How It Works](/docs/how-it-works) runs its own browser measurement on your device and prints the result below the output. The native CLI has a separate benchmark command:

```bash
suzume-cli test benchmark --iterations=500 --samples=5 --warmup=1
```

These checks use separate implementations and measurement conditions; compare results within the environment you are testing. The module must arrive before it can run: <WasmSize /> gzipped, loaded once and cached thereafter.

## Boundary agreement on a fixture subset

The script scores cases under `tests/data/tokenization` whose expected surfaces reassemble to the raw single-line input. It invokes the native CLI with its default dictionary loading. The full `universal_tokenization_test` suite uses `skip_user_dictionary=true`, while this script skips cases whose input would be normalized or contains a newline. Treat the result as an in-sample regression measure for this script's subset, not as full-suite health.

Suzume is not measured by agreement with MeCab, since the two do not aim to produce interchangeable output — see [Differences from MeCab](/docs/mecab-comparison).

| | Score |
|---|---|
| Boundary F1 | 0.9997 |
| Boundary precision / recall | 0.9995 / 1.0000 |
| Token F1 | 0.9996 |
| Token precision / recall | 0.9994 / 0.9998 |
| Sentences segmented exactly | 0.9991 (5,631 / 5,636) |

Scored on October 5, 2026, over 5,636 cases and 20,279 tokens.

```bash
make dict
python3 scripts/measure_segmentation_accuracy.py --per-category
```

::: warning Scope of this score
These cases are Suzume's own test suite, and the tokenizer is fixed until it passes them. The score does not estimate how Suzume handles text it has never seen, and the script's case filtering and dictionary configuration differ from the full native fixture suite.

Do not use it to compare Suzume against another tokenizer or as an expected accuracy for your own corpus. Run your own text through the [live demo](/) or the CLI instead.
:::

Boundary scores count agreement on interior boundaries between adjacent tokens; document edges are excluded. Token scores require both edges for each token, and sentence exactness requires the complete segmentation to match. Use the `--per-category` output to inspect the current fixture breakdown.

## What is not measured here

- **Comparative accuracy.** There is no table putting Suzume's F1 next to
  another tokenizer's on a shared corpus. Doing that fairly needs an
  annotation standard both tools target, and Suzume deliberately does not
  target MeCab's. See [Differences from MeCab](/docs/mecab-comparison).
- **Held-out accuracy.** The reported cases are in-sample; a held-out estimate needs text that was never used to fix a bug here.
- **Memory under adversarial input.** Allocation counts require an
  instrumented build; the released artifact does not report them.
