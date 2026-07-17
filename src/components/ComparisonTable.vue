<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { WASM_GZIP_SIZE } from '@/wasm/metadata'

const { t, isJa } = useI18n()

const comparisonLink = computed(() =>
  isJa() ? '/ja/docs/mecab-comparison' : '/docs/mecab-comparison'
)

// Comparison data: TinySegmenter (lightweight) → Suzume (balanced) → MeCab-based (heavyweight)
const tools = ['TinySegmenter', 'Suzume', 'kuromoji', 'MeCab']

const features = computed(() => [
  {
    name: t('comparison.browserRun'),
    values: ['yes', 'yes', 'partial', 'no']
  },
  {
    name: t('comparison.dictionary'),
    values: [
      t('comparison.notRequired'),
      t('comparison.notRequired'),
      t('comparison.required'),
      t('comparison.required')
    ]
  },
  {
    name: t('comparison.bundleSize'),
    values: ['~10KB', WASM_GZIP_SIZE, '~20MB', t('comparison.na')]
  },
  {
    name: t('comparison.serverFree'),
    values: ['yes', 'yes', 'partial', 'no']
  },
  {
    name: t('comparison.posInfo'),
    values: ['no', 'yes', 'yes', 'yes']
  },
  {
    name: t('comparison.lemma'),
    values: ['no', 'yes', 'yes', 'yes']
  },
  {
    name: t('comparison.compound'),
    values: ['no', 'no', 'yes', 'yes']
  },
  {
    name: t('comparison.customDict'),
    values: ['no', 'yes', 'yes', 'yes']
  },
  {
    name: t('comparison.unknownWords'),
    values: ['partial', 'yes', 'partial', 'partial']
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
            <th v-for="(tool, i) in tools" :key="tool" :class="{ highlight: tool === 'Suzume' }">
              {{ tool }}
              <span v-if="i === 0" class="tool-tag light">{{ t('comparison.light') }}</span>
              <span v-else-if="i === tools.length - 1" class="tool-tag heavy">{{ t('comparison.accurate') }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="feature in features" :key="feature.name">
            <td class="feature-col">{{ feature.name }}</td>
            <td
              v-for="(value, i) in feature.values"
              :key="i"
              :class="[getCellClass(value), { highlight: i === 1 }]"
            >
              {{ getCellDisplay(value) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

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
  margin-bottom: 1.5rem;
}

.comparison-table {
  width: 100%;
  min-width: 700px;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.9rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
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
  padding: 0.75rem 1rem;
  text-align: center;
  border-bottom: 1px solid var(--vp-c-divider);
}

.comparison-table th {
  font-weight: 600;
  color: var(--vp-c-text-2);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
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
  border-radius: 4px;
}

.tool-tag.light,
.tool-tag.heavy {
  color: var(--vp-c-text-2);
  background: var(--vp-c-default-soft, var(--vp-c-bg-soft));
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

/* Guide link — the single canonical entry point to the MeCab comparison */
.comparison-guide-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1rem 1.25rem;
  border: 1px solid color-mix(in srgb, var(--vp-c-brand-1) 24%, var(--vp-c-border));
  border-radius: 12px;
  background: color-mix(in srgb, var(--vp-c-brand-1) 4%, var(--vp-c-bg));
  color: var(--vp-c-text-1);
  text-decoration: none !important;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.comparison-guide-link:hover {
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 55%, var(--vp-c-border));
  background: color-mix(in srgb, var(--vp-c-brand-1) 7%, var(--vp-c-bg));
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

@media (max-width: 640px) {
  .table-wrapper {
    margin: 0 -0.5rem 1.5rem -0.5rem;
  }

  .comparison-table {
    font-size: 0.75rem;
    border-radius: 8px;
  }

  .comparison-table th,
  .comparison-table td {
    padding: 0.4rem 0.35rem;
    font-size: 0.7rem;
  }

  .comparison-table th {
    font-size: 0.65rem;
  }

  .tool-tag {
    font-size: 0.5rem;
    padding: 0.1rem 0.25rem;
  }

  .cell-yes {
    font-size: 0.9rem;
  }

  .comparison-guide-link {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.75rem;
  }
}
</style>
