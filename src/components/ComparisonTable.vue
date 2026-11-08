<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { WASM_GZIP_SIZE } from '@/wasm/metadata'

const { t, isJa } = useI18n()

const comparisonLink = computed(() =>
  isJa() ? '/ja/docs/mecab-comparison' : '/docs/mecab-comparison'
)

// The table deliberately carries no speed or accuracy row: both depend on the
// input and belong with their measurement conditions rather than in a cell.
const performanceLink = computed(() =>
  isJa() ? '/ja/docs/performance' : '/docs/performance'
)

// Ordered by what the application has to ship: the platform built-in, then
// lightweight segmenters, then Suzume, then the dictionary-based analyzers.
// Columns other than the platform API and MeCab are categories, not products.
const tools = computed(() => [
  { key: 'intl', name: 'Intl.Segmenter', tag: 'comparison.builtIn' },
  { key: 'segmenters', name: t('comparison.segmenters'), tag: 'comparison.noDict' },
  { key: 'suzume', name: 'Suzume' },
  { key: 'jsAnalyzers', name: t('comparison.jsAnalyzers') },
  { key: 'mecab', name: 'MeCab', tag: 'comparison.fullDict' }
])

const suzumeIndex = computed(() => tools.value.findIndex((tool) => tool.key === 'suzume'))

const features = computed(() => [
  {
    name: t('comparison.browserRun'),
    values: ['yes', 'yes', 'yes', 'partial', 'no']
  },
  {
    name: t('comparison.dictionary'),
    values: [
      t('comparison.notRequired'),
      t('comparison.notRequired'),
      t('comparison.bundled'),
      t('comparison.required'),
      t('comparison.required')
    ]
  },
  {
    name: t('comparison.bundleSize'),
    values: [
      '0KB',
      t('comparison.small'),
      isJa() ? `${WASM_GZIP_SIZE}（WASM）` : `${WASM_GZIP_SIZE} WASM`,
      t('comparison.largeDict'),
      t('comparison.na')
    ]
  },
  {
    name: t('comparison.posInfo'),
    values: ['no', 'no', 'yes', 'yes', 'yes']
  },
  {
    name: t('comparison.lemma'),
    values: ['no', 'no', 'yes', 'yes', 'yes']
  },
  {
    name: t('comparison.compound'),
    values: ['no', 'no', 'partial', 'yes', 'yes']
  },
  {
    name: t('comparison.customDict'),
    values: ['no', 'no', 'yes', 'yes', 'yes']
  },
  {
    name: t('comparison.unknownWords'),
    values: ['partial', 'partial', 'yes', 'partial', 'partial']
  }
])

function getCellClass(value: string) {
  if (value === 'yes') return 'cell-yes'
  if (value === 'no') return 'cell-no'
  if (value === 'partial') return 'cell-partial'
  return ''
}

function getCellDisplay(value: string) {
  if (value === 'yes') return '✓'
  if (value === 'no') return '✗'
  if (value === 'partial') return '△'
  return value
}
</script>

