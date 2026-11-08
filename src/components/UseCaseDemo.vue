<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { analysisSampleTexts, baseFormSampleTexts, tagSampleTexts } from '@/data/demoSamples'
import { Suzume, type Morpheme, type Tag } from '@/wasm/index.js'
import TokenChip from './TokenChip.vue'
import { posCategory } from './tokenOrigin'

const { t, isJa } = useI18n()

// Example texts (always Japanese - Suzume is for Japanese text)
const tagExamples = computed(() => [
  {
    label: t('useCase.tagExamples.sns'),
    text: tagSampleTexts[0]
  },
  {
    label: t('useCase.tagExamples.tech'),
    text: tagSampleTexts[1]
  }
])

const baseExamples = computed(() => [
  {
    label: t('useCase.baseExamples.verb'),
    text: baseFormSampleTexts[0]
  },
  {
    label: t('useCase.baseExamples.adjective'),
    text: baseFormSampleTexts[1]
  },
  {
    label: t('useCase.baseExamples.colloquial'),
    text: baseFormSampleTexts[2]
  }
])

const analyzeExamples = computed(() => [
  {
    label: t('useCase.analyzeExamples.everyday'),
    text: analysisSampleTexts[0]
  },
  {
    label: t('useCase.analyzeExamples.colloquial'),
    text: analysisSampleTexts[1]
  },
  {
    label: t('useCase.analyzeExamples.dialect'),
    text: analysisSampleTexts[2]
  },
  {
    label: t('useCase.analyzeExamples.classical'),
    text: analysisSampleTexts[3]
  },
  {
    label: t('useCase.analyzeExamples.ambiguous'),
    text: analysisSampleTexts[4]
  }
])

const activeTab = ref<'tag' | 'base' | 'analyze'>('analyze')
const tagInput = ref('')
const baseInput = ref('')
const analyzeInput = ref('')
const loading = ref(true)
const copiedTags = ref(false)
const excludeBasic = ref(false)

// Results (computed from watch)
const extractedTags = ref<Tag[]>([])
const baseFormResults = ref<{ surface: string; baseForm: string; posJa: string; pos: string }[]>([])
const tabs = computed(() => [
  { key: 'analyze' as const, label: t('useCase.analyzeTab') },
  { key: 'tag' as const, label: t('useCase.tagGen') },
  { key: 'base' as const, label: t('useCase.baseFormTab') },
])
const analyzedMorphemes = ref<Morpheme[]>([])

let suzume: Suzume | null = null

// Analysis functions
function analyzeForTags(text: string) {
  if (!suzume || !text.trim()) {
    extractedTags.value = []
    return
  }

  extractedTags.value = suzume.generateTags(text, {
    excludeBasic: excludeBasic.value,
    maxTags: 12
  })
}

function analyzeForBaseForm(text: string) {
  if (!suzume || !text.trim()) {
    baseFormResults.value = []
    return
  }

  const morphemes = suzume.analyze(text)
  baseFormResults.value = morphemes
    .filter(m => {
      const pos = m.pos.toLowerCase()
      return pos === 'verb' || pos === 'adjective' || pos === 'adj'
    })
    .filter(m => m.surface !== m.baseForm)
    .map(m => ({
      surface: m.surface,
      baseForm: m.baseForm,
      posJa: m.posJa,
      pos: m.pos
    }))
}

function analyzeText(text: string) {
  if (!suzume || !text.trim()) {
    analyzedMorphemes.value = []
    return
  }
  analyzedMorphemes.value = suzume.analyze(text)
}

// Watch for input changes
watch(tagInput, (text) => analyzeForTags(text))
watch(excludeBasic, () => analyzeForTags(tagInput.value))
watch(baseInput, (text) => analyzeForBaseForm(text))
watch(analyzeInput, (text) => analyzeText(text))

onMounted(async () => {
  try {
    const wasmPath = new URL('../wasm/suzume.wasm', import.meta.url).href
    suzume = await Suzume.create({ wasmPath })
    loading.value = false
    // Set default examples and analyze
    tagInput.value = tagExamples.value[0].text
    baseInput.value = baseExamples.value[0].text
    analyzeInput.value = analyzeExamples.value[0].text
    // Trigger initial analysis
    analyzeForTags(tagInput.value)
    analyzeForBaseForm(baseInput.value)
    analyzeText(analyzeInput.value)
  } catch (e) {
    console.error('Failed to load WASM:', e)
    loading.value = false
  }
})

