<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { Suzume, type Morpheme } from '@/wasm/index.js'

const { t, isJa } = useI18n()

// Example texts (always Japanese - Suzume is for Japanese text)
const tagExamples = computed(() => [
  {
    label: t('useCase.tagExamples.sns'),
    text: '推しのライブがエモすぎて泣いた。歌が上手いし踊りもキレキレでマジで尊い。来年も絶対行く！'
  },
  {
    label: t('useCase.tagExamples.blog'),
    text: '今日は東京で開催されたAIカンファレンスに参加してきました。機械学習や自然言語処理の最新トレンドについて学びました。'
  }
])

const baseExamples = computed(() => [
  {
    label: t('useCase.baseExamples.verb'),
    text: '彼女は走って、食べて、寝ている。昨日は映画を見た。'
  },
  {
    label: t('useCase.baseExamples.adjective'),
    text: 'この料理は美味しくて、値段も安かった。店員さんも親切だった。'
  }
])

const analyzeExamples = computed(() => [
  {
    label: t('useCase.analyzeExamples.youth'),
    text: 'それな〜！マジでエモいしバズってるよね。推しが尊すぎてしんどい。'
  },
  {
    label: t('useCase.analyzeExamples.tongue'),
    text: 'すもももももももものうち'
  },
  {
    label: t('useCase.analyzeExamples.botchan'),
    text: '親譲りの無鉄砲で小供の時から損ばかりしている。小学校に居る時分学校の二階から飛び降りて一週間ほど腰を抜かした事がある。なぜそんな無闘をしたと聞く人があるかも知れぬ。別段深い理由でもない。'
  }
])

const activeTab = ref<'tag' | 'base' | 'analyze'>('analyze')
const tagInput = ref('')
const baseInput = ref('')
const analyzeInput = ref('')
const loading = ref(true)
const copiedTags = ref(false)

// Results (computed from watch)
const extractedTags = ref<{ text: string; count: number; type: 'noun' | 'verb' | 'adj' }[]>([])
const baseFormResults = ref<{ surface: string; baseForm: string; posJa: string; pos: string }[]>([])
const analyzedMorphemes = ref<Morpheme[]>([])

let suzume: Suzume | null = null

