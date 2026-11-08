<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'

const { isJa } = useI18n()

// Wrapper and handle rows share a y so every pointer edge is horizontal.
const ROW_Y = [120, 224, 408]
const WRAP_X = 56
const HANDLE_X = 456
const BOX_W = 176
const HANDLE_W = 208
const BOX_H = 72

const mid = (y: number) => y + BOX_H / 2

const m = computed(() =>
  isJa()
    ? {
        head: '1 つのランタイムを複数のハンドルが共有する',
        title:
          'JS ヒープ上の Suzume オブジェクト 3 つと、WASM 線形メモリ上のハンドル。A と B は共有ランタイムを使い、C は freshWasmModule で独立したランタイムを持ちます。A は GC 後に FinalizationRegistry が、B は destroy() が即座に解放します。メモリ不足で停止すると共有ランタイム上のハンドルがすべて使えなくなります。',
        heap: 'JS ヒープ',
        heapNote: 'GC が追跡する範囲',
        linear: 'WASM 線形メモリ',
        shared: '共有ランタイム',
        sharedNote: 'wasmPath ごとにキャッシュ',
        fresh: '独立したランタイム',
        handle: 'ハンドル',
        native: 'ネイティブ状態と設定',
        freed: '解放済み',
        afterGc: 'GC の後',
        now: '即座に解放',
        abort: 'メモリ不足で停止',
        abortA: 'このランタイムの',
        abortB: '全ハンドルが使えなくなる',
        ownMemory: '専用の線形メモリ',
        unaffected: 'その停止の影響を受けない',
        caption:
          '線形メモリはランタイム単位なので、destroy() は 1 つのハンドルだけを解放し、メモリ不足による停止は同じランタイムのハンドルすべてに及びます。GC が見るのは JS 側のオブジェクトだけです。destroy() を呼ばないと、ネイティブ状態は GC の回収を待ち続けます。',
      }
    : {
        head: 'One cached runtime, many handles',
        title:
          'Three Suzume objects on the JS heap and their handles in WASM linear memory. A and B use the shared runtime; C has its own through freshWasmModule. A is freed by FinalizationRegistry after GC, B immediately by destroy(). An out-of-memory abort ends every handle on the shared runtime.',
        heap: 'JS heap',
        heapNote: 'What the GC tracks',
        linear: 'WASM linear memory',
        shared: 'Shared runtime',
        sharedNote: 'cached per wasmPath',
        fresh: 'Isolated runtime',
        handle: 'handle',
        native: 'native state + options',
        freed: 'freed',
        afterGc: 'after GC',
        now: 'freed immediately',
        abort: 'Out-of-memory abort',
        abortA: 'stops every handle',
        abortB: 'on this runtime',
        ownMemory: 'Separate linear memory',
        unaffected: 'Not affected by that abort',
        caption:
          'Linear memory belongs to the runtime, so destroy() frees one handle while an abort ends them all. The GC sees only the JS objects; without destroy(), the native state waits for a collection that WASM memory use does not prompt.',
      }
)

const wrappers = computed(() => [
  { name: 'Suzume A', detail: 'create()' },
  { name: 'Suzume B', detail: 'create()' },
  { name: 'Suzume C', detail: 'freshWasmModule' },
])

const handles = computed(() => [
  { name: `${m.value.handle} A`, detail: m.value.native, freed: false },
  { name: `${m.value.handle} B`, detail: m.value.freed, freed: true },
  { name: `${m.value.handle} C`, detail: m.value.native, freed: false },
])
</script>

<template>
  <figure class="fig">
    <div class="fig-head">{{ m.head }}</div>
    <svg class="fig-svg" role="img" aria-labelledby="fig-wasm-runtime-title" viewBox="0 0 960 528" xmlns="http://www.w3.org/2000/svg">
      <title id="fig-wasm-runtime-title">{{ m.title }}</title>
      <!-- JS heap band -->
      <rect class="fg-group" x="32" y="24" width="224" height="480" rx="8" />
      <text class="fg-lbl" x="56" y="52">{{ m.heap }}</text>
      <text class="fg-xs" x="56" y="76">{{ m.heapNote }}</text>
      <!-- WASM side -->
      <text class="fg-lbl" x="432" y="52">{{ m.linear }}</text>
      <rect class="fg-frame" x="432" y="72" width="496" height="248" rx="8" />
      <text class="fg-lbl" x="456" y="100">{{ m.shared }}</text>
      <text class="fg-xs" x="904" y="100" text-anchor="end">{{ m.sharedNote }}</text>
      <rect class="fg-frame" x="432" y="360" width="496" height="144" rx="8" />
      <text class="fg-lbl" x="456" y="388">{{ m.fresh }}</text>
      <!-- wrappers and handles -->
      <template v-for="(w, i) in wrappers" :key="w.name">
        <rect class="fg-box" :x="WRAP_X" :y="ROW_Y[i]" :width="BOX_W" :height="BOX_H" rx="8" />
        <text class="fg-t" :x="WRAP_X + 16" :y="ROW_Y[i] + 28">{{ w.name }}</text>
        <text class="fg-mxs" :x="WRAP_X + 16" :y="ROW_Y[i] + 52">{{ w.detail }}</text>
        <rect
          :class="handles[i].freed ? 'fg-box fg-box--ext' : 'fg-box'"
          :x="HANDLE_X"
          :y="ROW_Y[i]"
          :width="HANDLE_W"
          :height="BOX_H"
          rx="8"
        />
        <text :class="handles[i].freed ? 'fg-t fg-dim' : 'fg-t'" :x="HANDLE_X + 16" :y="ROW_Y[i] + 28">{{ handles[i].name }}</text>
        <text class="fg-xs" :x="HANDLE_X + 16" :y="ROW_Y[i] + 52">{{ handles[i].detail }}</text>
      </template>
      <!-- A: released only after a collection -->
      <path class="fg-edge fg-edge--muted" :d="`M232,${mid(ROW_Y[0])} H456`" marker-end="url(#fg-am)" />
      <text class="fg-m" x="344" :y="mid(ROW_Y[0]) - 34" text-anchor="middle">FinalizationRegistry</text>
      <text class="fg-xs" x="344" :y="mid(ROW_Y[0]) - 12" text-anchor="middle">{{ m.afterGc }}</text>
      <!-- B: released by destroy() -->
      <path class="fg-edge fg-edge--accent" :d="`M232,${mid(ROW_Y[1])} H456`" marker-end="url(#fg-ac)" />
      <text class="fg-m fg-accent" x="344" :y="mid(ROW_Y[1]) - 34" text-anchor="middle">destroy()</text>
      <text class="fg-xs" x="344" :y="mid(ROW_Y[1]) - 12" text-anchor="middle">{{ m.now }}</text>
      <!-- C: its own runtime -->
      <path class="fg-edge" :d="`M232,${mid(ROW_Y[2])} H456`" marker-end="url(#fg-a)" />
      <!-- abort scope: the whole shared runtime -->
      <rect class="fg-box fg-box--sub" x="696" y="120" width="208" height="176" rx="8" />
      <text class="fg-t" x="712" y="148">{{ m.abort }}</text>
      <text class="fg-xs" x="712" y="172">{{ m.abortA }}</text>
      <text class="fg-xs" x="712" y="196">{{ m.abortB }}</text>
      <text class="fg-s" x="696" y="436">{{ m.ownMemory }}</text>
      <text class="fg-xs" x="696" y="460">{{ m.unaffected }}</text>
    </svg>
    <figcaption class="fig-note">{{ m.caption }}</figcaption>
  </figure>
</template>
