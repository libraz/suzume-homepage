<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { typewriterSampleTexts } from '@/data/demoSamples'
import { Suzume, type Morpheme } from '@/wasm/index.js'
import TokenChip from './TokenChip.vue'

const { t } = useI18n()

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

    <div class="typewriter-container sz-demo" ref="containerRef">
      <div v-if="loading" class="tw-loading" aria-hidden="true"></div>
      <div v-else class="sz-tokens tw-strip">
        <TokenChip
          v-for="(m, i) in displayedMorphemes"
          :key="i"
          :morpheme="m"
          :show-origin="false"
        />
        <span class="cursor" aria-hidden="true">|</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.tw-head {
  max-width: none;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
}

.source {
  flex-shrink: 0;
  color: var(--vp-c-text-3);
  font-size: 0.78rem;
}

/* Height is fixed so the strip never grows or collapses between sentences. */
.typewriter-container {
  --sz-token-size: 1.5rem;
  box-sizing: border-box;
  height: 6.25rem;
  padding: 1.25rem 1.5rem;
  border: 1px solid var(--vp-c-border);
  border-radius: var(--sz-radius-panel);
  background: var(--vp-c-bg-soft);
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
}

.typewriter-container::-webkit-scrollbar {
  display: none;
}

.tw-strip {
  flex-wrap: nowrap;
  gap: 0 0.25rem;
}

.cursor {
  flex-shrink: 0;
  margin-left: 2px;
  color: var(--vp-c-brand-1);
  font-size: var(--sz-token-size);
  font-weight: 300;
  line-height: 1.3;
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .cursor {
    animation: none;
  }
}

@media (max-width: 640px) {
  .tw-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.35rem;
  }

  .typewriter-container {
    --sz-token-size: 1.25rem;
    height: 5.5rem;
    padding: 1rem;
  }
}
</style>
