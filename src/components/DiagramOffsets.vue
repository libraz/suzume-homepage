<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'

const { isJa } = useI18n()

// One cell per code point; input and normalized text share the same left edge.
const X0 = 176
const CELL = 44
const x = (i: number) => X0 + CELL * i
const cx = (i: number) => x(i) + CELL / 2

const input = [...'𠮷野家でｶﾞｲﾄﾞを読む']
const normalized = [...'𠮷野家でガイドを読む']

// Measured with the bundled WASM (analyzeWithNormalizedText): start/end in code
// points over the normalized text.
const tokens = [
  { s: 0, e: 3, accent: true },
  { s: 3, e: 4 },
  { s: 4, e: 7 },
  { s: 7, e: 8 },
  { s: 8, e: 10 },
]

// Code-point boundary k sits at UTF-16 index k + 1 once past 𠮷 (a surrogate pair).
const cpTicks = Array.from({ length: normalized.length + 1 }, (_, k) => k)
const utf16 = (k: number) => (k === 0 ? 0 : k + 1)

// Where the token 𠮷野家 ends: 3 code points, 4 UTF-16 units.
const DIVERGE = 3

const m = computed(() =>
  isJa()
    ? {
        head: 'オフセットは正規化後のテキストを指す',
        title:
          '入力「𠮷野家でｶﾞｲﾄﾞを読む」は正規化で「𠮷野家でガイドを読む」になり、トークンの位置はこの正規化後のテキスト上で数えます。「𠮷野家」の end はコードポイントで 3、UTF-16 で 4 です。',
        rows: ['入力', '正規化後', 'トークン'],
        inputCount: '12 コードポイント',
        shrink: '5 文字が 3 文字に',
        normCount: '10 コードポイント',
        cpUnit: 'コードポイント',
        u16Unit: 'UTF-16 コード単位',
        caption:
          '「ｶﾞｲﾄﾞ」が「ガイド」に縮むため、「を」の位置は正規化後のテキストでは 7、入力では 9 です。「𠮷」は 1 コードポイントですが UTF-16 では 2 単位なので、JavaScript の文字列は startUtf16 と endUtf16 で切り出します。',
      }
    : {
        head: 'Offsets index the normalized text',
        title:
          'The input 𠮷野家でｶﾞｲﾄﾞを読む normalizes to 𠮷野家でガイドを読む, and token offsets count positions in that normalized text. 𠮷野家 ends at 3 in code points and at 4 in UTF-16 units.',
        rows: ['input', 'normalized', 'tokens'],
        inputCount: '12 code points',
        shrink: '5 characters become 3',
        normCount: '10 code points',
        cpUnit: 'code points',
        u16Unit: 'UTF-16 code units',
        caption:
          'Because ｶﾞｲﾄﾞ shrinks to ガイド, を sits at 7 in the normalized text but at 9 in the input. 𠮷 is one code point but two UTF-16 units, so JavaScript strings are sliced with startUtf16 and endUtf16.',
      }
)
</script>

<template>
  <figure class="fig">
    <div class="fig-head">{{ m.head }}</div>
    <svg class="fig-svg" role="img" aria-labelledby="fig-offsets-title" viewBox="0 0 960 416" xmlns="http://www.w3.org/2000/svg">
      <title id="fig-offsets-title">{{ m.title }}</title>
      <!-- input -->
      <text class="fg-s" x="32" y="61">{{ m.rows[0] }}</text>
      <rect class="fg-lane" :x="x(0)" y="32" :width="CELL * input.length" height="48" rx="8" />
      <rect class="fg-fill fg-fill--muted" :x="x(4)" y="32" :width="CELL * 5" height="48" />
      <line v-for="k in input.length - 1" :key="'it' + k" class="fg-tick" :x1="x(k)" y1="32" :x2="x(k)" y2="80" />
      <text v-for="(c, i) in input" :key="'i' + i" class="fg-t2" :x="cx(i)" y="61" text-anchor="middle">{{ c }}</text>
      <text class="fg-xs" x="736" y="61">{{ m.inputCount }}</text>
      <!-- normalization: ｶﾞｲﾄﾞ (5 cells) folds into ガイド (3 cells) -->
      <line class="fg-leader" :x1="x(4)" y1="80" :x2="x(4)" y2="136" />
      <line class="fg-leader" :x1="x(9)" y1="80" :x2="x(7)" y2="136" />
      <text class="fg-xs" x="736" y="112">{{ m.shrink }}</text>
      <!-- normalized text -->
      <text class="fg-s" x="32" y="165">{{ m.rows[1] }}</text>
      <rect class="fg-lane" :x="x(0)" y="136" :width="CELL * normalized.length" height="48" rx="8" />
      <rect class="fg-fill fg-fill--muted" :x="x(4)" y="136" :width="CELL * 3" height="48" />
      <line v-for="k in normalized.length - 1" :key="'nt' + k" class="fg-tick" :x1="x(k)" y1="136" :x2="x(k)" y2="184" />
      <text v-for="(c, i) in normalized" :key="'n' + i" class="fg-t2" :x="cx(i)" y="165" text-anchor="middle">{{ c }}</text>
      <text class="fg-xs" x="736" y="165">{{ m.normCount }}</text>
      <!-- tokens -->
      <text class="fg-s" x="32" y="237">{{ m.rows[2] }}</text>
      <line class="fg-life fg-life--accent" :x1="x(DIVERGE)" y1="256" :x2="x(DIVERGE)" y2="368" />
      <template v-for="t in tokens" :key="'t' + t.s">
        <rect
          :class="['fg-box', t.accent ? 'fg-box--accent' : '']"
          :x="x(t.s) + 2"
          y="208"
          :width="CELL * (t.e - t.s) - 4"
          height="48"
          rx="8"
        />
        <text
          :class="['fg-t2', t.accent ? 'fg-accent' : '']"
          :x="(x(t.s) + x(t.e)) / 2"
          y="237"
          text-anchor="middle"
        >{{ normalized.slice(t.s, t.e).join('') }}</text>
      </template>
      <!-- code-point ruler -->
      <line class="fg-rule fg-rule--strong" :x1="x(0)" y1="296" :x2="x(normalized.length)" y2="296" />
      <template v-for="k in cpTicks" :key="'cp' + k">
        <line class="fg-tick" :x1="x(k)" y1="290" :x2="x(k)" y2="302" />
        <text :class="['fg-num', k === DIVERGE ? 'fg-accent fg-halo fg-halo--plain' : '']" :x="x(k)" y="322" text-anchor="middle">{{ k }}</text>
      </template>
      <text class="fg-mxs" x="736" y="301">start · end</text>
      <text class="fg-xs" x="736" y="322">{{ m.cpUnit }}</text>
      <!-- UTF-16 ruler -->
      <line class="fg-rule fg-rule--strong" :x1="x(0)" y1="360" :x2="x(normalized.length)" y2="360" />
      <template v-for="k in cpTicks" :key="'u' + k">
        <line class="fg-tick" :x1="x(k)" y1="354" :x2="x(k)" y2="366" />
        <text :class="['fg-num', k === DIVERGE ? 'fg-accent' : '']" :x="x(k)" y="386" text-anchor="middle">{{ utf16(k) }}</text>
      </template>
      <text class="fg-mxs" x="736" y="365">startUtf16 · endUtf16</text>
      <text class="fg-xs" x="736" y="386">{{ m.u16Unit }}</text>
    </svg>
    <figcaption class="fig-note">{{ m.caption }}</figcaption>
  </figure>
</template>
