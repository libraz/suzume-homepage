<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'

const { isJa } = useI18n()

// Entries generated for もふる by the godan expansion (getDictionarySuffixes):
// two columns of five, in the order the core emits them.
const godanCols = [
  { x: 384, rows: ['もふる', 'もふり', 'もふら', 'もふっ', 'もふろ'] },
  { x: 664, rows: ['もふらん', 'もふらぬ', 'もふれ', 'もふれ', 'もふれる'] },
]
const rowY = [88, 136, 184, 232, 280]
// The ichidan expansion of the same row: stem もふ plus る, '', ん, れ, よ, ろ.
const ichidan = ['もふる', 'もふ', 'もふん', 'もふれ', 'もふよ', 'もふろ']

const m = computed(() =>
  isJa()
    ? {
        head: 'ソース 1 行から活用形のエントリを展開する',
        title: 'TSV の 1 行が GODAN_RA で 10 エントリ、ICHIDAN で 6 エントリに展開される図',
        godanBand: '正しい活用型',
        ichidanBand: '誤った活用型',
        row: 'TSV の 1 行',
        forms: [
          ['終止形', '連用形', '未然形', '音便形', '意志の未然形'],
          ['未然形＋ん', '未然形＋ぬ', '仮定形', '命令形', '可能形'],
        ],
        check: '猫をもふった の もふっ',
        caption:
          'どちらの行もエラーも警告も出さずに読み込まれます。もふれ は仮定形と命令形の 2 エントリとして入ります。ICHIDAN では もふっ が生成されないため、猫をもふった の もふっ はユーザー辞書に由来しなくなります。',
      }
    : {
        head: 'One source row expands into its inflected entries',
        title: 'One TSV row expands into 10 entries as GODAN_RA and into 6 entries as ICHIDAN.',
        godanBand: 'Correct class',
        ichidanBand: 'Wrong pick',
        row: 'one TSV row',
        forms: [
          ['terminal', 'continuative', 'irrealis', 'onbin', 'irrealis before う'],
          ['irrealis + ん', 'irrealis + ぬ', 'conditional', 'imperative', 'potential'],
        ],
        check: 'もふっ in 猫をもふった',
        caption:
          'Both rows load with no error and no warning. もふれ is installed twice, as the conditional and as the imperative. As ICHIDAN no もふっ entry exists, so the もふっ in 猫をもふった no longer comes from the user dictionary.',
      }
)
</script>

<template>
  <figure class="fig">
    <div class="fig-head">{{ m.head }}</div>
    <svg class="fig-svg" role="img" aria-labelledby="conj-expansion-title" viewBox="0 0 960 616" xmlns="http://www.w3.org/2000/svg">
      <title id="conj-expansion-title">{{ m.title }}</title>
      <!-- correct class -->
      <rect class="fg-group" x="32" y="24" width="896" height="312" rx="8" />
      <text class="fg-lbl" x="56" y="52">{{ m.godanBand }}</text>
      <text class="fg-mxs" x="904" y="52" text-anchor="end">loadUserDictionaryCount() → 10</text>
      <rect class="fg-box" x="56" y="88" width="248" height="72" rx="8" />
      <text class="fg-s fg-ink" x="72" y="116">もふる</text>
      <text class="fg-m" x="136" y="116">VERB</text>
      <text class="fg-m fg-accent" x="192" y="116">GODAN_RA</text>
      <text class="fg-xs" x="72" y="140">{{ m.row }}</text>
      <line class="fg-edge fg-edge--accent" x1="304" y1="124" x2="362" y2="124" marker-end="url(#fg-ac)" />
      <line class="fg-rule fg-rule--strong" x1="368" y1="96" x2="368" y2="304" />
      <template v-for="(col, c) in godanCols" :key="c">
        <template v-for="(s, r) in col.rows" :key="r">
          <rect class="fg-pill fg-pill--accent" :x="col.x" :y="rowY[r]" width="96" height="32" rx="16" />
          <text class="fg-s fg-ink" :x="col.x + 48" :y="rowY[r] + 21" text-anchor="middle">{{ s }}</text>
          <text class="fg-xs" :x="col.x + 112" :y="rowY[r] + 21">{{ m.forms[c][r] }}</text>
        </template>
      </template>
      <text class="fg-xs" x="56" y="200">{{ m.check }}</text>
      <rect class="fg-pill fg-pill--accent" x="56" y="216" width="248" height="32" rx="16" />
      <text class="fg-mxs fg-accent" x="180" y="237" text-anchor="middle">isUserDict: true</text>
      <!-- wrong pick -->
      <rect class="fg-group" x="32" y="360" width="896" height="232" rx="8" />
      <text class="fg-lbl" x="56" y="388">{{ m.ichidanBand }}</text>
      <text class="fg-mxs" x="904" y="388" text-anchor="end">loadUserDictionaryCount() → 6</text>
      <rect class="fg-box" x="56" y="408" width="248" height="72" rx="8" />
      <text class="fg-s fg-ink" x="72" y="436">もふる</text>
      <text class="fg-m" x="136" y="436">VERB</text>
      <text class="fg-m" x="192" y="436">ICHIDAN</text>
      <text class="fg-xs" x="72" y="460">{{ m.row }}</text>
      <line class="fg-edge" x1="304" y1="444" x2="376" y2="444" marker-end="url(#fg-a)" />
      <template v-for="(s, i) in ichidan" :key="i">
        <rect class="fg-pill" :x="384 + i * 88" y="428" width="72" height="32" rx="16" />
        <text class="fg-s fg-ink" :x="420 + i * 88" y="449" text-anchor="middle">{{ s }}</text>
      </template>
      <text class="fg-xs" x="56" y="520">{{ m.check }}</text>
      <rect class="fg-pill" x="56" y="536" width="248" height="32" rx="16" />
      <text class="fg-mxs fg-dim" x="180" y="557" text-anchor="middle">isUserDict: false</text>
    </svg>
    <figcaption class="fig-note">{{ m.caption }}</figcaption>
  </figure>
</template>
