<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { modeSampleText, playgroundSampleTexts } from '@/data/demoSamples'
import { Suzume, type Morpheme, type SuzumeOptions, type Tag } from '@/wasm/index.js'
import TokenChip from './TokenChip.vue'
import TokenOriginLegend from './TokenOriginLegend.vue'

type AnalysisMode = NonNullable<SuzumeOptions['mode']>

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
  {
    label: isJa() ? '解析モード' : 'Modes',
    text: modeSampleText,
  },
])

const modes: AnalysisMode[] = ['normal', 'search', 'split']
const mode = ref<AnalysisMode>('normal')
const mergeCompounds = ref(false)

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
let wasmPath = ''
// Guards against an older re-creation finishing after a newer one.
let generation = 0

// One analysis of a short sentence runs well under a millisecond, which is at
// the resolution floor of a clamped performance.now(). Timing a batch and
// dividing gets a figure that means something without freezing the input.
const TIMING_BUDGET_MS = 20
const TIMING_MAX_ITERATIONS = 200

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

// The mode switches on the live instance; mergeCompounds is fixed at creation.
watch(mode, (value) => {
  if (!suzume) return
  suzume.mode = value
  analyze()
})

watch(mergeCompounds, async (value) => {
  if (!suzume) return
  const current = ++generation
  try {
    const next = await Suzume.create({ wasmPath, mode: mode.value, mergeCompounds: value })
    if (current !== generation) {
      next.destroy()
      return
    }
    // The mode may have changed while the new instance was being created.
    next.mode = mode.value
    suzume?.destroy()
    suzume = next
    analyze()
  } catch {
    error.value = isJa() ? 'Suzume WASM の読み込みに失敗しました。' : 'Failed to load Suzume WASM.'
  }
})

