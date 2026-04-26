# ネイティブビルド & CLI

Suzumeはネイティブ C++ ライブラリおよび CLI ツールとしてビルドでき、ブラウザ/Node.js 環境外でも使用できます。

## ソースからのビルド

### 必要環境

- C++17 対応コンパイラ（GCC 8+、Clang 10+、MSVC 2019+）
- CMake 3.15+

### ビルド手順

```bash
git clone https://github.com/libraz/suzume.git
cd suzume

# 設定
cmake -B build -DCMAKE_BUILD_TYPE=Release

# ビルド
cmake --build build --parallel

# CLI バイナリは build/bin/suzume-cli に生成されます
```

### ビルドオプション

| オプション | デフォルト | 説明 |
|--------|---------|-------------|
| `BUILD_TESTING` | `ON` | テストスイートをビルド |
| `BUILD_WASM` | `OFF` | WebAssembly 向けにビルド（Emscripten が必要） |
| `ENABLE_DEBUG_INFO` | `ON`（ネイティブ） | 候補のデバッグ元情報を有効化 |
| `ENABLE_DEBUG_LOG` | `ON`（ネイティブ） | デバッグログを有効化 |

```bash
# 例: テストなしのリリースビルド
cmake -B build -DCMAKE_BUILD_TYPE=Release -DBUILD_TESTING=OFF
cmake --build build --parallel
```

## CLI 概要

`suzume-cli` は3つの主要コマンドを提供します：

```
suzume-cli [command] [options] [arguments]

コマンド:
  analyze     形態素解析（デフォルト）
  dict        辞書管理
  test        検証・テスト
  version     バージョン情報の表示
  help        ヘルプの表示
```

## analyze

日本語テキストをトークナイズします。デフォルトコマンドなので `analyze` は省略可能です。

```bash
# 基本的な使い方
suzume-cli "東京スカイツリーに行きました"

# コマンドを明示
suzume-cli analyze "東京スカイツリーに行きました"

# 標準入力から読み込み
echo "東京スカイツリーに行きました" | suzume-cli
```

### 出力フォーマット

```bash
# デフォルト: 表層形 TAB 品詞 TAB 原形
suzume-cli "食べている"
# 食べ    VERB    食べる
# て      AUX     てる
# いる    AUX     いる

# JSON
suzume-cli -f json "食べている"

# タグのみ
suzume-cli -f tags "東京スカイツリーに行きました"
# 東京
# スカイツリー
# 行く

# TSV（全フィールド: 表層形, 品詞, 原形, 開始位置, 終了位置）
suzume-cli -f tsv "食べている"

# ChaSen 風フォーマット（日本語品詞、活用情報）
suzume-cli -f chasen "食べている"
```

### 解析モード

```bash
# 通常モード（デフォルト）
suzume-cli -m normal "東京都新宿区"

# 検索モード（名詞複合語を保持）
suzume-cli -m search "東京都新宿区"

# 分割モード（細粒度の分割）
suzume-cli -m split "東京都新宿区"
```

### オプション

| オプション | 説明 |
|--------|-------------|
| `-f, --format FMT` | 出力フォーマット: `morpheme`, `tags`, `json`, `tsv`, `chasen` |
| `-m, --mode MODE` | 解析モード: `normal`, `search`, `split` |
| `-d, --dict PATH` | ユーザー辞書を読み込み（複数指定可） |
| `-V, --verbose` | 詳細出力 |
| `-VV, --very-verbose` | より詳細な出力（ラティスダンプを含む） |
| `--debug` | ラティス候補とスコアを表示 |
| `--compare` | ユーザー辞書あり/なしの比較 |
| `--normalize-vu` | ヴ をビ等に正規化（デフォルト: 保持） |
| `--lowercase` | ASCII を小文字に変換（デフォルト: 保持） |
| `--preserve-symbols` | 記号・絵文字を出力に保持（デフォルト: 除去） |
| `--no-user-dict` | ユーザー辞書を無効化 |
| `--no-core-dict` | コア辞書を無効化 |

### 使用例

```bash
# ユーザー辞書を指定
suzume-cli -d user.dic "ChatGPTを使う"

# ユーザー辞書あり/なしの比較
suzume-cli --compare -d user.dic "ChatGPTを使う"

# ヴの正規化
suzume-cli --normalize-vu "ヴァイオリン"
# バイオリン    NOUN    バイオリン
```

