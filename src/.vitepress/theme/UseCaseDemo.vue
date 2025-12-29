<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useData } from 'vitepress'
import { Suzume, type Morpheme } from './suzume'

const { lang } = useData()

const t = computed(() => {
  const isJa = lang.value === 'ja'
  return {
    title: isJa ? 'ユースケース' : 'Use Cases',
    subtitle: isJa
      ? 'サーバー不要でリアルタイムに動作するデモをお試しください'
      : 'Try real-time demos that run entirely in your browser',
    // Tabs
    tagGen: isJa ? 'タグ生成' : 'Tag Generation',
    baseFormTab: isJa ? '正規化' : 'Normalize',
    analyzeTab: isJa ? 'トークン化' : 'Tokenize',
    // Tag generation
    tagTitle: isJa ? 'キーワード自動抽出' : 'Auto Keyword Extraction',
    tagDesc: isJa
      ? 'ブログ記事や商品説明からハッシュタグを自動生成'
      : 'Auto-generate hashtags from blog posts or product descriptions',
    tagPlaceholder: isJa
      ? '文章を入力してください...'
      : 'Enter text to extract keywords...',
    extractedTags: isJa ? '抽出されたタグ' : 'Extracted Tags',
    noTags: isJa ? 'タグが見つかりません' : 'No tags found',
    copyTags: isJa ? 'コピー' : 'Copy',
    copied: isJa ? 'コピー済み' : 'Copied!',
    // Normalize
    baseTitle: isJa ? '活用形 → 正規化形' : 'Conjugated → Normalized Form',
    baseDesc: isJa
      ? '動詞・形容詞を辞書形に正規化して検索インデックスに活用'
      : 'Normalize verbs and adjectives to dictionary form for search indexing',
    basePlaceholder: isJa
      ? '活用形を含む文章を入力...'
      : 'Enter text with conjugated words...',
    surface: isJa ? '表層形' : 'Surface',
    baseForm: isJa ? '正規化形' : 'Normalized',
    pos: isJa ? '品詞' : 'POS',
    // Tokenize
    analyzeTitle: isJa ? 'トークン化デモ' : 'Tokenization Demo',
    analyzeDesc: isJa
      ? '日本語テキストをトークン（言語単位）に分解'
      : 'Break Japanese text into linguistic tokens',
    analyzePlaceholder: isJa
      ? '日本語を入力してください...'
      : 'Enter Japanese text...',
    tokens: isJa ? 'トークン' : 'tokens',
    reading: isJa ? '読み' : 'Reading',
    // Loading
    loading: isJa ? '読み込み中...' : 'Loading...',
    // Examples
    examples: isJa ? '例文' : 'Examples',
  }
})

// Example texts (always Japanese - Suzume is for Japanese text)
const tagExamples = computed(() => {
  const isJa = lang.value === 'ja'
  return [
    {
      label: isJa ? 'ブログ記事' : 'Blog Post',
      text: '今日は東京で開催されたAIカンファレンスに参加してきました。機械学習や自然言語処理の最新トレンドについて学びました。'
    },
    {
      label: isJa ? '商品説明' : 'Product',
      text: '軽量で持ち運びに便利なワイヤレスイヤホン。ノイズキャンセリング機能搭載で、通勤や旅行に最適です。'
    }
  ]
})

const baseExamples = computed(() => {
  const isJa = lang.value === 'ja'
  return [
    {
      label: isJa ? '動詞の活用' : 'Verb Forms',
      text: '彼女は走って、食べて、寝ている。昨日は映画を見た。'
    },
    {
      label: isJa ? '形容詞' : 'Adjectives',
      text: 'この料理は美味しくて、値段も安かった。店員さんも親切だった。'
    }
  ]
})

const analyzeExamples = computed(() => {
  const isJa = lang.value === 'ja'
  return [
    {
      label: isJa ? '早口言葉' : 'Tongue twister',
      text: 'すもももももももものうち'
    },
    {
      label: isJa ? '坊っちゃん' : 'Botchan',
      text: '親譲りの無鉄砲で小供の時から損ばかりしている。小学校に居る時分学校の二階から飛び降りて一週間ほど腰を抜かした事がある。なぜそんな無闘をしたと聞く人があるかも知れぬ。別段深い理由でもない。'
    }
  ]
})

const activeTab = ref<'tag' | 'base' | 'analyze'>('analyze')
const tagInput = ref('')
const baseInput = ref('')
const analyzeInput = ref('')
const loading = ref(true)
const copiedTags = ref(false)

