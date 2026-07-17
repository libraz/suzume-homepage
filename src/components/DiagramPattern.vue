<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'

const { isJa } = useI18n()

const m = computed(() =>
  isJa()
    ? {
        title: '未知語をパターンから候補化する',
        d1: ['辞書に', 'ある?'],
        no: 'No',
        d2: ['カタカナ', '列?'],
        yes: 'Yes',
        result: '名詞候補を生成',
        exLabel: 'ほかの例:',
        ex: ['漢字列 → 名詞候補', '漢字 + する → サ変名詞 / 動詞候補', 'ひらがな + い → 形容詞候補'],
        caption: 'たとえば辞書にないカタカナ列でも、名詞候補としてラティスに載せられます。',
      }
    : {
        title: 'Pattern recognition for unknown words',
        d1: ['In', 'dictionary?'],
        no: 'No',
        d2: ['Katakana', 'sequence?'],
        yes: 'Yes',
        result: 'Generate noun candidate',
        exLabel: 'Other examples:',
        ex: ['漢字列 → noun candidate', '漢字 + する → verbal noun / verb candidate', 'ひらがな + い → adjective candidate'],
        caption: 'For example, a katakana sequence that is not in the dictionary can still become a noun candidate.',
      }
)
</script>

<template>
  <figure class="doc-diagram">
    <svg viewBox="0 0 920 360" role="img" :aria-label="m.title">
      <rect x="1" y="1" width="918" height="358" rx="16" class="dg-canvas" />
      <text x="48" y="52" class="dg-ink" font-size="22" font-weight="700">{{ m.title }}</text>

      <rect x="65" y="130" width="150" height="64" rx="12" class="dg-soft" />
      <text x="140" y="168" text-anchor="middle" class="dg-brand" font-size="18" font-weight="700">スカイツリー</text>

      <path d="M225 162h72" class="dg-arrow" />
      <path d="M291 156l10 6-10 6" class="dg-arrow" />

      <g transform="translate(320 100)">
        <path d="M85 0l85 62-85 62L0 62z" class="dg-card" stroke-width="2" />
        <text x="85" y="57" text-anchor="middle" class="dg-ink" font-size="15" font-weight="700">{{ m.d1[0] }}</text>
        <text x="85" y="78" text-anchor="middle" class="dg-ink" font-size="15" font-weight="700">{{ m.d1[1] }}</text>
      </g>

      <text x="510" y="150" text-anchor="middle" class="dg-mut" font-size="13" font-weight="700">{{ m.no }}</text>
      <path d="M493 162h68" class="dg-arrow" />
      <path d="M555 156l10 6-10 6" class="dg-arrow" />

      <g transform="translate(585 100)">
        <path d="M85 0l85 62-85 62L0 62z" class="dg-card" stroke-width="2" />
        <text x="85" y="57" text-anchor="middle" class="dg-ink" font-size="15" font-weight="700">{{ m.d2[0] }}</text>
        <text x="85" y="78" text-anchor="middle" class="dg-ink" font-size="15" font-weight="700">{{ m.d2[1] }}</text>
      </g>

      <path d="M670 225v46" class="dg-arrow" />
      <path d="M664 265l6 10 6-10" class="dg-arrow" />
      <text x="700" y="253" text-anchor="middle" class="dg-mut" font-size="13" font-weight="700">{{ m.yes }}</text>

      <rect x="555" y="278" width="230" height="48" rx="24" class="dg-soft" />
      <text x="670" y="309" text-anchor="middle" class="dg-brand" font-size="16" font-weight="700">{{ m.result }}</text>

      <text x="80" y="255" class="dg-mut" font-size="14">{{ m.exLabel }}</text>
      <text x="80" y="281" class="dg-mut" font-size="14">{{ m.ex[0] }}</text>
      <text x="80" y="305" class="dg-mut" font-size="14">{{ m.ex[1] }}</text>
      <text x="80" y="329" class="dg-mut" font-size="14">{{ m.ex[2] }}</text>
    </svg>
    <figcaption>{{ m.caption }}</figcaption>
  </figure>
</template>
