# Go Bindings

The [`github.com/libraz/go-suzume`](https://github.com/libraz/go-suzume) module provides Go bindings for Suzume. Use it when you want the same Japanese tokenizer from Go services and command-line tools without going through the JavaScript/WASM package.

The bindings are a thin cgo layer over the native C++ core. The core and user dictionaries are embedded in the module with `go:embed` and made available to the analyzer automatically at startup, so a built binary needs no external dictionary files.

## Requirements

- Go 1.26 or later
- CGO enabled, with a C++17 compiler (GCC 8+, Clang 10+, Apple Clang 12+)
- CMake 3.15 or later (for the one-time static-library build)

Unlike the Python wheel, the module does not ship a precompiled binary: the Suzume static library is built once from source on your machine.

## Installation

The static library and the dictionaries are both produced from the C++ sources, and neither is published inside the Go module, so `go get` on its own is not enough. Clone the repository and build it once:

```bash
git clone https://github.com/libraz/go-suzume.git
cd go-suzume
make lib    # Fetches the Suzume C++ source and builds libsuzume.a
make test   # Optional: run the tests
```

Then point your module at the checkout:

```bash
go mod edit -replace github.com/libraz/go-suzume=/path/to/go-suzume
go get github.com/libraz/go-suzume
```

The build writes into the checkout, so keep it in a directory you can write to. The Go module cache is read-only and cannot host the build.

## Quick start

The package name is `suzume`. Create an analyzer with `New()`, defer `Close()` so the native handle is released, and iterate over the analyzed morphemes:

```go
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

`Analyze()` returns a `[]Morpheme` slice, or `nil` when the input produces no morphemes or the call fails. It does not return an error, and `LastError()` cannot reliably distinguish these cases: the native diagnostic belongs to the current OS thread, while the Go runtime may move the goroutine before it reads the value. `Close()` is safe to call multiple times, and a finalizer frees the handle as a fallback, but deferring `Close()` explicitly is the intended pattern.

An instance holds native mutable state and is not safe for concurrent calls. Use one instance per goroutine, or serialize access; separate instances may run concurrently, and creating one is inexpensive.

::: tip Embedded dictionaries
At package init, the embedded dictionaries are written to a content-addressed cache directory and exposed to the core via `SUZUME_DATA_DIR`. If you set `SUZUME_DATA_DIR` yourself before the program starts, your directory is respected and the embedded copies are not used.
:::

## Analysis modes

`NewWithExtendedOptions()` gives full control over segmentation, lemmatization, and compound merging. Start from `DefaultExtendedOptions()` — the zero value of `ExtendedOptions` does not match the library defaults (it would disable lemmatization and case/ヴ preservation):

```go
opts := suzume.DefaultExtendedOptions()
opts.Mode = suzume.ModeSearch // Search-oriented segmentation; merges noun compounds
opts.MergeCompounds = true

s, err := suzume.NewWithExtendedOptions(opts)
if err != nil {
	log.Fatal(err)
}
defer s.Close()
```

The available modes are `ModeNormal` (default), `ModeSearch`, and `ModeSplit`. See [Analysis Modes](/docs/api) for what each mode does to segmentation.

For the common case of tweaking only normalization, `NewWithOptions(Options)` takes just the three toggles `PreserveVu`, `PreserveCase`, and `PreserveSymbols`, keeping the library defaults for mode and lemmatization. `PreserveSymbols` controls punctuation-like `SYMBOL` tokens; content-bearing symbols and emoji remain `OTHER` either way.

## Morpheme fields

`Analyze()` returns a slice of `Morpheme` structs:

| Field | Type | Description |
|-------|------|-------------|
| `Surface` | `string` | Surface form as it appears in text |
| `POS` | `string` | Part of speech in English (UPPERCASE, e.g. `NOUN`) |
| `BaseForm` | `string` | Dictionary/base form |
| `POSJa` | `string` | Part of speech in Japanese (e.g. 名詞) |
| `ConjType` | `string` | Conjugation type; may be empty even when `IsConjugatable` is true |
| `ConjForm` | `string` | Conjugation form; meaningful when `IsConjugatable` is true |
| `ExtendedPOS` | `string` | Stable extended POS code (e.g. `VERB_連用`) |
| `Start` | `int` | Start character offset in normalized text |
| `End` | `int` | End character offset in normalized text |
| `IsUserDict` | `bool` | True when matched from a user dictionary |
| `IsFormalNoun` | `bool` | True for formal nouns such as こと and もの |
| `IsLowInfo` | `bool` | True when marked as low information for tag generation |
| `IsUnknown` | `bool` | True when generated as an unknown-word candidate |
| `IsFromDictionary` | `bool` | True when matched from any dictionary |
| `IsConjugatable` | `bool` | True when the conjugation fields carry meaning |
| `Score` | `float32` | Candidate score/cost used by the analyzer |

`IsConjugatable` includes auxiliaries as well as verbs and adjectives. A conjugatable morpheme can still have an empty `ConjType` when no conjugation type applies.

See the [API Reference](/docs/api) for the full list of `POS` and `ExtendedPOS` values.

## Tag generation

`GenerateTags()` extracts keyword tags from text. By default it keeps content words (nouns, verbs, adjectives, adverbs) and filters out particles, auxiliaries, formal nouns, and low-information words:

```go
for _, t := range s.GenerateTags("東京都の天気予報を確認する") {
	fmt.Printf("%s (%s)\n", t.Tag, t.POS)
}
```

Each result is a `Tag` struct with two fields: `Tag` (the keyword text) and `POS` (its part of speech).

`GenerateTagsWithOptions()` takes a `TagOptions` struct. Start from `DefaultTagOptions()` — the zero value of `TagOptions` disables every exclusion filter, which differs from the library defaults. The `POSFilter` field is a bitmask built from the `POSNoun`, `POSVerb`, `POSAdjective`, and `POSAdverb` constants (`0` means all):

```go
opts := suzume.DefaultTagOptions()
opts.POSFilter = suzume.POSNoun | suzume.POSVerb // Nouns and verbs only
opts.MaxTags = 10                                // Keep the top 10 tags

tags := s.GenerateTagsWithOptions("美味しいラーメンを食べた", opts)
```

The remaining `TagOptions` fields and their library defaults are:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `POSFilter` | `uint8` | `0` | POS bitmask to include (`0` = all) |
| `ExcludeBasic` | `bool` | `false` | Exclude words whose lemma is hiragana-only |
| `UseLemma` | `bool` | `true` | Use the lemma (dictionary form) instead of the surface form |
| `MinLength` | `int` | `2` | Minimum tag length in characters |
| `MaxTags` | `int` | `0` | Maximum number of tags (`0` = unlimited) |
| `ExcludeParticles` | `bool` | `true` | Exclude particles |
| `ExcludeAuxiliaries` | `bool` | `true` | Exclude auxiliaries |
| `ExcludeFormalNouns` | `bool` | `true` | Exclude formal nouns such as こと and もの |
| `ExcludeLowInfo` | `bool` | `true` | Exclude low-information words |
| `RemoveDuplicates` | `bool` | `true` | Remove duplicate tags |

## User dictionaries

Add custom words at runtime from the current TSV format with `LoadUserDictionary()`. Legacy three-column CSV is also accepted:

```go
source := []byte("東京公園\tNOUN\n点検する\tVERB\tSURU\n")
if err := s.LoadUserDictionary(source); err != nil {
	log.Fatal(err)
}

for _, m := range s.Analyze("東京公園を点検する") {
	fmt.Println(m.Surface, m.POS, m.IsUserDict)
}
```

Pre-compiled binary `.dic` dictionaries can be loaded from memory with `LoadBinaryDictionary()`:

```go
data, err := os.ReadFile("custom.dic")
if err != nil {
	log.Fatal(err)
}
if err := s.LoadBinaryDictionary(data); err != nil {
	log.Fatal(err)
}
```

Both methods return a non-nil `error` when loading fails. `DictionaryWarnings()` returns warnings from automatic loading at instance creation and later source/binary dictionary loads, or `nil` when there are none. A partially accepted source dictionary can therefore return no error while still adding a warning:

```go
for _, w := range s.DictionaryWarnings() {
	fmt.Println("warning:", w)
}
```

## API summary

Package-level functions:

| Function | Description |
|----------|-------------|
| `New() (*Suzume, error)` | Create an analyzer with default options |
| `NewWithOptions(opts Options) (*Suzume, error)` | Create with normalization toggles only |
| `NewWithExtendedOptions(opts ExtendedOptions) (*Suzume, error)` | Create with mode, lemmatization, and compound merging |
| `DefaultExtendedOptions() ExtendedOptions` | Library-default `ExtendedOptions` starting point |
| `DefaultTagOptions() TagOptions` | Library-default `TagOptions` starting point |
| `Version() string` | Native Suzume library version string |
| `LastError() string` | Current OS thread's native diagnostic; unreliable as a later failure check from Go |
| `LastErrorCode() ErrorCode` | Current OS thread's native diagnostic code, with the same thread-affinity caveat |

Methods on `*Suzume`:

| Method | Description |
|--------|-------------|
| `Analyze(text string) []Morpheme` | Analyze text (see [Morpheme fields](#morpheme-fields)) |
| `GenerateTags(text string) []Tag` | Extract keyword `Tag`s with the default filters |
| `GenerateTagsWithOptions(text string, opts TagOptions) []Tag` | Extract keyword `Tag`s with custom filters and limits |
| `LoadUserDictionary(data []byte) error` | Load a TSV or legacy CSV user dictionary |
| `LoadBinaryDictionary(data []byte) error` | Load a binary `.dic` dictionary |
| `DictionaryWarnings() []string` | Warnings from creation-time and runtime dictionary loading |
| `Close()` | Release the native handle (safe to call multiple times) |

## See also

- [API Reference](/docs/api) for the POS and `ExtendedPOS` value tables and the shared Morpheme concept.
- [Getting Started](/docs/getting-started) for an introduction to Suzume across all bindings.
- [go-suzume on GitHub](https://github.com/libraz/go-suzume) and the [pkg.go.dev reference](https://pkg.go.dev/github.com/libraz/go-suzume).
