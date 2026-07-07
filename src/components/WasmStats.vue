<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()

const gzipKB = ref(0)
const sizeKB = ref(0)

onMounted(async () => {
  try {
    const meta = await import('@/wasm/meta.json')
    gzipKB.value = meta.gzipKB
    sizeKB.value = meta.sizeKB
  } catch {
    // Fallback (keep in sync with src/wasm/meta.json)
    gzipKB.value = 435
    sizeKB.value = 1121
  }
})
</script>

<template>
  <div class="wasm-stats" v-if="gzipKB > 0">
    <div class="stat-card">
      <div class="stat-value">{{ gzipKB }}<span class="stat-unit">KB</span></div>
      <div class="stat-label">{{ t('wasmStats.gzipped') }}</div>
    </div>
    <div class="stat-divider"></div>
    <div class="stat-card">
      <div class="stat-value">{{ sizeKB }}<span class="stat-unit">KB</span></div>
      <div class="stat-label">{{ t('wasmStats.raw') }}</div>
    </div>
  </div>
</template>

<style scoped>
.wasm-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  width: fit-content;
  margin: 1.75rem auto;
  padding: 1.125rem 2.25rem;
  background: var(--vp-c-bg-soft);
  border: 1px solid color-mix(in srgb, var(--vp-c-brand-1) 22%, var(--vp-c-border));
  border-radius: 14px;
}

.stat-card {
  text-align: center;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--vp-c-brand-1);
  line-height: 1;
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;
  font-feature-settings: 'tnum' 1;
  letter-spacing: -0.02em;
}

.stat-unit {
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
  margin-left: 0.15rem;
}

.stat-label {
  font-size: 0.6875rem;
  color: var(--vp-c-text-3);
  margin-top: 0.4rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.stat-divider {
  width: 1px;
  height: 48px;
  background: var(--vp-c-divider);
}

@media (max-width: 640px) {
  .wasm-stats {
    gap: 1rem;
    padding: 0.75rem 1.25rem;
    margin-left: auto;
    margin-right: auto;
  }

  .stat-value {
    font-size: 1.75rem;
  }

  .stat-unit {
    font-size: 0.9rem;
  }

  .stat-label {
    font-size: 0.7rem;
  }

  .stat-divider {
    height: 36px;
  }
}
</style>
