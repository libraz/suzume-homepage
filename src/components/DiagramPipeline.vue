<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'

const { isJa } = useI18n()

const m = computed(() =>
  isJa()
    ? {
        head: '正規化は最初に、原形は経路選択の後に決まる',
        desc: '入力は文字の正規化と事前分割を経て、辞書とパターンの候補からラティスを作り、Viterbi が経路を選んだ後に後処理で原形と結合を確定します。',
        bands: ['ラティスの前', 'ラティスと経路選択', '経路選択の後'],
        normH: '文字の正規化',
        preH: '事前分割',
        preD: 'URL・メール・日付・数値',
        bypass: 'そのままトークンに',
        spans: '残りの区間',
        dictH: '辞書の候補',
        dictD: '4 つの辞書レイヤーから',
        patH: 'パターンの候補',
        patD: '未知語を文字種から生成',
        latH: 'ラティス',
        latA: 'すべての候補を並べる',
        latB: 'まだ何も確定しない',
        vitD: '最小コストの経路',
        postH: '後処理',
        postA: '原形と活用形を確定',
        postB: '数値と、モードに応じて複合語を結合',
        outH: 'トークン列',
        caption: '辞書にない語はパターンの候補から入り、ほかの候補と同じラティスで競います。URL や数値は事前分割でトークンになり、後処理で再び合流します。',
      }
    : {
        head: 'Normalization comes first; lemmas are fixed after selection',
        desc: 'Input is normalized and pre-tokenized, a lattice is built from dictionary and pattern candidates, Viterbi selects a path, and post-processing fixes lemmas and merges.',
        bands: ['Before the lattice', 'Lattice and selection', 'After selection'],
        normH: 'Normalize characters',
        preH: 'Pre-tokenize',
        preD: 'URLs, emails, dates, numbers',
        bypass: 'kept as tokens',
        spans: 'remaining text',
        dictH: 'Dictionary candidates',
        dictD: 'from all four layers',
        patH: 'Pattern candidates',
        patD: 'for unknown words',
        latH: 'Lattice',
        latA: 'every candidate edge',
        latB: 'nothing is final yet',
        vitD: 'lowest-cost path',
        postH: 'Post-process',
        postA: 'lemmas and conjugation forms',
        postB: 'merges numbers; compounds by mode',
        outH: 'Tokens',
        caption: 'A word no dictionary lists enters through the pattern branch and competes in the same lattice as every other candidate. URLs and numbers become tokens at pre-tokenization and rejoin the stream before post-processing.',
      }
)
</script>

<template>
  <figure class="fig">
    <div class="fig-head">{{ m.head }}</div>
    <svg class="fig-svg" role="img" aria-labelledby="fig-pipeline-title" viewBox="0 0 960 672" xmlns="http://www.w3.org/2000/svg">
      <title id="fig-pipeline-title">{{ m.desc }}</title>
      <!-- phase bands -->
      <rect class="fg-group" x="32" y="24" width="808" height="144" rx="8" />
      <text class="fg-lbl" x="56" y="52">{{ m.bands[0] }}</text>
      <rect class="fg-group" x="32" y="200" width="808" height="248" rx="8" />
      <text class="fg-lbl" x="56" y="228">{{ m.bands[1] }}</text>
      <rect class="fg-group" x="32" y="480" width="808" height="168" rx="8" />
      <text class="fg-lbl" x="56" y="508">{{ m.bands[2] }}</text>
      <!-- before the lattice -->
      <rect class="fg-box" x="56" y="72" width="280" height="72" rx="8" />
      <text class="fg-t" x="72" y="100">{{ m.normH }}</text>
      <text class="fg-s" x="72" y="124">ﾃｽﾄ → テスト · ＡＢＣ → ABC</text>
      <path class="fg-edge" d="M336 108H376" marker-end="url(#fg-a)" />
      <rect class="fg-box" x="376" y="72" width="280" height="72" rx="8" />
      <text class="fg-t" x="392" y="100">{{ m.preH }}</text>
      <text class="fg-s" x="392" y="124">{{ m.preD }}</text>
      <!-- pre-tokens bypass the lattice -->
      <path class="fg-edge" d="M656 108H880V576H816" marker-end="url(#fg-a)" />
      <text class="fg-s fg-halo" x="768" y="98" text-anchor="middle">{{ m.bypass }}</text>
      <!-- remaining spans go to the lattice -->
      <path class="fg-edge" d="M476 144V288" marker-end="url(#fg-a)" />
      <text class="fg-s" x="488" y="188">{{ m.spans }}</text>
      <!-- lattice and selection -->
      <rect class="fg-box" x="56" y="248" width="240" height="72" rx="8" />
      <text class="fg-t" x="72" y="276">{{ m.dictH }}</text>
      <text class="fg-s" x="72" y="300">{{ m.dictD }}</text>
      <rect class="fg-box fg-box--accent" x="56" y="352" width="240" height="72" rx="8" />
      <text class="fg-t" x="72" y="380">{{ m.patH }}</text>
      <text class="fg-s" x="72" y="404">{{ m.patD }}</text>
      <path class="fg-edge" d="M296 284H336V320H376" marker-end="url(#fg-a)" />
      <path class="fg-edge fg-edge--accent" d="M296 388H336V352H376" marker-end="url(#fg-ac)" />
      <rect class="fg-box" x="376" y="288" width="200" height="96" rx="8" />
      <text class="fg-t" x="392" y="316">{{ m.latH }}</text>
      <text class="fg-s" x="392" y="340">{{ m.latA }}</text>
      <text class="fg-s" x="392" y="364">{{ m.latB }}</text>
      <path class="fg-edge" d="M576 336H616" marker-end="url(#fg-a)" />
      <rect class="fg-box" x="616" y="300" width="200" height="72" rx="8" />
      <text class="fg-t" x="632" y="328">Viterbi</text>
      <text class="fg-s" x="632" y="352">{{ m.vitD }}</text>
      <!-- after selection -->
      <path class="fg-edge" d="M716 372V528" marker-end="url(#fg-a)" />
      <rect class="fg-box" x="496" y="528" width="320" height="96" rx="8" />
      <text class="fg-t" x="512" y="556">{{ m.postH }}</text>
      <text class="fg-s" x="512" y="580">{{ m.postA }}</text>
      <text class="fg-s" x="512" y="604">{{ m.postB }}</text>
      <path class="fg-edge" d="M496 576H336" marker-end="url(#fg-a)" />
      <rect class="fg-box" x="56" y="540" width="280" height="72" rx="8" />
      <text class="fg-t" x="72" y="568">{{ m.outH }}</text>
      <text class="fg-mxs" x="72" y="592">surface, pos, baseForm, …</text>
    </svg>
    <figcaption class="fig-note">{{ m.caption }}</figcaption>
  </figure>
</template>
