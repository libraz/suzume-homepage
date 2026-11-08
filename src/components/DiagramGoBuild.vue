<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'

const { isJa } = useI18n()

// Two bands: the one-time checkout build on top, the consumer's build below.
const TOP_Y = 72
const BOTTOM_Y = 304
const BOX_H = 96

const m = computed(() =>
  isJa()
    ? {
        head: 'C++ ソースから、辞書を内蔵した Go バイナリまで',
        title:
          'go-suzume のチェックアウトで sync-upstream.sh がコアのソースを取り込み、make lib が libsuzume.a と .dic ファイルを生成します。利用側のモジュールは go mod edit -replace でこのチェックアウトを参照し、go build が cgo で静的ライブラリをリンクし、go:embed で辞書を埋め込みます。実行バイナリは起動時に辞書をキャッシュへ書き出します。',
        checkout: 'go-suzume のチェックアウト内（初回のみ）',
        program: '利用側のプログラム',
        vendor: 'コアを取り込む',
        vendorNote: '未取得なら make lib が実行',
        binary: '実行バイナリ',
        binaryA: '辞書を内蔵',
        binaryB: '外部ファイルの配布は不要',
        startup: '起動時',
        startupA: '.dic をキャッシュへ書き出す',
        startupB: 'SUZUME_DATA_DIR（未設定時）',
        caption:
          '上の段は書き込み可能なチェックアウトで一度だけ行います。利用側のモジュールが見るのは replace 指定を通した成果物だけです。辞書は実行バイナリに入って配布され、起動時に書き出されます。',
      }
    : {
        head: 'From C++ source to one self-contained Go binary',
        title:
          'In the go-suzume checkout, sync-upstream.sh vendors the core source and make lib produces libsuzume.a and the .dic files. Your module points at the checkout with go mod edit -replace; go build links the static library through cgo and embeds the dictionaries with go:embed. At startup the binary writes the dictionaries to a cache directory.',
        checkout: 'One-time build in the checkout',
        program: 'Your program',
        vendor: 'Vendor the core',
        vendorNote: 'run by make lib if absent',
        binary: 'Your binary',
        binaryA: 'dictionaries embedded',
        binaryB: 'no external files to ship',
        startup: 'At startup',
        startupA: 'writes .dic to the user cache dir',
        startupB: 'SUZUME_DATA_DIR (if unset)',
        caption:
          'The top band runs once in a writable checkout; your module sees only its outputs, through the replace directive. The dictionaries travel inside the binary and are written out at startup.',
      }
)

type Line = { text: string; cls: string }
type Node = { x: number; y: number; w: number; box: string; title: string; titleCls: string; lines: Line[] }

const nodes = computed<Node[]>(() => [
  {
    x: 56,
    y: TOP_Y,
    w: 240,
    box: 'fg-box',
    title: m.value.vendor,
    titleCls: 'fg-t',
    lines: [
      { text: 'sync-upstream.sh', cls: 'fg-m' },
      { text: m.value.vendorNote, cls: 'fg-xs' },
    ],
  },
  {
    x: 344,
    y: TOP_Y,
    w: 240,
    box: 'fg-box',
    title: 'make lib',
    titleCls: 'fg-t',
    lines: [
      { text: 'cmake → libsuzume.a', cls: 'fg-m' },
      { text: 'dict compile → .dic', cls: 'fg-m' },
    ],
  },
  {
    x: 632,
    y: TOP_Y,
    w: 272,
    box: 'fg-box fg-box--sub',
    title: 'csuzume/',
    titleCls: 'fg-t',
    lines: [
      { text: 'build/lib/libsuzume.a', cls: 'fg-m' },
      { text: 'include/ · data/*.dic', cls: 'fg-m' },
    ],
  },
  {
    x: 56,
    y: BOTTOM_Y,
    w: 256,
    box: 'fg-box',
    title: 'go build',
    titleCls: 'fg-t',
    lines: [
      { text: 'cgo → libsuzume.a', cls: 'fg-m' },
      { text: 'go:embed → .dic', cls: 'fg-m' },
    ],
  },
  {
    x: 360,
    y: BOTTOM_Y,
    w: 224,
    box: 'fg-box fg-box--accent',
    title: m.value.binary,
    titleCls: 'fg-t fg-accent',
    lines: [
      { text: m.value.binaryA, cls: 'fg-xs' },
      { text: m.value.binaryB, cls: 'fg-xs' },
    ],
  },
  {
    x: 632,
    y: BOTTOM_Y,
    w: 272,
    box: 'fg-box',
    title: m.value.startup,
    titleCls: 'fg-t',
    lines: [
      { text: m.value.startupA, cls: 'fg-xs' },
      { text: m.value.startupB, cls: 'fg-mxs' },
    ],
  },
])
</script>

<template>
  <figure class="fig">
    <div class="fig-head">{{ m.head }}</div>
    <svg class="fig-svg" role="img" aria-labelledby="fig-go-build-title" viewBox="0 0 960 448" xmlns="http://www.w3.org/2000/svg">
      <title id="fig-go-build-title">{{ m.title }}</title>
      <!-- bands -->
      <rect class="fg-group" x="32" y="24" width="896" height="168" rx="8" />
      <text class="fg-lbl" x="56" y="52">{{ m.checkout }}</text>
      <rect class="fg-group" x="32" y="256" width="896" height="168" rx="8" />
      <text class="fg-lbl" x="56" y="284">{{ m.program }}</text>
      <!-- edges -->
      <path class="fg-edge" :d="`M296,${TOP_Y + 48} H344`" marker-end="url(#fg-a)" />
      <path class="fg-edge" :d="`M584,${TOP_Y + 48} H632`" marker-end="url(#fg-a)" />
      <path class="fg-edge" :d="`M768,${TOP_Y + BOX_H} V232 H256 V${BOTTOM_Y}`" marker-end="url(#fg-a)" />
      <text class="fg-edge-lbl" x="512" y="222" text-anchor="middle">go mod edit -replace</text>
      <path class="fg-edge" :d="`M312,${BOTTOM_Y + 48} H360`" marker-end="url(#fg-a)" />
      <path class="fg-edge" :d="`M584,${BOTTOM_Y + 48} H632`" marker-end="url(#fg-a)" />
      <!-- nodes -->
      <template v-for="n in nodes" :key="n.title">
        <rect :class="n.box" :x="n.x" :y="n.y" :width="n.w" :height="BOX_H" rx="8" />
        <text :class="n.titleCls" :x="n.x + 16" :y="n.y + 28">{{ n.title }}</text>
        <text v-for="(l, i) in n.lines" :key="i" :class="l.cls" :x="n.x + 16" :y="n.y + 52 + 24 * i">{{ l.text }}</text>
      </template>
    </svg>
    <figcaption class="fig-note">{{ m.caption }}</figcaption>
  </figure>
</template>
