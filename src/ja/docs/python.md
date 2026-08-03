# Python バインディング

[`suzume`](https://pypi.org/project/suzume/) パッケージは、Suzume のネイティブライブラリを呼び出す ctypes バインディングです。ホイールには共有ライブラリと同梱辞書が含まれます。

## 動作要件とインストール

Python 3.10 以上が必要です。PyPI では次の環境向けにバイナリホイールを公開しています。

- Linux x86_64（`manylinux2014` / `manylinux_2_17`）
- macOS arm64、macOS 11 以降

Windows、macOS x86_64、Linux arm64、その他のプラットフォームやアーキテクチャには対応していません。ソースディストリビューションも公開していないため、互換性のあるホイールがない環境では `pip install` できません。

::: code-group

```bash [pip]
pip install suzume
```

```bash [poetry]
poetry add suzume
```

```bash [uv]
uv add suzume
```

:::

ホイールをインストールすると `suzume` コマンドも使えるようになります。詳しくは [Python CLI](/ja/docs/python-cli) を参照してください。開発者向けのネイティブコマンド `suzume-cli` とは別のものです。

## クイックスタート

コンテキストマネージャーを使うと、終了時に `Suzume` のネイティブハンドルが解放されます。

```python
from suzume import Suzume

with Suzume() as analyzer:
    for morpheme in analyzer.analyze("東京都に住んでいます"):
        print(morpheme.surface, morpheme.pos, morpheme.base_form)
```

コンテキストマネージャーを使わない場合は、最後に `close()` を呼び出してください。`close()` は複数回呼び出しても安全です。

同じ `Suzume` インスタンスへの呼び出しは直列化されるため、複数の Python スレッドから安全に共有できます。ネイティブ解析を並列実行する場合は、ワーカーごとに別のインスタンスを作成してください。

## コンストラクタオプション

コンストラクタの引数はすべてキーワード専用です。

| オプション | 型 | 既定値 | 説明 |
|-----------|----|--------|------|
| `mode` | `Mode \| str` | `Mode.NORMAL` | 分割モード: `normal`、`search`、`split` |
| `preserve_vu` | `bool` | `True` | ヴの異体表記を保持 |
| `preserve_case` | `bool` | `True` | ASCII 英字の大文字・小文字を保持 |
| `preserve_symbols` | `bool` | `False` | 句読点などの `SYMBOL` を保持。内容を持つ記号と絵文字は設定にかかわらず `OTHER` として保持 |
| `lemmatize` | `bool` | `True` | 解析後に原形を補正 |
| `merge_compounds` | `bool` | `False` | 連続する名詞複合語を結合 |
| `skip_user_dictionary` | `bool` | `False` | 同梱ユーザー辞書を読み込まない |
| `skip_core_dictionary` | `bool` | `False` | 同梱コア辞書を読み込まない |
| `skip_env_config` | `bool` | `False` | スコアラー設定用の環境変数を無視 |
| `report_scorer_config` | `bool` | `False` | スコアラー設定の診断を `dictionary_warnings` に追加 |
| `scorer_options` | `str \| dict \| None` | `None` | JSON 文字列またはマッピングで指定するスコアラーの上書き設定 |

通貨・単位記号、矢印、技術記号、絵文字は、既定でも `OTHER` として残ります。`preserve_symbols` が制御するのは、`。` など句読点系の `SYMBOL` トークンです。

```python
from suzume import Mode, Suzume

with Suzume(
    mode=Mode.SEARCH,
    merge_compounds=True,
    skip_env_config=True,
    scorer_options={"unary": {"noun_prior": 0.25}},
) as analyzer:
    morphemes = analyzer.analyze("東京スカイツリーの展望台")
```

`mode` は後から変更できます。変更しても辞書は再読み込みされません。

```python
with Suzume() as analyzer:
    analyzer.mode = "split"
    assert analyzer.mode is Mode.SPLIT
```

各モードの分割動作は [解析モード](/ja/docs/api) を参照してください。

## 解析と正規化後テキスト

`analyze()` は `list[Morpheme]` を返します。各形態素の `start` と `end` は正規化後テキスト上の文字オフセットで、入力テキスト上の位置とは異なる場合があります。

オフセットが参照する文字列も必要な場合は `analyze_with_normalized_text()` を使います。

```python
with Suzume(preserve_case=False) as analyzer:
    result = analyzer.analyze_with_normalized_text("ABCを検索")
    print(result.normalized_text)
    print(result.morphemes)
```

戻り値は frozen dataclass の `AnalysisResult` で、`normalized_text: str` と `morphemes: list[Morpheme]` を持ちます。

## Morpheme のフィールド

`Morpheme` は frozen dataclass です。

| フィールド | 型 | 説明 |
|-----------|----|------|
| `surface` | `str` | 正規化後テキスト中の表層形 |
| `pos` | `str` | 英語の品詞。例: `NOUN` |
| `base_form` | `str` | 辞書形・原形 |
| `pos_ja` | `str` | 日本語の品詞 |
| `conj_type` | `str \| None` | 活用型。活用しない語では `None` |
| `conj_form` | `str \| None` | 活用形。活用しない語では `None` |
| `extended_pos` | `str` | 安定した拡張品詞コード |
| `start` | `int` | 正規化後テキストにおける開始文字オフセット |
| `end` | `int` | 正規化後テキストにおける終了文字オフセット |
| `is_user_dict` | `bool` | ユーザー辞書にマッチしたか |
| `is_formal_noun` | `bool` | こと・ものなどの形式名詞か |
| `is_low_info` | `bool` | 低情報量の語としてマークされているか |
| `is_unknown` | `bool` | 未知語候補か |
| `is_from_dictionary` | `bool` | いずれかの辞書にマッチしたか |
| `score` | `float` | 解析器が使った候補スコア |

`pos` と `extended_pos` の値は [API リファレンス](/ja/docs/api) を参照してください。

## タグ生成

`generate_tags()` は `list[Tag]` を返します。各 `Tag` は `tag` と `pos` のフィールドを持ちます。

```python
with Suzume() as analyzer:
    tags = analyzer.generate_tags(
        "東京都の天気予報を確認する",
        pos_filter=["noun", "verb"],
        max_tags=10,
    )
```

`pos_filter` には品詞名のイテラブルまたは整数ビットマスクを指定できます。

| 名前 | ビット |
|------|-------:|
| `noun` | `1` |
| `verb` | `2` |
| `adjective` | `4` |
| `adverb` | `8` |
| `particle` | `16` |
| `auxiliary` | `32` |

`0` または空のイテラブルはすべての品詞を選択します。ただし、助詞と助動詞は既定で除外されます。結果に含めるには、対応する除外オプションを `False` にしてください。

```python
with Suzume() as analyzer:
    particles = analyzer.generate_tags(
        "本を読む",
        pos_filter=["particle"],
        exclude_particles=False,
        min_length=1,
    )
```

その他のオプションは次のとおりです。

| オプション | 型 | 既定値 | 説明 |
|-----------|----|--------|------|
| `exclude_basic` | `bool` | `False` | 原形がひらがなのみの語を除外 |
| `use_lemma` | `bool` | `True` | 表層形ではなく原形を使用 |
| `min_length` | `int` | `2` | タグの最小文字数 |
| `max_tags` | `int` | `0` | 最大件数（`0` は無制限） |
| `exclude_particles` | `bool` | `True` | 助詞を除外 |
| `exclude_auxiliaries` | `bool` | `True` | 助動詞を除外 |
| `exclude_formal_nouns` | `bool` | `True` | 形式名詞を除外 |
| `exclude_low_info` | `bool` | `True` | 低情報量の語を除外 |
| `remove_duplicates` | `bool` | `True` | 重複タグを除去 |

## ユーザー辞書

`load_user_dict()` は現行の TSV または旧形式の CSV テキストを読み込みます。戻り値は、活用形を展開した後にインストールされたエントリ数です。

```python
from suzume import Suzume

dictionary = "食べ直す\tVERB\tGODAN_SA\n"

with Suzume() as analyzer:
    expanded_count = analyzer.load_user_dict(dictionary)
    print(expanded_count)
```

コンパイル済みの `.dic` 辞書は `load_binary_dict(bytes)` で読み込みます。`clear_user_dictionaries()` は呼び出し側が読み込んだ辞書を削除しますが、同梱ユーザー辞書は残します。

```python
from pathlib import Path
from suzume import Suzume

with Suzume() as analyzer:
    analyzer.load_binary_dict(Path("custom.dic").read_bytes())
    analyzer.clear_user_dictionaries()
```

`has_core_dictionary` は同梱コア辞書が読み込まれているかを返します。`dictionary_warnings` は辞書読み込み、解析、スコアラー設定の診断を返します。

## エラー

ネイティブ処理の失敗時は、`RuntimeError` のサブクラスである `SuzumeError` が送出されます。`code` 属性は安定した `ErrorCode` 値なので、メッセージを解析せずに処理を分岐できます。

```python
from suzume import ErrorCode, Suzume, SuzumeError

try:
    Suzume(scorer_options="{")
except SuzumeError as error:
    if error.code is ErrorCode.PARSE:
        print("スコアラー設定が不正です")
```

| `ErrorCode` | 値 |
|-------------|---:|
| `SUCCESS` | `0` |
| `INVALID_UTF8` | `1` |
| `DICTIONARY_LOAD_FAILED` | `2` |
| `FILE_NOT_FOUND` | `3` |
| `PARSE` | `4` |
| `OUT_OF_MEMORY` | `5` |
| `INVALID_INPUT` | `6` |
| `INTERNAL` | `7` |

## API 概要

| メンバー | 説明 |
|---------|------|
| `Suzume(*, ...)` | 解析器を作成 |
| `analyze(text)` | `list[Morpheme]` を返す |
| `analyze_with_normalized_text(text)` | `AnalysisResult` を返す |
| `generate_tags(text, *, ...)` | フィルター済みのキーワードタグを返す |
| `mode` | 解析モードを取得または変更 |
| `load_user_dict(text)` | TSV または CSV テキストを読み込み、展開後エントリ数を返す |
| `load_binary_dict(data)` | コンパイル済み辞書を読み込む |
| `clear_user_dictionaries()` | 呼び出し側が読み込んだ辞書を削除 |
| `dictionary_warnings` | 辞書とスコアラーの診断を返す |
| `has_core_dictionary` | コア辞書が読み込まれているかを返す |
| `close()` | ネイティブハンドルを解放 |
| `version()` | ネイティブライブラリのバージョンを返す |

## 関連ページ

- [Python CLI](/ja/docs/python-cli) — ホイールがインストールする `suzume` コマンド。
- [ネイティブ CLI リファレンス](/ja/docs/cli) — 別配布の開発者向け `suzume-cli`。
- [はじめに](/ja/docs/getting-started) — 全バインディング共通の入門。
