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
import DiagramDictionaryLayers from '@/components/DiagramDictionaryLayers.vue'
import DiagramModes from '@/components/DiagramModes.vue'
import DiagramOffsets from '@/components/DiagramOffsets.vue'
import DiagramTokenAnatomy from '@/components/DiagramTokenAnatomy.vue'
import DiagramConjExpansion from '@/components/DiagramConjExpansion.vue'
import DiagramBinaryDictFlow from '@/components/DiagramBinaryDictFlow.vue'
import DiagramFixtureLoop from '@/components/DiagramFixtureLoop.vue'
import DiagramWasmRuntime from '@/components/DiagramWasmRuntime.vue'
import DiagramScorerConfig from '@/components/DiagramScorerConfig.vue'
import DiagramGoBuild from '@/components/DiagramGoBuild.vue'
import UserDictDemo from '@/components/UserDictDemo.vue'
import Why from '@/components/Why.vue'
import Layout from './Layout.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout,
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
    app.component('DiagramDictionaryLayers', DiagramDictionaryLayers)
    app.component('DiagramModes', DiagramModes)
    app.component('DiagramOffsets', DiagramOffsets)
    app.component('DiagramTokenAnatomy', DiagramTokenAnatomy)
    app.component('DiagramConjExpansion', DiagramConjExpansion)
    app.component('DiagramBinaryDictFlow', DiagramBinaryDictFlow)
    app.component('DiagramFixtureLoop', DiagramFixtureLoop)
    app.component('DiagramWasmRuntime', DiagramWasmRuntime)
    app.component('DiagramScorerConfig', DiagramScorerConfig)
    app.component('DiagramGoBuild', DiagramGoBuild)
    app.component('UserDictDemo', UserDictDemo)
    app.component('Why', Why)
  }
} satisfies Theme
