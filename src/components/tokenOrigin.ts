import type { Morpheme } from '@/wasm/index.js'

export type TokenOrigin = 'dictionary' | 'user' | 'generated'

/** Where the selected token came from; isUserDict also covers the bundled user dictionary. */
export function tokenOrigin(m: Morpheme): TokenOrigin {
  if (m.isUserDict) return 'user'
  if (m.isFromDictionary) return 'dictionary'
  return 'generated'
}

export const tokenOrigins: readonly TokenOrigin[] = ['dictionary', 'user', 'generated']

export function tokenOriginLabel(origin: TokenOrigin, ja: boolean): string {
  switch (origin) {
    case 'dictionary':
      return ja ? '辞書' : 'Dictionary'
    case 'user':
      return ja ? 'ユーザー辞書' : 'User dictionary'
    case 'generated':
      return ja ? '辞書外（パターン・未知語）' : 'Not in a dictionary (pattern / unknown)'
  }
}

/** POS hue bucket shared by every token chip on the site. */
export function posCategory(pos: string): string {
  switch (pos.toUpperCase()) {
    case 'NOUN':
    case 'PRON':
      return 'noun'
    case 'VERB':
      return 'verb'
    case 'ADJ':
      return 'adj'
    case 'ADV':
      return 'adv'
    case 'AUX':
    case 'PARTICLE':
    case 'PREFIX':
    case 'SUFFIX':
    case 'DET':
    case 'CONJ':
      return 'function'
    default:
      return 'other'
  }
}
