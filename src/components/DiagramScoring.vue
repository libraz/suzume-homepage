<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'

const { isJa } = useI18n()

const m = computed(() =>
  isJa()
    ? {
        title: '実行時に接続をスコアリングする',
        prevCap: '直前のトークン',
        curCap: '現在のトークン',
        prevValue: '名詞',
        resultH: '名詞 + は：接続ボーナス',
        resultA: '接続ボーナスを適用し、',
        resultB: 'Viterbi が最小コストの経路を選ぶ。',
        note: '巨大な行列は配布せず、コンパクトな C++ ルールを WASM 内で実行します。',
        caption: 'Viterbi は文全体の単語コストと接続コストを合わせて最小化します。「名詞 + は」の接続ボーナスが選択経路を変えることがあります。',
      }
    : {
        title: 'Runtime connection scoring',
        prevCap: 'previous token',
        curCap: 'current token',
        prevValue: 'noun',
        resultH: 'noun + は: connection bonus',
        resultA: 'Apply the connection bonus; Viterbi',
        resultB: 'chooses the lowest-cost full path.',
        note: 'No massive matrix is shipped. The scoring rules are compact C++ code inside the WASM module.',
        caption: 'Viterbi minimizes word and connection costs across the full path. A noun + は connection bonus can change the selected path.',
      }
)
</script>

<template>
  <figure class="doc-diagram">
    <svg viewBox="0 0 920 260" role="img" :aria-label="m.title">
      <rect x="1" y="1" width="918" height="258" rx="16" class="dg-canvas" />
      <text x="48" y="52" class="dg-ink" font-size="22" font-weight="700">{{ m.title }}</text>

      <rect x="70" y="100" width="170" height="68" rx="12" class="dg-soft" />
      <text x="155" y="127" text-anchor="middle" class="dg-mut" font-size="14">{{ m.prevCap }}</text>
      <text x="155" y="152" text-anchor="middle" class="dg-ink" font-size="20" font-weight="700">{{ m.prevValue }}</text>

      <rect x="300" y="100" width="170" height="68" rx="12" class="dg-card" />
      <text x="385" y="127" text-anchor="middle" class="dg-mut" font-size="14">{{ m.curCap }}</text>
      <text x="385" y="152" text-anchor="middle" class="dg-ink" font-size="20" font-weight="700">は</text>

      <path d="M248 134h42" class="dg-arrow" />
      <path d="M284 128l10 6-10 6" class="dg-arrow" />

      <rect x="540" y="88" width="300" height="92" rx="14" class="dg-card" />
      <text x="690" y="122" text-anchor="middle" class="dg-ink" font-size="18" font-weight="700">{{ m.resultH }}</text>
      <text x="690" y="150" text-anchor="middle" class="dg-mut" font-size="14">{{ m.resultA }}</text>
      <text x="690" y="168" text-anchor="middle" class="dg-mut" font-size="14">{{ m.resultB }}</text>

      <path d="M478 134h50" class="dg-arrow" />
      <path d="M522 128l10 6-10 6" class="dg-arrow" />

      <text x="70" y="220" class="dg-mut" font-size="14">{{ m.note }}</text>
    </svg>
    <figcaption>{{ m.caption }}</figcaption>
  </figure>
</template>
