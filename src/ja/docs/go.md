# Go バインディング

[`github.com/libraz/go-suzume`](https://github.com/libraz/go-suzume) モジュールは Suzume の Go バインディングです。Go のサービスやコマンドラインツールから、JavaScript/WASM パッケージを介さずに同じ日本語トークナイザーを使えます。

このバインディングはネイティブ C++ コアを薄く包んだ cgo レイヤーです。コア辞書とユーザー辞書は `go:embed` でモジュールに埋め込まれ、起動時に自動で解析器から参照できる状態になるため、ビルドした実行バイナリに外部辞書ファイルは不要です。

## 必要環境

- Go 1.26 以上
- CGO 有効、かつ C++17 コンパイラ（GCC 8+、Clang 10+、Apple Clang 12+）
- CMake 3.15 以上（初回の静的ライブラリビルドに使用）

Python ホイールと違いコンパイル済みバイナリは同梱されておらず、Suzume の静的ライブラリを一度だけ手元でソースからビルドします。

## インストール

プロジェクトにモジュールを追加します。

```bash
go get github.com/libraz/go-suzume
```

初回利用の前に C++ 静的ライブラリをビルドします。

```bash
cd $(go env GOPATH)/pkg/mod/github.com/libraz/go-suzume@latest
make lib
```

クローンして直接ビルドすることもできます。

```bash
git clone https://github.com/libraz/go-suzume.git
cd go-suzume
make lib    # Suzume の C++ ソースを取得して libsuzume.a をビルド
make test   # テストを実行
```

## クイックスタート

パッケージ名は `suzume` です。`New()` で解析器を作成し、`defer s.Close()` でネイティブハンドルを確実に解放して、解析された形態素を反復処理します。

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

`Analyze()` は `[]Morpheme` スライスを返します。入力から形態素が得られない場合や呼び出しが失敗した場合は `nil` を返すため、想定外の `nil` はパッケージレベルの `LastError()` で原因を確認してください。`Close()` は何度呼んでも安全で、ファイナライザによる解放も予備として用意されていますが、明示的に `defer` するのが想定された使い方です。

インスタンスはネイティブ側の可変状態を保持しており、並行呼び出しには安全ではありません。ゴルーチンごとに 1 インスタンスを使うか、アクセスを直列化してください。別々のインスタンスは並行に動作でき、作成コストも小さいものです。

::: tip 埋め込み辞書
パッケージの init 時に、埋め込まれた辞書はコンテンツアドレス方式のキャッシュディレクトリへ書き出され、`SUZUME_DATA_DIR` 経由でコアに渡されます。プログラム開始前に自分で `SUZUME_DATA_DIR` を設定していればそちらが優先され、埋め込み辞書は使われません。
:::

## 解析モード

`NewWithExtendedOptions()` を使うと、分割モード・原形化・複合語結合まで含めて制御できます。`ExtendedOptions` のゼロ値はライブラリの既定値と一致しない（原形化と大文字小文字・ヴの保持が無効になってしまう）ため、`DefaultExtendedOptions()` を起点にしてください。

```go
opts := suzume.DefaultExtendedOptions()
opts.Mode = suzume.ModeSearch // 細かめの分割で、名詞複合語を結合
opts.MergeCompounds = true

s, err := suzume.NewWithExtendedOptions(opts)
if err != nil {
	log.Fatal(err)
}
defer s.Close()
```

指定できるモードは `ModeNormal`（既定）、`ModeSearch`、`ModeSplit` です。各モードが分割に与える影響は [解析モード](/ja/docs/api) を参照してください。

正規化だけを調整したい場合は `NewWithOptions(Options)` が使えます。`PreserveVu`、`PreserveCase`、`PreserveSymbols` の 3 つのトグルだけを受け取り、モードと原形化はライブラリの既定値のままにします。

## Morpheme のフィールド

`Analyze()` は `Morpheme` 構造体のスライスを返します。

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `Surface` | `string` | テキスト中に現れる表層形 |
| `POS` | `string` | 英語の品詞（大文字、例: `NOUN`） |
| `BaseForm` | `string` | 辞書形・原形 |
| `POSJa` | `string` | 日本語の品詞（例: 名詞） |
| `ConjType` | `string` | 活用型。活用しない語では空文字列 |
| `ConjForm` | `string` | 活用形。活用しない語では空文字列 |
| `ExtendedPOS` | `string` | 安定した拡張品詞コード（例: `VERB_連用`） |
| `Start` | `int` | 正規化後テキストにおける開始文字オフセット |
| `End` | `int` | 正規化後テキストにおける終了文字オフセット |
| `IsUserDict` | `bool` | ユーザー辞書にマッチした場合 true |
| `IsFormalNoun` | `bool` | こと・もの などの形式名詞で true |
| `IsLowInfo` | `bool` | タグ生成向けに低情報量と判定された場合 true |
| `IsUnknown` | `bool` | 未知語候補として生成された場合 true |
| `IsFromDictionary` | `bool` | いずれかの辞書にマッチした場合 true |
| `Score` | `float32` | 解析器が用いる候補スコア・コスト |

`ConjType` と `ConjForm` が設定されるのは動詞と形容詞のみで、それ以外の品詞では空文字列のままです。

`POS` と `ExtendedPOS` の全一覧は [API リファレンス](/ja/docs/api) を参照してください。

## タグ生成

`GenerateTags()` はテキストからキーワードタグを抽出します。既定では内容語（名詞、動詞、形容詞、副詞）を残し、助詞、助動詞、形式名詞、低情報量の語を除外します。

```go
for _, t := range s.GenerateTags("東京都の天気予報を確認する") {
	fmt.Printf("%s (%s)\n", t.Tag, t.POS)
}
```

結果はそれぞれ `Tag` 構造体で、`Tag`（キーワードのテキスト）と `POS`（その品詞）の 2 フィールドを持ちます。

`GenerateTagsWithOptions()` は `TagOptions` 構造体を受け取ります。`TagOptions` のゼロ値はすべての除外フィルターが無効になり、ライブラリの既定値と一致しないため、`DefaultTagOptions()` を起点にしてください。`POSFilter` フィールドは `POSNoun`、`POSVerb`、`POSAdjective`、`POSAdverb` 定数を組み合わせるビットマスクです（`0` = すべて）。

```go
opts := suzume.DefaultTagOptions()
opts.POSFilter = suzume.POSNoun | suzume.POSVerb // 名詞と動詞のみ
opts.MaxTags = 10                                // 上位 10 件のタグのみ残す

tags := s.GenerateTagsWithOptions("美味しいラーメンを食べた", opts)
```

残りの `TagOptions` フィールドとライブラリの既定値は次のとおりです。

| フィールド | 型 | 既定値 | 説明 |
|-----------|-----|-------|------|
| `POSFilter` | `uint8` | `0` | 対象とする品詞のビットマスク（`0` = すべて） |
| `ExcludeBasic` | `bool` | `false` | 原形がひらがなのみの語を除外 |
| `UseLemma` | `bool` | `true` | 表層形ではなく原形（辞書形）を使う |
| `MinLength` | `int` | `2` | タグの最小文字数 |
| `MaxTags` | `int` | `0` | タグの最大件数（`0` = 無制限） |
| `ExcludeParticles` | `bool` | `true` | 助詞を除外 |
| `ExcludeAuxiliaries` | `bool` | `true` | 助動詞を除外 |
| `ExcludeFormalNouns` | `bool` | `true` | こと・もの などの形式名詞を除外 |
| `ExcludeLowInfo` | `bool` | `true` | 低情報量の語を除外 |
| `RemoveDuplicates` | `bool` | `true` | 重複するタグを除去 |

## ユーザー辞書

`LoadUserDictionary()` で、CSV データからカスタム語を実行時に追加できます。

```go
if err := s.LoadUserDictionary([]byte("ChatGPT,NOUN\n東京スカイツリー,NOUN")); err != nil {
	log.Fatal(err)
}

for _, m := range s.Analyze("ChatGPTを使う") {
	fmt.Println(m.Surface, m.POS, m.IsUserDict)
}
```

コンパイル済みのバイナリ `.dic` 辞書は、`LoadBinaryDictionary()` でメモリから読み込めます。

```go
data, err := os.ReadFile("custom.dic")
if err != nil {
	log.Fatal(err)
}
if err := s.LoadBinaryDictionary(data); err != nil {
	log.Fatal(err)
}
```

どちらのメソッドも、読み込みに失敗すると非 nil の `error` を返します。`DictionaryWarnings()` は、インスタンス作成時の辞書自動読み込みで発生した警告を返します（ない場合は `nil`）。

```go
for _, w := range s.DictionaryWarnings() {
	fmt.Println("警告:", w)
}
```

## API 概要

パッケージレベルの関数:

| 関数 | 説明 |
|------|------|
| `New() (*Suzume, error)` | 既定オプションで解析器を作成 |
| `NewWithOptions(opts Options) (*Suzume, error)` | 正規化トグルのみ指定して作成 |
| `NewWithExtendedOptions(opts ExtendedOptions) (*Suzume, error)` | モード・原形化・複合語結合まで指定して作成 |
| `DefaultExtendedOptions() ExtendedOptions` | ライブラリ既定値の `ExtendedOptions`（起点として使用） |
| `DefaultTagOptions() TagOptions` | ライブラリ既定値の `TagOptions`（起点として使用） |
| `Version() string` | ネイティブ Suzume ライブラリのバージョン文字列 |
| `LastError() string` | 直近のネイティブエラーメッセージ。ない場合は空文字列 |

`*Suzume` のメソッド:

| メソッド | 説明 |
|---------|------|
| `Analyze(text string) []Morpheme` | テキストを解析（[Morpheme のフィールド](#morpheme-のフィールド)を参照） |
| `GenerateTags(text string) []Tag` | 既定フィルターでキーワード `Tag` を抽出 |
| `GenerateTagsWithOptions(text string, opts TagOptions) []Tag` | フィルターや件数制限を指定して `Tag` を抽出 |
| `LoadUserDictionary(data []byte) error` | CSV ユーザー辞書を読み込む |
| `LoadBinaryDictionary(data []byte) error` | バイナリ `.dic` 辞書を読み込む |
| `DictionaryWarnings() []string` | 自動辞書読み込み時の警告 |
| `Close()` | ネイティブハンドルを解放（何度呼んでも安全） |

## 関連ページ

- [API リファレンス](/ja/docs/api) — 品詞と `ExtendedPOS` の値一覧、および共通の Morpheme の概念。
- [はじめに](/ja/docs/getting-started) — すべてのバインディングに共通する Suzume の入門。
- [go-suzume（GitHub）](https://github.com/libraz/go-suzume) と [pkg.go.dev リファレンス](https://pkg.go.dev/github.com/libraz/go-suzume)。
