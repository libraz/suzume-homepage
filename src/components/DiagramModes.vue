<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'

const { isJa } = useI18n()

// One cell per code point of the sample, so every row shares the same x axis.
const X0 = 176
const CELL = 44
const ROW_Y = [56, 128, 200]
const chars = [...'API開発と高層ビル群']

// [start, end) in code points, measured with the bundled WASM; accent marks a
// token whose boundaries differ from normal mode.
type Span = { s: number; e: number; accent?: boolean }
const rows: { mode: string; spans: Span[] }[] = [
  {
    mode: 'normal',
    spans: [
      { s: 0, e: 5 },
      { s: 5, e: 6 },
      { s: 6, e: 8 },
      { s: 8, e: 10 },
      { s: 10, e: 11 },
    ],
  },
  {
    mode: 'search',
    spans: [
      { s: 0, e: 5 },
      { s: 5, e: 6 },
      { s: 6, e: 11, accent: true },
    ],
  },
  {
    mode: 'split',
    spans: [
      { s: 0, e: 3, accent: true },
      { s: 3, e: 5, accent: true },
      { s: 5, e: 6 },
      { s: 6, e: 8 },
      { s: 8, e: 10 },
      { s: 10, e: 11 },
    ],
  },
]

// Boundaries present in one mode and absent in another.
const changed = [3, 8, 10]

const cx = (i: number) => X0 + CELL * i + CELL / 2
const text = (s: Span) => chars.slice(s.s, s.e).join('')

const m = computed(() =>
  isJa()
    ? {
        head: 'モードが決めるのは、どの境界を残すか',
        title:
          '「API開発と高層ビル群」を normal、search、split の 3 モードで区切った結果。search は「高層ビル群」を 1 トークンに結合し、split は「API開発」を「API」と「開発」に分けます。',
        sub: ['既定', '', ''],
        notes: ['結合規則を適用', '連続する名詞を結合', '結合規則を止める'],
        caption:
          '破線は normal と結果が異なる 3 つの境界です。search は「高層ビル群」の内側の 2 つを外し、split は「API開発」の内側に 1 つ加えます。それ以外の境界はどのモードでも同じです。',
      }
    : {
        head: 'The mode decides which boundaries survive',
        title:
          'API開発と高層ビル群 segmented in normal, search and split mode. Search merges 高層ビル群 into one token; split breaks API開発 into API and 開発.',
        sub: ['default', '', ''],
        notes: ['join rules applied', 'noun runs merged', 'join rules off'],
        caption:
          'Dashed lines mark the three boundaries that differ from normal: search removes the two inside 高層ビル群, and split adds one inside API開発. Every other boundary is the same in all three modes.',
      }
)
</script>

<template>
  <figure class="fig">
    <div class="fig-head">{{ m.head }}</div>
    <svg class="fig-svg" role="img" aria-labelledby="fig-modes-title" viewBox="0 0 960 272" xmlns="http://www.w3.org/2000/svg">
      <title id="fig-modes-title">{{ m.title }}</title>
      <!-- character ruler -->
      <text v-for="(c, i) in chars" :key="'c' + i" class="fg-xs" :x="cx(i)" y="36" text-anchor="middle">{{ c }}</text>
      <!-- boundaries that change between modes; boxes paint over them where a token spans the boundary -->
      <line v-for="b in changed" :key="'g' + b" class="fg-life fg-life--accent" :x1="X0 + CELL * b" y1="44" :x2="X0 + CELL * b" y2="248" />
      <template v-for="(r, ri) in rows" :key="r.mode">
        <text class="fg-m fg-ink" x="32" :y="ROW_Y[ri] + (m.sub[ri] ? 22 : 29)">{{ r.mode }}</text>
        <text v-if="m.sub[ri]" class="fg-xs" x="32" :y="ROW_Y[ri] + 42">{{ m.sub[ri] }}</text>
        <template v-for="s in r.spans" :key="r.mode + s.s">
          <rect
            :class="['fg-box', s.accent ? 'fg-box--accent' : '']"
            :x="X0 + CELL * s.s + 2"
            :y="ROW_Y[ri]"
            :width="CELL * (s.e - s.s) - 4"
            height="48"
            rx="8"
          />
          <text
            :class="['fg-t2', s.accent ? 'fg-accent' : '']"
            :x="X0 + (CELL * (s.s + s.e)) / 2"
            :y="ROW_Y[ri] + 29"
            text-anchor="middle"
          >{{ text(s) }}</text>
        </template>
        <text class="fg-s" x="688" :y="ROW_Y[ri] + (ri === 1 ? 22 : 29)">{{ m.notes[ri] }}</text>
      </template>
      <text class="fg-mxs" x="688" :y="ROW_Y[1] + 44">= normal + mergeCompounds</text>
    </svg>
    <figcaption class="fig-note">{{ m.caption }}</figcaption>
  </figure>
</template>
