<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { typewriterSampleTexts } from '@/data/demoSamples'
import { Suzume, type Morpheme } from '@/wasm/index.js'

const { t, isJa } = useI18n()

const sentences = typewriterSampleTexts

const currentText = ref('')
const displayedMorphemes = ref<Morpheme[]>([])
const loading = ref(true)

let suzume: Suzume | null = null
let preAnalyzedSentences: { text: string; morphemes: Morpheme[] }[] = []
let sentenceIndex = 0
let morphemeIndex = 0
let typingTimeout: ReturnType<typeof setTimeout> | null = null

const MORPHEME_SPEED = 300 // ms per morpheme
const PAUSE_AFTER_PERIOD = 2500 // ms to pause after 。

const containerRef = ref<HTMLElement | null>(null)

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
    symbol: '#9CA3AF',
    punct: '#9CA3AF',
    prefix: '#B45309',
    suffix: '#B45309',
  }
  return colors[pos.toLowerCase()] || '#6B7280'
}

function preAnalyze() {
  if (!suzume) return

  preAnalyzedSentences = sentences.map(sentence => ({
    text: sentence,
    morphemes: suzume!.analyze(sentence),
  }))
}

function typeNextMorpheme() {
  const sentence = preAnalyzedSentences[sentenceIndex]

  if (morphemeIndex < sentence.morphemes.length) {
    const morpheme = sentence.morphemes[morphemeIndex]
    currentText.value += morpheme.surface
    displayedMorphemes.value.push(morpheme)
    morphemeIndex++

    // Scroll container to the right
    nextTick(() => {
      if (containerRef.value) {
        containerRef.value.scrollLeft = containerRef.value.scrollWidth
      }
    })

    // Check if we've finished this sentence
    if (morphemeIndex >= sentence.morphemes.length) {
      // Pause, then reset for next sentence
      typingTimeout = setTimeout(() => {
        currentText.value = ''
        displayedMorphemes.value = []
        morphemeIndex = 0
        sentenceIndex = (sentenceIndex + 1) % preAnalyzedSentences.length
        scheduleNextMorpheme()
      }, PAUSE_AFTER_PERIOD)
    } else {
      scheduleNextMorpheme()
    }
  }
}

function scheduleNextMorpheme() {
  typingTimeout = setTimeout(typeNextMorpheme, MORPHEME_SPEED)
}

function stopTyping() {
  if (typingTimeout) {
    clearTimeout(typingTimeout)
    typingTimeout = null
  }
}

onMounted(async () => {
  try {
    const wasmPath = new URL('../wasm/suzume.wasm', import.meta.url).href
    suzume = await Suzume.create({ wasmPath })
    preAnalyze()
    loading.value = false
    scheduleNextMorpheme()
  } catch (e) {
    console.error('Failed to load WASM:', e)
    loading.value = false
  }
})

onUnmounted(() => {
  stopTyping()
  if (suzume) {
    suzume.destroy()
  }
})
</script>

<template>
  <section class="home-section typewriter-section">
    <div class="home-section-head tw-head">
      <div>
        <span class="home-eyebrow">{{ t('typewriter.eyebrow') }}</span>
        <h2 class="home-heading">{{ t('typewriter.title') }}</h2>
      </div>
      <span class="source">{{ t('typewriter.source') }}</span>
    </div>

    <div v-if="loading" class="loading-state">
      <span class="spinner"></span>
    </div>

    <div v-else class="typewriter-container" ref="containerRef">
      <div class="morpheme-inline-strip">
        <div
          v-for="(m, i) in displayedMorphemes"
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
        <span class="cursor">|</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.tw-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
}

.source {
  flex-shrink: 0;
  font-size: 0.78rem;
  color: var(--vp-c-text-3);
  font-style: italic;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
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

.typewriter-container {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.typewriter-container::-webkit-scrollbar {
  display: none;
}

.morpheme-inline-strip {
  display: flex;
  align-items: flex-start;
  gap: 0.125rem;
  min-height: 4.5rem;
}

.morpheme-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.morpheme-block .surface {
  font-size: 1.5rem;
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

.cursor {
  font-size: 1.5rem;
  font-weight: 300;
  color: var(--vp-c-brand-1);
  animation: blink 1s step-end infinite;
  margin-left: 2px;
  flex-shrink: 0;
  align-self: flex-start;
  line-height: 1.3;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* Responsive */
@media (max-width: 640px) {
  .tw-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.35rem;
  }

  .typewriter-container {
    padding: 1rem;
    border-radius: 10px;
  }

  .morpheme-inline-strip {
    min-height: 4rem;
  }

  .morpheme-block .surface {
    font-size: 1.25rem;
  }

  .cursor {
    font-size: 1.25rem;
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
}
</style>
