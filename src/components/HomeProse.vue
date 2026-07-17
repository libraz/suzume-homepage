<template>
  <div class="home-prose">
    <slot />
  </div>
</template>

<style scoped>
.home-prose {
  width: 100%;
  max-width: var(--home-section-max-width);
  margin: 4rem auto 0;
}

@media (max-width: 640px) {
  .home-prose {
    margin-top: 3rem;
  }
}
</style>
