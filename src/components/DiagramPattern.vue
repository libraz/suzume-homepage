<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'

const { isJa } = useI18n()

// Examples measured against the bundled WASM: every one is tokenized as an
// unknown word (isUnknown = true) with the candidate POS shown.
const examples = ['スカイツリー', '量子計算', '配信する', 'えぐい']
const candidates = ['NOUN', 'NOUN', 'NOUN + VERB', 'ADJ']
const rowY = [124, 156, 188, 220]

const m = computed(() =>
  isJa()
    ? {
        head: 'パターンは候補を出すだけで、決めるのはスコア',
        desc: '文字種パターンによる候補と辞書の候補がどちらもラティスに入り、Viterbi が最小コストの経路を選びます。',
        band: 'パターンによる候補',
        cols: ['文字の並び', '例', '候補'],
        runs: ['カタカナの連続', '漢字の連続', '漢字 + する', 'ひらがな + い'],
        dictH: '辞書の検索',
        dictD: 'すべての辞書レイヤーのエントリ',
        latticeH: 'ラティス',
        latticeD: 'すべての候補が競合',
        viterbiD: '最小コストの経路が残る',
        caption: 'パターンの候補は辞書の検索に失敗したときだけでなく、辞書の候補と並んで常に生成されます。表の例はどれも未知語としてトークン化されたものです。',
      }
    : {
        head: 'Patterns propose candidates; scoring decides',
        desc: 'Candidates from character patterns and from the dictionary both enter the lattice, and Viterbi keeps the lowest-cost path.',
        band: 'Pattern candidates',
        cols: ['character run', 'example', 'candidate'],
        runs: ['Katakana', 'Kanji', 'Kanji + する', 'Hiragana + い'],
        dictH: 'Dictionary lookup',
        dictD: 'entries from every dictionary layer',
        latticeH: 'Lattice',
        latticeD: 'all candidates compete',
        viterbiD: 'lowest-cost path wins',
        caption: 'Pattern candidates are generated next to dictionary candidates, not only when the lookup fails. Every example in the table is tokenized as an unknown word.',
      }
)
</script>

<template>
  <figure class="fig">
    <div class="fig-head">{{ m.head }}</div>
    <svg class="fig-svg" role="img" aria-labelledby="fig-pattern-title" viewBox="0 0 960 376" xmlns="http://www.w3.org/2000/svg">
      <title id="fig-pattern-title">{{ m.desc }}</title>
      <!-- pattern candidates -->
      <rect class="fg-group fg-group--accent" x="32" y="24" width="560" height="224" rx="8" />
      <text class="fg-lbl" x="56" y="52">{{ m.band }}</text>
      <text class="fg-xs" x="56" y="84">{{ m.cols[0] }}</text>
      <text class="fg-xs" x="248" y="84">{{ m.cols[1] }}</text>
      <text class="fg-xs" x="400" y="84">{{ m.cols[2] }}</text>
      <line class="fg-rule fg-rule--strong" x1="56" y1="96" x2="568" y2="96" />
      <line class="fg-rule" x1="56" y1="136" x2="568" y2="136" />
      <line class="fg-rule" x1="56" y1="168" x2="568" y2="168" />
      <line class="fg-rule" x1="56" y1="200" x2="568" y2="200" />
      <template v-for="(y, i) in rowY" :key="i">
        <text class="fg-s" x="56" :y="y">{{ m.runs[i] }}</text>
        <text class="fg-s fg-ink" x="248" :y="y">{{ examples[i] }}</text>
        <text class="fg-m" x="400" :y="y">{{ candidates[i] }}</text>
      </template>
      <!-- dictionary -->
      <rect class="fg-box" x="32" y="280" width="560" height="72" rx="8" />
      <text class="fg-t" x="48" y="308">{{ m.dictH }}</text>
      <text class="fg-s" x="48" y="332">{{ m.dictD }}</text>
      <!-- both feed the lattice -->
      <path class="fg-edge fg-edge--accent" d="M592 128H672" marker-end="url(#fg-ac)" />
      <path class="fg-edge" d="M592 316H632V160H672" marker-end="url(#fg-a)" />
      <rect class="fg-box" x="672" y="104" width="256" height="72" rx="8" />
      <text class="fg-t" x="688" y="132">{{ m.latticeH }}</text>
      <text class="fg-s" x="688" y="156">{{ m.latticeD }}</text>
      <path class="fg-edge" d="M800 176V224" marker-end="url(#fg-a)" />
      <rect class="fg-box" x="672" y="224" width="256" height="72" rx="8" />
      <text class="fg-t" x="688" y="252">Viterbi</text>
      <text class="fg-s" x="688" y="276">{{ m.viterbiD }}</text>
    </svg>
    <figcaption class="fig-note">{{ m.caption }}</figcaption>
  </figure>
</template>
