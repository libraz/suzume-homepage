<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'

const { isJa } = useI18n()

const props = defineProps<{
  /** Source text shown above the comparison. */
  input: string
  /** MeCab tokens: `surface(pos) / surface(pos) / ...`. POS is optional; MeCab POS is written in Japanese. */
  mecab: string
  /** Suzume tokens: `surface(CODE) / surface(CODE, lemma: base) / ...`. POS is the uppercase API tag. */
  suzume: string
  /** Optional caption shown under the rows (English). */
  note?: string
  /** Optional caption shown under the rows (Japanese); falls back to `note`. */
  noteJa?: string
}>()

interface Tok {
  surface: string
  pos?: string
  base?: string
}

// Public API tag -> Japanese POS name. Uppercase codes are not intuitive on their own,
// so every Suzume token shows the Japanese name alongside the code.
const POS_JA: Record<string, string> = {
  NOUN: '名詞',
  VERB: '動詞',
  ADJ: '形容詞',
  ADV: '副詞',
  PARTICLE: '助詞',
  AUX: '助動詞',
  CONJ: '接続詞',
  DET: '連体詞',
  PRON: '代名詞',
  PREFIX: '接頭辞',
  SUFFIX: '接尾辞',
  INTJ: '感動詞',
  SYMBOL: '記号',
  OTHER: 'その他',
}

function parse(spec: string): Tok[] {
  if (!spec) return []
  return spec
    .split(' / ')
    .map((raw) => raw.trim())
    .filter(Boolean)
    .map((s) => {
      const m = s.match(/^(.*?)[（(]([^（）()]*)[)）]\s*$/)
      if (!m) return { surface: s }
      const surface = m[1]
      const parts = m[2]
        .split(/[、,，]/)
        .map((p) => p.trim())
        .filter(Boolean)
      const pos = parts[0]
      let base: string | undefined
      for (const p of parts.slice(1)) {
        const lm = p.match(/(?:lemma|原形)\s*[:：]\s*(.+)/)
        if (lm) base = lm[1].trim()
      }
      return { surface, pos, base }
    })
}

