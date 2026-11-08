<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'

const { isJa } = useI18n()

const rowTop = [64, 144, 224, 304]

// Option names stay as identifiers in both languages; only prose is localized.
const skips = ['', 'skipCoreDictionary', 'skipUserDictionary', '']

const m = computed(() =>
  isJa()
    ? {
        head: '消去されるのは呼び出し側で読み込んだ辞書だけ',
        desc: '4 つの辞書レイヤーのそれぞれに、生成時のスキップ指定と clearUserDictionaries() が効くかどうか。',
        layerCol: 'レイヤー',
        skipCol: '生成時にスキップ',
        rows: [
          { h: '組み込み辞書', sub: '助詞・助動詞・形式名詞など。ライブラリに内蔵', mono: false },
          { h: 'コア辞書', sub: '一般語彙。core.dic', mono: false },
          { h: 'バンドル済みユーザー辞書', sub: 'Suzume に同梱した補助語彙。user.dic', mono: false },
          { h: '呼び出し側で読み込んだ辞書', sub: 'loadUserDictionary · loadBinaryDictionary', mono: true },
        ],
        kept: '残る',
        removed: '削除',
        note: 'どのレイヤーの候補も同じラティスに入り、スコアリングが経路を選びます。',
        caption: '消去で変わるのは L4 の行だけです。L2 と L3 を外せるのは、インスタンスを生成するときに限られます。',
      }
    : {
        head: 'Clearing removes only what the caller loaded',
        desc: 'The four dictionary layers, and which of them the creation-time skip options and clearUserDictionaries() affect.',
        layerCol: 'Layer',
        skipCol: 'Skip at creation',
        rows: [
          { h: 'Built-in', sub: 'particles, auxiliaries, formal nouns; compiled in', mono: false },
          { h: 'Core dictionary', sub: 'general vocabulary · core.dic', mono: false },
          { h: 'Bundled user dictionary', sub: 'supplementary vocabulary · user.dic', mono: false },
          { h: 'Caller-loaded dictionaries', sub: 'loadUserDictionary · loadBinaryDictionary', mono: true },
        ],
        kept: 'kept',
        removed: 'removed',
        note: 'Every layer adds candidates to the same lattice; scoring picks the path.',
        caption: 'Only the L4 row changes on clear. L2 and L3 can be left out only when the instance is created.',
      }
)
</script>

<template>
  <figure class="fig">
    <div class="fig-head">{{ m.head }}</div>
    <svg class="fig-svg" role="img" aria-labelledby="fig-dict-layers-title" viewBox="0 0 960 440" xmlns="http://www.w3.org/2000/svg">
      <title id="fig-dict-layers-title">{{ m.desc }}</title>
      <!-- column heads -->
      <text class="fg-xs" x="32" y="40">{{ m.layerCol }}</text>
      <text class="fg-xs" x="512" y="40">{{ m.skipCol }}</text>
      <text class="fg-mxs" x="720" y="40">clearUserDictionaries()</text>
      <line class="fg-rule fg-rule--strong" x1="32" y1="56" x2="928" y2="56" />
      <!-- one row per layer -->
      <template v-for="(r, i) in m.rows" :key="i">
        <line v-if="i > 0" class="fg-rule" x1="32" :y1="rowTop[i]" x2="928" :y2="rowTop[i]" />
        <circle class="fg-badge" cx="48" :cy="rowTop[i] + 36" r="12" />
        <text class="fg-badge-t" x="48" :y="rowTop[i] + 41.5" text-anchor="middle">L{{ i + 1 }}</text>
        <text class="fg-t2" x="80" :y="rowTop[i] + 30">{{ r.h }}</text>
        <text :class="r.mono ? 'fg-mxs' : 'fg-s'" x="80" :y="rowTop[i] + 54">{{ r.sub }}</text>
        <text v-if="skips[i]" class="fg-m" x="512" :y="rowTop[i] + 41">{{ skips[i] }}</text>
        <text v-else class="fg-xs" x="512" :y="rowTop[i] + 41">—</text>
        <rect :class="i === 3 ? 'fg-pill fg-pill--accent' : 'fg-pill'" x="720" :y="rowTop[i] + 22" width="96" height="28" rx="14" />
        <text :class="i === 3 ? 'fg-xs fg-accent' : 'fg-xs'" x="768" :y="rowTop[i] + 41" text-anchor="middle">{{ i === 3 ? m.removed : m.kept }}</text>
      </template>
      <line class="fg-rule fg-rule--strong" x1="32" y1="384" x2="928" y2="384" />
      <text class="fg-note" x="32" y="416">{{ m.note }}</text>
    </svg>
    <figcaption class="fig-note">{{ m.caption }}</figcaption>
  </figure>
</template>
