import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  allLiveDemoSampleTexts,
  analysisSampleTexts,
  baseFormSampleTexts,
  tagSampleTexts,
  typewriterSampleTexts,
} from '../src/data/demoSamples.js'
import { Suzume } from '../src/wasm/index.js'
import wasmMeta from '../src/wasm/meta.json'

interface TokenDiffClaim {
  input: string
  mecab: string
  suzume: string
}

function tokenDiffClaims(markdown: string): TokenDiffClaim[] {
  return [...markdown.matchAll(/<TokenDiff\b([\s\S]*?)\/>/g)].map((match) => {
    const attributes = Object.fromEntries(
      [...match[1].matchAll(/([A-Za-z]+)="([^"]*)"/g)].map((attribute) => [attribute[1], attribute[2]]),
    )
    if (!attributes.input || !attributes.mecab || !attributes.suzume) {
      throw new Error(`Incomplete TokenDiff claim: ${match[0]}`)
    }
    return { input: attributes.input, mecab: attributes.mecab, suzume: attributes.suzume }
  })
}

function comparisonPageNames() {
  return readdirSync(new URL('../src/docs/', import.meta.url))
    .filter((name) => /^(?:mecab-.*|pos-differences)\.md$/.test(name))
    .sort()
}

function expectedToken(specification: string) {
  const annotated = specification.match(/^(.*)\(([A-Z]+)(?:, lemma: (.*))?\)$/)
  return annotated
    ? { surface: annotated[1], pos: annotated[2], baseForm: annotated[3] }
    : { surface: specification, pos: undefined, baseForm: undefined }
}

function expectSequence(suzume: Suzume, input: string, expected: string[]) {
  const actual = suzume.analyze(input).map(({ surface }) => surface)
  const joined = actual.join('\u0000')
  expect(joined, input).toContain(expected.join('\u0000'))
}