onMounted(async () => {
  try {
    wasmPath = new URL('../wasm/suzume.wasm', import.meta.url).href
    const startedAt = performance.now()
    suzume = await Suzume.create({ wasmPath, mode: mode.value, mergeCompounds: mergeCompounds.value })
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
  generation += 1
  suzume?.destroy()
  suzume = null
})

const label = computed(() => ({
  title: isJa() ? 'ブラウザ内で試す' : 'Try it in the browser',
  description: isJa()
    ? '入力した文章はサーバーに送られません。ページに同梱された Suzume WASM が、その場で分割・原形復元・タグ抽出を実行します。'
    : 'Nothing is sent to a server. The Suzume WASM bundled with this page tokenizes, lemmatizes, and extracts tags locally.',
  input: isJa() ? '入力' : 'Input',
  tokens: isJa() ? 'トークン' : 'Tokens',
  mode: isJa() ? '解析モード' : 'Mode',
  mergeCompounds: isJa() ? '連続する名詞を結合（mergeCompounds）' : 'Merge noun compounds (mergeCompounds)',
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
  <section class="tokenizer-playground sz-panel sz-demo">
    <header class="playground-header">
      <div>
        <h3>{{ label.title }}</h3>
        <p>{{ label.description }}</p>
      </div>
      <span v-if="version" class="version sz-num">{{ label.version }} {{ version }}</span>
    </header>

    <div class="sz-pills example-row">
      <button
        v-for="example in examples"
        :key="example.text"
        type="button"
        class="sz-pill"
        :aria-pressed="input === example.text"
        @click="input = example.text"
      >
        {{ example.label }}
      </button>
    </div>

    <label class="input-field">
      <span class="sz-label">{{ label.input }}</span>
      <textarea v-model="input" class="sz-input" rows="3" spellcheck="false" />
    </label>

    <div class="options-row">
      <div class="sz-seg mode-picker" role="radiogroup" :aria-label="label.mode">
        <button
          v-for="m in modes"
          :key="m"
          type="button"
          role="radio"
          :aria-checked="mode === m"
          @click="mode = m"
        >
          {{ m }}
        </button>
      </div>
      <label class="sz-check">
        <input v-model="mergeCompounds" type="checkbox" />
        <span>{{ label.mergeCompounds }}</span>
      </label>
    </div>

    <div class="results">
      <div v-if="loading" class="sz-status">{{ label.loading }}</div>
      <div v-else-if="error" class="sz-status" data-kind="error">{{ error }}</div>

      <template v-else>
        <div class="result-block">
          <div class="sz-label">{{ label.tokens }}</div>
          <div class="sz-tokens token-area">
            <TokenChip
              v-for="(morpheme, index) in morphemes"
              :key="`${morpheme.surface}-${index}`"
              :morpheme="morpheme"
            />
          </div>
          <TokenOriginLegend />
        </div>

        <div class="result-block">
          <div class="sz-label">{{ label.tags }}</div>
          <div class="tags">
            <span v-for="tag in tags" :key="`${tag.tag}-${tag.pos}`">#{{ tag.tag }}</span>
          </div>
        </div>

        <div v-if="perCallMs > 0" class="measured">
          <dl>
            <div>
              <dt>{{ label.init }}</dt>
              <dd class="sz-num">{{ initMs.toFixed(1) }} ms</dd>
            </div>
            <div>
              <dt>{{ label.perCall }}</dt>
              <dd class="sz-num">{{ perCallMs.toFixed(3) }} ms</dd>
            </div>
            <div>
              <dt>{{ label.throughput }}</dt>
              <dd class="sz-num">{{ formattedThroughput }}</dd>
            </div>
          </dl>
          <p>{{ label.measuredHere }}</p>
        </div>
      </template>
    </div>
  </section>
</template>

<style scoped>
.tokenizer-playground {
  margin: 1.5rem 0 2rem;
}

.playground-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.1rem;
}

.playground-header h3 {
  margin: 0 0 0.3rem;
  font-size: 1.05rem;
}

.playground-header p {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 0.88rem;
  line-height: 1.65;
}

.version {
  flex: 0 0 auto;
  align-self: flex-start;
  padding: 0.15rem 0.55rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-3);
  font-size: 0.7rem;
  white-space: nowrap;
}

.example-row {
  margin-bottom: 1rem;
}

.input-field {
  display: block;
}

.options-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem 1.25rem;
  margin-top: 0.85rem;
}

.mode-picker {
  flex: 0 0 16rem;
}

.mode-picker > button {
  font-family: var(--vp-font-family-mono);
  font-size: 0.78rem;
}

/* Reserve the loaded height so the panel does not jump when WASM arrives or
   when a mode switch changes the token count. */
.results {
  min-height: 15rem;
  margin-top: 1.25rem;
}

.result-block + .result-block {
  margin-top: 1.25rem;
}

.token-area {
  min-height: 6.5rem;
  align-content: flex-start;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  min-height: 1.75rem;
}

.tags span {
  padding: 0.2rem 0.6rem;
  border: 1px solid color-mix(in srgb, var(--vp-c-brand-1) 28%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--vp-c-brand-1) 10%, var(--vp-c-bg));
  color: var(--vp-c-brand-1);
  font-size: 0.8rem;
}

.measured {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--vp-c-divider);
}

.measured dl {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 2.25rem;
  margin: 0;
}

.measured dt {
  margin-bottom: 0.15rem;
  color: var(--vp-c-text-3);
  font-size: 0.72rem;
}

.measured dd {
  margin: 0;
  color: var(--vp-c-text-1);
  font-size: 0.92rem;
}

.measured p {
  margin: 0.75rem 0 0;
  color: var(--vp-c-text-3);
  font-size: 0.76rem;
}

@media (max-width: 640px) {
  .playground-header {
    display: block;
  }

  .version {
    display: inline-block;
    margin-top: 0.5rem;
  }

  .mode-picker {
    flex: 1 1 100%;
  }
}
</style>
