import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import HomeHero from '@/components/HomeHero.vue'
import HomeFeatures from '@/components/HomeFeatures.vue'
import ComparisonTable from '@/components/ComparisonTable.vue'
import UseCaseDemo from '@/components/UseCaseDemo.vue'
import TypewriterDemo from '@/components/TypewriterDemo.vue'
import TokenizerPlayground from '@/components/TokenizerPlayground.vue'
import TokenDiff from '@/components/TokenDiff.vue'
import HomeProse from '@/components/HomeProse.vue'
import WasmSize from '@/components/WasmSize.vue'
import DiagramPillars from '@/components/DiagramPillars.vue'
import DiagramPattern from '@/components/DiagramPattern.vue'
import DiagramScoring from '@/components/DiagramScoring.vue'
import DiagramPipeline from '@/components/DiagramPipeline.vue'
import Why from '@/components/Why.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('HomeHero', HomeHero)
    app.component('HomeFeatures', HomeFeatures)
    app.component('ComparisonTable', ComparisonTable)
    app.component('UseCaseDemo', UseCaseDemo)
    app.component('TypewriterDemo', TypewriterDemo)
    app.component('TokenizerPlayground', TokenizerPlayground)
    app.component('TokenDiff', TokenDiff)
    app.component('HomeProse', HomeProse)
    app.component('WasmSize', WasmSize)
    app.component('DiagramPillars', DiagramPillars)
    app.component('DiagramPattern', DiagramPattern)
    app.component('DiagramScoring', DiagramScoring)
    app.component('DiagramPipeline', DiagramPipeline)
    app.component('Why', Why)
  }
} satisfies Theme
