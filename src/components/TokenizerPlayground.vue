<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { playgroundSampleTexts } from '@/data/demoSamples'
import { Suzume, type Morpheme, type Tag } from '@/wasm/index.js'

const { isJa } = useI18n()

const examples = computed(() => [
  {
    label: isJa() ? '活用の復元' : 'Conjugation',
    text: playgroundSampleTexts[0],
  },
  {
    label: isJa() ? '未知語' : 'Unknown words',
    text: playgroundSampleTexts[1],
  },
  {
    label: isJa() ? 'タグ抽出' : 'Tags',
    text: playgroundSampleTexts[2],
  },
])

const input = ref(examples.value[0].text)
const morphemes = ref<Morpheme[]>([])
const tags = ref<Tag[]>([])
const loading = ref(true)
const error = ref('')
const version = ref('')

// Timings taken on the visitor's own machine. A published table can only ever
// describe the machine it was measured on, so the page measures the device
// that is actually reading it.
const initMs = ref(0)
const perCallMs = ref(0)
const tokensPerSecond = ref(0)

let suzume: Suzume | null = null
let debounce: ReturnType<typeof setTimeout> | undefined

// One analysis of a short sentence runs well under a millisecond, which is at
// the resolution floor of a clamped performance.now(). Timing a batch and
// dividing gets a figure that means something without freezing the input.
const TIMING_BUDGET_MS = 20
const TIMING_MAX_ITERATIONS = 200

function posCategory(pos: string): string {
  const p = pos.toUpperCase()
  if (p.startsWith('NOUN') || p === 'PROPN' || p === 'PRON' || p === 'NUM') return 'noun'
  if (p.startsWith('VERB')) return 'verb'
  if (p.startsWith('ADJ')) return 'adj'
  if (p.startsWith('ADV')) return 'adv'
  if (p === 'AUX' || p.startsWith('PART')) return 'function'
  return 'other'
}

function analyze() {
  if (!suzume) return

  const text = input.value.trim()
  if (!text) {
    morphemes.value = []
    tags.value = []
    return
  }

  try {
    morphemes.value = suzume.analyze(text)
    tags.value = suzume.generateTags(text, {
      excludeBasic: true,
      maxTags: 8,
    })
    error.value = ''
    measure(suzume, text, morphemes.value.length)
  } catch {
    error.value = isJa() ? '解析に失敗しました。' : 'Analysis failed.'
  }
}

/// Time repeated analyses of the text now in the box and report the per-call
/// cost. The first call above already warmed the code path, so this measures
/// steady state rather than first-run compilation.
function measure(instance: Suzume, text: string, tokenCount: number) {
  const started = performance.now()
  let iterations = 0
  let elapsed = 0

  while (iterations < TIMING_MAX_ITERATIONS) {
    instance.analyze(text)
    iterations += 1
    elapsed = performance.now() - started
    if (elapsed >= TIMING_BUDGET_MS) break
  }

  if (iterations === 0 || elapsed <= 0) return
  perCallMs.value = elapsed / iterations
  tokensPerSecond.value = (tokenCount * iterations) / (elapsed / 1000)
}

watch(input, () => {
  clearTimeout(debounce)
  debounce = setTimeout(analyze, 120)
})

onMounted(async () => {
  try {
    const wasmPath = new URL('../wasm/suzume.wasm', import.meta.url).href
    const startedAt = performance.now()
    suzume = await Suzume.create({ wasmPath })
    initMs.value = performance.now() - startedAt
    version.value = suzume.version
    loading.value = false
    analyze()
  } catch {
    loading.value = false
    error.value = isJa() ? 'Suzume WASM の読み込みに失敗しました。' : 'Failed to load Suzume WASM.'
  }
})

onUnmounted(() => {
  clearTimeout(debounce)
  suzume?.destroy()
})

