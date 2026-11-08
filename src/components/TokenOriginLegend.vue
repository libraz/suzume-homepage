<script setup lang="ts">
import { useI18n } from '@/composables/useI18n'
import { tokenOriginLabel, tokenOrigins } from './tokenOrigin'

const { isJa } = useI18n()
</script>

<template>
  <ul class="origin-legend">
    <li v-for="origin in tokenOrigins" :key="origin">
      <span class="sz-origin" :data-origin="origin" aria-hidden="true"></span>
      {{ tokenOriginLabel(origin, isJa()) }}
    </li>
  </ul>
</template>

<style scoped>
.origin-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 1.1rem;
  margin: 0.85rem 0 0;
  padding: 0;
  list-style: none;
  color: var(--vp-c-text-3);
  font-size: 0.72rem;
}

.origin-legend li {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0;
}

.origin-legend .sz-origin {
  width: 7px;
  height: 7px;
}
</style>
