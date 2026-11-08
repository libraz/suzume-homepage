<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { SUZUME_VERSION, WASM_COMMIT_HASH, WASM_GZIP_KB, WASM_SIZE_KB } from '@/wasm/metadata'

const { t, isJa } = useI18n()

const repoUrl = 'https://github.com/libraz/suzume'
const buildLink = `${repoUrl}/commit/${WASM_COMMIT_HASH}`
const runtimes = ['Browser', 'Node.js', 'Deno', 'Bun', 'Python', 'Go', 'C/C++']

type RuntimeKey = 'js' | 'python' | 'go' | 'cpp'

// One install line and one minimal program per runtime. Every snippet is
// padded to the same line count by the box height, so switching never resizes.
const installs: { key: RuntimeKey; label: string; command: string; guide: string; snippet: string }[] = [
  {
    key: 'js',
    label: 'JavaScript',
    command: 'npm install @libraz/suzume',
    guide: 'installation',
    snippet: `import { Suzume } from '@libraz/suzume'

const suzume = await Suzume.create()
for (const m of suzume.analyze('東京都に住んでいます'))
  console.log(m.surface, m.pos, m.baseForm)`,
  },
  {
    key: 'python',
    label: 'Python',
    command: 'pip install suzume',
    guide: 'python',
    snippet: `from suzume import Suzume

with Suzume() as sz:
    for m in sz.analyze("東京都に住んでいます"):
        print(m.surface, m.pos, m.base_form)`,
  },
  {
    key: 'go',
    label: 'Go',
    command: 'git clone https://github.com/libraz/go-suzume.git && make -C go-suzume lib',
    guide: 'go',
    snippet: `analyzer, err := suzume.New()
if err != nil { log.Fatal(err) }
defer analyzer.Close()
for _, m := range analyzer.Analyze("東京都に住んでいます") {
  fmt.Println(m.Surface, m.POS, m.BaseForm)
}`,
  },
  {
    key: 'cpp',
    label: 'C++',
    command: 'git clone https://github.com/libraz/suzume.git && make -C suzume install',
    guide: 'cpp',
    snippet: `#include "suzume/suzume.hpp"

suzume::Tokenizer tokenizer;
for (const suzume::Morpheme& m : tokenizer.analyze("東京都に住んでいます"))
  std::printf("%s\\t%s\\n", m.surface.c_str(), m.pos.c_str());`,
  },
]

const active = ref<RuntimeKey>('js')
const current = computed(() => installs.find((i) => i.key === active.value) ?? installs[0])
const guideHref = computed(() => `${isJa() ? '/ja' : ''}/docs/${current.value.guide}`)
const perfHref = computed(() => `${isJa() ? '/ja' : ''}/docs/performance`)

const copied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | undefined

async function copy() {
  await navigator.clipboard.writeText(current.value.command)
  copied.value = true
  clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => (copied.value = false), 1600)
}

onUnmounted(() => clearTimeout(copiedTimer))
</script>

<template>
  <section class="home-quick" :aria-label="t('homeHero.ariaLabel')">
    <div class="quick-main">
      <div class="sz-seg" role="radiogroup" :aria-label="t('homeHero.runtimeLabel')">
        <button
          v-for="item in installs"
          :key="item.key"
          type="button"
          role="radio"
          :aria-checked="active === item.key"
          @click="active = item.key"
        >
          {{ item.label }}
        </button>
      </div>
      <div class="code-box">
        <div class="command">
          <code><span class="prompt" aria-hidden="true">$</span>{{ current.command }}</code>
          <button type="button" class="copy" @click="copy">
            {{ copied ? t('homeHero.copied') : t('homeHero.copy') }}
          </button>
        </div>
        <pre class="snippet"><code>{{ current.snippet }}</code></pre>
      </div>
      <p class="install-note">
        {{ t(`homeHero.notes.${current.key}`) }}
        <a :href="guideHref">{{ t('homeHero.guideLink') }} →</a>
      </p>
    </div>

    <dl class="facts">
      <div class="fact">
        <dt>{{ t('homeHero.sizeLabel') }}</dt>
        <dd>
          <span class="fact-value sz-num">{{ WASM_GZIP_KB }} KiB</span>
          <span class="fact-note">{{ t('homeHero.sizeNote', { n: String(WASM_SIZE_KB) }) }}</span>
        </dd>
      </div>
      <div class="fact">
        <dt>{{ t('homeHero.runtimesLabel') }}</dt>
        <dd>
          <span class="fact-value">{{ runtimes.join(' · ') }}</span>
        </dd>
      </div>
      <div class="fact">
        <dt>{{ t('homeHero.licenseLabel') }}</dt>
        <dd>
          <span class="fact-value">Apache-2.0</span>
          <a class="fact-note" :href="repoUrl" target="_blank" rel="noopener">{{ t('homeHero.licenseNote') }} ↗</a>
        </dd>
      </div>
      <div class="fact">
        <dt>{{ t('homeHero.releaseLabel') }}</dt>
        <dd>
          <span class="fact-value sz-num">v{{ SUZUME_VERSION }} <span class="beta">{{ t('homeHero.beta') }}</span></span>
          <a class="fact-note sz-num" :href="buildLink" target="_blank" rel="noopener">{{
            t('homeHero.buildNote', { hash: WASM_COMMIT_HASH.slice(0, 8) })
          }} ↗</a>
        </dd>
      </div>
      <div class="fact">
        <dt>{{ t('homeHero.benchLabel') }}</dt>
        <dd>
          <a class="fact-value" :href="perfHref">{{ t('homeHero.benchLink') }} →</a>
        </dd>
      </div>
    </dl>
  </section>
