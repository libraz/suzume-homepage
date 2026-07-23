import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { allLiveDemoSampleTexts, typewriterSampleTexts } from '../src/data/demoSamples.js'
import { Suzume } from '../src/wasm/index.js'
import wasmMeta from '../src/wasm/meta.json'

interface TokenDiffClaim {
  input: string
  suzume: string
}

function tokenDiffClaims(markdown: string): TokenDiffClaim[] {
  return [...markdown.matchAll(/<TokenDiff\b([\s\S]*?)\/>/g)].map((match) => {
    const attributes = Object.fromEntries(
      [...match[1].matchAll(/([A-Za-z]+)="([^"]*)"/g)].map((attribute) => [attribute[1], attribute[2]]),
    )
    if (!attributes.input || !attributes.suzume) {
      throw new Error(`Incomplete TokenDiff claim: ${match[0]}`)
    }
    return { input: attributes.input, suzume: attributes.suzume }
  })
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
    const pages = ['mecab-comparison', 'pos-differences']
    const english: TokenDiffClaim[] = []
    for (const page of pages) {
      const en = tokenDiffClaims(readFileSync(new URL(`../src/docs/${page}.md`, import.meta.url), 'utf8'))
      const ja = tokenDiffClaims(readFileSync(new URL(`../src/ja/docs/${page}.md`, import.meta.url), 'utf8'))
      expect(ja, page).toEqual(en)
      english.push(...en)
    }

    expect(english).toHaveLength(105)

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

  it('analyzes all 58 live demo inputs and preserves their complete displayed text', () => {
    expect(allLiveDemoSampleTexts).toHaveLength(58)

    for (const input of allLiveDemoSampleTexts) {
      const result = suzumeWithSymbols.analyze(input)
      expect(result.length, input).toBeGreaterThan(0)
      expect(result.map(({ surface }) => surface).join(''), input).toBe(input)
      for (const morpheme of result) {
        expect(morpheme.surface, input).not.toBe('')
        expect(morpheme.pos, `${input}: ${morpheme.surface}`).not.toBe('')
        expect(morpheme.extendedPos, `${input}: ${morpheme.surface}`).not.toBe('')
        expect(morpheme.end, `${input}: ${morpheme.surface}`).toBeGreaterThan(morpheme.start)
      }
    }
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

  it('matches the documented tag option examples', () => {
    expect(suzume.generateTags('美しい花が静かに咲いている', {
      pos: ['noun'],
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

  it('silently skips a runtime dictionary line with too few fields', () => {
    const startupWarnings = suzume.dictionaryWarnings
    expect(suzume.loadUserDictionary('ChatGPT,NOUN\nbroken-line')).toBe(true)
    expect(suzume.analyze('ChatGPT')[0].isUserDict).toBe(true)
    expect(suzume.dictionaryWarnings).toEqual(startupWarnings)

    expect(suzume.loadUserDictionary('React,NOUN\nNext.js,NOUN\nTailwind,NOUN')).toBe(true)
    expect(suzume.generateTags('Next.jsでReactアプリを作成')).toEqual([
      { tag: 'Next.js', pos: 'NOUN' },
      { tag: 'React', pos: 'NOUN' },
      { tag: 'アプリ', pos: 'NOUN' },
      { tag: '作成', pos: 'NOUN' },
    ])
  })
})
