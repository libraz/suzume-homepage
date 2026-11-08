<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'

const { isJa } = useI18n()

const termY = [72, 176, 280]

// Rows of the 13 x 13 POS table in ../suzume/src/analysis/scorer.cpp
// (kBigramCostTable); negative values are bonuses.
const excerpt = [
  { pair: 'NOUN → PARTICLE', cost: '0.0' },
  { pair: 'NOUN → VERB', cost: '0.5' },
  { pair: 'NOUN → SUFFIX', cost: '−0.8' },
]

const m = computed(() =>
  isJa()
    ? {
        head: '接続コストは同梱の行列ではなく規則から計算',
        desc: '隣り合う 2 トークンの接続コストは品詞の組、拡張品詞の組、語彙規則の 3 項の合計で、Viterbi が単語コストと合わせて文全体で最小化します。',
        band: '接続コスト ＝ 次の合計',
        terms: [
          { h: '品詞の組', d: '13 × 13 の粗い品詞表' },
          { h: '拡張品詞の組', d: '係助詞「は」・格助詞「が」などの細かい分類' },
          { h: '語彙規則', d: '特定の表層形や原形に結びついた補正' },
        ],
        excerpt: '品詞表の抜粋',
        bonus: 'ボーナス',
        viterbiA: '単語コストと接続コストを合計し',
        viterbiB: '文全体で最小の経路を残す',
        caption: '3 項はどれもコンパクトなコードとして WASM の中で計算されます。負の値は接続を後押しするボーナスで、隣接する組だけでなく文全体の合計が経路を決めます。',
      }
    : {
        head: 'Connection costs come from rules, not a shipped matrix',
        desc: 'The cost of joining two adjacent tokens is the sum of a POS-pair term, an extended-POS-pair term and lexical rules; Viterbi minimizes it together with word costs across the sentence.',
        band: 'Connection cost = sum of',
        terms: [
          { h: 'POS pair', d: '13 × 13 table of coarse classes' },
          { h: 'Extended-POS pair', d: 'fine classes, such as topic は and case が' },
          { h: 'Lexical rules', d: 'adjustments keyed on specific surfaces or lemmas' },
        ],
        excerpt: 'POS table excerpt',
        bonus: 'bonus',
        viterbiA: 'Adds word and connection costs',
        viterbiB: 'and keeps the cheapest full path',
        caption: 'All three terms are computed by compact code inside the WASM module. Negative values are bonuses, and the total over the whole sentence, not any single pair, picks the path.',
      }
)
</script>

<template>
  <figure class="fig">
    <div class="fig-head">{{ m.head }}</div>
    <svg class="fig-svg" role="img" aria-labelledby="fig-scoring-title" viewBox="0 0 960 400" xmlns="http://www.w3.org/2000/svg">
      <title id="fig-scoring-title">{{ m.desc }}</title>
      <!-- the three summed terms -->
      <rect class="fg-group fg-group--accent" x="32" y="24" width="488" height="352" rx="8" />
      <text class="fg-lbl" x="56" y="52">{{ m.band }}</text>
      <template v-for="(t, i) in m.terms" :key="i">
        <rect class="fg-box" x="56" :y="termY[i]" width="440" height="72" rx="8" />
        <text class="fg-t" x="72" :y="termY[i] + 28">{{ t.h }}</text>
        <text class="fg-s" x="72" :y="termY[i] + 52">{{ t.d }}</text>
      </template>
      <text class="fg-s fg-ink" x="276" y="165" text-anchor="middle">+</text>
      <text class="fg-s fg-ink" x="276" y="269" text-anchor="middle">+</text>
      <!-- excerpt of the POS table -->
      <path class="fg-leader" d="M496 104H584" />
      <text class="fg-lbl" x="600" y="52">{{ m.excerpt }}</text>
      <template v-for="(r, i) in excerpt" :key="r.pair">
        <text class="fg-mxs" x="600" :y="84 + i * 24">{{ r.pair }}</text>
        <text class="fg-num" x="808" :y="84 + i * 24" text-anchor="end">{{ r.cost }}</text>
      </template>
      <text class="fg-xs" x="824" y="132">{{ m.bonus }}</text>
      <!-- path selection -->
      <path class="fg-edge fg-edge--accent" d="M520 240H600" marker-end="url(#fg-ac)" />
      <rect class="fg-box" x="600" y="192" width="328" height="96" rx="8" />
      <text class="fg-t" x="616" y="220">Viterbi</text>
      <text class="fg-s" x="616" y="244">{{ m.viterbiA }}</text>
      <text class="fg-s" x="616" y="268">{{ m.viterbiB }}</text>
    </svg>
    <figcaption class="fig-note">{{ m.caption }}</figcaption>
  </figure>
</template>