function suzumeCategory(code: string): string {
  switch (code) {
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

function mecabCategory(pos: string): string {
  if (pos.startsWith('名詞') || pos.startsWith('代名詞')) return 'noun'
  if (pos.startsWith('動詞')) return 'verb'
  if (pos.startsWith('形容詞')) return 'adj'
  if (pos.startsWith('副詞')) return 'adv'
  if (/^(助詞|助動詞|接続詞|連体詞|接頭)/.test(pos)) return 'function'
  return 'other'
}

interface Row {
  surface: string
  base?: string
  category: string
  primary?: string
  code?: string
}

function build(spec: string, suzume: boolean): Row[] {
  return parse(spec).map((t) => {
    if (!t.pos) return { surface: t.surface, base: t.base, category: 'none' }
    if (suzume) {
      return {
        surface: t.surface,
        base: t.base,
        category: suzumeCategory(t.pos),
        primary: POS_JA[t.pos] ?? t.pos,
        code: POS_JA[t.pos] ? t.pos : undefined,
      }
    }
    return {
      surface: t.surface,
      base: t.base,
      category: mecabCategory(t.pos),
      primary: t.pos,
    }
  })
}

const mecabTokens = computed(() => build(props.mecab, false))
const suzumeTokens = computed(() => build(props.suzume, true))

function count(n: number): string {
  if (isJa()) return `${n}トークン`
  return `${n} token${n === 1 ? '' : 's'}`
}

const inputLabel = computed(() => (isJa() ? '入力' : 'Input'))
const caption = computed(() => (isJa() ? props.noteJa || props.note : props.note))
</script>

<template>
  <div class="token-diff">
    <div class="td-input">
      <span class="td-input-label">{{ inputLabel }}</span>
      <span class="td-input-text">{{ input }}</span>
    </div>

    <div class="td-rows">
      <div class="td-row">
        <span class="td-engine mecab">MeCab</span>
        <div class="td-tokens">
          <span
            v-for="(tok, i) in mecabTokens"
            :key="`m-${i}`"
            class="td-token"
            :data-pos="tok.category"
          >
            <span class="surface">{{ tok.surface }}</span>
            <span class="underline"></span>
            <span v-if="tok.primary || tok.base" class="chip">
              <span v-if="tok.primary" class="pos">{{ tok.primary }}</span>
              <span v-if="tok.base" class="base">→{{ tok.base }}</span>
            </span>
          </span>
        </div>
        <span class="td-count">{{ count(mecabTokens.length) }}</span>
      </div>

      <div class="td-row is-suzume">
        <span class="td-engine suzume">Suzume</span>
        <div class="td-tokens">
          <span
            v-for="(tok, i) in suzumeTokens"
            :key="`s-${i}`"
            class="td-token"
            :data-pos="tok.category"
          >
            <span class="surface">{{ tok.surface }}</span>
            <span class="underline"></span>
            <span v-if="tok.primary || tok.base" class="chip">
              <span v-if="tok.primary" class="pos">{{ tok.primary }}</span>
              <span v-if="tok.code" class="code">{{ tok.code }}</span>
              <span v-if="tok.base" class="base">→{{ tok.base }}</span>
            </span>
          </span>
        </div>
        <span class="td-count">{{ count(suzumeTokens.length) }}</span>
      </div>
    </div>

    <p v-if="caption" class="td-note">{{ caption }}</p>
  </div>
</template>

<style scoped>
.token-diff {
  margin: 1.25rem 0;
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  overflow: hidden;
}

.td-input {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  padding: 0.7rem 1rem;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
}

.td-input-label {
  flex: 0 0 auto;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
}

.td-input-text {
  font-size: 1.05rem;
  font-weight: 500;
  color: var(--vp-c-text-1);
  word-break: break-word;
}

.td-rows {
  display: flex;
  flex-direction: column;
}

.td-row {
  display: grid;
  grid-template-columns: 4.5rem 1fr auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
}

.td-row + .td-row {
  border-top: 1px solid var(--vp-c-divider);
}

.td-row.is-suzume {
  background: color-mix(in srgb, var(--vp-c-brand-1) 7%, var(--vp-c-bg-soft));
}

.td-engine {
  flex: 0 0 auto;
  align-self: flex-start;
  margin-top: 0.15rem;
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  white-space: nowrap;
  text-align: center;
}

.td-engine.mecab {
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
}

.td-engine.suzume {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  border: 1px solid color-mix(in srgb, var(--vp-c-brand-1) 28%, transparent);
}

.td-tokens {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.35rem 0.55rem;
  min-width: 0;
}

.td-token {
  --accent: var(--vp-c-text-3);
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.td-token .surface {
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--vp-c-text-1);
  line-height: 1.3;
  white-space: nowrap;
}

.td-token .underline {
  width: 100%;
  height: 2px;
  border-radius: 2px;
  background: var(--accent);
  margin: 0.18rem 0;
}

.td-token[data-pos='none'] .underline {
  background: var(--vp-c-divider);
}

.td-token .chip {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.08rem 0.35rem;
  border-radius: 4px;
  background: color-mix(in srgb, var(--accent) 10%, var(--vp-c-bg));
  border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
  white-space: nowrap;
}

.td-token .pos {
  color: var(--accent);
  font-weight: 600;
  font-size: 0.66rem;
}

.td-token .code {
  color: var(--vp-c-text-3);
  font-size: 0.58rem;
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  letter-spacing: 0.02em;
}

.td-token .base {
  color: var(--vp-c-text-3);
  font-size: 0.6rem;
}

.td-count {
  flex: 0 0 auto;
  align-self: flex-start;
  margin-top: 0.15rem;
  font-size: 0.68rem;
  color: var(--vp-c-text-3);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.td-note {
  margin: 0;
  padding: 0.55rem 1rem;
  border-top: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  font-size: 0.8rem;
  line-height: 1.5;
}

.td-token[data-pos='noun'] {
  --accent: #2563eb;
}
.td-token[data-pos='verb'] {
  --accent: #059669;
}
.td-token[data-pos='adj'] {
  --accent: #dc2626;
}
.td-token[data-pos='adv'] {
  --accent: #7c3aed;
}
.td-token[data-pos='function'] {
  --accent: #0891b2;
}
.td-token[data-pos='other'] {
  --accent: #6b7280;
}

.dark .td-token[data-pos='noun'] {
  --accent: #60a5fa;
}
.dark .td-token[data-pos='verb'] {
  --accent: #34d399;
}
.dark .td-token[data-pos='adj'] {
  --accent: #f87171;
}
.dark .td-token[data-pos='adv'] {
  --accent: #a78bfa;
}
.dark .td-token[data-pos='function'] {
  --accent: #22d3ee;
}
.dark .td-token[data-pos='other'] {
  --accent: #9ca3af;
}

@media (max-width: 640px) {
  .td-row {
    grid-template-columns: 1fr auto;
    grid-template-areas:
      'engine count'
      'tokens tokens';
    gap: 0.5rem 0.75rem;
  }

  .td-engine {
    grid-area: engine;
    margin-top: 0;
  }

  .td-count {
    grid-area: count;
    margin-top: 0;
    justify-self: end;
  }

  .td-tokens {
    grid-area: tokens;
  }
}
</style>