</template>

<style scoped>
.home-quick {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
  gap: 2.5rem;
  width: 100%;
  max-width: var(--home-section-max-width);
  margin: 0 auto;
}

.code-box {
  margin-top: 0.6rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--sz-radius-control);
  background: var(--vp-c-bg-soft);
  overflow: hidden;
}

.command {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.35rem 0.35rem 0.9rem;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
}

.command code {
  flex: 1 1 auto;
  min-width: 0;
  overflow-x: auto;
  padding: 0;
  background: none;
  color: var(--vp-c-text-1);
  font-family: var(--vp-font-family-mono);
  font-size: 0.82rem;
  line-height: 1.9;
  white-space: nowrap;
  scrollbar-width: none;
}

.prompt {
  margin-right: 0.6rem;
  color: var(--vp-c-text-3);
  user-select: none;
}

.copy {
  flex: 0 0 auto;
  min-width: 5.5rem;
  padding: 0.25rem 0.7rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: calc(var(--sz-radius-control) - 2px);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
}

.copy:hover {
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 50%, var(--vp-c-divider));
  color: var(--vp-c-brand-1);
}

.copy:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 1px;
}

/* Six lines tall for every runtime, so switching never moves the page. */
.vp-doc .snippet {
  box-sizing: content-box;
  height: calc(6 * 1.7em);
  margin: 0;
  padding: 0.8rem 0.9rem;
  overflow: auto;
  background: transparent;
  font-size: 0.78rem;
  line-height: 1.7;
  scrollbar-width: thin;
}

.vp-doc .snippet code {
  padding: 0;
  background: none;
  color: var(--vp-c-text-1);
  font-family: var(--vp-font-family-mono);
  font-size: inherit;
  white-space: pre;
}

/* Two lines reserved so switching runtimes never moves the layout. */
.vp-doc .install-note {
  min-height: 3.2em;
  margin: 0.6rem 0 0;
  color: var(--vp-c-text-2);
  font-size: 0.78rem;
  line-height: 1.6;
}

.install-note a {
  white-space: nowrap;
}

.facts {
  display: grid;
  align-content: start;
  margin: 0;
}

.fact {
  display: grid;
  grid-template-columns: 7rem minmax(0, 1fr);
  gap: 1rem;
  padding: 0.55rem 0;
  border-top: 1px solid var(--vp-c-divider);
}

.fact:first-child {
  border-top: 0;
  padding-top: 0.3rem;
}

.fact dt {
  color: var(--vp-c-text-3);
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.6;
}

.fact dd {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  margin: 0;
  min-width: 0;
}

.fact-value {
  color: var(--vp-c-text-1);
  font-size: 0.85rem;
  font-weight: 600;
  line-height: 1.5;
}

a.fact-value {
  color: var(--vp-c-brand-1);
  font-weight: 500;
  text-decoration: none;
}

.fact-note {
  color: var(--vp-c-text-3);
  font-size: 0.74rem;
  line-height: 1.5;
  text-decoration: none;
}

a.fact-note:hover,
a.fact-value:hover {
  color: var(--vp-c-brand-1);
  text-decoration: underline;
}

.beta {
  margin-left: 0.35rem;
  padding: 0.05rem 0.4rem;
  border: 1px solid color-mix(in srgb, var(--vp-c-brand-1) 28%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--vp-c-brand-1) 10%, var(--vp-c-bg));
  color: var(--vp-c-brand-1);
  font-family: var(--vp-font-family-base);
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  vertical-align: 0.1em;
}

@media (max-width: 860px) {
  .home-quick {
    grid-template-columns: minmax(0, 1fr);
    gap: 1.5rem;
  }
}

@media (max-width: 640px) {
  .fact {
    grid-template-columns: 6.5rem minmax(0, 1fr);
    gap: 0.75rem;
  }
}
</style>
