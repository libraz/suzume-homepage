<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'

const { isJa } = useI18n()

const cardX = [52, 355, 658]

const m = computed(() =>
  isJa()
    ? {
        title: 'Suzume が軽量に収まる理由',
        cards: [
          { h: '最小限の辞書', a: '助詞・助動詞・例外語を', b: '中心に内蔵する。' },
          { h: '文法パターン', a: '未知語を語構成から', b: '候補化する。' },
          { h: '動的スコアリング', a: '品詞のつながりを', b: '実行時に評価する。' },
        ],
        result: 'フロントエンドで扱いやすいサイズ',
        caption: 'Suzume は配布する辞書データを小さくし、解析の多くをコンパクトな文法ルールとスコアリングに寄せています。',
      }
    : {
        title: 'How Suzume keeps its footprint small',
        cards: [
          { h: 'Minimal dictionary', a: 'Keep function words,', b: 'particles, and exceptions.' },
          { h: 'Grammar patterns', a: 'Infer unknown words from', b: 'Japanese word structure.' },
          { h: 'Dynamic scoring', a: 'Compute likely POS', b: 'connections at runtime.' },
        ],
        result: 'Small enough for frontend apps',
        caption: 'Suzume keeps the shipped data small and moves more of the analysis into compact grammar and scoring code.',
      }
)
</script>

<template>
  <figure class="doc-diagram">
    <svg viewBox="0 0 920 300" role="img" :aria-label="m.title">
      <rect x="1" y="1" width="918" height="298" rx="16" class="dg-canvas" />
      <text x="48" y="52" class="dg-ink" font-size="22" font-weight="700">{{ m.title }}</text>

      <template v-for="(c, i) in m.cards" :key="i">
        <rect :x="cardX[i]" y="92" width="210" height="112" rx="14" class="dg-card" />
        <circle :cx="cardX[i] + 30" cy="120" r="14" class="dg-badge" />
        <text :x="cardX[i] + 30" y="125" text-anchor="middle" class="dg-on-badge" font-size="14" font-weight="700">{{ i + 1 }}</text>
        <text :x="cardX[i] + 20" y="154" class="dg-ink" font-size="16" font-weight="700">{{ c.h }}</text>
        <text :x="cardX[i] + 20" y="176" class="dg-mut" font-size="13">{{ c.a }}</text>
        <text :x="cardX[i] + 20" y="194" class="dg-mut" font-size="13">{{ c.b }}</text>
      </template>

      <path d="M275 148h60" class="dg-arrow" />
      <path d="M329 142l10 6-10 6" class="dg-arrow" />
      <path d="M578 148h60" class="dg-arrow" />
      <path d="M632 142l10 6-10 6" class="dg-arrow" />

      <rect x="285" y="232" width="350" height="42" rx="21" class="dg-badge" />
      <text x="460" y="259" text-anchor="middle" class="dg-on-badge" font-size="16" font-weight="700">{{ m.result }}</text>
    </svg>
    <figcaption>{{ m.caption }}</figcaption>
  </figure>
</template>
