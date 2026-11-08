<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'

const { isJa } = useI18n()

// Measured with the bundled WASM: analyze('東京で美味しいラーメンを食べた').
// Column widths fit the longer of the surface and the POS tag.
const tokens = [
  { surface: '東京', pos: 'NOUN', lemma: '東京', w: 88 },
  { surface: 'で', pos: 'PARTICLE', lemma: 'で', w: 96 },
  { surface: '美味しい', pos: 'ADJ', lemma: '美味しい', w: 104 },
  { surface: 'ラーメン', pos: 'NOUN', lemma: 'ラーメン', w: 104 },
  { surface: 'を', pos: 'PARTICLE', lemma: 'を', w: 96 },
  { surface: '食べ', pos: 'VERB', lemma: '食べる', w: 88 },
  { surface: 'た', pos: 'AUX', lemma: 'た', w: 72 },
]

const X0 = 192
const GAP = 8
const cols = tokens.map((t, i) => {
  const x = X0 + tokens.slice(0, i).reduce((sum, p) => sum + p.w + GAP, 0)
  return { ...t, x, cx: x + t.w / 2, differs: t.surface !== t.lemma }
})
const differing = cols.find((c) => c.differs)!

const m = computed(() =>
  isJa()
    ? {
        head: '表層形と原形が異なるのは「食べ」だけ',
        title:
          '「東京で美味しいラーメンを食べた」の 7 トークンを、表層形・品詞・原形の 3 段で並べた図。「食べ」の原形は「食べる」で、ほかのトークンは原形が表層形と同じです。',
        rows: ['表層形', '品詞', '原形'],
        note: '連用形',
        caption: '表層形と同じ原形は薄く表示しています。「食べ」は連用形なので原形は「食べる」になり、助動詞「た」は別のトークンとして続きます。',
      }
    : {
        head: 'Only 食べ has a lemma that differs from its surface',
        title:
          'The seven tokens of 東京で美味しいラーメンを食べた in three rows: surface, POS and lemma. 食べ has the lemma 食べる; every other token has a lemma equal to its surface.',
        rows: ['surface', 'POS', 'lemma'],
        note: 'continuative form',
        caption:
          'Lemmas that equal their surface are drawn faint. 食べ is the continuative form, so its lemma is 食べる, and the auxiliary た follows as a token of its own.',
      }
)
</script>

<template>
  <figure class="fig">
    <div class="fig-head">{{ m.head }}</div>
    <svg class="fig-svg" role="img" aria-labelledby="fig-token-anatomy-title" viewBox="0 0 960 208" xmlns="http://www.w3.org/2000/svg">
      <title id="fig-token-anatomy-title">{{ m.title }}</title>
      <text class="fg-s" x="32" y="61">{{ m.rows[0] }}</text>
      <text class="fg-s" x="32" y="112">{{ m.rows[1] }}</text>
      <text class="fg-s" x="32" y="152">{{ m.rows[2] }}</text>
      <template v-for="c in cols" :key="c.x">
        <rect :class="['fg-box', c.differs ? 'fg-box--accent' : '']" :x="c.x" y="32" :width="c.w" height="48" rx="8" />
        <text :class="['fg-t2', c.differs ? 'fg-accent' : '']" :x="c.cx" y="61" text-anchor="middle">{{ c.surface }}</text>
        <text class="fg-m" :x="c.cx" y="112" text-anchor="middle">{{ c.pos }}</text>
        <text :class="['fg-t2', c.differs ? 'fg-accent' : 'fg-faint']" :x="c.cx" y="152" text-anchor="middle">{{ c.lemma }}</text>
      </template>
      <text class="fg-xs" :x="differing.cx" y="184" text-anchor="middle">{{ m.note }}</text>
    </svg>
    <figcaption class="fig-note">{{ m.caption }}</figcaption>
  </figure>
</template>
