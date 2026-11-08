<template>
  <div class="home-prose">
    <slot />
  </div>
</template>

<style scoped>
.home-prose {
  width: 100%;
  max-width: var(--home-section-max-width);
  margin: var(--home-section-gap) auto 0;
}

/* Prose keeps a reading measure; code blocks use the full section width. */
.home-prose :deep(p) {
  max-width: 46rem;
}

.home-prose :deep(.home-split) {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 2.5rem;
}

.home-prose :deep(.home-split h2) {
  margin: 0 0 0.6rem;
  padding-top: 1.25rem;
  font-size: 1.1rem;
  line-height: 1.4;
}

.home-prose :deep(.home-split p) {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
  line-height: 1.75;
}

@media (max-width: 760px) {
  .home-prose :deep(.home-split) {
    grid-template-columns: minmax(0, 1fr);
    gap: 1.5rem;
  }
}
</style>
