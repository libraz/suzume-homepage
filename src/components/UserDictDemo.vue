<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { userDictSampleSource, userDictSampleText } from '@/data/demoSamples'
import { Suzume, type Morpheme } from '@/wasm/index.js'
import TokenChip from './TokenChip.vue'
import TokenOriginLegend from './TokenOriginLegend.vue'

const { isJa } = useI18n()

const source = ref(userDictSampleSource)
const input = ref(userDictSampleText)
const without = ref<Morpheme[]>([])
const withDict = ref<Morpheme[]>([])
const installed = ref(0)
const loadError = ref('')
const warnings = ref<string[]>([])
const loading = ref(true)
const fatal = ref('')

let suzume: Suzume | null = null
let debounce: ReturnType<typeof setTimeout> | undefined

// One instance serves both rows: clearUserDictionaries() drops every
// caller-loaded entry, so each run starts from the bundled dictionaries alone.
function run() {
  if (!suzume) return
  const text = input.value.trim()

  suzume.clearUserDictionaries()
  without.value = text ? suzume.analyze(text) : []

  installed.value = source.value.trim() ? suzume.loadUserDictionaryCount(source.value) : 0
  loadError.value = source.value.trim() && installed.value === 0 ? suzume.lastError : ''
  warnings.value = installed.value > 0 ? suzume.dictionaryWarnings : []
  withDict.value = text && installed.value > 0 ? suzume.analyze(text) : without.value
}

// Tab inserts a field separator; Shift+Tab still moves focus out.
function insertTab(event: KeyboardEvent) {
  const el = event.target as HTMLTextAreaElement
  const { selectionStart, selectionEnd, value } = el
  source.value = `${value.slice(0, selectionStart)}\t${value.slice(selectionEnd)}`
  requestAnimationFrame(() => el.setSelectionRange(selectionStart + 1, selectionStart + 1))
}

watch([source, input], () => {
  clearTimeout(debounce)
  debounce = setTimeout(run, 150)
})

onMounted(async () => {
  try {
    const wasmPath = new URL('../wasm/suzume.wasm', import.meta.url).href
    suzume = await Suzume.create({ wasmPath })
    loading.value = false
    run()
  } catch {
    loading.value = false
    fatal.value = isJa() ? 'Suzume WASM の読み込みに失敗しました。' : 'Failed to load Suzume WASM.'
  }
})

onUnmounted(() => {
  clearTimeout(debounce)
  suzume?.destroy()
  suzume = null
})

const label = computed(() => ({
  dict: isJa() ? 'ユーザー辞書（TSV）' : 'User dictionary (TSV)',
  dictHint: isJa()
    ? '1 行に 1 語、「表層形<TAB>品詞」の形式で書きます。Tab キーでタブ文字を入力でき、Shift+Tab で欄の外に移動します。'
    : 'One entry per line: surface<TAB>POS. Tab types a tab character; Shift+Tab leaves the field.',
  input: isJa() ? '入力' : 'Input',
  without: isJa() ? 'ユーザー辞書なし' : 'Without user dictionary',
  with: isJa() ? 'ユーザー辞書あり' : 'With user dictionary',
  loading: isJa() ? 'WASM を読み込み中...' : 'Loading WASM...',
  installed: (n: number) => (isJa() ? `${n} 件を登録しました` : `${n} ${n === 1 ? 'entry' : 'entries'} installed`),
  failed: isJa() ? '読み込みに失敗しました' : 'Load failed',
  empty: isJa() ? '辞書が空です' : 'Dictionary is empty',
}))

const status = computed(() => {
  if (loadError.value) return { kind: 'error', text: `${label.value.failed}: ${loadError.value}` }
  if (installed.value > 0) return { kind: 'ok', text: label.value.installed(installed.value) }
  return { kind: 'muted', text: label.value.empty }
})
</script>

<template>
  <section class="user-dict-demo sz-panel sz-demo">
    <div class="inputs">
      <label class="field">
        <span class="sz-label">{{ label.dict }}</span>
        <textarea
          v-model="source"
          rows="4"
          spellcheck="false"
          class="sz-input mono"
          @keydown.tab.exact.prevent="insertTab"
        />
        <small>{{ label.dictHint }}</small>
      </label>
      <label class="field">
        <span class="sz-label">{{ label.input }}</span>
        <textarea v-model="input" class="sz-input" rows="4" spellcheck="false" />
      </label>
    </div>

    <div class="results">
      <div v-if="loading" class="sz-status">{{ label.loading }}</div>
      <div v-else-if="fatal" class="sz-status" data-kind="error">{{ fatal }}</div>

      <template v-else>
        <div class="sz-status" :data-kind="status.kind" role="status">{{ status.text }}</div>
        <ul v-if="warnings.length" class="warnings">
          <li v-for="w in warnings" :key="w">{{ w }}</li>
        </ul>

        <div class="result-block">
          <div class="sz-label">{{ label.without }}</div>
          <div class="sz-tokens token-area">
            <TokenChip v-for="(m, i) in without" :key="`a-${m.surface}-${i}`" :morpheme="m" />
          </div>
        </div>

        <div class="result-block">
          <div class="sz-label">{{ label.with }}</div>
          <div class="sz-tokens token-area">
            <TokenChip v-for="(m, i) in withDict" :key="`b-${m.surface}-${i}`" :morpheme="m" />
          </div>
        </div>

        <TokenOriginLegend />
      </template>
    </div>
  </section>
</template>

<style scoped>
.user-dict-demo {
  margin: 1.5rem 0 2rem;
}

.inputs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem 1.25rem;
}

.field {
  display: grid;
  align-content: start;
}

.field small {
  margin-top: 0.45rem;
  color: var(--vp-c-text-3);
  font-size: 0.72rem;
  line-height: 1.55;
}

.field .sz-input {
  min-height: 7.5rem;
}

.sz-input.mono {
  font-family: var(--vp-font-family-mono);
  font-size: 0.85rem;
  tab-size: 12;
}

/* Reserved so the panel keeps its size while WASM loads. */
.results {
  min-height: 12rem;
  margin-top: 1.25rem;
}

.sz-status[data-kind='ok'] {
  color: var(--vp-c-text-2);
}

.warnings {
  margin: 0.35rem 0 0;
  padding: 0;
  list-style: none;
  color: var(--vp-c-warning-1);
  font-size: 0.75rem;
}

.warnings li {
  margin: 0;
}

.result-block {
  margin-top: 1.25rem;
}

.token-area {
  min-height: 3.4rem;
}

@media (max-width: 640px) {
  .inputs {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
