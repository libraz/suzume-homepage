# Go バインディング

[`github.com/libraz/go-suzume`](https://github.com/libraz/go-suzume) モジュールは Suzume の Go バインディングです。Go のサービスやコマンドラインツールから、JavaScript/WASM パッケージを介さずに同じ日本語トークナイザーを使えます。

このバインディングはネイティブ C++ コアを薄く包んだ cgo レイヤーです。コア辞書とユーザー辞書は `go:embed` でモジュールに埋め込まれ、起動時に自動で解析器から参照できる状態になるため、ビルドした実行バイナリに外部辞書ファイルは不要です。

## 必要環境

- Go 1.26 以上
- CGO 有効、かつ C++17 コンパイラ（GCC 9+、Clang 10+、Apple Clang 12+）
- CMake 3.15 以上（初回の静的ライブラリビルドに使用）

Python ホイールと違いコンパイル済みバイナリは同梱されておらず、Suzume の静的ライブラリを一度だけ手元でソースからビルドします。

## インストール

静的ライブラリと辞書はどちらも C++ ソースから生成され、Go モジュールには含まれません。そのため `go get` だけではビルドできません。リポジトリをクローンして一度ビルドします。

```bash
git clone https://github.com/libraz/go-suzume.git
cd go-suzume
make lib    # Suzume の C++ ソースを取得して libsuzume.a をビルド
make test   # 任意: テストを実行
```

利用側のモジュールからは、このチェックアウトを参照します。

```bash
go mod edit -replace github.com/libraz/go-suzume=/path/to/go-suzume
go get github.com/libraz/go-suzume
```

ビルド成果物はチェックアウト先に書き込まれるため、書き込み可能なディレクトリに置いてください。Go のモジュールキャッシュは読み取り専用なので、そこにはビルドできません。

`make lib` は既存の `csuzume` ソースを再利用し、コアを自動更新しません。特定の Suzume リリースでビルドする場合は、別の Suzume リポジトリで対象のリリースをチェックアウトし、Go のチェックアウトへ同期します。

```bash
./sync-upstream.sh --local /path/to/suzume
make lib
```

同期はキャッシュされたコアと辞書を置き換えるため、次のビルドは選んだソースを使います。`make sync` を使うと、代わりに上流のデフォルトブランチから取得します。

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

`Analyze()` は `[]Morpheme` スライスを返します。入力から形態素が得られない場合も、呼び出しが失敗した場合も `nil` になり、戻り値だけでは区別できません。`LastError()` も確実な判定には使えません。ネイティブの診断は現在の OS スレッドに属し、値を読む前に Go ランタイムがゴルーチンを別スレッドへ移す可能性があるためです。`Close()` は何度呼んでも安全で、ファイナライザによる解放も予備として用意されていますが、明示的に `defer` するのが想定された使い方です。

インスタンスはネイティブ側の可変状態を保持しており、並行呼び出しには安全ではありません。ゴルーチンごとに 1 インスタンスを使うか、アクセスを直列化してください。別々のインスタンスは並行に動作でき、作成コストも小さいものです。

::: tip 埋め込み辞書
パッケージの init 時に、埋め込まれた辞書はコンテンツアドレス方式のキャッシュディレクトリへ書き出され、`SUZUME_DATA_DIR` 経由でコアに渡されます。プログラム開始前に自分で `SUZUME_DATA_DIR` を設定していればそちらが優先され、埋め込み辞書は使われません。
:::

## 解析モード

`NewWithExtendedOptions()` を使うと、分割モード・原形化・複合語結合まで含めて制御できます。`ExtendedOptions` のゼロ値はライブラリの既定値と一致しない（原形化と大文字小文字・ヴの保持が無効になってしまう）ため、`DefaultExtendedOptions()` を起点にしてください。

```go
opts := suzume.DefaultExtendedOptions()
opts.Mode = suzume.ModeSearch // 検索向けに分割し、名詞複合語を結合
opts.MergeCompounds = true

s, err := suzume.NewWithExtendedOptions(opts)
if err != nil {
	log.Fatal(err)
}
defer s.Close()
```

指定できるモードは `ModeNormal`（既定）、`ModeSearch`、`ModeSplit` です。各モードが分割に与える影響は [解析モード](/ja/docs/api) を参照してください。

`ExtendedOptions` のフィールドと既定値は次のとおりです。

| フィールド | 型 | 既定値 | 説明 |
|-----------|-----|-------|------|
| `PreserveVu` | `bool` | `true` | ヴの異体表記を保持 |
| `PreserveCase` | `bool` | `true` | ASCII 英字の大文字・小文字を保持 |
| `PreserveSymbols` | `bool` | `false` | 句読点系の `SYMBOL` トークンを保持 |
| `Mode` | `AnalysisMode` | `ModeNormal` | `ModeNormal`、`ModeSearch`、`ModeSplit` のいずれかを選択 |
| `Lemmatize` | `bool` | `true` | 原形補正を適用 |
| `MergeCompounds` | `bool` | `false` | 連続する名詞複合語を結合 |
| `SkipUserDictionary` | `bool` | `false` | 同梱ユーザー辞書の自動読み込みを省略 |
| `SkipCoreDictionary` | `bool` | `false` | 同梱コア辞書の自動読み込みを省略 |
| `ReportScorerConfig` | `bool` | `false` | スコアラー設定の診断を `DictionaryWarnings()` に追加 |
| `SkipEnvConfig` | `bool` | `false` | スコアラー設定用の環境変数を無視 |
| `ScorerOptionsJSON` | `string` | 空文字列 | 環境設定の後に適用する JSON スコアラー上書き |
| `DataDirectory` | `string` | 空文字列 | このディレクトリだけから辞書を読み込み |

`ScorerOptionsJSON` には有効な JSON を指定してください。無効な値を指定すると `NewWithExtendedOptions()` は `ErrorCodeParse` を持つ `*suzume.Error` を返します。`SkipEnvConfig` は環境設定を無効にしますが、`ScorerOptionsJSON` は無効にしません。空でない `DataDirectory` は `SUZUME_DATA_DIR` とパッケージ内蔵辞書の自動展開より優先され、コア辞書と同梱ユーザー辞書はそのディレクトリだけから探します。`DataDirectory` が空なら、`SUZUME_DATA_DIR` があらかじめ設定されていない場合に限り、パッケージが内蔵辞書をキャッシュディレクトリに展開します。

`Mode()` は現在のモードを返します。`SetMode()` は辞書を読み直さずにモードを変更します。クローズ済みのインスタンスでは通常の Go エラー、無効なモードでは `ErrorCodeInvalidInput` を持つ `*suzume.Error` を返します。`Close()` の後の `Mode()` は `ModeInvalid` を返します。

```go
s, err := suzume.New()
if err != nil {
	log.Fatal(err)
}
defer s.Close()

if err := s.SetMode(suzume.ModeSplit); err != nil {
	log.Fatal(err)
}
fmt.Println(s.Mode())
```

正規化だけを調整したい場合は `NewWithOptions(Options)` が使えます。`PreserveVu`、`PreserveCase`、`PreserveSymbols` の 3 つのトグルだけを受け取り、モードと原形化はライブラリの既定値のままにします。`PreserveSymbols` が制御するのは句読点などの `SYMBOL` トークンで、内容を持つ記号と絵文字は設定にかかわらず `OTHER` として残ります。

## 正規化後テキストとオフセット

`AnalyzeWithNormalizedText()` は、`NormalizedText` と、そこを参照する `Start`／`End` オフセットを持つ `Morpheme` のスライスをまとめた `AnalysisResult` を返します。オフセットは Unicode コードポイント単位なので、正規化後文字列を `[]rune` に変換してから切り出してください。このメソッドにエラー戻り値はなく、クローズ済みインスタンスやネイティブ解析の失敗では `Analyze()` と同じ曖昧さを持つゼロ値の `AnalysisResult` が返ります。

```go
result := s.AnalyzeWithNormalizedText("ＡＢＣを検索")
runes := []rune(result.NormalizedText)
for _, m := range result.Morphemes {
	fmt.Println(string(runes[m.Start:m.End]))
}
```

## Morpheme のフィールド {#morpheme-fields}

`Analyze()` は `Morpheme` 構造体のスライスを返します。

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `Surface` | `string` | テキスト中に現れる表層形 |
| `POS` | `string` | 英語の品詞（大文字、例: `NOUN`） |
| `BaseForm` | `string` | 辞書形・原形 |
| `POSJa` | `string` | 日本語の品詞（例: 名詞） |
| `ConjType` | `string` | 活用型。`IsConjugatable` が true でも空文字列の場合あり |
| `ConjForm` | `string` | 活用形。`IsConjugatable` が true の場合に意味を持つ |
| `ExtendedPOS` | `string` | 安定した拡張品詞コード（例: `VERB_連用`） |
| `Start` | `int` | 正規化後テキストにおける開始 Unicode コードポイントオフセット |
| `End` | `int` | 正規化後テキストにおける終了 Unicode コードポイントオフセット |
| `IsUserDict` | `bool` | ユーザー辞書にマッチした場合 true |
| `IsFormalNoun` | `bool` | こと・もの などの形式名詞で true |
| `IsLowInfo` | `bool` | タグ生成向けに低情報量と判定された場合 true |
| `IsUnknown` | `bool` | 未知語候補として生成された場合 true |
| `IsFromDictionary` | `bool` | いずれかの辞書にマッチした場合 true |
| `IsConjugatable` | `bool` | 活用フィールドが意味を持つ場合 true |
| `Score` | `float32` | 解析器が用いる候補スコア・コスト |

`IsConjugatable` は動詞・形容詞だけでなく助動詞でも true になります。活用可能な形態素でも、該当する活用型がなければ `ConjType` は空文字列です。

`POS` と `ExtendedPOS` の全一覧は [API リファレンス](/ja/docs/api) を参照してください。

## タグ生成

`GenerateTags()` はテキストからキーワードタグを抽出します。既定では内容語（名詞、動詞、形容詞、副詞）を残し、助詞、助動詞、形式名詞、低情報量の語を除外します。

```go
for _, t := range s.GenerateTags("東京都の天気予報を確認する") {
	fmt.Printf("%s (%s)\n", t.Tag, t.POS)
}
```

結果はそれぞれ `Tag` 構造体で、`Tag`（キーワードのテキスト）と `POS`（その品詞）の 2 フィールドを持ちます。

`GenerateTagsWithOptions()` は `TagOptions` 構造体を受け取ります。`TagOptions` のゼロ値はすべての除外フィルターが無効になり、ライブラリの既定値と一致しないため、`DefaultTagOptions()` を起点にしてください。`POSFilter` フィールドは `POSNoun`、`POSVerb`、`POSAdjective`、`POSAdverb`、`POSParticle`、`POSAuxiliary` 定数を組み合わせるビットマスクです。名詞ビットには代名詞も含まれ、`0` はすべてのフィルター対象品詞を選びます。その他の品詞は常に除外され、代名詞も `ExcludeLowInfo` で除外される場合があります。

```go
opts := suzume.DefaultTagOptions()
opts.POSFilter = suzume.POSNoun | suzume.POSVerb // 名詞と動詞のみ
opts.MaxTags = 10                                // 出現順の先頭 10 件のタグのみ残す

tags := s.GenerateTagsWithOptions("美味しいラーメンを食べた", opts)
```

残りの `TagOptions` フィールドとライブラリの既定値は次のとおりです。

| フィールド | 型 | 既定値 | 説明 |
|-----------|-----|-------|------|
| `POSFilter` | `uint8` | `0` | 対象とする品詞のビットマスク。`0` はすべてのフィルター対象品詞を選び、`POSNoun` には代名詞も含む |
| `ExcludeBasic` | `bool` | `false` | 原形がひらがなのみの語を除外 |
| `UseLemma` | `bool` | `true` | 表層形ではなく原形（辞書形）を使う |
| `MinLength` | `int` | `2` | タグの最小文字数 |
| `MaxTags` | `int` | `0` | タグの最大件数（`0` = 無制限） |
| `ExcludeParticles` | `bool` | `true` | 助詞を除外 |
| `ExcludeAuxiliaries` | `bool` | `true` | 助動詞を除外 |
| `ExcludeFormalNouns` | `bool` | `true` | こと・もの などの形式名詞を除外 |
| `ExcludeLowInfo` | `bool` | `true` | 低情報量の語を除外（代名詞も対象） |
| `RemoveDuplicates` | `bool` | `true` | 重複するタグを除去 |

## ユーザー辞書

`LoadUserDictionary()` で、現行の TSV 形式からカスタム語を実行時に追加できます。従来の 3 列 CSV も受け付けます。

```go
source := []byte("東京公園\tNOUN\n点検する\tVERB\tSURU\n")
if err := s.LoadUserDictionary(source); err != nil {
	log.Fatal(err)
}

for _, m := range s.Analyze("東京公園を点検する") {
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

どちらのメソッドも、読み込みに失敗すると非 nil の `error` を返します。`DictionaryWarnings()` は、インスタンス作成時の自動読み込みと、その後のソース／バイナリ辞書読み込みで発生した警告を返します（ない場合は `nil`）。一部の行だけを受理したソース辞書は、エラーを返さずに警告を追加する場合があります。

```go
for _, w := range s.DictionaryWarnings() {
	fmt.Println("警告:", w)
}
```

`LoadUserDictionaryCount()` は、活用形を展開した後に登録されたエントリ数を返します。入力が空、または有効なエントリを含まない場合は、件数 0 とエラーを返します。

```go
installed, err := s.LoadUserDictionaryCount([]byte("点検する\tVERB\tSURU\n"))
if err != nil {
	log.Fatal(err)
}
fmt.Println("登録数:", installed)
```

`ClearUserDictionaries()` は呼び出し側が読み込んだ辞書を削除し、同梱ユーザー辞書を残します。クローズ済みのインスタンスではエラーを返します。`HasCoreDictionary()` は同梱コア辞書が読み込まれているかを返します。`Close()` の後、`SkipCoreDictionary` を指定した場合、または辞書が見つからない場合は `false` です。コア辞書がない場合は `DictionaryWarnings()` で通知されますが、解析器は動作します。

## エラー

ネイティブ API を呼び出すコンストラクターとエラーを返すメソッドは、ネイティブ側の失敗を `*suzume.Error` として保持します。`Code` は安定した `ErrorCode` の値で、`Message` に診断内容が入ります。クローズ済みハンドルや空入力のチェックは通常の Go エラーを返します。メッセージを解析せず、`errors.As` でネイティブエラーを調べてください。返された型付きエラーにはネイティブ診断が保持されるため、OS スレッドに紐づく `LastError()` の注意点は適用されません。

```go
package main

import (
	"errors"
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

	var nativeErr *suzume.Error
	if err := s.LoadBinaryDictionary([]byte("not a valid dictionary")); err != nil {
		if errors.As(err, &nativeErr) {
			fmt.Println(nativeErr.Code, nativeErr.Message)
		} else {
			log.Fatal(err)
		}
	}
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
| `LastError() string` | 現在の OS スレッドのネイティブ診断。Go から後で失敗原因を確認する用途には不確実 |
| `LastErrorCode() ErrorCode` | 現在の OS スレッドの診断コード。スレッドに関する制約は `LastError()` と同じ |

`*Suzume` のメソッド:

| メソッド | 説明 |
|---------|------|
| `Analyze(text string) []Morpheme` | テキストを解析（[Morpheme のフィールド](#morpheme-fields)を参照） |
| `AnalyzeWithNormalizedText(text string) AnalysisResult` | 正規化後テキストとコードポイントオフセットを返しながら解析 |
| `GenerateTags(text string) []Tag` | 既定フィルターでキーワード `Tag` を抽出 |
| `GenerateTagsWithOptions(text string, opts TagOptions) []Tag` | フィルターや件数制限を指定して `Tag` を抽出 |
| `Mode() AnalysisMode` | 現在のモードを返す。`Close()` 後は `ModeInvalid` |
| `SetMode(mode AnalysisMode) error` | 辞書を読み直さずにモードを変更 |
| `LoadUserDictionary(data []byte) error` | TSV または従来 CSV のユーザー辞書を読み込む |
| `LoadUserDictionaryCount(data []byte) (int, error)` | ソース辞書を読み込み、展開後の登録エントリ数を返す |
| `LoadBinaryDictionary(data []byte) error` | バイナリ `.dic` 辞書を読み込む |
| `ClearUserDictionaries() error` | 呼び出し側の辞書を削除し、同梱ユーザー辞書を残す |
| `HasCoreDictionary() bool` | コア辞書が読み込まれているかを返す |
| `DictionaryWarnings() []string` | 作成時と実行時の辞書読み込み警告 |
| `Close()` | ネイティブハンドルを解放（何度呼んでも安全） |

## 関連ページ

- [API リファレンス](/ja/docs/api) — 品詞と `ExtendedPOS` の値一覧、および共通の Morpheme の概念。
- [はじめに](/ja/docs/getting-started) — すべてのバインディングに共通する Suzume の入門。
- [go-suzume（GitHub）](https://github.com/libraz/go-suzume) と [pkg.go.dev リファレンス](https://pkg.go.dev/github.com/libraz/go-suzume)。
