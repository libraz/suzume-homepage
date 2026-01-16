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
    // Fallback
    gzipKB.value = 211
    sizeKB.value = 578
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
  gap: 1.25rem;
  margin: 1.5rem 0;
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, var(--vp-c-brand-soft) 0%, transparent 100%);
  border: 1px solid color-mix(in srgb, var(--vp-c-brand-1) 20%, transparent);
  border-radius: 12px;
}

.stat-card {
  text-align: center;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--vp-c-brand-1);
  line-height: 1;
  font-family: monospace;
}

.stat-unit {
  font-size: 1.25rem;
  font-weight: 600;
  margin-left: 0.125rem;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
  margin-top: 0.25rem;
  font-weight: 500;
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
