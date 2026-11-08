<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { WASM_GZIP_SIZE } from '@/wasm/metadata'

const { isJa } = useI18n()

const boxX = [32, 344, 656]

const m = computed(() =>
  isJa()
    ? {
        head: 'バイナリを小さく保つ 3 つの設計',
        desc: '最小限の辞書、文法パターン、規則によるスコアリングの 3 つが、辞書込みで小さな WASM バイナリにまとまります。',
        cards: [
          { h: '最小限の辞書', a: '機能語・助詞・助動詞と', b: '選んだ例外語を中心に収録' },
          { h: '文法パターン', a: '文字種と活用語尾から', b: '未知語の候補を作る' },
          { h: '規則によるスコアリング', a: '接続コストを実行時に計算', b: '接続行列は同梱しない' },
        ],
        resultH: '小さな WASM バイナリ',
        resultD: `辞書を含めて gzip 後に約 ${WASM_GZIP_SIZE}`,
        caption: 'どの設計も、大きなデータファイルをコンパクトなコードか厳選した小さな一覧に置き換えます。そのため辞書をバイナリの中に収められます。',
      }
    : {
        head: 'Three design choices keep the binary small',
        desc: 'A minimal dictionary, grammar patterns and rule-based scoring combine into one small WASM binary with its dictionaries included.',
        cards: [
          { h: 'Minimal dictionary', a: 'Function words, particles', b: 'and selected exceptions' },
          { h: 'Grammar patterns', a: 'Unknown words proposed from', b: 'character type and endings' },
          { h: 'Rule-based scoring', a: 'Connection costs computed', b: 'at runtime; no matrix shipped' },
        ],
        resultH: 'One small WASM binary',
        resultD: `About ${WASM_GZIP_SIZE} gzipped, dictionaries included`,
        caption: 'Each choice replaces a large data file with compact code or a short curated list, which is what lets the dictionaries live inside the binary.',
      }
)
</script>

<template>
  <figure class="fig">
    <div class="fig-head">{{ m.head }}</div>
    <svg class="fig-svg" role="img" aria-labelledby="fig-pillars-title" viewBox="0 0 960 296" xmlns="http://www.w3.org/2000/svg">
      <title id="fig-pillars-title">{{ m.desc }}</title>
      <!-- three design choices -->
      <template v-for="(c, i) in m.cards" :key="i">
        <rect class="fg-box" :x="boxX[i]" y="24" width="272" height="96" rx="8" />
        <text class="fg-t" :x="boxX[i] + 16" y="52">{{ c.h }}</text>
        <text class="fg-s" :x="boxX[i] + 16" y="76">{{ c.a }}</text>
        <text class="fg-s" :x="boxX[i] + 16" y="100">{{ c.b }}</text>
      </template>
      <!-- converge -->
      <path class="fg-edge" d="M168 120V152H792V120" />
      <path class="fg-edge" d="M480 120V152" />
      <path class="fg-edge fg-edge--accent" d="M480 152V200" marker-end="url(#fg-ac)" />
      <!-- result -->
      <rect class="fg-box fg-box--accent" x="272" y="200" width="416" height="72" rx="8" />
      <text class="fg-t" x="288" y="228">{{ m.resultH }}</text>
      <text class="fg-s" x="288" y="252">{{ m.resultD }}</text>
    </svg>
    <figcaption class="fig-note">{{ m.caption }}</figcaption>
  </figure>
</template>