// Analysis functions
function analyzeForTags(text: string) {
  if (!suzume || !text.trim()) {
    extractedTags.value = []
    return
  }

  const morphemes = suzume.analyze(text)
  const tags: { text: string; count: number; type: 'noun' | 'verb' | 'adj' }[] = []
  const seen = new Set<string>()

  let i = 0
  while (i < morphemes.length) {
    const m = morphemes[i]
    const pos = m.pos.toLowerCase()

    // Check for noun chains (compound nouns)
    if (pos === 'noun' || pos === 'prefix') {
      let compound = m.surface
      let j = i + 1

      while (j < morphemes.length) {
        const next = morphemes[j]
        const nextPos = next.pos.toLowerCase()
        if (nextPos === 'noun' || nextPos === 'suffix') {
          compound += next.surface
          j++
        } else {
          break
        }
      }

      if (compound.length >= 2 && !seen.has(compound)) {
        seen.add(compound)
        tags.push({ text: compound, count: 1, type: 'noun' })
      }

      i = j
    }
    // Add verb base forms
    else if (pos === 'verb' && m.baseForm && m.baseForm.length >= 2 && !seen.has(m.baseForm)) {
      seen.add(m.baseForm)
      tags.push({ text: m.baseForm, count: 1, type: 'verb' })
      i++
    }
    // Add adjective base forms
    else if ((pos === 'adjective' || pos === 'adj') && m.baseForm && m.baseForm.length >= 2 && !seen.has(m.baseForm)) {
      seen.add(m.baseForm)
      tags.push({ text: m.baseForm, count: 1, type: 'adj' })
      i++
    }
    else {
      i++
    }
  }

  extractedTags.value = tags.slice(0, 12)
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
      pos: m.pos.toLowerCase()
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
watch(baseInput, (text) => analyzeForBaseForm(text))
watch(analyzeInput, (text) => analyzeText(text))

onMounted(async () => {
  try {
    const wasmPath = new URL('../wasm/suzume-wasm.wasm', import.meta.url).href
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
  const tagText = extractedTags.value.map(t => `#${t.text}`).join(' ')
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

// POS color mapping
function getPosColor(pos: string): string {
  const colors: Record<string, string> = {
    noun: '#B45309',
    verb: '#059669',
    adjective: '#DC2626',
    adj: '#DC2626',
    adverb: '#7C3AED',
    particle: '#0891B2',
    auxiliary: '#4F46E5',
    aux: '#4F46E5',
    symbol: '#6B7280',
    punct: '#6B7280',
    other: '#6B7280',
  }
  return colors[pos.toLowerCase()] || '#6B7280'
}
</script>

<template>
  <div class="usecase-section">
    <div class="section-header">
      <h2>{{ t('useCase.title') }}</h2>
      <p class="section-subtitle">{{ t('useCase.subtitle') }}</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <span class="spinner"></span>
      {{ t('useCase.loading') }}
    </div>

    <template v-else>
      <!-- Tabs -->
      <div class="tabs">
        <button
          :class="{ active: activeTab === 'analyze' }"
          @click="activeTab = 'analyze'"
        >
          {{ t('useCase.analyzeTab') }}
        </button>
        <button
          :class="{ active: activeTab === 'tag' }"
          @click="activeTab = 'tag'"
        >
          {{ t('useCase.tagGen') }}
        </button>
        <button
          :class="{ active: activeTab === 'base' }"
          @click="activeTab = 'base'"
        >
          {{ t('useCase.baseFormTab') }}
        </button>
      </div>

      <!-- Analyze Demo -->
      <div v-if="activeTab === 'analyze'" class="demo-panel">
        <div class="demo-header">
          <h3>{{ t('useCase.analyzeTitle') }}</h3>
          <p>{{ t('useCase.analyzeDesc') }}</p>
        </div>

        <div class="examples-row">
          <span class="examples-label">{{ t('useCase.examples') }}:</span>
          <button
            v-for="ex in analyzeExamples"
            :key="ex.label"
            class="example-chip"
            :class="{ active: analyzeInput === ex.text }"
            @click="setAnalyzeExample(ex.text)"
          >
            {{ ex.label }}
          </button>
        </div>

        <textarea
          v-model="analyzeInput"
          :placeholder="t('useCase.analyzePlaceholder')"
          rows="2"
          class="demo-input"
        ></textarea>

        <div class="result-section">
          <div class="result-header">
            <span class="result-label">{{ analyzedMorphemes.length }} {{ t('useCase.tokens') }}</span>
          </div>
          <div class="morpheme-strip" v-if="analyzedMorphemes.length > 0">
            <div
              v-for="(m, i) in analyzedMorphemes"
              :key="i"
              class="morpheme-block"
              :style="{ '--pos-color': getPosColor(m.pos) }"
            >
              <span class="surface">{{ m.surface }}</span>
              <span class="underline"></span>
              <span class="chip">
                <span class="pos">{{ isJa() ? m.posJa : m.pos }}</span>
                <span class="base" v-if="m.baseForm && m.baseForm !== m.surface">→{{ m.baseForm }}</span>
              </span>
            </div>
          </div>
          <div v-else class="no-result">{{ t('useCase.analyzePlaceholder') }}</div>
        </div>
      </div>

      <!-- Tag Generation Demo -->
      <div v-if="activeTab === 'tag'" class="demo-panel">
        <div class="demo-header">
          <h3>{{ t('useCase.tagTitle') }}</h3>
          <p>{{ t('useCase.tagDesc') }}</p>
        </div>

        <div class="examples-row">
          <span class="examples-label">{{ t('useCase.examples') }}:</span>
          <button
            v-for="ex in tagExamples"
            :key="ex.label"
            class="example-chip"
            :class="{ active: tagInput === ex.text }"
            @click="setTagExample(ex.text)"
          >
            {{ ex.label }}
          </button>
        </div>

        <textarea
          v-model="tagInput"
          :placeholder="t('useCase.tagPlaceholder')"
          rows="3"
          class="demo-input"
        ></textarea>

        <div class="result-section">
          <div class="result-header">
            <span class="result-label">{{ t('useCase.extractedTags') }}</span>
            <button
              v-if="extractedTags.length > 0"
              class="copy-btn"
              :class="{ copied: copiedTags }"
              @click="copyTags"
            >
              {{ copiedTags ? t('useCase.copied') : t('useCase.copyTags') }}
            </button>
          </div>
          <div class="tags-container" v-if="extractedTags.length > 0">
            <span
              v-for="tag in extractedTags"
              :key="tag.text"
              class="tag"
              :class="tag.type"
            >
              #{{ tag.text }}
            </span>
          </div>
          <div v-else class="no-result">{{ t('useCase.noTags') }}</div>
        </div>
      </div>

      <!-- Base Form Demo -->
      <div v-if="activeTab === 'base'" class="demo-panel">
        <div class="demo-header">
          <h3>{{ t('useCase.baseTitle') }}</h3>
          <p>{{ t('useCase.baseDesc') }}</p>
        </div>

        <div class="examples-row">
          <span class="examples-label">{{ t('useCase.examples') }}:</span>
          <button
            v-for="ex in baseExamples"
            :key="ex.label"
            class="example-chip"
            :class="{ active: baseInput === ex.text }"
            @click="setBaseExample(ex.text)"
          >
            {{ ex.label }}
          </button>
        </div>

        <textarea
          v-model="baseInput"
          :placeholder="t('useCase.basePlaceholder')"
          rows="3"
          class="demo-input"
        ></textarea>

        <div class="result-section">
          <div class="conversion-list" v-if="baseFormResults.length > 0">
            <div
              v-for="(item, i) in baseFormResults"
              :key="i"
              class="conversion-item"
            >
              <span class="surface">{{ item.surface }}</span>
              <span class="arrow">→</span>
              <span class="base">{{ item.baseForm }}</span>
              <span class="pos-badge" :class="item.pos">{{ isJa() ? item.posJa : item.pos }}</span>
            </div>
          </div>
          <div v-else class="no-result">{{ t('useCase.noTags') }}</div>
        </div>
      </div>

    </template>
  </div>
</template>

<style scoped>
.usecase-section {
  margin: 3rem 0;
}

.section-header {
  text-align: center;
  margin-bottom: 2rem;
}

.section-header h2 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin: 0 0 0.5rem 0;
}

.section-subtitle {
  font-size: 1rem;
  color: var(--vp-c-text-2);
  margin: 0;
}

/* Loading */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem;
  color: var(--vp-c-text-2);
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--vp-c-border);
  border-top-color: var(--vp-c-brand-1);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Tabs */
.tabs {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.tabs button {
  padding: 0.625rem 1.25rem;
  font-size: 0.9rem;
  font-weight: 500;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.2s;
}

.tabs button:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.tabs button.active {
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  color: white;
}

/* Demo Panel */
.demo-panel {
  padding: 1.5rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
}

.demo-header {
  margin-bottom: 1rem;
}

.demo-header h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0 0 0.25rem 0;
}

.demo-header p {
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
  margin: 0;
}

/* Examples */
.examples-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.examples-label {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
  font-weight: 500;
}

.example-chip {
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid var(--vp-c-border);
  border-radius: 100px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.2s;
}

.example-chip:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.example-chip.active {
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  color: white;
}

/* Input */
.demo-input {
  width: 100%;
  padding: 0.875rem 1rem;
  font-size: 1rem;
  border: 2px solid var(--vp-c-border);
  border-radius: 12px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  resize: vertical;
  font-family: inherit;
  line-height: 1.5;
  transition: all 0.2s;
}

.demo-input:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 3px var(--vp-c-brand-soft);
}

/* Result Section */
.result-section {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--vp-c-bg);
  border-radius: 12px;
  border: 1px solid var(--vp-c-border);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.result-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.copy-btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.2s;
}

