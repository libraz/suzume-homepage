<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useI18n } from '@/composables/useI18n'

const { t, isJa } = useI18n()

// Dynamic size label from WASM metadata
const sizeLabel = ref('<300KB')
onMounted(async () => {
  try {
    const meta = await import('@/wasm/meta.json')
    const size = Math.ceil(meta.gzipKB / 50) * 50
    sizeLabel.value = `<${size}KB`
  } catch {
    // Use fallback
  }
})

const benefits = computed(() => [
  {
    icon: '🖥️',
    title: t('comparison.benefits.frontendOnly.title'),
    desc: t('comparison.benefits.frontendOnly.desc')
  },
  {
    icon: '⚡',
    title: t('comparison.benefits.realtime.title'),
    desc: t('comparison.benefits.realtime.desc')
  },
  {
    icon: '🔒',
    title: t('comparison.benefits.privacy.title'),
    desc: t('comparison.benefits.privacy.desc')
  }
])

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
    values: ['~10KB', sizeLabel.value, '~20MB', t('comparison.na')]
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
  <div class="comparison-section">
    <div class="section-header">
      <h2>{{ t('comparison.title') }}</h2>
      <p class="section-subtitle">{{ t('comparison.subtitle') }}</p>
    </div>

    <!-- Comparison Table -->
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

    <!-- Benefits -->
    <div class="benefits-grid">
      <div v-for="benefit in benefits" :key="benefit.title" class="benefit-card">
        <span class="benefit-icon">{{ benefit.icon }}</span>
        <div class="benefit-content">
          <h3>{{ benefit.title }}</h3>
          <p>{{ benefit.desc }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.comparison-section {
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

/* Table */
.table-wrapper {
  overflow-x: auto;
  margin-bottom: 2rem;
}

.comparison-table {
  width: 100%;
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

.tool-tag.light {
  color: #059669;
  background: rgba(5, 150, 105, 0.1);
}

.tool-tag.heavy {
  color: #7C3AED;
  background: rgba(124, 58, 237, 0.1);
}

.comparison-table th.highlight {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.comparison-table td.highlight {
  background: var(--vp-c-brand-soft);
  font-weight: 600;
}


.feature-col {
  text-align: left !important;
  font-weight: 500;
  color: var(--vp-c-text-1);
}

.cell-yes {
  color: #059669;
  font-weight: 700;
  font-size: 1.1rem;
}

.cell-no {
  color: #DC2626;
  font-weight: 500;
}

.cell-partial {
  color: #D97706;
  font-weight: 500;
}

/* Benefits Grid */
.benefits-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.benefit-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  transition: all 0.2s;
}

.benefit-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.benefit-icon {
  font-size: 1.75rem;
  flex-shrink: 0;
}

.benefit-content h3 {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0 0 0.375rem 0;
}

.benefit-content p {
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
  margin: 0;
  line-height: 1.5;
}

/* Responsive */
@media (max-width: 768px) {
  .benefits-grid {
    grid-template-columns: 1fr;
  }

  .comparison-table th,
  .comparison-table td {
    padding: 0.5rem 0.5rem;
    font-size: 0.8rem;
  }

  .section-header h2 {
    font-size: 1.5rem;
  }
}

@media (max-width: 640px) {
  .comparison-section {
    margin: 2rem 0;
  }

  .section-subtitle {
    font-size: 0.9rem;
  }

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

  .benefit-card {
    padding: 1rem;
    gap: 0.75rem;
  }

  .benefit-icon {
    font-size: 1.5rem;
  }

  .benefit-content h3 {
    font-size: 0.9rem;
  }

  .benefit-content p {
    font-size: 0.8rem;
  }
}
</style>