onUnmounted(() => {
  if (suzume) {
    suzume.destroy()
  }
})

async function copyTags() {
  const tagText = extractedTags.value.map(t => `#${t.tag}`).join(' ')
  await navigator.clipboard.writeText(tagText)
  copiedTags.value = true
  setTimeout(() => {
    copiedTags.value = false
  }, 2000)
}

function setTagExample(text: string) {
  tagInput.value = text
}

function setBaseExample(text: string) {
  baseInput.value = text
}

function setAnalyzeExample(text: string) {
  analyzeInput.value = text
}

</script>

<template>
  <section class="home-section usecase-section">
    <div class="home-section-head">
      <span class="home-eyebrow">{{ t('useCase.eyebrow') }}</span>
      <h2 class="home-heading">{{ t('useCase.title') }}</h2>
    </div>

    <div class="sz-seg tabs" role="tablist">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        role="tab"
        :aria-selected="activeTab === tab.key"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- The panel keeps one size across tabs and the loading state. -->
    <div class="demo-panel sz-panel sz-demo" role="tabpanel">
      <div v-if="loading" class="loading-state">
        <span class="spinner"></span>
        {{ t('useCase.loading') }}
      </div>

      <template v-else-if="activeTab === 'analyze'">
        <div class="demo-header">
          <h3>{{ t('useCase.analyzeTitle') }}</h3>
          <p>{{ t('useCase.analyzeDesc') }}</p>
        </div>

        <div class="sz-pills examples-row">
          <button
            v-for="ex in analyzeExamples"
            :key="ex.label"
            type="button"
            class="sz-pill"
            :aria-pressed="analyzeInput === ex.text"
            @click="setAnalyzeExample(ex.text)"
          >
            {{ ex.label }}
          </button>
        </div>

        <textarea
          v-model="analyzeInput"
          :aria-label="t('useCase.analyzeTitle')"
          :placeholder="t('useCase.analyzePlaceholder')"
          rows="2"
          class="sz-input"
        ></textarea>

        <div class="result-section">
          <div class="result-header">
            <span class="sz-label result-label">{{ analyzedMorphemes.length }} {{ t('useCase.tokens') }}</span>
          </div>
          <div v-if="analyzedMorphemes.length > 0" class="sz-tokens">
            <TokenChip v-for="(m, i) in analyzedMorphemes" :key="i" :morpheme="m" :show-origin="false" />
          </div>
          <div v-else class="no-result">{{ t('useCase.analyzePlaceholder') }}</div>
        </div>
      </template>

      <template v-else-if="activeTab === 'tag'">
        <div class="demo-header">
          <h3>{{ t('useCase.tagTitle') }}</h3>
          <p>{{ t('useCase.tagDesc') }}</p>
        </div>

        <div class="sz-pills examples-row">
          <button
            v-for="ex in tagExamples"
            :key="ex.label"
            type="button"
            class="sz-pill"
            :aria-pressed="tagInput === ex.text"
            @click="setTagExample(ex.text)"
          >
            {{ ex.label }}
          </button>
        </div>

        <textarea
          v-model="tagInput"
          :aria-label="t('useCase.tagTitle')"
          :placeholder="t('useCase.tagPlaceholder')"
          rows="2"
          class="sz-input"
        ></textarea>

        <div class="result-section">
          <div class="result-header">
            <span class="sz-label result-label">{{ t('useCase.extractedTags') }}</span>
            <div class="result-actions">
              <label class="sz-check" :title="t('useCase.excludeBasicTip')">
                <input v-model="excludeBasic" type="checkbox" />
                <span>{{ t('useCase.excludeBasic') }}</span>
              </label>
              <button type="button" class="copy-btn" :disabled="extractedTags.length === 0" @click="copyTags">
                {{ copiedTags ? t('useCase.copied') : t('useCase.copyTags') }}
              </button>
            </div>
          </div>
          <div v-if="extractedTags.length > 0" class="tags-container">
            <span
              v-for="tag in extractedTags"
              :key="tag.tag"
              class="tag"
              :data-pos="posCategory(tag.pos)"
            >
              #{{ tag.tag }}
            </span>
          </div>
          <div v-else class="no-result">{{ t('useCase.noTags') }}</div>
        </div>
      </template>

      <template v-else>
        <div class="demo-header">
          <h3>{{ t('useCase.baseTitle') }}</h3>
          <p>{{ t('useCase.baseDesc') }}</p>
        </div>

        <div class="sz-pills examples-row">
          <button
            v-for="ex in baseExamples"
            :key="ex.label"
            type="button"
            class="sz-pill"
            :aria-pressed="baseInput === ex.text"
            @click="setBaseExample(ex.text)"
          >
            {{ ex.label }}
          </button>
        </div>

        <textarea
          v-model="baseInput"
          :aria-label="t('useCase.baseTitle')"
          :placeholder="t('useCase.basePlaceholder')"
          rows="2"
          class="sz-input"
        ></textarea>

        <div class="result-section">
          <div v-if="baseFormResults.length > 0" class="conversion-list">
            <div v-for="(item, i) in baseFormResults" :key="i" class="conversion-item">
              <span class="surface">{{ item.surface }}</span>
              <span class="arrow" aria-hidden="true">→</span>
              <span class="base">{{ item.baseForm }}</span>
              <span class="pos-badge" :data-pos="posCategory(item.pos)">{{
                isJa() ? item.posJa : item.pos.toLowerCase()
              }}</span>
            </div>
          </div>
          <div v-else class="no-result">{{ t('useCase.noTags') }}</div>
        </div>
      </template>
    </div>
  </section>
