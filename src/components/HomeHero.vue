<script setup lang="ts">
import { useI18n } from '@/composables/useI18n'
import { SUZUME_VERSION, WASM_COMMIT_HASH, WASM_GZIP_KB, WASM_SIZE_KB } from '@/wasm/metadata'

const { t } = useI18n()

const buildLink = `https://github.com/libraz/suzume/commit/${WASM_COMMIT_HASH}`
const runtimes = 'Browser · Node · Deno · Bun · Python · C/C++'
</script>

<template>
  <section class="home-spec" :aria-label="t('homeHero.ariaLabel')">
    <div class="spec-top">
      <a class="version-pill" :href="buildLink" target="_blank" rel="noopener">
        <span class="version-dot" aria-hidden="true"></span>
        <span class="version-num">v{{ SUZUME_VERSION }}</span>
        <span class="version-beta">{{ t('homeHero.beta') }}</span>
        <span class="version-ext" aria-hidden="true">↗</span>
      </a>
      <span class="spec-license">Apache-2.0 · {{ t('homeHero.openSource') }}</span>
    </div>

    <div class="spec-stats">
      <div class="stat">
        <div class="stat-value">{{ WASM_GZIP_KB }}<span class="stat-unit">KB</span></div>
        <div class="stat-label">{{ t('homeHero.gzipLabel') }}</div>
        <div class="stat-note">{{ t('homeHero.rawNote', { n: String(WASM_SIZE_KB) }) }}</div>
      </div>
      <div class="stat-divider" aria-hidden="true"></div>
      <div class="stat">
        <div class="stat-value">100<span class="stat-unit">%</span></div>
        <div class="stat-label">{{ t('homeHero.clientLabel') }}</div>
        <div class="stat-note">{{ t('homeHero.clientNote') }}</div>
      </div>
      <div class="stat-divider" aria-hidden="true"></div>
      <div class="stat">
        <div class="stat-value">6</div>
        <div class="stat-label">{{ t('homeHero.runtimesLabel') }}</div>
        <div class="stat-note runtimes">{{ runtimes }}</div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.home-spec {
  width: 100%;
  max-width: var(--home-section-max-width);
  margin: 1.5rem auto 0;
  padding: 1.35rem 1.75rem 1.5rem;
  border: 1px solid color-mix(in srgb, var(--vp-c-brand-1) 22%, var(--vp-c-border));
  border-radius: 16px;
  background:
    radial-gradient(120% 140% at 100% 0, var(--vp-c-brand-soft), transparent 55%),
    var(--vp-c-bg-soft);
}

.spec-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 1.15rem;
  margin-bottom: 1.15rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.version-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.7rem 0.3rem 0.6rem;
  border: 1px solid color-mix(in srgb, var(--vp-c-brand-1) 26%, transparent);
  border-radius: 999px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  text-decoration: none !important;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.version-pill:hover {
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 55%, transparent);
}

.version-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 0 3px color-mix(in srgb, #10b981 18%, transparent);
}

.version-num {
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.version-beta {
  padding: 0.05rem 0.4rem;
  border-radius: 999px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.version-ext {
  color: var(--vp-c-text-3);
  font-size: 0.7rem;
}

.spec-license {
  color: var(--vp-c-text-3);
  font-size: 0.78rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  text-align: right;
}

.spec-stats {
  display: flex;
  align-items: stretch;
  gap: 1.5rem;
}

.stat {
  flex: 1 1 0;
  min-width: 0;
}

.stat-value {
  display: flex;
  align-items: baseline;
  color: var(--vp-c-brand-1);
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;
  font-size: 2.3rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.03em;
  font-feature-settings: 'tnum' 1;
}

.stat-unit {
  margin-left: 0.12rem;
  color: var(--vp-c-text-2);
  font-size: 1rem;
  font-weight: 600;
}

.stat-label {
  margin-top: 0.5rem;
  color: var(--vp-c-text-1);
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.stat-note {
  margin-top: 0.15rem;
  color: var(--vp-c-text-3);
  font-size: 0.74rem;
  line-height: 1.45;
}

.stat-note.runtimes {
  font-variant-numeric: normal;
}

.stat-divider {
  width: 1px;
  align-self: stretch;
  background: var(--vp-c-divider);
}

@media (max-width: 640px) {
  .home-spec {
    padding: 1.15rem 1.15rem 1.25rem;
    border-radius: 14px;
  }

  .spec-top {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.6rem;
    padding-bottom: 1rem;
    margin-bottom: 1rem;
  }

  .spec-license {
    text-align: left;
  }

  .spec-stats {
    flex-wrap: wrap;
    gap: 1rem 1.25rem;
  }

  .stat {
    flex: 1 1 40%;
  }

  .stat-value {
    font-size: 1.85rem;
  }

  .stat-divider {
    display: none;
  }

  .stat-note.runtimes {
    font-size: 0.7rem;
  }
}
</style>