// Results (computed from watch)
const extractedTags = ref<{ text: string; count: number }[]>([])
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
  const tags: { text: string; count: number }[] = []
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
        tags.push({ text: compound, count: 1 })
      }

      i = j
    } else {
      i++
    }
  }

  extractedTags.value = tags.sort((a, b) => b.text.length - a.text.length).slice(0, 10)
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
    suzume = await Suzume.create()
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
      <h2>{{ t.title }}</h2>
      <p class="section-subtitle">{{ t.subtitle }}</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <span class="spinner"></span>
      {{ t.loading }}
    </div>

    <template v-else>
      <!-- Tabs -->
      <div class="tabs">
        <button
          :class="{ active: activeTab === 'analyze' }"
          @click="activeTab = 'analyze'"
        >
          {{ t.analyzeTab }}
        </button>
        <button
          :class="{ active: activeTab === 'tag' }"
          @click="activeTab = 'tag'"
        >
          {{ t.tagGen }}
        </button>
        <button
          :class="{ active: activeTab === 'base' }"
          @click="activeTab = 'base'"
        >
          {{ t.baseFormTab }}
        </button>
      </div>

      <!-- Analyze Demo -->
      <div v-if="activeTab === 'analyze'" class="demo-panel">
        <div class="demo-header">
          <h3>{{ t.analyzeTitle }}</h3>
          <p>{{ t.analyzeDesc }}</p>
        </div>

        <div class="examples-row">
          <span class="examples-label">{{ t.examples }}:</span>
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
          :placeholder="t.analyzePlaceholder"
          rows="2"
          class="demo-input"
        ></textarea>

        <div class="result-section">
          <div class="result-header">
            <span class="result-label">{{ analyzedMorphemes.length }} {{ t.tokens }}</span>
          </div>
          <div class="tokens-flow" v-if="analyzedMorphemes.length > 0">
            <div
              v-for="(m, i) in analyzedMorphemes"
              :key="i"
              class="token-card"
              :style="{ '--pos-color': getPosColor(m.pos) }"
            >
              <div class="token-surface">{{ m.surface }}</div>
              <div class="token-meta">
                <span class="token-pos">{{ lang === 'ja' ? m.posJa : m.pos }}</span>
                <span class="token-base" v-if="m.baseForm && m.baseForm !== m.surface">→{{ m.baseForm }}</span>
              </div>
            </div>
          </div>
          <div v-else class="no-result">{{ t.analyzePlaceholder }}</div>
        </div>
      </div>

      <!-- Tag Generation Demo -->
      <div v-if="activeTab === 'tag'" class="demo-panel">
        <div class="demo-header">
          <h3>{{ t.tagTitle }}</h3>
          <p>{{ t.tagDesc }}</p>
        </div>

        <div class="examples-row">
          <span class="examples-label">{{ t.examples }}:</span>
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
          :placeholder="t.tagPlaceholder"
          rows="3"
          class="demo-input"
        ></textarea>

        <div class="result-section">
          <div class="result-header">
            <span class="result-label">{{ t.extractedTags }}</span>
            <button
              v-if="extractedTags.length > 0"
              class="copy-btn"
              :class="{ copied: copiedTags }"
              @click="copyTags"
            >
              {{ copiedTags ? t.copied : t.copyTags }}
            </button>
          </div>
          <div class="tags-container" v-if="extractedTags.length > 0">
            <span
              v-for="tag in extractedTags"
              :key="tag.text"
              class="tag"
            >
              #{{ tag.text }}
            </span>
          </div>
          <div v-else class="no-result">{{ t.noTags }}</div>
        </div>
      </div>

      <!-- Base Form Demo -->
      <div v-if="activeTab === 'base'" class="demo-panel">
        <div class="demo-header">
          <h3>{{ t.baseTitle }}</h3>
          <p>{{ t.baseDesc }}</p>
        </div>

        <div class="examples-row">
          <span class="examples-label">{{ t.examples }}:</span>
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
          :placeholder="t.basePlaceholder"
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
              <span class="pos-badge" :class="item.pos">{{ lang === 'ja' ? item.posJa : item.pos }}</span>
            </div>
          </div>
          <div v-else class="no-result">{{ t.noTags }}</div>
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
  border-radius: 16px;
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

/* Token Flow (Analyze Tab) */
.tokens-flow {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.token-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  min-width: 6.5rem;
  padding: 0.5rem 0.75rem;
  background: color-mix(in srgb, var(--pos-color) 10%, var(--vp-c-bg));
  border: 1px solid color-mix(in srgb, var(--pos-color) 30%, transparent);
  border-left: 3px solid var(--pos-color);
  border-radius: 8px;
  transition: all 0.2s;
}

.token-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--pos-color) 20%, transparent);
}

.token-surface {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.token-meta {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.15rem;
}

.token-pos {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--pos-color);
  background: color-mix(in srgb, var(--pos-color) 15%, transparent);
  padding: 2px 0.375rem;
  border-radius: 4px;
}

.token-base {
  font-size: 0.65rem;
  color: var(--vp-c-text-3);
  font-weight: 500;
}

/* Responsive */
@media (max-width: 640px) {
  .tabs {
    flex-wrap: wrap;
  }

  .tabs button {
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
  }

  .demo-panel {
    padding: 1rem;
  }
}
</style>