.copy-btn:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.copy-btn.copied {
  background: var(--vp-c-green-soft);
  border-color: #059669;
  color: #059669;
}

/* Tags */
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  padding: 0.375rem 0.75rem;
  font-size: 0.9rem;
  font-weight: 500;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  border-radius: 100px;
  border: 1px solid color-mix(in srgb, var(--vp-c-brand-1) 30%, transparent);
}

.tag.noun {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 30%, transparent);
}

.tag.verb {
  background: rgba(5, 150, 105, 0.1);
  color: #059669;
  border-color: rgba(5, 150, 105, 0.3);
}

.tag.adj {
  background: rgba(220, 38, 38, 0.1);
  color: #DC2626;
  border-color: rgba(220, 38, 38, 0.3);
}

.no-result {
  text-align: center;
  padding: 1rem;
  color: var(--vp-c-text-3);
  font-size: 0.9rem;
}

/* Base Form Conversion */
.conversion-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.conversion-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
}

.conversion-item .surface {
  font-weight: 600;
  color: var(--vp-c-text-1);
  min-width: 80px;
}

.conversion-item .arrow {
  color: var(--vp-c-text-3);
}

.conversion-item .base {
  font-weight: 600;
  color: var(--vp-c-brand-1);
  min-width: 80px;
}