const label = computed(() => ({
  title: isJa() ? 'ブラウザ内で試す' : 'Try It In The Browser',
  description: isJa()
    ? '入力した文章はサーバーに送られません。ページに同梱された Suzume WASM が、その場で分割・原形復元・タグ抽出を実行します。'
    : 'Nothing is sent to a server. The Suzume WASM bundled with this page tokenizes, lemmatizes, and extracts tags locally.',
  input: isJa() ? '入力' : 'Input',
  tokens: isJa() ? '形態素' : 'Morphemes',
  tags: isJa() ? '抽出タグ' : 'Extracted tags',
  loading: isJa() ? 'WASM を読み込み中...' : 'Loading WASM...',
  version: isJa() ? '実行中' : 'Running',
  init: isJa() ? '初期化' : 'Instantiate',
  perCall: isJa() ? '1 回の解析' : 'Per analysis',
  throughput: isJa() ? 'スループット' : 'Throughput',
  measuredHere: isJa()
    ? 'いま、この端末で計測した値です。掲載された表ではありません。'
    : 'Measured on this device just now — not a number from a table.',
}))

const formattedThroughput = computed(() =>
  `${Math.round(tokensPerSecond.value).toLocaleString(isJa() ? 'ja-JP' : 'en-US')} ${
    isJa() ? 'トークン/秒' : 'tokens/sec'
  }`,
)
</script>

<template>
  <section class="tokenizer-playground">
    <header class="playground-header">
      <div>
        <h3>{{ label.title }}</h3>
        <p>{{ label.description }}</p>
      </div>
      <span v-if="version" class="version">{{ label.version }} {{ version }}</span>
    </header>

    <div class="example-row">
      <button
        v-for="example in examples"
        :key="example.text"
        type="button"
        class="example-button"
        :class="{ active: input === example.text }"
        @click="input = example.text"
      >
        {{ example.label }}
      </button>
    </div>

    <label class="input-label">
      <span>{{ label.input }}</span>
      <textarea v-model="input" rows="3" spellcheck="false" />
    </label>

    <p v-if="loading" class="status">{{ label.loading }}</p>
    <p v-else-if="error" class="status error">{{ error }}</p>

    <template v-else>
      <div class="result-block">
        <h4>{{ label.tokens }}</h4>
        <div class="tokens">
          <span
            v-for="(morpheme, index) in morphemes"
            :key="`${morpheme.surface}-${index}`"
            class="token"
            :data-pos="posCategory(morpheme.pos)"
            :title="`${morpheme.surface}\n${morpheme.posJa} / ${morpheme.pos}\n${morpheme.extendedPos}`"
          >
            <span class="surface">{{ morpheme.surface }}</span>
            <span class="underline"></span>
            <span class="chip">
              <span class="pos">{{ isJa() ? morpheme.posJa : morpheme.pos.toLowerCase() }}</span>
              <span class="base" v-if="morpheme.baseForm !== morpheme.surface">→{{ morpheme.baseForm }}</span>
            </span>
          </span>
        </div>
      </div>

      <div class="result-block">
        <h4>{{ label.tags }}</h4>
        <div class="tags">
          <span v-for="tag in tags" :key="`${tag.tag}-${tag.pos}`">#{{ tag.tag }}</span>
        </div>
      </div>

      <div v-if="perCallMs > 0" class="measured">
        <dl>
          <div>
            <dt>{{ label.init }}</dt>
            <dd>{{ initMs.toFixed(1) }} ms</dd>
          </div>
          <div>
            <dt>{{ label.perCall }}</dt>
            <dd>{{ perCallMs.toFixed(3) }} ms</dd>
          </div>
          <div>
            <dt>{{ label.throughput }}</dt>
            <dd>{{ formattedThroughput }}</dd>
          </div>
        </dl>
        <p>{{ label.measuredHere }}</p>
      </div>
    </template>
  </section>
</template>

<style scoped>
.tokenizer-playground {
  margin: 1.5rem 0 2rem;
  padding: 1.5rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}

.playground-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.playground-header h3 {
  margin: 0 0 0.3rem;
  font-size: 1.05rem;
}

