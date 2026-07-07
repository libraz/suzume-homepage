<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { Suzume, type Morpheme, type Tag } from '@/wasm/index.js'

const { isJa } = useI18n()

const examples = computed(() => [
  {
    label: isJa() ? '活用の復元' : 'Conjugation',
    text: '昨日ラーメンを食べさせられなかった',
  },
  {
    label: isJa() ? '未知語' : 'Unknown words',
    text: '生成AIカンファレンスで新しいSDKを試した',
  },
  {
    label: isJa() ? 'タグ抽出' : 'Tags',
    text: '東京スカイツリーに行って夜景を撮影しました',
  },
])

const input = ref(examples.value[0].text)
const morphemes = ref<Morpheme[]>([])
const tags = ref<Tag[]>([])
const loading = ref(true)
const error = ref('')
const version = ref('')

let suzume: Suzume | null = null
let debounce: ReturnType<typeof setTimeout> | undefined

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
  } catch {
    error.value = isJa() ? '解析に失敗しました。' : 'Analysis failed.'
  }
}

watch(input, () => {
  clearTimeout(debounce)
  debounce = setTimeout(analyze, 120)
})

onMounted(async () => {
  try {
    const wasmPath = new URL('../wasm/suzume-wasm.wasm', import.meta.url).href
    suzume = await Suzume.create({ wasmPath })
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
}))
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
  padding: 0.75rem;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font: inherit;
  line-height: 1.6;
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

@media (max-width: 640px) {
  .playground-header {
    display: block;
  }

  .version {
    display: inline-block;
    margin-top: 0.5rem;
  }
}
</style>
