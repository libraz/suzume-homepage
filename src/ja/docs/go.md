# Go バインディング

`github.com/libraz/go-suzume` は Suzume の CGO バインディングです。Go 製のサーバー、CLI、バッチ処理から、JavaScript/WASM パッケージを介さずに同じ日本語形態素解析器を使えます。

コア辞書は Go パッケージに埋め込まれ、自動で読み込まれます。アプリケーション側で外部辞書ファイルを同梱する必要はありません。

## 必要環境

- Go 1.26 以上
- CGO が有効であること
- C++17 対応コンパイラ（GCC 8+、Clang 10+、Apple Clang 12+）
- CMake 3.15 以上

## インストール

```bash
go get github.com/libraz/go-suzume
```

初回利用前に、vendored された Suzume C++ ライブラリとコンパイル済み辞書をビルドします：

```bash
cd "$(go list -m -f '{{.Dir}}' github.com/libraz/go-suzume)"
make lib
```

ローカル開発では、リポジトリを clone してビルドします：

```bash
git clone https://github.com/libraz/go-suzume.git
cd go-suzume
make lib
make test
```

`make lib` は必要に応じて Suzume C++ ソースを取得し、`libsuzume.a` をビルドして、Go パッケージに埋め込まれるバイナリ辞書も生成します。

## 基本的な使い方

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

## Morpheme のフィールド

`Analyze` は `[]Morpheme` を返します。各 `Morpheme` が持つフィールドは次のとおりです。

| フィールド | 説明 |
|-----------|------|
| `Surface` | テキスト中に現れる表層形 |
| `POS` | 品詞タグ（大文字、例：`NOUN`、`VERB`） |
| `POSJa` | 品詞の日本語名（例：名詞、動詞） |
| `BaseForm` | 辞書の原形（レンマ） |
| `ConjType` | 活用型（該当する場合） |
| `ConjForm` | 活用形（該当する場合） |
| `ExtendedPOS` | 細分化された品詞サブカテゴリ |
| `Start` | 入力中の開始バイトオフセット |
| `End` | 入力中の終了バイトオフセット |
| `IsUserDict` | 読み込んだユーザー辞書由来のエントリか |
| `IsFormalNoun` | 形式名詞（形式的な名詞）か |
| `IsLowInfo` | 情報量の少ないエントリか |
| `IsUnknown` | 未知語か |
| `IsFromDictionary` | 辞書と一致したエントリか |
| `Score` | 形態素の解析スコア |

品詞・`extendedPos` の値の一覧は [API リファレンス](/ja/docs/api)を参照してください。

## スレッド安全性

ネイティブハンドルは、同一の解析器インスタンスに対する並行呼び出しには対応していません。goroutine ごとに解析器を 1 つ用意するか、mutex でアクセスを直列化してください。解析器の生成は軽量なので、サーバーでは goroutine ごとにインスタンスを持つのが最も簡単です。

## 正規化オプション

`NewWithOptions` は正規化を制御する `Options` 構造体を受け取ります。ゼロ値 `Options{}` は `PreserveVu` と `PreserveCase` を `false` に設定し、これは推奨のデフォルトとは逆です。正規化を意図的に適用したい場合を除き、`Options` を明示的に構築して両方を `true` に設定してください。

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

## タグ抽出オプション

推奨のデフォルトフィルターを維持するには、`DefaultTagOptions()` から始めて必要なフィールドだけ上書きします。`TagOptions` のゼロ値はすべての除外フィルターを無効にします。

```go
opts := suzume.DefaultTagOptions()
opts.POSFilter = suzume.POSNoun
opts.MaxTags = 10

tags := s.GenerateTagsWithOptions("東京都の天気予報を確認する", opts)
```

品詞フィルターには `POSNoun`、`POSVerb`、`POSAdjective`、`POSAdverb` を指定できます。

## 解析モード

分割モードを選ぶ場合や、原形復元・複合語結合を切り替える場合は `NewWithExtendedOptions()` を使います。`ExtendedOptions` のゼロ値は解析器のデフォルトとは異なるため、`DefaultExtendedOptions()` から始めてください。

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

解析モードは `ModeNormal`、`ModeSearch`、`ModeSplit` です。

## ユーザー辞書

CSV 形式のユーザー辞書をメモリから読み込めます：

```go
err := s.LoadUserDictionary([]byte("ChatGPT,NOUN\n東京スカイツリー,NOUN"))
if err != nil {
	log.Fatal(err)
}
```

バイナリ `.dic` 辞書も読み込めます：

```go
data, err := os.ReadFile("user.dic")
if err != nil {
	log.Fatal(err)
}
if err := s.LoadBinaryDictionary(data); err != nil {
	log.Fatal(err)
}
```

## API 概要

`*Suzume` 解析器のインスタンスメソッド：

| メソッド | 説明 |
|----------|------|
| `New()` | デフォルト設定で解析器を作成 |
| `NewWithOptions(opts)` | 正規化オプション付きで解析器を作成 |
| `NewWithExtendedOptions(opts)` | 解析モード、原形復元、複合語設定付きで解析器を作成 |
| `Analyze(text)` | `[]Morpheme` を返す（[Morpheme のフィールド](#morpheme-のフィールド)を参照） |
| `GenerateTags(text)` | キーワードタグを抽出 |
| `GenerateTagsWithOptions(text, opts)` | フィルターや件数制限付きでキーワードタグを抽出 |
| `LoadUserDictionary(data)` | CSV 形式のユーザー辞書を読み込む |
| `LoadBinaryDictionary(data)` | バイナリ `.dic` 辞書を読み込む |
| `DictionaryWarnings()` | 自動辞書読み込み時の警告を返す |
| `Close()` | ネイティブ解析器ハンドルを解放 |

次の関数はインスタンスではなくパッケージに対して呼び出します：

| 関数 | 説明 |
|------|------|
| `suzume.Version()` | リンクされている Suzume ライブラリのバージョンを返す |
| `suzume.LastError()` | 現在のスレッドにおける最後の C API エラーを返す |

完全な API は [go-suzume リポジトリ](https://github.com/libraz/go-suzume) と [Go package reference](https://pkg.go.dev/github.com/libraz/go-suzume) を参照してください。

## 関連ページ

- [API リファレンス](/ja/docs/api) — 品詞・`extendedPos` の値一覧と、共通の Morpheme の概念。
- [はじめに](/ja/docs/getting-started) — 全バインディング共通の Suzume の入門。
