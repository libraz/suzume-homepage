import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Suzume } from '../src/wasm/index.js'

describe('documented JavaScript samples', () => {
  let suzume: Suzume

  beforeAll(async () => {
    suzume = await Suzume.create()
  })

  afterAll(() => {
    suzume.destroy()
  })

  it('returns morphemes as a direct array with stable extended POS codes', () => {
    expect(suzume.version).toBe('0.9.6')

    const result = suzume.analyze('食べている')

    expect(Array.isArray(result)).toBe(true)
    expect(result.map(({ surface, pos, extendedPos }) => ({ surface, pos, extendedPos }))).toEqual([
      { surface: '食べ', pos: 'VERB', extendedPos: 'VERB_連用' },
      { surface: 'て', pos: 'PARTICLE', extendedPos: 'PART_接続' },
      { surface: 'いる', pos: 'AUX', extendedPos: 'AUX_継続' },
    ])
    expect(suzume.analyze('美しく')[0].conjType).toBeNull()
  })

  it('matches the current comparison-page examples', () => {
    expect(suzume.analyze('そうー').map(({ surface, pos }) => ({ surface, pos }))).toEqual([
      { surface: 'そうー', pos: 'ADV' },
    ])
    expect(suzume.analyze('彼ら').map(({ surface, pos }) => ({ surface, pos }))).toEqual([
      { surface: '彼ら', pos: 'PRON' },
    ])
    expect(suzume.analyze('食べずに').map(({ surface, pos, baseForm }) => ({ surface, pos, baseForm }))).toEqual([
      { surface: '食べ', pos: 'VERB', baseForm: '食べる' },
      { surface: 'ずに', pos: 'AUX', baseForm: 'ず' },
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
  })

  it('silently skips a runtime dictionary line with too few fields', () => {
    const startupWarnings = suzume.dictionaryWarnings
    expect(suzume.loadUserDictionary('ChatGPT,NOUN\nbroken-line')).toBe(true)
    expect(suzume.analyze('ChatGPT')[0].isUserDict).toBe(true)
    expect(suzume.dictionaryWarnings).toEqual(startupWarnings)

    expect(suzume.loadUserDictionary('React,NOUN\nNext.js,NOUN\nTailwind,NOUN')).toBe(true)
    expect(suzume.generateTags('Next.jsでReactアプリを作成')).toEqual([
      { tag: 'Next.js', pos: 'NOUN' },
      { tag: 'Reactアプリ', pos: 'NOUN' },
      { tag: '作成', pos: 'NOUN' },
    ])
  })
})