describe('documented JavaScript samples', () => {
  let suzume: Suzume
  let suzumeWithSymbols: Suzume

  beforeAll(async () => {
    suzume = await Suzume.create()
    suzumeWithSymbols = await Suzume.create({ preserveSymbols: true })
  })

  afterAll(() => {
    suzume.destroy()
    suzumeWithSymbols.destroy()
  })

  it('matches the shipped WASM size and hash to its display metadata', () => {
    const bytes = readFileSync(new URL('../src/wasm/suzume.wasm', import.meta.url))
    expect(bytes.length).toBe(wasmMeta.size)
    expect(gzipSync(bytes).length).toBe(wasmMeta.gzipSize)
    expect(createHash('md5').update(bytes).digest('hex')).toBe(wasmMeta.md5)
  })

  it('documents the new extended POS labels returned by the runtime in both languages', () => {
    const samples = [
      ['本らしさ', 'らし', 'AUX_推定語幹'],
      ['行くらむ', 'らむ', 'AUX_現在推量'],
      ['なぜだ', 'なぜ', 'ADV_疑問'],
      ['来やがった', 'やがっ', 'AUX_卑罵'],
      ['飾りっけ', 'っけ', 'SUFFIX_気配'],
      ['雨か雪', 'か', 'PART_選択'],
    ]
    const pages = ['../src/docs/api.md', '../src/ja/docs/api.md'].map((path) =>
      readFileSync(new URL(path, import.meta.url), 'utf8'),
    )
    for (const [input, surface, extendedPos] of samples) {
      expect(suzume.analyze(input), input).toEqual(expect.arrayContaining([
        expect.objectContaining({ surface, extendedPos }),
      ]))
      for (const page of pages) {
        expect(page).toContain('| `' + extendedPos + '` |')
      }
    }
  })

  it('returns morphemes as a direct array with stable extended POS codes', () => {
    expect(suzume.version).toBe(wasmMeta.version)

    const result = suzume.analyze('食べている')

    expect(Array.isArray(result)).toBe(true)
    expect(result.map(({ surface, pos, extendedPos }) => ({ surface, pos, extendedPos }))).toEqual([
      { surface: '食べ', pos: 'VERB', extendedPos: 'VERB_連用' },
      { surface: 'て', pos: 'PARTICLE', extendedPos: 'PART_接続' },
      { surface: 'いる', pos: 'AUX', extendedPos: 'AUX_継続' },
    ])
    expect(suzume.analyze('美しく')[0].conjType).toBeNull()
  })

  it('keeps every English and Japanese TokenDiff claim identical and executable', () => {
    const pages = comparisonPageNames()
    const japanesePages = readdirSync(new URL('../src/ja/docs/', import.meta.url))
      .filter((name) => /^(?:mecab-.*|pos-differences)\.md$/.test(name))
      .sort()
    expect(japanesePages).toEqual(pages)

    const claimsByPage = new Map<string, TokenDiffClaim[]>()
    for (const page of pages) {
      const en = tokenDiffClaims(readFileSync(new URL(`../src/docs/${page}`, import.meta.url), 'utf8'))
      const ja = tokenDiffClaims(readFileSync(new URL(`../src/ja/docs/${page}`, import.meta.url), 'utf8'))
      expect(en, page).not.toHaveLength(0)
      expect(ja, page).toEqual(en)
      claimsByPage.set(page, en)
    }

    const english = pages.flatMap((page) => claimsByPage.get(page) ?? [])
    expect(english).toHaveLength(122)

    for (const claim of english) {
      const actual = suzume.analyze(claim.input)
      const specifications = claim.suzume.split(' / ')
      const isPrefix = specifications.at(-1) === '…'
      const expected = specifications.filter((specification) => specification !== '…').map(expectedToken)

      if (!isPrefix) {
        expect(actual, claim.input).toHaveLength(expected.length)
      }
      expected.forEach((token, index) => {
        expect(actual[index]?.surface, `${claim.input}: token ${index}`).toBe(token.surface)
        if (token.pos) {
          expect(actual[index]?.pos, `${claim.input}: POS ${index}`).toBe(token.pos)
        }
        if (token.baseForm) {
          expect(actual[index]?.baseForm, `${claim.input}: lemma ${index}`).toBe(token.baseForm)
        }
      })
    }
  })

  it('analyzes all 61 live demo inputs and preserves their complete normalized text', () => {
    expect(allLiveDemoSampleTexts).toHaveLength(61)

    for (const input of allLiveDemoSampleTexts) {
      const { normalizedText, morphemes } = suzumeWithSymbols.analyzeWithNormalizedText(input)
      expect(morphemes.length, input).toBeGreaterThan(0)
      expect(morphemes.map(({ surface }) => surface).join(''), input).toBe(normalizedText)
      for (const morpheme of morphemes) {
        expect(morpheme.surface, input).not.toBe('')
        expect(morpheme.pos, `${input}: ${morpheme.surface}`).not.toBe('')
        expect(morpheme.extendedPos, `${input}: ${morpheme.surface}`).not.toBe('')
        expect(morpheme.end, `${input}: ${morpheme.surface}`).toBeGreaterThan(morpheme.start)
      }
    }
  })

  it('locks the colloquial, dialectal, classical, and technical demo examples', () => {
    expect(suzume.analyze(analysisSampleTexts[1]).map(({ surface, baseForm }) => [surface, baseForm])).toEqual([
      ['もう', 'もう'],
      ['食べ', '食べる'],
      ['ちゃっ', 'ちゃう'],
      ['た', 'た'],
      ['けど', 'けど'],
      ['まだ', 'まだ'],
      ['飲ん', '飲む'],
      ['でる', 'でる'],
    ])
    expect(suzume.analyze(analysisSampleTexts[2]).map(({ surface, pos }) => [surface, pos])).toEqual([
      ['そんな', 'DET'],
      ['ん', 'PARTICLE'],
      ['あかん', 'AUX'],
      ['ねん', 'PARTICLE'],
      ['知ら', 'VERB'],
      ['ん', 'AUX'],
      ['けど', 'PARTICLE'],
    ])
    expect(suzume.analyze(analysisSampleTexts[3]).map(({ surface, baseForm }) => [surface, baseForm])).toEqual([
      ['昔', '昔'],
      ['男', '男'],
      ['あり', 'ある'],
      ['けり', 'けり'],
      ['花', '花'],
      ['は', 'は'],
      ['美しかり', '美しい'],
      ['けり', 'けり'],
    ])
    expect(
      suzume.analyze(baseFormSampleTexts[2])
        .filter(({ pos, surface, baseForm }) => (pos === 'VERB' || pos === 'ADJ') && surface !== baseForm)
        .map(({ surface, baseForm }) => [surface, baseForm]),
    ).toEqual([
      ['読めりゃ', '読める'],
      ['行きゃ', '行く'],
    ])
    expect(suzume.generateTags(tagSampleTexts[1], { maxTags: 12 }).map(({ tag }) => tag)).toEqual([
      '生成',
      'AIカンファレンス',
      '機械学習',
      '自然言語処理',
      '最新動向',
      '学ぶ',
    ])
  })

  it('locks the grammar boundaries previously broken in live literary examples', () => {
    const sample = (fragment: string) => {
      const input = typewriterSampleTexts.find((text) => text.includes(fragment))
      if (!input) throw new Error(`Missing live sample: ${fragment}`)
      return input
    }

    expectSequence(suzume, sample('吾輩はここで始めて'), ['吾輩', 'は', 'ここ', 'で', '始め', 'て'])
    expectSequence(suzume, sample('掌の裏でしばらくは'), ['裏', 'で', 'しばらく', 'は'])
    expectSequence(suzume, sample('考え出そうとしても'), ['考え出そ', 'う', 'と', 'し', 'て', 'も'])
    expectSequence(suzume, sample('来てくれるかと'), ['来', 'て', 'くれる', 'か', 'と'])
    expectSequence(suzume, sample('あるこうと決心'), ['あるこ', 'う', 'と', '決心'])
    expectSequence(suzume, sample('からとにかく明るくて'), ['から', 'とにかく', '明るく', 'て'])
    expectSequence(suzume, sample('方へ方へとあるいて'), ['方', 'へ', '方', 'へ', 'と', 'あるい', 'て'])
    expectSequence(suzume, sample('時はすでに家'), ['時', 'は', 'すでに', '家'])
  })

  it('matches the pipeline and CLI output displayed in both languages', () => {
    expect(suzume.analyze('東京スカイツリーに行きました').map(({ surface }) => surface)).toEqual([
      '東京', 'スカイツリー', 'に', '行き', 'まし', 'た',
    ])
    expect(suzume.analyze('食べている').map(({ surface, pos, baseForm, start, end }) => ({
      surface, pos, baseForm, start, end,
    }))).toEqual([
      { surface: '食べ', pos: 'VERB', baseForm: '食べる', start: 0, end: 2 },
      { surface: 'て', pos: 'PARTICLE', baseForm: 'て', start: 2, end: 3 },
      { surface: 'いる', pos: 'AUX', baseForm: 'いる', start: 3, end: 5 },
    ])
  })

  it('preserves documented quantity and nominal boundaries', () => {
    for (const input of ['3種類', '3人分', '3ページ目', '眠み', '無理み']) {
      expect(suzume.analyze(input).map(({ surface, pos }) => [surface, pos]), input).toEqual([
        [input, 'NOUN'],
      ])
    }
    expect(suzume.analyze('取り扱い方法').map(({ surface, pos }) => [surface, pos])).toEqual([
      ['取り扱い', 'NOUN'], ['方法', 'NOUN'],
    ])
    expect(suzume.analyze('取り扱い方').map(({ surface, pos }) => [surface, pos])).toEqual([
      ['取り扱い', 'NOUN'], ['方', 'SUFFIX'],
    ])
    expect(suzume.analyze('行くかって').map(({ surface, pos }) => [surface, pos])).toEqual([
      ['行く', 'VERB'], ['か', 'PARTICLE'], ['って', 'PARTICLE'],
    ])
    expect(suzume.analyze('佐藤殿').map(({ surface }) => surface)).toEqual(['佐藤', '殿'])
    expect(suzume.analyze('先生殿').map(({ surface }) => surface)).toEqual(['先生', '殿'])
  })

  it('distinguishes greeting interjections from ordinary exclamations', () => {
    for (const input of ['ありがとう', 'ごめん', 'すみません', 'おつかれさま']) {
      expect(suzume.analyze(input).map(({ surface, pos, extendedPos }) => ({ surface, pos, extendedPos })), input)
        .toEqual([{ surface: input, pos: 'INTJ', extendedPos: 'INTJ_挨拶' }])
    }
    for (const input of ['ああ', 'おい']) {
      expect(suzume.analyze(input)[0].extendedPos, input).toBe('INTJ')
    }
    expect(suzume.analyze('心からありがとう').map(({ surface, pos }) => [surface, pos])).toEqual([
      ['心', 'NOUN'], ['から', 'PARTICLE'], ['ありがとう', 'INTJ'],
    ])
  })

  it('keeps content symbols by default and limits preserveSymbols to punctuation', () => {
    expect(suzume.analyze('価格は€50🎉。').map(({ surface, pos }) => `${surface}(${pos})`)).toEqual([
      '価格(NOUN)',
      'は(PARTICLE)',
      '€(OTHER)',
      '50(NOUN)',
      '🎉(OTHER)',
    ])
    expect(suzumeWithSymbols.analyze('価格は€50🎉。').map(({ surface, pos }) => `${surface}(${pos})`)).toEqual([
      '価格(NOUN)',
      'は(PARTICLE)',
      '€(OTHER)',
      '50(NOUN)',
      '🎉(OTHER)',
      '。(SYMBOL)',
    ])
  })

  it('matches the documented tag option examples', () => {
    expect(suzume.generateTags('美しい花が静かに咲いている', {
      posFilter: ['noun'],
      minLength: 1,
    })).toEqual([{ tag: '花', pos: 'NOUN' }])

    expect(suzume.generateTags('新しいプロジェクトを開始して管理する', {
      excludeBasic: false,
    }).map(({ tag }) => tag)).toEqual(['新しい', 'プロジェクト', '開始', 'する', '管理'])

    expect(suzume.generateTags('東京タワーと東京スカイツリーを見学しました', {
      maxTags: 3,
    }).map(({ tag }) => tag)).toEqual(['東京', 'タワー', 'スカイツリー'])

    expect(suzume.generateTags('東京スカイツリーで夜景を撮影しました', {
      excludeBasic: true,
      maxTags: 5,
    })).toEqual([
      { tag: '東京', pos: 'NOUN' },
      { tag: 'スカイツリー', pos: 'NOUN' },
      { tag: '夜景', pos: 'NOUN' },
      { tag: '撮影', pos: 'NOUN' },
    ])
  })

  it('loads valid runtime dictionary rows and reports skipped rows', () => {
    const startupWarnings = suzume.dictionaryWarnings
    expect(suzume.loadUserDictionary('ChatGPT,NOUN\nbroken-line')).toBe(true)
    expect(suzume.analyze('ChatGPT')[0].isUserDict).toBe(true)
    expect(suzume.dictionaryWarnings.slice(0, startupWarnings.length)).toEqual(startupWarnings)
    expect(suzume.dictionaryWarnings.at(-1)).toContain('line 2')

    expect(suzume.loadUserDictionary('React\tNOUN\nNext.js\tNOUN\nTailwind\tNOUN')).toBe(true)
    expect(suzume.generateTags('Next.jsでReactアプリを作成')).toEqual([
      { tag: 'Next.js', pos: 'NOUN' },
      { tag: 'React', pos: 'NOUN' },
      { tag: 'アプリ', pos: 'NOUN' },
      { tag: '作成', pos: 'NOUN' },
    ])
  })
})
