<script setup lang="ts">
import { useI18n } from '@/composables/useI18n'

const { isJa } = useI18n()
</script>

<template>
  <aside class="why-note">
    <span class="why-label">
      <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
        <path
          d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2h5c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      {{ isJa() ? '理由' : 'Why' }}
    </span>
    <div class="why-body">
      <slot />
    </div>
  </aside>
</template>
