# Python バインディング

PyPI の [`suzume`](https://pypi.org/project/suzume/) パッケージは Suzume の Python バインディングです。Python スクリプト、データパイプライン、Web サービスから、JavaScript/WASM パッケージを介さずに同じ日本語形態素解析器を使えます。

このバインディングはネイティブ C++ コアを薄く包んだ [ctypes](https://docs.python.org/3/library/ctypes.html) レイヤーです。コンパイル済みライブラリと辞書はホイールに同梱されているため、追加でインストールするものはなく、外部辞書ファイルを同梱する必要もありません。

## 必要環境

- Python 3.10 以上

対応プラットフォーム向けのネイティブライブラリと辞書はホイールに含まれているため、C++ コンパイラやビルド手順は不要です。

## インストール

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

## クイックスタート

`Suzume()` で解析器を作成し、コンテキストマネージャーとして使うことでネイティブハンドルを自動的に解放し、解析された形態素を反復処理します。

```python
from suzume import Suzume

with Suzume() as sz:
    for m in sz.analyze("東京都に住んでいます"):
        print(m.surface, m.pos, m.base_form)
```

`analyze()` は毎回 `list[Morpheme]` を返します。解析器はネイティブハンドルを保持しておりスレッドセーフではないため、スレッドごとに 1 インスタンスを使ってください。`with` ブロックを使えない場合は、使い終わったら明示的に `close()` を呼び出します。

```python
sz = Suzume()
try:
    morphemes = sz.analyze("東京都に住んでいます")
finally:
    sz.close()
```

## 解析モード

コンストラクタに `mode` を渡すと、テキストの分割方法を制御できます。`Mode` 列挙型のメンバー、または同等の文字列を指定できます。

```python
from suzume import Suzume, Mode

with Suzume(mode=Mode.SEARCH, merge_compounds=True) as sz:
    morphemes = sz.analyze("東京スカイツリーの展望台")

# 文字列でも指定できます:
with Suzume(mode="split") as sz:
    ...
```

指定できるモードは `Mode.NORMAL`（`"normal"`）、`Mode.SEARCH`（`"search"`）、`Mode.SPLIT`（`"split"`）です。各モードが分割に与える影響は [解析モード](/ja/docs/api) を参照してください。

コンストラクタはキーワード専用引数です。`mode` に加えて、正規化・解析のフラグである `preserve_vu`（既定 `True`）、`preserve_case`（既定 `True`）、`preserve_symbols`（既定 `False`）、`lemmatize`（既定 `True`）、`merge_compounds`（既定 `False`）を受け取ります。

## Morpheme のフィールド

`analyze()` は `Morpheme` のリストを返します。これは snake_case のフィールドを持つ frozen dataclass です。

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `surface` | `str` | テキスト中に現れる表層形 |
| `pos` | `str` | 英語の品詞（大文字、例: `NOUN`） |
| `base_form` | `str` | 辞書形・原形 |
| `pos_ja` | `str` | 日本語の品詞（例: 名詞） |
| `conj_type` | `str \| None` | 活用型。活用しない語では `None` |
| `conj_form` | `str \| None` | 活用形。活用しない語では `None` |
| `extended_pos` | `str` | 安定した拡張品詞コード（例: `VERB_連用`） |
| `start` | `int` | 正規化後テキストにおける開始文字オフセット |
| `end` | `int` | 正規化後テキストにおける終了文字オフセット |
| `is_user_dict` | `bool` | ユーザー辞書にマッチした場合 True |
| `is_formal_noun` | `bool` | こと・もの などの形式名詞で True |
| `is_low_info` | `bool` | タグ生成向けに低情報量と判定された場合 True |
| `is_unknown` | `bool` | 未知語候補として生成された場合 True |
| `is_from_dictionary` | `bool` | いずれかの辞書にマッチした場合 True |
| `score` | `float` | 解析器が用いる候補スコア・コスト |

`pos` と `extended_pos` の全一覧は [API リファレンス](/ja/docs/api) を参照してください。

## タグ生成

`generate_tags()` はテキストからキーワードタグを抽出します。既定では内容語（名詞、動詞、形容詞、副詞）を残し、助詞、助動詞、形式名詞、低情報量の語を除外します。

```python
from suzume import Suzume

with Suzume() as sz:
    for tag in sz.generate_tags("東京都の天気予報を確認する"):
        print(tag.tag, tag.pos)
```

結果はそれぞれ `Tag` dataclass で、`tag`（キーワードのテキスト）と `pos`（その品詞）の 2 フィールドを持ちます。

`generate_tags()` はキーワード専用のオプションを取ります。`pos_filter` オプションは結果を特定の品詞に絞り込むもので、2 つの形式を受け付けます。品詞名のイテラブル、または `1=名詞`、`2=動詞`、`4=形容詞`、`8=副詞`、`0=すべて` を表す生のビットマスク int です。

```python
with Suzume() as sz:
    # 名前で指定:
    nouns = sz.generate_tags("美味しいラーメンを食べた", pos_filter=["noun"])

    # 同等のビットマスク（名詞と動詞）:
    tags = sz.generate_tags("美味しいラーメンを食べた", pos_filter=1 | 2)

    # 上位 10 件のタグのみ残す:
    top = sz.generate_tags("東京都の天気予報を確認する", max_tags=10)
```

残りのオプションと既定値は次のとおりです。

| オプション | 型 | 既定値 | 説明 |
|-----------|-----|-------|------|
| `pos_filter` | `int \| Iterable[str]` | `0` | 対象とする品詞カテゴリ（`0`・空 = すべて） |
| `exclude_basic` | `bool` | `False` | 原形がひらがなのみの語を除外 |
| `use_lemma` | `bool` | `True` | 表層形ではなく原形（辞書形）を使う |
| `min_length` | `int` | `2` | タグの最小文字数 |
| `max_tags` | `int` | `0` | タグの最大件数（`0` = 無制限） |
| `exclude_particles` | `bool` | `True` | 助詞を除外 |
| `exclude_auxiliaries` | `bool` | `True` | 助動詞を除外 |
| `exclude_formal_nouns` | `bool` | `True` | こと・もの などの形式名詞を除外 |
| `exclude_low_info` | `bool` | `True` | 低情報量の語を除外 |
| `remove_duplicates` | `bool` | `True` | 重複するタグを除去 |

## ユーザー辞書

`load_user_dict()` で、CSV テキストからカスタム語を実行時に追加できます。

```python
from suzume import Suzume, SuzumeError

with Suzume() as sz:
    try:
        sz.load_user_dict("ChatGPT,NOUN\n東京スカイツリー,NOUN")
    except SuzumeError as e:
        print("ユーザー辞書の読み込みに失敗:", e)

    for m in sz.analyze("ChatGPTを使う"):
        print(m.surface, m.pos, m.is_user_dict)
```

コンパイル済みのバイナリ `.dic` 辞書は、`load_binary_dict()` でメモリから読み込めます。

```python
from pathlib import Path
from suzume import Suzume, SuzumeError

data = Path("custom.dic").read_bytes()

with Suzume() as sz:
    try:
        sz.load_binary_dict(data)
    except SuzumeError as e:
        print("バイナリ辞書の読み込みに失敗:", e)
```

どちらのメソッドも、読み込みに失敗すると `SuzumeError`（`RuntimeError` のサブクラス）を送出します。`dictionary_warnings` プロパティは、構築時に辞書が自動読み込みされた際に発生した警告を返します。

```python
with Suzume() as sz:
    for warning in sz.dictionary_warnings:
        print("警告:", warning)
```

## API 概要

`Suzume` のインスタンスメソッドとプロパティ:

| メンバー | 説明 |
|---------|------|
| `Suzume(*, mode=..., preserve_vu=..., ...)` | 解析器を作成（キーワード専用オプション） |
| `analyze(text)` | `list[Morpheme]` を返す（[Morpheme のフィールド](#morpheme-のフィールド)を参照） |
| `generate_tags(text, *, pos_filter=..., ...)` | フィルターや件数制限付きでキーワード `Tag` を抽出 |
| `load_user_dict(csv)` | CSV ユーザー辞書を読み込む。失敗時は `SuzumeError` を送出 |
| `load_binary_dict(data)` | バイナリ `.dic` 辞書を読み込む。失敗時は `SuzumeError` を送出 |
| `dictionary_warnings` | 自動辞書読み込み時の警告 |
| `close()` | ネイティブハンドルを解放（冪等） |

このクラスはコンテキストマネージャープロトコルも実装しているため、`with Suzume() as sz:` は終了時に自動で `close()` を呼び出します。

モジュールレベルの関数:

| 関数 | 説明 |
|------|------|
| `suzume.version()` | ネイティブ Suzume ライブラリのバージョン文字列を返す |

## 関連ページ

- [API リファレンス](/ja/docs/api) — 品詞と `extended_pos` の値一覧、および共通の Morpheme の概念。
- [はじめに](/ja/docs/getting-started) — すべてのバインディングに共通する Suzume の入門。
- [インストール](/ja/docs/installation) — JavaScript/WASM パッケージ。
