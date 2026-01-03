<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useData } from 'vitepress'

const { lang } = useData()

// Dynamic size label from WASM metadata
const sizeLabel = ref('<300KB')
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
      ? 'TinySegmenterの軽量さとMeCabの高精度、両方のいいとこ取り。'
      : 'The best of both worlds: TinySegmenter\'s lightness meets MeCab\'s accuracy.',
    // Table headers
    feature: isJa ? '機能' : 'Feature',
    browserRun: isJa ? 'ブラウザ動作' : 'Browser',
    dictionary: isJa ? '辞書ファイル' : 'Dictionary',
    bundleSize: isJa ? 'バンドルサイズ' : 'Bundle Size',
    serverFree: isJa ? 'サーバー不要' : 'Server-free',
    unknownWords: isJa ? '未知語対応' : 'Unknown Words',
    posInfo: isJa ? '品詞情報' : 'POS Tagging',
    lemma: isJa ? '原形復元' : 'Lemmatization',
    compound: isJa ? '複合名詞判定' : 'Compound Nouns',
    customDict: isJa ? 'カスタム辞書' : 'Custom Dictionary',
    // Values
    notRequired: isJa ? '不要' : 'Not required',
    required: isJa ? '必須' : 'Required',
    heavy: isJa ? '(重い)' : '(Heavy)',
    na: 'N/A',
    tokenizeOnly: isJa ? '分かち書きのみ' : 'Tokenize only',
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

// Comparison data: TinySegmenter (lightweight) → Suzume (balanced) → MeCab-based (heavyweight)
const tools = ['TinySegmenter', 'Suzume', 'kuromoji', 'MeCab']

const features = computed(() => {
  const isJa = lang.value === 'ja'
  return [
    {
      name: t.value.browserRun,
      values: ['yes', 'yes', 'partial', 'no']
    },
    {
      name: t.value.dictionary,
      values: [
        t.value.notRequired,
        t.value.notRequired,
        t.value.required,
        t.value.required
      ]
    },
    {
      name: t.value.bundleSize,
      values: ['~10KB', sizeLabel.value, '~20MB', t.value.na]
    },
    {
      name: t.value.serverFree,
      values: ['yes', 'yes', 'partial', 'no']
    },
    {
      name: t.value.posInfo,
      values: ['no', 'yes', 'yes', 'yes']
    },
    {
      name: t.value.lemma,
      values: ['no', 'yes', 'yes', 'yes']
    },
    {
      name: t.value.compound,
      values: ['no', 'no', 'yes', 'yes']
    },
    {
      name: t.value.customDict,
      values: ['no', 'yes', 'yes', 'yes']
    },
    {
      name: t.value.unknownWords,
      values: ['partial', 'yes', 'partial', 'partial']
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
            <th v-for="(tool, i) in tools" :key="tool" :class="{ highlight: tool === 'Suzume' }">
              {{ tool }}
              <span v-if="i === 0" class="tool-tag light">{{ lang === 'ja' ? '軽量' : 'Light' }}</span>
              <span v-else-if="i === tools.length - 1" class="tool-tag heavy">{{ lang === 'ja' ? '高精度' : 'Accurate' }}</span>
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