.playground-header p {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
  line-height: 1.6;
}

.version {
  flex: 0 0 auto;
  align-self: flex-start;
  padding: 0.15rem 0.55rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 100px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-3);
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.7rem;
  white-space: nowrap;
}

.example-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-bottom: 0.85rem;
}

.example-button {
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  padding: 0.28rem 0.7rem;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  cursor: pointer;
  font-size: 0.78rem;
}

.example-button.active,
.example-button:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.input-label {
  display: grid;
  gap: 0.45rem;
  color: var(--vp-c-text-2);
  font-size: 0.78rem;
  font-weight: 600;
}

.input-label > span {
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.input-label textarea {
  box-sizing: border-box;
  width: 100%;
  resize: vertical;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 0.75rem 0.85rem;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-family: var(--vp-font-family-base);
  font-size: 0.95rem;
  font-weight: 400;
  letter-spacing: 0;
  text-transform: none;
  line-height: 1.7;
}

.input-label textarea:focus {
  outline: 2px solid var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-1);
}

.status {
  margin: 1rem 0 0;
  color: var(--vp-c-text-3);
}

.status.error {
  color: var(--vp-c-danger-1, #dc2626);
}

.result-block {
  margin-top: 1rem;
}

.result-block h4 {
  margin: 0 0 0.55rem;
  font-size: 0.78rem;
  color: var(--vp-c-text-2);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.tokens {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.125rem 0.375rem;
}

.token {
  --accent: var(--vp-c-text-3);
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.token .surface {
  font-size: 1.15rem;
  font-weight: 500;
  color: var(--vp-c-text-1);
  line-height: 1.3;
  white-space: nowrap;
}

.token .underline {
  width: 100%;
  height: 2px;
  background: var(--accent);
  margin: 0.2rem 0;
}

.token .chip {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.1rem 0.375rem;
  border-radius: 4px;
  background: color-mix(in srgb, var(--accent) 10%, var(--vp-c-bg));
  border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
  white-space: nowrap;
}

.token .pos {
  color: var(--accent);
  font-weight: 500;
  font-size: 0.65rem;
}

.token .base {
  color: var(--vp-c-text-3);
  font-size: 0.6rem;
}

.token[data-pos='noun'] {
  --accent: #2563eb;
}

.token[data-pos='verb'] {
  --accent: #059669;
}

.token[data-pos='adj'] {
  --accent: #dc2626;
}

.token[data-pos='adv'] {
  --accent: #7c3aed;
}

.token[data-pos='function'] {
  --accent: #0891b2;
}

.dark .token[data-pos='noun'] {
  --accent: #60a5fa;
}

.dark .token[data-pos='verb'] {
  --accent: #34d399;
}

.dark .token[data-pos='adj'] {
  --accent: #f87171;
}

.dark .token[data-pos='adv'] {
  --accent: #a78bfa;
}

.dark .token[data-pos='function'] {
  --accent: #22d3ee;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.tags span {
  border-radius: 999px;
  padding: 0.24rem 0.6rem;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-size: 0.8rem;
}

.measured {
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px dashed var(--vp-c-border);
}

.measured dl {
  display: flex;
  flex-wrap: wrap;
  gap: 1.75rem;
  margin: 0;
}

.measured dt {
  margin-bottom: 0.15rem;
  color: var(--vp-c-text-3);
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.measured dd {
  margin: 0;
  font-family: var(--vp-font-family-mono);
  font-size: 0.95rem;
  font-variant-numeric: tabular-nums;
  color: var(--vp-c-text-1);
}

.measured p {
  margin: 0.7rem 0 0;
  color: var(--vp-c-text-3);
  font-size: 0.78rem;
}

@media (max-width: 640px) {
  .playground-header {
    display: block;
  }

  .measured dl {
    gap: 1rem 1.5rem;
  }

  .version {
    display: inline-block;
    margin-top: 0.5rem;
  }
}
</style>
