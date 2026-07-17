<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'

const { isJa } = useI18n()

const boxes = [
  { x: 48, w: 150 },
  { x: 250, w: 170 },
  { x: 472, w: 170 },
  { x: 694, w: 170 },
]

const m = computed(() =>
  isJa()
    ? {
        title: '解析パイプライン',
        example: '例: 東京スカイツリーに行きました',
        steps: [
          { name: '前処理', sub: 'URL・メール・数値' },
          { name: '候補生成', sub: '辞書 + パターン' },
          { name: 'ラティス', sub: '可能な経路を構築' },
          { name: 'Viterbi', sub: '最良経路を選択' },
        ],
        out: '東京 / スカイツリー / に / 行き / まし / た',
        caption: '複数の分割候補を最後まで残し、スコアリングで最も自然な経路を選びます。',
      }
    : {
        title: 'Analysis pipeline',
        example: 'Example: 東京スカイツリーに行きました',
        steps: [
          { name: 'Pre-tokenize', sub: 'URLs, email, numbers' },
          { name: 'Candidates', sub: 'dictionary + patterns' },
          { name: 'Lattice', sub: 'all possible paths' },
          { name: 'Viterbi', sub: 'best scoring path' },
        ],
        out: '東京 / スカイツリー / に / 行き / まし / た',
        caption: 'The analyzer keeps multiple possible segmentations alive until scoring selects the best path.',
      }
)
</script>

<template>
  <figure class="doc-diagram">
    <svg viewBox="0 0 920 330" role="img" :aria-label="m.title">
      <rect x="1" y="1" width="918" height="328" rx="16" class="dg-canvas" />
      <text x="48" y="50" class="dg-ink" font-size="22" font-weight="700">{{ m.title }}</text>
      <text x="48" y="80" class="dg-mut" font-size="15">{{ m.example }}</text>

      <template v-for="(s, i) in m.steps" :key="i">
        <rect :x="boxes[i].x" y="122" :width="boxes[i].w" height="78" rx="14" class="dg-card" />
        <circle :cx="boxes[i].x + 26" cy="148" r="11" class="dg-badge" />
        <text :x="boxes[i].x + 26" y="153" text-anchor="middle" class="dg-on-badge" font-size="12" font-weight="700">{{ i + 1 }}</text>
        <text :x="boxes[i].x + 45" y="153" class="dg-brand" font-size="15" font-weight="700">{{ s.name }}</text>
        <text :x="boxes[i].x + boxes[i].w / 2" y="180" text-anchor="middle" class="dg-mut" font-size="13">{{ s.sub }}</text>
      </template>

      <g class="dg-arrow">
        <path d="M204 161h34" />
        <path d="M232 155l10 6-10 6" />
        <path d="M426 161h34" />
        <path d="M454 155l10 6-10 6" />
        <path d="M648 161h34" />
        <path d="M676 155l10 6-10 6" />
      </g>

      <path d="M779 200v22c0 12-10 22-22 22" class="dg-arrow" />
      <path d="M763 238l-6 10-6-10" class="dg-arrow" />

      <rect x="152" y="246" width="616" height="44" rx="22" class="dg-soft" />
      <text x="460" y="274" text-anchor="middle" class="dg-ink" font-size="16" font-weight="700">{{ m.out }}</text>
    </svg>
    <figcaption>{{ m.caption }}</figcaption>
  </figure>
</template>
