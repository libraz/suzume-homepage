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

| API | Description |
|-----|-------------|
| `New()` | Create an analyzer with default options |
| `NewWithOptions(opts)` | Create an analyzer with normalization options |
| `NewWithExtendedOptions(opts)` | Create an analyzer with analysis mode, lemmatization, and compound options |
| `Analyze(text)` | Return `[]Morpheme` with surface, POS, base form, offsets, and metadata |
| `GenerateTags(text)` | Extract keyword tags |
| `GenerateTagsWithOptions(text, opts)` | Extract keyword tags with filters and limits |
| `LoadUserDictionary(data)` | Load CSV-format user dictionary data |
| `LoadBinaryDictionary(data)` | Load binary `.dic` dictionary data |
| `DictionaryWarnings()` | Return warnings from automatic dictionary loading |
| `Version()` | Return the linked Suzume library version |
| `LastError()` | Return the last C API error message for the current thread |

See the [go-suzume repository](https://github.com/libraz/go-suzume) and [Go package reference](https://pkg.go.dev/github.com/libraz/go-suzume) for the full API.
