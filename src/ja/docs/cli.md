# CLI リファレンス

`suzume-cli` は Suzume トークナイザーのコマンドライン版です。JavaScript、Python、ネイティブ C/C++ の各インターフェースと同じ解析エンジンを使っているため、フラグもこれらの API のオプションに対応しています。

このページはコマンドの使い方を説明します。バイナリをソースからビルドする方法は [ネイティブビルド](/ja/docs/native-build) を参照してください。

## CLI 概要

`suzume-cli` には `analyze`、`dict`、`test` の3つのサブコマンドがあり、これに加えてユーティリティコマンドとして `version` と `help` を備えています。

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

日本語テキストをトークナイズします。デフォルトコマンドなので `analyze` は省略できます。

```bash
# 基本的な使い方
suzume-cli "東京スカイツリーに行きました"

# コマンドを明示
suzume-cli analyze "東京スカイツリーに行きました"

# 標準入力から読み込み
echo "東京スカイツリーに行きました" | suzume-cli
```

### 出力フォーマット

`-f, --format` フラグで出力の形を選びます。

| フォーマット | 説明 |
|--------|-------------|
| `morpheme` | デフォルト。`表層形` TAB `品詞` TAB `原形` TAB `開始位置` TAB `終了位置` |
| `tags` | 内容語の `タグ` TAB `品詞` の組（[タグ抽出](#タグ抽出)を参照） |
| `json` | 解析・デバッグ用フィールドを含む構造化 JSON |
| `tsv` | `表層形` TAB `品詞` TAB `原形` TAB `開始位置` TAB `終了位置` |
| `chasen` | ChaSen 風フォーマット（日本語の品詞名と活用情報） |

```bash
# デフォルト: 表層形 TAB 品詞 TAB 原形 TAB 開始位置 TAB 終了位置
suzume-cli "食べている"
# 食べ    VERB        食べる    0    2
# て      PARTICLE    て        2    3
# いる    AUX         いる      3    5

# JSON
suzume-cli -f json "食べている"

# タグのみ
suzume-cli -f tags "東京スカイツリーに行きました"
# 東京            NOUN
# スカイツリー    NOUN
# 行く            VERB

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
| `--no-lemmatize` | 原形化を無効化（デフォルトは有効） |
| `--merge-compounds` | 連続する名詞複合語を結合（デフォルトは無効） |
| `--normalize-vu` | ヴ をビ等に正規化（デフォルト: 保持） |
| `--lowercase` | ASCII を小文字に変換（デフォルト: 保持） |
| `--preserve-symbols` | 記号・絵文字を出力に保持（デフォルト: 除去） |
| `--no-user-dict` | ユーザー辞書を無効化 |
| `--no-core-dict` | コア辞書を無効化 |
| `--compare` | ユーザー辞書あり/なしの比較 |
| `--debug` | ラティス候補とスコアを表示 |
| `-V, --verbose` | 詳細出力 |
| `-VV, --very-verbose` | より詳細な出力（ラティスダンプを含む） |

グローバルフラグとして `-v, --version` と `-h, --help` も使えます。

### タグ抽出

`-f tags` を指定すると、Suzume は内容語のタグを抽出し、情報量の少ないトークンをデフォルトで除きます。次のフラグでタグ集合に何を残すかを調整できます。

| オプション | デフォルト | 説明 |
|--------|---------|-------------|
| `--include-particles` | 無効 | 助詞をタグに残す |
| `--include-auxiliaries` | 無効 | 助動詞をタグに残す |
| `--include-formal-nouns` | 無効 | 形式名詞（こと、もの等）を残す |
| `--include-low-info` | 無効 | 情報量の少ないトークンを残す |
| `--tag-keep-duplicates` | 無効 | 重複を除去せずそのまま残す |
| `--tag-use-surface` | 無効 | 原形ではなく表層形を使う |
| `--tag-min-length LENGTH` | `2` | タグの最小文字数 |
| `--tag-max-tags MAX` | `0` | タグの最大数（`0` = 無制限） |

```bash
# 助詞と助動詞を残し、1文字のタグも許可
suzume-cli -f tags --include-particles --include-auxiliaries --tag-min-length 1 "本を読む"

# 表層形で上位5件のタグに絞る
suzume-cli -f tags --tag-use-surface --tag-max-tags 5 "東京スカイツリーに行きました"
```

### 使用例

```bash
# ユーザー辞書を指定
suzume-cli -d user.dic "ChatGPTを使う"

# ユーザー辞書あり/なしの比較
suzume-cli --compare -d user.dic "ChatGPTを使う"

# 名詞複合語を結合
suzume-cli --merge-compounds "東京都新宿区"

# 原形化なしで解析
suzume-cli --no-lemmatize "食べている"

# ヴの正規化
suzume-cli --normalize-vu "ヴァイオリン"
# バイオリン    NOUN    バイオリン    0    5
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

# 組み込み L1 とソース L2 辞書で単語を検索
suzume-cli dict lookup すぎる

# パターンでエントリを検索
suzume-cli dict search user.tsv "パターン"

# エントリを一覧表示（非インタラクティブ）
suzume-cli dict list user.tsv --pos=NOUN --pattern="東京*" --limit=20
```

### インタラクティブモード

辞書編集用のインタラクティブ REPL を起動します。

```bash
suzume-cli dict -i user.tsv
```

`suzume-cli dict interactive user.tsv` と `suzume-cli dict edit user.tsv` は同じ意味の長い形式のエイリアスです。

インタラクティブコマンド:

| コマンド | 説明 |
|---------|-------------|
| `add <surface> <pos>` | エントリを追加 |
| `remove <surface> [pos]` | エントリを削除 |
| `update <surface> <pos> [conj_type]` | 既存エントリを更新 |
| `list [--pos=POS] [--pattern=PATTERN] [--limit=N]` | エントリを一覧表示 |
| `search <pattern>` | エントリを検索 |
| `find <surface>` | 全レイヤーで検索 |
| `layer [N]` | 作業レイヤーを表示・変更（2 = `core.dic`、3 = `user.dic`） |
| `import <file.tsv> [--skip-duplicates]` | TSV ファイルからエントリをインポート |
| `analyze <text>` | 現在の辞書でテキストを解析 |
| `validate` | 辞書を検証 |
| `compile` | バイナリにコンパイル |
| `save` | 変更を保存 |
| `stats` | 統計情報を表示 |
| `quit` | 終了 |

### 辞書レイヤー

Suzume は階層型辞書システムを採用しています。

| レイヤー | ソース | 説明 |
|---------|--------|-------------|
| レイヤー 1 | ハードコード | 助詞、助動詞（バイナリに組み込み） |
| レイヤー 2 | `core.dic` | コア語彙 |
| レイヤー 3 | `user.dic` | ユーザー/ドメイン固有の単語 |

### TSV フォーマット

辞書ソースファイルは TSV フォーマットを使用します。

```tsv
surface	pos	conj_type
東京	NOUN
食べる	VERB	ICHIDAN
```

`conj_type` 列は動詞・形容詞のみ必要です。

**品詞（POS）:** `NOUN`, `PROPN`, `VERB`, `ADJECTIVE`, `ADVERB`, `PARTICLE`, `AUXILIARY`, `SYMBOL`, `OTHER`

この辞書ファイル用の品詞語彙は、解析 API が返す実行時の `Morpheme.pos` 値（`NOUN`, `VERB`, `ADJ`, `ADV`, ...）よりも意図的に細かく分かれています。

**活用型（VERB/ADJECTIVE 用）:** `ICHIDAN`, `GODAN_KA`, `GODAN_GA`, `GODAN_SA`, `GODAN_TA`, `GODAN_NA`, `GODAN_BA`, `GODAN_MA`, `GODAN_RA`, `GODAN_WA`, `SURU`, `KURU`, `I_ADJ`, `NA_ADJ`

## test

検証テストとベンチマークを実行します。

```bash
# 単一入力のテスト
suzume-cli test "テスト文" --expect "テスト"

# ファイルからテストを実行
suzume-cli test -f tests.tsv

# ユーザー辞書を指定してテスト
suzume-cli test -f tests.tsv -d user.dic

# 再現可能なベンチマーク（1回ウォームアップ後、5サンプルの中央値）
suzume-cli test benchmark --iterations=1000 --samples=5 --warmup=1
```

ベンチマークは初期化・初回解析・定常解析の中央値、定常スループット、テキストごとのレイテンシ、ピーク RSS を報告します。組み込みコーパスを置き換えるには `-f corpus.txt` を指定します。

### テストファイルフォーマット

入力と期待されるタグの TSV です。

```tsv
東京スカイツリーに行きました	東京,スカイツリー,行く
美しい花が咲いている	美しい,咲く
```

## 関連ページ

- [ネイティブビルド](/ja/docs/native-build) — `suzume-cli` バイナリと辞書をソースからビルドする方法
- [API リファレンス](/ja/docs/api) — これらのフラグが対応する JavaScript / WASM の API
