<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useData } from 'vitepress'

const { lang } = useData()

// Dynamic size label from WASM metadata
const sizeLabel = ref('<250KB')
onMounted(async () => {
  try {
    const meta = await import('./wasm/meta.json')
    const size = Math.ceil(meta.gzipKB / 50) * 50
    sizeLabel.value = `<${size}KB`
  } catch {
    // Use fallback
  }
})

const t = computed(() => {
  const isJa = lang.value === 'ja'
  return {
    title: isJa ? 'なぜ Suzume?' : 'Why Suzume?',
    subtitle: isJa
      ? 'サーバー構築不要。フロントエンドだけで日本語トークン化が完結します。'
      : 'No server needed. Japanese tokenization entirely in the browser.',
    // Table headers
    feature: isJa ? '機能' : 'Feature',
    browserRun: isJa ? 'ブラウザ動作' : 'Browser',
    dictionary: isJa ? '辞書ファイル' : 'Dictionary',
    bundleSize: isJa ? 'バンドルサイズ' : 'Bundle Size',
    serverFree: isJa ? 'サーバー不要' : 'Server-free',
    unknownWords: isJa ? '未知語対応' : 'Unknown Words',
    // Values
    notRequired: isJa ? '不要' : 'Not required',
    required: isJa ? '必須' : 'Required',
    heavy: isJa ? '(重い)' : '(Heavy)',
    na: 'N/A',
    // Benefits
    benefits: [
      {
        icon: '🖥️',
        title: isJa ? 'フロントエンド完結' : 'Frontend Only',
        desc: isJa
          ? 'サーバー構築・運用コストゼロ。CDNから配信するだけ。'
          : 'Zero server setup. Just serve from CDN.'
      },
      {
        icon: '⚡',
        title: isJa ? 'リアルタイム処理' : 'Real-time Processing',
        desc: isJa
          ? 'APIコール不要。レイテンシなしで即座に解析。'
          : 'No API calls. Instant analysis with zero latency.'
      },
      {
        icon: '🔒',
        title: isJa ? 'プライバシー保護' : 'Privacy First',
        desc: isJa
          ? 'テキストデータがサーバーに送信されない。'
          : 'Text data never leaves the user\'s browser.'
      }
    ]
  }
})

// Comparison data
const tools = ['Suzume', 'MeCab', 'kuromoji', 'Sudachi']

const features = computed(() => {
  const isJa = lang.value === 'ja'
  return [
    {
      name: t.value.browserRun,
      values: ['yes', 'no', 'partial', 'no']
    },
    {
      name: t.value.dictionary,
      values: [
        t.value.notRequired,
        t.value.required,
        t.value.required,
        t.value.required
      ]
    },
    {
      name: t.value.bundleSize,
      values: [sizeLabel.value, t.value.na, '~20MB', t.value.na]
    },
    {
      name: t.value.serverFree,
      values: ['yes', 'no', 'partial', 'no']
    },
    {
      name: t.value.unknownWords,
      values: ['yes', 'partial', 'partial', 'partial']
    }
  ]
})

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
      <h2>{{ t.title }}</h2>
      <p class="section-subtitle">{{ t.subtitle }}</p>
    </div>

    <!-- Comparison Table -->
    <div class="table-wrapper">
      <table class="comparison-table">
        <thead>
          <tr>
            <th class="feature-col">{{ t.feature }}</th>
            <th v-for="tool in tools" :key="tool" :class="{ highlight: tool === 'Suzume' }">
              {{ tool }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="feature in features" :key="feature.name">
            <td class="feature-col">{{ feature.name }}</td>
            <td
              v-for="(value, i) in feature.values"
              :key="i"
              :class="[getCellClass(value), { highlight: i === 0 }]"
            >
              {{ getCellDisplay(value) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Benefits -->
    <div class="benefits-grid">
      <div v-for="benefit in t.benefits" :key="benefit.title" class="benefit-card">
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
</style>
