<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { WASM_GZIP_SIZE } from '@/wasm/metadata'

const { t } = useI18n()

// Line icons (stroke = currentColor) keep the grid calm and on-brand; emoji
// would read as decoration rather than a considered visual system.
const icons: Record<string, string> = {
  size: '<path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><path d="M16 8 2 22"/><path d="M17.5 15H9"/>',
  client: '<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 9h18"/><path d="M8 21h8"/>',
  privacy: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  unknown: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10z"/><path d="M19 15v4"/><path d="M17 17h4"/>',
  realtime: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  typed: '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/><path d="m14.5 4-5 16"/>',
}

const items = computed(() => [
  { key: 'size', desc: t('features.items.size.desc', { size: WASM_GZIP_SIZE }) },
  { key: 'client', desc: t('features.items.client.desc') },
  { key: 'privacy', desc: t('features.items.privacy.desc') },
  { key: 'unknown', desc: t('features.items.unknown.desc') },
  { key: 'realtime', desc: t('features.items.realtime.desc') },
  { key: 'typed', desc: t('features.items.typed.desc') },
])
</script>

<template>
  <section class="home-section features">
    <div class="home-section-head">
      <span class="home-eyebrow">{{ t('features.eyebrow') }}</span>
      <h2 class="home-heading">{{ t('features.heading') }}</h2>
      <p class="home-subheading">{{ t('features.subheading') }}</p>
    </div>

    <div class="feature-grid">
      <article v-for="item in items" :key="item.key" class="feature-card">
        <span class="feature-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
            stroke-linecap="round" stroke-linejoin="round" v-html="icons[item.key]" />
        </span>
        <h3>{{ t(`features.items.${item.key}.title`) }}</h3>
        <p>{{ item.desc }}</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.feature-card {
  padding: 1.5rem 1.4rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 14px;
  background: var(--vp-c-bg-soft);
  transition: border-color 0.25s ease, transform 0.2s ease, box-shadow 0.25s ease;
}

.feature-card:hover {
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 42%, var(--vp-c-border));
  transform: translateY(-3px);
  box-shadow: 0 8px 24px -12px color-mix(in srgb, var(--vp-c-brand-1) 45%, transparent);
}

.feature-icon {
  display: inline-grid;
  place-items: center;
  width: 2.6rem;
  height: 2.6rem;
  margin-bottom: 1rem;
  border: 1px solid color-mix(in srgb, var(--vp-c-brand-1) 18%, transparent);
  border-radius: 11px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.feature-icon svg {
  width: 1.35rem;
  height: 1.35rem;
}

.feature-card h3 {
  margin: 0 0 0.4rem;
  color: var(--vp-c-text-1);
  font-size: 1.02rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.feature-card p {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 0.86rem;
  line-height: 1.6;
}

@media (max-width: 900px) {
  .feature-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 560px) {
  .feature-grid {
    grid-template-columns: 1fr;
  }

  .feature-card {
    padding: 1.25rem 1.2rem;
  }
}
</style>
