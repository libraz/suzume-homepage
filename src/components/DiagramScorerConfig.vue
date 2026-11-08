<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'

const { isJa } = useI18n()

// Layers top to bottom in application order; rows 1 and 2 form the env layer.
const ROW_Y = [24, 184, 296, 432]
const ROW_X = 64
const ROW_W = 480
const ROW_H = 72
const EDGE_X = 496
const NOTE_X = 584

const m = computed(() =>
  isJa()
    ? {
        head: 'スコアラーオプションは後の層が指定した項目だけを上書きする',
        title:
          'スコアラーオプションの適用順。組み込みの既定値、SUZUME_SCORER_CONFIG の JSON ファイル、SUZUME_SCORER_ 環境変数、プログラムから渡すオプションの順に適用します。環境変数の層は --skip-env-config または skipEnvConfig でまとめて無視でき、WASM ビルドには存在しません。',
        envBand: '環境変数レイヤー（ネイティブのみ）',
        rows: ['組み込みの既定値', 'JSON ファイル', 'オプション単位の環境変数', 'プログラムから渡すオプション'],
        defaults: 'コアに内蔵',
        program: '生成時に渡す JSON',
        skipBy: '両方とも次の指定で無視',
        wasm: 'WASM ビルドは読み込まない',
        wasmDetail: 'この層をビルドから除外',
        last: 'どのビルドでも最後に適用',
        apiOnly: 'API のみ。CLI に対応するフラグはない',
        caption:
          '2 つの環境変数ソースは 1 つの層として扱われます。スキップの指定は両方を無視し、WASM ビルドはどちらも読みません。プログラムから渡したオプションは常に最後に適用されるため、環境変数の値より優先されます。',
      }
    : {
        head: 'Each scorer layer overrides only the fields it sets',
        title:
          'Scorer configuration applied in order: built-in defaults, the SUZUME_SCORER_CONFIG JSON file, SUZUME_SCORER_ variables, then options passed by the program. --skip-env-config or skipEnvConfig drops the environment layer as a whole, and the WASM build does not have it.',
        envBand: 'Environment layer · native builds',
        rows: ['Built-in defaults', 'JSON file', 'Per-option variables', 'Program scorer options'],
        defaults: 'compiled into the core',
        program: 'JSON passed at creation',
        skipBy: 'Both skipped by',
        wasm: 'Never read by the WASM build',
        wasmDetail: 'the layer is compiled out',
        last: 'Applied last in every build',
        apiOnly: 'API only; the CLI has no flag for it',
        caption:
          'The two environment sources act as one layer: the skip option drops both, and the WASM build reads neither. Options the program passes are applied last everywhere, so they win over any environment value.',
      }
)

const details = computed(() => [
  { text: m.value.defaults, cls: 'fg-xs' },
  { text: 'SUZUME_SCORER_CONFIG=<path>', cls: 'fg-mxs' },
  { text: 'SUZUME_SCORER_{SECTION}_{KEY}', cls: 'fg-mxs' },
  { text: m.value.program, cls: 'fg-xs' },
])
</script>

<template>
  <figure class="fig">
    <div class="fig-head">{{ m.head }}</div>
    <svg class="fig-svg" role="img" aria-labelledby="fig-scorer-config-title" viewBox="0 0 960 528" xmlns="http://www.w3.org/2000/svg">
      <title id="fig-scorer-config-title">{{ m.title }}</title>
      <!-- environment layer band -->
      <rect class="fg-group" x="40" y="136" width="888" height="256" rx="8" />
      <text class="fg-lbl" x="64" y="164">{{ m.envBand }}</text>
      <!-- application order -->
      <path class="fg-edge" :d="`M${EDGE_X},${ROW_Y[0] + ROW_H} V${ROW_Y[1]}`" marker-end="url(#fg-a)" />
      <path class="fg-edge" :d="`M${EDGE_X},${ROW_Y[1] + ROW_H} V${ROW_Y[2]}`" marker-end="url(#fg-a)" />
      <path class="fg-edge" :d="`M${EDGE_X},${ROW_Y[2] + ROW_H} V${ROW_Y[3]}`" marker-end="url(#fg-a)" />
      <template v-for="(row, i) in m.rows" :key="i">
        <rect
          :class="i === 3 ? 'fg-box fg-box--accent' : 'fg-box'"
          :x="ROW_X"
          :y="ROW_Y[i]"
          :width="ROW_W"
          :height="ROW_H"
          rx="8"
        />
        <text :class="i === 3 ? 'fg-t fg-accent' : 'fg-t'" :x="ROW_X + 16" :y="ROW_Y[i] + 28">{{ row }}</text>
        <text :class="details[i].cls" :x="ROW_X + 16" :y="ROW_Y[i] + 52">{{ details[i].text }}</text>
      </template>
      <!-- what bypasses or lacks the environment layer -->
      <text class="fg-s" :x="NOTE_X" y="212">{{ m.skipBy }}</text>
      <text class="fg-m" :x="NOTE_X" y="236">--skip-env-config</text>
      <text class="fg-m" :x="NOTE_X" y="260">skipEnvConfig</text>
      <text class="fg-s" :x="NOTE_X" y="324">{{ m.wasm }}</text>
      <text class="fg-xs" :x="NOTE_X" y="348">{{ m.wasmDetail }}</text>
      <!-- program options -->
      <text class="fg-s" :x="NOTE_X" y="460">{{ m.last }}</text>
      <text class="fg-xs" :x="NOTE_X" y="484">{{ m.apiOnly }}</text>
    </svg>
    <figcaption class="fig-note">{{ m.caption }}</figcaption>
  </figure>
</template>