.pos-badge {
  margin-left: auto;
  padding: 0.125rem 0.5rem;
  font-size: 0.7rem;
  font-weight: 600;
  border-radius: 4px;
}

.pos-badge.verb {
  background: rgba(5, 150, 105, 0.12);
  color: #059669;
}

.pos-badge.adjective,
.pos-badge.adj {
  background: rgba(220, 38, 38, 0.12);
  color: #DC2626;
}

/* Morpheme Strip (Analyze Tab) - matches TypewriterDemo style */
.morpheme-strip {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.125rem;
}

.morpheme-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.morpheme-block .surface {
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--vp-c-text-1);
  letter-spacing: 0.02em;
  white-space: nowrap;
  line-height: 1.3;
}

.morpheme-block .underline {
  width: 100%;
  height: 2px;
  background: var(--pos-color);
  margin: 0.2rem 0;
}

.morpheme-block .chip {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.1rem 0.375rem;
  background: color-mix(in srgb, var(--pos-color) 10%, var(--vp-c-bg));
  border: 1px solid color-mix(in srgb, var(--pos-color) 25%, transparent);
  border-radius: 4px;
  white-space: nowrap;
}

.morpheme-block .pos {
  color: var(--pos-color);
  font-weight: 500;
  font-size: 0.65rem;
}

.morpheme-block .base {
  color: var(--vp-c-text-3);
  font-size: 0.6rem;
}

/* Responsive */
@media (max-width: 640px) {
  .usecase-section {
    margin: 2rem 0;
  }

  .section-header h2 {
    font-size: 1.5rem;
  }

  .section-subtitle {
    font-size: 0.9rem;
  }

  .tabs {
    flex-wrap: wrap;
    gap: 0.375rem;
  }

  .tabs button {
    padding: 0.5rem 0.875rem;
    font-size: 0.8rem;
    flex: 1;
    min-width: 80px;
  }

  .demo-panel {
    padding: 1rem;
    border-radius: 10px;
  }

  .demo-header h3 {
    font-size: 1rem;
  }

  .demo-header p {
    font-size: 0.8rem;
  }

  .demo-input {
    font-size: 0.9rem;
    padding: 0.75rem;
  }

  .result-section {
    padding: 0.75rem;
  }

  .morpheme-block .surface {
    font-size: 1.1rem;
  }

  .morpheme-block .chip {
    padding: 0.1rem 0.25rem;
  }

  .morpheme-block .pos {
    font-size: 0.6rem;
  }

  .morpheme-block .base {
    font-size: 0.55rem;
  }

  .conversion-item {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .conversion-item .surface,
  .conversion-item .base {
    min-width: 60px;
  }

  .pos-badge {
    margin-left: 0;
  }
}
</style>
