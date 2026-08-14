# Speed and Accuracy

How fast Suzume runs in a browser, and how well it segments text. Each figure
below states what it covers and what it does not, so you can tell which ones
apply to your workload.

Every figure comes from a script in the repository, with the command to run it
alongside. Your own hardware and your own text are what should decide this.

## Speed in the browser

Measured through the public JavaScript API, including result decoding, so the
figure is what a caller actually waits for rather than the tokenizer's
internal time.

| | Median |
|---|---|
| Instantiate the WASM module | 2.93 ms |
| First analysis after instantiation | 0.48 ms |
| Steady-state analysis, per text | 0.34 ms |
| Steady-state throughput | 11,878 tokens/sec |

```bash
make wasm
node scripts/measure_wasm_metrics.mjs --instances=3 --iterations=500 --samples=5 --warmup=1
```

Measured on an Apple M5 Max under Node. A slower phone will not produce these
numbers, but the shape holds: instantiation costs a few milliseconds once,
and each subsequent call costs a fraction of a millisecond.

You do not have to take the table's word for it. The [playground](/) times
itself on your device and prints what it measured underneath the results, and
the CLI reports the same three figures for a native build:

```bash
suzume-cli test benchmark --iterations=500 --samples=5 --warmup=1
```

Running both is how you find out what WebAssembly costs you on the hardware
you actually care about, rather than scaling someone else's number.

That is the claim behind "tokenize on every keystroke". At roughly a third of
a millisecond per call, analysis is not what a typing interface waits for —
even at sixty frames a second, one call occupies about two percent of a
frame's budget. The comparison worth making is not against another tokenizer
but against a network round trip, which starts in the tens of milliseconds
and is subject to conditions you do not control.

The module also has to arrive before it can run: <WasmSize /> gzipped, once,
cached thereafter.

## Segmentation accuracy

Scored against the expected segmentations committed in the repository. Suzume
is not measured by its agreement with MeCab, since the two do not aim to
produce interchangeable output — see [Differences from MeCab](/docs/mecab-comparison).

| | Score |
|---|---|
| Boundary F1 | 0.9997 |
| Boundary precision / recall | 0.9994 / 1.0000 |
| Token F1 | 0.9995 |
| Sentences segmented exactly | 0.9991 |

Scored over 4,516 cases and 15,920 tokens.

```bash
make build
python3 scripts/measure_segmentation_accuracy.py --per-category
```

::: warning This is an in-sample score
These cases are Suzume's own test suite, and the tokenizer is fixed until it
passes them. So 0.9997 tells you the covered behaviour is stable — it does not
estimate how Suzume handles text it has never seen.

Do not use it to compare Suzume against another tokenizer, and do not read it
as an expected accuracy for your own corpus. For that, run your own text
through the [live demo](/) or the CLI.
:::

Boundary F1 comes first because it is the number that matters for search
indexing: whether a query matches depends on where a token starts and ends,
not on the label attached to it.

The weakest categories are the real-world usage sets (`usecase_realworld`
at 0.9845, `usecase_mixed` at 0.9957), which is the expected shape — running
text mixes registers and proper nouns in ways that isolated grammar cases do
not.

## What is not measured here

- **Comparative accuracy.** There is no table putting Suzume's F1 next to
  another tokenizer's on a shared corpus. Doing that fairly needs an
  annotation standard both tools target, and Suzume deliberately does not
  target MeCab's. See [Differences from MeCab](/docs/mecab-comparison).
- **Held-out accuracy.** As above: the accuracy score is in-sample.
- **Memory under adversarial input.** Allocation counts require an
  instrumented build; the released artifact does not report them.