<template>
  <section class="home-section comparison">
    <div class="home-section-head">
      <span class="home-eyebrow">{{ t('comparison.eyebrow') }}</span>
      <h2 class="home-heading">{{ t('comparison.title') }}</h2>
      <p class="home-subheading">{{ t('comparison.subtitle') }}</p>
    </div>

    <div class="table-wrapper">
      <table class="comparison-table">
        <thead>
          <tr>
            <th class="feature-col">{{ t('comparison.feature') }}</th>
            <th v-for="tool in tools" :key="tool.key" :class="{ highlight: tool.key === 'suzume' }">
              {{ tool.name }}
              <span v-if="tool.tag" class="tool-tag">{{ t(tool.tag) }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="feature in features" :key="feature.name">
            <td class="feature-col">{{ feature.name }}</td>
            <td
              v-for="(value, i) in feature.values"
              :key="i"
              :class="[getCellClass(value), { highlight: i === suzumeIndex }]"
            >
              {{ getCellDisplay(value) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="guide-links">
    <a class="comparison-guide-link" :href="comparisonLink">
      <span>
        <strong>{{ t('comparison.guideTitle') }}</strong>
        <small>{{ t('comparison.guideDescription') }}</small>
      </span>
      <span class="guide-action">
        {{ t('comparison.guideLink') }}
        <span class="guide-arrow" aria-hidden="true">→</span>
      </span>
    </a>

    <a class="comparison-guide-link" :href="performanceLink">
      <span>
        <strong>{{ t('comparison.perfTitle') }}</strong>
        <small>{{ t('comparison.perfDescription') }}</small>
      </span>
      <span class="guide-action">
        {{ t('comparison.perfLink') }}
        <span class="guide-arrow" aria-hidden="true">→</span>
      </span>
    </a>
    </div>
  </section>
</template>

<style scoped>
.comparison {
  --c-ok: #059669;
  --c-warn: #B45309;
}

.dark .comparison {
  --c-ok: #34D399;
  --c-warn: #FBBF24;
}

/* Table */
.table-wrapper {
  overflow-x: auto;
  margin-bottom: 1rem;
}

.comparison-table {
  width: 100%;
  min-width: 840px;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.9rem;
  font-variant-numeric: tabular-nums;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: var(--sz-radius-panel);
  overflow: hidden;
}

.comparison-table thead,
.comparison-table tbody {
  display: table-header-group;
  width: 100%;
}

.comparison-table tbody {
  display: table-row-group;
}

.comparison-table tr {
  display: table-row;
  width: 100%;
}

.comparison-table th,
.comparison-table td {
  padding: 0.55rem 0.85rem;
  text-align: center;
  border-bottom: 1px solid var(--vp-c-divider);
}

.comparison-table th {
  font-weight: 600;
  color: var(--vp-c-text-1);
  font-size: 0.82rem;
  letter-spacing: 0;
  line-height: 1.4;
  vertical-align: top;
  position: relative;
}

.tool-tag {
  display: block;
  font-size: 0.6rem;
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0;
  margin-top: 0.25rem;
  padding: 0.125rem 0.375rem;
  border-radius: var(--sz-radius-chip);
  color: var(--vp-c-text-3);
  background: var(--vp-c-default-soft);
}

.comparison-table th.highlight {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  box-shadow: inset 1px 0 0 color-mix(in srgb, var(--vp-c-brand-1) 30%, transparent),
    inset -1px 0 0 color-mix(in srgb, var(--vp-c-brand-1) 30%, transparent);
}

.comparison-table td.highlight {
  background: var(--vp-c-brand-soft);
  font-weight: 600;
  box-shadow: inset 1px 0 0 color-mix(in srgb, var(--vp-c-brand-1) 30%, transparent),
    inset -1px 0 0 color-mix(in srgb, var(--vp-c-brand-1) 30%, transparent);
}

.feature-col {
  text-align: left !important;
  font-weight: 500;
  color: var(--vp-c-text-1);
}

.cell-yes {
  color: var(--c-ok);
  font-weight: 700;
  font-size: 1.1rem;
}

.cell-no {
  color: var(--vp-c-text-3);
  font-weight: 400;
}

.cell-partial {
  color: var(--c-warn);
  font-weight: 500;
}

/* Guide links: the MeCab comparison and the measured numbers, side by side */
.guide-links {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

@media (max-width: 760px) {
  .guide-links {
    grid-template-columns: minmax(0, 1fr);
  }
}

.comparison-guide-link {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border: 1px solid var(--vp-c-border);
  border-radius: var(--sz-radius-panel);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  text-decoration: none !important;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.comparison-guide-link:hover {
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 45%, var(--vp-c-border));
}

.comparison-guide-link strong,
.comparison-guide-link small {
  display: block;
}

.comparison-guide-link strong {
  font-size: 0.9rem;
  font-weight: 700;
}

.comparison-guide-link small {
  margin-top: 0.15rem;
  color: var(--vp-c-text-2);
  font-size: 0.78rem;
  line-height: 1.5;
}

.guide-action {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.55rem;
  color: var(--vp-c-brand-1);
  font-size: 0.82rem;
  font-weight: 700;
}

.guide-arrow {
  display: inline-grid;
  width: 1.55rem;
  height: 1.55rem;
  place-items: center;
  border-radius: 50%;
  background: var(--vp-c-brand-soft);
  transition: transform 0.2s ease;
}

.comparison-guide-link:hover .guide-arrow {
  transform: translateX(3px);
}

/* Responsive */
@media (max-width: 768px) {
  .comparison-table th,
  .comparison-table td {
    padding: 0.5rem 0.5rem;
    font-size: 0.8rem;
  }
}

/* The table scrolls sideways on narrow screens instead of shrinking its type. */
@media (max-width: 640px) {
  .comparison-table {
    min-width: 720px;
  }

  .comparison-table th,
  .comparison-table td {
    padding: 0.5rem 0.45rem;
  }
}
</style>