## dict

辞書管理：辞書の作成、編集、コンパイル、検証を行います。

### サブコマンド

```bash
# 新しい辞書ファイルを作成
suzume-cli dict new user.tsv

# TSV をバイナリ（.dic）にコンパイル
suzume-cli dict compile user.tsv           # → user.dic
suzume-cli dict compile user.tsv out.dic   # 出力先を指定

# バイナリを TSV に逆コンパイル
suzume-cli dict decompile user.dic         # → user.tsv

# 辞書を検証
suzume-cli dict validate user.tsv

# 辞書情報を表示
suzume-cli dict info user.tsv

# 全辞書レイヤーで単語を検索
suzume-cli dict lookup すぎる

# パターンでエントリを検索
suzume-cli dict search user.tsv "パターン"
```

### インタラクティブモード

辞書編集用のインタラクティブ REPL を起動します：

```bash
suzume-cli dict -i user.tsv
```

インタラクティブコマンド:

| コマンド | 説明 |
|---------|-------------|
| `add <surface> <pos>` | エントリを追加 |
| `remove <surface> [pos]` | エントリを削除 |
| `list [--pos=POS] [--limit=N]` | エントリを一覧表示 |
| `search <pattern>` | エントリを検索 |
| `find <surface>` | 全レイヤーで検索 |
| `analyze <text>` | 現在の辞書でテキストを解析 |
| `validate` | 辞書を検証 |
| `compile` | バイナリにコンパイル |
| `save` | 変更を保存 |
| `stats` | 統計情報を表示 |
| `quit` | 終了 |

### 辞書レイヤー

Suzume は階層型辞書システムを採用しています：

| レイヤー | ソース | 説明 |
|---------|--------|-------------|
| レイヤー 1 | ハードコード | 助詞、助動詞（バイナリに組み込み） |
| レイヤー 2 | `core.dic` | コア語彙 |
| レイヤー 3 | `user.dic` | ユーザー/ドメイン固有の単語 |

### TSV フォーマット

辞書ソースファイルは TSV フォーマットを使用します：

```tsv
surface	pos	conj_type
東京	NOUN
食べる	VERB	ICHIDAN
```

`conj_type` 列は動詞・形容詞のみ必要です。

**品詞（POS）:** `NOUN`, `PROPN`, `VERB`, `ADJECTIVE`, `ADVERB`, `PARTICLE`, `AUXILIARY`, `SYMBOL`, `OTHER`

**活用型（VERB/ADJECTIVE 用）:** `ICHIDAN`, `GODAN_KA`, `GODAN_GA`, `GODAN_SA`, `GODAN_TA`, `GODAN_NA`, `GODAN_BA`, `GODAN_MA`, `GODAN_RA`, `GODAN_WA`, `SURU`, `KURU`, `I_ADJ`, `NA_ADJ`

## test

検証テストとベンチマークを実行します。

```bash
# 単一入力のテスト
suzume-cli test "テスト文" --expect "テスト,文"

# ファイルからテストを実行
suzume-cli test -f tests.tsv

# ユーザー辞書を指定してテスト
suzume-cli test -f tests.tsv -d user.dic

# ベンチマーク
suzume-cli test benchmark --iterations=1000
```

### テストファイルフォーマット

入力と期待されるタグの TSV：

```tsv
東京スカイツリーに行きました	東京,スカイツリー,行く
美しい花が咲いている	美しい,花,咲く
```

## 辞書のビルド

辞書をビルドまたは再ビルドする方法：

```bash
# まず CLI をビルド
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --parallel

# 辞書をビルド（TSV → .dic にコンパイル）
cmake --build build --target build-dict

# 辞書を検証
cmake --build build --target validate-dict
```

## WASM 向けビルド

WebAssembly バージョンのビルド方法：

```bash
# Emscripten SDK が必要
source /path/to/emsdk/emsdk_env.sh

# WASM 向けに設定
emcmake cmake -B build-wasm -DBUILD_WASM=ON -DCMAKE_BUILD_TYPE=Release

# 先にネイティブビルドで辞書をビルド
cmake --build build --target build-dict

# WASM をビルド
cmake --build build-wasm --parallel

# 出力: dist/suzume.js, dist/suzume-wasm.wasm
```
