# Python CLI

Python ホイールをインストールすると、解析とタグ抽出を行う `suzume` コマンドが追加されます。Python API と同じ同梱ネイティブライブラリおよび辞書を使います。

## インストール

```bash
pip install suzume
```

コマンドの対応環境は Python パッケージと同じです。Linux x86_64（`manylinux2014` / `manylinux_2_17`）と、macOS 11 以降の macOS arm64 で使えます。詳しい互換性一覧は [Python バインディング](/ja/docs/python) を参照してください。

## 入力

引数でテキストを渡すか、UTF-8 テキストを標準入力に流します。

```bash
suzume "東京へ行く"
printf 'りんごを食べる\n' | suzume
```

`analyze` は省略可能な別名です。次の 2 つのコマンドは同じ動作です。

```bash
suzume --mode search "東京の公園"
suzume analyze --mode search "東京の公園"
```

ハイフンで始まる入力の前には `--` を置いてください。

## 出力フォーマット

`-f` または `--format` でフォーマットを選びます。

| フォーマット | 出力 |
|-------------|------|
| `morpheme` | 既定。`表層形` TAB `品詞` TAB `原形` TAB `開始位置` TAB `終了位置` |
| `tsv` | `morpheme` と同じフィールド |
| `tags` | 1 行につき `タグ` TAB `品詞` |
| `json` | `input`、`normalized_text`、`morphemes` を持つオブジェクト |
| `chasen` | ChaSen 風フィールド。末尾に `EOS` を出力 |

```bash
suzume --format json "ＡＢＣを検索"
suzume --format chasen "食べている"
suzume --format tags "東京の公園に行く"
```

1 行形式の TAB 出力に含まれるバックスラッシュ、タブ、改行はエスケープされます。

## 解析オプション

| オプション | 説明 |
|-----------|------|
| `-m, --mode MODE` | `normal`、`search`、`split` の分割モードを使用 |
| `--normalize-vu` | ヴの異体表記を保持せず正規化 |
| `--lowercase` | ASCII 英字を小文字に正規化 |
| `--preserve-symbols` | 句読点などの `SYMBOL` を保持。内容を持つ記号と絵文字は設定にかかわらず `OTHER` として保持 |
| `--no-lemmatize` | 解析後の原形補正を無効化 |
| `--merge-compounds` | 連続する名詞複合語を結合 |
| `--skip-env-config` | スコアラー設定用の環境変数を無視 |

```bash
suzume --mode split --lowercase "ABCと東京都"
suzume --normalize-vu --preserve-symbols "ヴァイオリン、ビオラ"
```

通貨・単位記号、矢印、技術記号、絵文字は、既定でも `OTHER` として残ります。`--preserve-symbols` を指定すると、`、` や `。` など句読点系のトークンも加わります。

現在のオプション一覧は `suzume --help`、インストール済みネイティブライブラリのバージョンは `suzume --version` で確認できます。

## 辞書

`-d` または `--dict` で UTF-8 テキスト辞書やコンパイル済み `.dic` ファイルを読み込みます。このオプションは複数回指定できます。

```bash
suzume --dict terms.tsv --dict names.dic "東京スカイツリーへ行く"
```

| オプション | 説明 |
|-----------|------|
| `-d, --dict PATH` | テキスト辞書またはコンパイル済み `.dic` 辞書を読み込み。複数指定可 |
| `--no-core-dict` | 同梱コア辞書を読み込まない |
| `--no-user-dict` | 同梱ユーザー辞書を読み込まない |

解析器の作成時に発生した警告は標準エラー出力へ書き込まれます。`--dict` で指定した辞書の読み込み時に発生した警告は、現在の CLI では出力されません。

## タグ出力

キーワードタグを生成するには `--format tags` を選びます。

```bash
suzume --format tags --tag-max-tags 5 "東京都の天気予報を確認する"
```

| オプション | 既定値 | 説明 |
|-----------|--------|------|
| `--tag-pos POS` | すべて | 1 つの品詞を残す。複数指定可 |
| `--tag-exclude-basic` | 無効 | 原形がひらがなのみのタグを除外 |
| `--tag-use-surface` | 無効 | 原形ではなく表層形を使用 |
| `--tag-min-length N` | `2` | タグの最小文字数を指定 |
| `--tag-max-tags N` | `0` | タグ件数を制限（`0` は無制限） |
| `--include-particles` | 無効 | 助詞を含める |
| `--include-auxiliaries` | 無効 | 助動詞を含める |
| `--include-formal-nouns` | 無効 | 形式名詞を含める |
| `--include-low-info` | 無効 | 低情報量の語を含める |
| `--tag-keep-duplicates` | 無効 | 重複タグを残す |

`--tag-pos` に指定できるのは `noun`、`verb`、`adjective`、`adverb` だけです。助詞や助動詞を含める場合は `--tag-pos` を省略し、`--include-particles` または `--include-auxiliaries` を使ってください。

```bash
suzume --format tags \
  --tag-pos noun \
  --tag-pos verb \
  --tag-min-length 1 \
  "本を読む"
```

## JSON とオフセット

形態素の `start` と `end` は正規化後テキスト上の文字オフセットであり、元の入力上の位置とは限りません。JSON 出力には、その正規化後テキストが `normalized_text` として含まれます。

```bash
suzume --lowercase --format json "ABCを検索"
```

正規化によって入力が変わる可能性があり、後続処理でオフセットを使って文字列を切り出す場合は JSON を使ってください。

## 対象範囲

Python の `suzume` コマンドが扱うのは解析とタグ抽出です。辞書のコンパイルや検証、ネイティブのテストやベンチマークは実行できません。

これらの開発者向け処理には、別途ビルドする `suzume-cli` を使います。[ネイティブ CLI リファレンス](/ja/docs/cli) と [ネイティブビルド](/ja/docs/native-build) を参照してください。

## 関連ページ

- [Python バインディング](/ja/docs/python) — Python API と配布環境の詳細。
- [インストール](/ja/docs/installation) — 利用できるすべてのパッケージとネイティブビルド。
