<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'
import type { Morpheme } from '@/wasm/index.js'
import { posCategory, tokenOrigin, tokenOriginLabel } from './tokenOrigin'

const props = withDefaults(defineProps<{ morpheme: Morpheme; showOrigin?: boolean }>(), {
  showOrigin: true,
})

const { isJa } = useI18n()

const origin = computed(() => tokenOrigin(props.morpheme))

const title = computed(() => {
  const m = props.morpheme
  return `${m.surface}\n${m.posJa} / ${m.pos}\n${m.extendedPos}\n${tokenOriginLabel(origin.value, isJa())}`
})
</script>

<template>
  <span class="sz-token" :data-pos="posCategory(morpheme.pos)" :title="title">
    <span class="sz-token__surface">{{ morpheme.surface }}</span>
    <span class="sz-token__rule"></span>
    <span class="sz-token__chip">
      <span v-if="showOrigin" class="sz-origin" :data-origin="origin" aria-hidden="true"></span>
      <span class="sz-token__pos">{{ isJa() ? morpheme.posJa : morpheme.pos.toLowerCase() }}</span>
      <span v-if="morpheme.baseForm && morpheme.baseForm !== morpheme.surface" class="sz-token__base"
        >→{{ morpheme.baseForm }}</span
      >
    </span>
  </span>
</template>
