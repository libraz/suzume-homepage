<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()

// Line icons (stroke = currentColor) keep the grid calm and on-brand; emoji
// would read as decoration rather than a considered visual system.
// Only what the install strip above does not already state: size, runtimes
// and licence live there, so the grid keeps the three behavioural points.
const icons: Record<string, string> = {
  client: '<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 9h18"/><path d="M8 21h8"/>',
  unknown: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10z"/><path d="M19 15v4"/><path d="M17 17h4"/>',
  userDict: '<path d="M4 19.5V5a2 2 0 0 1 2-2h13v14H6a2 2 0 0 0-2 2.5z"/><path d="M6 21h13v-4"/><path d="M12 7v6"/><path d="M9 10h6"/>',
}

const items = computed(() => [
  { key: 'client', desc: t('features.items.client.desc') },
  { key: 'unknown', desc: t('features.items.unknown.desc') },
  { key: 'userDict', desc: t('features.items.userDict.desc') },
])
</script>

<template>
  <section class="home-section features">
    <div class="home-section-head">
      <span class="home-eyebrow">{{ t('features.eyebrow') }}</span>
      <h2 class="home-heading">{{ t('features.heading') }}</h2>
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
/* An open grid separated by hairlines rather than six floating cards; the
   icon sits beside the title so each item stays short. */
.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0 2.5rem;
}

.feature-card {
  display: grid;
  grid-template-columns: 2rem minmax(0, 1fr);
  grid-template-areas:
    'icon title'
    'icon desc';
  column-gap: 0.85rem;
  align-content: start;
  padding: 1.1rem 0 1.25rem;
  border-top: 1px solid var(--vp-c-divider);
}

.feature-icon {
  grid-area: icon;
  display: inline-grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border: 1px solid color-mix(in srgb, var(--vp-c-brand-1) 28%, transparent);
  border-radius: var(--sz-radius-control);
  background: color-mix(in srgb, var(--vp-c-brand-1) 10%, var(--vp-c-bg));
  color: var(--vp-c-brand-1);
}

.feature-icon svg {
  width: 1.05rem;
  height: 1.05rem;
}

.vp-doc .feature-card h3 {
  grid-area: title;
  margin: 0.2rem 0 0.3rem;
  color: var(--vp-c-text-1);
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: -0.005em;
}

.vp-doc .feature-card p {
  grid-area: desc;
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 0.85rem;
  line-height: 1.65;
}

@media (max-width: 900px) {
  .feature-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .feature-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
