<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import FigureDefs from '@/components/FigureDefs.vue'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #layout-top>
      <FigureDefs />
    </template>
  </Layout>
</template>