</template>

<style scoped>
.tabs {
  max-width: 28rem;
  margin: 0 0 1rem;
}

.tabs > button {
  padding: 0.45rem 0.75rem;
  font-size: 0.875rem;
}

/* Fixed block size: the tallest tab fits, the others leave air, and the
   result list scrolls inside rather than resizing the panel. */
.demo-panel {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 25rem;
}

.loading-state {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: var(--vp-c-text-2);
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid var(--vp-c-border);
  border-top-color: var(--vp-c-brand-1);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.demo-header {
  margin-bottom: 1rem;
}

.vp-doc .demo-header h3 {
  margin: 0 0 0.25rem;
  color: var(--vp-c-text-1);
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.4;
}

.vp-doc .demo-header p {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 0.875rem;
  line-height: 1.6;
}

.examples-row {
  margin-bottom: 0.75rem;
}

.result-section {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--sz-radius-control);
  background: var(--vp-c-bg);
}

.result-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem 1rem;
  margin-bottom: 0.75rem;
}

.result-label {
  margin: 0;
  font-variant-numeric: tabular-nums;
}

.result-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.copy-btn {
  min-width: 4.5rem;
  padding: 0.25rem 0.6rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: calc(var(--sz-radius-control) - 2px);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
}

.copy-btn:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 50%, var(--vp-c-divider));
  color: var(--vp-c-brand-1);
}

.copy-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.tag {
  --tok: var(--vp-c-brand-1);
  padding: 0.3rem 0.7rem;
  border: 1px solid color-mix(in srgb, var(--tok) 28%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--tok) 10%, var(--vp-c-bg));
  color: var(--tok);
  font-size: 0.875rem;
  font-weight: 500;
}

.tag[data-pos='verb'],
.pos-badge[data-pos='verb'] { --tok: var(--sz-pos-verb); }
.tag[data-pos='adj'],
.pos-badge[data-pos='adj'] { --tok: var(--sz-pos-adj); }
.tag[data-pos='adv'],
.pos-badge[data-pos='adv'] { --tok: var(--sz-pos-adv); }

.no-result {
  padding: 1rem;
  color: var(--vp-c-text-3);
  font-size: 0.875rem;
  text-align: center;
}

.conversion-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.conversion-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: calc(var(--sz-radius-control) - 2px);
  background: var(--vp-c-bg-soft);
}

.conversion-item .surface {
  min-width: 5rem;
  color: var(--vp-c-text-1);
  font-weight: 600;
}

.conversion-item .arrow {
  color: var(--vp-c-text-3);
}

.conversion-item .base {
  min-width: 5rem;
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

.pos-badge {
  --tok: var(--sz-pos-other);
  margin-left: auto;
  padding: 0.1rem 0.5rem;
  border: 1px solid color-mix(in srgb, var(--tok) 28%, transparent);
  border-radius: var(--sz-radius-chip);
  background: color-mix(in srgb, var(--tok) 10%, var(--vp-c-bg));
  color: var(--tok);
  font-size: 0.7rem;
  font-weight: 600;
}

@media (max-width: 640px) {
  .tabs {
    max-width: none;
  }

  .tabs > button {
    font-size: 0.8rem;
  }

  .demo-panel {
    height: 34rem;
  }

  .result-section {
    padding: 0.75rem;
  }

  .conversion-item .surface,
  .conversion-item .base {
    min-width: 3.75rem;
  }
}
</style>
