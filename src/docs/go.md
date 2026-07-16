# Go Bindings

`github.com/libraz/go-suzume` provides CGO bindings for Suzume. Use it when you want the same Japanese morphological analyzer from Go services, CLIs, or batch jobs without going through the JavaScript/WASM package.

The core dictionary is embedded and auto-loaded by the Go package, so applications do not need to ship external dictionary files.

## Requirements

- Go 1.26 or later
- CGO enabled
- C++17 compiler (GCC 8+, Clang 10+, Apple Clang 12+)
- CMake 3.15 or later

## Installation

```bash
go get github.com/libraz/go-suzume
```

Build the vendored Suzume C++ library and compiled dictionaries before first use:

```bash
cd "$(go list -m -f '{{.Dir}}' github.com/libraz/go-suzume)"
make lib
```

For local development, clone the repository and build it there:

```bash
git clone https://github.com/libraz/go-suzume.git
cd go-suzume
make lib
make test
```

`make lib` fetches the Suzume C++ source when needed, builds `libsuzume.a`, and generates the binary dictionaries embedded by the Go package.

## Basic Usage

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

	morphemes := s.Analyze("東京都に住んでいます")
	for _, m := range morphemes {
		fmt.Printf("%s\t%s\t%s\n", m.Surface, m.POS, m.BaseForm)
	}

	tags := s.GenerateTags("東京都の天気予報を確認する")
	for _, t := range tags {
		fmt.Printf("%s (%s)\n", t.Tag, t.POS)
	}
}
```

## Morpheme Fields

`Analyze` returns a `[]Morpheme`. Each `Morpheme` exposes:

| Field | Description |
|-------|-------------|
| `Surface` | Surface form as it appears in the text |
| `POS` | Part-of-speech tag (uppercase, e.g. `NOUN`, `VERB`) |
| `POSJa` | Part-of-speech name in Japanese (e.g. `名詞`, `動詞`) |
| `BaseForm` | Dictionary base form (lemma) |
| `ConjType` | Conjugation type, if applicable |
| `ConjForm` | Conjugation form, if applicable |
| `ExtendedPOS` | Fine-grained POS subcategory |
| `Start` | Start byte offset in the input |
| `End` | End byte offset in the input |
| `IsUserDict` | Entry came from a loaded user dictionary |
| `IsFormalNoun` | Entry is a formal (dependent) noun |
| `IsLowInfo` | Entry carries low information content |
| `IsUnknown` | Entry is an unknown word |
| `IsFromDictionary` | Entry was matched from a dictionary |
| `Score` | Analysis score for the morpheme |

See [API Reference](/docs/api) for the full POS and `extendedPos` value tables.

## Thread Safety

The underlying native handle is not safe for concurrent calls on the same
analyzer instance. Use one analyzer per goroutine, or serialize access with a
mutex. Creating multiple analyzers is inexpensive, so a per-goroutine instance
is usually the simplest approach for a server.

## Normalization Options

`NewWithOptions` accepts an `Options` struct that controls normalization. The zero value `Options{}` sets `PreserveVu` and `PreserveCase` to `false`, the opposite of the recommended defaults, so construct `Options` explicitly and set both to `true` unless you specifically want that normalization applied.

```go
opts := suzume.Options{
	PreserveVu:      true,
	PreserveCase:    true,
	PreserveSymbols: false,
}

s, err := suzume.NewWithOptions(opts)
if err != nil {
	log.Fatal(err)
}
defer s.Close()
```

## Tag Options

Start from `DefaultTagOptions()` to keep the recommended default filters, then override only the fields you need. The zero value of `TagOptions` disables every exclusion filter.

```go
opts := suzume.DefaultTagOptions()
opts.POSFilter = suzume.POSNoun
opts.MaxTags = 10

tags := s.GenerateTagsWithOptions("東京都の天気予報を確認する", opts)
```

Available POS filter bits are `POSNoun`, `POSVerb`, `POSAdjective`, and `POSAdverb`.

## Analysis Modes

Use `NewWithExtendedOptions()` when you need a specific segmentation mode or want to toggle lemmatization and compound merging. Start from `DefaultExtendedOptions()` because the zero value of `ExtendedOptions` does not match the analyzer defaults.

```go
opts := suzume.DefaultExtendedOptions()
opts.Mode = suzume.ModeSearch
opts.MergeCompounds = true

s, err := suzume.NewWithExtendedOptions(opts)
if err != nil {
	log.Fatal(err)
}
defer s.Close()
```

Available modes are `ModeNormal`, `ModeSearch`, and `ModeSplit`.

## User Dictionaries

Load CSV-format user dictionaries from memory:

```go
err := s.LoadUserDictionary([]byte("ChatGPT,NOUN\n東京スカイツリー,NOUN"))
if err != nil {
	log.Fatal(err)
}
```

Binary `.dic` dictionaries can also be loaded:

```go
data, err := os.ReadFile("user.dic")
if err != nil {
	log.Fatal(err)
}
if err := s.LoadBinaryDictionary(data); err != nil {
	log.Fatal(err)
}
```

## API Surface

Instance methods on the `*Suzume` analyzer:

| Method | Description |
|--------|-------------|
| `New()` | Create an analyzer with default options |
| `NewWithOptions(opts)` | Create an analyzer with normalization options |
| `NewWithExtendedOptions(opts)` | Create an analyzer with analysis mode, lemmatization, and compound options |
| `Analyze(text)` | Return `[]Morpheme` (see [Morpheme fields](#morpheme-fields)) |
| `GenerateTags(text)` | Extract keyword tags |
| `GenerateTagsWithOptions(text, opts)` | Extract keyword tags with filters and limits |
| `LoadUserDictionary(data)` | Load CSV-format user dictionary data |
| `LoadBinaryDictionary(data)` | Load binary `.dic` dictionary data |
| `DictionaryWarnings()` | Return warnings from automatic dictionary loading |
| `Close()` | Release the native analyzer handle |

Package-level functions are called on the package, not on an analyzer instance:

| Function | Description |
|----------|-------------|
| `suzume.Version()` | Return the linked Suzume library version |
| `suzume.LastError()` | Return the last C API error message for the current thread |

See the [go-suzume repository](https://github.com/libraz/go-suzume) and [Go package reference](https://pkg.go.dev/github.com/libraz/go-suzume) for the full API.

## See also

- [API Reference](/docs/api) for the POS and `extendedPos` value tables and the shared Morpheme concept.
- [Getting Started](/docs/getting-started) for an introduction to Suzume across all bindings.
